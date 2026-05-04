import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { loadVision, loadWorkstreams } from "@/lib/brain/vision";
import { dispatchOrderToElon, notifyWayneForApproval } from "@/lib/brain/elon";
import { nextWorkstream } from "@/lib/brain/rotation";
import { createBrainQuestion, recentAnsweredQuestions } from "@/lib/brain/questions";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const BRAIN_MODEL = "claude-opus-4-7";
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
                properties: {
                  steps: { type: "array", items: { type: "string" } },
                  verification: { type: "string" },
                },
                required: ["steps", "verification"],
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

function buildSystemPrompt(visionText: string, workstreamsText: string, activeWorkstream: string): string {
  return `You are the Brain agent for Espresso (espresso.insure), an AI back-office platform for Independent Financial Advisers (IFAs) in Singapore.

You are the sole decision-maker. You do NOT write code. You decide WHAT should be done. The executor (Elon) does the building. Wayne (the founder) approves anything substantial. Verifier confirms post-deploy.

# Vision, Mission, Objectives — your north star
${visionText}

# Workstreams
${workstreamsText}

# This tick's focus: ${activeWorkstream}
Workstreams rotate evenly. This tick is ${activeWorkstream}'s turn. Propose work for this workstream only. If nothing is pressing for ${activeWorkstream} this tick, return [] — the next tick will rotate to the next workstream.

# Stack
Next.js (Vercel), Supabase, Stripe, Resend, Anthropic.

# How to think
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
  const startedAt = Date.now();

  try {
    const visionText = loadVision();
    const workstreamsText = loadWorkstreams();
    const { workstream: activeWorkstream, tick_count } = await nextWorkstream(supabase);

    const { data: stateRows } = await supabase
      .from("system_state")
      .select("captured_at, snapshot_type, source, data, notes, urgent")
      .order("urgent", { ascending: false })
      .order("captured_at", { ascending: false })
      .limit(20);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("work_orders")
      .select("id, title, intent, status, risk_level, category, workstream, created_at, completed_at, verified_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    const recentAnswers = await recentAnsweredQuestions(supabase, 20);

    const userMessage = [
      `# Active workstream this tick: ${activeWorkstream} (tick #${tick_count})`,
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
          const final = await anthropic.messages.create({
            model: BRAIN_MODEL,
            max_tokens: 8192,
            system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream) +
              "\n\n[Tool budget exhausted. Call propose_work NOW with whatever decision you can make.]",
            tools: BRAIN_TOOLS as any,
            tool_choice: { type: "tool", name: "propose_work" } as any,
            messages,
          });
          text = final.content
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n")
            .trim();
          break;
        }

        const response: any = await anthropic.messages.create({
          model: BRAIN_MODEL,
          max_tokens: 8192,
          system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream),
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
        model: BRAIN_MODEL,
        max_tokens: 4096,
        system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream),
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

      const autoApprove =
        order.risk_level === "low" && AUTO_APPROVE_CATEGORIES.has(order.category);

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
          model_version: BRAIN_MODEL,
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
