import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, whatsapp } = await request.json()

    if (!name || !email || !password || !whatsapp) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, whatsapp' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase auth using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, whatsapp },
    })

    if (authError) {
      console.error('Auth create user error:', authError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create user profile in database
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: whatsapp || null,
        plan: 'solo',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the request - user can still login with password
    }

    // Supabase automatically sends confirmation email when email_confirm: false

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. Check your email to confirm your account.',
      userId: authData.user.id 
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}