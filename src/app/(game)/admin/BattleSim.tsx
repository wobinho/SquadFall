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
  slotLabel, gearSlot, gears, skills, onGearChange, onSkillChange, accent, gearIndex,
}: {
  slotLabel: string
  gearSlot: GearSlot
  gears: SimGear[]
  skills: SimSkill[]
  onGearChange: (gear: SimGear | null) => void
  onSkillChange: (skillIdx: number, skill: SimSkill | null) => void
  accent: string
  gearIndex: 0 | 1
}) {
  const g = gearSlot.gear
  const gearBorderColor = gearIndex === 0 ? 'border-l-green-500' : 'border-l-purple-500'
  const gearLabelColor = gearIndex === 0 ? 'text-green-500' : 'text-purple-400'
  return (
    <div className={`flex-1 border border-zinc-700 rounded-sm p-3 bg-zinc-900/50 flex flex-col gap-2 border-l-4 ${gearBorderColor} relative`}>
      {/* Gear label indicator */}
      <span className={`absolute top-2 right-2 text-xs font-bold tracking-widest uppercase opacity-60 ${gearLabelColor}`}>
        {gearIndex === 0 ? 'Gear 1' : 'Gear 2'}
      </span>

      {/* gear picker */}
      <Selector
        options={gears}
        selected={g}
        onSelect={onGearChange}
        placeholder="— No Gear —"
        accent={accent}
        getArt={item => item.art ? `/assets/gears/${item.art}.png` : null}
      />

      {/* gear stats + resource pool — only shown when a gear is selected */}
      {g && (
        <>
          <div className="flex gap-2 flex-wrap">
            <div className="bg-zinc-900 border border-yellow-600/20 px-2 py-1">
              <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">ATK</span>
              <span className="font-['Bebas_Neue'] text-base text-yellow-600 block">{g.statAttack}</span>
            </div>
            {g.resourcePoolSize > 0 && (
              <div className="bg-zinc-900 border border-yellow-600/20 px-2 py-1">
                <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">{g.resourceName}</span>
                <span className="font-['Bebas_Neue'] text-base text-yellow-500 block">{g.resourcePoolSize}</span>
              </div>
            )}
            {g.critChance > 0 && (
              <div className="bg-zinc-900 border border-red-600/20 px-2 py-1">
                <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">CRIT</span>
                <span className="font-['Bebas_Neue'] text-base text-red-500 block">{g.critChance}%</span>
              </div>
            )}
          </div>

          {/* resource pool indicator */}
          {g.resourcePoolSize > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase py-1 px-2 border border-yellow-600/30 bg-yellow-900/20 rounded">
              <span>{g.resourceName}:</span>
              <div className="flex-1 h-1.5 bg-zinc-800 border border-zinc-700 relative rounded-sm overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-600/60 w-full transition-all duration-500" />
              </div>
              <span>{g.resourcePoolSize}</span>
            </div>
          )}
        </>
      )}

      {/* skill slots — always 3, disabled when no gear */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">Skills</span>
        {[0, 1, 2].map(si => (
          <div key={si} className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-500 w-4">{si + 1}.</span>
            <div className="flex-1">
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
              <span className="text-xs font-mono tracking-widest uppercase text-yellow-500 flex-shrink-0">
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
  slotIdx, charSlot, simData, onCharChange, onGearChange, onSkillChange, onRandomize,
}: {
  slotIdx: number
  charSlot: CharSlot
  simData: SimData
  onCharChange: (c: SimCharacter | null) => void
  onGearChange: (gearIdx: 0 | 1, gear: SimGear | null) => void
  onSkillChange: (gearIdx: 0 | 1, skillIdx: number, skill: SimSkill | null) => void
  onRandomize?: () => void
}) {
  const fc  = charSlot.character?.factionColor ?? C.lineStr
  const ch  = charSlot.character

  return (
    <div className="char-card relative overflow-hidden border border-zinc-700 bg-zinc-900 hover:border-yellow-600/50 transition-all duration-200">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-600 via-yellow-600/20 to-transparent" />

      <div className="p-3.5 flex flex-col gap-3">

        {/* slot label + faction + randomize button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-['Bebas_Neue'] text-lg text-zinc-500 tracking-wide">SLOT {slotIdx + 1}</span>
            {ch && (
              <span className="text-xs font-mono tracking-widest uppercase text-yellow-600">
                {ch.factionName}
              </span>
            )}
          </div>
          {onRandomize && (
            <button
              onClick={onRandomize}
              className="px-2 py-1 text-xs font-mono font-semibold tracking-widest uppercase border border-yellow-600/40 bg-yellow-900/10 text-yellow-600 rounded hover:bg-yellow-900/20 hover:border-yellow-500 transition-all duration-150 active:scale-90"
              title="Randomize this character slot"
            >
              🎲 RND
            </button>
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
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-yellow-600/10 to-zinc-800 border border-yellow-600/20 flex items-center justify-center rounded-sm overflow-hidden">
                {ch.art
                  ? <img src={`/assets/characters/${ch.art}.png`} alt="" className="w-full h-full object-cover" />
                  : <span className="font-['Bebas_Neue'] text-2xl text-yellow-600/50">{ch.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="font-['Bebas_Neue'] text-xl text-white tracking-wide overflow-hidden text-ellipsis whitespace-nowrap">
                  {ch.name}
                </div>
                <div className="text-xs font-mono tracking-widest uppercase text-zinc-500">{ch.className}</div>
                <div className="flex gap-1 flex-wrap">
                  <StatPill label="HP"  value={ch.statHp}      color={C.blood} />
                  <StatPill label="SPD" value={ch.statSpeed}   color="#e8a736" />
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
                  gearIndex={gi}
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
  slotIdx, enemySlot, enemies, enemySkills, onEnemyChange, onSkillChange, onRandomize,
}: {
  slotIdx: number
  enemySlot: EnemySlot
  enemies: SimEnemy[]
  enemySkills: SimEnemySkill[]
  onEnemyChange: (e: SimEnemy | null) => void
  onSkillChange: (si: number, skill: SimEnemySkill | null) => void
  onRandomize?: () => void
}) {
  const en = enemySlot.enemy
  return (
    <div style={{ border: `1px solid ${C.blood}33`, background: C.bg, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '3px', height: '3px', background: C.blood, transform: 'rotate(45deg)' }} />
          <span style={{ fontFamily: MONO, fontSize: '8px', color: C.blood, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Enemy {slotIdx + 1}</span>
        </div>
        {onRandomize && (
          <button
            onClick={onRandomize}
            style={{
              padding: '3px 6px',
              fontSize: '9px',
              fontFamily: MONO,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: `1px solid ${C.blood}40`,
              background: `${C.blood}0a`,
              color: C.blood,
              borderRadius: '2px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${C.blood}15`
              e.currentTarget.style.borderColor = `${C.blood}80`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${C.blood}0a`
              e.currentTarget.style.borderColor = `${C.blood}40`
            }}
            title="Randomize this enemy slot"
          >
            🎲 RND
          </button>
        )}
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

// ── Poke HP Box (compact HP display) ───────────────────────────────────────────

function PokeHpBox({
  unit, isTargetable, isTargeted, isActive, onTargetClick,
}: {
  unit: CombatUnit
  isTargetable: boolean
  isTargeted: boolean
  isActive: boolean
  onTargetClick?: () => void
}) {
  const isDead = unit.hp <= 0
  return (
    <div
      onClick={() => isTargetable && !isDead && onTargetClick?.()}
      className={`flex flex-col gap-1 p-2 rounded-sm border transition-all duration-200 ${isTargeted ? 'border-yellow-500 bg-yellow-500/10' : isActive ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-900'} ${isDead ? 'opacity-30' : ''} ${isTargetable && !isDead ? 'cursor-pointer' : ''}`}
    >
      <div className="text-xs font-mono text-zinc-300 truncate">{unit.name}</div>
      <SmootHpBar current={unit.hp} max={unit.maxHp} color={unit.hp > unit.maxHp * 0.5 ? C.green : unit.hp > unit.maxHp * 0.2 ? C.gold : C.blood} />
    </div>
  )
}

// ── Arena Battler (sprite display) ────────────────────────────────────────────

function ArenaBattler({
  unit, side, isActive, isTargetable, isTargeted, onTargetClick,
}: {
  unit: CombatUnit
  side: 'front' | 'back'
  isActive: boolean
  isTargetable: boolean
  isTargeted: boolean
  onTargetClick?: () => void
}) {
  const isDead = unit.hp <= 0
  return (
    <div
      onClick={() => isTargetable && !isDead && onTargetClick?.()}
      className={`flex flex-col items-center transition-all duration-200 ${isDead ? 'opacity-25' : ''} ${isTargetable && !isDead ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-20 h-20 flex items-center justify-center overflow-hidden rounded-sm border border-zinc-700 bg-zinc-900 ${isTargeted ? 'drop-shadow-lg drop-shadow-yellow-500/50 scale-110' : isActive ? 'drop-shadow-lg drop-shadow-yellow-500/40' : ''} transition-all duration-200`}>
        {unit.art
          ? <img src={`/assets/enemies/${unit.art}.png`} alt={unit.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          : <span className="font-['Bebas_Neue'] text-2xl text-yellow-600/50">{unit.name.charAt(0)}</span>
        }
      </div>
      <span className="text-xs font-mono text-zinc-500 mt-1">{unit.name.slice(0, 10)}</span>
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
  const hpPct = Math.max(0, unit.hp / unit.maxHp)
  const hpColor = hpPct > 0.5 ? C.green : hpPct > 0.2 ? C.gold : C.blood

  const borderClass = isTargeted ? 'border-yellow-500 shadow-lg shadow-yellow-500/30'
    : isActive ? 'border-red-500 shadow-lg shadow-red-500/30'
    : 'border-red-900/50 hover:border-red-500/70'

  const bgClass = isTargeted ? 'bg-yellow-500/10'
    : isActive ? 'bg-red-950/30'
    : 'bg-red-950/10 hover:bg-red-950/20'

  return (
    <div
      onClick={() => isTargetable && !isDead && onTargetClick?.()}
      className={`relative overflow-hidden flex flex-col items-center gap-3 p-3 rounded-md transition-all duration-200 ${borderClass} ${bgClass} ${isDead ? 'opacity-35' : ''} border-2 ${isTargetable && !isDead ? 'cursor-pointer' : ''}`}
    >
      {/* top accent gradient */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${isTargeted ? 'bg-yellow-500' : isActive ? 'bg-red-500' : 'bg-red-900'}`} />

      {/* art — large, centered */}
      <div className={`w-24 h-24 flex items-center justify-center overflow-hidden rounded-sm border border-zinc-700 bg-zinc-900 ${isDead ? 'grayscale opacity-30' : isTargeted ? 'drop-shadow-lg drop-shadow-yellow-500/50 scale-110' : isActive ? 'drop-shadow-lg drop-shadow-red-500/40' : ''} transition-all duration-200`}>
        {unit.art
          ? <img src={`/assets/enemies/${unit.art}.png`} alt={unit.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
          : <span className="font-['Bebas_Neue'] text-4xl text-red-600/50">{unit.name.charAt(0)}</span>
        }
      </div>

      {/* name + stats */}
      <div className="w-full text-center">
        <div className={`font-['Bebas_Neue'] text-sm tracking-wide overflow-hidden text-ellipsis whitespace-nowrap ${isDead ? 'text-zinc-500' : isActive ? 'text-red-400' : 'text-white'}`}>
          {isDead ? '✕ ' : ''}{unit.name}
        </div>
        <div className="text-xs font-mono tracking-widest text-zinc-500 mt-0.5">
          SPD {unit.speed} · ATK {unit.atk} · DEF {unit.def}
        </div>
      </div>

      {/* HP bar */}
      <div className="w-full">
        <SmootHpBar current={unit.hp} max={unit.maxHp} color={hpColor} />
      </div>

      {/* target cue */}
      {isTargetable && !isDead && (
        <div className="text-xs font-mono tracking-widest text-yellow-600 py-1 px-2 border border-dashed border-yellow-600/50 bg-yellow-900/20 rounded">
          ◆ CLICK TO TARGET
        </div>
      )}
      {isTargeted && !isTargetable && (
        <div className="text-xs font-mono tracking-widest text-yellow-600">▶ TARGETED</div>
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

  function randomizeCharSlot(si: number) {
    if (!simData) return
    const randomChar = simData.characters[Math.floor(Math.random() * simData.characters.length)]
    const randomGear1 = simData.gears[Math.floor(Math.random() * simData.gears.length)]
    const randomGear2 = simData.gears[Math.floor(Math.random() * simData.gears.length)]

    updateCharSlot(si, slot => ({
      ...slot,
      character: randomChar,
      gears: [
        {
          gear: randomGear1,
          skills: [
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
          ]
        },
        {
          gear: randomGear2,
          skills: [
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
            simData.skills[Math.floor(Math.random() * simData.skills.length)] || null,
          ]
        }
      ]
    }))
  }

  function randomizeEnemySlot(waveIdx: number, slotIdx: number) {
    if (!simData) return
    const randomEnemy = simData.enemies[Math.floor(Math.random() * simData.enemies.length)]
    updateEnemySlot(waveIdx, slotIdx, slot => ({
      ...slot,
      enemy: randomEnemy,
      skills: [
        simData.enemySkills[Math.floor(Math.random() * simData.enemySkills.length)] || null,
        simData.enemySkills[Math.floor(Math.random() * simData.enemySkills.length)] || null,
        simData.enemySkills[Math.floor(Math.random() * simData.enemySkills.length)] || null,
        simData.enemySkills[Math.floor(Math.random() * simData.enemySkills.length)] || null,
      ]
    }))
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <SectionHead label="Player Roster — 3 Character Slots" />
          <button
            onClick={() => {
              randomizeCharSlot(0)
              randomizeCharSlot(1)
              randomizeCharSlot(2)
            }}
            className="px-3 py-1.5 border border-yellow-600 bg-yellow-900/10 text-yellow-600 text-sm font-mono font-semibold tracking-widest uppercase rounded hover:bg-yellow-900/20 hover:border-yellow-500 transition-all duration-200 active:scale-95"
          >
            🎲 Randomize All
          </button>
        </div>
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
              onRandomize={() => randomizeCharSlot(si)}
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
              onRandomize={() => randomizeEnemySlot(activeWave, si)}
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

      {/* ── Game Board: Hearthstone/Shadowverse Style ── */}
      <div className="flex flex-col flex-1 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 overflow-hidden">

        {/* ── Opponent's Board (Top) ── */}
        <div className="flex-1 flex flex-col p-6 border-b border-zinc-800 bg-gradient-to-b from-red-950/20 to-transparent">
          <div className="text-xs font-mono tracking-widest uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            Opponent's Field
          </div>

          {/* Enemy Cards Grid */}
          <div className="flex gap-4 justify-center flex-wrap items-start flex-1">
            {enemies.length === 0 ? (
              <div className="text-zinc-600 text-sm font-mono">No enemies</div>
            ) : (
              enemies.map(u => {
                const isDead = u.hp <= 0
                const hpPct = Math.max(0, u.hp / u.maxHp)
                const hpColor = hpPct > 0.5 ? '#6b8a3a' : hpPct > 0.2 ? '#e8a736' : '#c53030'
                const isTargeted = targetId === u.id
                const isActive = currentActor?.id === u.id && currentActor.isEnemy

                return (
                  <div
                    key={u.id}
                    onClick={() => isPlayerTurn && phase === 'select' && u.hp > 0 && setTargetId(u.id)}
                    className={`flex flex-col w-28 rounded-lg border-2 transition-all duration-200 cursor-pointer relative overflow-hidden shadow-lg ${
                      isTargeted ? 'border-yellow-500 shadow-yellow-500/40 bg-yellow-500/5 scale-105' :
                      isActive ? 'border-red-500 shadow-red-500/40 bg-red-500/5' :
                      isDead ? 'border-zinc-700 opacity-25 bg-zinc-900' :
                      'border-red-900/40 hover:border-red-600/60 bg-red-950/10 hover:bg-red-950/20'
                    }`}
                  >
                    {/* Top Accent */}
                    <div className={`h-1 ${isTargeted ? 'bg-yellow-500' : isActive ? 'bg-red-500' : 'bg-red-900/50'}`} />

                    {/* Card Body */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      {/* Art */}
                      <div className="w-full h-20 bg-gradient-to-br from-red-900/20 to-zinc-900 border border-red-900/30 rounded-md flex items-center justify-center overflow-hidden">
                        {u.art ? (
                          <img src={`/assets/enemies/${u.art}.png`} alt={u.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="font-['Bebas_Neue'] text-3xl text-red-600/50">{u.name.charAt(0)}</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className={`text-xs font-['Bebas_Neue'] tracking-wide truncate text-center ${isDead ? 'text-zinc-600' : 'text-white'}`}>
                        {u.name}
                      </div>

                      {/* Stats Row */}
                      <div className="text-xs font-mono text-zinc-500 text-center">
                        <span className="text-red-500 font-bold">{u.atk}A</span>
                        <span className="mx-1">·</span>
                        <span className="text-zinc-400">{u.def}D</span>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-3 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${hpPct * 100}%`,
                            background: hpColor,
                            boxShadow: `0 0 8px ${hpColor}44`
                          }}
                        />
                      </div>

                      {/* HP Text */}
                      <div className="text-xs font-mono text-center text-zinc-400">
                        <span style={{ color: hpColor }} className="font-bold">{u.hp}</span>/<span className="text-zinc-500">{u.maxHp}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Center: Player's Field (Bottom) ── */}
        <div className="flex-1 flex flex-col p-6 bg-gradient-to-b from-transparent to-green-950/10">
          <div className="text-xs font-mono tracking-widest uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
            Your Field
          </div>

          {/* Player Cards Grid */}
          <div className="flex gap-4 justify-center flex-wrap items-end flex-1">
            {players.length === 0 ? (
              <div className="text-zinc-600 text-sm font-mono">No characters</div>
            ) : (
              players.map(u => {
                const isDead = u.hp <= 0
                const hpPct = Math.max(0, u.hp / u.maxHp)
                const hpColor = hpPct > 0.5 ? '#6b8a3a' : hpPct > 0.2 ? '#e8a736' : '#c53030'
                const isActive = currentActor?.id === u.id && !currentActor.isEnemy
                const fc = u.factionColor

                return (
                  <div
                    key={u.id}
                    className={`flex flex-col w-28 rounded-lg border-2 transition-all duration-200 relative overflow-hidden shadow-lg ${
                      isActive ? `border-yellow-500 shadow-lg shadow-yellow-500/40 bg-yellow-500/5 scale-105` :
                      isDead ? 'border-zinc-700 opacity-25 bg-zinc-900' :
                      'border-emerald-900/40 hover:border-emerald-600/60 bg-emerald-950/10 hover:bg-emerald-950/20'
                    }`}
                  >
                    {/* Top Accent with Faction Color */}
                    <div className="h-1" style={{ background: isActive ? '#e8a736' : fc }} />

                    {/* Card Body */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      {/* Art */}
                      <div className="w-full h-20 border border-emerald-900/30 rounded-md flex items-center justify-center overflow-hidden" style={{ background: `${fc}10` }}>
                        {u.art ? (
                          <img src={`/assets/characters/${u.art}.png`} alt={u.name} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <span className="font-['Bebas_Neue'] text-3xl opacity-50">{u.name.charAt(0)}</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className={`text-xs font-['Bebas_Neue'] tracking-wide truncate text-center ${isDead ? 'text-zinc-600' : 'text-white'}`}>
                        {u.name}
                      </div>

                      {/* Stats Row */}
                      <div className="text-xs font-mono text-zinc-500 text-center">
                        <span style={{ color: fc }} className="font-bold">{u.atk}A</span>
                        <span className="mx-1">·</span>
                        <span className="text-zinc-400">{u.def}D</span>
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-3 bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${hpPct * 100}%`,
                            background: hpColor,
                            boxShadow: `0 0 8px ${hpColor}44`
                          }}
                        />
                      </div>

                      {/* HP Text */}
                      <div className="text-xs font-mono text-center text-zinc-400">
                        <span style={{ color: hpColor }} className="font-bold">{u.hp}</span>/<span className="text-zinc-500">{u.maxHp}</span>
                      </div>

                      {/* Resource (if applicable) */}
                      {u.maxResource > 0 && (
                        <div className="text-xs font-mono text-center mt-1 pt-1 border-t border-zinc-800">
                          <span style={{ color: '#e8a736' }} className="font-bold">{u.resource}/{u.maxResource}</span>
                          <span className="text-zinc-600 ml-1">{u.resourceName}</span>
                        </div>
                      )}

                      {/* Turn Indicator */}
                      {isActive && (
                        <div className="text-xs font-mono text-center text-yellow-500 font-bold mt-1 pt-1 border-t border-yellow-500/30 bg-yellow-500/10">
                          ▶ YOUR TURN
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Dock: Dialog + Hand ── */}
      <div className="grid grid-cols-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm min-h-48">

        {/* Dialog Box (Left) */}
        <div className="col-span-1 border-r border-zinc-800 p-5 flex flex-col justify-between bg-gradient-to-b from-zinc-900/50 to-zinc-950">
          <div>
            {lastLog && (
              <p className="font-mono text-sm text-zinc-100 leading-relaxed">
                {lastLog.text}
              </p>
            )}
          </div>

          {/* Status Line */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
            {phase === 'select' && isPlayerTurn && currentActor && (
              <div className="text-xs font-mono tracking-tight text-zinc-400">
                <span style={{ color: currentActor.factionColor }} className="font-bold">{currentActor.name}</span>
                {pendingSkill && <span className="text-yellow-500"> • {pendingSkill.name}</span>}
                {targetId && <span className="text-yellow-500"> → {enemies.find(e => e.id === targetId)?.name ?? '?'}</span>}
              </div>
            )}
            {phase === 'select' && !isPlayerTurn && currentActor && (
              <span className="text-xs font-mono text-zinc-500">
                <span style={{ color: C.blood }} className="font-bold">{currentActor.name}</span> is acting...
              </span>
            )}
            {phase === 'resolving' && (
              <span className="text-xs font-mono text-zinc-500 tracking-widest">▶▶ RESOLVING</span>
            )}
          </div>
        </div>

        {/* Combat Log (Middle) */}
        <div className="col-span-1 border-r border-zinc-800 overflow-hidden bg-zinc-950/50">
          {phase === 'select' && activePlayer && activePlayer.hp > 0 ? (
            <div className="p-5 text-center text-zinc-500 font-mono text-sm">
              <p>Select a skill and target to continue</p>
            </div>
          ) : (
            <CombatLog entries={log} />
          )}
        </div>

        {/* Hand / Skills (Right) */}
        <div className="col-span-1 p-5 flex flex-col bg-gradient-to-b from-emerald-950/20 to-transparent">
          {phase === 'select' && activePlayer && activePlayer.hp > 0 ? (
            <div className="flex flex-col gap-3 h-full">
              {/* Header + Execute Button */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-900/30">
                <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">Hand</span>
                <button
                  onClick={() => canExecute && doResolve(pendingSkill!, targetId)}
                  disabled={!canExecute}
                  className={`px-4 py-2 rounded font-['Bebas_Neue'] text-base tracking-wide transition-all duration-200 ${
                    canExecute
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  ATTACK
                </button>
              </div>

              {/* Skills as Cards */}
              {activePlayer.skills.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-zinc-600 font-mono text-sm">No skills</div>
              ) : (
                <div className="flex flex-wrap gap-2 flex-1 content-start overflow-y-auto">
                  {activePlayer.skills.map(sk => {
                    const isPicked = pendingSkill?.id === sk.id
                    const canAfford = activePlayer.maxResource === 0 || activePlayer.resource >= sk.cost
                    const fc = activePlayer.factionColor

                    return (
                      <button
                        key={sk.id}
                        onClick={() => canAfford && setPendingSkill(sk)}
                        disabled={!canAfford}
                        className={`flex-1 min-w-28 p-3 rounded-lg border-2 transition-all duration-200 flex flex-col gap-1.5 text-left ${
                          isPicked
                            ? `border-yellow-500 bg-yellow-500/15 shadow-lg shadow-yellow-500/20`
                            : canAfford
                            ? `border-emerald-900/40 hover:border-emerald-600/60 bg-emerald-950/10 hover:bg-emerald-950/20`
                            : `border-zinc-800 bg-zinc-900 opacity-35 cursor-not-allowed`
                        }`}
                      >
                        <div className="font-['Bebas_Neue'] text-sm tracking-wide" style={{ color: isPicked ? '#e8a736' : C.ink }}>
                          {sk.name}
                        </div>
                        <div className="text-xs font-mono text-zinc-400">
                          <span style={{ color: '#e8a736' }} className="font-bold">PWR {sk.basePower}</span>
                          {sk.cost > 0 && (
                            <>
                              <span className="mx-1">·</span>
                              <span style={{ color: canAfford ? '#e8a736' : '#666' }}>
                                {sk.cost}<span className="text-xs text-zinc-600">{activePlayer.resourceName.charAt(0)}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">
              {phase === 'victory' ? '★ VICTORY' : phase === 'defeat' ? '✕ DEFEAT' : 'Waiting...'}
            </div>
          )}
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
