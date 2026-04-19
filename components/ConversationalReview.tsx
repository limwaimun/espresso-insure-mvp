'use client'

import React, { useState } from 'react'

export interface ImportIssue {
  clientId: string
  clientName: string
  policyIndex: number | null
  field: string
  label: string
  question: string
  currentValue: string | null
  inputType: 'date' | 'number' | 'text' | 'select' | 'confirm'
  selectOptions?: string[]
  severity: 'warning' | 'info'
}

interface Answer {
  issueIndex: number
  action: 'fixed' | 'skipped' | 'confirmed'
  value?: string
}

export default function ConversationalReview({
  issues,
  onComplete,
}: {
  issues: ImportIssue[]
  onComplete: (answers: Answer[]) => void
}) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)

  const issue = issues[current]
  const progress = current / issues.length
  const isLast = current === issues.length - 1

  function answer(action: 'fixed' | 'skipped' | 'confirmed', value?: string) {
    const newAnswers = [...answers, { issueIndex: current, action, value }]
    setAnswers(newAnswers)
    setInputValue('')
    setShowInput(false)
    if (isLast) {
      onComplete(newAnswers)
    } else {
      setCurrent(c => c + 1)
    }
  }

  function skip() { answer('skipped') }
  function confirm() { answer('confirmed') }
  function fix() {
    if (!inputValue.trim()) return
    answer('fixed', inputValue.trim())
  }

  if (!issue) return null

  const fixedCount = answers.filter(a => a.action === 'fixed').length
  const skippedCount = answers.filter(a => a.action === 'skipped').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>
            Issue {current + 1} of {issues.length}
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>
            {fixedCount} fixed · {skippedCount} skipped
          </span>
        </div>
        <div style={{ background: '#F1EFE8', borderRadius: 100, height: 4 }}>
          <div style={{ background: '#BA7517', height: '100%', width: `${progress * 100}%`, borderRadius: 100, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Issue card */}
      <div style={{ flex: 1 }}>
        {/* Client + context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEF3E2', border: '0.5px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            {issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
          </div>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#1A1410' }}>{issue.clientName}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{issue.label}</div>
          </div>
        </div>

        {/* Question bubble */}
        <div style={{ background: '#F7F4F0', borderRadius: '0 12px 12px 12px', padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', lineHeight: 1.6 }}>
            {issue.question}
          </div>
          {issue.currentValue && (
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088', marginTop: 6 }}>
              Current value: <span style={{ fontFamily: 'DM Mono, monospace', color: '#5F5A57' }}>{issue.currentValue}</span>
            </div>
          )}
        </div>

        {/* Input area (shown when FA clicks "Yes, I'll fix it") */}
        {showInput && (
          <div style={{ marginBottom: 16 }}>
            {issue.inputType === 'select' ? (
              <select
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #BA7517', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFF', outline: 'none' }}
              >
                <option value="">Select…</option>
                {issue.selectOptions?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={issue.inputType}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={
                  issue.inputType === 'date' ? 'YYYY-MM-DD' :
                  issue.inputType === 'number' ? 'Enter amount' :
                  'Enter value'
                }
                autoFocus
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #BA7517', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#1A1410', background: '#FFF', outline: 'none', boxSizing: 'border-box' as const }}
                onKeyDown={e => { if (e.key === 'Enter' && inputValue.trim()) fix() }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={fix}
                disabled={!inputValue.trim()}
                style={{ flex: 1, background: inputValue.trim() ? '#BA7517' : '#D3D1C7', border: 'none', borderRadius: 8, padding: '10px 0', cursor: inputValue.trim() ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#FFF' }}
              >
                Save →
              </button>
              <button
                onClick={() => { setShowInput(false); setInputValue('') }}
                style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#5F5A57' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showInput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {issue.inputType === 'confirm' ? (
              <>
                <button onClick={skip} style={{ background: '#1A1410', border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFF', textAlign: 'center' }}>
                  Yes, same person — skip duplicate
                </button>
                <button onClick={confirm} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', textAlign: 'center' }}>
                  No, different people — import both
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowInput(true)} style={{ background: '#1A1410', border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#FFF', textAlign: 'center' }}>
                  Yes — let me enter it
                </button>
                <button onClick={confirm} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 8, padding: '12px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#5F5A57', textAlign: 'center' }}>
                  Import as-is
                </button>
                <button onClick={skip} style={{ background: 'transparent', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#B4B2A9', textAlign: 'center' }}>
                  Skip this client
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper: extract issues from parsed clients ───────────────────────────────
export function extractIssues(clients: any[]): ImportIssue[] {
  const issues: ImportIssue[] = []

  for (const client of clients) {
    if (!client._selected) continue

    // Missing or past renewal dates
    client.policies?.forEach((p: any, pi: number) => {
      if (!p.renewal_date) {
        issues.push({
          clientId: client._id,
          clientName: client.name,
          policyIndex: pi,
          field: 'renewal_date',
          label: `${p.insurer || 'Policy'} · ${p.type || ''}`,
          question: `${client.name}'s ${p.type || 'policy'} with ${p.insurer || 'unknown insurer'} has no renewal date. Do you know when it renews?`,
          currentValue: null,
          inputType: 'date',
          severity: 'warning',
        })
      } else if (new Date(p.renewal_date) < new Date()) {
        issues.push({
          clientId: client._id,
          clientName: client.name,
          policyIndex: pi,
          field: 'renewal_date',
          label: `${p.insurer || 'Policy'} · ${p.type || ''}`,
          question: `${client.name}'s ${p.type || 'policy'} renewal date (${p.renewal_date}) is in the past. Has this policy already renewed? What's the new renewal date?`,
          currentValue: p.renewal_date,
          inputType: 'date',
          severity: 'warning',
        })
      }

      if (!p.premium || p.premium <= 0) {
        issues.push({
          clientId: client._id,
          clientName: client.name,
          policyIndex: pi,
          field: 'premium',
          label: `${p.insurer || 'Policy'} · ${p.type || ''}`,
          question: `${client.name}'s ${p.type || 'policy'} with ${p.insurer || 'unknown insurer'} has no premium amount. Do you know the annual premium?`,
          currentValue: null,
          inputType: 'number',
          severity: 'warning',
        })
      }

      if (!p.insurer) {
        issues.push({
          clientId: client._id,
          clientName: client.name,
          policyIndex: pi,
          field: 'insurer',
          label: `${p.type || 'Unknown policy'}`,
          question: `${client.name} has a ${p.type || 'policy'} with no insurer recorded. Which insurer is this with?`,
          currentValue: null,
          inputType: 'select',
          selectOptions: ['AIA', 'Great Eastern', 'Prudential', 'NTUC Income', 'Manulife', 'AXA', 'Zurich', 'AIG', 'Tokio Marine', 'Singlife', 'FWD', 'Etiqa', 'Other'],
          severity: 'warning',
        })
      }
    })

    // Fuzzy duplicate warning
    if (client._matchType === 'fuzzy' && client._existingName) {
      issues.push({
        clientId: client._id,
        clientName: client.name,
        policyIndex: null,
        field: '_duplicate',
        label: 'Possible duplicate',
        question: `"${client.name}" looks like it could be the same person as existing client "${client._existingName}" (${client._matchScore}% name match). Are they the same person?`,
        currentValue: null,
        inputType: 'confirm',
        severity: 'warning',
      })
    }
  }

  return issues
}
