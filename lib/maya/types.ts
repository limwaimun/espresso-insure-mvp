// lib/maya/types.ts
//
// Shared types for the Maya runtime. Used by lib/maya/prompt.ts,
// lib/maya/tools.ts, lib/maya/runtime.ts, and all callers (playground route,
// future WhatsApp webhook, eval harness).

import type { Policy } from '@/lib/types'

export interface Client {
  id: string
  name: string
  company?: string
  type: 'individual' | 'sme' | 'corporate'
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  birthday?: string
  email?: string
  whatsapp?: string
  address?: string
}

export interface AttachmentPayload {
  type: 'image' | 'pdf'
  mediaType: string
  base64: string
  name: string
}

export interface ConversationMessage {
  role: 'client' | 'fa' | 'maya'
  content: string
  attachments?: AttachmentPayload[]
}

export interface OpenClaim {
  id: string
  title: string
  status: string
  priority: string
  daysSinceUpdate: number
}

export type { Policy }
