// Verifier: reads deployed files and judges whether they accomplish the work order's intent.

import { existsSync, readFileSync, statSync } from "fs";
import { resolve, relative } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { sendTelegram, escapeHtml } from "./telegram";

const MAX_FILE_BYTES = 50_000;
const VERIFIER_MODEL = "claude-opus-4-7";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export type FileSnapshot = {
  path: string;
  exists: boolean;
  content?: string;
  truncated?: boolean;
  mtime_iso?: string;
  size?: number;
  error?: string;
};

export function readDeployedFile(filePath: string): FileSnapshot {
  try {
    const cwd = process.cwd();
    const abs = resolve(cwd, filePath);
    const rel = relative(cwd, abs);
    if (rel.startsWith("..") || rel.startsWith("/")) {
      return { path: filePath, exists: false, error: "path escapes working directory" };
    }
    if (!existsSync(abs)) return { path: filePath, exists: false };
    const stat = statSync(abs);
    if (!stat.isFile()) return { path: filePath, exists: false, error: "not a regular file" };
    const truncated = stat.size > MAX_FILE_BYTES;
    const buf = readFileSync(abs);
    const head = buf.slice(0, Math.min(1024, buf.length));
    if (head.includes(0)) {
      return {
        path: filePath,
        exists: true,
        size: stat.size,
        mtime_iso: stat.mtime.toISOString(),
        error: "binary file, content omitted",
      };
    }
    const content = buf.toString("utf8").slice(0, MAX_FILE_BYTES);
    return {
      path: filePath,
      exists: true,
      content,
      truncated,
      size: stat.size,
      mtime_iso: stat.mtime.toISOString(),
    };
  } catch (e: any) {
    return { path: filePath, exists: false, error: e?.message ?? "read failed" };
  }
}

const VERIFIER_SYSTEM_PROMPT = `You are the Verifier agent for Espresso. You judge whether deployed code actually accomplishes a work order's stated intent.

You are skeptical. You are not the executor's friend. You catch hallucinations and incomplete work. Read code carefully and only confirm what you can see.

Output JSON only. No preamble. Schema:
{
  "verified": true | false,
  "confidence": "low" | "medium" | "high",
  "reasoning": "2-4 sentences. What did you actually see? Does it match the intent?",
  "issues": ["specific problem 1", "specific problem 2"]
}

Rules:
- File the spec said to create is missing → not verified.
- File exists but lacks the described change → not verified.
- Change is partial or incomplete → not verified, confidence low/medium.
- Spec said to delete and file is absent → verified.
- Change is clearly visible and complete → verified, confidence appropriate to clarity.
- Don't speculate beyond what the code statically shows.
- Don't hand-wave. If you can't tell, verified=false, confidence=low.
- Empty issues array when verified=true. Always populate issues when verified=false.`;

export type VerificationResult = {
  verified: boolean;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  issues: string[];
  raw_text?: string;
  parse_error?: string;
};

export async function judgeWithClaude(
  order: any,
  files: FileSnapshot[]
): Promise<VerificationResult> {
  const userMsg = [
    "# Work order",
    "```json",
    JSON.stringify(
      {
        title: order.title,
        intent: order.intent,
        rationale: order.rationale,
        spec: order.spec,
        files_to_change: order.files_to_change,
        risk_level: order.risk_level,
        category: order.category,
        workstream: order.workstream,
      },
      null,
      2
    ),
    "```",
    "",
    "# Deployed files",
    ...files.flatMap((f) => [
      `## ${f.path}`,
      f.exists
        ? `(size: ${f.size}, mtime: ${f.mtime_iso}${f.truncated ? ", TRUNCATED" : ""})`
        : "(file does not exist)",
      f.error ? `Error: ${f.error}` : "",
      f.content ? "```\n" + f.content + "\n```" : "",
      "",
    ]),
    "Judge whether the deployed code accomplishes the work order's intent. JSON only.",
  ].join("\n");

  const response = await anthropic.messages.create({
    model: VERIFIER_MODEL,
    max_tokens: 1500,
    system: VERIFIER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      verified: !!parsed.verified,
      confidence: ["low", "medium", "high"].includes(parsed.confidence)
        ? parsed.confidence
        : "low",
      reasoning: String(parsed.reasoning ?? "no reasoning given"),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      raw_text: text,
    };
  } catch (e: any) {
    return {
      verified: false,
      confidence: "low",
      reasoning: "Verifier output unparseable.",
      issues: ["Verifier returned invalid JSON"],
      raw_text: text,
      parse_error: e?.message,
    };
  }
}

export async function notifyVerificationResult(order: any, result: VerificationResult) {
  const baseUrl = process.env.BRAIN_BASE_URL ?? "https://espresso-mvp.vercel.app";
  const emoji = result.verified ? "✅" : "❌";
  const heading = result.verified ? "Verified" : "Verification failed";

  const lines = [
    `${emoji} <b>${heading}: ${escapeHtml(order.title)}</b>`,
    `Confidence: ${escapeHtml(result.confidence)}`,
    "",
    `<i>${escapeHtml(result.reasoning)}</i>`,
  ];
  if (result.issues.length) {
    lines.push("", "<b>Issues:</b>");
    lines.push(...result.issues.map((i) => `• ${escapeHtml(i)}`));
  }
  if (order.pre_dispatch_commit_sha) {
    lines.push(
      "",
      `<a href="${baseUrl}/api/brain/revert?id=${order.id}&token=${order.approval_token}">↩️ Revert this change</a>`
    );
  }
  lines.push(
    "",
    `Order ID: <code>${escapeHtml(order.id)}</code>`,
    `<a href="${baseUrl}/api/brain/verify?id=${order.id}&token=${order.approval_token}">Re-verify</a>`
  );

  return sendTelegram(process.env.TELEGRAM_WAYNE_CHAT_ID, lines.join("\n"), {
    parse_mode: "HTML",
  });
}
