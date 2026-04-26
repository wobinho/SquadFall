'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Enemy {
  id: number
  name: string
  race: string
  type: string
  art: string | null
  statHp: number
  statAtk: number
  statDef: number
  statSpeed: number
}

interface EnemySkill {
  id: number
  name: string
  description: string
  basePower: number
  art: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const C = {
  bg:       '#08090b',
  bg2:      '#0a0c10',
  bg3:      '#0f1115',
  bg4:      '#14171c',
  ink:      '#f2f0ea',
  muted:    '#8a8e96',
  dim:      '#5a5e66',
  dimmer:   '#3a3f48',
  line:     '#1e2228',
  lineStr:  '#2a2f38',
  blood:    '#c53030',
  bloodDim: '#7a1a1a',
  bloodGlow:'rgba(197,48,48,0.18)',
  gold:     '#e8a736',
  goldDim:  '#8a6020',
  green:    '#6b8a3a',
  purple:   '#9b59d4',
}

const MONO    = "'JetBrains Mono', monospace"
const DISPLAY = "'Bebas Neue', sans-serif"

// ── Helpers ────────────────────────────────────────────────────────────────────

function raceColor(race: string): string {
  const r = (race ?? '').toLowerCase()
  if (r.includes('iron') || r.includes('mech'))  return '#7ab3d4'
  if (r.includes('rust') || r.includes('scrap'))  return '#c87850'
  if (r.includes('ash')  || r.includes('undead')) return '#9898b8'
  if (r.includes('verd') || r.includes('beast'))  return '#6b8a3a'
  return C.blood
}

function typeLabel(type: string): { label: string; color: string } {
  const t = (type ?? '').toLowerCase()
  if (t.includes('elite'))  return { label: 'ELITE',   color: C.gold }
  if (t.includes('boss'))   return { label: 'BOSS',    color: '#ff5555' }
  if (t.includes('minion')) return { label: 'MINION',  color: C.dim }
  if (t.includes('swarm'))  return { label: 'SWARM',   color: '#c87850' }
  return { label: (type ?? 'UNIT').toUpperCase(), color: C.muted }
}

function StatBar({ value, max = 200, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(1, value / max)
  const segs = 12
  const filled = Math.round(pct * segs)
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '3px',
          background: i < filled ? color : C.line,
          opacity: i < filled ? (i === filled - 1 ? 1 : 0.6) : 1,
        }} />
      ))}
    </div>
  )
}

// ── Enemy Grid Card ────────────────────────────────────────────────────────────

function EnemyGridCard({ enemy, onClick, selected }: {
  enemy: Enemy
  onClick: () => void
  selected: boolean
}) {
  const rc = raceColor(enemy.race)
  const tl = typeLabel(enemy.type)

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: selected ? `${C.blood}0f` : C.bg2,
        border: `1px solid ${selected ? C.blood : C.line}`,
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: selected ? `0 0 20px ${C.bloodGlow}` : 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = `${C.blood}66`
          e.currentTarget.style.boxShadow = `0 0 12px ${C.bloodGlow}`
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = C.line
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* top accent bar */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${rc}, ${rc}44, transparent)` }} />

      {/* art area */}
      <div style={{
        height: '90px',
        background: `radial-gradient(ellipse at center bottom, ${rc}18 0%, transparent 70%), ${C.bg}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {enemy.art ? (
          <img
            src={`/assets/enemies/${enemy.art}.png`}
            alt={enemy.name}
            style={{
              height: '80px', width: '80px', objectFit: 'contain',
              imageRendering: 'pixelated',
              filter: `drop-shadow(0 0 8px ${rc}44)`,
            }}
          />
        ) : (
          <span style={{
            fontFamily: DISPLAY, fontSize: '40px',
            color: `${rc}44`, letterSpacing: '0.04em',
          }}>
            {enemy.name.charAt(0)}
          </span>
        )}

        {/* type badge */}
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          background: C.bg, border: `1px solid ${tl.color}44`,
          padding: '2px 5px',
          fontFamily: MONO, fontSize: '7px',
          letterSpacing: '0.2em', color: tl.color,
        }}>
          {tl.label}
        </div>
      </div>

      {/* info */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.line}` }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: '16px',
          letterSpacing: '0.04em', color: C.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: '2px',
        }}>
          {enemy.name}
        </div>
        <div style={{
          fontFamily: MONO, fontSize: '8px',
          color: rc, letterSpacing: '0.15em', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {enemy.race || 'UNKNOWN'}
        </div>

        {/* mini stats */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {[
            { l: 'HP',  v: enemy.statHp,    c: C.blood },
            { l: 'ATK', v: enemy.statAtk,   c: C.gold  },
            { l: 'DEF', v: enemy.statDef,   c: C.muted },
            { l: 'SPD', v: enemy.statSpeed, c: '#7ab3d4' },
          ].map(s => (
            <div key={s.l} style={{
              flex: 1, background: C.bg, border: `1px solid ${s.c}22`,
              padding: '3px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <span style={{ fontFamily: MONO, fontSize: '6px', color: C.dim, letterSpacing: '0.2em' }}>{s.l}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '13px', color: s.c, lineHeight: 1 }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}

// ── Enemy Detail Modal ─────────────────────────────────────────────────────────

function EnemyDetailModal({ enemy, allSkills, onClose }: {
  enemy: Enemy
  allSkills: EnemySkill[]
  onClose: () => void
}) {
  const rc = raceColor(enemy.race)
  const tl = typeLabel(enemy.type)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeInModal 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '720px', maxWidth: '96vw', maxHeight: '90vh',
          overflowY: 'auto',
          background: C.bg,
          border: `1px solid ${C.blood}55`,
          boxShadow: `0 0 80px ${C.bloodGlow}, 0 0 160px rgba(197,48,48,0.06)`,
          position: 'relative',
          animation: 'slideUpModal 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* top accent */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${rc}, ${C.blood}88, transparent)` }} />

        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '20px',
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${C.line}`,
          background: `radial-gradient(ellipse at 20% 50%, ${rc}0a 0%, transparent 60%)`,
        }}>
          {/* art */}
          <div style={{
            width: '100px', height: '100px', flexShrink: 0,
            background: `radial-gradient(ellipse at center, ${rc}18 0%, transparent 70%)`,
            border: `1px solid ${rc}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {enemy.art ? (
              <img
                src={`/assets/enemies/${enemy.art}.png`}
                alt={enemy.name}
                style={{
                  width: '88px', height: '88px', objectFit: 'contain',
                  imageRendering: 'pixelated',
                  filter: `drop-shadow(0 0 10px ${rc}55)`,
                }}
              />
            ) : (
              <span style={{ fontFamily: DISPLAY, fontSize: '56px', color: `${rc}55` }}>
                {enemy.name.charAt(0)}
              </span>
            )}
          </div>

          {/* name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                fontFamily: MONO, fontSize: '7px', letterSpacing: '0.3em',
                color: C.dim, textTransform: 'uppercase',
              }}>
                ENEMY // ID {enemy.id}
              </div>
              <div style={{
                background: C.bg2, border: `1px solid ${tl.color}44`,
                padding: '2px 6px',
                fontFamily: MONO, fontSize: '7px',
                letterSpacing: '0.2em', color: tl.color,
              }}>
                {tl.label}
              </div>
            </div>

            <div style={{
              fontFamily: DISPLAY, fontSize: '38px',
              letterSpacing: '0.04em', color: C.ink, lineHeight: 1,
              marginBottom: '4px',
            }}>
              {enemy.name}
            </div>

            <div style={{
              fontFamily: MONO, fontSize: '9px',
              color: rc, letterSpacing: '0.2em', textTransform: 'uppercase',
            }}>
              {enemy.race || 'UNKNOWN RACE'} &nbsp;·&nbsp; {enemy.type || 'UNKNOWN TYPE'}
            </div>
          </div>

          {/* close */}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: C.dim,
              cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0,
              padding: '2px 6px', transition: 'color 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
            onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
          >✕</button>
        </div>

        {/* body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* stats panel */}
          <div>
            <div style={{
              fontFamily: MONO, fontSize: '8px', letterSpacing: '0.3em',
              color: C.dim, textTransform: 'uppercase', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '8px', height: '1px', background: C.blood }} />
              COMBAT STATISTICS
              <div style={{ flex: 1, height: '1px', background: C.line }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { label: 'HIT POINTS',  value: enemy.statHp,    color: C.blood,    max: 400 },
                { label: 'ATTACK',      value: enemy.statAtk,   color: C.gold,     max: 200 },
                { label: 'DEFENSE',     value: enemy.statDef,   color: C.muted,    max: 200 },
                { label: 'SPEED',       value: enemy.statSpeed, color: '#7ab3d4',  max: 200 },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: C.bg2, border: `1px solid ${stat.color}22`,
                  padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.2em' }}>
                      {stat.label}
                    </span>
                    <span style={{ fontFamily: DISPLAY, fontSize: '24px', color: stat.color, lineHeight: 1 }}>
                      {stat.value}
                    </span>
                  </div>
                  <StatBar value={stat.value} max={stat.max} color={stat.color} />
                </div>
              ))}
            </div>
          </div>

          {/* skills panel */}
          <div>
            <div style={{
              fontFamily: MONO, fontSize: '8px', letterSpacing: '0.3em',
              color: C.dim, textTransform: 'uppercase', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '8px', height: '1px', background: C.blood }} />
              ENEMY SKILL POOL
              <div style={{ flex: 1, height: '1px', background: C.line }} />
              <span style={{ color: C.dimmer, fontSize: '7px' }}>ASSIGN IN SIMULATOR</span>
            </div>

            {allSkills.length === 0 ? (
              <div style={{
                padding: '24px', textAlign: 'center',
                border: `1px dashed ${C.line}`,
                fontFamily: MONO, fontSize: '10px', color: C.dimmer,
                letterSpacing: '0.2em',
              }}>
                NO SKILLS DEFINED
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {allSkills.slice(0, 4).map((skill, i) => (
                  <SkillCard key={skill.id} skill={skill} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Skill Card (inside detail modal) ──────────────────────────────────────────

function SkillCard({ skill, index }: { skill: EnemySkill; index: number }) {
  const indexColors = ['#c53030', '#e8a736', '#7ab3d4', '#9b59d4']
  const c = indexColors[index] ?? C.muted

  return (
    <div style={{
      background: C.bg2, border: `1px solid ${c}33`,
      padding: '12px 14px', display: 'flex', gap: '12px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* index marker */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '2px', background: c,
      }} />

      {/* art thumb */}
      <div style={{
        width: '36px', height: '36px', flexShrink: 0,
        background: `${c}15`, border: `1px solid ${c}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {skill.art ? (
          <img
            src={`/assets/enemy-skill/${skill.art}.png`}
            alt=""
            style={{ width: '30px', height: '30px', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        ) : (
          <span style={{ fontFamily: DISPLAY, fontSize: '16px', color: `${c}88` }}>
            {index + 1}
          </span>
        )}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: '15px',
          letterSpacing: '0.04em', color: C.ink,
          marginBottom: '2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {skill.name}
        </div>
        <div style={{
          fontFamily: MONO, fontSize: '9px', color: C.muted,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {skill.description || 'No description.'}
        </div>
      </div>

      {/* power */}
      <div style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.2em' }}>PWR</span>
        <span style={{ fontFamily: DISPLAY, fontSize: '22px', color: c, lineHeight: 1 }}>
          {skill.basePower}
        </span>
      </div>
    </div>
  )
}

// ── Enemy Skills Grid Card ─────────────────────────────────────────────────────

function EnemySkillGridCard({ skill }: { skill: EnemySkill }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${C.blood}0a` : C.bg2,
        border: `1px solid ${hovered ? `${C.blood}55` : C.line}`,
        padding: '14px',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex', gap: '14px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* left accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '2px',
        background: hovered ? C.blood : C.dimmer,
        transition: 'background 0.15s',
      }} />

      {/* art */}
      <div style={{
        width: '48px', height: '48px', flexShrink: 0,
        background: `${C.blood}10`, border: `1px solid ${C.blood}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {skill.art ? (
          <img
            src={`/assets/enemy-skill/${skill.art}.png`}
            alt=""
            style={{ width: '40px', height: '40px', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        ) : (
          <span style={{ fontFamily: DISPLAY, fontSize: '24px', color: `${C.blood}44` }}>◈</span>
        )}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <div style={{
            fontFamily: DISPLAY, fontSize: '18px',
            letterSpacing: '0.04em', color: C.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {skill.name}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: '4px', marginLeft: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.2em' }}>BASE PWR</span>
            <span style={{ fontFamily: DISPLAY, fontSize: '22px', color: C.blood, lineHeight: 1 }}>
              {skill.basePower}
            </span>
          </div>
        </div>

        <div style={{
          fontFamily: MONO, fontSize: '9px', color: C.muted, lineHeight: 1.5,
        }}>
          {skill.description || <span style={{ color: C.dimmer }}>No description defined.</span>}
        </div>

        <div style={{ marginTop: '6px' }}>
          <span style={{
            fontFamily: MONO, fontSize: '7px', letterSpacing: '0.2em',
            color: C.dimmer, textTransform: 'uppercase',
            background: C.bg, border: `1px solid ${C.line}`,
            padding: '2px 6px',
          }}>
            ID {skill.id}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main EnemyView Component ───────────────────────────────────────────────────

export function EnemyView() {
  const [enemies, setEnemies]       = useState<Enemy[]>([])
  const [skills, setSkills]         = useState<EnemySkill[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'enemies' | 'skills'>('enemies')
  const [selected, setSelected]     = useState<Enemy | null>(null)
  const [search, setSearch]         = useState('')
  const [filterRace, setFilterRace] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/admin/simulator')
      .then(r => r.json())
      .then(d => {
        setEnemies(d.enemies ?? [])
        setSkills(d.enemySkills ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const races = ['ALL', ...Array.from(new Set(enemies.map(e => e.race).filter(Boolean)))]

  const filteredEnemies = enemies.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.race.toLowerCase().includes(search.toLowerCase()) ||
      e.type.toLowerCase().includes(search.toLowerCase())
    const matchRace = filterRace === 'ALL' || e.race === filterRace
    return matchSearch && matchRace
  })

  const filteredSkills = skills.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{
      padding: '80px', textAlign: 'center',
      fontFamily: MONO, fontSize: '10px',
      color: `${C.blood}66`, letterSpacing: '0.3em',
      animation: 'fadeIn 0.4s ease',
    }}>
      ◈ LOADING ENEMY DATA...
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes fadeIn       { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInModal  { from{opacity:0} to{opacity:1} }
        @keyframes slideUpModal { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline     { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
      `}</style>

      {/* ── tabs ── */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: '20px',
        borderBottom: `1px solid ${C.line}`,
      }}>
        {([
          { id: 'enemies', label: `◈ ENEMIES`, count: enemies.length },
          { id: 'skills',  label: `◆ SKILLS`,  count: skills.length  },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch('') }}
            style={{
              padding: '8px 20px',
              background: tab === t.id ? `${C.blood}0f` : 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? C.blood : 'transparent'}`,
              color: tab === t.id ? C.blood : C.dim,
              cursor: 'pointer',
              fontFamily: MONO, fontSize: '9px',
              letterSpacing: '0.25em', textTransform: 'uppercase',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = C.muted }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = C.dim }}
          >
            {t.label}
            <span style={{
              fontFamily: MONO, fontSize: '8px',
              color: tab === t.id ? C.blood : C.dimmer,
              background: C.bg2, border: `1px solid ${tab === t.id ? `${C.blood}44` : C.line}`,
              padding: '1px 5px',
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── toolbar ── */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center',
        marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'enemies' ? 'SEARCH ENEMIES...' : 'SEARCH SKILLS...'}
          style={{
            background: C.bg2, border: `1px solid ${C.line}`,
            color: C.ink, padding: '6px 12px',
            fontFamily: MONO, fontSize: '10px',
            letterSpacing: '0.1em', outline: 'none',
            width: '200px', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = `${C.blood}66`)}
          onBlur={e  => (e.currentTarget.style.borderColor = C.line)}
        />

        {tab === 'enemies' && races.length > 1 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {races.map(r => (
              <button
                key={r}
                onClick={() => setFilterRace(r)}
                style={{
                  padding: '4px 10px',
                  background: filterRace === r ? `${raceColor(r)}22` : C.bg2,
                  border: `1px solid ${filterRace === r ? raceColor(r) : C.line}`,
                  color: filterRace === r ? raceColor(r) : C.dim,
                  cursor: 'pointer', fontFamily: MONO, fontSize: '8px',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  transition: 'all 0.1s',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <span style={{
          marginLeft: 'auto', fontFamily: MONO, fontSize: '8px',
          color: C.dimmer, letterSpacing: '0.2em',
        }}>
          {tab === 'enemies'
            ? `${filteredEnemies.length} / ${enemies.length} ENEMIES`
            : `${filteredSkills.length} / ${skills.length} SKILLS`}
        </span>
      </div>

      {/* ── enemies tab ── */}
      {tab === 'enemies' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {filteredEnemies.length === 0 ? (
            <div style={{
              padding: '60px', textAlign: 'center',
              border: `1px dashed ${C.line}`,
              fontFamily: MONO, fontSize: '10px',
              color: C.dimmer, letterSpacing: '0.2em',
            }}>
              {enemies.length === 0 ? '◈ NO ENEMIES IN DATABASE' : '◈ NO RESULTS FOUND'}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '10px',
            }}>
              {filteredEnemies.map(enemy => (
                <EnemyGridCard
                  key={enemy.id}
                  enemy={enemy}
                  selected={selected?.id === enemy.id}
                  onClick={() => setSelected(enemy)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── skills tab ── */}
      {tab === 'skills' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {filteredSkills.length === 0 ? (
            <div style={{
              padding: '60px', textAlign: 'center',
              border: `1px dashed ${C.line}`,
              fontFamily: MONO, fontSize: '10px',
              color: C.dimmer, letterSpacing: '0.2em',
            }}>
              {skills.length === 0 ? '◆ NO SKILLS IN DATABASE' : '◆ NO RESULTS FOUND'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredSkills.map(skill => (
                <EnemySkillGridCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── detail modal ── */}
      {selected && (
        <EnemyDetailModal
          enemy={selected}
          allSkills={skills}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
