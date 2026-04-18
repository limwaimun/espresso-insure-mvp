'use client'

import React from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface DashboardTopbarProps {
  profile?: { name: string; plan?: string } | null
}

const DashboardTopbar = ({ profile }: DashboardTopbarProps) => {
  const isMobile = useIsMobile()

  const now = new Date()
  const hours = now.getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 0 }}>
        {isMobile && (
          <button style={{ background: 'transparent', border: 'none', color: '#6B6460', fontSize: 20, cursor: 'pointer', padding: 4 }}>
            ☰
          </button>
        )}
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#6B6460' }}>
          {greeting}, <span style={{ color: '#1A1410', fontWeight: 500 }}>{profile?.name?.split(' ')[0] || 'there'}</span>
          {!isMobile && <span style={{ color: '#B4B2A9' }}>&nbsp;·&nbsp;{dateStr}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF7', border: '0.5px solid #9FE1CB', borderRadius: 100, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#0F6E56' }}>Maya active</span>
          </div>
        )}
        {isMobile && (
          <button style={{ background: 'transparent', border: 'none', color: '#6B6460', fontSize: 18, cursor: 'pointer', padding: 4 }}>
            🔔
          </button>
        )}
      </div>
    </div>
  )
}

export default DashboardTopbar
