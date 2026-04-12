import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIFAStatus } from "@/lib/trial-status";

export async function GET() {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
 const result = await checkIFAStatus(user.id);
 return NextResponse.json(result);
 } catch (error: any) {
 return NextResponse.json({ error: "Failed to check trial status" }, { status: 500 });
 }
}