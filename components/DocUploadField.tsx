'use client'

import { useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

// Upload field for modals. Stateless w.r.t. file data — the parent owns the
// File[] state and handles the actual upload (typically after saving the
// parent record to get an ID). Two modes:
//   - single: one-file slot (policies, holdings). Selecting replaces.
//   - multi:  growing list (claims). Selecting appends.

const ACCEPT_MIMES = 'application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const MAX_BYTES = 20 * 1024 * 1024

interface Props {
  multi?: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
  label?: string
  disabled?: boolean
  // Optional message slot for client-side validation errors
  onError?: (msg: string) => void
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocUploadField({ multi, files, onFilesChange, label, disabled, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    if (file.size > MAX_BYTES) return `"${file.name}" is over 20MB`
    if (!ACCEPT_MIMES.split(',').includes(file.type)) return `"${file.name}" — file type not supported`
    return null
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    if (picked.length === 0) return

    const errors: string[] = []
    const valid: File[] = []
    for (const f of picked) {
      const err = validate(f)
      if (err) errors.push(err)
      else valid.push(f)
    }

    if (errors.length && onError) onError(errors.join('; '))

    if (valid.length) {
      if (multi) onFilesChange([...files, ...valid])
      else       onFilesChange([valid[0]])       // single mode: replace
    }

    // Reset input so selecting the same file again still fires onChange
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeAt(i: number) {
    onFilesChange(files.filter((_, idx) => idx !== i))
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#6B6460', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 5, display: 'block',
  }
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 12px', fontSize: 12, color: '#BA7517',
    background: 'transparent', border: '1px dashed #BA7517', borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    opacity: disabled ? 0.5 : 1,
  }
  const fileRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px',
    background: '#FBFAF7', border: '0.5px solid #E8E2DA', borderRadius: 6,
    fontFamily: 'DM Sans, sans-serif',
  }

  // Single mode — show the file (if any) in place of the upload button
  if (!multi) {
    const file = files[0] ?? null
    return (
      <div>
        {label && <label style={labelStyle}>{label}</label>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MIMES}
          style={{ display: 'none' }}
          onChange={handleSelect}
          disabled={disabled}
        />
        {file ? (
          <div style={fileRowStyle}>
            {isImage(file) ? <ImageIcon size={14} color="#6B6460" /> : <FileText size={14} color="#6B6460" />}
            <span style={{ flex: 1, fontSize: 12, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </span>
            <span style={{ fontSize: 10, color: '#9B9088' }}>{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={() => removeAt(0)}
              disabled={disabled}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: '#9B9088' }}
              aria-label="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} style={btnStyle}>
            <Upload size={12} />
            Upload document
          </button>
        )}
      </div>
    )
  }

  // Multi mode — list + "+ Add document" button below
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIMES}
        multiple
        style={{ display: 'none' }}
        onChange={handleSelect}
        disabled={disabled}
      />
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} style={fileRowStyle}>
              {isImage(f) ? <ImageIcon size={14} color="#6B6460" /> : <FileText size={14} color="#6B6460" />}
              <span style={{ flex: 1, fontSize: 12, color: '#1A1410', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontSize: 10, color: '#9B9088' }}>{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: '#9B9088' }}
                aria-label="Remove file"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} style={btnStyle}>
        <Upload size={12} />
        {files.length === 0 ? 'Add document' : 'Add another'}
      </button>
    </div>
  )
}
