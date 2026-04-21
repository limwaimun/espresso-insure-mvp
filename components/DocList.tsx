'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Download, Trash2, FileText, Image as ImageIcon } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// DocList — self-contained list of documents for ANY parent resource.
//
// Used for claims, policies, and holdings. Each resource has its own backing
// API route (/api/claim-doc, /api/policy-doc, /api/holding-doc) and its own
// storage bucket, but the API contract is identical:
//
//   GET    {apiEndpoint}?{parentParam}={parentId}     → { docs: [...] }
//   POST   {apiEndpoint}  FormData(file, {parentParam})  → { success, doc }
//   DELETE {apiEndpoint}?docId={id}                   → { success }
//
// ─────────────────────────────────────────────────────────────────────────

const ACCEPT_MIMES =
  'application/pdf,' +
  'image/jpeg,image/png,image/webp,' +
  'application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export interface DocListProps {
  parentId: string
  apiEndpoint: string    // e.g., '/api/claim-doc'
  parentParam: string    // e.g., 'claimId', 'policyId', 'holdingId'
  editable?: boolean
  /** Optional uppercase label shown above the list (e.g., "DOCUMENTS") */
  label?: string
}

interface Doc {
  id: string
  fileName: string
  fileSize: number | null
  mimeType: string | null
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageMime(mime: string | null): boolean {
  return !!mime && mime.startsWith('image/')
}

export default function DocList({ parentId, apiEndpoint, parentParam, editable = false, label }: DocListProps) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const res = await fetch(`${apiEndpoint}?${parentParam}=${parentId}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        console.error(`[DocList GET ${apiEndpoint}] failed:`, res.status, d)
        setErr(`Couldn't load documents — ${d.error ?? `HTTP ${res.status}`}`)
        setDocs([])
        setLoading(false)
        return
      }
      const data = await res.json()
      setDocs(data.docs ?? [])
      setErr('')
    } catch (e) {
      console.error(`[DocList GET ${apiEndpoint}] exception:`, e)
      setErr('Failed to load documents — network error')
      setDocs([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId, apiEndpoint])

  async function handleDownload(doc: Doc) {
    try {
      // Fetch a fresh signed URL just-in-time. The list endpoint no longer
      // generates URLs eagerly — saves an HTTP round trip per doc on list.
      const urlRes = await fetch(`${apiEndpoint}?docId=${doc.id}`)
      if (!urlRes.ok) {
        const d = await urlRes.json().catch(() => ({}))
        console.error(`[DocList download URL] failed:`, urlRes.status, d)
        setErr(`Couldn't get download link — ${d.error ?? `HTTP ${urlRes.status}`}`)
        return
      }
      const { downloadUrl } = await urlRes.json()
      if (!downloadUrl) { setErr('Download link missing'); return }

      const fileRes = await fetch(downloadUrl)
      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = doc.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error('[DocList download] exception:', e)
      setErr('Download failed')
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Remove this document?')) return
    setBusy(true); setErr('')
    const res = await fetch(`${apiEndpoint}?docId=${docId}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      console.error(`[DocList DELETE ${apiEndpoint}] failed:`, res.status, d)
      setErr(`Delete failed — ${d.error ?? `HTTP ${res.status}`}`)
    }
    await load()
    setBusy(false)
  }

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (inputRef.current) inputRef.current.value = ''
    if (files.length === 0) return
    setBusy(true); setErr('')
    const failures: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append(parentParam, parentId)
      const res = await fetch(apiEndpoint, { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        console.error(`[DocList POST ${apiEndpoint}] failed:`, res.status, d)
        failures.push(`${file.name}: ${d.error ?? `HTTP ${res.status}`}`)
      }
    }
    if (failures.length) setErr(`Upload failed — ${failures.join('; ')}`)
    await load()
    setBusy(false)
  }

  // ── Styles ───────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: '#9B9088', textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: 6, display: 'block',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', background: '#FBFAF7',
    border: '0.5px solid #E8E2DA', borderRadius: 6,
    fontFamily: 'DM Sans, sans-serif',
  }
  const addBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', fontSize: 11, color: '#BA7517',
    background: 'transparent', border: '1px dashed #E8E2DA', borderRadius: 5,
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
  }
  const errStyle: React.CSSProperties = {
    marginLeft: 10, fontSize: 11, color: '#A32D2D',
    fontFamily: 'DM Sans, sans-serif',
  }

  // Read-only + no docs + no error + done loading → render nothing (clean card).
  // Everything else renders the container so the Add button shows up immediately.
  if (!editable && !loading && docs.length === 0 && !err) return null

  return (
    <div style={{ marginTop: 10, marginBottom: 10 }}>
      {(label || docs.length > 0) && (
        <div style={labelStyle}>
          {label ?? 'Documents'}{docs.length > 0 ? ` (${docs.length})` : ''}
        </div>
      )}

      {docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
          {docs.map(doc => (
            <div key={doc.id} style={rowStyle}>
              <button
                onClick={() => handleDownload(doc)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, padding: 0, textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif', minWidth: 0,
                }}
                title="Download"
              >
                {isImageMime(doc.mimeType)
                  ? <ImageIcon size={12} color="#BA7517" />
                  : <FileText size={12} color="#BA7517" />}
                <span style={{
                  fontSize: 12, color: '#BA7517',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {doc.fileName}
                </span>
              </button>
              <span style={{ fontSize: 10, color: '#9B9088' }}>{formatSize(doc.fileSize)}</span>
              {editable && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={busy}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: 2, opacity: 0.5,
                  }}
                  title="Delete"
                  aria-label="Delete document"
                >
                  <Trash2 size={12} color="#6B6460" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MIMES}
            multiple
            style={{ display: 'none' }}
            onChange={handleAdd}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{ ...addBtnStyle, opacity: busy ? 0.6 : 1 }}
          >
            <Upload size={11} />
            {busy ? 'Uploading…' : 'Add document'}
          </button>
        </>
      )}

      {loading && (
        <span style={{ marginLeft: editable ? 10 : 0, fontSize: 10, color: '#9B9088', fontStyle: 'italic', fontFamily: 'DM Sans, sans-serif' }}>
          Loading…
        </span>
      )}
      {err && <span style={errStyle}>{err}</span>}
    </div>
  )
}
