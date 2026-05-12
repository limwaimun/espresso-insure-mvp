import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin'
import { resolveAgentModel } from '@/lib/agent-model'

const AGENTS = [
  'maya',
  'relay',
  'scout',
  'sage',
  'compass',
  'atlas',
  'lens',
  'harbour',
  'whatsapp',
]

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const models = AGENTS.map(agent => ({
    agent,
    model: resolveAgentModel(agent),
  }))

  return NextResponse.json({ models })
}
