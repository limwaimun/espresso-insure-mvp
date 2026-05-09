'use client'

/**
 * Maya Playground — dev/training sandbox
 * ─────────────────────────────────────────
 * This route is deliberately isolated from the production WhatsApp flow.
 * It exists so Wayne (and future prompt engineers) can simulate
 * client-FA-Maya interactions in the browser to train and iterate on
 * Maya's prompts, tool definitions, and reply behavior — without
 * sending real messages or writing to real client conversations.
 *
 * Production architecture (confirmed):
 *   Real clients → WhatsApp → app/api/whatsapp/webhook/route.ts → Maya
 *
 * This playground will not participate in that flow. Post-launch, the
 * playground will be restricted to the SIT (non-production) environment
 * only, used for testing prompt and behavior changes before promotion.
 *
 * IMPORTANT: playground and webhook are currently SEPARATE code paths
 * with their own prompts, tools, and context builders. Any Maya
 * behavior change made here must also be applied manually to the
 * WhatsApp webhook (and vice versa) until the two paths are refactored
 * to share logic (via e.g. lib/maya/).
 */


import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, Eye, EyeOff, RotateCcw, Paperclip, X, FileText, Image, Zap, ArrowLeft } from 'lucide-react'
import type { Policy } from '@/lib/types'

interface Client {
  id: string
  name: string
  company?: string
  type: 'individual' | 'sme' | 'corporate'
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  whatsapp?: string
  email?: string
  birthday?: string
}

interface Attachment {
  name: string
  type: 'image' | 'pdf'
  mediaType: string
  base64: string
  previewUrl?: string
}

interface Message {
  id: string
  role: 'client' | 'ifa' | 'maya'
  content: string
  timestamp: Date
  thinking?: string
  attachments?: Attachment[]
}

const TIER_COLORS: Record<string, string> = {
  platinum: '#7A7A7A',
  gold: '#BA7517',
  silver: '#9B9088',
  bronze: '#CD7F32',
}

const QUICK_PROMPTS = [
  'When is my policy renewing?',
  'I was in a car accident',
  'What am I covered for?',
  'Can I upgrade my coverage?',
  'I was just diagnosed with cancer',
  'How much is my premium?',
]

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export default function MayaPlaygroundPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#6B6460', fontFamily: 'DM Sans, sans-serif' }}>Loading Maya Playground…</div>}>
      <MayaPlaygroundInner />
    </Suspense>
  )
}

function MayaPlaygroundInner() {
  const searchParams = useSearchParams()
  const preloadClientId = searchParams.get('clientId')

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [claims, setClaims] = useState<{ id: string; title: string; status: string; priority: string; daysSinceUpdate: number }[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [speakingAs, setSpeakingAs] = useState<'client' | 'ifa'>('client')
  const [isLoading, setIsLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [ifaName, setIfaName] = useState('Your Advisor')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [preferredInsurers, setPreferredInsurers] = useState<string[]>([])
  const [ifaId, setIfaId] = useState<string>('')
  const isMobile = useIsMobile(768)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationSummary, setConversationSummary] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadClients()
    loadIfaProfile()
  }, [])

  // Auto-select client from URL param once clients are loaded
  useEffect(() => {
    if (preloadClientId && clients.length > 0 && !selectedClient) {
      const match = clients.find(c => c.id === preloadClientId)
      if (match) setSelectedClient(match)
    }
  }, [preloadClientId, clients])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedClient) {
      loadPolicies(selectedClient.id)
      loadClaims(selectedClient.id)
      if (ifaId) {
        loadConversationHistory(selectedClient.id)
      }
      setAttachments([])
      inputRef.current?.focus()
    }
  }, [selectedClient, ifaId])

  async function loadConversationHistory(clientId: string) {
    if (!ifaId) return
    setHistoryLoading(true)
    setMessages([])
    setSystemPrompt('')
    setConversationId(null)
    setConversationSummary(null)
    try {
      const res = await fetch(`/api/maya-playground?ifaId=${ifaId}&clientId=${clientId}`)
      const data = await res.json()
      if (data.conversationId) {
        setConversationId(data.conversationId)
        setConversationSummary(data.summary)
        if (data.messages?.length > 0) {
          setMessages(data.messages.map((m: { role: string; content: string }, i: number) => ({
            id: `history-${i}`,
            role: m.role as 'client' | 'ifa' | 'maya',
            content: m.content,
            timestamp: new Date(),
          })))
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
      inputRef.current?.focus()
    }
  }

  async function loadIfaProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIfaId(user.id)
      const { data } = await supabase.from('profiles').select('name, company, preferred_insurers').eq('id', user.id).single()
      if (data?.name) setIfaName(data.name)
      if (data?.preferred_insurers && Array.isArray(data.preferred_insurers)) {
        setPreferredInsurers(data.preferred_insurers)
      }
    } catch (err) {
      console.error('[loadIfaProfile] error:', err)
    }
  }

  async function loadClients() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clients').select('*').eq('ifa_id', user.id).order('name')
      if (data) setClients(data)
    } catch (err) {
      console.error('[loadClients] error:', err)
    }
  }

  async function loadPolicies(clientId: string) {
    try {
      const { data } = await supabase
        .from('policies')
        .select('*')
        .eq('client_id', clientId)
        .order('renewal_date')
      if (data) setPolicies(data)
    } catch (err) {
      console.error('[loadPolicies] error:', err)
    }
  }

  async function loadClaims(clientId: string) {
    try {
      const { data } = await supabase
        .from('alerts')
        .select('id, title, resolved, status, priority, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (data) {
        // Filter to claims only — type column may not exist on all rows
        const claimRows = data.filter((c: any) => !c.type || c.type === 'claim' || c.type === 'client_message')
        setClaims(claimRows.map((c: any) => ({
          id: c.id,
          title: c.title || 'Untitled claim',
          status: c.resolved ? 'resolved' : (c.status || 'open'),
          priority: c.priority || 'medium',
          daysSinceUpdate: Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        })))
      }
    } catch (err) {
      console.error('[loadClaims] error:', err)
      setClaims([]) // Non-fatal — just show empty
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const newAttachments: Attachment[] = []

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > 10 * 1024 * 1024) continue // 10MB limit

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // strip data:xxx;base64, prefix
        }
        reader.readAsDataURL(file)
      })

      const isImage = file.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined

      newAttachments.push({
        name: file.name,
        type: isImage ? 'image' : 'pdf',
        mediaType: file.type,
        base64,
        previewUrl,
      })
    }

    setAttachments(prev => [...prev, ...newAttachments])
    // reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments(prev => {
      const next = [...prev]
      if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl!)
      next.splice(index, 1)
      return next
    })
  }

  async function sendMessage(overrideInput?: string) {
    const text = (overrideInput ?? input).trim()
    if ((!text && attachments.length === 0) || !selectedClient || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: speakingAs,
      content: text,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
    setIsLoading(true)

    try {
      const res = await fetch('/api/maya-playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selectedClient,
          policies,
          claims,
          ifaName,
          preferredInsurers,
          ifaId,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments?.map(a => ({
              type: a.type,
              mediaType: a.mediaType,
              base64: a.base64,
              name: a.name,
            })),
          })),
          speakingAs,
        }),
      })

      const data = await res.json()
      if (data.systemPrompt) setSystemPrompt(data.systemPrompt)
      if (data.claimsUpdated && selectedClient) loadClaims(selectedClient.id)

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'maya',
          content: data.response,
          timestamp: new Date(),
          thinking: data.thinking ?? undefined,
        },
      ])
    } catch (err) {
      console.error('Maya error:', err)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function resetConversation() {
    setMessages([])
    setSystemPrompt('')
    setAttachments([])
    inputRef.current?.focus()
  }

  const getRenewalDays = (date: string | null | undefined) => {
    if (!date) return 9999
    const d = new Date(date).getTime()
    if (isNaN(d)) return 9999
    return Math.ceil((d - Date.now()) / 86400000)
  }

  const getRenewalColor = (days: number) => {
    if (days < 0) return '#D06060'
    if (days <= 30) return '#D06060'
    if (days <= 60) return '#854F0B'
    if (days <= 90) return '#BA7517'
    return '#3A7D5A'
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#FFFFFF', overflow: 'hidden', fontFamily: 'DM Sans, sans-serif', position: 'relative' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: isMobile ? '100%' : 272,
        flexShrink: 0,
        background: '#F7F4F0',
        borderRight: '1px solid #E8E2DA',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: isMobile ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        height: '100%',
        zIndex: isMobile ? 10 : 'auto',
        transform: isMobile && selectedClient ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 250ms ease-out',
      }}>
        <div style={{ padding: '18px 14px 12px', borderBottom: '1px solid #E8E2DA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Bot size={15} color="#BA7517" />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#1A1410', letterSpacing: '0.02em' }}>Maya Playground</span>
          </div>
          <p style={{ fontSize: 11, color: '#6B6460', margin: 0 }}>Select a client to start training</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {clients.map(client => (
            <button key={client.id} onClick={() => setSelectedClient(client)} style={{ width: '100%', background: selectedClient?.id === client.id ? 'rgba(186,117,23,0.08)' : 'transparent', border: `1px solid ${selectedClient?.id === client.id ? '#BA7517' : 'transparent'}`, borderRadius: 8, padding: '9px 11px', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'all 0.12s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 13, color: '#1A1410', fontWeight: 500 }}>{client.name}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: TIER_COLORS[client.tier], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{client.tier}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#6B6460', background: '#E8E2DA', padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize' }}>{client.type}</span>
                {client.company && <span style={{ fontSize: 10, color: '#6B6460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.company}</span>}
              </div>
            </button>
          ))}
        </div>
        {selectedClient && policies.length > 0 && (
          <div style={{ borderTop: '1px solid #E8E2DA', padding: '10px 10px 12px', maxHeight: 210, overflowY: 'auto' }}>
            <p style={{ fontSize: 9, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 7px' }}>Policies ({policies.length})</p>
            {policies.map(p => {
              const days = getRenewalDays(p.renewal_date)
              return (
                <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 6, padding: '7px 9px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, color: '#1A1410' }}>{p.type}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: getRenewalColor(days) }}>{days < 0 ? 'Lapsed' : `${days}d`}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#6B6460' }}>{p.insurer} · ${p.premium?.toLocaleString()}/yr</span>
                </div>
              )
            })}
          </div>
        )}
        {selectedClient && claims.length > 0 && (
          <div style={{ borderTop: '1px solid #E8E2DA', padding: '10px 10px 12px', maxHeight: 160, overflowY: 'auto' }}>
            <p style={{ fontSize: 9, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 7px' }}>Open Claims ({claims.filter(c => c.status !== 'resolved').length})</p>
            {claims.filter(c => c.status !== 'resolved').map(c => (
              <div key={c.id} style={{ background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 6, padding: '7px 9px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{c.title}</span>
                  <span style={{ fontSize: 9, color: c.priority === 'high' ? '#D06060' : c.priority === 'medium' ? '#854F0B' : '#6B6460', textTransform: 'uppercase' }}>{c.priority}</span>
                </div>
                <span style={{ fontSize: 10, color: '#6B6460' }}>{(c.status || 'open').replace('_', ' ')} · {c.daysSinceUpdate}d ago</span>
              </div>
            ))}
          </div>
        )}
        {selectedClient && (
          <div style={{ borderTop: '1px solid #E8E2DA', padding: '10px 10px 12px' }}>
            <a href={`/dashboard/clients/${selectedClient.id}`}
              style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#BA7517', textDecoration: 'none', padding: '6px 0', border: '1px solid #9B9088', borderRadius: 6 }}>
              View full client page →
            </a>
          </div>
        )}
      </div>

      {/* ── Main Chat Area ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        width: isMobile ? '100%' : 'auto',
        transform: isMobile && !selectedClient ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 250ms ease-out',
      }}>
        {!selectedClient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(186,117,23,0.10)', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={28} color="#BA7517" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1A1410', margin: '0 0 6px' }}>Select a client to train Maya</p>
              <p style={{ fontSize: 13, color: '#6B6460', margin: 0, maxWidth: 360 }}>Maya will be loaded with their real policies, tier, renewal dates, and coverage data from Supabase.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '10px 18px', background: '#F7F4F0', borderBottom: '1px solid #E8E2DA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isMobile && (
                  <button
                    onClick={() => setSelectedClient(null)}
                    aria-label="Back to client list"
                    style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6460' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(186,117,23,0.10)', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#BA7517', fontWeight: 600, flexShrink: 0 }}>{selectedClient.name.charAt(0)}</div>
                <div>
                  <p style={{ fontSize: 13, color: '#1A1410', margin: 0, fontWeight: 500 }}>{selectedClient.name}{selectedClient.company ? ` · ${selectedClient.company}` : ''}</p>
                  <p style={{ fontSize: 10, color: '#3A7D5A', margin: 0 }}>{ifaName} · Maya · {selectedClient.name}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDebug(v => !v)} style={{ background: showDebug ? 'rgba(186,117,23,0.10)' : 'transparent', border: `1px solid ${showDebug ? '#BA7517' : '#E8E2DA'}`, borderRadius: 6, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: showDebug ? '#BA7517' : '#6B6460' }}>
                  {showDebug ? <EyeOff size={12} /> : <Eye size={12} />} Debug
                </button>
                <button onClick={resetConversation} style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 6, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B6460' }}>
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyLoading && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 12, color: '#6B6460' }}>Loading conversation history…</p>
                </div>
              )}

              {!historyLoading && conversationSummary && messages.length === 0 && (
                <div style={{ background: '#F7F4F0', border: '1px solid #E8E2DA', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                  <p style={{ fontSize: 9, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px', fontFamily: 'DM Mono, monospace' }}>
                    Maya remembers
                  </p>
                  <p style={{ fontSize: 12, color: '#6B6460', margin: 0, lineHeight: 1.6 }}>{conversationSummary}</p>
                </div>
              )}

              {!historyLoading && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 12, color: '#6B6460', marginBottom: 16 }}>Maya is ready — try one of these, or type your own</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto' }}>
                    {QUICK_PROMPTS.map(q => (
                      <button key={q} onClick={() => sendMessage(q)} style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 16, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#1A1410' }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'client' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {msg.role !== 'client' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: msg.role === 'maya' ? 'rgba(186,117,23,0.10)' : 'rgba(32,160,160,0.08)', border: `1px solid ${msg.role === 'maya' ? '#BA7517' : '#20A0A0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: msg.role === 'maya' ? '#BA7517' : '#20A0A0' }}>
                      {msg.role === 'maya' ? 'M' : 'IFA'}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ background: msg.role === 'client' ? 'rgba(58,125,90,0.10)' : msg.role === 'maya' ? 'rgba(186,117,23,0.10)' : 'rgba(32,160,160,0.08)', border: `1px solid ${msg.role === 'client' ? 'rgba(58,125,90,0.10)' : msg.role === 'maya' ? '#BA751744' : '#20A0A044'}`, borderRadius: msg.role === 'client' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', padding: '9px 13px' }}>
                      {msg.role !== 'client' && (
                        <p style={{ fontSize: 10, fontWeight: 600, color: msg.role === 'maya' ? '#BA7517' : '#20A0A0', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {msg.role === 'maya' ? 'Maya' : ifaName}
                        </p>
                      )}
                      {/* Attachments in message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: msg.content ? 8 : 0 }}>
                          {msg.attachments.map((a, i) => (
                            <div key={i}>
                              {a.type === 'image' && a.previewUrl ? (
                                <img src={a.previewUrl} alt={a.name} style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, display: 'block' }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FBFAF7', borderRadius: 6, padding: '6px 10px' }}>
                                  <FileText size={14} color="#BA7517" />
                                  <span style={{ fontSize: 11, color: '#6B6460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{a.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.content && (
                        <p style={{ fontSize: 13, color: '#1A1410', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      )}
                    </div>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#6B6460', margin: '3px 5px 0', textAlign: msg.role === 'client' ? 'right' : 'left' }}>{formatTime(msg.timestamp)}</p>
                    {msg.thinking && showDebug && (
                      <div style={{ background: '#FBFAF7', border: '1px solid #E8E2DA', borderRadius: 8, padding: 10, marginTop: 6 }}>
                        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#854F0B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Maya's Reasoning</p>
                        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#6B6460', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.thinking}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(186,117,23,0.10)', border: '1px solid #BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#BA7517' }}>M</div>
                  <div style={{ background: '#9B9088', border: '1px solid #BA751744', borderRadius: '4px 16px 16px 16px', padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => <div key={i} className="maya-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#BA7517', animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '14px 18px', background: '#F7F4F0', borderTop: '1px solid #E8E2DA', flexShrink: 0 }}>

              {/* Speaker toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#6B6460' }}>Speaking as:</span>
                <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 8, overflow: 'hidden' }}>
                  {(['client', 'ifa'] as const).map(role => (
                    <button key={role} onClick={() => setSpeakingAs(role)} style={{ padding: '4px 14px', background: speakingAs === role ? (role === 'client' ? 'rgba(58,125,90,0.10)' : 'rgba(32,160,160,0.08)') : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: speakingAs === role ? (role === 'client' ? '#3A7D5A' : '#20A0A0') : '#6B6460', fontWeight: speakingAs === role ? 600 : 400, transition: 'all 0.12s ease' }}>
                      {role === 'client' ? selectedClient.name : ifaName}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Zap size={11} color="#BA7517" />
                  <span style={{ fontSize: 11, color: '#6B6460' }}>{policies.length} polic{policies.length === 1 ? 'y' : 'ies'} loaded</span>
                  {conversationId && (
                    <span style={{ fontSize: 11, color: '#3A7D5A', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3A7D5A', display: 'inline-block' }} />
                      Memory on
                    </span>
                  )}
                </div>
              </div>

              {/* Attachment previews */}
              {attachments.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {attachments.map((a, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
                      {a.type === 'image' && a.previewUrl ? (
                        <img src={a.previewUrl} alt={a.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #E8E2DA' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, background: '#9B9088', border: '1px solid #E8E2DA', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                          <FileText size={18} color="#BA7517" />
                          <span style={{ fontSize: 8, color: '#6B6460', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>PDF</span>
                        </div>
                      )}
                      <button onClick={() => removeAttachment(i)} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#D06060', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={9} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

                {/* Attach button */}
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: '1px solid #E8E2DA', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.12s' }}>
                  <Paperclip size={16} color="#6B6460" />
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message as ${speakingAs === 'client' ? selectedClient.name : ifaName}…`}
                  style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E8E2DA', borderRadius: 10, padding: '10px 15px', fontSize: 13, color: '#1A1410', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                />

                <button onClick={() => sendMessage()} disabled={(!input.trim() && attachments.length === 0) || isLoading} style={{ background: (input.trim() || attachments.length > 0) && !isLoading ? '#BA7517' : '#E8E2DA', border: 'none', borderRadius: 10, padding: '10px 15px', cursor: (input.trim() || attachments.length > 0) && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s ease', flexShrink: 0 }}>
                  <Send size={16} color={(input.trim() || attachments.length > 0) && !isLoading ? '#F7F4F0' : '#6B6460'} />
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#9B9088', margin: '7px 0 0' }}>Attach photos (JPG, PNG, WebP) or documents (PDF) · max 10MB each</p>
            </div>
          </>
        )}
      </div>

      {/* ── Right Debug Panel ── */}
      {showDebug && selectedClient && (
        <div style={{
          width: isMobile ? '100%' : 320,
          flexShrink: 0,
          background: '#F7F4F0',
          borderLeft: '1px solid #E8E2DA',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: isMobile ? 'absolute' : 'relative',
          top: 0,
          right: 0,
          height: '100%',
          zIndex: isMobile ? 20 : 'auto',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8E2DA', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#1A1410', margin: 0 }}>System Prompt</p>
              <p style={{ fontSize: 11, color: '#6B6460', margin: '2px 0 0' }}>What Maya sees before your conversation</p>
            </div>
            <button
              onClick={() => setShowDebug(false)}
              aria-label="Close debug panel"
              style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', color: '#6B6460', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {systemPrompt ? (
              <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#6B6460', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{systemPrompt}</pre>
            ) : (
              <p style={{ fontSize: 12, color: '#6B6460' }}>Send a message to see the system prompt.</p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes mayaBounce {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40%            { transform: scale(1);    opacity: 1; }
        }
        .maya-dot { animation: mayaBounce 1.2s infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8E2DA; border-radius: 2px; }
        input::placeholder { color: #9B9088; }
      `}</style>
    </div>
  )
}
