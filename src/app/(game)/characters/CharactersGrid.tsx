'use client'

import { useState } from 'react'
import { colors, fonts, letterSpacing } from '@/design/tokens'
import type { CharacterRow, EquippedGearRow, PassiveRow, SkillRow } from './types'

const STAT_MAX = 150  // normalise bars against this ceiling

function StatBar({ label, value, factionColor }: { label: string; value: number; factionColor: string }) {
  const pct = Math.max(0, Math.min(100, (value / STAT_MAX) * 100))
  const isHp = label === 'HP'
  const isLow = pct < 33
  const barColor = isHp
    ? (isLow ? colors.warn : colors.blood)
    : factionColor
  const segments = 16
  const filledSegments = Math.round((pct / 100) * segments)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          {label}
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '20px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
          {value}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '3px',
            background: i < filledSegments
              ? i === filledSegments - 1 ? barColor : `${barColor}99`
              : colors.bgDeep,
            border: `1px solid ${i < filledSegments ? `${barColor}55` : colors.line}`,
          }} />
        ))}
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

// ── Fallback placeholders ──────────────────────────────────────────────────────

const PLACEHOLDER_SKILL: SkillRow = {
  instanceId: -1, name: '—', art: null, basePower: 0, resourceCost: 0,
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PassiveSkillCard({ passive, fc }: { passive: PassiveRow | null; fc: string }) {
  const isEmpty = !passive
  return (
    <div style={{
      border: `1px solid ${isEmpty ? colors.line : colors.line}`,
      background: isEmpty ? 'transparent' : `linear-gradient(135deg, ${colors.bg4}, ${colors.bgDeep})`,
      minHeight: '64px',
      display: 'flex', flexDirection: 'row',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {isEmpty ? (
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', opacity: 0.4 }}>
          <div style={{ width: '20px', height: '1px', background: colors.dim }} />
          <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
            Passive Skill — Not Assigned
          </span>
        </div>
      ) : (
        <>
          {/* faction left-edge glow */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, transparent, ${fc}cc, transparent)` }} />
          {/* Left panel — 30% for passive name */}
          <div style={{
            width: '30%', flexShrink: 0,
            padding: '12px 14px 12px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
            borderRight: `1px solid ${colors.line}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '4px', background: fc, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <span style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {passive.name}
              </span>
            </div>
          </div>
          {/* Right panel — 70% for passive description */}
          <div style={{
            flex: 1, minWidth: 0,
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            background: `linear-gradient(90deg, ${fc}05, transparent)`,
          }}>
            {passive.details && (
              <p style={{ fontFamily: fonts.mono, fontSize: '11px', color: colors.muted, lineHeight: 1.55, margin: 0, letterSpacing: '0.02em' }}>
                {passive.details}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyGearSlot({ slot }: { slot: 1 | 2 }) {
  return (
    <div style={{
      border: `1px solid ${colors.line}`,
      background: 'transparent',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'row',
      flex: 1, opacity: 0.45,
    }}>
      <div style={{ width: '55%', flexShrink: 0, background: colors.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: `1px solid ${colors.lineStrong}`, transform: 'rotate(45deg)' }} />
      </div>
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: `1px solid ${colors.line}` }}>
        <div style={{ width: '10px', height: '1px', background: colors.dim }} />
        <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          Gear Slot {slot} — Empty
        </span>
      </div>
    </div>
  )
}

function EquippedGearCard({ gear }: { gear: EquippedGearRow }) {
  const accent = gear.category === 'Ranged' ? colors.warn : colors.blood
  const fallback = gear.name.charAt(0).toUpperCase()
  return (
    <div style={{
      border: `1px solid ${colors.line}`,
      background: `linear-gradient(135deg, ${colors.bg3}, ${colors.bgDeep})`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'row',
      flex: 1, position: 'relative',
    }}>
      {/* top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />
      {/* art panel */}
      <div style={{ position: 'relative', aspectRatio: '16/9', flexShrink: 0, background: 'linear-gradient(135deg, #1a1d22, #0a0c10)', overflow: 'hidden' }}>
        {gear.art
          ? <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: fonts.accent, fontSize: '28px', color: `${accent}18`, letterSpacing: letterSpacing.accent }}>
                {fallback}
              </span>
            </div>
          )
        }
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent 60%, rgba(10,12,16,0.6)), radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35))' }} />
        <CornerBrackets fc={`${accent}99`} size={8} gap={4} />
      </div>
      {/* info */}
      <div style={{ flex: 1, minWidth: 0, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px', borderLeft: `1px solid ${colors.line}`, background: `linear-gradient(90deg, ${accent}05, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accent }}>{gear.subcategory}</span>
          <div style={{ flex: 1, height: '1px', background: `${accent}33` }} />
          <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.dim }}>LVL {gear.level}</span>
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: '24px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {gear.name}
        </div>
        {gear.modifier && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '3px', height: '3px', background: accent, transform: 'rotate(45deg)' }} />
            <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: accent }}>{gear.modifier}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: gear.resourcePoolSize > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '5px', minWidth: 0, marginTop: '2px' }}>
          {/* Atk */}
          <div style={{ background: `linear-gradient(180deg, ${accent}15, ${colors.bgDeep})`, border: `1px solid ${accent}44`, borderTop: `2px solid ${accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Atk</div>
            <div style={{ fontFamily: fonts.display, fontSize: '20px', letterSpacing: letterSpacing.displayTight, color: accent, lineHeight: 1 }}>{gear.statAttack}</div>
          </div>
          {gear.resourcePoolSize > 0 && (
            <div style={{ background: `linear-gradient(180deg, ${colors.warn}15, ${colors.bgDeep})`, border: `1px solid ${colors.warn}44`, borderTop: `2px solid ${colors.warn}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 4px', overflow: 'hidden' }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>{gear.resourceName}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontFamily: fonts.display, fontSize: '20px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>{gear.resourcePoolSize}</span>
                <span style={{ fontFamily: fonts.mono, fontSize: '10px', color: colors.warn, fontWeight: 700 }}>+{gear.resourceRegenRate}</span>
              </div>
            </div>
          )}
          <div style={{ background: `linear-gradient(180deg, ${colors.blood}15, ${colors.bgDeep})`, border: `1px solid ${colors.blood}44`, borderTop: `2px solid ${colors.blood}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 4px', overflow: 'hidden' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Crit Dmg</div>
            <div style={{ fontFamily: fonts.display, fontSize: '20px', letterSpacing: letterSpacing.displayTight, color: colors.blood, lineHeight: 1 }}>{gear.critDamage}%</div>
          </div>
          <div style={{ background: `linear-gradient(180deg, ${colors.blood}15, ${colors.bgDeep})`, border: `1px solid ${colors.blood}44`, borderTop: `2px solid ${colors.blood}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 4px', overflow: 'hidden' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Crit %</div>
            <div style={{ fontFamily: fonts.display, fontSize: '20px', letterSpacing: letterSpacing.displayTight, color: colors.blood, lineHeight: 1 }}>{gear.critChance}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill }: { skill: SkillRow }) {
  const isEmpty = skill.instanceId < 0
  return (
    <div style={{
      border: `1px solid ${colors.line}`,
      background: isEmpty ? 'transparent' : `linear-gradient(135deg, ${colors.bg4}, ${colors.bgDeep})`,
      display: 'flex', flexDirection: 'row',
      flex: 1, minHeight: 0, overflow: 'hidden',
      opacity: isEmpty ? 0.35 : 1,
    }}>
      {/* square art */}
      <div style={{
        aspectRatio: '1/1', flexShrink: 0, alignSelf: 'stretch', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1d22, #0a0c10)',
        borderRight: `1px solid ${colors.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!isEmpty && skill.art
          ? <img src={`/assets/skills/${skill.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '12px', height: '12px', border: `1px solid ${colors.lineStrong}`, transform: 'rotate(45deg)' }} />
        }
      </div>
      {/* details */}
      <div style={{ flex: 1, minWidth: 0, padding: '7px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
        <span style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: isEmpty ? colors.dim : colors.ink, lineHeight: 1 }}>
          {isEmpty ? 'Empty' : skill.name}
        </span>
        {!isEmpty && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {skill.basePower > 0 && (
              <span style={{ fontFamily: fonts.mono, fontSize: '8px', color: colors.warn, textTransform: 'uppercase', letterSpacing: letterSpacing.labelTight }}>
                {skill.basePower} PWR
              </span>
            )}
            {skill.basePower > 0 && skill.resourceCost > 0 && (
              <div style={{ width: '1px', height: '8px', background: colors.line }} />
            )}
            {skill.resourceCost > 0 && (
              <span style={{ fontFamily: fonts.mono, fontSize: '8px', color: colors.dim, textTransform: 'uppercase', letterSpacing: letterSpacing.labelTight }}>
                {skill.resourceCost} RES
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WeaponSkillsPanel({ gear, fc }: { gear: EquippedGearRow; fc: string }) {
  const slots: SkillRow[] = [
    gear.skills[0] ?? { ...PLACEHOLDER_SKILL, instanceId: -1 },
    gear.skills[1] ?? { ...PLACEHOLDER_SKILL, instanceId: -2 },
    gear.skills[2] ?? { ...PLACEHOLDER_SKILL, instanceId: -3 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
        <div style={{ width: '3px', height: '3px', background: fc, transform: 'rotate(45deg)', flexShrink: 0 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {gear.name}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1px', paddingTop: '1px' }}>
        {slots.map((skill, i) => <SkillCard key={skill.instanceId < 0 ? `empty-${i}` : skill.instanceId} skill={skill} />)}
      </div>
    </div>
  )
}

function EmptySkillsPanel({ slot }: { slot: 1 | 2 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', borderBottom: `1px solid ${colors.line}`, flexShrink: 0, opacity: 0.4 }}>
        <div style={{ width: '10px', height: '1px', background: colors.dim }} />
        <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          Gear Slot {slot} — No Gear Equipped
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1px', paddingTop: '1px' }}>
        {[0, 1, 2].map((i) => <SkillCard key={i} skill={{ ...PLACEHOLDER_SKILL, instanceId: -(i + 1) }} />)}
      </div>
    </div>
  )
}

// ── Main detail modal — 3-panel layout ────────────────────────────────────────

function CharacterDetailModal({ character, onClose }: { character: CharacterRow; onClose: () => void }) {
  const fc = character.factionColor
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
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          '--faction': fc,
          display: 'flex', flexDirection: 'column',
          background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${fc}22, 0 32px 80px -16px rgba(0,0,0,0.8)`,
          maxHeight: '90vh',
        } as React.CSSProperties}
      >
        {/* faction bar — tapered glow */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${fc}, ${fc}55, transparent)`, boxShadow: `0 0 12px ${fc}88`, flexShrink: 0 }} />

        {/* shared header */}
        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${colors.line}`, flexShrink: 0, background: `linear-gradient(180deg, ${fc}07, transparent)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ width: '3px', height: '3px', background: fc, transform: 'rotate(45deg)' }} />
            <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc }}>
              {character.factionName} · {character.className}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{ fontFamily: fonts.display, fontSize: '36px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {character.name}
            </span>
            <div style={{ flexShrink: 0, padding: '4px 10px', border: `1px solid ${colors.lineStrong}`, background: colors.bgDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${colors.lineStrong}, transparent)` }} />
              <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Level</span>
              <span style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.muted, lineHeight: 1 }}>{character.level}</span>
            </div>
          </div>
        </div>

        {/* 3-panel body */}
        <div style={{ display: 'flex', overflow: 'auto', flex: 1, minHeight: 0 }}>

          {/* ── LEFT PANEL — portrait + stats (width 1x = 280px) ── */}
          <div style={{
            width: 280, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${colors.line}`,
          }}>
            {/* portrait */}
            <div style={{ position: 'relative', aspectRatio: '3/4', background: `linear-gradient(180deg, ${fc}12, #141821)`, overflow: 'hidden', flexShrink: 0 }}>
              {character.art
                ? <img src={`/assets/characters/${character.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`, backgroundSize: '20px 20px', opacity: 0.3 }} />
                    <span style={{ fontFamily: fonts.accent, fontSize: '96px', color: `${fc}20`, letterSpacing: letterSpacing.accent, position: 'relative' }}>
                      {fallback}
                    </span>
                  </div>
                )
              }
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg, ${fc}08 0%, transparent 30%, rgba(11,13,16,0.92) 100%)` }} />
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45))' }} />
              {/* horizontal scan line */}
              <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '35%', height: '1px', background: `linear-gradient(90deg, transparent, ${fc}30, transparent)`, pointerEvents: 'none' }} />
              <CornerBrackets fc={`${fc}cc`} size={18} gap={8} />
            </div>

            {/* stats */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `1px solid ${colors.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: '10px', height: '1px', background: fc }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                  Combat Stats
                </span>
              </div>
              {stats.map((s) => <StatBar key={s.label} label={s.label} value={s.value} factionColor={fc} />)}
            </div>
          </div>

          {/* ── MIDDLE PANEL — passives + equipped gear (width 2x = 800px) ── */}
          <div style={{
            width: 800, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${colors.line}`,
          }}>
            {/* passive skills */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: `1px solid ${colors.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: '10px', height: '1px', background: fc }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Passive Skills</span>
              </div>
              <PassiveSkillCard passive={character.passive1} fc={fc} />
              <PassiveSkillCard passive={character.passive2} fc={fc} />
            </div>

            {/* equipped gear */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: '10px', height: '1px', background: colors.dim }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Equipped Gear</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  {character.gear1 ? <EquippedGearCard gear={character.gear1} /> : <EmptyGearSlot slot={1} />}
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  {character.gear2 ? <EquippedGearCard gear={character.gear2} /> : <EmptyGearSlot slot={2} />}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL — weapon skills (width 1x = 280px) ── */}
          <div style={{
            width: 280, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px' }}>
                <div style={{ width: '10px', height: '1px', background: colors.dim }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Weapon Skills</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0 16px 14px', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {character.gear1 ? <WeaponSkillsPanel gear={character.gear1} fc={fc} /> : <EmptySkillsPanel slot={1} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {character.gear2 ? <WeaponSkillsPanel gear={character.gear2} fc={fc} /> : <EmptySkillsPanel slot={2} />}
              </div>
            </div>
          </div>

        </div>

        {/* close bar */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${colors.line}`, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '9px',
              fontFamily: fonts.mono, fontSize: '8px',
              letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
              color: colors.dim, background: 'transparent',
              border: `1px solid ${colors.line}`, cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.ink
              e.currentTarget.style.borderColor = colors.lineStrong
              e.currentTarget.style.background = colors.bgDeep
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.dim
              e.currentTarget.style.borderColor = colors.line
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{ width: '12px', height: '1px', background: 'currentColor' }} />
            Dismiss
            <div style={{ width: '12px', height: '1px', background: 'currentColor' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CharacterGridCard({ character, onClick }: { character: CharacterRow; onClick: () => void }) {
  const fc = character.factionColor
  const fallback = character.name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        const inner = e.currentTarget.querySelector('div')
        if (inner) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          inner.style.boxShadow = `0 0 20px ${fc}80, inset 0 0 20px ${fc}20`
        }
      }}
      onMouseLeave={(e) => {
        const inner = e.currentTarget.querySelector('div')
        if (inner) {
          e.currentTarget.style.transform = 'translateY(0)'
          inner.style.boxShadow = 'none'
        }
      }}
    >
      {/* portrait and info card */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '3/4',
        background: 'linear-gradient(180deg, #2a2f38, #141821)',
        border: `1px solid ${colors.line}`, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.15s ease',
      }}>
        {character.art
          ? <img src={`/assets/characters/${character.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {/* info inside card */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', width: '100%', background: 'linear-gradient(180deg, transparent, rgba(11,13,16,0.95))' }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, marginBottom: '3px' }}>
            {character.factionName}
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
