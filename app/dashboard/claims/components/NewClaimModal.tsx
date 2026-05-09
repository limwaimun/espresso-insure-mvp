'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/Modal'
import AddClaimModal from '@/app/dashboard/clients/components/AddClaimModal'
import { inputStyle, labelStyle, btnPrimary } from '@/lib/styles'
import type { Policy } from '@/lib/types'

interface ClientLite {
  id: string
  name: string
  company: string | null
}

interface NewClaimModalProps {
  faId: string
  onClose: () => void
  onCreated: () => void
}

/**
 * Standalone-page wrapper around AddClaimModal.
 *
 * Step 1: pick a client.
 * Step 2: load that client's policies, render AddClaimModal.
 *
 * AddClaimModal requires { clientId, faId, policies, onClose, onCreated }
 * and we satisfy all five.
 */
export default function NewClaimModal({ faId, onClose, onCreated }: NewClaimModalProps) {
  // Wrap the zero-arg onCreated so AddClaimModal's (activityText: string) => void is satisfied.
  const handleCreated = (_activityText: string) => onCreated()
  const supabase = createClient()
  const [clients, setClients] = useState<ClientLite[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [policies, setPolicies] = useState<Policy[] | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingPolicies, setLoadingPolicies] = useState(false)

  // Load clients on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, company')
        .order('name')
      if (!cancelled) {
        setClients((data ?? []) as ClientLite[])
        setLoadingClients(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Once a client is selected, load their policies.
  async function handleConfirmClient() {
    if (!selectedClientId) return
    setLoadingPolicies(true)
    const { data } = await supabase
      .from('policies')
      .select('*')
      .eq('client_id', selectedClientId)
      .order('created_at', { ascending: false })
    setPolicies((data ?? []) as Policy[])
    setLoadingPolicies(false)
  }

  // If we have a selected client AND policies loaded, defer fully to AddClaimModal.
  if (selectedClientId && policies !== null) {
    return (
      <AddClaimModal
        clientId={selectedClientId}
        faId={faId}
        policies={policies}
        onClose={onClose}
        onCreated={handleCreated}
      />
    )
  }

  // Step 1 UI: client picker.
  return (
    <Modal title="New claim" onClose={onClose}>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Client</label>
        {loadingClients ? (
          <div style={{ fontSize: 13, color: '#9B9088', padding: '8px 0' }}>Loading clients…</div>
        ) : clients.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9B9088', padding: '8px 0' }}>
            No clients yet. Add a client first, then file a claim from their detail page.
          </div>
        ) : (
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={inputStyle}
            disabled={loadingPolicies}
          >
            <option value="">Select a client…</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` — ${c.company}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: '0.5px solid #E8E2DA',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#1A1410',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmClient}
          disabled={!selectedClientId || loadingPolicies}
          style={{
            ...btnPrimary,
            opacity: (!selectedClientId || loadingPolicies) ? 0.5 : 1,
            cursor: (!selectedClientId || loadingPolicies) ? 'not-allowed' : 'pointer',
          }}
        >
          {loadingPolicies ? 'Loading…' : 'Continue'}
        </button>
      </div>
    </Modal>
  )
}
