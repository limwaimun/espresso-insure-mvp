import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    // ── Auth: read session from cookies ───────────────────────────────────
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Try with service key as fallback for server-side calls
      const serviceSupabase = createClient(
        supabaseUrl,
        process.env.SUPABASE_SECRET_KEY!
      )
      // Extract user from Authorization header if present
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const ifaId = formData.get('ifaId') as string // pass from frontend

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Missing file or clientId' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })
    }

    // ── Convert to base64 ─────────────────────────────────────────────────
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // ── Claude extracts policy data ───────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            } as Anthropic.ContentBlockParam,
            {
              type: 'text',
              text: `You are a policy document extractor for an insurance platform in Singapore. Extract the following fields from this insurance policy document and return ONLY a valid JSON object with no other text, no markdown, no backticks.

Required fields:
{
  "insurer": "name of the insurance company (short name e.g. AIA, Great Eastern, Prudential, NTUC Income, Manulife, AXA)",
  "type": "type of policy (e.g. Life, Health, Motor, Critical Illness, Disability, Travel, Property, Group Health, Keyman, D&O, Cyber)",
  "premium": number (annual premium in SGD as a plain number only, no currency symbols),
  "renewal_date": "YYYY-MM-DD format",
  "policy_number": "policy number string or null if not found",
  "status": "active"
}

Rules:
- If premium is shown as monthly, multiply by 12
- If premium includes GST, use the pre-GST amount
- renewal_date must be a future date in YYYY-MM-DD format
- Return ONLY the JSON object, nothing else`,
            },
          ],
        },
      ],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let extracted: {
      insurer: string
      type: string
      premium: number
      renewal_date: string
      policy_number: string | null
      status: string
    }

    try {
      extracted = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({
        error: 'Could not extract policy data from this PDF. Please check the file and try again.',
      }, { status: 422 })
    }

    // ── Save to Supabase using service key (bypasses RLS for server insert) ──
    const serviceSupabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { data: policy, error: dbError } = await serviceSupabase
      .from('policies')
      .insert({
        client_id: clientId,
        ifa_id: ifaId || user?.id,
        insurer: extracted.insurer ?? 'Unknown',
        type: extracted.type ?? 'Unknown',
        premium: extracted.premium ?? 0,
        renewal_date: extracted.renewal_date ?? new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[policy-upload] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save policy to database' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      policy,
      extracted,
      message: `Policy added: ${extracted.type} with ${extracted.insurer}`,
    })

  } catch (err) {
    console.error('[policy-upload] error:', err)
    return NextResponse.json({ error: 'Upload failed. Check server logs.' }, { status: 500 })
  }
}
