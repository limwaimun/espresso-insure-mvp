// Workstream rotation. Each tick advances the counter and selects the next workstream.
// Order matches brain/vision.md: marketing, fa_app, agents, admin_dashboard.

export const WORKSTREAMS = ["marketing", "fa_app", "agents", "admin_dashboard"] as const;
export type Workstream = (typeof WORKSTREAMS)[number];

export async function nextWorkstream(supabase: any): Promise<{
  workstream: Workstream;
  tick_count: number;
}> {
  const { data, error } = await supabase
    .from("brain_state")
    .select("tick_count")
    .eq("id", 1)
    .single();

  if (error || !data) {
    await supabase.from("brain_state").upsert({ id: 1, tick_count: 0 });
  }

  const currentCount = (data?.tick_count ?? 0) as number;
  const nextCount = currentCount + 1;
  const workstream = WORKSTREAMS[currentCount % WORKSTREAMS.length];

  await supabase
    .from("brain_state")
    .update({
      tick_count: nextCount,
      last_tick_at: new Date().toISOString(),
      last_workstream: workstream,
    })
    .eq("id", 1);

  return { workstream, tick_count: nextCount };
}
