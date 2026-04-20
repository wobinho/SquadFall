'use client'

import { useState } from 'react'
import { factionColors, colors, fonts, letterSpacing } from '@/design/tokens'
import type { CharacterRow } from './types'
import { normaliseFaction } from './types'

const STAT_MAX = 150  // normalise bars against this ceiling

function StatBar({ label, value, factionColor }: { label: string; value: number; factionColor: string }) {
  const pct = Math.max(0, Math.min(100, (value / STAT_MAX) * 100))
  const isHp = label === 'HP'
  const isLow = pct < 33

  const fillStyle: React.CSSProperties = isHp
    ? {
        width: `${pct}%`,
        background: isLow
          ? `linear-gradient(90deg, ${colors.warn}, ${colors.warnLight})`
          : `linear-gradient(90deg, ${colors.blood}, ${colors.bloodLight})`,
      }
    : {
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${factionColor}, rgba(255,255,255,0.25))`,
      }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted }}>
          {label}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: '10px', fontWeight: 700, color: colors.ink }}>
          {value}
        </span>
      </div>
      <div style={{ height: '4px', background: colors.bgDeep, border: `1px solid ${colors.line}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', transition: 'width 0.4s ease', ...fillStyle }} />
      </div>
    </div>
  )
}

function CornerBrackets({ fc, size = 14, gap = 6 }: { fc: string; size?: number; gap?: number }) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <div key={pos} style={{
          position: 'absolute',
          width: size, height: size,
          top:    pos.startsWith('t') ? gap : undefined,
          bottom: pos.startsWith('b') ? gap : undefined,
          left:   pos.endsWith('l')   ? gap : undefined,
          right:  pos.endsWith('r')   ? gap : undefined,
          borderTop:    pos.startsWith('t') ? `1px solid ${fc}` : 'none',
          borderBottom: pos.startsWith('b') ? `1px solid ${fc}` : 'none',
          borderLeft:   pos.endsWith('l')   ? `1px solid ${fc}` : 'none',
          borderRight:  pos.endsWith('r')   ? `1px solid ${fc}` : 'none',
        }} />
      ))}
    </>
  )
}

function CharacterDetailModal({ character, onClose }: { character: CharacterRow; onClose: () => void }) {
  const faction = normaliseFaction(character.faction)
  const fc = factionColors[faction]
  const fallback = character.name.charAt(0).toUpperCase()

  const stats = [
    { label: 'HP',        value: character.statHp },
    { label: 'Speed',     value: character.statSpeed },
    { label: 'Defense',   value: character.statDefense },
    { label: 'Fortitude', value: character.statFortitude },
    { label: 'Focus',     value: character.statFocus },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(11,13,16,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          '--faction': fc,
          width: 340,
          background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${fc}22, 0 32px 80px -16px rgba(0,0,0,0.8)`,
        } as React.CSSProperties}
      >
        {/* faction bar */}
        <div style={{ height: '4px', background: fc }} />

        {/* header */}
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, marginBottom: '4px' }}>
            {character.faction} · {character.className}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {character.name}
            </span>
            <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, color: colors.muted, textTransform: 'uppercase' }}>
              LVL {character.level}
            </span>
          </div>
        </div>

        {/* portrait */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(180deg, #2a2f38, #141821)', overflow: 'hidden' }}>
          {character.art
            ? <img src={character.art} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '96px', color: `${fc}22`, letterSpacing: letterSpacing.accent }}>
                  {fallback}
                </span>
              </div>
            )
          }
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 50%, rgba(11,13,16,0.95)), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5))' }} />
          <CornerBrackets fc={fc} size={18} gap={8} />
        </div>

        {/* stats */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `1px solid ${colors.line}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '2px' }}>
            Combat Stats
          </div>
          {stats.map((s) => <StatBar key={s.label} label={s.label} value={s.value} factionColor={fc} />)}
        </div>

        {/* close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            margin: '0 16px 14px',
            padding: '8px',
            fontFamily: fonts.mono,
            fontSize: '9px',
            letterSpacing: letterSpacing.labelWide,
            textTransform: 'uppercase',
            color: colors.muted,
            background: 'transparent',
            border: `1px solid ${colors.line}`,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function CharacterGridCard({ character, onClick }: { character: CharacterRow; onClick: () => void }) {
  const faction = normaliseFaction(character.faction)
  const fc = factionColors[faction]
  const fallback = character.name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* portrait */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '3/4',
        background: 'linear-gradient(180deg, #2a2f38, #141821)',
        border: `1px solid ${colors.line}`, overflow: 'hidden',
      }}>
        {character.art
          ? <img src={character.art} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: fonts.accent, fontSize: '52px', color: `${fc}22`, letterSpacing: letterSpacing.accent }}>
                {fallback}
              </span>
            </div>
          )
        }
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 50%, rgba(11,13,16,0.95)), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5))' }} />
        <CornerBrackets fc={fc} size={14} gap={6} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: fc }} />
      </div>

      {/* info below portrait */}
      <div style={{ paddingTop: '8px', width: '100%' }}>
        <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, marginBottom: '3px' }}>
          {character.faction}
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1, marginBottom: '4px' }}>
          {character.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, color: colors.muted, textTransform: 'uppercase' }}>
            {character.className}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, color: colors.dim, textTransform: 'uppercase' }}>
            Lvl {character.level}
          </span>
        </div>
      </div>
    </button>
  )
}

export function CharactersGrid({ characters }: { characters: CharacterRow[] }) {
  const [selected, setSelected] = useState<CharacterRow | null>(null)

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '24px 16px',
      }}>
        {characters.map((c) => (
          <CharacterGridCard key={c.instanceId} character={c} onClick={() => setSelected(c)} />
        ))}
      </div>

      {selected && (
        <CharacterDetailModal character={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
