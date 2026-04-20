import type { Faction } from '@/design/types'

export interface CharacterRow {
  instanceId:    number
  characterId:   number
  name:          string
  art:           string | null
  faction:       string
  className:     string
  level:         number
  statHp:        number
  statSpeed:     number
  statDefense:   number
  statFortitude: number
  statFocus:     number
}

const FACTION_ALIASES: Record<string, Faction> = {
  ironwatch:  'ironwatch',
  rustborn:   'rustborn',
  ashkin:     'ashkin',
  verdant:    'verdant',
  syndicate:  'rustborn',
  resistance: 'verdant',
  fire:       'ashkin',
  military:   'ironwatch',
}

export function normaliseFaction(raw: string): Faction {
  return FACTION_ALIASES[raw.toLowerCase()] ?? 'ironwatch'
}
