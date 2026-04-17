'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Check, X, Loader } from 'lucide-react'
import { createClient } from '../../../lib/supabase/client'

interface PolicyUploadProps {
  clientId: string
  onPolicyAdded?: () => void
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export default function PolicyUpload({ clientId, onPolicyAdded }: PolicyUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [ifaId, setIfaId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIfaId(user.id)
    })
  }, [])

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setState('error')
      setMessage('Only PDF files are supported')
      return
    }

    setState('uploading')
    setMessage('Maya is reading the policy document…')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    formData.append('ifaId', ifaId)

    try {
      const res = await fetch('/api/policy-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Upload failed')
        return
      }

      setState('success')
      setMessage(data.message ?? 'Policy added successfully')
      onPolicyAdded?.()

      setTimeout(() => {
        setState('idle')
        setMessage('')
      }, 3000)
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const borderColor = dragOver ? '#C8813A'
    : state === 'success' ? '#5AB87A'
    : state === 'error' ? '#D06060'
    : '#2E1A0E'

  return (
    <div style={{ marginBottom: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      <div
        onClick={() => state === 'idle' && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `1px dashed ${borderColor}`,
          borderRadius: 10,
          padding: '18px 16px',
          cursor: state === 'idle' ? 'pointer' : 'default',
          background: dragOver ? '#3D2215' : '#120A06',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          textAlign: 'center',
        }}
      >
        {state === 'idle' && (
          <>
            <Upload size={18} color="#C8813A" />
            <div>
              <p style={{ fontSize: 13, color: '#F5ECD7', margin: 0, fontWeight: 500 }}>
                Upload policy PDF
              </p>
              <p style={{ fontSize: 11, color: '#C9B99A', margin: '3px 0 0' }}>
                Maya reads and extracts all policy details automatically
              </p>
            </div>
          </>
        )}
        {state === 'uploading' && (
          <>
            <Loader size={18} color="#C8813A" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#C9B99A', margin: 0 }}>{message}</p>
          </>
        )}
        {state === 'success' && (
          <>
            <Check size={18} color="#5AB87A" />
            <p style={{ fontSize: 13, color: '#5AB87A', margin: 0, fontWeight: 500 }}>{message}</p>
          </>
        )}
        {state === 'error' && (
          <>
            <X size={18} color="#D06060" />
            <p style={{ fontSize: 13, color: '#D06060', margin: 0 }}>{message}</p>
            <button
              onClick={e => { e.stopPropagation(); setState('idle'); setMessage('') }}
              style={{
                background: 'transparent', border: '1px solid #2E1A0E',
                borderRadius: 6, padding: '4px 12px', fontSize: 12,
                color: '#C9B99A', cursor: 'pointer', marginTop: 4,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Try again
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
