import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { ifaId, clientId, client, query, coverageType, sumAssured, riders } = await request.json()

    if (!ifaId) return NextResponse.json({ error: 'Missing ifaId' }, { status: 400 })

    let clientData = client
    if (!clientData && clientId) {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single()
      clientData = data
    }

    const { data: ifa } = await supabase.from('profiles').select('preferred_insurers').eq('id', ifaId).single()
    const preferredInsurers: string[] = ifa?.preferred_insurers || []

    const age = clientData?.birthday
      ? Math.floor((Date.now() - new Date(clientData.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: `You are Sage, an expert insurance actuary and pricing specialist for Singapore.
You provide premium estimates based on Singapore market rates (2025-2026).
Always caveat that these are indicative ranges — actual premiums require formal underwriting.
Preferred insurers: ${preferredInsurers.length > 0 ? preferredInsurers.join(', ') : 'all major SG insurers'}.`,
      messages: [{
        role: 'user',
        content: `Estimate premiums for this insurance request.

CLIENT:
Name: ${clientData?.name || 'Unknown'}
Age: ${age !== null ? age : 'Unknown'}
Company: ${clientData?.company || 'N/A'}

REQUEST: "${query}"
Coverage type: ${coverageType || 'as described in request'}
${sumAssured ? `Sum assured: SGD ${sumAssured}` : ''}
${riders ? `Riders requested: ${riders}` : ''}

Provide premium estimates from 3-4 major SG insurers. Return JSON only:
{
  "coverage_type": "",
  "sum_assured": "",
  "estimates": [
    {
      "insurer": "",
      "product_name": "",
      "annual_premium": {"min": 0, "max": 0},
      "monthly_premium": {"min": 0, "max": 0},
      "key_inclusions": [],
      "notes": ""
    }
  ],
  "factors_affecting_premium": [],
  "recommendation": "",
  "disclaimer": "Indicative estimates only. Actual premiums subject to underwriting.",
  "mayaMessage": ""
}

For mayaMessage: short WhatsApp message under 80 words with the estimate. End with: "These are rough estimates — your advisor will confirm exact figures after a formal quote."`
      }],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text || ''
    let estimates = null
    try {
      estimates = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      estimates = { raw: rawText }
    }

    return NextResponse.json({
      success: true,
      agent: 'sage',
      client: clientData ? { name: clientData.name, age } : null,
      estimates,
    })

  } catch (err) {
    console.error('[sage] error:', err)
    return NextResponse.json({ error: 'Sage failed' }, { status: 500 })
  }
}
