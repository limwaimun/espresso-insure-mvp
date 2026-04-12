import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkIFAStatus } from "@/lib/trial-status";

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function POST(request: NextRequest) {
 try {
 const body = await request.json();
 const fromNumber = body?.messages?.[0]?.from;
 const messageText = body?.messages?.[0]?.text?.body;
 if (!fromNumber || !messageText) return NextResponse.json({ status: "no message" });

 const { data: conversation } = await supabaseAdmin.from("conversations").select("ifa_id, client_id").eq("whatsapp_thread_id", fromNumber).single();
 if (!conversation) return NextResponse.json({ status: "unknown number" });

 const { status } = await checkIFAStatus(conversation.ifa_id);
 if (status === "expired_trial") return NextResponse.json({ status: "trial_expired" });

 // TODO: Forward to Maya API + reply via 360dialog
 return NextResponse.json({ status: "processed" });
 } catch (error: any) {
 return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
 }
}