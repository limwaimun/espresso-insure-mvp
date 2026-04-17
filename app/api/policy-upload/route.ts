import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clientId = formData.get('clientId') as string

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Missing file or clientId' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Send to Claude for extraction
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
              text: `You are a policy document extractor. Extract the following fields from this insurance policy document and return ONLY a valid JSON object with no other text, no markdown, no backticks.

Required fields:
{
  "insurer": "name of the insurance company",
  "type": "type of policy (e.g. Life, Health, Motor, Critical Illness, etc.)",
  "premium": number (annual premium in SGD, just the number),
  "renewal_date": "YYYY-MM-DD format",
  "policy_number": "policy number if found",
  "status": "active"
}

If you cannot find a field, use null for that field.
If premium is monthly, multiply by 12 to get annual.
Return ONLY the JSON object.`,
            },
          ],
        },
      ],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let extracted: {
      insurer: string | null
      type: string | null
      premium: number | null
      renewal_date: string | null
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

    // Save to policies table
    const { data: policy, error: dbError } = await supabase
      .from('policies')
      .insert({
        client_id: clientId,
        ifa_id: user.id,
        insurer: extracted.insurer ?? 'Unknown',
        type: extracted.type ?? 'Unknown',
        premium: extracted.premium ?? 0,
        renewal_date: extracted.renewal_date ?? new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save policy' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      policy,
      extracted,
      message: `Policy extracted: ${extracted.type} with ${extracted.insurer}`,
    })
  } catch (err) {
    console.error('[policy-upload] error:', err)
    return NextResponse.json({ error: 'Upload failed. Check server logs.' }, { status: 500 })
  }
}
