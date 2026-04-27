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
  // gear info for display in combat
  gear1Name?: string
  gear2Name?: string
  gear1Resource?: number
  gear2Resource?: number
  gear1ResourceName?: string
  gear2ResourceName?: string
}

interface CombatSkill {
  id: string
  name: string
  basePower: number
  cost: number
  gearSlot?: 0 | 1
}

interface CombatLogEntry {
  turn: number
  text: string
  type: 'action' | 'damage' | 'miss' | 'crit' | 'info' | 'wave' | 'victory' | 'defeat'
}

// ── Gear accent helpers ────────────────────────────────────────────────────────
// Gear 1 = amber (warm gold), Gear 2 = sky (cool cyan)

const GEAR_LABEL_CLASS = ['text-amber-400', 'text-sky-400'] as const
const GEAR_BORDER_CLASS = ['border-amber-500/40', 'border-sky-500/40'] as const
const GEAR_BG_CLASS = ['bg-amber-500/5', 'bg-sky-500/5'] as const
const GEAR_BADGE_CLASS = ['bg-amber-500/15 border-amber-500/40 text-amber-400', 'bg-sky-500/15 border-sky-500/40 text-sky-400'] as const
const GEAR_RESOURCE_CLASS = ['text-amber-300', 'text-sky-300'] as const
const GEAR_RESOURCE_BAR_CLASS = ['bg-amber-400', 'bg-sky-400'] as const
const GEAR_SKILL_HOVER = ['hover:border-amber-500/60', 'hover:border-sky-500/60'] as const
const GEAR_SKILL_ACTIVE = ['border-amber-400 bg-amber-400/10 text-amber-300', 'border-sky-400 bg-sky-400/10 text-sky-300'] as const

// ── Small shared UI ────────────────────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-px bg-warn" />
      <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-dim">{label}</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  )
}

function StatChip({ label, value, className = 'text-warn' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="flex flex-col items-center bg-bg border border-line px-2 py-1 min-w-[44px]">
      <span className="font-mono text-[7px] tracking-widest text-dim uppercase">{label}</span>
      <span className={`font-display text-base leading-none ${className}`}>{value}</span>
    </div>
  )
}

function SmootHpBar({ current, max, className = 'bg-success' }: { current: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, current / max))
  const color = pct > 0.5 ? 'bg-success' : pct > 0.2 ? 'bg-warn' : 'bg-blood'
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[7px] text-dim w-3 shrink-0">HP</span>
      <div className="flex-1 h-[6px] bg-bg3 border border-line relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-[width] duration-500`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`font-mono text-[9px] ${color} shrink-0 min-w-[52px] text-right`}>
        {current}<span className="text-dim">/{max}</span>
      </span>
    </div>
  )
}

function ResourceBar({ current, max, name, gearIdx }: { current: number; max: number; name: string; gearIdx: 0 | 1 }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? current / max : 0))
  const barClass = GEAR_RESOURCE_BAR_CLASS[gearIdx]
  const textClass = GEAR_RESOURCE_CLASS[gearIdx]
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[7px] ${textClass} w-3 shrink-0`}>{name.slice(0, 2).toUpperCase()}</span>
      <div className="flex-1 h-[4px] bg-bg3 border border-line relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barClass} transition-[width] duration-500`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`font-mono text-[9px] ${textClass} shrink-0 min-w-[36px] text-right`}>{current}/{max}</span>
    </div>
  )
}

// ── Selector Dropdown ──────────────────────────────────────────────────────────

function Selector<T extends { id: number; name: string }>({
  options, selected, onSelect, placeholder, accentClass = 'text-warn', borderActiveClass = 'border-warn', getArt,
}: {
  options: T[]
  selected: T | null
  onSelect: (item: T | null) => void
  placeholder: string
  accentClass?: string
  borderActiveClass?: string
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full px-2.5 py-1.5 text-left bg-bg2 border ${open ? borderActiveClass : 'border-line'} text-[10px] font-mono flex justify-between items-center gap-2 cursor-pointer transition-colors`}
      >
        {selected && getArt && getArt(selected) && (
          <img src={getArt(selected)!} alt="" className="w-4 h-4 object-cover shrink-0 pixelated" />
        )}
        <span className={`overflow-hidden text-ellipsis whitespace-nowrap flex-1 ${selected ? 'text-ink' : 'text-dim'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="text-dim shrink-0 text-[9px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="fixed z-[10000] bg-bg2 border border-warn/20 max-h-48 overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
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
              className="w-full px-2.5 py-1.5 text-left bg-transparent border-b border-line text-blood text-[9px] tracking-wide font-mono cursor-pointer hover:bg-blood/10 transition-colors"
            >
              ✕ Clear
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onSelect(opt); setOpen(false) }}
              className={`w-full px-2.5 py-1 text-left border-b border-line text-[10px] font-mono flex items-center gap-2 cursor-pointer transition-colors ${selected?.id === opt.id ? `${accentClass} bg-warn/5` : 'text-muted hover:bg-warn/5'}`}
            >
              {getArt && getArt(opt) && (
                <img src={getArt(opt)!} alt="" className="w-5 h-5 object-cover shrink-0 pixelated" />
              )}
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{opt.name}</span>
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2.5 text-dim font-mono text-[9px] text-center">No options</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Gear Slot Panel (config) ───────────────────────────────────────────────────

function GearSlotPanel({
  gearIdx, gearSlot, gears, skills, onGearChange, onSkillChange,
}: {
  gearIdx: 0 | 1
  gearSlot: GearSlot
  gears: SimGear[]
  skills: SimSkill[]
  onGearChange: (gear: SimGear | null) => void
  onSkillChange: (skillIdx: number, skill: SimSkill | null) => void
}) {
  const g = gearSlot.gear
  const labelClass = GEAR_LABEL_CLASS[gearIdx]
  const borderClass = GEAR_BORDER_CLASS[gearIdx]
  const bgClass = GEAR_BG_CLASS[gearIdx]
  const badgeClass = GEAR_BADGE_CLASS[gearIdx]
  const resourceTextClass = GEAR_RESOURCE_CLASS[gearIdx]
  const borderActiveClass = gearIdx === 0 ? 'border-amber-400' : 'border-sky-400'
  const accentClass = gearIdx === 0 ? 'text-amber-400' : 'text-sky-400'

  return (
    <div className={`flex-1 border ${borderClass} ${bgClass} flex flex-col gap-2 p-3`}>
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 border ${borderActiveClass} rotate-45 shrink-0`} />
        <span className={`font-mono text-[8px] tracking-[0.2em] uppercase ${labelClass} font-semibold`}>
          Gear {gearIdx + 1}
        </span>
        {g && (
          <span className={`ml-auto font-mono text-[7px] tracking-wide px-1.5 py-0.5 border ${badgeClass}`}>
            {g.category}
          </span>
        )}
      </div>

      <Selector
        options={gears}
        selected={g}
        onSelect={onGearChange}
        placeholder="— No Gear —"
        accentClass={accentClass}
        borderActiveClass={borderActiveClass}
        getArt={item => item.art ? `/assets/gears/${item.art}.png` : null}
      />

      {g && (
        <>
          {/* Gear stats */}
          <div className="flex gap-1.5 flex-wrap">
            <div className={`bg-bg border ${borderClass} px-2 py-1 flex items-baseline gap-1`}>
              <span className="font-mono text-[7px] text-dim">ATK</span>
              <span className={`font-display text-base leading-none ${labelClass}`}>{g.statAttack}</span>
            </div>
            {g.critChance > 0 && (
              <div className="bg-bg border border-blood/30 px-2 py-1 flex items-baseline gap-1">
                <span className="font-mono text-[7px] text-dim">CRIT</span>
                <span className="font-display text-base leading-none text-blood">{g.critChance}%</span>
              </div>
            )}
          </div>

          {/* Resource pool — visually distinct per gear */}
          {g.resourcePoolSize > 0 && (
            <div className={`border ${borderClass} bg-bg p-2 flex flex-col gap-1`}>
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[7px] tracking-widest uppercase ${resourceTextClass}`}>{g.resourceName}</span>
                <span className={`font-display text-sm leading-none ${resourceTextClass}`}>{g.resourcePoolSize}</span>
              </div>
              <div className="w-full h-[3px] bg-bg3 border border-line relative">
                <div className={`absolute inset-y-0 left-0 w-full ${GEAR_RESOURCE_BAR_CLASS[gearIdx]}`} />
              </div>
              {g.resourceRegenRate > 0 && (
                <span className="font-mono text-[7px] text-dim">+{g.resourceRegenRate}/turn</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Skill slots */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[7px] text-dim tracking-[0.2em] uppercase">Skills</span>
        {[0, 1, 2].map(si => (
          <div key={si} className="flex items-center gap-1.5">
            <span className="font-mono text-[7px] text-dim shrink-0 w-3">{si + 1}.</span>
            <div className="flex-1">
              <Selector
                options={skills}
                selected={gearSlot.skills[si]}
                onSelect={sk => onSkillChange(si, sk)}
                placeholder={g ? '— Infuse Skill —' : '— No Gear —'}
                accentClass={accentClass}
                borderActiveClass={borderActiveClass}
                getArt={sk => sk.art ? `/assets/skills/${sk.art}.png` : null}
              />
            </div>
            {gearSlot.skills[si] && (
              <span className={`font-mono text-[8px] ${labelClass} shrink-0`}>{gearSlot.skills[si]!.basePower}p</span>
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
  const ch = charSlot.character
  const hasGear1 = !!charSlot.gears[0].gear
  const hasGear2 = !!charSlot.gears[1].gear

  return (
    <div className="border border-line bg-bg flex flex-col overflow-hidden">
      {/* Top accent strip using faction color */}
      <div
        className="h-0.5 w-full"
        style={{ background: ch ? `linear-gradient(90deg, ${ch.factionColor}, ${ch.factionColor}44, transparent)` : undefined }}
      />

      <div className="p-3.5 flex flex-col gap-3">
        {/* Slot label row */}
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-dim tracking-wider">SLOT {slotIdx + 1}</span>
          {ch && (
            <span className="font-mono text-[8px] tracking-[0.15em] uppercase ml-1" style={{ color: ch.factionColor }}>
              {ch.factionName}
            </span>
          )}
          {/* Gear presence badges */}
          <div className="flex gap-1 ml-auto">
            <span className={`font-mono text-[7px] px-1.5 py-0.5 border ${hasGear1 ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-line text-dim'}`}>G1</span>
            <span className={`font-mono text-[7px] px-1.5 py-0.5 border ${hasGear2 ? 'border-sky-500/50 text-sky-400 bg-sky-500/10' : 'border-line text-dim'}`}>G2</span>
          </div>
        </div>

        <Selector
          options={simData.characters}
          selected={ch}
          onSelect={onCharChange}
          placeholder="— Select Character —"
          accentClass={ch ? '' : 'text-warn'}
          borderActiveClass="border-warn"
          getArt={c => c.art ? `/assets/characters/${c.art}.png` : null}
        />

        {ch && (
          <>
            {/* Character card: art + name + stats */}
            <div className="flex gap-3 items-start">
              <div
                className="w-16 h-16 shrink-0 border flex items-center justify-center overflow-hidden"
                style={{ borderColor: `${ch.factionColor}44`, background: `linear-gradient(135deg, ${ch.factionColor}20, #0b0d10)` }}
              >
                {ch.art
                  ? <img src={`/assets/characters/${ch.art}.png`} alt="" className="w-full h-full object-cover pixelated" />
                  : <span className="font-display text-3xl" style={{ color: `${ch.factionColor}88` }}>{ch.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="font-display text-xl text-ink tracking-wide overflow-hidden text-ellipsis whitespace-nowrap">{ch.name}</div>
                <div className="font-mono text-[8px] text-dim tracking-wide">{ch.className}</div>
                <div className="flex gap-1 flex-wrap">
                  <StatChip label="HP"  value={ch.statHp}      className="text-blood" />
                  <StatChip label="SPD" value={ch.statSpeed}   className="text-warn" />
                  <StatChip label="DEF" value={ch.statDefense} className="text-muted" />
                </div>
              </div>
            </div>

            {/* HP preview bar */}
            <SmootHpBar current={ch.statHp} max={ch.statHp} />

            {/* Gear panels side by side — each visually distinct */}
            <div className="flex gap-2 items-stretch">
              {([0, 1] as const).map(gi => (
                <GearSlotPanel
                  key={gi}
                  gearIdx={gi}
                  gearSlot={charSlot.gears[gi]}
                  gears={simData.gears}
                  skills={simData.skills}
                  onGearChange={gear => onGearChange(gi, gear)}
                  onSkillChange={(si, skill) => onSkillChange(gi, si, skill)}
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
    <div className="border border-blood/25 bg-bg flex flex-col overflow-hidden">
      {/* Blood accent strip */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blood/60 via-blood/20 to-transparent" />

      <div className="p-3 flex flex-col gap-2.5">
        {/* Slot header */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 border border-blood/60 rotate-45 shrink-0" />
          <span className="font-mono text-[8px] text-blood tracking-[0.15em] uppercase">Enemy {slotIdx + 1}</span>
          {en && (
            <span className="ml-auto font-mono text-[7px] text-dim border border-line px-1.5 py-0.5">{en.race}</span>
          )}
        </div>

        {/* Enemy portrait + picker */}
        {en && (
          <div className="flex gap-2.5 items-center">
            <div className="w-12 h-12 shrink-0 border border-blood/30 bg-blood/5 flex items-center justify-center overflow-hidden">
              {en.art
                ? <img src={`/assets/enemies/${en.art}.png`} alt="" className="w-full h-full object-contain pixelated" />
                : <span className="font-display text-2xl text-blood/50">{en.name.charAt(0)}</span>
              }
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="font-display text-lg text-ink tracking-wide overflow-hidden text-ellipsis whitespace-nowrap">{en.name}</div>
              <div className="font-mono text-[7px] text-dim">{en.type}</div>
            </div>
          </div>
        )}

        <Selector
          options={enemies}
          selected={en}
          onSelect={onEnemyChange}
          placeholder="— Select Enemy —"
          accentClass="text-blood"
          borderActiveClass="border-blood"
        />

        {en && (
          <>
            <div className="flex gap-1 flex-wrap">
              <StatChip label="HP"  value={en.statHp}    className="text-blood" />
              <StatChip label="ATK" value={en.statAtk}   className="text-blood" />
              <StatChip label="DEF" value={en.statDef}   className="text-muted" />
              <StatChip label="SPD" value={en.statSpeed} className="text-warn" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[7px] text-dim tracking-[0.2em] uppercase">Skills</span>
              {[0, 1, 2, 3].map(si => (
                <div key={si} className="flex items-center gap-1.5">
                  <span className="font-mono text-[7px] text-dim w-3 shrink-0">{si + 1}.</span>
                  <div className="flex-1">
                    <Selector
                      options={enemySkills}
                      selected={enemySlot.skills[si]}
                      onSelect={skill => onSkillChange(si, skill)}
                      placeholder="— No Skill —"
                      accentClass="text-blood"
                      borderActiveClass="border-blood"
                    />
                  </div>
                  {enemySlot.skills[si] && (
                    <span className="font-mono text-[8px] text-blood shrink-0">{enemySlot.skills[si]!.basePower}p</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
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
    slot.gears.forEach((gs, gi) => {
      if (!gs.gear) return
      gs.skills.forEach(sk => {
        if (!sk) return
        skills.push({ id: `${sk.id}-${gs.gear!.id}`, name: sk.name, basePower: sk.basePower, cost: sk.resourceCost, gearSlot: gi as 0 | 1 })
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
      gear1Name: slot.gears[0].gear?.name,
      gear2Name: slot.gears[1].gear?.name,
      gear1Resource: slot.gears[0].gear?.resourcePoolSize,
      gear2Resource: slot.gears[1].gear?.resourcePoolSize,
      gear1ResourceName: slot.gears[0].gear?.resourceName,
      gear2ResourceName: slot.gears[1].gear?.resourceName,
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
      factionColor: '#c53030',
      art: e.art,
      skills,
      slotIndex: si,
      waveIndex: waveIdx,
    }
  })
}

function calcDamage(attacker: CombatUnit, skill: CombatSkill, defender: CombatUnit) {
  const base = (attacker.atk + skill.basePower) - Math.floor(defender.def * 0.4)
  const dmg  = Math.max(1, Math.floor(base * (0.85 + Math.random() * 0.3)))
  const isCrit = Math.random() < 0.15
  return { dmg: isCrit ? Math.floor(dmg * 1.6) : dmg, isCrit }
}

// ── Enemy Battle Card — compact tile showing portrait + name + HP ──────────────

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
  const hpPct = Math.max(0, unit.hp / unit.maxHp)

  return (
    <div
      onClick={() => isTargetable && !isDead && onTargetClick?.()}
      className={[
        'relative flex flex-col overflow-hidden border-2 transition-all duration-200 select-none',
        isDead ? 'opacity-30 grayscale pointer-events-none' : '',
        isTargeted ? 'border-warn shadow-[0_0_20px_rgba(232,167,54,0.3)] bg-warn/5' : '',
        isActive && !isTargeted ? 'border-blood/70 bg-blood/5 shadow-[0_0_14px_rgba(197,48,48,0.25)]' : '',
        !isTargeted && !isActive ? 'border-lineStrong bg-bg2' : '',
        isTargetable && !isDead ? 'cursor-pointer hover:border-warn/60' : '',
      ].join(' ')}
    >
      {/* Top accent */}
      <div className={`h-0.5 w-full ${isTargeted ? 'bg-gradient-to-r from-warn via-warn/60 to-transparent' : isActive ? 'bg-gradient-to-r from-blood via-blood/40 to-transparent' : 'bg-gradient-to-r from-line to-transparent'}`} />

      {/* Portrait */}
      <div className={`relative w-full aspect-square overflow-hidden flex items-center justify-center bg-bg3 transition-all duration-200 ${isTargeted ? 'scale-[1.03]' : ''}`}>
        {unit.art
          ? <img src={`/assets/enemies/${unit.art}.png`} alt={unit.name} className="w-full h-full object-contain pixelated" />
          : <span className="font-display text-4xl text-blood/40">{unit.name.charAt(0)}</span>
        }
        {isActive && !isDead && (
          <div className="absolute inset-0 border-2 border-blood/40 animate-pulse pointer-events-none" />
        )}
        {isTargeted && !isDead && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[7px] text-warn tracking-widest bg-bg/80 px-1.5 py-0.5 border border-warn/40">
            ◆ TARGET
          </div>
        )}
      </div>

      {/* Name + stats */}
      <div className="px-2 pt-1.5 pb-1 flex flex-col gap-1">
        <div className={`font-display text-sm tracking-wide overflow-hidden text-ellipsis whitespace-nowrap text-center ${isActive ? 'text-bloodLight' : 'text-ink'}`}>
          {unit.name}
        </div>
        <div className="font-mono text-[7px] text-dim text-center tracking-wider">
          SPD {unit.speed} · ATK {unit.atk} · DEF {unit.def}
        </div>

        {/* HP bar */}
        <SmootHpBar current={unit.hp} max={unit.maxHp} />
      </div>

      {/* Target prompt */}
      {isTargetable && !isDead && !isTargeted && (
        <div className="px-2 pb-1.5">
          <div className="w-full font-mono text-[7px] text-dim text-center tracking-wide border border-dashed border-dim/40 py-0.5 hover:text-warn hover:border-warn/40 transition-colors">
            CLICK TO TARGET
          </div>
        </div>
      )}
    </div>
  )
}

// ── Player Battle Card — shows character + both gear resource bars ─────────────

function PlayerBattleCard({
  unit, isActive, pendingSkill,
}: {
  unit: CombatUnit
  isActive: boolean
  pendingSkill: CombatSkill | null
}) {
  const isDead = unit.hp <= 0

  return (
    <div
      className={[
        'relative flex flex-col gap-2 p-3 border-2 transition-all duration-200 flex-1',
        isDead ? 'opacity-30' : '',
        isActive ? 'bg-bg3 shadow-[0_0_16px_rgba(232,167,54,0.15)]' : 'bg-bg2 border-lineStrong',
      ].join(' ')}
      style={isActive ? { borderColor: unit.factionColor } : undefined}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: isActive ? `linear-gradient(90deg, ${unit.factionColor}, ${unit.factionColor}44, transparent)` : 'transparent' }}
      />

      {/* Art + name row */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-12 h-12 shrink-0 border flex items-center justify-center overflow-hidden transition-all"
          style={{
            borderColor: `${unit.factionColor}55`,
            background: `linear-gradient(135deg, ${unit.factionColor}15, #0b0d10)`,
            boxShadow: isActive ? `0 0 12px ${unit.factionColor}33` : 'none',
          }}
        >
          {unit.art
            ? <img src={`/assets/characters/${unit.art}.png`} alt={unit.name} className="w-full h-full object-cover pixelated" />
            : <span className="font-display text-2xl" style={{ color: `${unit.factionColor}77` }}>{unit.name.charAt(0)}</span>
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="font-display text-base text-ink tracking-wide overflow-hidden text-ellipsis whitespace-nowrap">
            {isDead ? '✕ ' : ''}{unit.name}
          </div>
          {isActive && !isDead && (
            <div className="font-mono text-[7px] text-warn tracking-[0.15em]">▶ YOUR TURN</div>
          )}
          {/* Gear badges */}
          <div className="flex gap-1">
            {unit.gear1Name && (
              <span className="font-mono text-[6px] px-1 py-0.5 border border-amber-500/30 text-amber-400/70 bg-amber-500/5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[60px]" title={unit.gear1Name}>
                {unit.gear1Name}
              </span>
            )}
            {unit.gear2Name && (
              <span className="font-mono text-[6px] px-1 py-0.5 border border-sky-500/30 text-sky-400/70 bg-sky-500/5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[60px]" title={unit.gear2Name}>
                {unit.gear2Name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HP bar */}
      <SmootHpBar current={unit.hp} max={unit.maxHp} />

      {/* Per-gear resource bars */}
      {unit.gear1Resource != null && unit.gear1Resource > 0 && (
        <ResourceBar
          current={unit.resource}
          max={unit.gear1Resource + (unit.gear2Resource ?? 0)}
          name={unit.gear1ResourceName ?? 'RES'}
          gearIdx={0}
        />
      )}

      {/* Selected skill indicator */}
      {pendingSkill && isActive && (
        <div
          className="px-2 py-1 border font-mono text-[8px] tracking-wide"
          style={{ borderColor: `${unit.factionColor}44`, background: `${unit.factionColor}10`, color: unit.factionColor }}
        >
          ▶ {pendingSkill.name}
        </div>
      )}
    </div>
  )
}

// ── Turn order strip ───────────────────────────────────────────────────────────

function TurnStrip({ units, currentIdx }: { units: CombatUnit[]; currentIdx: number }) {
  return (
    <div className="flex items-center gap-0 bg-bg2 border-b border-line px-3.5 py-1.5">
      <span className="font-mono text-[7px] text-dim tracking-[0.2em] uppercase mr-3 shrink-0">ORDER</span>
      <div className="flex gap-1 overflow-x-auto flex-1 items-center">
        {units.map((u, i) => {
          const isNow  = i === currentIdx
          const isDead = u.hp <= 0
          return (
            <div key={`${u.id}-${i}`} className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={`w-8 h-8 border-2 flex items-center justify-center overflow-hidden transition-all duration-200 ${isDead ? 'opacity-25' : ''}`}
                style={{
                  borderColor: isNow ? u.factionColor : isDead ? '#24282f' : `${u.factionColor}44`,
                  background:  isNow ? `${u.factionColor}22` : '#0b0d10',
                  boxShadow:   isNow ? `0 0 10px ${u.factionColor}66` : 'none',
                }}
              >
                {u.art
                  ? <img src={`/assets/${u.isEnemy ? 'enemies' : 'characters'}/${u.art}.png`} alt="" className="w-full h-full object-cover pixelated" />
                  : <span className="font-display text-sm" style={{ color: `${u.factionColor}88` }}>{u.name.charAt(0)}</span>
                }
              </div>
              {isNow && <div className="w-1 h-1 bg-warn rounded-full" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Combat Log ─────────────────────────────────────────────────────────────────

const LOG_TEXT_CLASS: Record<CombatLogEntry['type'], string> = {
  action:  'text-warn',
  damage:  'text-blood',
  miss:    'text-dim',
  crit:    'text-bloodLight',
  info:    'text-success',
  wave:    'text-purple-400',
  victory: 'text-success',
  defeat:  'text-blood',
}

function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries])

  return (
    <div className="border border-lineStrong bg-bg flex flex-col h-full">
      <div className="px-3 py-2 border-b border-line font-mono text-[7px] tracking-[0.25em] text-dim uppercase bg-bg2 shrink-0">
        ◉ Combat Log
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-1">
        {entries.length === 0
          ? <div className="font-mono text-[9px] text-dim text-center mt-10">Awaiting combat...</div>
          : entries.map((e, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="font-mono text-[7px] text-dim shrink-0 pt-px min-w-[22px]">T{e.turn}</span>
              <span className={`font-mono text-[10px] ${LOG_TEXT_CLASS[e.type]} leading-relaxed`}>{e.text}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ── Skill Panel — grouped by gear ─────────────────────────────────────────────

function SkillPanel({
  unit, pendingSkill, onPickSkill, canExecute, onExecute,
}: {
  unit: CombatUnit
  pendingSkill: CombatSkill | null
  onPickSkill: (sk: CombatSkill) => void
  canExecute: boolean
  onExecute: () => void
}) {
  // Group skills by gear slot
  const gear1Skills = unit.skills.filter(s => s.gearSlot === 0)
  const gear2Skills = unit.skills.filter(s => s.gearSlot === 1)
  const ungrouped   = unit.skills.filter(s => s.gearSlot === undefined)

  function SkillButton({ sk, gearIdx }: { sk: CombatSkill; gearIdx?: 0 | 1 }) {
    const isPicked   = pendingSkill?.id === sk.id
    const canAfford  = unit.maxResource === 0 || unit.resource >= sk.cost
    const labelClass = gearIdx !== undefined ? GEAR_LABEL_CLASS[gearIdx] : 'text-warn'
    const activeClass = gearIdx !== undefined ? GEAR_SKILL_ACTIVE[gearIdx] : 'border-warn bg-warn/10 text-warn'
    const hoverClass  = gearIdx !== undefined ? GEAR_SKILL_HOVER[gearIdx] : 'hover:border-warn/60'

    return (
      <button
        onClick={() => canAfford && onPickSkill(sk)}
        disabled={!canAfford}
        className={[
          'px-3 py-2 border text-left flex flex-col gap-0.5 transition-all duration-100',
          isPicked ? activeClass : `border-line bg-bg text-ink ${hoverClass}`,
          canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-35',
        ].join(' ')}
      >
        <span className="font-display text-sm tracking-wide">{sk.name}</span>
        <span className={`font-mono text-[7px] ${isPicked ? '' : labelClass}`}>
          PWR {sk.basePower}{sk.cost > 0 ? ` · ${sk.cost}${unit.resourceName.charAt(0)}` : ''}
        </span>
      </button>
    )
  }

  return (
    <div className="p-3 flex flex-col gap-2.5 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-[8px] text-dim tracking-[0.2em] uppercase">What will {unit.name} do?</span>
        <button
          onClick={onExecute}
          disabled={!canExecute}
          className={`px-5 py-1.5 font-display text-base tracking-wider transition-all duration-150 border ${
            canExecute
              ? 'bg-warn text-bg border-warn cursor-pointer hover:shadow-[0_0_14px_rgba(232,167,54,0.4)]'
              : 'bg-bg border-line text-dim cursor-not-allowed'
          }`}
        >
          FIGHT
        </button>
      </div>

      {/* Gear-grouped skill sections */}
      <div className="flex gap-3 flex-1">
        {/* Gear 1 skills */}
        {gear1Skills.length > 0 && (
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 border border-amber-400/60 rotate-45" />
              <span className="font-mono text-[7px] text-amber-400/80 tracking-[0.2em] uppercase">
                {unit.gear1Name ?? 'Gear 1'}
              </span>
              {unit.gear1Resource != null && unit.gear1Resource > 0 && (
                <span className="ml-auto font-mono text-[7px] text-amber-300 border border-amber-500/20 px-1">
                  {unit.resource}/{unit.gear1Resource} {unit.gear1ResourceName}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {gear1Skills.map(sk => <SkillButton key={sk.id} sk={sk} gearIdx={0} />)}
            </div>
          </div>
        )}

        {/* Gear 2 skills */}
        {gear2Skills.length > 0 && (
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 border border-sky-400/60 rotate-45" />
              <span className="font-mono text-[7px] text-sky-400/80 tracking-[0.2em] uppercase">
                {unit.gear2Name ?? 'Gear 2'}
              </span>
              {unit.gear2Resource != null && unit.gear2Resource > 0 && (
                <span className="ml-auto font-mono text-[7px] text-sky-300 border border-sky-500/20 px-1">
                  {unit.resource}/{unit.gear2Resource} {unit.gear2ResourceName}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {gear2Skills.map(sk => <SkillButton key={sk.id} sk={sk} gearIdx={1} />)}
            </div>
          </div>
        )}

        {/* Ungrouped fallback */}
        {ungrouped.length > 0 && (
          <div className="flex-1 grid grid-cols-2 gap-1.5 content-start">
            {ungrouped.map(sk => <SkillButton key={sk.id} sk={sk} />)}
          </div>
        )}

        {unit.skills.length === 0 && (
          <div className="flex-1 flex items-center justify-center border border-dashed border-line">
            <span className="font-mono text-[9px] text-dim">No skills equipped</span>
          </div>
        )}
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
    <div className="py-16 text-center font-mono text-[10px] text-dim tracking-[0.2em]">▶▶ LOADING SIM DATA...</div>
  )
  if (!simData) return (
    <div className="py-10 text-center font-mono text-[10px] text-blood">⚠ Failed to load simulator data.</div>
  )

  const canStart = config.charSlots.some(cs => cs.character !== null) &&
    config.waves.some(wave => wave.slots.some(es => es.enemy !== null))

  return (
    <div className="flex flex-col gap-7">

      {/* Player Roster */}
      <div>
        <SectionHead label="Player Roster — 3 Character Slots" />
        <div className="grid grid-cols-3 gap-4 min-w-0" style={{ gridTemplateColumns: 'repeat(3, minmax(300px, 1fr))' }}>
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

      {/* Enemy Configuration */}
      <div>
        <SectionHead label="Enemy Configuration" />

        <div className="flex gap-6 mb-3 items-center">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[9px] text-dim tracking-[0.2em]">SLOTS PER WAVE:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => updateEnemySlotCount(n)}
                  className={`w-7 h-7 font-mono text-[11px] border transition-all duration-100 cursor-pointer ${
                    config.enemySlotCount === n
                      ? 'bg-blood border-blood text-ink'
                      : 'bg-bg2 border-line text-dim hover:border-blood/50 hover:text-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[9px] text-dim tracking-[0.2em]">WAVES:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => updateWaveCount(n)}
                  className={`w-7 h-7 font-mono text-[11px] border transition-all duration-100 cursor-pointer ${
                    config.waveCount === n
                      ? 'bg-blood border-blood text-ink'
                      : 'bg-bg2 border-line text-dim hover:border-blood/50 hover:text-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {config.waveCount > 1 && (
          <div className="flex gap-1 mb-2.5">
            {Array.from({ length: config.waveCount }).map((_, wi) => (
              <button
                key={wi}
                onClick={() => setActiveWave(wi)}
                className={`px-3.5 py-1 font-mono text-[9px] tracking-[0.15em] border transition-all cursor-pointer ${
                  activeWave === wi
                    ? 'bg-blood/20 border-blood text-blood'
                    : 'bg-bg2 border-line text-dim hover:border-blood/40'
                }`}
              >
                WAVE {wi + 1}
              </button>
            ))}
          </div>
        )}

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${config.enemySlotCount}, minmax(200px, 1fr))` }}
        >
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
      <div className="flex justify-end items-center gap-3 pt-2 border-t border-line">
        {!canStart && (
          <span className="font-mono text-[8px] text-dim">Need ≥1 character and ≥1 enemy</span>
        )}
        <button
          onClick={() => canStart && onStart(config)}
          disabled={!canStart}
          className={`px-9 py-3 font-display text-2xl tracking-wider border transition-all duration-150 ${
            canStart
              ? 'bg-warn text-bg border-warn cursor-pointer hover:shadow-[0_0_24px_rgba(232,167,54,0.4)]'
              : 'bg-bg2 text-dim border-line cursor-not-allowed'
          }`}
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
  const [pendingSkill, setPendingSkill] = useState<CombatSkill | null>(null)
  const [targetId, setTargetId]   = useState<string | null>(null)
  const [log, setLog]             = useState<CombatLogEntry[]>([
    { turn: 0, text: 'Wave 1 begins.', type: 'wave' },
  ])
  const resolving = useRef(false)

  const pushLog = useCallback((text: string, type: CombatLogEntry['type'], t: number) => {
    setLog(prev => [...prev, { turn: t, text, type }])
  }, [])

  const buildOrder = useCallback((p: CombatUnit[], e: CombatUnit[]) =>
    [...p.filter(u => u.hp > 0), ...e.filter(u => u.hp > 0)]
      .sort((a, b) => b.speed - a.speed)
  , [])

  useEffect(() => {
    if (turnOrder.length === 0) {
      setTurnOrder(buildOrder(players, enemies))
      setActorIdx(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentActor = turnOrder[actorIdx] ?? null
  const isPlayerTurn = currentActor !== null && !currentActor.isEnemy

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

    const pool   = currentActor.isEnemy ? pState.filter(u => u.hp > 0) : eState.filter(u => u.hp > 0)
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
  const lastLog = log[log.length - 1]
  const activePlayer = isPlayerTurn && currentActor ? players.find(p => p.id === currentActor.id) ?? null : null

  return (
    <div className="flex flex-col bg-bg border border-lineStrong">

      {/* Top bar */}
      <div className="flex justify-between items-center px-3.5 py-2 bg-bg2 border-b border-line">
        <div className="flex gap-4 items-center">
          <span className="font-display text-2xl tracking-wider text-warn">
            WAVE {currentWave + 1}/{config.waveCount}
          </span>
          <span className="font-mono text-[8px] text-dim tracking-[0.2em]">T{turn}</span>
          {(phase === 'victory' || phase === 'defeat') && (
            <span className={`font-display text-2xl tracking-wider ${phase === 'victory' ? 'text-success' : 'text-blood'}`}>
              {phase === 'victory' ? '★ VICTORY' : '✕ DEFEAT'}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onRetry}
            className="px-3.5 py-1.5 bg-bg border border-lineStrong text-muted font-mono text-[8px] tracking-wide cursor-pointer hover:border-warn hover:text-warn transition-all"
          >
            ↩ RETRY
          </button>
          <button
            onClick={onReset}
            className="px-3.5 py-1.5 bg-bg border border-blood/40 text-blood font-mono text-[8px] tracking-wide cursor-pointer hover:bg-blood/10 transition-all opacity-70 hover:opacity-100"
          >
            ✕ RESET
          </button>
        </div>
      </div>

      {/* Turn order */}
      <TurnStrip units={turnOrder} currentIdx={actorIdx} />

      {/* ── Arena ── */}
      <div className="relative flex flex-col gap-0 border-b border-line overflow-hidden" style={{ background: 'linear-gradient(180deg, #0c0e14 0%, #080a0e 55%, #0e1018 55%, #0a0c10 100%)' }}>
        {/* Ground line */}
        <div className="absolute left-0 right-0 top-[55%] h-px bg-line" />

        {/* Enemy row — cards at top */}
        <div className="relative z-10 px-4 pt-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 border border-blood/50 rotate-45" />
            <span className="font-mono text-[7px] text-blood/60 tracking-[0.3em] uppercase">Enemy Force</span>
            <div className="flex-1 h-px bg-blood/10" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {enemies.map(u => (
              <div key={u.id} className="w-36">
                <EnemyBattleCard
                  unit={u}
                  isTargetable={isPlayerTurn && phase === 'select' && u.hp > 0}
                  isTargeted={targetId === u.id}
                  isActive={currentActor?.id === u.id && currentActor.isEnemy}
                  onTargetClick={() => { setTargetId(u.id); pushLog(`${u.name} targeted.`, 'info', turn) }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Player row — cards at bottom */}
        <div className="relative z-10 px-4 pt-8 pb-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 border border-warn/50 rotate-45" />
            <span className="font-mono text-[7px] text-warn/60 tracking-[0.3em] uppercase">Your Squad</span>
            <div className="flex-1 h-px bg-warn/10" />
          </div>
          <div className="flex gap-3">
            {players.map(u => (
              <PlayerBattleCard
                key={u.id}
                unit={u}
                isActive={currentActor?.id === u.id && !currentActor.isEnemy}
                pendingSkill={currentActor?.id === u.id ? pendingSkill : null}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom dock ── */}
      <div className="grid grid-cols-2 min-h-[160px]">

        {/* Dialog box */}
        <div className="border-r border-t border-line px-5 py-4 flex flex-col justify-between bg-bg">
          <div>
            {lastLog && (
              <p className="font-mono text-[13px] text-ink leading-relaxed m-0">{lastLog.text}</p>
            )}
          </div>
          <div className="flex justify-between items-center mt-2.5">
            {phase === 'select' && isPlayerTurn && currentActor && (
              <span className="font-mono text-[8px] text-dim tracking-wide">
                <span style={{ color: currentActor.factionColor }}>{currentActor.name}</span>
                {pendingSkill && <span className="text-warn"> · {pendingSkill.name}</span>}
                {targetId && <span className="text-warn"> → {enemies.find(e => e.id === targetId)?.name ?? '?'}</span>}
              </span>
            )}
            {phase === 'select' && !isPlayerTurn && currentActor && (
              <span className="font-mono text-[8px] text-dim">
                <span className="text-blood">{currentActor.name}</span> is acting...
              </span>
            )}
            {phase === 'resolving' && (
              <span className="font-mono text-[8px] text-dim tracking-[0.2em]">▶▶</span>
            )}
            {(phase === 'victory' || phase === 'defeat') && <span />}
            <span className="font-mono text-[10px] text-dim">▼</span>
          </div>
        </div>

        {/* Skill panel / Log */}
        <div className="border-t border-line bg-bg2">
          {phase === 'select' && activePlayer && activePlayer.hp > 0
            ? (
              <SkillPanel
                unit={activePlayer}
                pendingSkill={pendingSkill}
                onPickSkill={setPendingSkill}
                canExecute={canExecute}
                onExecute={() => canExecute && doResolve(pendingSkill!, targetId)}
              />
            )
            : <CombatLog entries={log} />
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
