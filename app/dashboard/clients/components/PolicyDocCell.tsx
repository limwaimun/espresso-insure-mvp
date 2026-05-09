'use client'

import { useState, useRef } from 'react'
import { Paperclip, Download, Loader, Check, X } from 'lucide-react'

interface PolicyDocCellProps {
  policyId: string
  faId: string
  existingFileName?: string | null
  existingFileUrl?: string | null
}

type State = 'idle' | 'uploading' | 'success' | 'error'

export default function PolicyDocCell({
  policyId,
  faId,
  existingFileName,
  existingFileUrl,
}: PolicyDocCellProps) {
  const [state, setState] = useState<State>('idle')
  const [fileName, setFileName] = useState(existingFileName ?? null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('PDF only')
      setState('error')
      setTimeout(() => setState('idle'), 2000)
      return
    }

    setState('uploading')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('policyId', policyId)
    formData.append('faId', faId)

    try {
      const res = await fetch('/api/policy-doc', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setState('error')
        setTimeout(() => setState('idle'), 2500)
        return
      }
      setFileName(data.fileName)
      setState('success')
      setTimeout(() => setState('idle'), 1500)
    } catch {
      setError('Upload failed')
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownload() {
    const res = await fetch(`/api/policy-doc?policyId=${policyId}`)
    const data = await res.json()
    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {state === 'uploading' && (
        <Loader size={13} color="#C8813A" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      )}

      {state === 'success' && (
        <Check size={13} color="#5AB87A" style={{ flexShrink: 0 }} />
      )}

      {state === 'error' && (
        <span style={{ fontSize: 11, color: '#D06060' }}>{error}</span>
      )}

      {state === 'idle' && fileName ? (
        // Has a document — show filename + download + re-upload
        <>
          <button
            onClick={handleDownload}
            title={`Download ${fileName}`}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            }}
          >
            <Download size={12} color="#C8813A" />
            <span style={{ fontSize: 11, color: '#C8813A', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Replace document"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.4 }}
          >
            <Paperclip size={11} color="#C9B99A" />
          </button>
        </>
      ) : state === 'idle' && (
        // No document — show upload button
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload policy PDF"
          style={{
            background: 'transparent',
            border: '1px dashed #2E1A0E',
            borderRadius: 5,
            padding: '3px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Paperclip size={11} color="#C9B99A" />
          <span style={{ fontSize: 11, color: '#C9B99A' }}>Upload</span>
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
