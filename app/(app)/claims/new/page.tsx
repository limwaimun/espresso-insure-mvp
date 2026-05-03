'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  company: string | null
}

interface Policy {
  id: string
  policy_number: string | null
  insurer: string | null
  type: string | null
}

const CLAIM_TYPES = [
  'Health', 'Life', 'Critical Illness', 'Disability',
  'Personal Accident', 'Motor', 'Travel', 'Property', 'Other',
]

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#120A06',
  border: '1px solid #2E1A0E',
  borderRadius: 8,
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#F5ECD7',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 200ms ease-in-out',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '0.75rem',
  color: '#C9B99A',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
}

export default function NewClaimPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const preSelectedClientId = searchParams.get('client_id')

  const [clients, setClients] = useState<Client[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    client_id: preSelectedClientId || '',
    policy_id: '',
    title: '',
    body: '',
    claim_type: 'Health',
    priority: 'medium',
    incident_date: '',
    estimated_amount: '',
  })

  // Load clients on mount
  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, company')
      .order('name')
      .then(({ data }) => {
        if (data) setClients(data as Client[])
      })
  }, [supabase])

  // Load policies when client changes
  useEffect(() => {
    if (!form.client_id) {
      setPolicies([])
      return
    }
    setLoadingPolicies(true)
    supabase
      .from('policies')
      .select('id, policy_number, insurer, type')
      .eq('client_id', form.client_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPolicies(data as Policy[])
        setLoadingPolicies(false)
      })
  }, [supabase, form.client_id])

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id || !form.title.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          policy_id: form.policy_id || undefined,
          title: form.title,
          body: form.body || undefined,
          claim_type: form.claim_type,
          priority: form.priority,
          incident_date: form.incident_date || undefined,
          estimated_amount: form.estimated_amount || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create claim')
      }

      router.push('/claims')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create claim')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    ...inputBase,
    borderColor: focused ? '#C8813A' : '#2E1A0E',
  })

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', maxWidth: 720 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/claims"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#C9B99A',
            textDecoration: 'none',
          }}
        >
          ← Back to Claims
        </Link>
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '2.25rem',
        fontWeight: 500,
        color: '#F5ECD7',
        margin: '0 0 4px',
      }}>
        Create Claim
      </h1>
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.875rem',
        color: '#C9B99A',
        margin: '0 0 28px',
      }}>
        Submit a new insurance claim for a client
      </p>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#3D1A1A',
          border: '1px solid #D06060',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          color: '#D06060',
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Row: Client + Policy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Client *</label>
            <select
              value={form.client_id}
              onChange={e => {
                updateField('client_id', e.target.value)
                updateField('policy_id', '')
              }}
              required
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` — ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Policy (optional)</label>
            <select
              value={form.policy_id}
              onChange={e => updateField('policy_id', e.target.value)}
              style={{ ...inputBase, cursor: form.client_id ? 'pointer' : 'not-allowed' }}
              disabled={!form.client_id}
            >
              <option value="">{loadingPolicies ? 'Loading...' : 'No policy selected'}</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policy_number || p.insurer || p.type || p.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Claim Title *</label>
          <input
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="e.g. Health insurance claim — clinic visit"
            required
            style={inputBase}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description (optional)</label>
          <textarea
            value={form.body}
            onChange={e => updateField('body', e.target.value)}
            placeholder="Details about the claim, incident, or any relevant information..."
            rows={3}
            style={{ ...inputBase, resize: 'vertical', minHeight: 80 }}
          />
        </div>

        {/* Row: Claim Type + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Claim Type</label>
            <select
              value={form.claim_type}
              onChange={e => updateField('claim_type', e.target.value)}
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              {CLAIM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={form.priority}
              onChange={e => updateField('priority', e.target.value)}
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Row: Incident Date + Estimated Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Incident Date (optional)</label>
            <input
              type="date"
              value={form.incident_date}
              onChange={e => updateField('incident_date', e.target.value)}
              style={{ ...inputBase, colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Estimated Amount (optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.estimated_amount}
              onChange={e => updateField('estimated_amount', e.target.value)}
              placeholder="0.00"
              style={inputBase}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
          paddingTop: 20,
          borderTop: '1px solid #2E1A0E',
        }}>
          <button
            type="submit"
            disabled={saving || !form.client_id || !form.title.trim()}
            style={{
              background: saving || !form.client_id || !form.title.trim() ? '#5A3D2A' : '#C8813A',
              color: saving || !form.client_id || !form.title.trim() ? '#C9B99A' : '#1C0F0A',
              border: 'none',
              borderRadius: 8,
              padding: '12px 28px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              fontWeight: 500,
              cursor: saving || !form.client_id || !form.title.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease-in-out',
            }}
          >
            {saving ? 'Submitting...' : 'Create Claim'}
          </button>

          <Link
            href="/claims"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 28px',
              background: 'transparent',
              border: '1px solid #2E1A0E',
              borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: '#C9B99A',
              textDecoration: 'none',
              transition: 'color 200ms, border-color 200ms',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
