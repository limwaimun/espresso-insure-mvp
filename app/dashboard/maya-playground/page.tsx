'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, Eye, EyeOff, RotateCcw, Zap, Paperclip, X, FileText, Image } from 'lucide-react'

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

interface Policy {
  id: string
  insurer: string
  type: string
  premium: number
  renewal_date: string
  status: string
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
  platinum: '#E5E4E2',
  gold: '#C8813A',
  silver: '#C9B99A',
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedClient && ifaId) {
      loadPolicies(selectedClient.id)
      loadClaims(selectedClient.id)
      loadConversationHistory(selectedClient.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setIfaId(user.id)
    const { data } = await supabase.from('profiles').select('name, company, preferred_insurers').eq('id', user.id).single()
    if (data?.name) setIfaName(data.name)
    if (data?.preferred_insurers && Array.isArray(data.preferred_insurers)) {
      setPreferredInsurers(data.preferred_insurers)
    }
  }

  async function loadClients() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('clients').select('*').eq('ifa_id', user.id).order('name')
    if (data) setClients(data)
  }

  async function loadPolicies(clientId: string) {
    const { data } = await supabase
      .from('policies')
      .select('*')
      .eq('client_id', clientId)
      .order('renewal_date')
    if (data) setPolicies(data)
  }

  async function loadClaims(clientId: string) {
    const { data } = await supabase
      .from('alerts')
      .select('id, title, resolved, status, priority, created_at')
      .eq('client_id', clientId)
      .eq('type', 'claim')
      .order('created_at', { ascending: false })
    if (data) {
      setClaims(data.map((c: { id: string; title: string; resolved: boolean; status: string | null; priority: string | null; created_at: string }) => ({
        id: c.id,
        title: c.title || 'Untitled claim',
        status: c.resolved ? 'resolved' : (c.status || 'open'),
        priority: c.priority || 'medium',
        daysSinceUpdate: Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      })))
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

  const getRenewalDays = (date: string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)

  const getRenewalColor = (days: number) => {
    if (days < 0) return '#D06060'
    if (days <= 30) return '#D06060'
    if (days <= 60) return '#D4A030'
    if (days <= 90) return '#C8813A'
    return '#5AB87A'
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#1C0F0A', overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Left Panel ── */}
      <div style={{ width: 272, flexShrink: 0, background: '#120A06', borderRight: '1px solid #2E1A0E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 14px 12px', borderBottom: '1px solid #2E1A0E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Bot size={15} color="#C8813A" />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#F5ECD7', letterSpacing: '0.02em' }}>Maya Playground</span>
          </div>
          <p style={{ fontSize: 11, color: '#C9B99A', margin: 0 }}>Select a client to start training</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {clients.map(client => (
            <button key={client.id} onClick={() => setSelectedClient(client)} style={{ width: '100%', background: selectedClient?.id === client.id ? '#3D2215' : 'transparent', border: `1px solid ${selectedClient?.id === client.id ? '#C8813A' : 'transparent'}`, borderRadius: 8, padding: '9px 11px', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'all 0.12s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 13, color: '#F5ECD7', fontWeight: 500 }}>{client.name}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: TIER_COLORS[client.tier], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{client.tier}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#C9B99A', background: '#2E1A0E', padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize' }}>{client.type}</span>
                {client.company && <span style={{ fontSize: 10, color: '#C9B99A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.company}</span>}
              </div>
            </button>
          ))}
        </div>
        {selectedClient && policies.length > 0 && (
          <div style={{ borderTop: '1px solid #2E1A0E', padding: '10px 10px 12px', maxHeight: 210, overflowY: 'auto' }}>
            <p style={{ fontSize: 9, color: '#C9B99A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 7px' }}>Policies</p>
            {policies.map(p => {
              const days = getRenewalDays(p.renewal_date)
              return (
                <div key={p.id} style={{ background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 6, padding: '7px 9px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, color: '#F5ECD7' }}>{p.type}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: getRenewalColor(days) }}>{days < 0 ? 'Lapsed' : `${days}d`}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#C9B99A' }}>{p.insurer} · ${p.premium?.toLocaleString()}/yr</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Main Chat Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!selectedClient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={28} color="#C8813A" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#F5ECD7', margin: '0 0 6px' }}>Select a client to train Maya</p>
              <p style={{ fontSize: 13, color: '#C9B99A', margin: 0, maxWidth: 360 }}>Maya will be loaded with their real policies, tier, renewal dates, and coverage data from Supabase.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '10px 18px', background: '#120A06', borderBottom: '1px solid #2E1A0E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#C8813A', fontWeight: 600, flexShrink: 0 }}>{selectedClient.name.charAt(0)}</div>
                <div>
                  <p style={{ fontSize: 13, color: '#F5ECD7', margin: 0, fontWeight: 500 }}>{selectedClient.name}{selectedClient.company ? ` · ${selectedClient.company}` : ''}</p>
                  <p style={{ fontSize: 10, color: '#5AB87A', margin: 0 }}>{ifaName} · Maya · {selectedClient.name}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDebug(v => !v)} style={{ background: showDebug ? '#3D2215' : 'transparent', border: `1px solid ${showDebug ? '#C8813A' : '#2E1A0E'}`, borderRadius: 6, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: showDebug ? '#C8813A' : '#C9B99A' }}>
                  {showDebug ? <EyeOff size={12} /> : <Eye size={12} />} Debug
                </button>
                <button onClick={resetConversation} style={{ background: 'transparent', border: '1px solid #2E1A0E', borderRadius: 6, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#C9B99A' }}>
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyLoading && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 12, color: '#C9B99A' }}>Loading conversation history…</p>
                </div>
              )}

              {!historyLoading && conversationSummary && messages.length === 0 && (
                <div style={{ background: '#120A06', border: '1px solid #2E1A0E', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                  <p style={{ fontSize: 9, color: '#C8813A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px', fontFamily: 'DM Mono, monospace' }}>
                    Maya remembers
                  </p>
                  <p style={{ fontSize: 12, color: '#C9B99A', margin: 0, lineHeight: 1.6 }}>{conversationSummary}</p>
                </div>
              )}

              {!historyLoading && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 12, color: '#C9B99A', marginBottom: 16 }}>Maya is ready — try one of these, or type your own</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto' }}>
                    {QUICK_PROMPTS.map(q => (
                      <button key={q} onClick={() => sendMessage(q)} style={{ background: '#3D2215', border: '1px solid #2E1A0E', borderRadius: 16, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#C9B99A' }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'client' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {msg.role !== 'client' && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: msg.role === 'maya' ? '#3D2215' : '#0A2020', border: `1px solid ${msg.role === 'maya' ? '#C8813A' : '#20A0A0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: msg.role === 'maya' ? '#C8813A' : '#20A0A0' }}>
                      {msg.role === 'maya' ? 'M' : 'IFA'}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ background: msg.role === 'client' ? '#1A3A2A' : msg.role === 'maya' ? '#3D2215' : '#0A2020', border: `1px solid ${msg.role === 'client' ? '#2A5A3A' : msg.role === 'maya' ? '#C8813A44' : '#20A0A044'}`, borderRadius: msg.role === 'client' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', padding: '9px 13px' }}>
                      {msg.role !== 'client' && (
                        <p style={{ fontSize: 10, fontWeight: 600, color: msg.role === 'maya' ? '#C8813A' : '#20A0A0', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0A0806', borderRadius: 6, padding: '6px 10px' }}>
                                  <FileText size={14} color="#C8813A" />
                                  <span style={{ fontSize: 11, color: '#C9B99A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{a.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.content && (
                        <p style={{ fontSize: 13, color: '#F5ECD7', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      )}
                    </div>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#C9B99A', margin: '3px 5px 0', textAlign: msg.role === 'client' ? 'right' : 'left' }}>{formatTime(msg.timestamp)}</p>
                    {msg.thinking && showDebug && (
                      <div style={{ background: '#0A0806', border: '1px solid #2E1A0E', borderRadius: 8, padding: 10, marginTop: 6 }}>
                        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#D4A030', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Maya's Reasoning</p>
                        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#C9B99A', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.thinking}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3D2215', border: '1px solid #C8813A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#C8813A' }}>M</div>
                  <div style={{ background: '#3D2215', border: '1px solid #C8813A44', borderRadius: '4px 16px 16px 16px', padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => <div key={i} className="maya-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8813A', animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '14px 18px', background: '#120A06', borderTop: '1px solid #2E1A0E', flexShrink: 0 }}>

              {/* Speaker toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#C9B99A' }}>Speaking as:</span>
                <div style={{ display: 'flex', background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 8, overflow: 'hidden' }}>
                  {(['client', 'ifa'] as const).map(role => (
                    <button key={role} onClick={() => setSpeakingAs(role)} style={{ padding: '4px 14px', background: speakingAs === role ? (role === 'client' ? '#1A3A2A' : '#0A2020') : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: speakingAs === role ? (role === 'client' ? '#5AB87A' : '#20A0A0') : '#C9B99A', fontWeight: speakingAs === role ? 600 : 400, transition: 'all 0.12s ease' }}>
                      {role === 'client' ? selectedClient.name : ifaName}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Zap size={11} color="#C8813A" />
                  <span style={{ fontSize: 11, color: '#C9B99A' }}>{policies.length} polic{policies.length === 1 ? 'y' : 'ies'} loaded</span>
                  {conversationId && (
                    <span style={{ fontSize: 11, color: '#5AB87A', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5AB87A', display: 'inline-block' }} />
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
                        <img src={a.previewUrl} alt={a.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #2E1A0E' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, background: '#3D2215', border: '1px solid #2E1A0E', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                          <FileText size={18} color="#C8813A" />
                          <span style={{ fontSize: 8, color: '#C9B99A', textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>PDF</span>
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
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: '1px solid #2E1A0E', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.12s' }}>
                  <Paperclip size={16} color="#C9B99A" />
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message as ${speakingAs === 'client' ? selectedClient.name : ifaName}…`}
                  style={{ flex: 1, background: '#1C0F0A', border: '1px solid #2E1A0E', borderRadius: 10, padding: '10px 15px', fontSize: 13, color: '#F5ECD7', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                />

                <button onClick={() => sendMessage()} disabled={(!input.trim() && attachments.length === 0) || isLoading} style={{ background: (input.trim() || attachments.length > 0) && !isLoading ? '#C8813A' : '#2E1A0E', border: 'none', borderRadius: 10, padding: '10px 15px', cursor: (input.trim() || attachments.length > 0) && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s ease', flexShrink: 0 }}>
                  <Send size={16} color={(input.trim() || attachments.length > 0) && !isLoading ? '#120A06' : '#C9B99A'} />
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#6B4C3A', margin: '7px 0 0' }}>Attach photos (JPG, PNG, WebP) or documents (PDF) · max 10MB each</p>
            </div>
          </>
        )}
      </div>

      {/* ── Right Debug Panel ── */}
      {showDebug && selectedClient && (
        <div style={{ width: 320, flexShrink: 0, background: '#120A06', borderLeft: '1px solid #2E1A0E', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2E1A0E' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#F5ECD7', margin: 0 }}>System Prompt</p>
            <p style={{ fontSize: 11, color: '#C9B99A', margin: '2px 0 0' }}>What Maya sees before your conversation</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {systemPrompt ? (
              <pre style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#C9B99A', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{systemPrompt}</pre>
            ) : (
              <p style={{ fontSize: 12, color: '#C9B99A' }}>Send a message to see the system prompt.</p>
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
        ::-webkit-scrollbar-thumb { background: #2E1A0E; border-radius: 2px; }
        input::placeholder { color: #6B4C3A; }
      `}</style>
    </div>
  )
}
