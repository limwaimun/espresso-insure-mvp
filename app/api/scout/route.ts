import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'
import { logAgentInvocation } from '@/lib/agent-log'
import { checkRateLimit } from '@/lib/agent-rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Scout — Espresso's internal product intelligence agent
// Reads product PDFs forwarded by the IFA, extracts structured data
// Also surfaces market insights and sentiment for Maya to use
// Never speaks to clients directly

export async function POST(request: NextRequest) {
  const start = Date.now()

  try {
    // ── Auth (accept session OR relay-internal) ───────────────────────────
    // Prevents unauthenticated LLM-cost abuse (esp. PDF extraction is pricey).
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'scout',
        userId: null,
        source: null,
        outcome: 'unauthorized',
        statusCode: auth.status,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const contentType = request.headers.get('content-type') ?? ''

    // ── Mode 1: Process a product PDF ─────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

      // Size guard: bail before we pay Anthropic for a massive PDF
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large — max 20MB' }, { status: 400 })
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
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
                text: `You are Scout, a product intelligence agent for Espresso, a financial advisory platform in Singapore. You have deep knowledge of Singapore insurance products AND investment products including unit trusts, ETFs, ILPs (investment-linked policies), annuities, and structured products. You know all major fund houses (Lion Global, Fullerton, Nikko AM, Aberdeen, Schroders, BlackRock), platforms (FSMOne, Endowus, Phillip, POSB Invest-Saver), and insurers (AIA, Great Eastern, Prudential, Manulife, NTUC Income, Singlife).

Extract structured product data from this insurance product brochure or document. Return ONLY valid JSON with no other text.

{
  "insurer": "insurance company name",
  "productName": "full product name",
  "type": "Life | Health | Critical Illness | Disability | Motor | Travel | Property | Group Health | Group Life | Fire | PI | BI | Keyman | D&O | Cyber | Workers Comp | Public Liability | Marine",
  "targetMarket": "individual | sme | corporate | all",
  "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "premiumRange": "e.g. $X–$Y/month depending on age and health",
  "availableRiders": ["rider 1", "rider 2"],
  "exclusions": ["exclusion 1", "exclusion 2"],
  "minSumAssured": number or null,
  "maxSumAssured": number or null,
  "entryAgeMin": number or null,
  "entryAgeMaxe": number or null,
  "standoutFeatures": ["what makes this product distinctive"],
  "status": "active"
}

Use null for any fields not found in the document.`,
              },
            ],
          },
        ],
      })

      const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

      let product
      try {
        product = JSON.parse(rawText.replace(/```json|```/g, '').trim())
      } catch {
        return NextResponse.json({
          error: 'Scout could not extract product data from this PDF',
        }, { status: 422 })
      }

      await logAgentInvocation({
        agent: 'scout',
        userId: auth.userId,
        source: auth.source,
        outcome: 'ok',
        statusCode: 200,
        latencyMs: Date.now() - start,
        model: 'claude-sonnet-4-6',
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        metadata: { mode: 'pdf_extraction', fileSizeBytes: file.size },
      })
      return NextResponse.json({ success: true, product, mode: 'pdf_extraction' })
    }

    // ── Mode 2: Market intelligence query ─────────────────────────────────
    const { query, coverageType, insurer, clientType } = await request.json() as {
      query: string
      coverageType?: string
      insurer?: string
      clientType?: string
    }

    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are Scout, a product intelligence agent for Espresso, a financial advisory platform in Singapore. You have deep knowledge of Singapore insurance products AND investment products including unit trusts, ETFs, ILPs (investment-linked policies), annuities, and structured products. You know all major fund houses (Lion Global, Fullerton, Nikko AM, Aberdeen, Schroders, BlackRock), platforms (FSMOne, Endowus, Phillip, POSB Invest-Saver), and insurers (AIA, Great Eastern, Prudential, Manulife, NTUC Income, Singlife).

Your job is to give Maya (the client-facing agent) market intelligence about insurance products so she can make better recommendations.

QUERY: ${query}
${coverageType ? `COVERAGE TYPE: ${coverageType}` : ''}
${insurer ? `INSURER IN QUESTION: ${insurer}` : ''}
${clientType ? `CLIENT TYPE: ${clientType}` : ''}

Based on your knowledge of the Singapore insurance market, provide useful intelligence. Focus on:
- Product quality and reputation
- Common client complaints or praise
- How this product compares to alternatives
- Any recent changes or news about this insurer/product
- Recommendation on whether to push this product

Respond in this exact JSON format:
{
  "summary": "2-3 sentence market intelligence summary",
  "sentiment": "positive | neutral | negative | mixed",
  "clientFeedback": ["key feedback point 1", "key feedback point 2"],
  "alternatives": ["alternative product/insurer 1", "alternative product/insurer 2"],
  "recommendation": "push | neutral | caution",
  "recommendationReason": "one sentence reason",
  "mayaTip": "specific tip for Maya on how to position this in conversation"
}`,
        },
      ],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let intelligence
    try {
      intelligence = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch {
      return NextResponse.json({
        error: 'Scout could not generate market intelligence for this query',
      }, { status: 422 })
    }

    await logAgentInvocation({
      agent: 'scout',
      userId: auth.userId,
      source: auth.source,
      outcome: 'ok',
      statusCode: 200,
      latencyMs: Date.now() - start,
      model: 'claude-sonnet-4-6',
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      metadata: { mode: 'market_intelligence' },
    })
    return NextResponse.json({ success: true, intelligence, mode: 'market_intelligence' })
  } catch (err) {
    console.error('[scout] error:', err)
    await logAgentInvocation({
      agent: 'scout',
      userId: null,
      source: null,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Scout failed to respond' }, { status: 500 })
  }
}
