'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// Dropdown menu item shape. Shared by any caller using PortalMenu.
export interface MenuItem {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean        // red text (e.g. Delete)
  accent?: boolean        // warm hover (e.g. amber for Maya actions)
  dividerBefore?: boolean // top border to visually group
}

interface PortalMenuProps {
  anchorRef: React.RefObject<HTMLElement>
  open: boolean
  onClose: () => void
  items: MenuItem[]
}

// PortalMenu — renders a dropdown via createPortal(document.body) with
// position computed from the anchor's bounding rect. This escapes any parent
// `overflow: hidden` clipping (the bug that motivated extracting this).
export default function PortalMenu({ anchorRef, open, onClose, items }: PortalMenuProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // SSR guard — portals only work client-side
  useEffect(() => { setMounted(true) }, [])

  // Compute position whenever menu opens, and on scroll/resize
  useEffect(() => {
    if (!open) return
    function updatePosition() {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      const menuWidth = 220
      const menuGap = 4
      // Right-align to anchor button's right edge. Clamp to viewport.
      let left = rect.right - menuWidth
      if (left < 8) left = 8
      if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8
      const top = rect.bottom + menuGap
      setCoords({ top, left })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, anchorRef])

  // Outside-click dismiss
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current && !menuRef.current.contains(target) && !anchorRef.current?.contains(target)) {
        onClose()
      }
    }
    // mousedown (not click) so it fires before any onClick handler inside the menu
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose, anchorRef])

  if (!mounted || !open || !coords) return null

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: 220,
        background: '#FFFFFF',
        border: '0.5px solid #E8E2DA',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        zIndex: 2000,
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose() }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            fontSize: 12,
            color: item.danger ? '#A32D2D' : '#1A1410',
            background: 'transparent',
            border: 'none',
            borderTop: item.dividerBefore ? '0.5px solid #F1EFE8' : 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontFamily: 'DM Sans, sans-serif',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = item.danger ? '#FCEBEB' : item.accent ? '#FAEEDA' : '#F7F4F0'
          }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  )
}
