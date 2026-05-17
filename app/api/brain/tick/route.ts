import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { loadVision, loadWorkstreams } from "@/lib/brain/vision";
import { dispatchOrderToElon, notifyWayneForApproval } from "@/lib/brain/elon";
import { nextWorkstream } from "@/lib/brain/rotation";
import { createBrainQuestion, recentAnsweredQuestions } from "@/lib/brain/questions";
import { getCurrentBrainModel, DEFAULT_BRAIN_MODEL } from "@/lib/brain/model-settings";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
// Brain model removed as constant in B74 — now read dynamically via
// getCurrentBrainModel() with 5s cache and a default-model fallback.
const BRAIN_USE_TOOLS = process.env.BRAIN_USE_TOOLS === "true";
const BRAIN_BASE_URL = process.env.BRAIN_BASE_URL ?? "https://espresso.insure";
const MAX_TOOL_CALLS_PER_TICK = 10;

// Tool definitions for tool-use mode. Brain calls these via the /api/brain/repo/* endpoints.
const BRAIN_TOOLS = [
  {
    name: "list_dir",
    description: "List the contents of a directory in the espresso-insure-mvp repo on the main branch. Returns array of {name, type, path, size}. Use this to discover what files exist before reading them.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Repo-relative directory path (e.g. 'app/dashboard'). Empty string lists the repo root.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "read_file",
    description: "Read the full contents of a file in the espresso-insure-mvp repo on the main branch. Returns {content, size, sha}. Files larger than 50KB are rejected.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Repo-relative file path (e.g. 'app/dashboard/claims/page.tsx').",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "grep_repo",
    description: "Search the repo for a code pattern. Returns up to 20 matches with paths. Use this to find where a function/import/symbol is used before deciding what files to read.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The code pattern to search for (e.g. 'verifySession', 'logAgentInvocation').",
        },
        path: {
          type: "string",
          description: "Optional path filter (e.g. 'app/api'). Empty string searches the whole repo.",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "get_table_schema",
    description: "Get the column names of a Supabase public table. Use this BEFORE writing any .from('table').select('cols') query against a table you have not yet inspected this tick. Hallucinated column names break in production. Returns columns with their inferred types from a sample row. Empty tables return note=true and you must check migration files instead.",
    input_schema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "Name of the public table to inspect (e.g. 'work_orders', 'execution_log', 'brain_directives'). Must match /^[a-zA-Z_][a-zA-Z0-9_]*$/.",
        },
      },
      required: ["table"],
    },
  },
  {
    name: "propose_work",
    description: "Emit your final decision. Call this tool EXACTLY ONCE when you are done exploring the codebase. Do not call list_dir/read_file/grep_repo after calling this. Do not narrate before or after calling this. Choose decision_type: 'orders' to propose 1-3 work orders, 'question' to ask Wayne for clarification, or 'no_action' to skip this tick.",
    input_schema: {
      type: "object",
      properties: {
        decision_type: {
          type: "string",
          enum: ["orders", "question", "no_action"],
          description: "What kind of decision you are making.",
        },
        orders: {
          type: "array",
          description: "Required when decision_type='orders'. 1-3 work orders.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              intent: { type: "string" },
              rationale: { type: "string" },
              workstream: { type: "string" },
              files_to_change: { type: "array", items: { type: "string" } },
              risk_level: { type: "string", enum: ["low", "medium", "high"] },
              category: {
                type: "string",
                enum: ["copy", "observability", "security_observability", "feature", "security", "bug", "infra", "data"],
              },
              spec: {
                type: "object",
                description: "Either provide structured operations (preferred) OR steps (legacy English instructions). Always provide verification.",
                properties: {
                  operations: {
                    type: "array",
                    description: "List of mechanical operations Elon will execute verbatim. Preferred over steps. Each operation must be unambiguous: literal content for writes, exact strings for patches, exact commands for bash. Files must use real paths verified via list_dir or read_file.",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["write_file", "patch_file", "bash", "delete_file"],
                          description: "Operation kind.",
                        },
                        path: {
                          type: "string",
                          description: "Repo-relative path. Required for write_file, patch_file, delete_file.",
                        },
                        content: {
                          type: "string",
                          description: "Full file content. Required for write_file.",
                        },
                        find: {
                          type: "string",
                          description: "Exact existing string to find. Required for patch_file. Must appear exactly once in the file.",
                        },
                        replace: {
                          type: "string",
                          description: "Replacement string. Required for patch_file.",
                        },
                        command: {
                          type: "string",
                          description: "Shell command. Required for bash. Run from repo root.",
                        },
                      },
                      required: ["type"],
                    },
                  },
                  steps: {
                    type: "array",
                    description: "Legacy English-language steps. Use only if operations cannot express the work. Prefer operations when possible.",
                    items: { type: "string" },
                  },
                  verification: {
                    type: "string",
                    description: "How Verifier should confirm the work landed correctly.",
                  },
                },
                required: ["verification"],
              },
            },
            required: ["title", "intent", "risk_level", "category"],
          },
        },
        question: {
          type: "object",
          description: "Required when decision_type='question'.",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            context: { type: "string" },
          },
          required: ["question", "options"],
        },
      },
      required: ["decision_type"],
    },
  },
];

// Execute a tool call by hitting the /api/brain/repo/* endpoint.
async function executeBrainTool(name: string, input: any): Promise<string> {
  const cron = process.env.CRON_SECRET ?? "";
  if (!cron) return JSON.stringify({ ok: false, error: "CRON_SECRET not configured" });

  const headers = { Authorization: `Bearer ${cron}` };
  let url: string;
  if (name === "list_dir") {
    url = `${BRAIN_BASE_URL}/api/brain/repo/list?path=${encodeURIComponent(input?.path ?? "")}`;
  } else if (name === "read_file") {
    url = `${BRAIN_BASE_URL}/api/brain/repo/read?path=${encodeURIComponent(input?.path ?? "")}`;
  } else if (name === "grep_repo") {
    url = `${BRAIN_BASE_URL}/api/brain/repo/grep?pattern=${encodeURIComponent(input?.pattern ?? "")}&path=${encodeURIComponent(input?.path ?? "")}`;
  } else if (name === "get_table_schema") {
    url = `${BRAIN_BASE_URL}/api/brain/repo/schema?table=${encodeURIComponent(input?.table ?? "")}`;
  } else {
    return JSON.stringify({ ok: false, error: `unknown tool: ${name}` });
  }

  try {
    const res = await fetch(url, { headers });
    const body = await res.text();
    // Truncate very large responses to keep the model context manageable
    return body.length > 30000 ? body.slice(0, 30000) + "...(truncated)" : body;
  } catch (err: any) {
    return JSON.stringify({ ok: false, error: err?.message ?? "tool fetch failed" });
  }
}


// Auto-approve lane: low risk + observability-only categories.
const AUTO_APPROVE_CATEGORIES = new Set(["copy", "observability", "security_observability"]);

// Patterns that block auto-approval and force manual review.
// Belt-and-braces check on top of the system prompt's FA-only instruction.
// B-cleanup arc 2026-05-09 caught a "Trusted by Singapore IFAs" auto-shipment;
// this filter ensures any future regression goes to manual review instead of
// shipping silently.
const FORBIDDEN_TERMINOLOGY_PATTERNS: RegExp[] = [
  /\bIFA\b/,                            // standalone IFA
  /\bIFAs\b/,                           // plural
  /Independent Financial Advisor/i,      // any case
];

function containsForbiddenTerminology(order: any): { blocked: boolean; matchedPattern?: string } {
  const haystack = [
    order.title ?? "",
    order.intent ?? "",
    order.rationale ?? "",
    order.spec ? JSON.stringify(order.spec) : "",
  ].join("\n");
  for (const pattern of FORBIDDEN_TERMINOLOGY_PATTERNS) {
    if (pattern.test(haystack)) {
      return { blocked: true, matchedPattern: pattern.source };
    }
  }
  return { blocked: false };
}

// B-pe-20-gate: marketing-page surfaces that must not be auto-approved.
// Brain has historically duplicated sections on these pages (e.g. 2026-05-10
// duplicate <Pricing> on app/page.tsx). File-path match is more robust than
// title regex because Brain declares files_to_change explicitly in propose_work.
const MARKETING_PATH_PATTERNS: RegExp[] = [
  /^app\/page\.tsx$/,
  /^app\/\(marketing\)\//,
];

function containsMarketingPathChange(order: any): { blocked: boolean; matchedPath?: string } {
  const paths = Array.isArray(order?.files_to_change) ? order.files_to_change : [];
  for (const p of paths) {
    if (typeof p !== "string") continue;
    for (const pattern of MARKETING_PATH_PATTERNS) {
      if (pattern.test(p)) return { blocked: true, matchedPath: p };
    }
  }
  return { blocked: false };
}

type ActiveDirective = { title: string; description: string | null; workstream: string; expires_at: string };

function buildSystemPrompt(
  visionText: string,
  workstreamsText: string,
  activeWorkstream: string,
  directive: ActiveDirective | null,
): string {
  return `You are the Brain agent for Espresso (espresso.insure), an AI back-office platform for Financial Advisers (FAs) in Singapore.

You are the sole decision-maker. You do NOT write code. You decide WHAT should be done. The executor (Elon) does the building. Wayne (the founder) approves anything substantial. Verifier confirms post-deploy.

# TERMINOLOGY (HARD CONSTRAINT)
NEVER use "IFA", "IFAs", or "Independent Financial Advisor(s)" anywhere in your output. The correct terms are "FA", "FAs", and "Financial Advisor(s)".

This applies to:
- Order titles, intents, rationales
- Code identifiers (variable names, type names, function names)
- String literals, JSX text, KPI labels, UI copy
- Code comments and file/folder names

Even when proposing analytics/metrics work or describing user activity, NEVER use "IFA" — this is a hard constraint. The auto-approve filter blocks proposals containing IFA terms and routes them to manual review, which slows the system down. Ship clean proposals.

# Vision, Mission, Objectives — your north star
${visionText}

# Workstreams
${workstreamsText}

# This tick's focus: ${activeWorkstream}
Workstreams rotate evenly. This tick is ${activeWorkstream}'s turn. Propose work for this workstream only. If nothing is pressing for ${activeWorkstream} this tick, return [] — the next tick will rotate to the next workstream.
${directive ? `
# Active directive (set by Wayne)
Title: ${directive.title}
Workstream: ${directive.workstream}${directive.description ? `
Notes: ${directive.description}` : ``}
Expires: ${directive.expires_at}

This is a soft steer. Prefer proposing work consistent with this directive across ticks, even when this tick's rotation workstream differs. If you propose off-directive work, briefly justify in the rationale (e.g. urgent error in system_state, security issue). Do NOT relax safety, MAS, or risk_level rules to satisfy a directive.
` : ``}
# Stack
Next.js (Vercel), Supabase, Stripe, Resend, Anthropic.

# How to think
0. Read do_not_propose. If any item there matches what you're about to propose (same title or close paraphrase), STOP — pick different work, or ask Wayne a question instead of re-proposing.
1. Read system_state. Notice what's actually happening — errors, traffic, urgent flags.
2. Read recent_orders. What did we already try? What's pending?
3. Read recent_answered_questions to honor your past clarifications from Wayne.
4. Compare current state to vision objectives within ${activeWorkstream}.
5. Propose 0–3 work orders OR ONE question if you genuinely don't know what to do.
6. Quality over quantity. If nothing is worth doing, return [].

# Hard constraints
1. MAS-supervised. Anything touching policies, holdings, claims, billing, PII, or auth MUST be risk_level='high'. Never propose this as 'low'.
2. Verify behavior against code before describing features.
3. Small, reversible changes. One order = one focused change.

# OUTPUT FORMAT (CRITICAL)
You have FOUR tools: list_dir, read_file, grep_repo, propose_work.

Use list_dir / read_file / grep_repo to explore the codebase as needed. Do NOT narrate between exploration tool calls — just call tools silently.

When you are ready to deliver your decision, you MUST call the propose_work tool. This is the ONLY way to emit your decision. Do NOT write JSON in text — call propose_work instead. Do NOT write any commentary in text at all. After calling propose_work, stop.

propose_work has three modes:
- decision_type='orders' with 1-3 work orders
- decision_type='question' with a clarification question for Wayne
- decision_type='no_action' to skip this tick

Calling propose_work is mandatory. The tick is incomplete without it.

# WORK ORDER QUALITY (CRITICAL)

When you propose orders, the spec.operations field must contain LITERAL machine-executable operations. Elon executes them verbatim with no interpretation.

You MUST verify every file path against the actual repo using list_dir or read_file BEFORE specifying it in an operation. Do not invent or guess paths. If you have not read or listed the path, do not write to it.

CRITICAL — choosing between write_file and patch_file:
- If the file does NOT exist yet (new file): use write_file with the complete content.
- If the file ALREADY exists and your change is small (<50% of the file): use patch_file. Read the file with read_file, identify the smallest possible find/replace pairs, propose multiple patch_file operations if needed.
- If the file ALREADY exists and you would need to rewrite the entire body: STOP. This is almost always a sign you should propose multiple smaller patch_file operations instead. The executor (Bolt) runs on a budget-constrained model that frequently fails to reproduce large file bodies accurately. Six attempts to wire logAgentInvocation into Harbour all failed for exactly this reason — Brain proposed write_file with the entire 6KB body and Bolt could not reproduce it. Always prefer multiple targeted patch_file ops over one write_file rewrite.
- write_file on an existing file is acceptable ONLY when the file is genuinely small (<2KB) AND the change touches >50% of it.

Operation types:
- write_file: { type: "write_file", path: "<verified-path>", content: "<full literal file content>" }
- patch_file: { type: "patch_file", path: "<verified-path>", find: "<exact existing string>", replace: "<exact new string>" }
- bash: { type: "bash", command: "<shell command run from repo root>" }
- delete_file: { type: "delete_file", path: "<verified-path>" }

For patch_file: the "find" string must appear EXACTLY ONCE in the target file. If the same line appears multiple times, include enough surrounding context (the function signature above it, the closing brace below it) so the find string is unique. You verified this by reading the file with read_file.

For write_file: provide complete file content, not a diff. Elon will overwrite or create the file with exactly what you provide.

For bash: keep commands simple and idempotent. Avoid interactive prompts. Use --yes flags where applicable.

NEVER use spec.steps (English instructions) when spec.operations would work. Steps is a fallback for cases that genuinely can't be expressed as mechanical operations (e.g. design judgment).
4. Cap output at 3 work orders.
5. Every order needs a Verifier-checkable verification step.
6. Token-drain protection: if you see security risk to Anthropic spend (exposed agent endpoints, missing rate limits), propose security_observability work (logging/metrics, low risk) OR security work (real mitigations, high risk).
7. If you have a clarifying question that would change your decision, ASK it instead of guessing.

# Risk scoring
- low: copy, log additions, dependency bumps with no API changes, dev-only tooling
- medium: new internal routes, agent prompt changes, non-critical UI additions, dashboards
- high: anything in policies/holdings/claims/billing/auth, schema migrations, rate limits, anything writing to client-facing data

# Categories
copy | observability | security_observability | feature | security | bug | infra | data

Auto-approval lane (no human gate): risk_level='low' AND category in ['copy','observability','security_observability'].

Schema grounding (REQUIRED): if your proposal will write any code that queries a Supabase table — e.g. .from('table').select('cols') or anything reading/writing public tables — you MUST call the get_table_schema tool first to confirm the column names. Hallucinated column names broke production once already. There is no penalty for calling get_table_schema; the cost of skipping it is real.

# Output format — choose ONE of these two top-level shapes
Either an array of work orders:
[
  {
    "title": "short imperative",
    "intent": "one sentence on the user-visible or system-visible outcome",
    "rationale": "2-4 sentences. Cite specific state data or vision objective.",
    "workstream": "${activeWorkstream}",
    "files_to_change": ["app/..."],
    "risk_level": "low" | "medium" | "high",
    "category": "copy" | "observability" | "security_observability" | "feature" | "security" | "bug" | "infra" | "data",
    "spec": {
      "steps": ["concrete step 1", "concrete step 2"],
      "verification": "how the Verifier confirms this worked"
    }
  }
]

Or a SINGLE question wrapped like this when you genuinely need clarification:
{ "question": "<text>", "options": ["option A", "option B", "option C"], "context": "<why you're asking>" }

Empty array [] is valid and preferred over churn.

JSON only. No prose, no fences.`;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // B-killswitch: bail early if Brain has been paused by admin toggle.
  // Fail-open: if system_flags is unreadable (missing migration, transient DB error),
  // proceed with the tick. Better to run when we shouldn't than to silently never run.
  try {
    const { data: brainFlag } = await supabase
      .from("system_flags")
      .select("enabled, last_toggled_by, last_toggled_at, last_toggle_reason")
      .eq("key", "brain_tick")
      .maybeSingle();

    if (brainFlag && brainFlag.enabled === false) {
      await supabase.from("execution_log").insert({
        action: "tick_skipped_brain_paused",
        success: true,
        raw_output: JSON.stringify({
          paused_by: brainFlag.last_toggled_by,
          paused_at: brainFlag.last_toggled_at,
          reason: brainFlag.last_toggle_reason,
        }),
      });
      return NextResponse.json({ ok: true, skipped: true, reason: "brain_paused" });
    }
  } catch (err: any) {
    console.warn("brain_tick: system_flags check failed, proceeding:", err?.message ?? err);
  }

  // B74: read Brain model from brain_settings (cached 5s, falls back to default).
  const brainModel = await getCurrentBrainModel();
  const startedAt = Date.now();

  try {
    const visionText = loadVision();
    const workstreamsText = loadWorkstreams();
    const { workstream: activeWorkstream, tick_count } = await nextWorkstream(supabase);

    // Read active directive (soft steer from Wayne). Best-effort: never block tick.
    let activeDirective: ActiveDirective | null = null;
    try {
      const { data: directiveRow } = await supabase
        .from("brain_directives")
        .select("title, description, workstream, expires_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (directiveRow) activeDirective = directiveRow as ActiveDirective;
    } catch {}

    const { data: stateRows } = await supabase
      .from("system_state")
      .select("captured_at, snapshot_type, source, data, notes, urgent")
      .order("urgent", { ascending: false })
      .order("captured_at", { ascending: false })
      .limit(20);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("work_orders")
      .select("id, title, intent, status, risk_level, category, workstream, created_at, completed_at, verified_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    // B-pe-19 (Brain): assemble the do_not_propose list from two signals.
    //   Signal A: work_orders status=failed OR (status=proposed + stale 3d, no approval)
    //   Signal B: execution_log auto_approve_blocked_terminology + auto_approve_blocked_marketing_path entries
    // Both deduped by title (case-insensitive), capped at 30 entries.
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    const { data: rejectedOrders } = await supabase
      .from("work_orders")
      .select("title, status, created_at")
      .or(
        "status.eq.failed," +
        `and(status.eq.proposed,approved_by.is.null,created_at.lt.${threeDaysAgo})`
      )
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: blockedByFilter } = await supabase
      .from("execution_log")
      .select("created_at, raw_output")
      .in("action", ["auto_approve_blocked_terminology", "auto_approve_blocked_marketing_path"])
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(30);

    // Dedupe by title (case-insensitive). Most recent occurrence wins.
    const doNotProposeMap = new Map<string, { title: string; reason: string; count: number; last_seen: string }>();
    for (const r of (rejectedOrders ?? [])) {
      const t = (r.title ?? "").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      const reason = r.status === "failed" ? "previously failed" : "silently rejected (3+ days no approval)";
      const existing = doNotProposeMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        doNotProposeMap.set(key, { title: t, reason, count: 1, last_seen: r.created_at });
      }
    }
    for (const entry of (blockedByFilter ?? [])) {
      try {
        const raw = entry.raw_output as any;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const t = (parsed?.title ?? "").trim();
        if (!t) continue;
        const key = t.toLowerCase();
        const reason = `blocked by auto-approve filter (${parsed?.matched_pattern ?? parsed?.matched_path ?? "policy"})`;
        const existing = doNotProposeMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          doNotProposeMap.set(key, { title: t, reason, count: 1, last_seen: entry.created_at });
        }
      } catch {
        // ignore malformed raw_output
      }
    }
    const doNotPropose = Array.from(doNotProposeMap.values())
      .sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1))
      .slice(0, 30);

    const recentAnswers = await recentAnsweredQuestions(supabase, 20);

    const userMessage = [
      `# Active workstream this tick: ${activeWorkstream} (tick #${tick_count})`,
      "",
      "# do_not_propose (titles to NEVER re-propose — recently rejected or filter-blocked)",
      "",
      "Brain has previously proposed each of these titles and they were rejected or blocked.",
      "Do NOT propose the same title or any meaningful paraphrase. Pick different work.",
      "If you believe a rejected item is now worth re-attempting, ASK Wayne first via a question",
      "rather than re-proposing autonomously.",
      "",
      "```json",
      JSON.stringify(doNotPropose, null, 2),
      "```",
      "",
      "# system_state (urgent first, then most recent)",
      "```json",
      JSON.stringify(stateRows ?? [], null, 2),
      "```",
      "",
      "# recent_orders (last 30 days)",
      "```json",
      JSON.stringify(recentOrders ?? [], null, 2),
      "```",
      "",
      "# recent_answered_questions (Wayne's past clarifications — honor these)",
      "```json",
      JSON.stringify(recentAnswers, null, 2),
      "```",
      "",
      "Decide what to do. JSON only.",
    ].join("\n");

    let text = "";
    let toolCallCount = 0;
    let decisionFromTool: any = null;
    const toolCallLog: Array<{ name: string; input: any; result_size: number }> = [];

    if (BRAIN_USE_TOOLS) {
      // Tool-use loop: Brain can call list_dir / read_file / grep_repo before composing.
      const messages: any[] = [{ role: "user", content: userMessage }];

      while (true) {
        if (toolCallCount >= MAX_TOOL_CALLS_PER_TICK) {
          // Force final response — strip tools so Claude must emit text.
          const final: any = await anthropic.messages.create({
            model: brainModel,
            max_tokens: 8192,
            system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream, activeDirective) +
              "\n\n[Tool budget exhausted. Call propose_work NOW with whatever decision you can make.]",
            tools: BRAIN_TOOLS as any,
            tool_choice: { type: "tool", name: "propose_work" } as any,
            messages,
          });
          // tool_choice forces propose_work — extract its input.
          const finalProposeBlock = final.content.find((b: any) => b.type === "tool_use" && b.name === "propose_work");
          if (finalProposeBlock) {
            toolCallLog.push({ name: "propose_work", input: finalProposeBlock.input, result_size: 0 });
            decisionFromTool = finalProposeBlock.input;
          } else {
            // Fallback — should not happen with forced tool_choice but handle gracefully.
            text = final.content
              .filter((b: any) => b.type === "text")
              .map((b: any) => b.text)
              .join("\n")
              .trim();
          }
          break;
        }

        const response: any = await anthropic.messages.create({
          model: brainModel,
          max_tokens: 8192,
          system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream, activeDirective),
          tools: BRAIN_TOOLS as any,
          tool_choice: { type: "any" } as any,
          messages,
        });

        const stopReason = response.stop_reason;
        const toolUseBlocks = response.content.filter((b: any) => b.type === "tool_use");

        if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
          // No more tool calls — this is the final response.
          text = response.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();
          break;
        }

        // Check for propose_work — terminal decision tool.
        const proposeBlock = toolUseBlocks.find((b: any) => b.name === "propose_work");
        if (proposeBlock) {
          toolCallLog.push({ name: "propose_work", input: proposeBlock.input, result_size: 0 });
          decisionFromTool = proposeBlock.input;
          break;
        }

        // Append assistant turn (with tool_use blocks) and execute each non-terminal tool.
        messages.push({ role: "assistant", content: response.content });

        const toolResults: any[] = [];
        for (const block of toolUseBlocks) {
          const result = await executeBrainTool(block.name, block.input);
          toolCallCount++;
          toolCallLog.push({ name: block.name, input: block.input, result_size: result.length });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
        messages.push({ role: "user", content: toolResults });
      }
    } else {
      // Legacy single-call path (current production behavior).
      const response = await anthropic.messages.create({
        model: brainModel,
        max_tokens: 4096,
        system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream, activeDirective),
        messages: [{ role: "user", content: userMessage }],
      });
      text = response.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n")
        .trim();
    }
    let parsed: any;
    if (decisionFromTool) {
      // Brain emitted via propose_work — translate the tool input into the legacy parsed shape.
      const dt = decisionFromTool.decision_type;
      if (dt === "orders") {
        parsed = decisionFromTool.orders ?? [];
      } else if (dt === "question") {
        parsed = decisionFromTool.question;
      } else {
        parsed = []; // no_action
      }
    } else if (BRAIN_USE_TOOLS) {
      // Tool-use path but Brain never called propose_work. Log and treat as no_action.
      await supabase.from("execution_log").insert({
        action: "brain_tick_no_decision",
        success: false,
        error_message: "Brain finished without calling propose_work",
        raw_output: text.slice(0, 5000),
      });
      parsed = [];
    } else {
      const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch (e: any) {
        await supabase.from("execution_log").insert({
          action: "brain_tick_parse_fail",
          success: false,
          error_message: `parse failed: ${e.message}`,
          raw_output: text.slice(0, 5000),
        });
        return NextResponse.json(
          { ok: false, error: "brain output unparseable", raw: text.slice(0, 500) },
          { status: 500 }
        );
      }
    }

    // Question shape detection — single object with question + options.
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      typeof parsed.question === "string" &&
      Array.isArray(parsed.options)
    ) {
      const r = await createBrainQuestion(supabase, {
        question: parsed.question,
        options: parsed.options,
        context: parsed.context,
      });
      await supabase.from("execution_log").insert({
        action: "brain_tick",
        success: true,
        raw_output: JSON.stringify({
          duration_ms: Date.now() - startedAt,
          workstream: activeWorkstream,
          tick: tick_count,
          asked_question: r.id,
          tool_calls: toolCallCount,
          tool_log: toolCallLog,
        }),
      });
      return NextResponse.json({
        ok: true,
        workstream: activeWorkstream,
        asked_question: r.id,
      });
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, error: "brain output not array or question" }, { status: 500 });
    }

    const orders = parsed;
    const inserted: any[] = [];
    let dispatchedCount = 0;
    let notifiedCount = 0;

    for (const order of orders) {
      if (!order?.title || !order?.intent || !order?.risk_level || !order?.category) continue;

      const forbidden = containsForbiddenTerminology(order);
      const marketing = containsMarketingPathChange(order);
      const autoApprove =
        order.risk_level === "low" &&
        AUTO_APPROVE_CATEGORIES.has(order.category) &&
        !forbidden.blocked &&
        !marketing.blocked;

      if (forbidden.blocked) {
        await supabase.from("execution_log").insert({
          action: "auto_approve_blocked_terminology",
          success: true,
          raw_output: JSON.stringify({
            title: String(order.title).slice(0, 200),
            matched_pattern: forbidden.matchedPattern,
          }),
        });
      }

      if (marketing.blocked) {
        await supabase.from("execution_log").insert({
          action: "auto_approve_blocked_marketing_path",
          success: true,
          raw_output: JSON.stringify({
            title: String(order.title).slice(0, 200),
            matched_path: marketing.matchedPath,
          }),
        });
      }

      const { data, error } = await supabase
        .from("work_orders")
        .insert({
          title: String(order.title).slice(0, 500),
          intent: String(order.intent).slice(0, 2000),
          rationale: order.rationale ? String(order.rationale).slice(0, 4000) : null,
          workstream: order.workstream ?? activeWorkstream,
          files_to_change: Array.isArray(order.files_to_change) ? order.files_to_change : [],
          risk_level: order.risk_level,
          category: order.category,
          status: autoApprove ? "approved" : "proposed",
          auto_approved: autoApprove,
          approved_by: autoApprove ? "auto" : null,
          approved_at: autoApprove ? new Date().toISOString() : null,
          model_version: brainModel,
          raw_response: order,
          spec: order.spec ?? null,
        })
        .select()
        .single();

      if (error || !data) continue;
      inserted.push(data);

      if (autoApprove) {
        const r = await dispatchOrderToElon(supabase, data.id);
        if (r.ok) dispatchedCount++;
      } else {
        const r = await notifyWayneForApproval(supabase, data.id);
        if (r.ok) notifiedCount++;
      }
    }

    await supabase.from("execution_log").insert({
      action: "brain_tick",
      success: true,
      raw_output: JSON.stringify({
        duration_ms: Date.now() - startedAt,
        workstream: activeWorkstream,
        tick: tick_count,
        orders_returned: orders.length,
        orders_inserted: inserted.length,
        auto_dispatched: dispatchedCount,
        notified: notifiedCount,
        tool_calls: toolCallCount,
        tool_log: toolCallLog,
      }),
    });

    return NextResponse.json({
      ok: true,
      duration_ms: Date.now() - startedAt,
      workstream: activeWorkstream,
      tick: tick_count,
      inserted: inserted.length,
      dispatched: dispatchedCount,
      notified: notifiedCount,
    });
  } catch (err: any) {
    console.error("brain_tick error:", err);
    try {
      await supabase
        .from("execution_log")
        .insert({ action: "brain_tick", success: false, error_message: err?.message ?? "unknown" });
    } catch {}
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
