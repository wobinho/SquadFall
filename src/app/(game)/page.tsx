import { getSession } from '@/lib/auth'
import { db, initDb } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Run { id: number; wave: number; status: string; created_at: string }
interface CharacterInstance { instance_id: number; name: string; faction: string; class_name: string; level: number }

const FACTION_COLORS: Record<string, string> = {
  ironwatch: '#6a7d5a',
  rustborn:  '#c7641c',
  ashkin:    '#b83a1e',
  verdant:   '#6b8a3a',
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#6b8a3a',
  failed:    '#c53030',
  active:    '#e8a736',
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export default async function HomePage() {
  const session = await getSession()
  const userId = session!.userId
  await initDb()

  const runsResult = await db.execute({ sql: 'SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 8', args: [userId] })
  const runs = runsResult.rows as unknown as Run[]

  const charsResult = await db.execute({
    sql: `SELECT ci.id as instance_id, c.name, c.faction, c.class_name, ci.level
          FROM character_instances ci
          JOIN characters c ON c.id = ci.character_id
          WHERE ci.user_id = ?
          ORDER BY ci.level DESC`,
    args: [userId],
  })
  const characters = charsResult.rows as unknown as CharacterInstance[]

  const activeRun = runs.find(r => r.status === 'active')
  const completedCount = runs.filter(r => r.status === 'completed').length
  const highestWave = runs.reduce((m, r) => Math.max(m, Number(r.wave)), 0)

  const statCards = [
    { label: 'Active Squad',  value: String(characters.length), sub: 'Survivors deployed',  accent: '#6a7d5a' },
    { label: 'Current Wave',  value: activeRun ? String(activeRun.wave) : '—', sub: activeRun ? 'Run in progress' : 'No active run', accent: '#e8a736' },
    { label: 'Highest Wave',  value: highestWave > 0 ? String(highestWave) : '—', sub: `${completedCount} runs completed`, accent: '#c53030' },
  ]

  return (
    <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', letterSpacing: '0.25em',
            color: '#6a7d5a', textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Tactical Overview · Wave Status
          </div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '40px', letterSpacing: '0.04em',
            color: '#f2f0ea', lineHeight: 1,
          }}>
            Command Center
          </h1>
        </div>

        {/* Stat cards */}
        <div className="stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              background: '#14171c', border: '1px solid #24282f',
              padding: '20px 24px 18px',
            }}>
              <div style={{ height: '2px', background: card.accent, marginBottom: '16px' }} />
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '52px', letterSpacing: '0.02em',
                color: '#f2f0ea', lineHeight: 1, marginBottom: '4px',
              }}>
                {card.value}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', letterSpacing: '0.2em',
                color: '#f2f0ea', textTransform: 'uppercase', marginBottom: '4px',
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', letterSpacing: '0.1em',
                color: '#5a5e66', textTransform: 'uppercase',
              }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* Recent runs table */}
        <div className="runs-table" style={{ background: '#14171c', border: '1px solid #24282f' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #24282f',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px', letterSpacing: '0.04em', color: '#f2f0ea',
            }}>
              Recent Runs
            </h2>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', letterSpacing: '0.2em',
              color: '#5a5e66', textTransform: 'uppercase',
            }}>
              Last {runs.length} entries
            </span>
          </div>

          {runs.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', letterSpacing: '0.15em',
              color: '#5a5e66', textTransform: 'uppercase',
            }}>
              — No runs recorded —
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 80px 100px',
                padding: '8px 20px', borderBottom: '1px solid #24282f',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', letterSpacing: '0.2em',
                color: '#5a5e66', textTransform: 'uppercase',
              }}>
                <span>Run</span><span>Date</span><span>Wave</span><span>Status</span>
              </div>
              {runs.map((run, i) => (
                <div key={run.id} style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 80px 100px',
                  padding: '10px 20px',
                  borderBottom: i < runs.length - 1 ? '1px solid #24282f' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px', color: '#8a8e96', alignItems: 'center',
                }}>
                  <span style={{ color: '#5a5e66', fontSize: '12px' }}>#{run.id}</span>
                  <span style={{ fontSize: '12px', letterSpacing: '0.05em' }}>{fmtDate(run.created_at)}</span>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '18px', color: '#f2f0ea', letterSpacing: '0.04em',
                  }}>
                    W{run.wave}
                  </span>
                  <span style={{
                    fontSize: '10px', letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STATUS_COLORS[run.status] ?? '#8a8e96',
                  }}>
                    {run.status}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Squad roster */}
          <div style={{ background: '#14171c', border: '1px solid #24282f' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #24282f' }}>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '20px', letterSpacing: '0.04em', color: '#f2f0ea',
              }}>
                Active Squad
              </h2>
            </div>
            {characters.length === 0 ? (
              <div style={{
                padding: '24px 20px', textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', letterSpacing: '0.15em',
                color: '#5a5e66', textTransform: 'uppercase',
              }}>
                — No squad assembled —
              </div>
            ) : characters.map((char, i) => {
              const color = FACTION_COLORS[char.faction] ?? '#6a7d5a'
              return (
                <div key={char.instance_id} style={{
                  padding: '12px 20px',
                  borderBottom: i < characters.length - 1 ? '1px solid #24282f' : 'none',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '32px', height: '32px', background: '#0a0c10',
                    border: `1px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '14px', color, flexShrink: 0,
                  }}>
                    {String(char.name)[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '15px', letterSpacing: '0.04em',
                      color: '#f2f0ea', lineHeight: 1.1,
                    }}>
                      {char.name}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px', letterSpacing: '0.15em',
                      color, textTransform: 'uppercase', marginTop: '2px',
                    }}>
                      {char.faction} · {char.class_name}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '20px', color: '#5a5e66',
                  }}>
                    {char.level}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Deploy CTA */}
          <Link href="/missions" style={{
            display: 'block', background: '#6a7d5a', color: '#f2f0ea',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '20px', letterSpacing: '0.08em',
            textAlign: 'center', padding: '16px', textDecoration: 'none',
          }}>
            ▲ DEPLOY SQUAD
          </Link>

          {/* Faction legend */}
          <div style={{ background: '#14171c', border: '1px solid #24282f' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #24282f' }}>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '16px', letterSpacing: '0.04em', color: '#f2f0ea',
              }}>
                Factions
              </h2>
            </div>
            {Object.entries(FACTION_COLORS).map(([faction, color], i, arr) => (
              <div key={faction} style={{
                padding: '8px 20px',
                borderLeft: `3px solid ${color}`,
                borderBottom: i < arr.length - 1 ? '1px solid #24282f' : 'none',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', letterSpacing: '0.15em',
                  color, textTransform: 'uppercase',
                }}>
                  {faction}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
