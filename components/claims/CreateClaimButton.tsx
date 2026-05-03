'use client'

import Link from 'next/link'

interface CreateClaimButtonProps {
  /** Optional client ID to pre-select in the form */
  clientId?: string
  /** Optional label override (defaults to "Create Claim") */
  label?: string
  /** Optional style overrides */
  style?: React.CSSProperties
}

/**
 * A reusable "Create Claim" button that navigates to the claims creation flow.
 * Opens the /claims/new route, passing an optional client_id query parameter
 * to pre-select the client in the form.
 */
export default function CreateClaimButton({
  clientId,
  label = 'Create Claim',
  style,
}: CreateClaimButtonProps) {
  const href = clientId
    ? `/claims/new?client_id=${encodeURIComponent(clientId)}`
    : '/claims/new'

  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#C8813A',
        color: '#1C0F0A',
        border: 'none',
        borderRadius: 8,
        padding: '10px 20px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'background 200ms ease-in-out',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#E8A55A'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#C8813A'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </Link>
  )
}
