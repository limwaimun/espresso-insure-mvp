import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string
    const bodyIfaId = formData.get('ifaId') as string | null

    if (bodyIfaId && bodyIfaId !== userId) {
      console.warn(`[policy-upload] ignored mismatched ifaId from form: body=${bodyIfaId} session=${userId}`)
    }

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!clientId) return NextResponse.json({ error: 'No clientId provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })

    // ── Ownership check: verify the client belongs to the caller ──────────
    // IMPORTANT: do this BEFORE the expensive Claude call to avoid API abuse
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('ifa_id', userId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 404 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Claude extracts policy data
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as Anthropic.ContentBlockParam,
            {
              type: 'text',
              text: `You are a policy document extractor for an insurance platform in Singapore.
Extract the following fields from this insurance policy and return ONLY a valid JSON object — no markdown, no backticks, no explanation.

{
  "insurer": "short insurer name e.g. AIA, Great Eastern, Prudential, NTUC Income, Manulife, AXA",
  "type": "policy type e.g. Life, Health, Motor, Critical Illness, Disability, Travel, Property",
  "premium": number (annual premium in SGD as a plain number — no symbols),
  "renewal_date": "YYYY-MM-DD",
  "policy_number": "policy number string or null"
}

If premium is monthly multiply by 12. renewal_date must be a valid future date. Return ONLY the JSON.`,
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
    }

    try {
      extracted = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({
        error: 'Could not read policy data from this PDF. Please check the file and try again.',
      }, { status: 422 })
    }

    // Save to Supabase — scoped to verified userId
    const { data: policy, error: dbError } = await supabase
      .from('policies')
      .insert({
        client_id: clientId,
        ifa_id: userId,
        insurer: extracted.insurer ?? 'Unknown',
        type: extracted.type ?? 'Unknown',
        premium: Number(extracted.premium) || 0,
        renewal_date: extracted.renewal_date ?? new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[policy-upload] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save policy: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      policy,
      extracted,
      message: `Added: ${extracted.type} — ${extracted.insurer}`,
    })

  } catch (err) {
    console.error('[policy-upload] error:', err)
    return NextResponse.json({ error: 'Upload failed. Check server logs.' }, { status: 500 })
  }
}
