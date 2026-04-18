import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Intent classification ──────────────────────────────────────────────────

type Intent =
  | 'product_research'   // Scout: research a specific product or insurer
  | 'premium_estimate'   // Sage: estimate premiums for a client
  | 'policy_comparison'  // Compass: compare policies across insurers
  | 'claim_prefill'      // Atlas: pre-fill a claim form
  | 'portfolio_report'   // Lens: FA portfolio analytics
  | 'renewal_pipeline'   // Lens: upcoming renewals
  | 'coverage_gap'       // Compass: identify coverage gaps for a client
  | 'unknown'

interface RelayRequest {
  message: string          // Natural language request
  ifaId: string
  clientId?: string        // Optional context
  context?: Record<string, unknown>  // Any additional context
}

interface RouteResult {
  intent: Intent
  agentUrl: string
  agentPayload: Record<string, unknown>
  summary: string          // Human-readable explanation of what Relay is doing
}

async function classifyIntent(message: string, hasClientContext: boolean): Promise<{ intent: Intent; params: Record<string, string> }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Classify this request from a financial advisor into exactly ONE intent category.

Request: "${message}"

Categories:
- product_research: looking up a specific insurance product, insurer info, or product PDF
- premium_estimate: estimating how much a policy would cost for a client
- policy_comparison: comparing multiple policies or insurers side by side
- claim_prefill: helping with a claims form, starting a claim, claim paperwork
- portfolio_report: overview of the FA's entire client portfolio or business metrics
- renewal_pipeline: upcoming policy renewals, renewal dates, expiring policies
- coverage_gap: what coverage a client is missing, what they should add
- unknown: doesn't fit any category

Also extract any key parameters (insurer, product_type, coverage_type, form_type).

Respond in JSON only:
{
  "intent": "<category>",
  "params": {
    "insurer": "<insurer name or null>",
    "product_type": "<product type or null>",
    "coverage_type": "<coverage type or null>"
  }
}`
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text || '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { intent: 'unknown', params: {} }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, ifaId, clientId, context } = await request.json() as RelayRequest

    if (!message || !ifaId) {
      return NextResponse.json({ error: 'Missing message or ifaId' }, { status: 400 })
    }

    // ── Classify intent ────────────────────────────────────────────────────
    const { intent, params } = await classifyIntent(message, !!clientId)

    // ── Load client context if available ───────────────────────────────────
    let client = null
    let policies = null
    if (clientId) {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('policies').select('*').eq('client_id', clientId),
      ])
      client = c
      policies = p
    }

    // ── Route to appropriate agent ─────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://espresso-mvp.vercel.app'

    let route: RouteResult

    switch (intent) {
      case 'product_research':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/scout`,
          agentPayload: {
            ifaId,
            query: message,
            insurer: params.insurer,
            productType: params.product_type,
          },
          summary: `Routing to Scout to research ${params.insurer || 'insurance'} products`,
        }
        break

      case 'premium_estimate':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/sage`,
          agentPayload: {
            ifaId,
            clientId,
            client,
            query: message,
            coverageType: params.coverage_type || params.product_type,
          },
          summary: `Routing to Sage for premium estimate on ${params.coverage_type || 'coverage'}`,
        }
        break

      case 'policy_comparison':
      case 'coverage_gap':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/compass`,
          agentPayload: {
            ifaId,
            clientId,
            client,
            policies,
            query: message,
            mode: intent === 'coverage_gap' ? 'gap_analysis' : 'comparison',
            coverageType: params.coverage_type || params.product_type,
            insurer: params.insurer,
          },
          summary: intent === 'coverage_gap'
            ? `Routing to Compass to analyse coverage gaps`
            : `Routing to Compass to compare ${params.coverage_type || 'policies'} across insurers`,
        }
        break

      case 'claim_prefill':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/atlas`,
          agentPayload: {
            ifaId,
            clientId,
            query: message,
            insurer: params.insurer,
            formType: params.product_type,
          },
          summary: `Routing to Atlas to handle ${params.insurer || 'insurance'} claim`,
        }
        break

      case 'portfolio_report':
      case 'renewal_pipeline':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/lens`,
          agentPayload: {
            ifaId,
            reportType: intent === 'renewal_pipeline' ? 'renewals' : 'portfolio',
            query: message,
          },
          summary: intent === 'renewal_pipeline'
            ? 'Routing to Lens for renewal pipeline report'
            : 'Routing to Lens for portfolio analytics',
        }
        break

      default:
        return NextResponse.json({
          intent: 'unknown',
          message: 'I\'m not sure which agent can help with that. Could you clarify whether you\'re looking to research a product, get a premium estimate, compare policies, help with a claim, or get a portfolio report?',
        })
    }

    // ── Call the target agent ──────────────────────────────────────────────
    const agentRes = await fetch(route.agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-relay-key': process.env.SUPABASE_SECRET_KEY!, // Internal auth
      },
      body: JSON.stringify(route.agentPayload),
    })

    const agentData = await agentRes.json()

    return NextResponse.json({
      intent: route.intent,
      summary: route.summary,
      agent: route.agentUrl.split('/api/')[1],
      result: agentData,
    })

  } catch (err) {
    console.error('[relay] error:', err)
    return NextResponse.json({ error: 'Relay failed' }, { status: 500 })
  }
}
