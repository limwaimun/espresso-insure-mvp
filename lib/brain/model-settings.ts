import { createClient } from "@supabase/supabase-js";

// Brain Loop model choice helper.
//
// Single source of truth for which Anthropic model Brain uses for its
// tick/verify/mirror loops. Reads from the brain_settings singleton row.
// Falls back to a hardcoded default if the DB read fails — Brain must
// never silently break because of a settings table issue.

export const SUPPORTED_BRAIN_MODELS = [
  { id: "claude-opus-4-7", label: "Claude Opus 4.7", note: "Most capable, ~5x cost" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", note: "Previous Opus" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", note: "Default — best value" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", note: "Cheapest, lower reasoning" },
] as const;

export type BrainModelId = typeof SUPPORTED_BRAIN_MODELS[number]["id"];

export const DEFAULT_BRAIN_MODEL: BrainModelId = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Returns the currently-configured Brain model. Cached for 5 seconds
// to avoid hammering the DB across the multiple SDK calls in one tick.
let cachedModel: { id: BrainModelId; ts: number } | null = null;
const CACHE_MS = 5_000;

export async function getCurrentBrainModel(): Promise<BrainModelId> {
  const now = Date.now();
  if (cachedModel && now - cachedModel.ts < CACHE_MS) {
    return cachedModel.id;
  }

  try {
    const { data, error } = await supabase
      .from("brain_settings")
      .select("model")
      .eq("id", 1)
      .single();
    if (error || !data) {
      console.warn("[brain-settings] read failed, using default:", error?.message);
      return DEFAULT_BRAIN_MODEL;
    }
    const id = data.model as BrainModelId;
    if (!SUPPORTED_BRAIN_MODELS.some((m) => m.id === id)) {
      console.warn("[brain-settings] unsupported model in DB:", id, "— using default");
      return DEFAULT_BRAIN_MODEL;
    }
    cachedModel = { id, ts: now };
    return id;
  } catch (e: any) {
    console.warn("[brain-settings] read threw, using default:", e?.message);
    return DEFAULT_BRAIN_MODEL;
  }
}

export function isSupportedBrainModel(model: string): model is BrainModelId {
  return SUPPORTED_BRAIN_MODELS.some((m) => m.id === model);
}
