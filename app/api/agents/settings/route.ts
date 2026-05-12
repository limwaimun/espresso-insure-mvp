// GET  → returns current per-agent model config
// POST → { agent: string, model: string } → upserts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminUser } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const SUPPORTED_MODELS = [
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5', note: 'Powerful, slower' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', note: 'Balanced (default)' },
  { id: 'claude-haiku-3-5', label: 'Claude Haiku 3.5', note: 'Fast, cost-efficient' },
]

const AGENTS = ['maya', 'relay', 'scout', 'sage', 'compass', 'atlas', 'lens', 'harbour', 'whatsapp']

const DEFAULT_MODEL = 'claude-sonnet-4-6'

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = supabase()
  const { data } = await sb
    .from('brain_settings')
    .select('key, value, updated_at, updated_by')
    .like('key', 'agent_model_%')

  const byAgent: Record<string, { model: string; updated_at: string; updated_by: string | null }> = {}
  for (const row of data ?? []) {
    const agent = row.key.replace('agent_model_', '')
    byAgent[agent] = { model: row.value, updated_at: row.updated_at, updated_by: row.updated_by }
  }

  return NextResponse.json({ agents: AGENTS, supported: SUPPORTED_MODELS, byAgent, defaultModel: DEFAULT_MODEL })
}

export async function POST(req: Request) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { agent, model } = body
  if (!agent || !model) return NextResponse.json({ error: 'Missing agent or model' }, { status: 400 })
  if (!AGENTS.includes(agent)) return NextResponse.json({ error: 'Unknown agent' }, { status: 400 })
  if (!SUPPORTED_MODELS.find(m => m.id === model)) return NextResponse.json({ error: 'Unsupported model' }, { status: 400 })

  const sb = supabase()
  const key = `agent_model_${agent}`
  const { data, error } = await sb
    .from('brain_settings')
    .upsert({ key, value: model, updated_at: new Date().toISOString(), updated_by: user.id ?? null }, { onConflict: 'key' })
    .select('key, value, updated_at, updated_by')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, row: data })
}
