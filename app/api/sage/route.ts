import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Sage — Espresso's internal actuary agent
// Called by Maya when a client asks about pricing or coverage costs
// Never speaks to clients directly — returns estimates to Maya

export async function POST(request: NextRequest) {
  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    // No DB access, but we still gate to prevent unauthenticated LLM-cost abuse.
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const {
      coverageType,
      clientAge,
      clientGender,
      clientType,
      sumAssured,
      existingConditions,
      preferredInsurers,
    } = await request.json() as {
      coverageType: string
      clientAge?: number
      clientGender?: string
      clientType?: 'individual' | 'sme' | 'corporate'
      sumAssured?: number
      existingConditions?: string[]
      preferredInsurers?: string[]
    }

    if (!coverageType) {
      return NextResponse.json({ error: 'coverageType is required' }, { status: 400 })
    }

    const preferredContext = preferredInsurers && preferredInsurers.length > 0
      ? `The IFA's preferred insurers are: ${preferredInsurers.join(', ')}. Mention these first where relevant.`
      : ''

    const prompt = `You are Sage, an internal actuary agent for Espresso, an insurance back-office platform in Singapore.
Your job is to give Maya (the client-facing AI) a quick premium estimate for a client enquiry. You are NOT speaking to the client directly — your output will be passed to Maya who will then add a disclaimer.

COVERAGE REQUESTED: ${coverageType}
CLIENT AGE: ${clientAge ?? 'unknown'}
CLIENT GENDER: ${clientGender ?? 'unknown'}
CLIENT TYPE: ${clientType ?? 'individual'}
SUM ASSURED: ${sumAssured ? `SGD ${sumAssured.toLocaleString()}` : 'standard coverage'}
EXISTING CONDITIONS: ${existingConditions && existingConditions.length > 0 ? existingConditions.join(', ') : 'none declared'}
${preferredContext}

Provide a premium estimate based on Singapore market rates. Always give a RANGE not a single number. Be specific and realistic. Reference actual Singapore insurers and products where possible.

Respond in this exact JSON format with no other text:
{
  "monthlyRange": { "min": number, "max": number },
  "annualRange": { "min": number, "max": number },
  "basis": "brief explanation of what drives this range",
  "recommendedInsurers": ["insurer 1", "insurer 2"],
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "confidence": "high | medium | low",
  "caveat": "one sentence caveat Maya should add when presenting this"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let estimate
    try {
      estimate = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({
        error: 'Sage could not generate an estimate for this coverage type',
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      estimate,
      coverageType,
    })
  } catch (err) {
    console.error('[sage] error:', err)
    return NextResponse.json({ error: 'Sage failed to respond' }, { status: 500 })
  }
}
