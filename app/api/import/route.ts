import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySession } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const { userId, error: authError } = await verifySession(request)
    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 })
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await request.json()
    const { clients, policies, userId: _unused } = body

    if (_unused && _unused !== userId) {
      console.warn(`[import] ignored mismatched userId: body=${_unused} session=${userId}`)
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: 'No client data' }, { status: 400 })
    }

    // Policies is optional — clients-only import is allowed
    const policiesArray: any[] = Array.isArray(policies) ? policies : []

    // ── Admin client (service role — needed to bypass RLS on bulk insert) ─
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // ── Deduplicate clients by name (case-insensitive) and attach verified userId ──
    const uniqueClients = new Map()
    clients.forEach((client: any) => {
      const key = client.name?.toLowerCase().trim()
      if (!key) return

      if (!uniqueClients.has(key)) {
        // Normalize client type to valid enum values
        let clientType: 'individual' | 'sme' | 'corporate' = 'individual'
        if (client.type) {
          const typeLower = String(client.type).toLowerCase().trim()
          if (typeLower === 'sme' || typeLower === 'corporate') {
            clientType = typeLower as 'sme' | 'corporate'
          } else if (typeLower.includes('sme') || typeLower.includes('small') || typeLower.includes('medium')) {
            clientType = 'sme'
          } else if (typeLower.includes('corporate') || typeLower.includes('large') || typeLower.includes('enterprise')) {
            clientType = 'corporate'
          }
        }

        uniqueClients.set(key, {
          ...client,
          type: clientType,
          ifa_id: userId, // Use verified session userId, never body-supplied
        })
      }
    })

    const deduplicatedClients = Array.from(uniqueClients.values())

    // ── Insert clients ────────────────────────────────────────────────────
    const { data: insertedClients, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert(deduplicatedClients)
      .select('id, name')

    if (clientError) {
      console.error('[import] client insert error:', clientError.message)
      return NextResponse.json(
        { error: `Failed to insert clients: ${clientError.message}` },
        { status: 500 }
      )
    }

    // ── Build name-to-id map from inserted clients ────────────────────────
    const clientIdMap = new Map<string, string>()
    insertedClients?.forEach(client => {
      const key = client.name.toLowerCase().trim()
      clientIdMap.set(key, client.id)
    })

    // ── Defensive value coercers for DB enums ─────────────────────────────
    const validStatus = (s: unknown): string => {
      if (typeof s !== 'string') return 'active'
      const v = s.toLowerCase().trim()
      if (v === 'lapsed' || v === 'pending' || v === 'cancelled' || v === 'active') return v
      if (v.includes('lapsed') || v.includes('grace') || v.includes('expired')) return 'lapsed'
      if (v.includes('cancel') || v.includes('surrender') || v.includes('terminated')) return 'cancelled'
      if (v.includes('pending') || v.includes('progress') || v.includes('underwriting')) return 'pending'
      return 'active'
    }

    const validFrequency = (f: unknown): string | null => {
      if (typeof f !== 'string') return null
      const v = f.toLowerCase().trim()
      if (v === 'annual' || v === 'half-yearly' || v === 'quarterly' || v === 'monthly' || v === 'single') return v
      return null
    }

    // ── Prepare policies with client_id ───────────────────────────────────
    const policiesWithClientIds = policiesArray.map((policy: any) => {
      const clientName = policy.clientName || policy.client_name
      if (!clientName) {
        throw new Error(`Policy missing client name`)
      }

      const clientKey = String(clientName).toLowerCase().trim()
      const clientId = clientIdMap.get(clientKey)

      if (!clientId) {
        throw new Error(`Client not found for policy: ${clientName}`)
      }

      return {
        ifa_id: userId, // Use verified session userId
        client_id: clientId,
        insurer: policy.insurer || null,
        type: policy.type || null,
        product_name: policy.product_name || null,
        policy_number: policy.policy_number || null,
        premium: policy.premium || null,
        premium_frequency: validFrequency(policy.premium_frequency),
        sum_assured: policy.sum_assured || null,
        start_date: policy.start_date || null,
        renewal_date: policy.renewal_date || null,
        status: validStatus(policy.status),
        notes: policy.notes || null,
      }
    })

    // ── Insert policies (non-fatal — clients already inserted) ────────────
    let policiesImported = 0
    let policyInsertError: string | null = null

    if (policiesWithClientIds.length > 0) {
      try {
        const { data: insertedPolicies, error: policyError } = await supabaseAdmin
          .from('policies')
          .insert(policiesWithClientIds)
          .select('id')

        if (policyError) {
          policyInsertError = policyError.message
          console.error('[import] policy insert error:', policyError.message)
        } else {
          policiesImported = insertedPolicies?.length ?? 0
        }
      } catch (policyError: any) {
        policyInsertError = policyError?.message ?? 'Unknown policy insert error'
        console.error('[import] policy insert exception:', policyInsertError)
      }
    }

    // ── Auto-tier calculation (active policies only) ──────────────────────
    if (policiesImported > 0) {
      for (const [, clientId] of clientIdMap) {
        try {
          const { data: clientPolicies } = await supabaseAdmin
            .from('policies')
            .select('premium, status')
            .eq('client_id', clientId)
            .eq('status', 'active')
            .eq('ifa_id', userId) // Belt-and-suspenders scope

          const totalPremium = (clientPolicies || []).reduce(
            (sum, p) => sum + (Number(p.premium) || 0),
            0
          )

          let tier = 'bronze'
          if (totalPremium >= 10000) tier = 'platinum'
          else if (totalPremium >= 5000) tier = 'gold'
          else if (totalPremium >= 1000) tier = 'silver'

          await supabaseAdmin
            .from('clients')
            .update({ tier })
            .eq('id', clientId)
            .eq('ifa_id', userId) // Scope update to verified userId
        } catch (tierError) {
          console.error('[import] tier calc error for client', clientId, tierError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      clientsImported: insertedClients?.length ?? 0,
      policiesImported,
      policyError: policyInsertError,
      message: `Successfully imported ${insertedClients?.length ?? 0} clients and ${policiesImported} policies`,
    })
  } catch (error: any) {
    console.error('[import] error:', error?.message ?? error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
