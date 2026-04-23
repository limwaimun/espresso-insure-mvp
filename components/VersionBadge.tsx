'use client'

import { useState } from 'react'

/**
 * Tiny floating badge showing which commit is currently deployed.
 * Reads from build-time env vars injected via next.config.ts.
 * Click to expand and see branch + build time.
 *
 * Displays as "local" in dev so you can instantly tell which env you're on.
 */
export default function VersionBadge() {
  const [expanded, setExpanded] = useState(false)

  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA || 'local'
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH || 'local'
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || ''

  const buildDate = buildTime
    ? new Date(buildTime).toLocaleString('en-SG', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : 'unknown'

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      title={expanded ? 'Click to collapse' : 'Click for build info'}
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        zIndex: 100,
        padding: expanded ? '6px 10px' : '3px 7px',
        background: '#FFFFFF',
        border: '0.5px solid #E8E2DA',
        borderRadius: 100,
        fontFamily: 'DM Mono, ui-monospace, monospace',
        fontSize: 10,
        color: '#9B9088',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        lineHeight: 1.3,
        transition: 'all 0.15s ease',
      }}
    >
      {expanded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div><span style={{ color: '#BA7517' }}>{branch}</span> @ <span style={{ color: '#1A1410' }}>{sha}</span></div>
          <div style={{ fontSize: 9 }}>built {buildDate}</div>
        </div>
      ) : (
        <span><span style={{ color: '#BA7517' }}>{branch === 'local' ? 'dev' : branch}</span> · {sha}</span>
      )}
    </div>
  )
}
