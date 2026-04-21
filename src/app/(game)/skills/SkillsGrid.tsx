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

function GearPickRow({
  gear,
  onSelect,
}: {
  gear: GearSlotData
  onSelect: () => void
}) {
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

        {/* gear art thumb */}
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

        {/* name + subcategory */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: hover ? colors.ink : colors.muted, lineHeight: 1, transition: 'color 0.15s' }}>
            {gear.name}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginTop: '2px' }}>
            {gear.subcategory}
          </div>
        </div>

        {/* slot pips */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
          <SlotPips used={gear.slotsUsed} total={gear.slotsTotal} />
          <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: available > 0 ? colors.warn : colors.dim }}>
            {available} slot{available !== 1 ? 's' : ''} free
          </span>
        </div>

        {/* arrow */}
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
  const accentColor = colors.blood
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
          boxShadow: `0 0 0 1px ${accentColor}1a, 0 40px 100px -20px rgba(0,0,0,0.9), 0 0 60px -20px ${accentColor}22`,
          overflow: 'hidden',
          position: 'relative',
          maxHeight: '90vh',
          transition: 'width 0.3s ease',
          width: showingInfusePanel ? 1040 : 640,
        }}
      >
        {/* ── LEFT: SKILL DETAIL ── */}
        <div style={{ width: 640, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* top accent bar */}
          <div style={{
            height: '3px', flexShrink: 0,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55, transparent)`,
            boxShadow: `0 0 14px ${accentColor}88`,
          }} />

          {/* diagonal bg accent */}
          <div style={{
            position: 'absolute', top: 0, right: showingInfusePanel ? 'auto' : 0, left: showingInfusePanel ? 0 : 'auto',
            width: '220px', height: '220px',
            background: `radial-gradient(ellipse at top right, ${accentColor}0a 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.line}`, position: 'relative', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: '3px', height: '3px', background: accentColor, transform: 'rotate(45deg)' }} />
              <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: accentColor }}>
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
                border: `1px solid ${accentColor}44`,
                background: `linear-gradient(180deg, ${accentColor}0d, ${colors.bgDeep})`,
                position: 'relative', overflow: 'hidden', flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)` }} />
                <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
                  Owned
                </span>
                <span style={{ fontFamily: fonts.display, fontSize: '32px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1 }}>
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
              background: `radial-gradient(ellipse at center, ${accentColor}0c 0%, #0a0c10 70%)`,
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
                    <span style={{ fontFamily: fonts.accent, fontSize: '90px', color: `${accentColor}14`, letterSpacing: '0.02em' }}>
                      {fallback}
                    </span>
                  </div>
                </>
              )}
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5))' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: `linear-gradient(90deg, transparent, ${accentColor}28, transparent)`, pointerEvents: 'none' }} />
              <CornerBrackets color={`${accentColor}99`} size={14} gap={8} />
            </div>

            {/* stats */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Base Power', value: skill.basePower, color: accentColor },
                  { label: 'Resource Cost', value: skill.resourceCost, color: colors.warn },
                ].map(({ label, value, color: c }) => (
                  <div key={label} style={{
                    padding: '10px 12px',
                    background: `linear-gradient(180deg, ${c}0d, ${colors.bgDeep})`,
                    border: `1px solid ${c}33`,
                    borderTop: `2px solid ${c}`,
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${c}08, transparent 70%)`, pointerEvents: 'none' }} />
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
                  { label: 'Equipped', value: skill.equipped, color: colors.success },
                  { label: 'In Reserve', value: unequipped, color: colors.muted },
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
              borderLeft: `2px solid ${accentColor}33`,
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
            {/* accent bar — warn color for infuse */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${colors.warn}, ${colors.warn}44, transparent)`, flexShrink: 0 }} />

            {infuseStep === 'pick' && (
              <>
                {/* panel header */}
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

                {/* gear list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {availableGears.length === 0 ? (
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '40px 20px', textAlign: 'center',
                    }}>
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
                {/* panel header */}
                <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${colors.line}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ width: '3px', height: '3px', background: colors.blood, transform: 'rotate(45deg)' }} />
                    <span style={{ fontFamily: fonts.mono, fontSize: '9px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.blood }}>
                      Infuse · Confirm
                    </span>
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: '22px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
                    Are you sure?
                  </div>
                </div>

                {/* confirm body */}
                <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* skill → gear diagram */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* skill chip */}
                    <div style={{
                      flex: 1, padding: '10px 12px',
                      background: `linear-gradient(180deg, ${colors.blood}0d, ${colors.bgDeep})`,
                      border: `1px solid ${colors.blood}33`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: colors.blood }} />
                      <div style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim, marginBottom: '3px' }}>Skill</div>
                      <div style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>{skill.name}</div>
                    </div>

                    {/* arrow */}
                    <div style={{ fontFamily: fonts.mono, fontSize: '18px', color: colors.warn, flexShrink: 0 }}>→</div>

                    {/* gear chip */}
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

                  {/* slot after infuse */}
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

                  {/* back + confirm */}
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
                      {isPending ? (
                        <>Infusing…</>
                      ) : (
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

function SkillCard({ skill, onClick }: { skill: SkillCardData; onClick: () => void }) {
  const accentColor = colors.blood
  const fallback = skill.name.charAt(0).toUpperCase()
  const unequipped = skill.owned - skill.equipped

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'transparent', border: 'none', padding: 0,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        const card = e.currentTarget.querySelector<HTMLElement>('[data-card]')
        if (card) card.style.boxShadow = `0 0 22px ${accentColor}55, inset 0 0 18px ${accentColor}0d`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        const card = e.currentTarget.querySelector<HTMLElement>('[data-card]')
        if (card) card.style.boxShadow = 'none'
      }}
    >
      <div
        data-card=""
        style={{
          width: '100%',
          background: `linear-gradient(180deg, #16191f 0%, ${colors.bg4} 100%)`,
          border: `1px solid ${colors.line}`,
          overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        {/* top accent bar */}
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44, transparent)`, flexShrink: 0 }} />

        {/* art */}
        <div style={{
          position: 'relative', aspectRatio: '1/1',
          background: `radial-gradient(ellipse at center, ${accentColor}0a 0%, #0a0c10 70%)`,
          overflow: 'hidden', flexShrink: 0,
        }}>
          {skill.art ? (
            <img src={`/assets/skills/${skill.art}.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`,
                backgroundSize: '18px 18px', opacity: 0.3,
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: fonts.accent, fontSize: '64px', color: `${accentColor}10`, letterSpacing: '0.02em' }}>
                  {fallback}
                </span>
              </div>
            </>
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 45%, rgba(11,13,16,0.9))' }} />
          <CornerBrackets color={`${accentColor}88`} size={10} gap={6} />

          {/* owned pill */}
          <div style={{
            position: 'absolute', top: '7px', right: '7px',
            background: 'rgba(11,13,16,0.88)',
            border: `1px solid ${accentColor}55`,
            padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <div style={{ width: '4px', height: '4px', background: accentColor, transform: 'rotate(45deg)', flexShrink: 0 }} />
            <span style={{ fontFamily: fonts.display, fontSize: '18px', letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1 }}>
              {skill.owned}
            </span>
          </div>

          {/* name overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px 8px' }}>
            <div style={{
              fontFamily: fonts.display, fontSize: '20px',
              letterSpacing: letterSpacing.displayTight, color: colors.ink, lineHeight: 1,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {skill.name}
            </div>
          </div>
        </div>

        {/* stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${colors.line}` }}>
          <div style={{ padding: '8px 10px', borderRight: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${accentColor}07, transparent)` }}>
            <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Power</span>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: accentColor, lineHeight: 1, marginTop: '2px' }}>
              {skill.basePower}
            </span>
          </div>
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${colors.warn}07, transparent)` }}>
            <span style={{ fontFamily: fonts.mono, fontSize: '7px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>Cost</span>
            <span style={{ fontFamily: fonts.display, fontSize: '28px', letterSpacing: letterSpacing.displayTight, color: colors.warn, lineHeight: 1, marginTop: '2px' }}>
              {skill.resourceCost}
            </span>
          </div>
        </div>

        {/* equipped / reserve + infuse */}
        <div style={{
          padding: '7px 10px',
          borderTop: `1px solid ${colors.line}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: colors.bgDeep,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '5px', height: '5px', background: `${colors.success}bb`, transform: 'rotate(45deg)' }} />
            <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
              Equipped
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: colors.success, lineHeight: 1 }}>
              {skill.equipped}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: fonts.mono, fontSize: '8px', letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase', color: colors.dim }}>
              Reserve
            </span>
            <span style={{ fontFamily: fonts.display, fontSize: '16px', letterSpacing: letterSpacing.displayTight, color: colors.muted, lineHeight: 1 }}>
              {unequipped}
            </span>
          </div>
        </div>

        {/* infuse button — only shown when there's reserve */}
        {unequipped > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ borderTop: `1px solid ${colors.line}` }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick() }}
              style={{
                width: '100%', padding: '8px',
                fontFamily: fonts.mono, fontSize: '8px',
                letterSpacing: letterSpacing.labelWide, textTransform: 'uppercase',
                color: colors.warn,
                background: `linear-gradient(180deg, ${colors.warn}0a, transparent)`,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(180deg, ${colors.warn}22, ${colors.warn}0a)`
                e.currentTarget.style.color = colors.ink
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(180deg, ${colors.warn}0a, transparent)`
                e.currentTarget.style.color = colors.warn
              }}
            >
              <div style={{ width: '4px', height: '4px', background: 'currentColor', transform: 'rotate(45deg)' }} />
              Infuse
            </button>
          </div>
        )}
      </div>
    </button>
  )
}

export function SkillsGrid({ skills, gearSlots }: { skills: SkillCardData[]; gearSlots: GearSlotData[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<SkillCardData | null>(null)

  function handleCardClick(skill: SkillCardData) {
    setSelected(skill)
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} onClick={() => handleCardClick(s)} />
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
