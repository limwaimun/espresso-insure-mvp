// Thin wrapper around Telegram Bot API. No SDK.

export type TelegramSendOpts = {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  disable_web_page_preview?: boolean;
};

export type TelegramSendResult = {
  ok: boolean;
  message_id?: number;
  error?: string;
};

export async function sendTelegram(
  chatId: string | undefined,
  text: string,
  opts?: TelegramSendOpts
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  if (!chatId) return { ok: false, error: "chat id missing" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: opts?.parse_mode,
        disable_web_page_preview: opts?.disable_web_page_preview ?? true,
      }),
    });
    const j: any = await res.json();
    if (!j.ok) return { ok: false, error: j.description ?? "telegram error" };
    return { ok: true, message_id: j.result?.message_id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "fetch failed" };
  }
}

export function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
