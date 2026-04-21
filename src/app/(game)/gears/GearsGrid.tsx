'use client'

import { useState } from 'react'
import { colors, fonts, letterSpacing } from '@/design/tokens'
import type { GearRow } from './types'

const ATTACK_MAX = 100

const categoryColor: Record<string, string> = {
  Ranged: colors.warn,
  Melee: colors.blood,
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted }}>
          {label}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: '9px', fontWeight: 700, color: colors.ink }}>
          {value}
        </span>
      </div>
      <div style={{ height: '3px', background: colors.bgDeep, border: `1px solid ${colors.line}`, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.2))`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function CornerBrackets({ color, size = 12, gap = 6 }: { color: string; size?: number; gap?: number }) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <div key={pos} style={{
          position: 'absolute',
          width: size, height: size,
          top: pos.startsWith('t') ? gap : undefined,
          bottom: pos.startsWith('b') ? gap : undefined,
          left: pos.endsWith('l') ? gap : undefined,
          right: pos.endsWith('r') ? gap : undefined,
          borderTop: pos.startsWith('t') ? `1px solid ${color}` : 'none',
          borderBottom: pos.startsWith('b') ? `1px solid ${color}` : 'none',
          borderLeft: pos.endsWith('l') ? `1px solid ${color}` : 'none',
          borderRight: pos.endsWith('r') ? `1px solid ${color}` : 'none',
        }} />
      ))}
    </>
  )
}

function GearDetailModal({ gear, onClose }: { gear: GearRow; onClose: () => void }) {
  const accentColor = categoryColor[gear.category] ?? colors.warn
  const fallback = gear.name.charAt(0).toUpperCase()

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
          width: 520,
          background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${accentColor}22, 0 32px 80px -16px rgba(0,0,0,0.8)`,
        }}
      >
        {/* accent bar */}
        <div style={{ height: '4px', background: accentColor }} />

        {/* header */}
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${colors.line}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accentColor, marginBottom: '4px' }}>
            {gear.category} · {gear.subcategory}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {gear.name}
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.muted, lineHeight: 1 }}>
              LVL {gear.level}
            </span>
          </div>
          {gear.modifier && (
            <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, color: colors.dim, textTransform: 'uppercase', marginTop: '4px' }}>
              Modifier · <span style={{ color: accentColor }}>{gear.modifier}</span>
            </div>
          )}
        </div>

        {/* art panel — landscape 16:9 */}
        <div style={{ position: 'relative', aspectRatio: '16/9', height: '280px', background: 'linear-gradient(180deg, #1a1d22, #0a0c10)', overflow: 'hidden' }}>
          {gear.art
            ? <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '80px', color: `${accentColor}18`, letterSpacing: letterSpacing.accent }}>
                  {fallback}
                </span>
              </div>
            )
          }
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 40%, rgba(11,13,16,0.9)), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4))' }} />
          <CornerBrackets color={accentColor} size={16} gap={8} />
        </div>

        {/* stats */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `1px solid ${colors.line}` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '2px' }}>
            Weapon Stats
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: colors.bgDeep, border: `1px solid ${accentColor}44`,
              padding: '10px 8px',
            }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted, marginBottom: '4px' }}>
                Attack
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '24px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1 }}>
                {gear.statAttack}
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: colors.bgDeep, border: `1px solid ${accentColor}44`,
              padding: '10px 8px',
            }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted, marginBottom: '4px' }}>
                {gear.resourceName}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '24px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                {gear.resourcePoolSize}
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: colors.bgDeep, border: `1px solid ${accentColor}44`,
              padding: '10px 8px',
            }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted, marginBottom: '4px' }}>
                Regen / Turn
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: '24px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                +{gear.resourceRegenRate}
              </div>
            </div>
          </div>
        </div>

        {/* close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            margin: '0 16px 14px',
            padding: '8px',
            fontFamily: fonts.mono, fontSize: '9px',
            letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
            color: colors.muted, background: 'transparent',
            border: `1px solid ${colors.line}`, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function GearGridCard({ gear, onClick }: { gear: GearRow; onClick: () => void }) {
  const accentColor = categoryColor[gear.category] ?? colors.warn
  const fallback = gear.name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s ease', width: '100%',
      }}
      onMouseEnter={(e) => {
        const inner = e.currentTarget.querySelector<HTMLElement>('div')
        if (inner) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          inner.style.boxShadow = `0 0 20px ${accentColor}70, inset 0 0 20px ${accentColor}18`
        }
      }}
      onMouseLeave={(e) => {
        const inner = e.currentTarget.querySelector<HTMLElement>('div')
        if (inner) {
          e.currentTarget.style.transform = 'translateY(0)'
          inner.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{
        position: 'relative', width: '100%',
        background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
        border: `1px solid ${colors.line}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.15s ease',
      }}>
        {/* accent bar */}
        <div style={{ height: '3px', background: accentColor, flexShrink: 0 }} />

        {/* landscape art panel */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a1d22, #0a0c10)', overflow: 'hidden', flexShrink: 0 }}>
          {gear.art
            ? <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '42px', color: `${accentColor}18`, letterSpacing: letterSpacing.accent }}>
                  {fallback}
                </span>
              </div>
            )
          }
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 30%, rgba(11,13,16,0.85)), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4))' }} />
          <CornerBrackets color={accentColor} size={12} gap={6} />

          {/* level badge bottom-right */}
          <div style={{
            position: 'absolute', bottom: '8px', right: '8px',
            fontFamily: fonts.mono, fontSize: '10px', letterSpacing: letterSpacing.labelTight,
            textTransform: 'uppercase', color: colors.dim,
            background: 'rgba(10,12,16,0.85)', border: `1px solid ${colors.line}`,
            padding: '4px 8px',
          }}>
            LVL {gear.level}
          </div>

          {/* name + subcategory bottom-left */}
          <div style={{
            position: 'absolute', bottom: '8px', left: '8px',
            display: 'flex', flexDirection: 'column',
            paddingLeft: '4px',
          }}>
            <div style={{ fontFamily: fonts.display, fontSize: '24px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {gear.name}
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: '10.5px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accentColor, marginTop: '2px' }}>
              {gear.subcategory}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export function GearsGrid({ gears }: { gears: GearRow[] }) {
  const [selected, setSelected] = useState<GearRow | null>(null)

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
      }}>
        {gears.map((g) => (
          <GearGridCard key={g.instanceId} gear={g} onClick={() => setSelected(g)} />
        ))}
      </div>

      {selected && (
        <GearDetailModal gear={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
