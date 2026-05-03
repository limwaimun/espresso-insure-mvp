import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function html(title: string, body: string, accent = "#222") {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:${accent};line-height:1.5}h1{font-size:22px}.code{font-family:ui-monospace,Menlo,monospace;background:#f3f3f3;padding:2px 6px;border-radius:4px;font-size:13px}</style>
</head><body><h1>${title}</h1>${body}</body></html>`;
}

function htmlResponse(status: number, title: string, body: string, accent?: string) {
  return new NextResponse(html(title, body, accent), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  const choiceStr = url.searchParams.get("choice");

  if (!id || !token || choiceStr === null)
    return htmlResponse(400, "Invalid link", "<p>Missing parameters.</p>", "#a00");
  const choice = parseInt(choiceStr, 10);
  if (isNaN(choice))
    return htmlResponse(400, "Invalid choice", "<p>Choice must be a number.</p>", "#a00");

  const { data: q, error } = await supabase
    .from("brain_questions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !q) return htmlResponse(404, "Not found", "<p>Question not found.</p>", "#a00");
  if (q.answer_token !== token)
    return htmlResponse(403, "Invalid token", "<p>Token mismatch.</p>", "#a00");
  if (q.status !== "open")
    return htmlResponse(
      200,
      "Already answered",
      `<p>This question is currently <span class="code">${q.status}</span>. No change made.</p>`
    );

  const options = (q.options as string[]) ?? [];
  if (choice < 0 || choice >= options.length)
    return htmlResponse(400, "Choice out of range", "<p>Invalid choice index.</p>", "#a00");

  const answer = options[choice];

  await supabase
    .from("brain_questions")
    .update({
      status: "answered",
      answer,
      answered_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("execution_log").insert({
    action: "brain_question_answered",
    success: true,
    raw_output: `q=${id} choice=${choice} answer=${answer}`,
  });

  return htmlResponse(
    200,
    "Got it ✅",
    `<p>Answer recorded: <b>${answer}</b></p><p>Brain will see this on its next tick.</p>`
  );
}
