'use client'

import { useState } from 'react'
import { colors, fonts, letterSpacing } from '@/design/tokens'
import type { CharacterRow, EquippedGearRow, PassiveRow, SkillRow } from './types'

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

// ── Fallback placeholders ──────────────────────────────────────────────────────

const PLACEHOLDER_SKILL: SkillRow = {
  instanceId: -1, name: '—', art: null, basePower: 0, resourceCost: 0,
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PassiveSkillCard({ passive, fc }: { passive: PassiveRow | null; fc: string }) {
  const isEmpty = !passive
  return (
    <div style={{
      border: `1px solid ${isEmpty ? colors.bgDeep : colors.line}`,
      background: isEmpty ? colors.bgDeep : colors.bg4,
      padding: '12px 14px',
      minHeight: '64px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
    }}>
      {isEmpty ? (
        <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          Passive Skill — Not Assigned
        </span>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: fonts.mono, fontSize: '10px', color: fc, lineHeight: 1 }}>◆</span>
            <span style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {passive.name}
            </span>
          </div>
          {passive.details && (
            <p style={{ fontFamily: fonts.body, fontSize: '10px', color: colors.muted, lineHeight: 1.45, margin: 0, paddingLeft: '18px' }}>
              {passive.details}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function EmptyGearSlot({ slot }: { slot: 1 | 2 }) {
  return (
    <div style={{
      border: `1px dashed ${colors.line}`,
      background: colors.bgDeep,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'row',
      flex: 1,
    }}>
      {/* art placeholder */}
      <div style={{ width: '55%', flexShrink: 0, background: 'linear-gradient(135deg, #1a1d22, #0a0c10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          No Image
        </span>
      </div>
      {/* info */}
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', borderLeft: `1px solid ${colors.line}` }}>
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
      background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'row',
      flex: 1,
    }}>
      {/* accent bar — vertical left edge */}
      <div style={{ width: '3px', background: accent, flexShrink: 0 }} />
      {/* art panel — 55% of card width */}
      <div style={{ position: 'relative', width: '55%', flexShrink: 0, background: 'linear-gradient(135deg, #1a1d22, #0a0c10)', overflow: 'hidden' }}>
        {gear.art
          ? <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: fonts.accent, fontSize: '24px', color: `${accent}18`, letterSpacing: letterSpacing.accent }}>
                {fallback}
              </span>
            </div>
          )
        }
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4))' }} />
        <CornerBrackets fc={accent} size={8} gap={4} />
      </div>
      {/* info — stacked vertically to the right */}
      <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', borderLeft: `1px solid ${colors.line}` }}>
        <div style={{ fontFamily: fonts.mono, fontSize: '14px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accent }}>
          {gear.subcategory}
        </div>
        <div style={{ fontFamily: fonts.display, fontSize: '26px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {gear.name}
        </div>
        {gear.modifier && (
          <div style={{ fontFamily: fonts.mono, fontSize: '14px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: accent }}>
            {gear.modifier}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '14px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.dim }}>
            LVL {gear.level}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '56px', border: `1px solid ${accent}44`, background: colors.bgDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '12px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted }}>ATK</div>
              <div style={{ fontFamily: fonts.display, fontSize: '26px', letterSpacing: letterSpacing.displayTight, color: accent, lineHeight: 1 }}>{gear.statAttack}</div>
            </div>
            {gear.resourcePoolSize > 0 && (
              <div style={{ flex: 1, height: '56px', border: `1px solid ${colors.line}`, background: colors.bgDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: '12px', letterSpacing: letterSpacing.labelTight, textTransform: 'uppercase', color: colors.muted }}>{gear.resourceName}</div>
                <div style={{ fontFamily: fonts.display, fontSize: '26px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>{gear.resourcePoolSize}</div>
              </div>
            )}
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
      border: `1px solid ${isEmpty ? colors.bgDeep : colors.line}`,
      background: isEmpty ? colors.bgDeep : colors.bg4,
      display: 'flex', flexDirection: 'row',
      flex: 1, minHeight: 0, overflow: 'hidden',
    }}>
      {/* square art */}
      <div style={{
        aspectRatio: '1/1', flexShrink: 0, alignSelf: 'stretch', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1d22, #0a0c10)',
        borderRight: `1px solid ${isEmpty ? colors.bgDeep : colors.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!isEmpty && skill.art
          ? <img src={`/assets/skills/${skill.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: fonts.mono, fontSize: '7px', color: colors.dim, letterSpacing: letterSpacing.labelWide }}>—</span>
        }
      </div>
      {/* details */}
      <div style={{ flex: 1, minWidth: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
        <span style={{ fontFamily: fonts.display, fontSize: '15px', letterSpacing: letterSpacing.displayTight, color: isEmpty ? colors.dim : colors.ink, lineHeight: 1 }}>
          {isEmpty ? 'Empty' : skill.name}
        </span>
        {!isEmpty && (
          <div style={{ fontFamily: fonts.mono, fontSize: '8px', color: colors.dim, textTransform: 'uppercase', letterSpacing: letterSpacing.labelTight, display: 'flex', gap: '8px' }}>
            {skill.basePower > 0 && <span style={{ color: colors.warn }}>{skill.basePower} PWR</span>}
            {skill.resourceCost > 0 && <span>{skill.resourceCost} RES</span>}
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
      <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, padding: '8px 0', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
        {gear.name}
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
      <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, padding: '8px 0', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
        Gear Slot {slot} — No Gear Equipped
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
        {/* faction bar across full width */}
        <div style={{ height: '4px', background: fc, flexShrink: 0 }} />

        {/* shared header */}
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: fc, marginBottom: '4px' }}>
            {character.factionName} · {character.className}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {character.name}
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.muted, lineHeight: 1 }}>
              LVL {character.level}
            </span>
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
            <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(180deg, #2a2f38, #141821)', overflow: 'hidden', flexShrink: 0 }}>
              {character.art
                ? <img src={`/assets/characters/${character.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
          </div>

          {/* ── MIDDLE PANEL — passives + equipped gear (width 2x = 560px) ── */}
          <div style={{
            width: 560, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${colors.line}`,
          }}>
            {/* passive skills */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: `1px solid ${colors.line}` }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '2px' }}>
                Passive Skills
              </div>
              <PassiveSkillCard passive={character.passive1} fc={fc} />
              <PassiveSkillCard passive={character.passive2} fc={fc} />
            </div>

            {/* equipped gear */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '2px' }}>
                Equipped Gear
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
              <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, paddingBottom: '10px' }}>
                Weapon Skills
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
              width: '100%', padding: '8px',
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
