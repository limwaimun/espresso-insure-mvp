'use client'

import { useEffect, useState } from 'react'

export default function AnthropicLimitBanner() {
  const [resumeDate, setResumeDate] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/admin/executions')
      .then(r => r.json())
      .then(data => {
        const failures: { action: string; error: string }[] = data.recentFailures || []
        const limitError = failures.find(
          f => f.action === 'brain_tick' && f.error.includes('API usage limits')
        )
        if (!limitError) return
        const match = limitError.error.match(/You will regain access on ([^."]+)/)
        if (match) setResumeDate(match[1].trim())
        setVisible(true)
      })
      .catch(() => {})
  }, [])

  if (!visible) return null

  return (
    <div style={{
      background: 'rgba(186,117,23,0.08)',
      border: '1px solid rgba(186,117,23,0.35)',
      borderRadius: 10,
      padding: '14px 20px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 4 }}>
          Anthropic API usage limit reached — Brain ticks are failing
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6B6460' }}>
          {resumeDate
            ? `Access resumes: ${resumeDate}`
            : 'Check Anthropic console for plan limit details.'}
        </div>
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#BA7517', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}
        >
          Open Anthropic Console →
        </a>
      </div>
    </div>
  )
}
