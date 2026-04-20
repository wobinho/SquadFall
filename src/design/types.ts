export type Faction = 'ironwatch' | 'rustborn' | 'ashkin' | 'verdant'

export type StatKind = 'hp' | 'speed' | 'defense' | 'fortitude' | 'focus'

export type ResourceRegenTier = 'slow' | 'medium' | 'fast'

export type GearTypeTag =
  | 'shotgun' | 'smg' | 'rifle' | 'bow'
  | 'flamethrower' | 'medkit' | 'toolkit' | 'melee'

export type EffectId =
  | 'damage-over-time' | 'stun' | 'mark' | 'armor-shred'
  | 'heal' | 'shield' | 'cleanse'
  | 'stat-buff' | 'stat-debuff'
  | 'resource-grant' | 'conditional-damage-modifier'
  | 'stat-modifier'

export type ModifierCategory = 'upside' | 'tradeoff' | 'downside'

export type StatusKind =
  | 'bleed' | 'mark' | 'burn' | 'stun' | 'poison' | 'shield' | 'lowHp'
