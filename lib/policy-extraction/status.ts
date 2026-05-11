import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { parsePolicySections } from './parse-sections'
import { parseAndEmbedPolicyChunks } from './chunk-and-embed'

/**
 * B-pe-18a — status wrappers for Layer B (sections) and Layer C (chunks).
 *
 * Layer A (parsePolicyBrief) writes its own parse_status column. These
 * wrappers add equivalent tracking for B and C without modifying the
 * parse functions themselves (which are 364 + 814 line files).
 *
 * Status vocabulary on policies table: pending / running / done / failed / skipped.
 *
 * Behavior:
 *   - running written immediately on entry (brief flash even for already_parsed paths)
 *   - done on ok=true OR ok=false with stage='already_parsed' (rows exist => previously parsed)
 *   - failed on any other ok=false path, or on a thrown error
 *   - all status writes are best-effort and never break the parse
 */

type Layer = 'sections' | 'chunks'

async function writeStatus(
  policyId: string,
  layer: Layer,
  status: 'running' | 'done' | 'failed',
  errorMsg?: string,
): Promise<void> {
  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { [`${layer}_status`]: status }
  if (status === 'running') {
    update[`${layer}_started_at`] = now
    update[`${layer}_error`] = null
  } else if (status === 'done') {
    update[`${layer}_completed_at`] = now
    update[`${layer}_error`] = null
  } else {
    update[`${layer}_completed_at`] = now
    update[`${layer}_error`] = (errorMsg ?? 'unknown error').slice(0, 1000)
  }
  try {
    await supabase.from('policies').update(update).eq('id', policyId)
  } catch {
    // best-effort — status write must never break the parse
  }
}

export async function parsePolicySectionsWithStatus(
  policyId: string,
  options?: Parameters<typeof parsePolicySections>[1],
): ReturnType<typeof parsePolicySections> {
  await writeStatus(policyId, 'sections', 'running')
  try {
    const result = await parsePolicySections(policyId, options)
    const isDone =
      result.ok ||
      (!result.ok && result.stage === 'already_parsed')
    await writeStatus(
      policyId,
      'sections',
      isDone ? 'done' : 'failed',
      result.ok ? undefined : result.error,
    )
    return result
  } catch (err) {
    await writeStatus(policyId, 'sections', 'failed', (err as Error).message)
    throw err
  }
}

export async function parseAndEmbedPolicyChunksWithStatus(
  policyId: string,
  options?: Parameters<typeof parseAndEmbedPolicyChunks>[1],
): ReturnType<typeof parseAndEmbedPolicyChunks> {
  await writeStatus(policyId, 'chunks', 'running')
  try {
    const result = await parseAndEmbedPolicyChunks(policyId, options)
    const isDone =
      result.ok ||
      (!result.ok && result.stage === 'already_parsed')
    await writeStatus(
      policyId,
      'chunks',
      isDone ? 'done' : 'failed',
      result.ok ? undefined : result.error,
    )
    return result
  } catch (err) {
    await writeStatus(policyId, 'chunks', 'failed', (err as Error).message)
    throw err
  }
}
