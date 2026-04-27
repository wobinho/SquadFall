'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SimCharacter {
  id: number
  name: string
  art: string | null
  className: string
  statHp: number
  statSpeed: number
  statDefense: number
  statFortitude: number
  statFocus: number
  factionName: string
  factionColor: string
}

interface SimGear {
  id: number
  name: string
  art: string | null
  category: string
  subcategory: string
  statAttack: number
  critDamage: number
  critChance: number
  resourcePoolSize: number
  resourceRegenRate: number
  resourceName: string
}

interface SimSkill {
  id: number
  name: string
  basePower: number
  resourceCost: number
  art: string | null
}

interface SimEnemy {
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

interface SimEnemySkill {
  id: number
  name: string
  description: string
  basePower: number
}

interface SimData {
  characters: SimCharacter[]
  gears: SimGear[]
  skills: SimSkill[]
  enemies: SimEnemy[]
  enemySkills: SimEnemySkill[]
}

interface GearSlot {
  gear: SimGear | null
  skills: (SimSkill | null)[]
}

interface CharSlot {
  character: SimCharacter | null
  gears: [GearSlot, GearSlot]
}

interface EnemySlot {
  enemy: SimEnemy | null
  skills: (SimEnemySkill | null)[]
}

interface EnemyWave {
  slots: EnemySlot[]
}

interface SimConfig {
  charSlots: [CharSlot, CharSlot, CharSlot]
  enemySlotCount: number
  waveCount: number
  waves: EnemyWave[]
}

interface CombatUnit {
  id: string
  name: string
  isEnemy: boolean
  hp: number
  maxHp: number
  speed: number
  atk: number
  def: number
  resource: number
  maxResource: number
  resourceRegen: number
  resourceName: string
  factionColor: string
  art: string | null
  skills: CombatSkill[]
  slotIndex: number
  waveIndex?: number
}

interface CombatSkill {
  id: string
  name: string
  basePower: number
  cost: number
}

interface CombatLogEntry {
  turn: number
  text: string
  type: 'action' | 'damage' | 'miss' | 'crit' | 'info' | 'wave' | 'victory' | 'defeat'
}

// ── Style tokens ───────────────────────────────────────────────────────────────

const C = {
  bg:      '#08090b',
  bg2:     '#0a0c10',
  bg3:     '#0f1115',
  ink:     '#f2f0ea',
  muted:   '#8a8e96',
  dim:     '#5a5e66',
  line:    '#1e2228',
  lineStr: '#2a2f38',
  gold:    '#e8a736',
  blood:   '#c53030',
  green:   '#6b8a3a',
}

const MONO    = "'JetBrains Mono', monospace"
const DISPLAY = "'Bebas Neue', sans-serif"

// ── Small shared UI ────────────────────────────────────────────────────────────

function StatPill({ label, value, color = C.gold }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.bg2, border: `1px solid ${color}22`, padding: '4px 10px', minWidth: '48px' }}>
      <span style={{ fontFamily: MONO, fontSize: '7px', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: DISPLAY, fontSize: '18px', color, lineHeight: 1 }}>{value}</span>
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ width: '10px', height: '1px', background: C.gold }} />
      <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.dim }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: C.line }} />
    </div>
  )
}

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct   = Math.max(0, Math.min(1, current / max))
  const segs  = 20
  const filled = Math.round(pct * segs)
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1px', flex: 1 }}>
        {Array.from({ length: segs }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '5px',
            background: i < filled ? (i === filled - 1 ? color : `${color}88`) : C.bg2,
            border: `1px solid ${i < filled ? `${color}44` : C.line}`,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: '9px', color, flexShrink: 0, marginLeft: '6px', minWidth: '64px', textAlign: 'right' }}>
        {current}/{max}
      </span>
    </div>
  )
}

// ── Selector Dropdown ──────────────────────────────────────────────────────────

function Selector<T extends { id: number; name: string }>({
  options, selected, onSelect, placeholder, accent = C.gold, getArt,
}: {
  options: T[]
  selected: T | null
  onSelect: (item: T | null) => void
  placeholder: string
  accent?: string
  getArt?: (item: T) => string | null
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function Thumb({ item, size = 20 }: { item: T; size?: number }) {
    const art = getArt?.(item) ?? null
    if (!art) return null
    return <img src={art} alt="" style={{ width: size, height: size, objectFit: 'cover', flexShrink: 0, imageRendering: 'pixelated' }} />
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '6px 10px', textAlign: 'left',
          background: selected ? C.bg3 : C.bg2,
          border: `1px solid ${open ? accent : C.line}`,
          color: selected ? C.ink : C.dim,
          cursor: 'pointer', fontFamily: MONO, fontSize: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px',
          transition: 'border-color 0.1s',
        }}
      >
        {selected && getArt && <Thumb item={selected} size={18} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.name : placeholder}
        </span>
        <span style={{ color: C.dim, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', zIndex: 10000,
            background: C.bg2, border: `1px solid ${accent}44`,
            maxHeight: '200px', overflowY: 'auto', minWidth: '200px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
          ref={(el) => {
            if (el && ref.current) {
              const r = ref.current.getBoundingClientRect()
              el.style.top  = (r.bottom + 2) + 'px'
              el.style.left = r.left + 'px'
              el.style.width = r.width + 'px'
            }
          }}
        >
          {selected && (
            <button
              onClick={() => { onSelect(null); setOpen(false) }}
              style={{
                width: '100%', padding: '6px 10px', textAlign: 'left',
                background: 'none', border: 'none', borderBottom: `1px solid ${C.line}`,
                color: C.blood, cursor: 'pointer', fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em',
              }}
            >✕ Clear</button>
          )}
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt); setOpen(false) }}
              style={{
                width: '100%', padding: '5px 10px', textAlign: 'left',
                background: selected?.id === opt.id ? `${accent}15` : 'none',
                border: 'none', borderBottom: `1px solid ${C.line}`,
                color: selected?.id === opt.id ? accent : C.muted,
                cursor: 'pointer', fontFamily: MONO, fontSize: '10px',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${accent}10` }}
              onMouseLeave={e => { e.currentTarget.style.background = selected?.id === opt.id ? `${accent}15` : 'none' }}
            >
              {getArt && <Thumb item={opt} size={22} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.name}</span>
            </button>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '10px', color: C.dim, fontFamily: MONO, fontSize: '9px', textAlign: 'center' }}>No options</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Gear Slot Panel (config) ───────────────────────────────────────────────────
// Each gear panel is independent — its own resource display and skill list.

function GearSlotPanel({
  slotLabel, gearSlot, gears, skills, onGearChange, onSkillChange, accent,
}: {
  slotLabel: string
  gearSlot: GearSlot
  gears: SimGear[]
  skills: SimSkill[]
  onGearChange: (gear: SimGear | null) => void
  onSkillChange: (skillIdx: number, skill: SimSkill | null) => void
  accent: string
}) {
  const g = gearSlot.gear
  return (
    <div style={{
      flex: 1, border: `1px solid ${accent}33`, background: C.bg2,
      display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: '3px', height: '3px', background: accent, transform: 'rotate(45deg)', flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>{slotLabel}</span>
      </div>

      {/* gear picker */}
      <Selector
        options={gears}
        selected={g}
        onSelect={onGearChange}
        placeholder="— No Gear —"
        accent={accent}
        getArt={item => item.art ? `/assets/gears/${item.art}.png` : null}
      />

      {/* gear stats — only shown when a gear is selected */}
      {g && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <div style={{ background: C.bg, border: `1px solid ${accent}22`, padding: '3px 7px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>ATK </span>
            <span style={{ fontFamily: DISPLAY, fontSize: '15px', color: accent }}>{g.statAttack}</span>
          </div>
          {g.resourcePoolSize > 0 && (
            <div style={{ background: C.bg, border: `1px solid ${C.gold}33`, padding: '3px 7px' }}>
              <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>{g.resourceName} </span>
              <span style={{ fontFamily: DISPLAY, fontSize: '15px', color: C.gold }}>{g.resourcePoolSize}</span>
            </div>
          )}
          {g.critChance > 0 && (
            <div style={{ background: C.bg, border: `1px solid ${C.blood}22`, padding: '3px 7px' }}>
              <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>CRIT </span>
              <span style={{ fontFamily: DISPLAY, fontSize: '15px', color: C.blood }}>{g.critChance}%</span>
            </div>
          )}
        </div>
      )}

      {/* skill slots — always 3, disabled when no gear */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Skills
        </span>
        {[0, 1, 2].map(si => (
          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, flexShrink: 0, width: '12px' }}>{si + 1}.</span>
            <div style={{ flex: 1 }}>
              <Selector
                options={skills}
                selected={gearSlot.skills[si]}
                onSelect={sk => onSkillChange(si, sk)}
                placeholder={g ? '— Infuse Skill —' : '— No Gear —'}
                accent={C.gold}
                getArt={sk => sk.art ? `/assets/skills/${sk.art}.png` : null}
              />
            </div>
            {gearSlot.skills[si] && (
              <span style={{ fontFamily: MONO, fontSize: '8px', color: C.gold, flexShrink: 0 }}>
                {gearSlot.skills[si]!.basePower}p
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Character Slot Panel (config) ──────────────────────────────────────────────

function CharSlotPanel({
  slotIdx, charSlot, simData, onCharChange, onGearChange, onSkillChange,
}: {
  slotIdx: number
  charSlot: CharSlot
  simData: SimData
  onCharChange: (c: SimCharacter | null) => void
  onGearChange: (gearIdx: 0 | 1, gear: SimGear | null) => void
  onSkillChange: (gearIdx: 0 | 1, skillIdx: number, skill: SimSkill | null) => void
}) {
  const fc  = charSlot.character?.factionColor ?? C.lineStr
  const ch  = charSlot.character

  return (
    <div style={{ border: `1px solid ${fc}44`, background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${fc}, ${fc}44, transparent)` }} />

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* slot label + faction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: '20px', color: C.dim, letterSpacing: '0.06em' }}>SLOT {slotIdx + 1}</span>
          {ch && (
            <span style={{ fontFamily: MONO, fontSize: '8px', color: fc, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {ch.factionName}
            </span>
          )}
        </div>

        {/* character picker */}
        <Selector
          options={simData.characters}
          selected={ch}
          onSelect={onCharChange}
          placeholder="— Select Character —"
          accent={fc}
          getArt={c => c.art ? `/assets/characters/${c.art}.png` : null}
        />

        {ch && (
          <>
            {/* art + name + stats row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '72px', height: '72px', flexShrink: 0,
                background: `linear-gradient(135deg, ${fc}22, ${C.bg2})`,
                border: `1px solid ${fc}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ch.art
                  ? <img src={`/assets/characters/${ch.art}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: DISPLAY, fontSize: '28px', color: `${fc}88` }}>{ch.name.charAt(0)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '22px', color: C.ink, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.1em' }}>{ch.className}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <StatPill label="HP"  value={ch.statHp}      color={C.blood} />
                  <StatPill label="SPD" value={ch.statSpeed}   color={fc} />
                  <StatPill label="DEF" value={ch.statDefense} color={C.muted} />
                </div>
              </div>
            </div>

            {/* HP bar preview */}
            <HpBar current={ch.statHp} max={ch.statHp} color={C.green} />

            {/* gears side by side — each fully independent */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              {([0, 1] as const).map(gi => (
                <GearSlotPanel
                  key={gi}
                  slotLabel={`Gear ${gi + 1}`}
                  gearSlot={charSlot.gears[gi]}
                  gears={simData.gears}
                  skills={simData.skills}
                  onGearChange={gear => onGearChange(gi, gear)}
                  onSkillChange={(si, skill) => onSkillChange(gi, si, skill)}
                  accent={fc}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Enemy Slot Card (config) ───────────────────────────────────────────────────

function EnemySlotCard({
  slotIdx, enemySlot, enemies, enemySkills, onEnemyChange, onSkillChange,
}: {
  slotIdx: number
  enemySlot: EnemySlot
  enemies: SimEnemy[]
  enemySkills: SimEnemySkill[]
  onEnemyChange: (e: SimEnemy | null) => void
  onSkillChange: (si: number, skill: SimEnemySkill | null) => void
}) {
  const en = enemySlot.enemy
  return (
    <div style={{ border: `1px solid ${C.blood}33`, background: C.bg, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '3px', height: '3px', background: C.blood, transform: 'rotate(45deg)' }} />
        <span style={{ fontFamily: MONO, fontSize: '8px', color: C.blood, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Enemy {slotIdx + 1}</span>
      </div>

      <Selector
        options={enemies}
        selected={en}
        onSelect={onEnemyChange}
        placeholder="— Select Enemy —"
        accent={C.blood}
      />

      {en && (
        <>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <StatPill label="HP"  value={en.statHp}    color={C.blood} />
            <StatPill label="ATK" value={en.statAtk}   color={C.blood} />
            <StatPill label="DEF" value={en.statDef}   color={C.muted} />
            <StatPill label="SPD" value={en.statSpeed} color={C.gold} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Skills</span>
            {[0, 1, 2, 3].map(si => (
              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, width: '12px', flexShrink: 0 }}>{si + 1}.</span>
                <div style={{ flex: 1 }}>
                  <Selector
                    options={enemySkills}
                    selected={enemySlot.skills[si]}
                    onSelect={skill => onSkillChange(si, skill)}
                    placeholder="— No Skill —"
                    accent={C.blood}
                  />
                </div>
                {enemySlot.skills[si] && (
                  <span style={{ fontFamily: MONO, fontSize: '8px', color: C.blood, flexShrink: 0 }}>
                    {enemySlot.skills[si]!.basePower}p
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Config helpers ─────────────────────────────────────────────────────────────

function emptyGearSlot(): GearSlot  { return { gear: null, skills: [null, null, null] } }
function emptyCharSlot(): CharSlot  { return { character: null, gears: [emptyGearSlot(), emptyGearSlot()] } }
function emptyEnemySlot(): EnemySlot { return { enemy: null, skills: [null, null, null, null] } }

function buildInitialConfig(slotCount = 3, waveCount = 1): SimConfig {
  return {
    charSlots: [emptyCharSlot(), emptyCharSlot(), emptyCharSlot()],
    enemySlotCount: slotCount,
    waveCount,
    waves: Array.from({ length: waveCount }, () => ({
      slots: Array.from({ length: slotCount }, emptyEnemySlot),
    })),
  }
}

// ── Combat engine helpers ──────────────────────────────────────────────────────

function buildCombatUnitsFromConfig(config: SimConfig): CombatUnit[] {
  const units: CombatUnit[] = []
  config.charSlots.forEach((slot, si) => {
    if (!slot.character) return
    const c = slot.character

    const skills: CombatSkill[] = []
    slot.gears.forEach(gs => {
      if (!gs.gear) return
      gs.skills.forEach(sk => {
        if (!sk) return
        skills.push({ id: `${sk.id}-${gs.gear!.id}`, name: sk.name, basePower: sk.basePower, cost: sk.resourceCost })
      })
    })

    const atk   = slot.gears.reduce((s, gs) => s + (gs.gear?.statAttack ?? 0), 0)
    const res   = slot.gears.reduce((s, gs) => s + (gs.gear?.resourcePoolSize ?? 0), 0)
    const regen = slot.gears.reduce((s, gs) => s + (gs.gear?.resourceRegenRate ?? 0), 0)

    units.push({
      id: `player-${si}`,
      name: c.name,
      isEnemy: false,
      hp: c.statHp, maxHp: c.statHp,
      speed: c.statSpeed,
      atk: atk || c.statFocus,
      def: c.statDefense,
      resource: res, maxResource: res, resourceRegen: regen,
      resourceName: slot.gears.find(gs => (gs.gear?.resourcePoolSize ?? 0) > 0)?.gear?.resourceName ?? 'RES',
      factionColor: c.factionColor,
      art: c.art,
      skills,
      slotIndex: si,
    })
  })
  return units
}

function buildWaveUnits(wave: EnemyWave, waveIdx: number): CombatUnit[] {
  return wave.slots.filter(s => s.enemy !== null).map((slot, si) => {
    const e = slot.enemy!
    const skills: CombatSkill[] = slot.skills
      .filter(Boolean)
      .map(sk => ({ id: `es-${sk!.id}`, name: sk!.name, basePower: sk!.basePower, cost: 0 }))
    return {
      id: `enemy-w${waveIdx}-${si}`,
      name: e.name,
      isEnemy: true,
      hp: e.statHp, maxHp: e.statHp,
      speed: e.statSpeed,
      atk: e.statAtk, def: e.statDef,
      resource: 0, maxResource: 0, resourceRegen: 0, resourceName: '',
      factionColor: C.blood,
      art: e.art,
      skills,
      slotIndex: si,
      waveIndex: waveIdx,
    }
  })
}

function calcDamage(attacker: CombatUnit, skill: CombatSkill, defender: CombatUnit) {
  const base  = (attacker.atk + skill.basePower) - Math.floor(defender.def * 0.4)
  const dmg   = Math.max(1, Math.floor(base * (0.85 + Math.random() * 0.3)))
  const isCrit = Math.random() < 0.15
  return { dmg: isCrit ? Math.floor(dmg * 1.6) : dmg, isCrit }
}

// ── Inline HP bar (smooth fill) ────────────────────────────────────────────────

function SmootHpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.15em', flexShrink: 0, width: '14px' }}>HP</span>
      <div style={{ flex: 1, height: '7px', background: C.bg3, border: `1px solid ${C.line}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct * 100}%`, background: color,
          transition: 'width 0.45s ease, background 0.45s ease',
        }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: '8px', color, flexShrink: 0, minWidth: '56px', textAlign: 'right' }}>
        {current}<span style={{ color: C.dim }}>/{max}</span>
      </span>
    </div>
  )
}

// ── Enemy card — grid tile on top half ────────────────────────────────────────

function EnemyBattleCard({
  unit, isTargetable, isTargeted, isActive, onTargetClick,
}: {
  unit: CombatUnit
  isTargetable: boolean
  isTargeted: boolean
  isActive: boolean
  onTargetClick?: () => void
}) {
  const isDead = unit.hp <= 0
  const fc = unit.factionColor
  const hpPct = Math.max(0, unit.hp / unit.maxHp)
  const hpColor = hpPct > 0.5 ? C.green : hpPct > 0.2 ? C.gold : C.blood

  return (
    <div
      onClick={() => isTargetable && !isDead && onTargetClick?.()}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        padding: '14px 12px 12px',
        background: isTargeted ? `${C.gold}0a` : isActive ? `${fc}0a` : C.bg2,
        border: `2px solid ${isTargeted ? C.gold : isActive ? fc : C.lineStr}`,
        cursor: isTargetable && !isDead ? 'pointer' : 'default',
        opacity: isDead ? 0.28 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isTargeted ? `0 0 20px ${C.gold}33` : isActive ? `0 0 16px ${fc}33` : 'none',
        position: 'relative',
      }}
    >
      {/* top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, ${isTargeted ? C.gold : isActive ? fc : C.line}, transparent)`,
      }} />

      {/* art — large, centered */}
      <div style={{
        width: '96px', height: '96px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        filter: isDead
          ? 'grayscale(1) opacity(0.3)'
          : isTargeted
            ? `drop-shadow(0 0 10px ${C.gold})`
            : isActive
              ? `drop-shadow(0 0 8px ${fc})`
              : 'none',
        transition: 'filter 0.2s',
        transform: isTargeted ? 'scale(1.07)' : 'scale(1)',
      }}>
        {unit.art
          ? <img src={`/assets/enemies/${unit.art}.png`} alt={unit.name}
                 style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
          : <span style={{ fontFamily: DISPLAY, fontSize: '40px', color: `${fc}77` }}>{unit.name.charAt(0)}</span>
        }
      </div>

      {/* name */}
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: '16px', letterSpacing: '0.05em',
          color: isDead ? C.dim : isActive ? fc : C.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isDead ? '✕ ' : ''}{unit.name}
        </div>
        <div style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.12em', marginTop: '1px' }}>
          SPD {unit.speed} · ATK {unit.atk} · DEF {unit.def}
        </div>
      </div>

      {/* HP bar */}
      <div style={{ width: '100%' }}>
        <SmootHpBar current={unit.hp} max={unit.maxHp} color={hpColor} />
      </div>

      {/* target cue */}
      {isTargetable && !isDead && (
        <div style={{
          fontFamily: MONO, fontSize: '7px', color: C.gold, letterSpacing: '0.14em',
          padding: '3px 8px', border: `1px dashed ${C.gold}55`, background: `${C.gold}08`,
        }}>
          ◆ CLICK TO TARGET
        </div>
      )}
      {isTargeted && !isTargetable && (
        <div style={{ fontFamily: MONO, fontSize: '7px', color: C.gold, letterSpacing: '0.14em' }}>▶ TARGETED</div>
      )}
    </div>
  )
}

// ── Player battle card — bottom 3 fixed slots ──────────────────────────────────
// Shows art + name + HP + resource. Skills shown in bottom dock, not on card.

function PlayerBattleCard({
  unit, isActive, pendingSkill,
}: {
  unit: CombatUnit
  isActive: boolean
  pendingSkill: CombatSkill | null
}) {
  const isDead = unit.hp <= 0
  const fc = unit.factionColor
  const hpPct = Math.max(0, unit.hp / unit.maxHp)
  const hpColor = hpPct > 0.5 ? C.green : hpPct > 0.2 ? C.gold : C.blood

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '12px',
      background: isActive ? `${fc}0d` : C.bg2,
      border: `2px solid ${isActive ? fc : C.lineStr}`,
      transition: 'all 0.2s ease',
      opacity: isDead ? 0.3 : 1,
      boxShadow: isActive ? `0 0 16px ${fc}33` : 'none',
      position: 'relative',
      flex: 1,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, ${isActive ? fc : C.line}, transparent)`,
      }} />

      {/* art + name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '56px', height: '56px', flexShrink: 0,
          border: `1px solid ${fc}44`,
          background: `linear-gradient(135deg, ${fc}18, ${C.bg})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: isActive ? `0 0 12px ${fc}44` : 'none',
          transition: 'box-shadow 0.2s',
        }}>
          {unit.art
            ? <img src={`/assets/characters/${unit.art}.png`} alt={unit.name}
                   style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
            : <span style={{ fontFamily: DISPLAY, fontSize: '24px', color: `${fc}77` }}>{unit.name.charAt(0)}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: DISPLAY, fontSize: '18px', letterSpacing: '0.04em',
            color: isDead ? C.dim : C.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isDead ? '✕ ' : ''}{unit.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.12em', marginTop: '2px' }}>
            SPD {unit.speed} · ATK {unit.atk} · DEF {unit.def}
          </div>
          {isActive && !isDead && (
            <div style={{ fontFamily: MONO, fontSize: '7px', color: C.gold, letterSpacing: '0.15em', marginTop: '3px' }}>
              ▶ YOUR TURN
            </div>
          )}
        </div>
      </div>

      {/* HP */}
      <SmootHpBar current={unit.hp} max={unit.maxHp} color={hpColor} />

      {/* Resource */}
      {unit.maxResource > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, flexShrink: 0, width: '14px' }}>
            {unit.resourceName.slice(0, 2).toUpperCase()}
          </span>
          <div style={{ flex: 1, height: '5px', background: C.bg3, border: `1px solid ${C.line}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${(unit.resource / unit.maxResource) * 100}%`,
              background: C.gold, transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: '7px', color: C.gold, minWidth: '28px', textAlign: 'right' }}>{unit.resource}/{unit.maxResource}</span>
        </div>
      )}

      {/* selected skill indicator */}
      {pendingSkill && isActive && (
        <div style={{
          padding: '4px 8px', background: `${fc}15`,
          border: `1px solid ${fc}44`,
          fontFamily: MONO, fontSize: '8px', color: fc, letterSpacing: '0.1em',
        }}>
          ▶ {pendingSkill.name}
        </div>
      )}
    </div>
  )
}

// ── Turn order strip (horizontal) ─────────────────────────────────────────────

function TurnStrip({ units, currentIdx }: { units: CombatUnit[]; currentIdx: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0',
      background: C.bg2, borderBottom: `1px solid ${C.line}`, padding: '6px 14px',
    }}>
      <span style={{
        fontFamily: MONO, fontSize: '7px', color: C.dim,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        marginRight: '12px', flexShrink: 0,
      }}>
        ORDER
      </span>
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1, alignItems: 'center' }}>
        {units.map((u, i) => {
          const isNow = i === currentIdx
          const isDead = u.hp <= 0
          return (
            <div key={`${u.id}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <div style={{
                width: '34px', height: '34px',
                border: `2px solid ${isNow ? u.factionColor : isDead ? C.line : `${u.factionColor}44`}`,
                background: isNow ? `${u.factionColor}22` : C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', opacity: isDead ? 0.25 : 1,
                boxShadow: isNow ? `0 0 10px ${u.factionColor}66` : 'none',
                transition: 'all 0.2s',
              }}>
                {u.art
                  ? <img src={`/assets/${u.isEnemy ? 'enemies' : 'characters'}/${u.art}.png`} alt=""
                         style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
                  : <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: `${u.factionColor}88` }}>{u.name.charAt(0)}</span>
                }
              </div>
              {isNow && <div style={{ width: '4px', height: '4px', background: C.gold, borderRadius: '50%' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Combat Log ─────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  action:  C.gold,
  damage:  C.blood,
  miss:    C.dim,
  crit:    '#ff5555',
  info:    '#5a8a6a',
  wave:    '#9b59d4',
  victory: C.green,
  defeat:  C.blood,
}

function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries])

  return (
    <div style={{ border: `1px solid ${C.lineStr}`, background: C.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${C.line}`,
        fontFamily: MONO, fontSize: '7px', letterSpacing: '0.25em', color: C.dim, textTransform: 'uppercase',
        background: C.bg2, flexShrink: 0,
      }}>
        ◉ Combat Log
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {entries.length === 0
          ? <div style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, textAlign: 'center', marginTop: '40px' }}>Awaiting combat...</div>
          : entries.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, flexShrink: 0, paddingTop: '1px', minWidth: '22px' }}>T{e.turn}</span>
              <span style={{ fontFamily: MONO, fontSize: '10px', color: LOG_COLORS[e.type], lineHeight: 1.5 }}>{e.text}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── Simulator Config Panel ─────────────────────────────────────────────────────

export function SimulatorConfig({ onStart }: { onStart: (config: SimConfig) => void }) {
  const [simData, setSimData]   = useState<SimData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [config, setConfig]     = useState<SimConfig>(buildInitialConfig(3, 1))
  const [activeWave, setActiveWave] = useState(0)

  useEffect(() => {
    fetch('/api/admin/simulator')
      .then(r => r.json())
      .then(d => { setSimData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function updateCharSlot(si: number, updater: (slot: CharSlot) => CharSlot) {
    setConfig(prev => {
      const next = { ...prev, charSlots: [...prev.charSlots] as [CharSlot, CharSlot, CharSlot] }
      next.charSlots[si] = updater(next.charSlots[si])
      return next
    })
  }

  function updateEnemySlotCount(count: number) {
    setConfig(prev => ({
      ...prev,
      enemySlotCount: count,
      waves: prev.waves.map(wave => {
        const slots = [...wave.slots]
        while (slots.length < count) slots.push(emptyEnemySlot())
        return { slots: slots.slice(0, count) }
      }),
    }))
  }

  function updateWaveCount(count: number) {
    setConfig(prev => {
      const waves = [...prev.waves]
      while (waves.length < count) waves.push({ slots: Array.from({ length: prev.enemySlotCount }, emptyEnemySlot) })
      return { ...prev, waveCount: count, waves: waves.slice(0, count) }
    })
  }

  function updateEnemySlot(waveIdx: number, slotIdx: number, updater: (slot: EnemySlot) => EnemySlot) {
    setConfig(prev => {
      const waves = prev.waves.map((wave, wi) => {
        if (wi !== waveIdx) return wave
        return { slots: wave.slots.map((slot, si) => si === slotIdx ? updater(slot) : slot) }
      })
      return { ...prev, waves }
    })
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', fontFamily: MONO, fontSize: '10px', color: C.dim, letterSpacing: '0.2em' }}>
      ▶▶ LOADING SIM DATA...
    </div>
  )
  if (!simData) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: MONO, fontSize: '10px', color: C.blood }}>
      ⚠ Failed to load simulator data.
    </div>
  )

  const canStart = config.charSlots.some(cs => cs.character !== null) &&
    config.waves.some(wave => wave.slots.some(es => es.enemy !== null))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Player Roster */}
      <div>
        <SectionHead label="Player Roster — 3 Character Slots" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(300px, 1fr))', gap: '16px' }}>
          {([0, 1, 2] as const).map(si => (
            <CharSlotPanel
              key={si}
              slotIdx={si}
              charSlot={config.charSlots[si]}
              simData={simData}
              onCharChange={c => updateCharSlot(si, slot => ({ ...slot, character: c }))}
              onGearChange={(gi, gear) => updateCharSlot(si, slot => {
                const gears = [...slot.gears] as [GearSlot, GearSlot]
                gears[gi] = gear ? { ...gears[gi], gear } : emptyGearSlot()
                return { ...slot, gears }
              })}
              onSkillChange={(gi, ski, skill) => updateCharSlot(si, slot => {
                const gears = [...slot.gears] as [GearSlot, GearSlot]
                const skills = [...gears[gi].skills]
                skills[ski] = skill
                gears[gi] = { ...gears[gi], skills }
                return { ...slot, gears }
              })}
            />
          ))}
        </div>
      </div>

      {/* Enemy Config */}
      <div>
        <SectionHead label="Enemy Configuration" />

        <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em' }}>SLOTS PER WAVE:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => updateEnemySlotCount(n)} style={{
                  width: '28px', height: '28px',
                  background: config.enemySlotCount === n ? C.blood : C.bg2,
                  border: `1px solid ${config.enemySlotCount === n ? C.blood : C.line}`,
                  color: config.enemySlotCount === n ? C.ink : C.dim,
                  cursor: 'pointer', fontFamily: MONO, fontSize: '11px', transition: 'all 0.1s',
                }}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em' }}>WAVES:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => updateWaveCount(n)} style={{
                  width: '28px', height: '28px',
                  background: config.waveCount === n ? C.blood : C.bg2,
                  border: `1px solid ${config.waveCount === n ? C.blood : C.line}`,
                  color: config.waveCount === n ? C.ink : C.dim,
                  cursor: 'pointer', fontFamily: MONO, fontSize: '11px', transition: 'all 0.1s',
                }}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {config.waveCount > 1 && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {Array.from({ length: config.waveCount }).map((_, wi) => (
              <button key={wi} onClick={() => setActiveWave(wi)} style={{
                padding: '4px 14px',
                background: activeWave === wi ? `${C.blood}22` : C.bg2,
                border: `1px solid ${activeWave === wi ? C.blood : C.line}`,
                color: activeWave === wi ? C.blood : C.dim,
                cursor: 'pointer', fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em', transition: 'all 0.1s',
              }}>WAVE {wi + 1}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.enemySlotCount}, minmax(220px, 1fr))`, gap: '12px' }}>
          {config.waves[activeWave]?.slots.map((slot, si) => (
            <EnemySlotCard
              key={si}
              slotIdx={si}
              enemySlot={slot}
              enemies={simData.enemies}
              enemySkills={simData.enemySkills}
              onEnemyChange={enemy => updateEnemySlot(activeWave, si, s => enemy ? { ...s, enemy } : emptyEnemySlot())}
              onSkillChange={(ski, skill) => updateEnemySlot(activeWave, si, s => {
                const skills = [...s.skills]; skills[ski] = skill; return { ...s, skills }
              })}
            />
          ))}
        </div>
      </div>

      {/* Start */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: `1px solid ${C.line}` }}>
        {!canStart && (
          <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim }}>Need ≥1 character and ≥1 enemy</span>
        )}
        <button
          onClick={() => canStart && onStart(config)}
          disabled={!canStart}
          style={{
            padding: '12px 36px',
            background: canStart ? C.gold : C.bg2,
            color: canStart ? '#0b0d10' : C.dim,
            border: `1px solid ${canStart ? C.gold : C.line}`,
            cursor: canStart ? 'pointer' : 'not-allowed',
            fontFamily: DISPLAY, fontSize: '22px', letterSpacing: '0.08em', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (canStart) e.currentTarget.style.boxShadow = `0 0 20px ${C.gold}44` }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
        >
          INITIATE COMBAT
        </button>
      </div>
    </div>
  )
}

// ── Combat Module ──────────────────────────────────────────────────────────────

type BattlePhase = 'select' | 'resolving' | 'wave-clear' | 'victory' | 'defeat'

export function CombatModule({ config, onRetry, onReset }: {
  config: SimConfig
  onRetry: () => void
  onReset: () => void
}) {
  const [players, setPlayers]     = useState<CombatUnit[]>(() => buildCombatUnitsFromConfig(config))
  const [enemies, setEnemies]     = useState<CombatUnit[]>(() => buildWaveUnits(config.waves[0], 0))
  const [currentWave, setCurrentWave] = useState(0)
  const [phase, setPhase]         = useState<BattlePhase>('select')
  const [turn, setTurn]           = useState(1)
  const [turnOrder, setTurnOrder] = useState<CombatUnit[]>([])
  const [actorIdx, setActorIdx]   = useState(0)
  const [pendingSkill, setPendingSkill]   = useState<CombatSkill | null>(null)
  const [targetId, setTargetId]   = useState<string | null>(null)
  const [log, setLog]             = useState<CombatLogEntry[]>([
    { turn: 0, text: 'Wave 1 begins.', type: 'wave' },
  ])
  const resolving = useRef(false)

  const pushLog = useCallback((text: string, type: CombatLogEntry['type'], t: number) => {
    setLog(prev => [...prev, { turn: t, text, type }])
  }, [])

  // Build sorted turn order from alive units
  const buildOrder = useCallback((p: CombatUnit[], e: CombatUnit[]) =>
    [...p.filter(u => u.hp > 0), ...e.filter(u => u.hp > 0)]
      .sort((a, b) => b.speed - a.speed)
  , [])

  // Initialize turn order once on mount and when wave changes
  useEffect(() => {
    if (turnOrder.length === 0) {
      setTurnOrder(buildOrder(players, enemies))
      setActorIdx(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentActor = turnOrder[actorIdx] ?? null
  const isPlayerTurn = currentActor !== null && !currentActor.isEnemy

  // When it's an enemy turn, auto-select skill and resolve after a short delay
  useEffect(() => {
    if (phase !== 'select' || !currentActor || isPlayerTurn) return
    if (resolving.current) return

    const timer = setTimeout(() => {
      const availSkills = currentActor.skills.filter(s => s.basePower > 0)
      const autoSkill: CombatSkill = availSkills.length > 0
        ? availSkills[Math.floor(Math.random() * availSkills.length)]
        : { id: 'basic', name: 'Strike', basePower: Math.floor(currentActor.atk * 0.5), cost: 0 }
      setPendingSkill(autoSkill)
    }, 600)

    return () => clearTimeout(timer)
  }, [phase, currentActor, isPlayerTurn])

  // When enemy has a skill assigned, auto-resolve
  useEffect(() => {
    if (phase !== 'select' || !currentActor || isPlayerTurn || !pendingSkill) return
    doResolve(pendingSkill, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSkill, isPlayerTurn])

  async function doResolve(skill: CombatSkill, chosenTarget: string | null) {
    if (resolving.current || !currentActor) return
    resolving.current = true
    setPhase('resolving')

    const currentTurn = turn
    let pState = players.map(u => ({ ...u }))
    let eState = enemies.map(u => ({ ...u }))

    const actor = (currentActor.isEnemy ? eState : pState).find(u => u.id === currentActor.id)
    if (!actor || actor.hp <= 0) {
      advance(pState, eState, currentTurn)
      return
    }

    // Pick target
    const pool = currentActor.isEnemy ? pState.filter(u => u.hp > 0) : eState.filter(u => u.hp > 0)
    const target = chosenTarget
      ? pool.find(u => u.id === chosenTarget) ?? pool[Math.floor(Math.random() * pool.length)]
      : pool[Math.floor(Math.random() * pool.length)]

    if (!target) {
      advance(pState, eState, currentTurn)
      return
    }

    const { dmg, isCrit } = calcDamage(actor, skill, target)
    pushLog(
      `${actor.name} uses ${skill.name} on ${target.name} → ${dmg} dmg${isCrit ? ' [CRIT]' : ''}`,
      isCrit ? 'crit' : 'damage',
      currentTurn,
    )

    const newHp = Math.max(0, target.hp - dmg)
    if (currentActor.isEnemy) {
      pState = pState.map(u => u.id === target.id ? { ...u, hp: newHp } : u)
      setPlayers([...pState])
    } else {
      eState = eState.map(u => u.id === target.id ? { ...u, hp: newHp } : u)
      setEnemies([...eState])
      // resource regen
      if (actor.maxResource > 0) {
        const newRes = Math.min(actor.maxResource, actor.resource + actor.resourceRegen - (skill.cost ?? 0))
        pState = pState.map(u => u.id === actor.id ? { ...u, resource: newRes } : u)
        setPlayers([...pState])
      }
    }

    await new Promise(r => setTimeout(r, 1400))
    advance(pState, eState, currentTurn)
  }

  function advance(pState: CombatUnit[], eState: CombatUnit[], currentTurn: number) {
    setPendingSkill(null)
    setTargetId(null)

    const allPDead = pState.every(u => u.hp <= 0)
    const allEDead = eState.every(u => u.hp <= 0)

    if (allPDead) {
      pushLog('— ALL UNITS ELIMINATED — Defeat.', 'defeat', currentTurn)
      setPhase('defeat')
      resolving.current = false
      return
    }

    if (allEDead) {
      const next = currentWave + 1
      if (next < config.waveCount && next < config.waves.length) {
        pushLog(`Wave ${currentWave + 1} cleared! Wave ${next + 1} incoming...`, 'wave', currentTurn)
        setPhase('wave-clear')
        setTimeout(() => {
          const newEnemies = buildWaveUnits(config.waves[next], next)
          setEnemies(newEnemies)
          setCurrentWave(next)
          const newTurn = currentTurn + 1
          setTurn(newTurn)
          const newOrder = buildOrder(pState, newEnemies)
          setTurnOrder(newOrder)
          setActorIdx(0)
          pushLog(`Wave ${next + 1} begins.`, 'wave', newTurn)
          setPhase('select')
          resolving.current = false
        }, 1400)
      } else {
        pushLog('— ALL WAVES CLEARED — Victory!', 'victory', currentTurn)
        setPhase('victory')
        resolving.current = false
      }
      return
    }

    // Advance to next actor
    const nextIdx = actorIdx + 1
    if (nextIdx >= turnOrder.length) {
      const newTurn = currentTurn + 1
      setTurn(newTurn)
      const newOrder = buildOrder(pState, eState)
      setTurnOrder(newOrder)
      setActorIdx(0)
      pushLog(`— Turn ${newTurn} begins —`, 'info', newTurn)
    } else {
      setActorIdx(nextIdx)
    }

    setPhase('select')
    resolving.current = false
  }

  const canExecute = isPlayerTurn && !!pendingSkill && phase === 'select'

  // Latest log entry for the dialog box
  const lastLog = log[log.length - 1]

  // Active player unit (for skill panel)
  const activePlayer = isPlayerTurn && currentActor ? players.find(p => p.id === currentActor.id) ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', background: C.bg, border: `1px solid ${C.lineStr}` }}>

      {/* ── Top bar: wave / turn / controls ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: C.bg2, borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: '22px', letterSpacing: '0.06em', color: C.gold }}>
            WAVE {currentWave + 1}/{config.waveCount}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.2em' }}>T{turn}</span>
          {(phase === 'victory' || phase === 'defeat') && (
            <span style={{ fontFamily: DISPLAY, fontSize: '22px', letterSpacing: '0.06em', color: phase === 'victory' ? C.green : C.blood }}>
              {phase === 'victory' ? '★ VICTORY' : '✕ DEFEAT'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onRetry} style={{
            padding: '5px 14px', background: C.bg, border: `1px solid ${C.lineStr}`,
            color: C.muted, cursor: 'pointer', fontFamily: MONO, fontSize: '8px', letterSpacing: '0.12em', transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.lineStr; e.currentTarget.style.color = C.muted }}
          >↩ RETRY</button>
          <button onClick={onReset} style={{
            padding: '5px 14px', background: C.bg, border: `1px solid ${C.blood}44`,
            color: C.blood, cursor: 'pointer', fontFamily: MONO, fontSize: '8px', letterSpacing: '0.12em', transition: 'all 0.1s', opacity: 0.7,
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
          >✕ RESET</button>
        </div>
      </div>

      {/* ── Turn order strip ── */}
      <TurnStrip units={turnOrder} currentIdx={actorIdx} />

      {/* ── Arena ── */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(180deg, #0c0e14 0%, #080a0e 55%, #0e1018 55%, #0a0c10 100%)`,
        height: '340px',
        display: 'flex', alignItems: 'stretch',
        overflow: 'hidden',
        borderBottom: `1px solid ${C.line}`,
      }}>
        {/* ground line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '55%', height: '1px', background: C.line }} />

        {/* ── Enemy side: HP boxes top-left, sprites top-right ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '16px 12px 0 16px', gap: '8px', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2px' }}>
            ◈ Enemy Force
          </div>
          {enemies.map(u => (
            <PokeHpBox
              key={u.id}
              unit={u}
              isTargetable={isPlayerTurn && phase === 'select' && u.hp > 0}
              isTargeted={targetId === u.id}
              isActive={currentActor?.id === u.id && currentActor.isEnemy}
              onTargetClick={() => { setTargetId(u.id); pushLog(`${u.name} targeted.`, 'info', turn) }}
            />
          ))}
        </div>

        {/* Enemy sprites top-right */}
        <div style={{ position: 'absolute', right: '10%', top: '6%', display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
          {enemies.map(u => (
            <ArenaBattler
              key={u.id}
              unit={u}
              side="front"
              isActive={currentActor?.id === u.id && currentActor.isEnemy}
              isTargetable={isPlayerTurn && phase === 'select' && u.hp > 0}
              isTargeted={targetId === u.id}
              onTargetClick={() => { setTargetId(u.id); pushLog(`${u.name} targeted.`, 'info', turn) }}
            />
          ))}
        </div>

        {/* Player sprites bottom-left */}
        <div style={{ position: 'absolute', left: '6%', bottom: '10%', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          {players.map(u => (
            <ArenaBattler
              key={u.id}
              unit={u}
              side="back"
              isActive={currentActor?.id === u.id && !currentActor.isEnemy}
              isTargetable={false}
              isTargeted={false}
            />
          ))}
        </div>

        {/* ── Player HP boxes bottom-right ── */}
        <div style={{ position: 'absolute', right: '14px', bottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          {players.map(u => (
            <PokeHpBox
              key={u.id}
              unit={u}
              isTargetable={false}
              isTargeted={false}
              isActive={currentActor?.id === u.id && !currentActor.isEnemy}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom dock: dialog + skills ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '160px' }}>

        {/* Dialog box (left) */}
        <div style={{
          borderRight: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}`,
          padding: '18px 22px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: C.bg,
        }}>
          <div>
            {/* latest log line shown large like Pokémon dialog */}
            {lastLog && (
              <p style={{ fontFamily: MONO, fontSize: '13px', color: C.ink, lineHeight: 1.6, margin: 0 }}>
                {lastLog.text}
              </p>
            )}
          </div>

          {/* scroll hint / phase label */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {phase === 'select' && isPlayerTurn && currentActor && (
              <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.1em' }}>
                <span style={{ color: currentActor.factionColor }}>{currentActor.name}</span>
                {pendingSkill && <span style={{ color: C.gold }}> · {pendingSkill.name}</span>}
                {targetId && <span style={{ color: C.gold }}> → {enemies.find(e => e.id === targetId)?.name ?? '?'}</span>}
              </span>
            )}
            {phase === 'select' && !isPlayerTurn && currentActor && (
              <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim }}>
                <span style={{ color: C.blood }}>{currentActor.name}</span> is acting...
              </span>
            )}
            {phase === 'resolving' && (
              <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.2em' }}>▶▶</span>
            )}
            {(phase === 'victory' || phase === 'defeat') && <span />}
            {/* log scroll indicator */}
            <span style={{ fontFamily: MONO, fontSize: '10px', color: C.dim }}>▼</span>
          </div>
        </div>

        {/* Skill / action panel (right — shown on player turn, else log) */}
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.bg2 }}>
          {phase === 'select' && activePlayer && activePlayer.hp > 0
            ? (
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase' }}>What will {activePlayer.name} do?</span>
                  <button
                    onClick={() => canExecute && doResolve(pendingSkill!, targetId)}
                    disabled={!canExecute}
                    style={{
                      padding: '6px 20px',
                      background: canExecute ? C.gold : C.bg,
                      color: canExecute ? '#0b0d10' : C.dim,
                      border: `1px solid ${canExecute ? C.gold : C.line}`,
                      cursor: canExecute ? 'pointer' : 'not-allowed',
                      fontFamily: DISPLAY, fontSize: '16px', letterSpacing: '0.06em', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (canExecute) e.currentTarget.style.boxShadow = `0 0 12px ${C.gold}44` }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                  >
                    FIGHT
                  </button>
                </div>
                {/* skill grid — 2 cols */}
                {activePlayer.skills.length === 0
                  ? <div style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, textAlign: 'center', padding: '16px', border: `1px dashed ${C.line}` }}>No skills</div>
                  : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1 }}>
                      {activePlayer.skills.map(sk => {
                        const isPicked  = pendingSkill?.id === sk.id
                        const canAfford = activePlayer.maxResource === 0 || activePlayer.resource >= sk.cost
                        const fc = activePlayer.factionColor
                        return (
                          <button
                            key={sk.id}
                            onClick={() => canAfford && setPendingSkill(sk)}
                            disabled={!canAfford}
                            style={{
                              padding: '10px 12px',
                              background: isPicked ? `${fc}22` : C.bg,
                              border: `2px solid ${isPicked ? fc : C.line}`,
                              color: isPicked ? fc : canAfford ? C.ink : C.dim,
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                              fontFamily: MONO, fontSize: '10px', textAlign: 'left',
                              display: 'flex', flexDirection: 'column', gap: '2px',
                              transition: 'all 0.1s',
                              opacity: canAfford ? 1 : 0.35,
                            }}
                            onMouseEnter={e => { if (canAfford && !isPicked) e.currentTarget.style.borderColor = `${fc}88` }}
                            onMouseLeave={e => { if (!isPicked) e.currentTarget.style.borderColor = C.line }}
                          >
                            <span style={{ fontFamily: DISPLAY, fontSize: '15px', letterSpacing: '0.04em' }}>{sk.name}</span>
                            <span style={{ color: C.gold, fontSize: '8px' }}>
                              PWR {sk.basePower}{sk.cost > 0 ? ` · ${sk.cost}${activePlayer.resourceName.charAt(0)}` : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                }
              </div>
            )
            : (
              /* Log panel when not player's skill-select turn */
              <CombatLog entries={log} />
            )
          }
        </div>
      </div>
    </div>
  )
}

// ── Battle Sim Root ────────────────────────────────────────────────────────────

type SimView = 'config' | 'combat'

export function BattleSimulator() {
  const [view, setView]               = useState<SimView>('config')
  const [activeConfig, setActiveConfig] = useState<SimConfig | null>(null)

  function handleStart(config: SimConfig) {
    setActiveConfig(config)
    setView('combat')
  }

  function handleRetry() {
    if (activeConfig) {
      setActiveConfig({ ...activeConfig })
      setView('combat')
    }
  }

  function handleReset() {
    setActiveConfig(null)
    setView('config')
  }

  return (
    <div>
      {view === 'config' && <SimulatorConfig onStart={handleStart} />}
      {view === 'combat' && activeConfig && (
        <CombatModule config={activeConfig} onRetry={handleRetry} onReset={handleReset} />
      )}
    </div>
  )
}
