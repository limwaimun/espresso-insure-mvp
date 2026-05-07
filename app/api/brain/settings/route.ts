import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { isAdminUserId } from "@/lib/admin";
import { isSupportedBrainModel, SUPPORTED_BRAIN_MODELS } from "@/lib/brain/model-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function requireAdmin(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").filter(Boolean).map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx), c.slice(idx + 1)];
    })
  );
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value: value as string })),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUserId(user?.id)) return null;
  return user;
}

// GET — return current Brain model + supported list
export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await serviceSupabase
    .from("brain_settings")
    .select("model, updated_at, updated_by")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    current: data,
    supported: SUPPORTED_BRAIN_MODELS,
  });
}

// POST — update the Brain model
export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const model = String(body?.model ?? "").trim();
  if (!isSupportedBrainModel(model)) {
    return NextResponse.json(
      { error: `unsupported model: ${model}`, supported: SUPPORTED_BRAIN_MODELS.map((m) => m.id) },
      { status: 400 }
    );
  }

  const { data, error } = await serviceSupabase
    .from("brain_settings")
    .update({
      model,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, current: data });
}
