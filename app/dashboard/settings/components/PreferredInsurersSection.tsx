'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { Check, Building2 } from 'lucide-react'

const SG_INSURERS = [
  'AIA',
  'Great Eastern',
  'Prudential',
  'Manulife',
  'NTUC Income',
  'AXA',
  'Aviva',
  'Tokio Marine',
  'China Life',
  'Etiqa',
  'FWD',
  'Singlife',
  'Sun Life',
  'Zurich',
]

export default function PreferredInsurersSection() {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('preferred_insurers')
        .eq('id', user.id)
        .single()
      if (data?.preferred_insurers) setSelected(data.preferred_insurers)
    }
    load()
  }, [])

  function toggle(insurer: string) {
    setSelected(prev =>
      prev.includes(insurer)
        ? prev.filter(i => i !== insurer)
        : [...prev, insurer]
    )
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({ preferred_insurers: selected })
      .eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{
      background: '#120A06',
      border: '1px solid #2E1A0E',
      borderRadius: 12,
      padding: '28px 28px 24px',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={16} color="#C8813A" />
          <span style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 18, fontWeight: 400, color: '#F5ECD7',
          }}>
            My Preferred Insurers
          </span>
        </div>
        {selected.length > 0 && (
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 10, color: '#C8813A',
            background: '#3D2215',
            border: '1px solid #C8813A44',
            borderRadius: 100, padding: '2px 10px',
          }}>
            {selected.length} selected
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#C9B99A', marginBottom: 20, lineHeight: 1.6 }}>
        Maya will present these insurers more favourably when comparing or recommending products to clients.
      </p>

      {/* Insurer grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 8,
        marginBottom: 20,
      }}>
        {SG_INSURERS.map(insurer => {
          const isSelected = selected.includes(insurer)
          return (
            <button
              key={insurer}
              onClick={() => toggle(insurer)}
              style={{
                background: isSelected ? '#3D2215' : '#1C0F0A',
                border: `1px solid ${isSelected ? '#C8813A' : '#2E1A0E'}`,
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                transition: 'all 0.12s ease',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: 13,
                color: isSelected ? '#F5ECD7' : '#C9B99A',
                fontWeight: isSelected ? 500 : 300,
              }}>
                {insurer}
              </span>
              {isSelected && (
                <Check size={13} color="#C8813A" style={{ flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: '#C8813A',
            color: '#120A06',
            border: 'none',
            borderRadius: 7,
            padding: '9px 22px',
            fontSize: 13,
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'opacity 0.12s',
          }}
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: '#5AB87A', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} />
            Saved — Maya will use these preferences
          </span>
        )}
      </div>
    </div>
  )
}
