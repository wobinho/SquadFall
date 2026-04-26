'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { colors, fonts, letterSpacing } from '@/design/tokens'

export interface SkillCardData {
  id: number
  name: string
  art: string | null
  basePower: number
  resourceCost: number
  description: string | null
  owned: number
  equipped: number
}

export interface GearSlotData {
  instanceId:  number
  name:        string
  art:         string | null
  subcategory: string
  category:    string
  slotsUsed:   number
  slotsTotal:  number
}

type InfuseStep = 'pick' | 'confirm'

// neutral accent — lineStrong for most UI chrome, ink for highlights
const NEUTRAL = colors.lineStrong
const ACCENT  = colors.muted

function CornerBrackets({ color, size = 10, gap = 5 }: { color: string; size?: number; gap?: number }) {
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
          borderTop:    pos.startsWith('t') ? `1px solid ${color}` : 'none',
          borderBottom: pos.startsWith('b') ? `1px solid ${color}` : 'none',
          borderLeft:   pos.endsWith('l')   ? `1px solid ${color}` : 'none',
          borderRight:  pos.endsWith('r')   ? `1px solid ${color}` : 'none',
          pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}

function SlotPips({ used, total }: { used: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: '6px', height: '6px',
          transform: 'rotate(45deg)',
          background: i < used ? colors.warn : 'transparent',
          border: `1px solid ${i < used ? colors.warn : colors.lineStrong}`,
        }} />
      ))}
    </div>
  )
}

function GearPickRow({ gear, onSelect }: { gear: GearSlotData; onSelect: () => void }) {
  const available = gear.slotsTotal - gear.slotsUsed
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', border: 'none', padding: 0, cursor: 'pointer', background: 'transparent', textAlign: 'left',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 14px',
        background: hover ? `linear-gradient(90deg, ${colors.warn}08, transparent)` : colors.bgDeep,
        border: `1px solid ${hover ? colors.warn + '44' : colors.line}`,
        transition: 'all 0.15s ease',
        position: 'relative', overflow: 'hidden',
      }}>
        {hover && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: colors.warn }} />
        )}
        <div style={{
          width: '40px', height: '40px', flexShrink: 0,
          position: 'relative', overflow: 'hidden',
          background: `radial-gradient(ellipse at center, ${colors.warn}0a 0%, #0a0c10 70%)`,
          border: `1px solid ${colors.line}`,
        }}>
          {gear.art ? (
            <img src={`/assets/gears/${gear.art}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
                backgroundSize: '8px 8px', opacity: 0.4,
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '18px', color: `${colors.warn}18` }}>
                  {gear.name.charAt(0)}
                </span>
              </div>
            </>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: hover ? colors.ink : colors.muted, lineHeight: 1, transition: 'color 0.15s' }}>
            {gear.name}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginTop: '2px' }}>
            {gear.subcategory}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <SlotPips used={gear.slotsUsed} total={gear.slotsTotal} />
          <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: available > 0 ? colors.warn : colors.dim }}>
            {available} slot{available !== 1 ? 's' : ''} free
          </span>
        </div>
        <div style={{ color: hover ? colors.warn : colors.dim, fontFamily: fonts.mono, fontSize: '10px', transition: 'color 0.15s', flexShrink: 0 }}>
          →
        </div>
      </div>
    </button>
  )
}

function SkillDetailModal({
  skill,
  gearSlots,
  onClose,
  onInfuseSuccess,
}: {
  skill: SkillCardData
  gearSlots: GearSlotData[]
  onClose: () => void
  onInfuseSuccess: () => void
}) {
  const fallback = skill.name.charAt(0).toUpperCase()
  const unequipped = skill.owned - skill.equipped
  const canInfuse = unequipped > 0
  const availableGears = gearSlots.filter(g => g.slotsUsed < g.slotsTotal)

  const [infuseStep, setInfuseStep] = useState<InfuseStep | null>(null)
  const [selectedGear, setSelectedGear] = useState<GearSlotData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSelectGear(gear: GearSlotData) {
    setSelectedGear(gear)
    setInfuseStep('confirm')
  }

  function handleConfirmInfuse() {
    if (!selectedGear) return
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/skills/infuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: skill.id, gearInstanceId: selectedGear.instanceId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      onInfuseSuccess()
      onClose()
    })
  }

  const showingInfusePanel = infuseStep !== null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(7,9,12,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'row',
          background: `linear-gradient(160deg, #16191f 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          boxShadow: `0 0 0 1px ${NEUTRAL}22, 0 40px 100px -20px rgba(0,0,0,0.9), 0 0 60px -20px ${NEUTRAL}18`,
          overflow: 'hidden',
          position: 'relative',
          maxHeight: '90vh',
          transition: 'width 0.3s ease',
          width: showingInfusePanel ? 1040 : 640,
        }}
      >
        {/* ── LEFT: SKILL DETAIL ── */}
        <div style={{ width: 640, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* top accent bar — neutral */}
          <div style={{
            height: '3px', flexShrink: 0,
            background: `linear-gradient(90deg, ${colors.lineStrong}, ${colors.line}, transparent)`,
          }} />

          {/* diagonal bg accent */}
          <div style={{
            position: 'absolute', top: 0, right: showingInfusePanel ? 'auto' : 0, left: showingInfusePanel ? 0 : 'auto',
            width: '220px', height: '220px',
            background: `radial-gradient(ellipse at top right, ${colors.lineStrong}0a 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.line}`, position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '3px', height: '3px', background: ACCENT, transform: 'rotate(45deg)' }} />
              <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: ACCENT }}>
                Skill · Combat Ability
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontFamily: fonts.display, fontSize: '42px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                {skill.name}
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '6px 14px',
                border: `1px solid ${colors.lineStrong}`,
                background: `linear-gradient(180deg, ${colors.bg3}, ${colors.bgDeep})`,
                position: 'relative', overflow: 'hidden', flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${colors.lineStrong}, transparent)` }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                  Owned
                </span>
                <span style={{ fontFamily: fonts.display, fontSize: '32px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                  {skill.owned}
                </span>
              </div>
            </div>
          </div>

          {/* body — art + stats */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
            {/* art */}
            <div style={{
              flex: '0 0 220px', aspectRatio: '1/1',
              position: 'relative', overflow: 'hidden',
              background: `radial-gradient(ellipse at center, ${colors.bg3} 0%, #0a0c10 70%)`,
              borderRight: `1px solid ${colors.line}`,
            }}>
              {skill.art ? (
                <img src={`/assets/skills/${skill.art}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px', opacity: 0.35,
                  }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: fonts.accent, fontSize: '90px', color: `${colors.lineStrong}44`, letterSpacing: '0.02em' }}>
                      {fallback}
                    </span>
                  </div>
                </>
              )}
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5))' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: `linear-gradient(90deg, transparent, ${colors.lineStrong}28, transparent)`, pointerEvents: 'none' }} />
              <CornerBrackets color={`${colors.lineStrong}99`} size={14} gap={8} />
            </div>

            {/* stats */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Base Power',     value: skill.basePower,    color: colors.ink },
                  { label: 'Resource Cost',  value: skill.resourceCost, color: colors.muted },
                ].map(({ label, value, color: c }) => (
                  <div key={label} style={{
                    padding: '10px 12px',
                    background: `linear-gradient(180deg, ${colors.bg3}, ${colors.bgDeep})`,
                    border: `1px solid ${colors.line}`,
                    borderTop: `2px solid ${colors.lineStrong}`,
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${colors.lineStrong}06, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '3px' }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: fonts.display, fontSize: '36px', letterSpacing: letterSpacing.displayTight, color: c, lineHeight: 1 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Equipped',   value: skill.equipped, color: colors.muted },
                  { label: 'In Reserve', value: unequipped,     color: colors.dim },
                ].map(({ label, value, color: c }) => (
                  <div key={label} style={{
                    padding: '8px 10px',
                    border: `1px solid ${colors.line}`,
                    background: colors.bgDeep,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: c, lineHeight: 1 }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* description */}
          <div style={{ padding: '14px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '1px', background: colors.dim }} />
              <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                Ability Description
              </span>
            </div>
            <div style={{
              fontFamily: fonts.body, fontSize: '13px',
              color: skill.description ? colors.muted : colors.dim,
              lineHeight: 1.6,
              fontStyle: skill.description ? 'normal' : 'italic',
              borderLeft: `2px solid ${colors.lineStrong}44`,
              paddingLeft: '12px',
            }}>
              {skill.description ?? 'No description available.'}
            </div>
          </div>

          {/* action row */}
          <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', flexShrink: 0 }}>
            {canInfuse && !showingInfusePanel && (
              <button
                type="button"
                onClick={() => setInfuseStep('pick')}
                style={{
                  flex: 1, padding: '10px',
                  fontFamily: fonts.mono, fontSize: '8px',
                  letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                  color: colors.warn,
                  background: `linear-gradient(180deg, ${colors.warn}0d, ${colors.bgDeep})`,
                  border: `1px solid ${colors.warn}55`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(180deg, ${colors.warn}22, ${colors.bgDeep})`
                  e.currentTarget.style.borderColor = colors.warn
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(180deg, ${colors.warn}0d, ${colors.bgDeep})`
                  e.currentTarget.style.borderColor = `${colors.warn}55`
                }}
              >
                <div style={{ width: '5px', height: '5px', background: colors.warn, transform: 'rotate(45deg)' }} />
                Infuse to Gear
                <div style={{ width: '5px', height: '5px', background: colors.warn, transform: 'rotate(45deg)' }} />
              </button>
            )}
            {showingInfusePanel && (
              <button
                type="button"
                onClick={() => { setInfuseStep(null); setSelectedGear(null); setError(null) }}
                style={{
                  flex: 1, padding: '10px',
                  fontFamily: fonts.mono, fontSize: '8px',
                  letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                  color: colors.dim, background: 'transparent',
                  border: `1px solid ${colors.line}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.ink
                  e.currentTarget.style.borderColor = colors.lineStrong
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.dim
                  e.currentTarget.style.borderColor = colors.line
                }}
              >
                ← Cancel Infuse
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: showingInfusePanel ? '0 0 auto' : 1, padding: '10px 16px',
                fontFamily: fonts.mono, fontSize: '8px',
                letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                color: colors.dim, background: 'transparent',
                border: `1px solid ${colors.line}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s ease',
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
              <div style={{ width: '14px', height: '1px', background: 'currentColor' }} />
              Dismiss
              <div style={{ width: '14px', height: '1px', background: 'currentColor' }} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: INFUSE PANEL ── */}
        {showingInfusePanel && (
          <div style={{
            width: 400, flexShrink: 0,
            borderLeft: `1px solid ${colors.line}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${colors.warn}, ${colors.warn}44, transparent)`, flexShrink: 0 }} />

            {infuseStep === 'pick' && (
              <>
                <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '3px', height: '3px', background: colors.warn, transform: 'rotate(45deg)' }} />
                    <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.warn }}>
                      Infuse · Select Target
                    </span>
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                    Choose a Gear
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '10px', color: colors.dim, marginTop: '4px', lineHeight: 1.4 }}>
                    Select a gear with available skill slots to infuse <span style={{ color: colors.ink }}>{skill.name}</span> into.
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {availableGears.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontFamily: fonts.mono, fontSize: '10px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                          No gear slots available
                        </div>
                        <div style={{ fontFamily: fonts.mono, fontSize: '9px', color: colors.dim, marginTop: '8px', opacity: 0.6 }}>
                          All gear instances are at max skill capacity
                        </div>
                      </div>
                    </div>
                  ) : (
                    availableGears.map((gear) => (
                      <GearPickRow key={gear.instanceId} gear={gear} onSelect={() => handleSelectGear(gear)} />
                    ))
                  )}
                </div>
              </>
            )}

            {infuseStep === 'confirm' && selectedGear && (
              <>
                <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '3px', height: '3px', background: colors.lineStrong, transform: 'rotate(45deg)' }} />
                    <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.muted }}>
                      Infuse · Confirm
                    </span>
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                    Are you sure?
                  </div>
                </div>
                <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      flex: 1, padding: '10px 12px',
                      background: `linear-gradient(180deg, ${colors.bg3}, ${colors.bgDeep})`,
                      border: `1px solid ${colors.lineStrong}`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: colors.lineStrong }} />
                      <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '3px' }}>Skill</div>
                      <div style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>{skill.name}</div>
                    </div>
                    <div style={{ fontFamily: fonts.mono, fontSize: '18px', color: colors.warn, flexShrink: 0 }}>→</div>
                    <div style={{
                      flex: 1, padding: '10px 12px',
                      background: `linear-gradient(180deg, ${colors.warn}0d, ${colors.bgDeep})`,
                      border: `1px solid ${colors.warn}33`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: colors.warn }} />
                      <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '3px' }}>Gear</div>
                      <div style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>{selectedGear.name}</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', border: `1px solid ${colors.line}`, background: colors.bgDeep }}>
                    <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '8px' }}>
                      Slots after infuse
                    </div>
                    <SlotPips used={selectedGear.slotsUsed + 1} total={selectedGear.slotsTotal} />
                    <div style={{ fontFamily: fonts.mono, fontSize: '8px', color: colors.dim, marginTop: '4px' }}>
                      {selectedGear.slotsUsed + 1} / {selectedGear.slotsTotal} used
                    </div>
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '9px', color: colors.dim, lineHeight: 1.5 }}>
                    This will permanently bind one copy of <span style={{ color: colors.ink }}>{skill.name}</span> to <span style={{ color: colors.ink }}>{selectedGear.name}</span>. This action cannot be undone from this screen.
                  </div>
                  {error && (
                    <div style={{ fontFamily: fonts.mono, fontSize: '9px', color: colors.blood, border: `1px solid ${colors.blood}44`, padding: '8px 10px', background: `${colors.blood}0a` }}>
                      {error}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => { setInfuseStep('pick'); setError(null) }}
                      disabled={isPending}
                      style={{
                        flex: 1, padding: '9px',
                        fontFamily: fonts.mono, fontSize: '8px',
                        letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                        color: colors.dim, background: 'transparent',
                        border: `1px solid ${colors.line}`, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isPending ? 0.4 : 1,
                      }}
                      onMouseEnter={(e) => { if (!isPending) { e.currentTarget.style.color = colors.ink; e.currentTarget.style.borderColor = colors.lineStrong } }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = colors.dim; e.currentTarget.style.borderColor = colors.line }}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmInfuse}
                      disabled={isPending}
                      style={{
                        flex: 2, padding: '9px',
                        fontFamily: fonts.mono, fontSize: '8px',
                        letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                        color: isPending ? colors.dim : colors.warn,
                        background: `linear-gradient(180deg, ${colors.warn}${isPending ? '08' : '18'}, ${colors.bgDeep})`,
                        border: `1px solid ${colors.warn}${isPending ? '22' : '88'}`, cursor: isPending ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isPending ? <>Infusing…</> : (
                        <>
                          <div style={{ width: '5px', height: '5px', background: colors.warn, transform: 'rotate(45deg)' }} />
                          Confirm Infuse
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── LIST ROW ──────────────────────────────────────────────────────────────────

function SkillListRow({
  skill,
  index,
  onClick,
}: {
  skill: SkillCardData
  index: number
  onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  const unequipped = skill.owned - skill.equipped
  const fallback = skill.name.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'stretch',
        width: '100%', border: 'none', padding: 0,
        background: 'transparent', cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.12s ease',
        transform: hover ? 'translateX(2px)' : 'translateX(0)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'stretch', width: '100%',
        background: hover
          ? `linear-gradient(90deg, ${colors.bg3} 0%, ${colors.bg2} 100%)`
          : `linear-gradient(90deg, ${colors.bg2} 0%, ${colors.bgDeep} 100%)`,
        border: `1px solid ${hover ? colors.lineStrong : colors.line}`,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.12s ease',
      }}>
        {/* left active indicator */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
          background: hover ? colors.lineStrong : 'transparent',
          transition: 'background 0.12s ease',
        }} />

        {/* index number — far left, very subtle */}
        <div style={{
          flexShrink: 0,
          width: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRight: `1px solid ${colors.line}`,
        }}>
          <span style={{
            fontFamily: fonts.mono, fontSize: '9px',
            letterSpacing: letterSpacing.labelTight,
            color: colors.dim,
            opacity: hover ? 0.8 : 0.4,
            transition: 'opacity 0.12s',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* art thumbnail — square, prominent */}
        <div style={{
          flexShrink: 0,
          width: '88px', height: '88px',
          position: 'relative', overflow: 'hidden',
          background: `radial-gradient(ellipse at center, ${colors.bg3} 0%, ${colors.bgDeep} 70%)`,
          borderRight: `1px solid ${colors.line}`,
        }}>
          {skill.art ? (
            <img
              src={`/assets/skills/${skill.art}.png`}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.2s ease',
                transform: hover ? 'scale(1.04)' : 'scale(1)',
                filter: hover ? 'brightness(1.1)' : 'brightness(0.88)',
              }}
            />
          ) : (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
                backgroundSize: '14px 14px', opacity: 0.3,
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '40px', color: `${colors.lineStrong}40`, letterSpacing: '0.02em' }}>
                  {fallback}
                </span>
              </div>
            </>
          )}
          {/* subtle vignette over art */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.5))',
          }} />
          <CornerBrackets color={hover ? `${colors.lineStrong}cc` : `${colors.line}88`} size={7} gap={4} />
        </div>

        {/* main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '20px' }}>
          {/* name + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: fonts.display, fontSize: '26px',
              letterSpacing: letterSpacing.displayTight,
              color: hover ? colors.ink : colors.muted,
              lineHeight: 1,
              transition: 'color 0.12s ease',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {skill.name}
            </div>
            {skill.description && (
              <div style={{
                fontFamily: fonts.body, fontSize: '11px',
                color: colors.dim,
                lineHeight: 1.4,
                marginTop: '5px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                opacity: hover ? 0.9 : 0.6,
                transition: 'opacity 0.12s ease',
              }}>
                {skill.description}
              </div>
            )}
          </div>

          {/* divider */}
          <div style={{ width: '1px', alignSelf: 'stretch', background: colors.line, flexShrink: 0, margin: '12px 0' }} />

          {/* stat block: power + cost */}
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '48px' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                Power
              </span>
              <span style={{
                fontFamily: fonts.display, fontSize: '32px',
                letterSpacing: letterSpacing.displayTight,
                color: hover ? colors.ink : colors.muted,
                lineHeight: 1, marginTop: '1px',
                transition: 'color 0.12s ease',
              }}>
                {skill.basePower}
              </span>
            </div>
            <div style={{ width: '1px', alignSelf: 'stretch', background: colors.line, margin: '14px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                Cost
              </span>
              <span style={{
                fontFamily: fonts.display, fontSize: '32px',
                letterSpacing: letterSpacing.displayTight,
                color: colors.dim,
                lineHeight: 1, marginTop: '1px',
              }}>
                {skill.resourceCost}
              </span>
            </div>
          </div>

          {/* divider */}
          <div style={{ width: '1px', alignSelf: 'stretch', background: colors.line, flexShrink: 0, margin: '12px 0' }} />

          {/* ownership block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, minWidth: '72px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                Owned
              </span>
              <span style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: hover ? colors.ink : colors.muted, lineHeight: 1, transition: 'color 0.12s' }}>
                {skill.owned}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                Equipped
              </span>
              <span style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: colors.dim, lineHeight: 1 }}>
                {skill.equipped}
              </span>
            </div>
            {unequipped > 0 && (
              <div style={{
                fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                color: colors.warn, paddingTop: '2px',
                borderTop: `1px solid ${colors.warn}22`,
              }}>
                {unequipped} in reserve
              </div>
            )}
          </div>

          {/* caret */}
          <div style={{
            flexShrink: 0,
            fontFamily: fonts.mono, fontSize: '12px',
            color: hover ? colors.muted : colors.dim,
            transition: 'color 0.12s ease, transform 0.12s ease',
            transform: hover ? 'translateX(2px)' : 'translateX(0)',
            paddingRight: '4px',
          }}>
            ›
          </div>
        </div>
      </div>
    </button>
  )
}

// ── GRID (now a list) ─────────────────────────────────────────────────────────

export function SkillsGrid({ skills, gearSlots }: { skills: SkillCardData[]; gearSlots: GearSlotData[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<SkillCardData | null>(null)

  return (
    <>
      {/* 2-column list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
        {skills.map((s, i) => (
          <SkillListRow
            key={s.id}
            skill={s}
            index={i}
            onClick={() => setSelected(s)}
          />
        ))}
      </div>

      {selected && (
        <SkillDetailModal
          skill={selected}
          gearSlots={gearSlots}
          onClose={() => setSelected(null)}
          onInfuseSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
