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

// Slot config for player side
interface GearSlot {
  gear: SimGear | null
  skills: (SimSkill | null)[]  // 3 skills per gear
}

interface CharSlot {
  character: SimCharacter | null
  gears: [GearSlot, GearSlot]
}

// Enemy side config
interface EnemySlot {
  enemy: SimEnemy | null
  skills: (SimEnemySkill | null)[]  // up to 4 skills
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

// Combat state
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

// ── Style helpers ──────────────────────────────────────────────────────────────

const C = {
  bg:       '#08090b',
  bg2:      '#0a0c10',
  bg3:      '#0f1115',
  ink:      '#f2f0ea',
  muted:    '#8a8e96',
  dim:      '#5a5e66',
  line:     '#1e2228',
  lineStr:  '#2a2f38',
  gold:     '#e8a736',
  blood:    '#c53030',
  green:    '#6b8a3a',
  enemy:    '#c53030',
}

const MONO = "'JetBrains Mono', monospace"
const DISPLAY = "'Bebas Neue', sans-serif"

function pill(label: string, value: string | number, color = C.gold) {
  return { label, value, color }
}

function MiniPill({ label, value, color = C.gold }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.bg2, border: `1px solid ${color}22`, padding: '4px 8px', minWidth: '52px' }}>
      <span style={{ fontFamily: MONO, fontSize: '7px', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: DISPLAY, fontSize: '16px', color, lineHeight: 1 }}>{value}</span>
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ width: '10px', height: '1px', background: C.gold }} />
      <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: C.dim }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: C.line }} />
    </div>
  )
}

// ── Selector Dropdown ─────────────────────────────────────────────────────────

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
    function click(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  function Thumb({ item, size = 20 }: { item: T; size?: number }) {
    const art = getArt?.(item) ?? null
    if (!art) return null
    return (
      <img
        src={art}
        alt=""
        style={{ width: size, height: size, objectFit: 'cover', flexShrink: 0, imageRendering: 'pixelated' }}
      />
    )
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
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: C.bg2, border: `1px solid ${accent}44`,
          maxHeight: '200px', overflowY: 'auto',
          boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
        }}>
          {selected && (
            <button
              onClick={() => { onSelect(null); setOpen(false) }}
              style={{
                width: '100%', padding: '6px 10px', textAlign: 'left',
                background: 'none', border: 'none', borderBottom: `1px solid ${C.line}`,
                color: C.blood, cursor: 'pointer', fontFamily: MONO, fontSize: '9px',
                letterSpacing: '0.1em',
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

// ── Gear Slot Panel ────────────────────────────────────────────────────────────

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
  return (
    <div style={{ border: `1px solid ${C.line}`, padding: '10px', background: C.bg2, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <div style={{ width: '3px', height: '3px', background: accent, transform: 'rotate(45deg)' }} />
        <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>{slotLabel}</span>
      </div>

      <Selector
        options={gears}
        selected={gearSlot.gear}
        onSelect={onGearChange}
        placeholder="— Select Gear —"
        accent={accent}
        getArt={g => g.art ? `/assets/gears/${g.art}.png` : null}
      />

      {gearSlot.gear && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          <div style={{ background: C.bg, border: `1px solid ${accent}22`, padding: '3px 6px', flexShrink: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>ATK </span>
            <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: accent }}>{gearSlot.gear.statAttack}</span>
          </div>
          {gearSlot.gear.resourcePoolSize > 0 && (
            <div style={{ background: C.bg, border: `1px solid ${C.gold}22`, padding: '3px 6px', flexShrink: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>{gearSlot.gear.resourceName} </span>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: C.gold }}>{gearSlot.gear.resourcePoolSize}</span>
            </div>
          )}
        </div>
      )}

      {/* 3 skill slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[0, 1, 2].map(si => (
          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, flexShrink: 0, width: '12px' }}>{si + 1}.</span>
            <div style={{ flex: 1 }}>
              <Selector
                options={skills}
                selected={gearSlot.skills[si]}
                onSelect={skill => onSkillChange(si, skill)}
                placeholder={gearSlot.gear ? '— Infuse Skill —' : '— No Gear —'}
                accent={C.gold}
                getArt={s => s.art ? `/assets/skills/${s.art}.png` : null}
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

// ── Character Slot Panel ───────────────────────────────────────────────────────

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
  const fc = charSlot.character?.factionColor ?? C.lineStr

  return (
    <div style={{
      border: `1px solid ${fc}44`, background: C.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* faction top bar */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${fc}, ${fc}44, transparent)` }} />

      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: '18px', color: C.dim, letterSpacing: '0.06em' }}>SLOT {slotIdx + 1}</span>
          {charSlot.character && (
            <span style={{ fontFamily: MONO, fontSize: '8px', color: fc, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {charSlot.character.factionName}
            </span>
          )}
        </div>

        <Selector
          options={simData.characters}
          selected={charSlot.character}
          onSelect={onCharChange}
          placeholder="— Select Character —"
          accent={fc}
          getArt={c => c.art ? `/assets/characters/${c.art}.png` : null}
        />

        {charSlot.character && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
            <MiniPill label="HP"  value={charSlot.character.statHp}    color={C.blood} />
            <MiniPill label="SPD" value={charSlot.character.statSpeed} color={fc} />
            <MiniPill label="DEF" value={charSlot.character.statDefense} color={C.muted} />
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      </div>
    </div>
  )
}

// ── Enemy Wave Panel ───────────────────────────────────────────────────────────

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
    <div style={{ border: `1px solid ${C.blood}33`, background: C.bg, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '3px', height: '3px', background: C.blood, transform: 'rotate(45deg)' }} />
        <span style={{ fontFamily: MONO, fontSize: '8px', color: C.blood, letterSpacing: '0.15em' }}>ENEMY {slotIdx + 1}</span>
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
            <MiniPill label="HP"  value={en.statHp}    color={C.blood} />
            <MiniPill label="ATK" value={en.statAtk}   color={C.blood} />
            <MiniPill label="DEF" value={en.statDef}   color={C.muted} />
            <MiniPill label="SPD" value={en.statSpeed} color={C.gold} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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

function emptyGearSlot(): GearSlot { return { gear: null, skills: [null, null, null] } }
function emptyCharSlot(): CharSlot { return { character: null, gears: [emptyGearSlot(), emptyGearSlot()] } }
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

// ── Combat engine ──────────────────────────────────────────────────────────────

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

    const atk = slot.gears.reduce((sum, gs) => sum + (gs.gear?.statAttack ?? 0), 0)
    const res = slot.gears.reduce((sum, gs) => sum + (gs.gear?.resourcePoolSize ?? 0), 0)
    const regen = slot.gears.reduce((sum, gs) => sum + (gs.gear?.resourceRegenRate ?? 0), 0)

    units.push({
      id: `player-${si}`,
      name: c.name,
      isEnemy: false,
      hp: c.statHp,
      maxHp: c.statHp,
      speed: c.statSpeed,
      atk: atk || c.statFocus,
      def: c.statDefense,
      resource: res,
      maxResource: res,
      resourceRegen: regen,
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
  return wave.slots
    .filter(s => s.enemy !== null)
    .map((slot, si) => {
      const e = slot.enemy!
      const skills: CombatSkill[] = slot.skills
        .filter(Boolean)
        .map(sk => ({ id: `es-${sk!.id}`, name: sk!.name, basePower: sk!.basePower, cost: 0 }))

      return {
        id: `enemy-w${waveIdx}-${si}`,
        name: e.name,
        isEnemy: true,
        hp: e.statHp,
        maxHp: e.statHp,
        speed: e.statSpeed,
        atk: e.statAtk,
        def: e.statDef,
        resource: 0,
        maxResource: 0,
        resourceRegen: 0,
        resourceName: '',
        factionColor: C.blood,
        art: e.art,
        skills,
        slotIndex: si,
        waveIndex: waveIdx,
      }
    })
}

function calcDamage(attacker: CombatUnit, skill: CombatSkill, defender: CombatUnit): { dmg: number; isCrit: boolean } {
  const base = (attacker.atk + skill.basePower) - Math.floor(defender.def * 0.4)
  const dmg = Math.max(1, Math.floor(base * (0.85 + Math.random() * 0.3)))
  const critRoll = Math.random()
  const isCrit = critRoll < 0.15
  return { dmg: isCrit ? Math.floor(dmg * 1.6) : dmg, isCrit }
}

// ── HP Bar ─────────────────────────────────────────────────────────────────────

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max))
  const segments = 20
  const filled = Math.round(pct * segments)
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1px', flex: 1 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '4px',
            background: i < filled ? (i === filled - 1 ? color : `${color}88`) : C.bg2,
            border: `1px solid ${i < filled ? `${color}44` : C.line}`,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: '8px', color, flexShrink: 0, marginLeft: '4px', minWidth: '60px', textAlign: 'right' }}>
        {current}/{max}
      </span>
    </div>
  )
}

// ── Combat Unit Card ───────────────────────────────────────────────────────────

function CombatUnitCard({
  unit, pendingSkill, onSkillSelect, phase,
}: {
  unit: CombatUnit
  pendingSkill: CombatSkill | null
  onSkillSelect?: (skill: CombatSkill) => void
  phase: BattlePhase | 'done'
}) {
  const isDead = unit.hp <= 0
  const fc = unit.factionColor

  return (
    <div style={{
      border: `1px solid ${isDead ? C.line : fc}55`,
      background: isDead ? C.bg : C.bg,
      padding: '10px',
      opacity: isDead ? 0.35 : 1,
      transition: 'opacity 0.5s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${isDead ? C.line : fc}, transparent)`, marginBottom: '8px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{
          width: '28px', height: '28px', flexShrink: 0,
          background: `linear-gradient(135deg, ${fc}22, ${C.bg2})`,
          border: `1px solid ${fc}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {unit.art
            ? <img src={`/assets/${unit.isEnemy ? 'enemies' : 'characters'}/${unit.art}.png`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: DISPLAY, fontSize: '14px', color: `${fc}88` }}>{unit.name.charAt(0)}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: isDead ? C.dim : C.ink, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isDead ? '✕ ' : ''}{unit.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, letterSpacing: '0.15em' }}>
            SPD:{unit.speed} ATK:{unit.atk} DEF:{unit.def}
          </div>
        </div>
      </div>

      <HpBar current={unit.hp} max={unit.maxHp} color={unit.isEnemy ? C.blood : C.green} />

      {unit.maxResource > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
          <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim }}>{unit.resourceName}:</span>
          <HpBar current={unit.resource} max={unit.maxResource} color={C.gold} />
        </div>
      )}

      {/* Skill selection — players only, select phase */}
      {!unit.isEnemy && !isDead && phase === 'select' && onSkillSelect && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {unit.skills.length === 0 ? (
            <div style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, padding: '4px', textAlign: 'center', border: `1px dashed ${C.line}` }}>No skills</div>
          ) : unit.skills.map(sk => {
            const isPicked = pendingSkill?.id === sk.id
            const canAfford = unit.maxResource === 0 || unit.resource >= sk.cost
            return (
              <button
                key={sk.id}
                onClick={() => canAfford && onSkillSelect(sk)}
                disabled={!canAfford}
                style={{
                  padding: '5px 8px', background: isPicked ? `${fc}22` : C.bg2,
                  border: `1px solid ${isPicked ? fc : C.line}`,
                  color: isPicked ? fc : canAfford ? C.muted : C.dim,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  fontFamily: MONO, fontSize: '9px', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between',
                  transition: 'all 0.1s',
                  opacity: canAfford ? 1 : 0.45,
                }}
                onMouseEnter={e => { if (canAfford && !isPicked) e.currentTarget.style.borderColor = `${fc}66` }}
                onMouseLeave={e => { if (!isPicked) e.currentTarget.style.borderColor = C.line }}
              >
                <span>{sk.name}</span>
                <span style={{ color: C.gold }}>{sk.basePower}p {sk.cost > 0 ? `· ${sk.cost}${unit.resourceName.charAt(0)}` : ''}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Show selected skill */}
      {!unit.isEnemy && !isDead && phase === 'select' && pendingSkill && (
        <div style={{
          marginTop: '4px', padding: '4px 8px', background: `${unit.factionColor}15`,
          border: `1px solid ${unit.factionColor}44`, fontFamily: MONO, fontSize: '8px',
          color: unit.factionColor, letterSpacing: '0.1em',
        }}>
          ▶ {pendingSkill.name}
        </div>
      )}
    </div>
  )
}

// ── Combat Log ────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  action:  '#e8a736',
  damage:  '#c53030',
  miss:    '#5a5e66',
  crit:    '#ff5555',
  info:    '#5a8a6a',
  wave:    '#9b59d4',
  victory: '#6b8a3a',
  defeat:  '#c53030',
}

function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [entries])

  return (
    <div style={{ border: `1px solid ${C.line}`, background: C.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '6px 10px', borderBottom: `1px solid ${C.line}`,
        fontFamily: MONO, fontSize: '8px', letterSpacing: '0.2em', color: C.dim, textTransform: 'uppercase',
        background: C.bg2,
      }}>
        ◉ Combat Log
      </div>
      <div ref={logRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {entries.length === 0 ? (
          <div style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, textAlign: 'center', marginTop: '20px' }}>Awaiting combat...</div>
        ) : entries.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: MONO, fontSize: '7px', color: C.dim, flexShrink: 0, paddingTop: '1px' }}>T{e.turn}</span>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: LOG_COLORS[e.type], lineHeight: 1.4 }}>{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Simulator Config Panel ────────────────────────────────────────────────────

export function SimulatorConfig({ onStart }: { onStart: (config: SimConfig) => void }) {
  const [simData, setSimData] = useState<SimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<SimConfig>(buildInitialConfig(3, 1))
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
        const slots = wave.slots.map((slot, si) => si === slotIdx ? updater(slot) : slot)
        return { slots }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── Player Side ── */}
      <div>
        <SectionHead label="Player Roster — 3 Character Slots" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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

      {/* ── Enemy Side Config ── */}
      <div>
        <SectionHead label="Enemy Configuration" />

        <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em' }}>SLOTS PER WAVE:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => updateEnemySlotCount(n)}
                  style={{
                    width: '28px', height: '28px',
                    background: config.enemySlotCount === n ? C.blood : C.bg2,
                    border: `1px solid ${config.enemySlotCount === n ? C.blood : C.line}`,
                    color: config.enemySlotCount === n ? C.ink : C.dim,
                    cursor: 'pointer', fontFamily: MONO, fontSize: '11px',
                    transition: 'all 0.1s',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em' }}>WAVES:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => updateWaveCount(n)}
                  style={{
                    width: '28px', height: '28px',
                    background: config.waveCount === n ? C.blood : C.bg2,
                    border: `1px solid ${config.waveCount === n ? C.blood : C.line}`,
                    color: config.waveCount === n ? C.ink : C.dim,
                    cursor: 'pointer', fontFamily: MONO, fontSize: '11px',
                    transition: 'all 0.1s',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave tabs */}
        {config.waveCount > 1 && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {Array.from({ length: config.waveCount }).map((_, wi) => (
              <button
                key={wi}
                onClick={() => setActiveWave(wi)}
                style={{
                  padding: '4px 12px', background: activeWave === wi ? `${C.blood}22` : C.bg2,
                  border: `1px solid ${activeWave === wi ? C.blood : C.line}`,
                  color: activeWave === wi ? C.blood : C.dim,
                  cursor: 'pointer', fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em',
                  transition: 'all 0.1s',
                }}
              >WAVE {wi + 1}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.enemySlotCount}, 1fr)`, gap: '10px' }}>
          {config.waves[activeWave]?.slots.map((slot, si) => (
            <EnemySlotCard
              key={si}
              slotIdx={si}
              enemySlot={slot}
              enemies={simData.enemies}
              enemySkills={simData.enemySkills}
              onEnemyChange={enemy => updateEnemySlot(activeWave, si, s => enemy ? { ...s, enemy } : emptyEnemySlot())}
              onSkillChange={(ski, skill) => updateEnemySlot(activeWave, si, s => {
                const skills = [...s.skills]
                skills[ski] = skill
                return { ...s, skills }
              })}
            />
          ))}
        </div>
      </div>

      {/* Start button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: `1px solid ${C.line}` }}>
        <button
          onClick={() => canStart && onStart(config)}
          disabled={!canStart}
          style={{
            padding: '12px 32px',
            background: canStart ? C.gold : C.bg2,
            color: canStart ? '#0b0d10' : C.dim,
            border: `1px solid ${canStart ? C.gold : C.line}`,
            cursor: canStart ? 'pointer' : 'not-allowed',
            fontFamily: DISPLAY, fontSize: '20px', letterSpacing: '0.08em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (canStart) e.currentTarget.style.boxShadow = `0 0 20px ${C.gold}44` }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
        >
          INITIATE COMBAT
        </button>
        {!canStart && (
          <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim, alignSelf: 'center', marginLeft: '12px' }}>
            Need ≥1 player character and ≥1 enemy
          </span>
        )}
      </div>
    </div>
  )
}

// ── Combat Module ─────────────────────────────────────────────────────────────

type BattlePhase = 'select' | 'resolving' | 'wave-clear' | 'victory' | 'defeat'

export function CombatModule({
  config,
  onRetry,
  onReset,
}: {
  config: SimConfig
  onRetry: () => void
  onReset: () => void
}) {
  const playerUnitsBase = buildCombatUnitsFromConfig(config)

  const [players, setPlayers] = useState<CombatUnit[]>(() =>
    playerUnitsBase.map(u => ({ ...u }))
  )
  const [enemies, setEnemies] = useState<CombatUnit[]>(() =>
    buildWaveUnits(config.waves[0], 0)
  )
  const [currentWave, setCurrentWave] = useState(0)
  const [phase, setPhase] = useState<BattlePhase>('select')
  const [turn, setTurn] = useState(1)
  const [pendingSkills, setPendingSkills] = useState<Record<string, CombatSkill | null>>({})
  const [log, setLog] = useState<CombatLogEntry[]>([{ turn: 0, text: `Wave 1 begins. Select skills for your characters.`, type: 'wave' }])

  const resolving = useRef(false)

  function addLog(text: string, type: CombatLogEntry['type']) {
    setLog(prev => [...prev, { turn, text, type }])
  }

  function allPlayersDead(units: CombatUnit[]) { return units.every(u => u.hp <= 0) }
  function allEnemiesDead(units: CombatUnit[]) { return units.every(u => u.hp <= 0) }

  const alivePlayers = players.filter(u => u.hp > 0)
  const aliveEnemies = enemies.filter(u => u.hp > 0)

  // Check if all alive players have picked a skill
  const allPicked = alivePlayers.length > 0 && alivePlayers.every(u => pendingSkills[u.id] !== undefined && pendingSkills[u.id] !== null)

  async function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }

  const resolveTurn = useCallback(async () => {
    if (resolving.current) return
    resolving.current = true
    setPhase('resolving')

    // Build turn order: players + enemies sorted by speed desc
    const playerSnap = [...players]
    const enemySnap = [...enemies]

    const aliveP = playerSnap.filter(u => u.hp > 0)
    const aliveE = enemySnap.filter(u => u.hp > 0)

    // Enemy AI: pick random skill or basic attack
    const enemyMoves: Record<string, CombatSkill> = {}
    for (const e of aliveE) {
      const availSkills = e.skills.filter(s => s.basePower > 0)
      if (availSkills.length > 0) {
        enemyMoves[e.id] = availSkills[Math.floor(Math.random() * availSkills.length)]
      } else {
        enemyMoves[e.id] = { id: 'basic', name: 'Strike', basePower: Math.floor(e.atk * 0.5), cost: 0 }
      }
    }

    const allActors = [
      ...aliveP.map(u => ({ unit: u, isPlayer: true })),
      ...aliveE.map(u => ({ unit: u, isPlayer: false })),
    ].sort((a, b) => b.unit.speed - a.unit.speed)

    let pState = playerSnap.map(u => ({ ...u }))
    let eState = enemySnap.map(u => ({ ...u }))

    function getUnit(id: string, state: CombatUnit[]) { return state.find(u => u.id === id) }
    function updateUnit(id: string, update: Partial<CombatUnit>, state: CombatUnit[]) {
      return state.map(u => u.id === id ? { ...u, ...update } : u)
    }

    for (const actor of allActors) {
      const currentState = actor.isPlayer ? pState : eState
      const current = getUnit(actor.unit.id, currentState)
      if (!current || current.hp <= 0) continue

      const skill = actor.isPlayer ? pendingSkills[actor.unit.id] : enemyMoves[actor.unit.id]
      if (!skill) continue

      // Pick target — player attacks random alive enemy, enemy attacks random alive player
      const targets = actor.isPlayer
        ? eState.filter(u => u.hp > 0)
        : pState.filter(u => u.hp > 0)
      if (targets.length === 0) break

      const target = targets[Math.floor(Math.random() * targets.length)]
      const { dmg, isCrit } = calcDamage(current, skill, target)

      // Log
      const logType: CombatLogEntry['type'] = isCrit ? 'crit' : 'damage'
      const critTag = isCrit ? ' [CRIT]' : ''
      setLog(prev => [...prev, {
        turn,
        text: `${current.name} uses ${skill.name} on ${target.name} → ${dmg} dmg${critTag}`,
        type: logType,
      }])

      // Apply damage
      const newHp = Math.max(0, target.hp - dmg)
      if (actor.isPlayer) {
        eState = updateUnit(target.id, { hp: newHp }, eState)
        setEnemies([...eState])
      } else {
        pState = updateUnit(target.id, { hp: newHp }, pState)
        setPlayers([...pState])
      }

      // Regen resource for player
      if (actor.isPlayer && current.maxResource > 0) {
        const newRes = Math.min(current.maxResource, current.resource + current.resourceRegen - (skill.cost ?? 0))
        pState = updateUnit(current.id, { resource: newRes }, pState)
        setPlayers([...pState])
      }

      await delay(2000)

      if (allEnemiesDead(eState)) break
      if (allPlayersDead(pState)) break
    }

    setPlayers([...pState])
    setEnemies([...eState])
    setPendingSkills({})
    setTurn(t => t + 1)

    if (allPlayersDead(pState)) {
      setLog(prev => [...prev, { turn: turn + 1, text: '— ALL UNITS ELIMINATED — Combat lost.', type: 'defeat' }])
      setPhase('defeat')
      resolving.current = false
      return
    }

    if (allEnemiesDead(eState)) {
      const nextWave = currentWave + 1
      if (nextWave < config.waveCount && nextWave < config.waves.length) {
        setLog(prev => [...prev, { turn: turn + 1, text: `Wave ${currentWave + 1} cleared! Wave ${nextWave + 1} incoming...`, type: 'wave' }])
        setPhase('wave-clear')
        await delay(1500)
        const newWaveEnemies = buildWaveUnits(config.waves[nextWave], nextWave)
        setEnemies(newWaveEnemies)
        setCurrentWave(nextWave)
        setLog(prev => [...prev, { turn: turn + 1, text: `Wave ${nextWave + 1} begins!`, type: 'wave' }])
        setPhase('select')
      } else {
        setLog(prev => [...prev, { turn: turn + 1, text: '— ALL WAVES CLEARED — Victory!', type: 'victory' }])
        setPhase('victory')
      }
      resolving.current = false
      return
    }

    setPhase('select')
    resolving.current = false
  }, [players, enemies, pendingSkills, turn, currentWave, config])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>

      {/* Phase / Wave banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: C.bg2, border: `1px solid ${C.line}`,
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: '22px', letterSpacing: '0.06em', color: C.gold }}>
            WAVE {currentWave + 1}/{config.waveCount}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em' }}>TURN {turn}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{
            padding: '4px 10px', border: `1px solid ${
              phase === 'select' ? C.gold :
              phase === 'resolving' ? C.blood :
              phase === 'victory' ? C.green :
              phase === 'defeat' ? C.blood : C.muted
            }44`,
            fontFamily: MONO, fontSize: '8px', letterSpacing: '0.2em',
            color: phase === 'select' ? C.gold : phase === 'resolving' ? C.blood : phase === 'victory' ? C.green : phase === 'defeat' ? C.blood : C.muted,
          }}>
            {phase === 'select' ? '◉ SELECT SKILLS' :
             phase === 'resolving' ? '▶ RESOLVING...' :
             phase === 'wave-clear' ? '◈ WAVE CLEARED' :
             phase === 'victory' ? '★ VICTORY' : '✕ DEFEAT'}
          </div>
        </div>
      </div>

      {/* Battle area: players | enemies | log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '12px', minHeight: '400px' }}>

        {/* Player side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.25em', color: C.green, textTransform: 'uppercase', marginBottom: '2px' }}>
            ◉ Player Squad
          </div>
          {players.map(u => (
            <CombatUnitCard
              key={u.id}
              unit={u}
              pendingSkill={pendingSkills[u.id] ?? null}
              phase={phase}
              onSkillSelect={sk => setPendingSkills(prev => ({ ...prev, [u.id]: sk }))}
            />
          ))}
        </div>

        {/* Enemy side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.25em', color: C.blood, textTransform: 'uppercase', marginBottom: '2px' }}>
            ◈ Enemy Force
          </div>
          {enemies.map(u => (
            <CombatUnitCard
              key={u.id}
              unit={u}
              pendingSkill={null}
              phase={phase}
            />
          ))}
        </div>

        {/* Log */}
        <CombatLog entries={log} />
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: C.bg2, border: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onRetry}
            style={{
              padding: '8px 20px', background: C.bg, border: `1px solid ${C.lineStr}`,
              color: C.muted, cursor: 'pointer', fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.lineStr; e.currentTarget.style.color = C.muted }}
          >
            ↩ RETRY
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '8px 20px', background: C.bg, border: `1px solid ${C.blood}44`,
              color: C.blood, cursor: 'pointer', fontFamily: MONO, fontSize: '9px', letterSpacing: '0.15em',
              transition: 'all 0.1s', opacity: 0.7,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
          >
            ✕ RESET CONFIG
          </button>
        </div>

        {phase === 'select' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!allPicked && alivePlayers.length > 0 && (
              <span style={{ fontFamily: MONO, fontSize: '8px', color: C.dim }}>
                {alivePlayers.filter(u => pendingSkills[u.id]).length}/{alivePlayers.length} ready
              </span>
            )}
            <button
              onClick={() => allPicked && resolveTurn()}
              disabled={!allPicked}
              style={{
                padding: '10px 28px',
                background: allPicked ? C.gold : C.bg,
                color: allPicked ? '#0b0d10' : C.dim,
                border: `1px solid ${allPicked ? C.gold : C.line}`,
                cursor: allPicked ? 'pointer' : 'not-allowed',
                fontFamily: DISPLAY, fontSize: '18px', letterSpacing: '0.06em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (allPicked) e.currentTarget.style.boxShadow = `0 0 16px ${C.gold}44` }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              PLAY TURN
            </button>
          </div>
        )}

        {(phase === 'victory' || phase === 'defeat') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: DISPLAY, fontSize: '24px', letterSpacing: '0.06em',
              color: phase === 'victory' ? C.green : C.blood,
            }}>
              {phase === 'victory' ? '★ VICTORY' : '✕ DEFEAT'}
            </span>
          </div>
        )}

        {phase === 'resolving' && (
          <span style={{ fontFamily: MONO, fontSize: '9px', color: C.dim, letterSpacing: '0.2em', animation: 'none' }}>
            ▶▶ RESOLVING TURN...
          </span>
        )}
      </div>
    </div>
  )
}

// ── Battle Sim Root ───────────────────────────────────────────────────────────

type SimView = 'config' | 'combat'

export function BattleSimulator() {
  const [view, setView] = useState<SimView>('config')
  const [activeConfig, setActiveConfig] = useState<SimConfig | null>(null)

  function handleStart(config: SimConfig) {
    setActiveConfig(config)
    setView('combat')
  }

  function handleRetry() {
    // Keep config, restart combat
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
        <CombatModule
          config={activeConfig}
          onRetry={handleRetry}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
