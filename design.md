# Design System — Zombie Squad Combat

> **Status:** Locked direction. Implementation spec.
> **Version:** v0.2 (TypeScript edition)
> **Source mockups:** `combat-image-first.html`, `loadout-comparison.html`
> **Philosophy:** Image-first trading card aesthetic. Portraits dominate, UI frames the art, faction color is the through-line.

---

## 1. Design Philosophy

The UI is a **frame around art**, not art itself. Every design decision serves this hierarchy:

1. **Character and gear portraits** — the hero visual elements. Nothing in the UI should compete with them.
2. **Faction color** — the emotional and semantic through-line. Squad composition should be readable at a glance by color alone.
3. **Information density** — dense but structured. Stats, resources, and moves are all visible at once, never buried in tooltips for core play.
4. **Typography hierarchy** — four fonts with specific jobs. No improvisation.

**Mood target:** Prestige collectible card × tactical combat × post-apocalyptic grit. Not "gamer UI." Not "minimal startup." Editorial, precise, weighty.

---

## 2. File Structure

The design system lives in a few typed modules. Components consume tokens; tokens are framework-agnostic; Tailwind extends the token palette for utility-class usage.

```
src/
├── design/
│   ├── tokens.ts              // Colors, fonts, spacing, factions
│   ├── types.ts               // Shared design types (Faction, StatKind, etc.)
│   └── variants.ts            // Card state variants, hover rules
├── components/
│   ├── CharacterCard.tsx
│   ├── ZombieCard.tsx
│   ├── Portrait.tsx
│   ├── StatBar.tsx
│   ├── PassiveBlock.tsx
│   ├── GearBlock.tsx
│   ├── MoveTile.tsx
│   └── StatusChip.tsx
└── tailwind.config.ts         // Extends the token palette
```

---

## 3. Color System

All colors are typed constants. Never inline hex values in components — import from `tokens.ts`.

```ts
// src/design/tokens.ts

export const colors = {
  // Surfaces
  bg:       '#0b0d10', // Page background
  bg2:      '#14171c', // Elevated surfaces (cards, panels)
  bg3:      '#1a1d22', // Top of card gradient
  bg4:      '#0f1115', // Bottom of card gradient
  bgDeep:   '#0a0c10', // Inset elements (move tiles, stat bar bg)

  // Text
  ink:      '#f2f0ea', // Primary text
  muted:    '#8a8e96', // Secondary text, labels
  dim:      '#5a5e66', // Tertiary, inactive

  // Structural
  line:         '#24282f', // Borders, dividers
  lineStrong:   '#3a3f48', // Emphasized borders

  // State
  blood:      '#c53030', // Damage, enemies, danger
  bloodLight: '#ff5555', // HP bar gradient top
  warn:       '#e8a736', // Warnings, low HP
  warnLight:  '#ff8833', // Low HP gradient
  success:    '#6b8a3a', // Positive (shares verdant value)

  // Decorative
  enemyTint: 'rgba(197, 48, 48, 0.08)',
  enemyGlow: 'rgba(197, 48, 48, 0.15)',
} as const;

export const factionColors = {
  ironwatch: '#6a7d5a', // Olive green — military
  rustborn:  '#c7641c', // Copper — scavenger
  ashkin:    '#b83a1e', // Ember red — fire cult
  verdant:   '#6b8a3a', // Moss green — hunter
} as const;

export type Faction = keyof typeof factionColors;
```

### Color Usage Rules

- **Faction color appears on every character card** in these places, in this order of prominence: top bar (4px strip), faction label text, corner brackets on portrait, passive label text, gear border (when gear is primary), ammo bar gradient.
- **`colors.blood` is reserved for enemies, damage, and critical HP.** Never use for friendly UI elements.
- **`colors.warn` is for states that need attention:** low HP (below 50%), resource near empty, critical debuffs.
- **`colors.muted` / `colors.dim` are for secondary information.** If you're unsure whether something should be prominent, it probably shouldn't be.
- **No pure white.** `colors.ink` is `#f2f0ea` — a warm off-white that sits better on dark backgrounds.

### Tailwind Integration

```ts
// src/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { colors, factionColors } from './src/design/tokens';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...colors,
        faction: factionColors,
      },
    },
  },
} satisfies Config;
```

Usage: `className="bg-bg2 text-ink border-line"` or faction-aware `className="text-faction-ironwatch"`.

---

## 4. Typography

Four fonts. Each has a specific role. Never swap them.

```ts
// src/design/tokens.ts (continued)

export const fonts = {
  display:   "'Bebas Neue', sans-serif",       // Headers, names, stats
  accent:    "'DM Serif Display', serif",       // Passive names, prestige moments
  body:      "'Inter', sans-serif",             // Descriptions, flavor
  mono:      "'JetBrains Mono', monospace",     // Data, labels, numbers
} as const;

export const fontImport =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display" +
  "&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700;800" +
  "&display=swap";
```

### Font Roles

| Font | Role | Where |
|---|---|---|
| **Bebas Neue** (`fonts.display`) | Display, headers, names | Character names, gear names, move names, section headers, big stat numbers |
| **DM Serif Display** (`fonts.accent`) | Editorial accent | Passive ability names, portrait fallback letters, prestige moments |
| **Inter** (`fonts.body`) | UI body | Descriptions, flavor text, buttons, secondary text |
| **JetBrains Mono** (`fonts.mono`) | Data, code, labels | Stat labels, resource counts, small-caps labels, log entries |

### Scale

```ts
// src/design/tokens.ts (continued)

export const typeScale = {
  // Bebas Neue — display
  heroHeader:   'clamp(40px, 6vw, 72px)',   // Page title
  cardName:     '28px',                      // Character name
  gearName:     '16px',                      // Gear name on card
  moveName:     '13px',                      // Move name
  sectionHead:  '22px',

  // DM Serif Display
  passiveName:  '16px',

  // Inter
  body:         '13px',                      // Descriptions
  desc:         '10px',                      // Move descriptions
  classLabel:   '11px',                      // Character class label

  // JetBrains Mono
  label:        '9px',                       // ALL CAPS LABELS
  stat:         '11px',                      // Numeric data
  log:          '12px',                      // Combat log
} as const;

export const letterSpacing = {
  displayTight:   '0.04em',    // Bebas default readability
  displayWide:    '0.06em',    // Bebas emphasis
  labelTight:     '0.15em',    // Mono labels
  labelWide:      '0.25em',    // Mono stamped-on look
  accent:         '0.02em',    // Serif accent
} as const;
```

### Letter Spacing Rules

- **Bebas Neue** uses `letterSpacing.displayTight` to `displayWide` — it's very tight by default.
- **JetBrains Mono labels** always use `letterSpacing.labelTight` to `labelWide` when uppercase — the "stamped onto the card" look.
- **Inter body** uses default letter spacing.
- **DM Serif Display** uses `letterSpacing.accent`.

### Never

- Never use Inter for display / headers.
- Never use Bebas Neue for body / descriptions.
- Never use JetBrains Mono for narrative / flavor text.
- Never use system fonts as fallback — pick and load.

---

## 5. Layout Primitives

```ts
// src/design/tokens.ts (continued)

export const layout = {
  pageMaxWidth:   '1400px',
  pagePadding:    '40px 24px 80px',
  pageBackground: 'radial-gradient(ellipse at top, #1a1d22 0%, #0b0d10 60%)',
} as const;

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  xxl: '24px',
} as const;
```

The radial gradient on the page is important — it creates atmosphere. Never use a flat background color for the page.

### Combat Scene Structure

```
┌─────────────────────────────────────────────┐
│  ENEMY ROW (top)                            │
│  — tinted red, compressed zombie cards       │
├─────────────────────────────────────────────┤
│  FIGHT FEED (middle, thin)                  │
│  — turn counter + recent log                │
├─────────────────────────────────────────────┤
│  SQUAD ROW (bottom, large)                  │
│  — 3 full trading card survivors            │
└─────────────────────────────────────────────┘
```

- **Enemy row:** `min-height: 300px`, gradient from `colors.enemyTint` fading down, labeled `HOSTILES — WAVE X / Y` in mono top-left.
- **Fight feed:** 3-column grid (log / turn counter / log), thin (~60px), centered turn counter in `fonts.display`.
- **Squad row:** 3-column grid, gap `spacing.xl`.

---

## 6. The Character Card (Hero Component)

The card has six stacked sections:

```
┌───────────────────────────┐
│ [4px faction color bar]   │  ← Identity strip
├───────────────────────────┤
│ HEADER                    │  ← Faction · Name · Class / Initiative
├───────────────────────────┤
│        PORTRAIT           │  ← 3:4 hero image with corner brackets
├───────────────────────────┤
│ STATS (HP + Resources)    │  ← Three stat columns (HP, Gear1, Gear2)
├───────────────────────────┤
│ PASSIVE ABILITIES (×2)    │  ← Each with faction label + serif name + flavor
├───────────────────────────┤
│ GEAR 1 (primary)          │  ← Modifier badge + name + 3 move tiles
├───────────────────────────┤
│ GEAR 2 (secondary)        │  ← Uses secondary color for gear border
└───────────────────────────┘
```

### Component Prop Types

```ts
// src/components/CharacterCard.tsx
import type { Faction } from '@/design/types';

export interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    className: string;        // Flavor label ("Rifleman", "Tracker")
    faction: Faction;
    portraitUrl: string;
    level: number;
    initiative: number;       // For display
  };
  stats: {
    hp:        { current: number; max: number };
    speed:     number;
    defense:   number;
    fortitude: number;
    focus:     number;
  };
  passives: [PassiveDef, PassiveDef];   // Exactly 2, fixed order
  gears: [GearInstance, GearInstance];  // Primary, Secondary
  state: {
    isActiveTurn:  boolean;
    isTargetable:  boolean;
    statusEffects: StatusEffect[];
  };
  onMoveSelect?: (gearSlot: 0 | 1, moveId: string) => void;
  onRest?:       () => void;
}
```

### Card Container Styles

Tailwind classes — use `data-faction` attribute and a CSS variable to drive the cascading faction color.

```tsx
// src/components/CharacterCard.tsx (excerpt)
import { factionColors } from '@/design/tokens';

export function CharacterCard(props: CharacterCardProps) {
  const factionColor = factionColors[props.character.faction];

  return (
    <div
      data-faction={props.character.faction}
      data-active={props.state.isActiveTurn}
      style={{ '--faction': factionColor } as React.CSSProperties}
      className={[
        'relative flex flex-col overflow-hidden',
        'bg-gradient-to-b from-bg3 to-bg4',
        'border border-line',
        'transition-all duration-200 ease-out',
        'data-[active=true]:-translate-y-1',
        'data-[active=true]:border-ink',
        'data-[active=true]:shadow-active',
      ].join(' ')}
    >
      {/* faction bar */}
      <div className="h-1" style={{ background: 'var(--faction)' }} />
      {/* ...rest of card... */}
    </div>
  );
}
```

**The `--faction` CSS variable cascades through the card** and drives accent color on every sub-element. This is the one place we use a CSS variable directly — it's how child components inherit the card's faction without prop drilling.

### Active Turn Shadow

```ts
// Add to tailwind.config.ts theme.extend:
boxShadow: {
  active: '0 0 0 1px #f2f0ea, 0 20px 60px -20px rgba(255,255,255,0.15)',
},
```

### Portrait Component

```ts
// src/components/Portrait.tsx
export interface PortraitProps {
  imageUrl: string;
  fallbackLetter?: string;  // Used if imageUrl fails to load
  aspectRatio?: '3/4' | '1/1';
  showCornerBrackets?: boolean;  // Default true for survivors, false for zombies
  statusOverlay?: React.ReactNode;
}
```

```tsx
export function Portrait(props: PortraitProps) {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-b from-[#2a2f38] to-[#141821]"
      style={{ aspectRatio: props.aspectRatio ?? '3/4' }}
    >
      <img src={props.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Mandatory vignette for readability across art styles */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, transparent 50%, rgba(11,13,16,0.95)),
            radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5))
          `,
        }}
      />

      {props.showCornerBrackets !== false && <CornerBrackets />}

      {props.statusOverlay && (
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-0.5 items-end">
          {props.statusOverlay}
        </div>
      )}
    </div>
  );
}

function CornerBrackets() {
  const base = 'absolute w-[18px] h-[18px] z-[2]';
  const color = 'border border-[color:var(--faction)]';
  return (
    <>
      <div className={`${base} ${color} top-2 left-2  border-r-0 border-b-0`} />
      <div className={`${base} ${color} top-2 right-2 border-l-0 border-b-0`} />
      <div className={`${base} ${color} bottom-2 left-2  border-r-0 border-t-0`} />
      <div className={`${base} ${color} bottom-2 right-2 border-l-0 border-t-0`} />
    </>
  );
}
```

**Corner brackets** frame the portrait — 18×18px L-shapes in faction color at each corner. This is the signature visual element. Never omit on survivor cards.

**Vignette is mandatory.** Art will vary in quality and style — the vignette normalizes readability.

### StatBar Component

```ts
// src/components/StatBar.tsx
export type StatKind = 'hp' | 'resource-primary' | 'resource-secondary';

export interface StatBarProps {
  kind:     StatKind;
  label:    string;   // "HP", "Shells", "Rounds"
  current:  number;
  max:      number;
  isLow?:   boolean;  // Triggers warning coloring (auto-computed if current/max < 0.5)
}
```

```tsx
export function StatBar(props: StatBarProps) {
  const pct = Math.max(0, Math.min(1, props.current / props.max));
  const isLow = props.isLow ?? pct < 0.5;

  const fillClass = {
    'hp':                 isLow ? 'bg-gradient-to-r from-warn to-warnLight'
                                 : 'bg-gradient-to-r from-blood to-bloodLight',
    'resource-primary':   'bg-gradient-to-r from-[color:var(--faction)] to-[#dce0c0]',
    'resource-secondary': 'bg-gradient-to-r from-rustborn to-[#f0b280]',
  }[props.kind];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
        <span>{props.label}</span>
        <span className="text-ink font-semibold">{props.current}/{props.max}</span>
      </div>
      <div className="h-1 bg-bgDeep border border-line">
        <div className={`h-full ${fillClass}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
```

Bars are **4px tall, 1px bordered, flat colors with slight gradient.** Never use box-shadows or glow effects on bars.

### Passive Block

```ts
// src/components/PassiveBlock.tsx
export interface PassiveDef {
  id:          string;
  name:        string;
  description: string;
  type:        'gear-affinity' | 'combat' | 'matchup' | 'conditional' | 'drawback' | 'signature';
}

export interface PassiveBlockProps {
  passive: PassiveDef;
}
```

```tsx
export function PassiveBlock({ passive }: PassiveBlockProps) {
  return (
    <div className="px-4 py-3 bg-white/[0.02] border-b border-line">
      <div
        className="font-mono text-[9px] uppercase tracking-[0.25em] mb-1"
        style={{ color: 'var(--faction)' }}
      >
        Passive · {passive.type}
      </div>
      <div className="font-accent text-base tracking-[0.02em]">{passive.name}</div>
      <p className="font-body text-[11px] text-muted leading-[1.5] mt-1 italic">
        {passive.description}
      </p>
    </div>
  );
}
```

**Passives are hero elements on the card.** They replace innate moves, so they deserve visual weight: their own block with subtle background tint, faction-colored label, and serif display type for the name. Flavor text in italic Inter, muted color.

### Gear Block

```ts
// src/components/GearBlock.tsx
export type GearSlot = 'primary' | 'secondary';

export interface GearInstance {
  baseId:          string;   // "mossberg-590"
  baseName:        string;   // "Mossberg 590"
  iconSymbol:      string;   // "▲" etc.
  modifier:        { name: string; rollQuality: number };   // e.g. { name: 'Demonic', rollQuality: 0.92 }
  resource:        { name: string; current: number; max: number; regen: number };
  moves:           [MoveDef, MoveDef, MoveDef];
}

export interface GearBlockProps {
  gear:          GearInstance;
  slot:          GearSlot;
  onMoveSelect?: (moveId: string) => void;
}
```

```tsx
import { factionColors } from '@/design/tokens';

export function GearBlock({ gear, slot, onMoveSelect }: GearBlockProps) {
  // Primary gear uses the character's faction color (via --faction).
  // Secondary gear uses a contrasting accent (rustborn as default).
  const gearColor =
    slot === 'primary' ? 'var(--faction)' : factionColors.rustborn;

  return (
    <div
      className="px-4 pt-3 pb-2 border-b border-line"
      style={{ '--gear-color': gearColor } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-9 h-9 bg-bgDeep border flex items-center justify-center font-accent text-lg"
          style={{ borderColor: gearColor, color: gearColor }}
        >
          {gear.iconSymbol}
        </div>
        <div className="flex-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            {slot === 'primary' ? 'Primary' : 'Secondary'} · {gear.modifier.name}
            {' · '}
            <span style={{ color: gearColor }}>{Math.round(gear.modifier.rollQuality * 100)}%</span>
          </div>
          <div className="font-display text-base tracking-[0.04em]">{gear.baseName}</div>
        </div>
        <div className="font-mono text-[10px] font-bold" style={{ color: gearColor }}>
          {gear.resource.current}/{gear.resource.max}
          <span className="font-normal text-muted ml-2">+{gear.resource.regen}/t</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {gear.moves.map((m) => (
          <MoveTile key={m.id} move={m} resourceAvailable={gear.resource.current} onSelect={onMoveSelect} />
        ))}
      </div>
    </div>
  );
}
```

**Primary gear uses `--faction` color** (reinforces character identity). **Secondary gear uses a contrasting accent** — default to `factionColors.rustborn`, but if the gear base itself has a strong faction affinity, the design can override.

The `--gear-color` CSS variable lets child move tiles inherit the correct color without prop drilling.

Note the modifier display: **name + roll quality percent**, both shown prominently. This is the progression hook we locked in the overview (v0.2) — players want both a better modifier name *and* a better roll.

### Move Tile

```ts
// src/components/MoveTile.tsx
export interface MoveDef {
  id:            string;
  name:          string;
  cost:          number;      // 0 for free melee
  description:   string;
  tag?:          string;      // "AOE", "STUN", "BLEED", etc.
  basePower:     number;
  attackScaling: number;      // 0.5 light, 1.5 heavy
}

export interface MoveTileProps {
  move:              MoveDef;
  resourceAvailable: number;
  onSelect?:         (moveId: string) => void;
}
```

```tsx
export function MoveTile({ move, resourceAvailable, onSelect }: MoveTileProps) {
  const disabled = move.cost > resourceAvailable;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(move.id)}
      className={[
        'relative flex flex-col text-left min-h-[72px] px-2.5 py-2',
        'bg-bgDeep border border-line',
        'transition-all duration-150',
        disabled
          ? 'opacity-35 cursor-not-allowed'
          : 'cursor-pointer hover:bg-white/[0.03] hover:border-[color:var(--gear-color)]',
      ].join(' ')}
    >
      <span
        className="absolute top-1.5 right-2 font-mono text-[10px] font-bold"
        style={{ color: 'var(--gear-color)' }}
      >
        {move.cost === 0 ? '—' : `${move.cost}◆`}
      </span>

      <span className="font-display text-[13px] tracking-[0.05em] pr-6">{move.name}</span>
      <span className="font-body text-[10px] text-muted leading-[1.35] mt-auto">{move.description}</span>
      {move.tag && (
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-warn mt-1">{move.tag}</span>
      )}
    </button>
  );
}
```

**Every move tile has four parts:** name (Bebas, top-left), cost (mono, top-right, gear color), description (Inter, muted, bottom), optional tag (mono, warn color — AOE / STUN / BLEED).

**Disabled state uses opacity reduction — NOT a greyscale filter.** Stay visible but clearly inactive.

---

## 7. The Zombie Card

Tighter, darker, rougher. Visually distinct from survivor cards.

```ts
// src/components/ZombieCard.tsx
export type ZombieType = 'shambler' | 'runner' | 'spitter' | 'brute' | 'infected';

export interface ZombieCardProps {
  instance: {
    id:       string;
    type:     ZombieType;
    typeLabel: string;       // Displayed name, e.g. "Runner 04"
    portraitUrl: string;
    hp:       { current: number; max: number };
    statuses: StatusEffect[];
  };
  isTargeted?: boolean;
  onSelect?: () => void;
}
```

```tsx
export function ZombieCard({ instance, isTargeted, onSelect }: ZombieCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-[180px] flex flex-col items-center pt-7 cursor-pointer transition-transform hover:-translate-y-1"
    >
      <span className="absolute top-2.5 left-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff9a9a] z-10">
        {instance.type}
      </span>

      <div
        className={[
          'relative w-[140px] h-[180px] overflow-hidden',
          'bg-gradient-to-b from-[#2a0a0a] to-[#0f0404]',
          'border border-[#3a1010]',
          isTargeted && 'outline outline-2 outline-blood outline-offset-4',
        ].filter(Boolean).join(' ')}
      >
        <img src={instance.portraitUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        {/* Rough, dirty overlay — the zombie equivalent of the vignette */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(180deg, transparent 60%, rgba(15,4,4,0.9)),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)
            `,
          }}
        />
      </div>

      <div className="font-display text-xl tracking-[0.05em] mt-2.5 text-center">
        {instance.typeLabel}
      </div>

      <div className="w-[140px] mt-1.5">
        <div className="h-1.5 bg-[#1a0505] border border-[#3a1010] relative overflow-hidden">
          <div
            className="h-full bg-blood"
            style={{ width: `${(instance.hp.current / instance.hp.max) * 100}%` }}
          />
        </div>
        <div className="font-mono text-[10px] text-[#ff9a9a] mt-1 text-center">
          {instance.hp.current} / {instance.hp.max}
        </div>
      </div>

      <div className="flex gap-1 mt-1.5 justify-center flex-wrap">
        {instance.statuses.map((s) => <StatusChip key={s.id} status={s} />)}
      </div>
    </button>
  );
}
```

**No corner brackets on zombies.** No faction color. No passive block. Just type tag, portrait, name, HP bar, status chips.

**Zombie intent is NOT shown.** Do not add an intent line or damage prediction. Players see only type, HP, and status effects.

---

## 8. Status Effect Chips

Status chips appear on zombie cards (below HP bar) and survivor portraits (overlay top-right). Always mono font, bordered, uppercase.

```ts
// src/components/StatusChip.tsx
export type StatusKind =
  | 'bleed' | 'mark' | 'burn' | 'stun' | 'poison' | 'shield' | 'lowHp';

export interface StatusEffect {
  id:     string;
  kind:   StatusKind;
  stacks: number;         // Display number after name
}

const statusColor: Record<StatusKind, string> = {
  bleed:  '#c53030',   // colors.blood
  mark:   '#6b8a3a',   // factionColors.verdant
  burn:   '#e8a736',   // colors.warn
  stun:   '#3ab0c7',
  poison: '#8b3aa8',
  shield: '#c9a97a',
  lowHp:  '#c53030',
};
```

```tsx
export function StatusChip({ status }: { status: StatusEffect }) {
  const color = statusColor[status.kind];
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 border bg-black/60"
      style={{ color, borderColor: color }}
    >
      {status.kind} {status.stacks}
    </span>
  );
}
```

Display format: `EFFECT + stack count` (e.g., `BLEED 3`, `MARK 2`, `STUN 1`). Never spell out full effect names.

---

## 9. Interaction & Motion

### Hover Rules

- Survivor cards: no hover movement on inactive cards (only the active card lifts).
- Zombie cards: `translateY(-4px)` on hover.
- Move tiles: border color shift to gear color, subtle background tint.
- Gear icons: no hover state (they're not clickable).

### Active Turn Indicator

The character whose turn it is gets:
- `border-color: colors.ink`
- `box-shadow: shadows.active` (defined in Tailwind extend)
- `transform: translateY(-4px)`

This lift + glow combo is the strongest visual emphasis in the entire UI. Reserve it for the active character only.

### Animation Specs (Framer Motion)

```ts
// src/design/variants.ts
import type { Variants } from 'framer-motion';

export const cardVariants: Variants = {
  inactive: { y:  0,  scale: 1,    transition: { duration: 0.2 } },
  active:   { y: -4,  scale: 1,    transition: { duration: 0.2 } },
  attack:   { scale: 1.02, transition: { duration: 0.15, yoyo: 1 } },
};

export const targetVariants: Variants = {
  idle: { x: 0 },
  hit:  { x: [-4, 4, -2, 0], transition: { duration: 0.3 } },
};

export const damageNumberVariants: Variants = {
  initial: { opacity: 0, y: 0,   scale: 0.6 },
  float:   { opacity: 1, y: -40, scale: 1,   transition: { duration: 0.8 } },
  fade:    { opacity: 0, y: -60, transition: { duration: 0.3 } },
};

export const statusChipVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  appear:  { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};
```

- **Attack:** Active card briefly scales to 1.02 then snaps back. Target shakes horizontally on hit.
- **Damage numbers:** Float up from target with opacity fade over ~800ms. Bebas Neue, large (24–32px), blood color for damage / success green for heals.
- **Status application:** Status chip fades in with slight scale.
- **Turn transition:** Active indicator lifts from one card to the next with 300ms stagger.
- **Resource change:** Stat bar animates width change over 400ms. Number counts up/down.

**Never use animations longer than ~500ms for core combat feedback** — snappy feel required.

---

## 10. Faction Legend (Out-of-Combat)

Used on character selection, loadout, deck builder screens.

```ts
// src/components/FactionCell.tsx
import type { Faction } from '@/design/types';

export interface FactionCellProps {
  faction:     Faction;
  name:        string;
  description: string;
  keyword:     string;
}
```

```tsx
import { factionColors } from '@/design/tokens';

export function FactionCell({ faction, name, description, keyword }: FactionCellProps) {
  const color = factionColors[faction];
  return (
    <div
      className="p-3.5 bg-white/[0.02]"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="font-display text-lg tracking-[0.05em]" style={{ color }}>{name}</div>
      <p className="text-xs leading-[1.55] text-muted mt-2">{description}</p>
      <span
        className="inline-block mt-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] border"
        style={{ color, borderColor: color }}
      >
        Keyword: {keyword}
      </span>
    </div>
  );
}
```

---

## 11. Shared Design Types

```ts
// src/design/types.ts

export type Faction = 'ironwatch' | 'rustborn' | 'ashkin' | 'verdant';

export type StatKind = 'hp' | 'speed' | 'defense' | 'fortitude' | 'focus';

export type ResourceRegenTier = 'slow' | 'medium' | 'fast';   // +1, +2, +3 per turn

export type GearTypeTag =
  | 'shotgun' | 'smg' | 'rifle' | 'bow'
  | 'flamethrower' | 'medkit' | 'toolkit' | 'melee';

export type EffectId =
  | 'damage-over-time' | 'stun' | 'mark' | 'armor-shred'
  | 'heal' | 'shield' | 'cleanse'
  | 'stat-buff' | 'stat-debuff'
  | 'resource-grant' | 'conditional-damage-modifier'
  | 'stat-modifier';

export type ModifierCategory = 'upside' | 'tradeoff' | 'downside';
```

---

## 12. Principles to Enforce

These are easy to violate. Catch them in code review.

- **No gradients on text.** Text is flat color, always.
- **No drop shadows on cards** except the active-card lift shadow. Shadows suggest fake depth.
- **No rounded corners anywhere** (`rounded-none` is the default in your Tailwind config). The square aesthetic is intentional — stamped metal / paper, not glassy UI. Possible future exception: gear icons with 2px rounded corners if pure square feels wrong in testing.
- **No emoji in production UI.** Use Unicode symbols (▲ ◊ ✦ ◆) for gear type icons or dedicated SVGs.
- **No blur / frosted glass.** Everything is crisp.
- **Corner brackets are non-negotiable** on survivor portraits. They're the signature.
- **Faction color is never used outside its faction context.** Don't use `factionColors.ironwatch` as a "success" indicator elsewhere — use `colors.success` which happens to share a similar value but is semantically different.
- **Zombie intent must stay hidden.** Any PR adding "next attack preview" to zombies gets rejected.
- **Portraits must have the gradient vignette.** Art will vary in quality — the vignette normalizes readability.
- **Never hardcode hex values in components.** Import from `tokens.ts`.
- **Never use Tailwind's default color palette** (`bg-red-500`, `text-gray-400`, etc.) outside of the token colors. Extend via `tailwind.config.ts` and use the token names.

---

## 13. Reference Mockups

- `combat-image-first.html` — full combat scene, 1-gear variant (original, still useful for general layout).
- `loadout-comparison.html` — 1-gear vs 2-gear side-by-side with gear examples grid. **Current direction.**

Both files are the source of truth for visual language. When docs and mockups disagree, mockups win and docs get updated.

---

## 14. Gear Modifier Display (v0.2 addition)

Gear blocks on the character card now surface the **rolled modifier**. The format in the gear block header is:

```
PRIMARY · DEMONIC · 92%
Mossberg 590
```

- `PRIMARY` — gear slot label, mono, muted.
- `DEMONIC` — modifier name, mono, muted for the label, modifier name inline.
- `92%` — roll quality percentage, gear-colored, bold. The visible progression hook.
- `Mossberg 590` — weapon base name, display font, larger.

For deeper gear viewing (inventory, loadout screen — outside combat), a richer modifier display is used:

```ts
export interface ModifierDetailProps {
  modifier: {
    name:           string;                  // "Demonic"
    description:    string;                  // "+20% Base Attack"
    rollQuality:    number;                  // 0.92
    effectiveValue: string;                  // "+18% Base Attack" (the actual rolled result)
    category:       'upside' | 'tradeoff' | 'downside';
  };
}
```

Roll quality display bands:

```ts
export function rollQualityBand(quality: number): string {
  if (quality >= 0.95) return 'Perfect';
  if (quality >= 0.85) return 'Excellent';
  if (quality >= 0.70) return 'Good';
  if (quality >= 0.55) return 'Fair';
  return 'Poor';
}
```

These bands are player-facing — use them in tooltips and gear-detail screens, not in raw combat UI (which only needs the percent).

---

## 15. Change Log

**v0.2 (TypeScript edition)** — Doc rewritten to present the design system as TypeScript modules instead of raw CSS. Added:
- Typed `tokens.ts` with `as const` exports for colors, fonts, type scale, letter spacing, layout, and spacing.
- `factionColors` exported separately with `Faction` type derived from its keys.
- Component prop interfaces for all major components (CharacterCard, Portrait, StatBar, PassiveBlock, GearBlock, MoveTile, ZombieCard, StatusChip, FactionCell).
- Shared design types in `types.ts` (Faction, StatKind, EffectId, etc.).
- Framer Motion variants in `variants.ts`.
- Tailwind config extension pattern for the token palette.
- Gear modifier display spec (carries over the v0.2 overview decisions — rolled strength, quality bands).
- `ModifierDetailProps` and `rollQualityBand()` helper for the gear detail screen.

**v0.1** — Initial lock. Trading card aesthetic, 4 factions, 2-gear layout, hidden zombie intent, color/type/component system in CSS flavor.
