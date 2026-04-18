import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const ADMIN_USER_IDS = [
  '1a5b902c-9e3a-44cd-970a-bb852b1cd5e4',
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    redirect('/dashboard')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0D0603' }}>
      {/* Admin sidebar */}
      <div style={{
        width: 220, flexShrink: 0, background: '#080402',
        borderRight: '1px solid #2E1A0E', display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2E1A0E' }}>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#F5ECD7' }}>
              espresso<span style={{ color: '#C8813A' }}>.</span>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#C8813A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
              Admin
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/maya', label: 'Maya Playground', icon: '🤖' },
            { href: '/admin/library', label: 'Library & Atlas', icon: '📚' },
            { href: '/admin/agents', label: 'Agents', icon: '⚡' },
            { href: '/admin/accounts', label: 'FA Accounts', icon: '👥' },
            { href: '/dashboard', label: '← FA Dashboard', icon: '↩' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 24px', textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#C9B99A',
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin badge */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2E1A0E' }}>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#C8813A', background: 'rgba(200,129,58,0.1)', padding: '4px 10px', borderRadius: 100, textAlign: 'center', border: '1px solid #3D2215' }}>
            Chairman Wayne
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
