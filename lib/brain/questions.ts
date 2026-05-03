// Brain question handler.

import { sendTelegram, escapeHtml } from "./telegram";

export type BrainQuestion = {
  question: string;
  options: string[];
  context?: string;
};

export async function createBrainQuestion(
  supabase: any,
  q: BrainQuestion
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!q?.question || !Array.isArray(q?.options) || q.options.length < 2 || q.options.length > 4) {
    return { ok: false, error: "question must have 2–4 options" };
  }

  const { data, error } = await supabase
    .from("brain_questions")
    .insert({
      question: String(q.question).slice(0, 1000),
      options: q.options.map((o) => String(o).slice(0, 200)),
      context: q.context ? String(q.context).slice(0, 2000) : null,
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };

  const baseUrl = process.env.BRAIN_BASE_URL ?? "https://espresso-mvp.vercel.app";
  const optionLinks = (data.options as string[])
    .map(
      (opt: string, i: number) =>
        `<a href="${baseUrl}/api/brain/answer?id=${data.id}&token=${data.answer_token}&choice=${i}">${i + 1}. ${escapeHtml(opt)}</a>`
    )
    .join("\n");

  const message = [
    "❓ <b>Brain has a question</b>",
    "",
    `<b>${escapeHtml(data.question)}</b>`,
    data.context ? `\n<i>${escapeHtml(data.context)}</i>` : "",
    "",
    optionLinks,
  ].join("\n");

  const sendResult = await sendTelegram(process.env.TELEGRAM_WAYNE_CHAT_ID, message, {
    parse_mode: "HTML",
  });

  await supabase
    .from("brain_questions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", data.id);

  await supabase.from("execution_log").insert({
    action: "brain_question",
    success: sendResult.ok,
    error_message: sendResult.error,
    raw_output: `question_id: ${data.id}`,
  });

  return { ok: true, id: data.id };
}

export async function recentAnsweredQuestions(supabase: any, limit = 20) {
  const { data } = await supabase
    .from("brain_questions")
    .select("question, answer, created_at, answered_at")
    .eq("status", "answered")
    .order("answered_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
