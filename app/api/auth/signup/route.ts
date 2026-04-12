import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, whatsapp } = await request.json()

    if (!name || !email || !whatsapp) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, whatsapp' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(), // Generate random password for magic link flow
      options: {
        data: {
          name,
          whatsapp,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        whatsapp,
        subscription_status: 'trial',
        plan: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the request - user can still login with magic link
    }

    // Send magic link email (already done by signUp with emailRedirectTo)
    // The user will receive an email with a login link

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. Check your email for a login link.',
      userId: authData.user?.id 
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}