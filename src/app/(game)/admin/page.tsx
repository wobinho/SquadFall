'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAdminAccess() {
      const res = await fetch('/api/auth/check-admin')
      if (!res.ok) {
        router.push('/')
      }
    }
    checkAdminAccess()
  }, [router])

  return (
    <div>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '48px', letterSpacing: '0.04em',
        color: '#f2f0ea', marginBottom: '24px',
      }}>
        ADMIN PANEL
      </h1>

      <div style={{
        background: '#1a1d22',
        border: '1px solid #24282f',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '14px', letterSpacing: '0.15em',
          color: '#6a7d5a', textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          System Overview
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            background: '#14171c',
            border: '1px solid #24282f',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', letterSpacing: '0.2em',
              color: '#8a8e96', textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Total Users
            </div>
            <div style={{
              fontSize: '24px', color: '#f2f0ea', fontWeight: 'bold',
            }}>
              --
            </div>
          </div>

          <div style={{
            background: '#14171c',
            border: '1px solid #24282f',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', letterSpacing: '0.2em',
              color: '#8a8e96', textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Active Admins
            </div>
            <div style={{
              fontSize: '24px', color: '#f2f0ea', fontWeight: 'bold',
            }}>
              --
            </div>
          </div>

          <div style={{
            background: '#14171c',
            border: '1px solid #24282f',
            padding: '16px',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', letterSpacing: '0.2em',
              color: '#8a8e96', textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              System Status
            </div>
            <div style={{
              fontSize: '24px', color: '#6a9968', fontWeight: 'bold',
            }}>
              OPERATIONAL
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#1a1d22',
        border: '1px solid #24282f',
        padding: '24px',
      }}>
        <h2 style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '14px', letterSpacing: '0.15em',
          color: '#6a7d5a', textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          Management Tools
        </h2>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <button style={{
            padding: '12px 16px',
            background: '#6a7d5a',
            color: '#f2f0ea',
            border: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '16px', letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7a9068')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6a7d5a')}
          >
            ⚙ User Management
          </button>

          <button style={{
            padding: '12px 16px',
            background: '#6a7d5a',
            color: '#f2f0ea',
            border: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '16px', letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7a9068')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6a7d5a')}
          >
            📊 Analytics & Reports
          </button>

          <button style={{
            padding: '12px 16px',
            background: '#6a7d5a',
            color: '#f2f0ea',
            border: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '16px', letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7a9068')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6a7d5a')}
          >
            🔐 Security Settings
          </button>

          <button style={{
            padding: '12px 16px',
            background: '#6a7d5a',
            color: '#f2f0ea',
            border: 'none',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '16px', letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'background 0.15s',
            textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7a9068')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6a7d5a')}
          >
            📝 Logs & Audits
          </button>
        </div>
      </div>
    </div>
  )
}
