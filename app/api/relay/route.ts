import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateAgentRequest } from '@/lib/agent-auth'
import { logAgentInvocation } from '@/lib/agent-log'
import { checkRateLimit } from '@/lib/agent-rate-limit'
import { resolveAgentModel } from '@/lib/agent-model'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Intent classification ──────────────────────────────────────────────────

type Intent =
  | 'product_research'
  | 'premium_estimate'
  | 'policy_comparison'
  | 'claim_prefill'
  | 'portfolio_report'
  | 'renewal_pipeline'
  | 'coverage_gap'
  | 'investment_research'    // Scout: research a fund or ETF
  | 'portfolio_review'       // Harbour: review client investment holdings
  | 'policy_lookup'          // Brief: factual questions about an EXISTING client policy
  | 'unknown'

interface RelayRequest {
  message: string          // Natural language request
  faId?: string           // Accepted for backward-compat but ignored (use auth)
  clientId?: string        // Optional context
  policyId?: string        // Optional — present when caller wants a specific policy
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
    model: resolveAgentModel('relay'),
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Classify this request from a financial advisor (or Maya acting on a client's behalf) into exactly ONE intent category.

Request: "${message}"

Categories:
- product_research: looking up a specific insurance product, insurer info, or product PDF (for products NOT yet on the client's books)
- premium_estimate: estimating how much a NEW policy would cost for a client
- policy_comparison: comparing multiple insurers' products side by side (market shopping)
- policy_lookup: questions about the FACTUAL CONTENTS of a client's EXISTING policy — what it covers, deductible, co-insurance, exclusions, sum assured, claim limit, what the policy specifically says about a procedure or condition. NOT market comparison.
- claim_prefill: helping with a claims form, starting a claim, claim paperwork
- portfolio_report: overview of the FA's entire client portfolio or business metrics
- renewal_pipeline: upcoming policy renewals, renewal dates, expiring policies
- coverage_gap: what coverage a client is MISSING and should ADD
- investment_research: researching a fund, ETF, or investment-linked product (not yet owned)
- portfolio_review: reviewing a client's investment holdings or overall investment portfolio
- unknown: doesn't fit any category

Key distinctions:
- "what does my policy cover for X?" → policy_lookup (read existing policy)
- "what's the best X policy on the market?" → policy_comparison (shop new)
- "what's missing from my coverage?" → coverage_gap (gap analysis)
- "what is my deductible / co-insurance / claim limit?" → policy_lookup

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
  const start = Date.now()
  let userId: string | undefined
  let authSource: 'session' | 'relay' | null = null
  try {
    // ── Auth (dual-auth: session for FA dashboard, x-relay-key for Maya) ──
    const auth = await authenticateAgentRequest(request)
    if (!auth.ok) {
      await logAgentInvocation({
        agent: 'relay',
        userId: null,
        source: null,
        outcome: 'unauthorized',
        statusCode: auth.status,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    userId = auth.userId
    authSource = auth.source

    // ── Rate limit ────────────────────────────────────────────────────────────
    const rl = checkRateLimit(userId, 'relay')
    if (!rl.allowed) {
      await logAgentInvocation({
        agent: 'relay',
        userId,
        source: authSource,
        outcome: 'rate_limited',
        statusCode: 429,
        latencyMs: Date.now() - start,
      })
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const { message, faId: _unused, clientId, policyId } = await request.json() as RelayRequest

    if (_unused && _unused !== userId) {
      console.warn(`[relay] ignored mismatched faId from body: body=${_unused} verified=${userId}`)
    }
    const resolvedUserId = userId as string

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    // ── Classify intent ────────────────────────────────────────────────────
    const { intent, params } = await classifyIntent(message, !!clientId)

    // ── Load client context if available (scoped to verified userId) ───────
    let client = null
    let policies = null
    if (clientId) {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).eq('fa_id', userId).single(),
        supabase.from('policies').select('*').eq('client_id', clientId).eq('fa_id', userId),
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

      case 'policy_lookup':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/brief`,
          agentPayload: {
            clientId,
            policyId,
            query: message,
          },
          summary: 'Routing to Brief for factual policy lookup',
        }
        break

      case 'claim_prefill':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/atlas`,
          agentPayload: {
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
            reportType: intent === 'renewal_pipeline' ? 'renewals' : 'portfolio',
            query: message,
          },
          summary: intent === 'renewal_pipeline'
            ? 'Routing to Lens for renewal pipeline report'
            : 'Routing to Lens for portfolio analytics',
        }
        break

      case 'investment_research':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/scout`,
          agentPayload: {
            query: message,
            productType: params.product_type,
            insurer: params.insurer,
          },
          summary: `Routing to Scout to research ${params.product_type || 'investment'} products`,
        }
        break

      case 'portfolio_review':
        route = {
          intent,
          agentUrl: `${baseUrl}/api/harbour`,
          agentPayload: {
            clientId,
            mode: clientId ? 'client_review' : 'review_report',
          },
          summary: clientId ? 'Routing to Harbour for client portfolio review' : 'Routing to Harbour for full portfolio review report',
        }
        break

      default:
        return NextResponse.json({
          intent: 'unknown',
          message: 'I\'m not sure which agent can help with that. Could you clarify whether you\'re looking to research a product, get a premium estimate, compare policies, look up what an existing policy covers, help with a claim, or get a portfolio report?',
        })
    }

    // ── Call the target agent (internal auth via dedicated relay key) ─────
    // We pass the verified userId via header so agents can scope DB queries
    // without trusting any body field. The relay key is a dedicated secret
    // (not the Supabase service-role key).
    if (!process.env.RELAY_INTERNAL_KEY) {
      console.error('[relay] RELAY_INTERNAL_KEY not set — cannot invoke agents securely')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const agentRes = await fetch(route.agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-relay-key': process.env.RELAY_INTERNAL_KEY,
        'x-relay-user-id': userId,
      },
      body: JSON.stringify(route.agentPayload),
    })

    const agentData = await agentRes.json()

    await logAgentInvocation({
      agent: 'relay',
      userId: resolvedUserId,
      source: authSource,
      outcome: agentRes.ok ? 'ok' : 'error',
      statusCode: agentRes.status,
      latencyMs: Date.now() - start,
      model: resolveAgentModel('relay'),
      metadata: { intent: route.intent, subAgent: route.agentUrl.split('/api/')[1], hasClientId: !!clientId, hasPolicyId: !!policyId },
    })
    return NextResponse.json({
      intent: route.intent,
      summary: route.summary,
      agent: route.agentUrl.split('/api/')[1],
      result: agentData,
    })

  } catch (err) {
    console.error('[relay] error:', err)
    await logAgentInvocation({
      agent: 'relay',
      userId,
      source: authSource,
      outcome: 'error',
      statusCode: 500,
      latencyMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Relay failed' }, { status: 500 })
  }
}
