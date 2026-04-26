'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { label: 'Campaign',   href: '/campaign',   symbol: '▲' },
  { label: 'Missions',   href: '/missions',   symbol: '◊' },
  { label: 'Loadout',    href: '/loadout',    symbol: '✦' },
  { label: 'Characters', href: '/characters', symbol: '◆' },
  { label: 'Gears',      href: '/gears',      symbol: '▲' },
  { label: 'Skills',     href: '/skills',     symbol: '◊' },
  { label: 'Market',     href: '/store',      symbol: '◊' },
]

const adminNavItem = { label: 'Admin',  href: '/admin',      symbol: '⚙' }

export default function GameSidebar({ username, isAdmin }: { username: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="sidebar" style={{
      width: '275px', minWidth: '275px',
      height: '100vh', position: 'sticky', top: 0,
      background: '#14171c',
      borderRight: '1px solid #24282f',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
        {/* Accent strip */}
        <div style={{ height: '5px', background: '#6a7d5a', flexShrink: 0 }} />

        {/* Logo */}
        <div style={{
          padding: '25px 25px 20px',
          borderBottom: '1px solid #24282f',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '32.5px', letterSpacing: '0.06em',
            color: '#f2f0ea', lineHeight: 1,
          }}>
            SQUADFALL
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px', letterSpacing: '0.2em',
            color: '#5a5e66', textTransform: 'uppercase',
            marginTop: '5px',
          }}>
            v0.1 · Alpha Build
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          <div className="nav-label" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px', letterSpacing: '0.25em',
            color: '#5a5e66', textTransform: 'uppercase',
            padding: '15px 25px 8px',
          }}>
            Navigation
          </div>

          {[...navItems, ...(isAdmin ? [adminNavItem] : [])].map(item => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12.5px',
                  padding: '11.25px 25px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '16px', letterSpacing: '0.15em',
                  textTransform: 'uppercase', textDecoration: 'none',
                  color: isActive ? '#f2f0ea' : '#8a8e96',
                  background: isActive ? '#1a1d22' : 'transparent',
                  borderLeft: isActive ? '3px solid #6a7d5a' : '3px solid transparent',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#f2f0ea'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#8a8e96'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span className="nav-icon" style={{
                  color: isActive ? '#6a7d5a' : '#5a5e66',
                  fontSize: '11.25px', flexShrink: 0,
                }}>
                  {item.symbol}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div style={{
          padding: '20px 25px',
          borderTop: '1px solid #24282f',
          flexShrink: 0,
        }}>
          <div className="user-label" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px', letterSpacing: '0.2em',
            color: '#5a5e66', textTransform: 'uppercase',
            marginBottom: '5px',
          }}>
            Commander
          </div>
          <div className="user-name" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13.75px', color: '#f2f0ea',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            marginBottom: '15px',
          }}>
            {username}
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11.25px', letterSpacing: '0.2em',
              color: '#c53030', textTransform: 'uppercase',
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff5555')}
            onMouseLeave={e => (e.currentTarget.style.color = '#c53030')}
          >
            ✕ Logout
          </button>
        </div>
      </aside>
  )
}
