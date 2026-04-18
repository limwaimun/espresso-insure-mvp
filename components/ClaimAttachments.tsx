'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Attachment {
  id: string
  file_name: string
  file_type: string
  file_size: number | null
  storage_path: string
  source: 'fa_upload' | 'whatsapp' | 'client_upload'
  description: string | null
  uploaded_by: string | null
  created_at: string
}

const FILE_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼',
  'image/png': '🖼',
  'image/webp': '🖼',
  'image/gif': '🖼',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
}

const SOURCE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  fa_upload:     { label: 'Uploaded',  color: '#185FA5', bg: '#E6F1FB' },
  whatsapp:      { label: 'WhatsApp',  color: '#0F6E56', bg: '#E1F5EE' },
  client_upload: { label: 'Client',    color: '#854F0B', bg: '#FAEEDA' },
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function ClaimAttachments({
  claimId, clientId, ifaId,
}: { claimId: string; clientId: string; ifaId: string }) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [claimId])

  async function load() {
    const { data } = await supabase
      .from('claim_attachments')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false })
    setAttachments(data || [])
    setLoading(false)
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { setError(`${file.name} exceeds 50MB limit`); continue }

      const ext = file.name.split('.').pop()
      const path = `${ifaId}/${claimId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { error: uploadError } = await supabase.storage
        .from('claim-attachments')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) { setError(`Upload failed: ${uploadError.message}`); continue }

      await supabase.from('claim_attachments').insert({
        claim_id: claimId,
        client_id: clientId,
        ifa_id: ifaId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        source: 'fa_upload',
        description: description || null,
        uploaded_by: 'FA',
      })
    }

    setDescription('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    load()
  }

  async function download(attachment: Attachment) {
    const { data } = await supabase.storage
      .from('claim-attachments')
      .createSignedUrl(attachment.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function remove(id: string, path: string) {
    if (!confirm('Remove this attachment?')) return
    await supabase.storage.from('claim-attachments').remove([path])
    await supabase.from('claim_attachments').delete().eq('id', id)
    load()
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', border: '0.5px solid #E8E2DA', borderRadius: 6,
    fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#1A1410',
    background: '#FFFFFF', outline: 'none',
  }

  return (
    <div>
      {/* Upload row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          placeholder="Label (e.g. Medical bill, Police report)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ background: '#BA7517', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#FFFFFF', fontWeight: 500, flexShrink: 0, opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? 'Uploading…' : '+ Attach file'}
        </button>
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={upload} style={{ display: 'none' }} />
      </div>

      {error && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#A32D2D', marginBottom: 8 }}>{error}</div>}

      {/* Attachment list */}
      {loading ? (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#9B9088' }}>Loading…</div>
      ) : attachments.length === 0 ? (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#B4B2A9', padding: '12px 0', textAlign: 'center' }}>
          No attachments yet — upload files or wait for client to send via WhatsApp
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map(a => {
            const src = SOURCE_LABEL[a.source] || SOURCE_LABEL.fa_upload
            const icon = FILE_ICON[a.file_type] || '📎'
            const isImage = a.file_type.startsWith('image/')
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAFAF8', border: '0.5px solid #E8E2DA', borderRadius: 7, padding: '9px 12px' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description ? `${a.description} — ` : ''}{a.file_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ background: src.bg, color: src.color, fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 100 }}>{src.label}</span>
                    {a.file_size && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>{formatSize(a.file_size)}</span>}
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>
                      {new Date(a.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => download(a)} style={{ background: '#F7F4F0', border: '0.5px solid #E8E2DA', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3D3532' }}>
                    Download
                  </button>
                  <button onClick={() => remove(a.id, a.storage_path)} style={{ background: 'transparent', border: '0.5px solid #E8E2DA', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#9B9088' }}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
