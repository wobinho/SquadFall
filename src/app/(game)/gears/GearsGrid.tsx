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
  const segments = 20
  const filledSegments = Math.round((pct / 100) * segments)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
          {label}
        </span>
        <span style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
          {value}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '3px',
            background: i < filledSegments
              ? i === filledSegments - 1
                ? color
                : `${color}99`
              : colors.bgDeep,
            border: `1px solid ${i < filledSegments ? `${color}44` : colors.line}`,
            transition: 'background 0.3s ease',
          }} />
        ))}
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
          width: 1040,
          background: `linear-gradient(180deg, ${colors.bg3} 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          display: 'flex', flexDirection: 'row',
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${accentColor}22, 0 32px 80px -16px rgba(0,0,0,0.8)`,
          maxHeight: '90vh',
        }}
      >
        {/* LEFT PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${colors.line}` }}>
          {/* accent bar — doubled thickness, glowing */}
          <div style={{ height: '3px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44, transparent)`, boxShadow: `0 0 12px ${accentColor}88` }} />

          {/* header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${colors.line}`, background: `linear-gradient(180deg, ${accentColor}06 0%, transparent 100%)`, position: 'relative' }}>
            {/* category tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '3px', height: '3px', background: accentColor, transform: 'rotate(45deg)' }} />
              <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accentColor }}>
                {gear.category} · {gear.subcategory}
              </span>
            </div>
            {/* name + level row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontFamily: fonts.display, fontSize: '36px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                {gear.name}
              </span>
              {/* level chip */}
              <div style={{
                flexShrink: 0,
                padding: '4px 10px',
                border: `1px solid ${colors.lineStrong}`,
                background: colors.bgDeep,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${colors.lineStrong}, transparent)` }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Level</span>
                <span style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.muted, lineHeight: 1 }}>{gear.level}</span>
              </div>
            </div>
          </div>

          {/* art panel */}
          <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(180deg, #12151a, #0a0c10)', overflow: 'hidden', flexShrink: 0 }}>
            {gear.art
              ? <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* subtle grid pattern behind fallback letter */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`, backgroundSize: '24px 24px', opacity: 0.4 }} />
                  <span style={{ fontFamily: fonts.accent, fontSize: '100px', color: `${accentColor}12`, letterSpacing: letterSpacing.accent, position: 'relative' }}>
                    {fallback}
                  </span>
                </div>
              )
            }
            {/* layered overlays: bottom fade + side vignette */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg, ${accentColor}08 0%, transparent 30%, rgba(10,12,16,0.85) 100%)` }} />
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55))' }} />
            {/* horizontal scan line */}
            <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '40%', height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`, pointerEvents: 'none' }} />
            <CornerBrackets color={`${accentColor}cc`} size={16} gap={8} />
          </div>

          {/* stats */}
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: `1px solid ${colors.line}`, flex: 1, overflow: 'auto' }}>

            {/* primary stats */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '1px', background: accentColor }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                  Primary Stats
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>

                {/* Attack */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: `linear-gradient(180deg, ${accentColor}0d, ${colors.bgDeep})`,
                  border: `1px solid ${accentColor}33`,
                  borderTop: `2px solid ${accentColor}`,
                  padding: '10px 8px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${accentColor}08, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '4px' }}>
                    Attack
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '34px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1 }}>
                    {gear.statAttack}
                  </div>
                </div>

                {/* Ammo */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(180deg, ${accentColor}0d, ${colors.bgDeep})`,
                  border: `1px solid ${accentColor}33`,
                  borderTop: `2px solid ${accentColor}`,
                  padding: '10px 8px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${accentColor}08, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '4px' }}>
                    {gear.resourceName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <div style={{ fontFamily: fonts.display, fontSize: '34px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                      {gear.resourcePoolSize}
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: '13px', fontWeight: 700, color: colors.warn }}>
                      +{gear.resourceRegenRate}
                    </div>
                  </div>
                </div>

                {/* Crit Damage */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: `linear-gradient(180deg, ${colors.blood}0d, ${colors.bgDeep})`,
                  border: `1px solid ${colors.blood}33`,
                  borderTop: `2px solid ${colors.blood}`,
                  padding: '10px 8px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${colors.blood}08, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '4px' }}>
                    Crit Dmg
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '34px', letterSpacing: letterSpacing.displayTight, color: colors.blood, lineHeight: 1 }}>
                    {gear.critDamage}%
                  </div>
                </div>

                {/* Crit Chance */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: `linear-gradient(180deg, ${colors.blood}0d, ${colors.bgDeep})`,
                  border: `1px solid ${colors.blood}33`,
                  borderTop: `2px solid ${colors.blood}`,
                  padding: '10px 8px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${colors.blood}08, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '4px' }}>
                    Crit Chance
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '34px', letterSpacing: letterSpacing.displayTight, color: colors.blood, lineHeight: 1 }}>
                    {gear.critChance}%
                  </div>
                </div>
              </div>
            </div>

            {/* combat stats */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '1px', background: colors.dim }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                  Combat Stats
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <MiniBar label="Accuracy" value={gear.accuracy} max={100} color={colors.warn} />
                <MiniBar label="Penetration" value={gear.penetration} max={100} color={colors.blood} />
                <MiniBar label="Chain" value={gear.chain} max={100} color={colors.warn} />
                <MiniBar label="Weight" value={gear.weight} max={100} color={colors.blood} />
              </div>
            </div>
          </div>

          {/* close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              margin: '0 16px 14px',
              padding: '9px',
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
              e.currentTarget.style.background = `${colors.bgDeep}`
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

        {/* RIGHT PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* accent bar */}
          <div style={{ height: '4px', background: accentColor }} />

          {/* MODIFIER PANEL (25%) */}
          <div style={{ flex: '0 0 25%', padding: '12px 16px', borderBottom: `1px solid ${colors.line}`, overflow: 'hidden' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '8px' }}>
              Modifier
            </div>
            {gear.modifier ? (
              <div style={{ display: 'flex', height: '100%' }}>
                {/* left 30% - modifier name */}
                <div style={{ flex: '0 0 30%', paddingRight: '10px', borderRight: `1px solid ${colors.line}`, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1 }}>
                    {gear.modifier}
                  </span>
                </div>
                {/* right 70% - modifier effect */}
                <div style={{ flex: '0 0 70%', paddingLeft: '10px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: '12px', letterSpacing: letterSpacing.labelTight, color: colors.muted }}>
                    Effect description placeholder
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: fonts.mono, fontSize: '12px', color: colors.muted }}>
                No modifier
              </div>
            )}
          </div>

          {/* SKILL PANELS (3 × 25% each) */}
          {[0, 1, 2].map((skillIndex) => {
            const skill = gear.skills[skillIndex]
            return (
              <div
                key={`skill-${skillIndex}`}
                style={{
                  flex: '0 0 25%',
                  padding: '10px 14px',
                  borderBottom: skillIndex < 2 ? `1px solid ${colors.line}` : 'none',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {skill ? (
                  <>
                    {/* subtle scan-line accent */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
                      background: `linear-gradient(180deg, transparent, ${accentColor}88, transparent)`,
                    }} />

                    <div style={{ flex: 1, display: 'flex', gap: '12px', minWidth: 0 }}>
                      {/* skill art */}
                      <div style={{
                        flex: '0 0 130px', height: '130px',
                        position: 'relative', overflow: 'hidden',
                        flexShrink: 0,
                        background: `radial-gradient(ellipse at center, ${accentColor}0a 0%, #0a0c10 70%)`,
                        border: `1px solid ${accentColor}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {/* corner brackets on art */}
                        <CornerBrackets color={`${accentColor}66`} size={8} gap={4} />
                        {skill.art ? (
                          <img src={`/assets/skills/${skill.art}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontFamily: fonts.accent, fontSize: '52px', color: `${accentColor}22`, letterSpacing: letterSpacing.accent }}>
                            {skill.name ? skill.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                        {/* bottom gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(10,12,16,0.6))', pointerEvents: 'none' }} />
                      </div>

                      {/* right content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, alignSelf: 'stretch' }}>
                        {/* top: name + stat chips */}
                        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            fontFamily: fonts.display, fontSize: '32px',
                            letterSpacing: letterSpacing.displayTight, color: colors.ink,
                            lineHeight: 1, flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {skill.name}
                          </div>

                          {/* stat chips */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <div style={{
                              background: `linear-gradient(135deg, ${colors.bgDeep}, #0d0f14)`,
                              border: `1px solid ${accentColor}55`,
                              padding: '5px 10px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                              position: 'relative', overflow: 'hidden',
                            }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)` }} />
                              <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                                Power
                              </div>
                              <div style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1 }}>
                                {skill.basePower}
                              </div>
                            </div>
                            <div style={{
                              background: `linear-gradient(135deg, ${colors.bgDeep}, #0d0f14)`,
                              border: `1px solid ${colors.warn}44`,
                              padding: '5px 10px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                              position: 'relative', overflow: 'hidden',
                            }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${colors.warn}66, transparent)` }} />
                              <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                                Cost
                              </div>
                              <div style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.warn, lineHeight: 1 }}>
                                {skill.resourceCost}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* bottom: description */}
                        <div style={{
                          flex: 1,
                          marginTop: '8px',
                          fontFamily: fonts.mono, fontSize: '12px',
                          letterSpacing: letterSpacing.labelTight, color: colors.dim,
                          lineHeight: 1.5,
                          borderLeft: `1px solid ${colors.line}`,
                          paddingLeft: '8px',
                        }}>
                          Skill description placeholder
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.35 }}>
                    <div style={{
                      width: '130px', height: '130px', flexShrink: 0,
                      border: `1px dashed ${colors.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: '24px', height: '24px', border: `1px solid ${colors.line}`, transform: 'rotate(45deg)' }} />
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: '10px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                      No skill equipped
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
