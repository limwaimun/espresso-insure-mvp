// ── Date formatting utilities ────────────────────────────────────────────────

export const formatDate = (d: string | null | undefined) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

export const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '—'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}
