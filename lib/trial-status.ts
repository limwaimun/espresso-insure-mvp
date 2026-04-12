import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SECRET_KEY!
);

export type TrialStatus = "active_trial" | "expired_trial" | "paying";

export async function checkIFAStatus(ifaId: string): Promise<{ status: TrialStatus; daysLeft: number | null }> {
 const { data: profile, error } = await supabaseAdmin
 .from("profiles")
 .select("trial_ends_at, stripe_subscription_id")
 .eq("id", ifaId)
 .single();

 if (error || !profile) return { status: "expired_trial", daysLeft: null };
 if (profile.stripe_subscription_id) return { status: "paying", daysLeft: null };

 const now = new Date();
 const trialEnd = new Date(profile.trial_ends_at);
 const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

 if (daysLeft > 0) return { status: "active_trial", daysLeft };
 return { status: "expired_trial", daysLeft: 0 };
}