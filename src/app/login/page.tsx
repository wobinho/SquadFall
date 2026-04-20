'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #1a1d22 0%, #0b0d10 60%)',
    }}>
      {/* Subtle grid overlay */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(106,125,90,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(106,125,90,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#14171c',
        border: '1px solid #24282f',
        position: 'relative', zIndex: 1,
      }}>
        {/* Ironwatch faction bar */}
        <div style={{ height: '4px', background: '#6a7d5a' }} />

        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', letterSpacing: '0.25em',
              color: '#6a7d5a', textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Ironwatch Command
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '48px', letterSpacing: '0.04em',
              lineHeight: '1', color: '#f2f0ea',
            }}>
              SQUADFALL
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px', letterSpacing: '0.25em',
              color: '#8a8e96', textTransform: 'uppercase',
              marginTop: '8px',
            }}>
              Commander Login
            </div>
          </div>

          <div style={{ height: '1px', background: '#24282f', marginBottom: '28px' }} />

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px', letterSpacing: '0.2em',
                color: '#8a8e96', textTransform: 'uppercase',
                marginBottom: '6px',
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="commander"
                required
                style={{
                  width: '100%', background: '#0a0c10',
                  border: '1px solid #24282f', color: '#f2f0ea',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', padding: '10px 12px',
                  outline: 'none', borderRadius: 0,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#6a7d5a')}
                onBlur={e => (e.target.style.borderColor = '#24282f')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px', letterSpacing: '0.2em',
                color: '#8a8e96', textTransform: 'uppercase',
                marginBottom: '6px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="········"
                required
                style={{
                  width: '100%', background: '#0a0c10',
                  border: '1px solid #24282f', color: '#f2f0ea',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', padding: '10px 12px',
                  outline: 'none', borderRadius: 0,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#6a7d5a')}
                onBlur={e => (e.target.style.borderColor = '#24282f')}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', letterSpacing: '0.1em',
                color: '#c53030', marginBottom: '16px',
                padding: '8px 10px',
                border: '1px solid rgba(197,48,48,0.3)',
                background: 'rgba(197,48,48,0.06)',
              }}>
                ✕ {error.toUpperCase()}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#3d4a35' : '#6a7d5a',
                color: '#f2f0ea',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '18px', letterSpacing: '0.08em',
                padding: '12px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s', borderRadius: 0,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#7a9068' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6a7d5a' }}
            >
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </button>
          </form>

          <div style={{ height: '1px', background: '#24282f', margin: '28px 0 16px' }} />

          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px', letterSpacing: '0.2em',
            color: '#5a5e66', textTransform: 'uppercase',
            textAlign: 'center', lineHeight: '1.6',
          }}>
            Classified System · Authorized Personnel Only
            <br />
            <span style={{ color: '#3a3f48' }}>Dev: commander / commander</span>
          </div>
        </div>
      </div>
    </div>
  )
}
