import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export async function POST(request: NextRequest) {
 try {
 const { name, email, password, whatsapp } = await request.json();

 if (!email || !name || !password) {
 return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
 }
 if (password.length < 8) {
 return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
 }

 // Regular client triggers email confirmation flow
 const supabase = createClient(supabaseUrl, supabaseAnonKey);
 const { data, error } = await supabase.auth.signUp({
 email,
 password,
 options: {
 data: { name, whatsapp },
 emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
 },
 });

 if (error) {
 console.error("Signup error:", error);
 return NextResponse.json({ error: error.message }, { status: 400 });
 }

 if (data.user) {
 // Admin client to bypass RLS for profile creation
 const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);
 const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

 await supabaseAdmin.from("profiles").insert({
 id: data.user.id,
 email,
 name,
 phone: whatsapp || null,
 plan: "solo",
 trial_ends_at: trialEndsAt.toISOString(),
 });
 }

 return NextResponse.json({
 success: true,
 message: "Account created. Check your email to confirm.",
 });
 } catch (error: any) {
 console.error("Signup error:", error);
 return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
 }
}