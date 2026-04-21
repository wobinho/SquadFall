export interface PassiveRow {
  name:    string
  details: string
}

export interface SkillRow {
  instanceId:   number
  name:         string
  art:          string | null
  basePower:    number
  resourceCost: number
}

export interface EquippedGearRow {
  instanceId:        number
  name:              string
  art:               string | null
  category:          string
  subcategory:       string
  statAttack:        number
  resourcePoolSize:  number
  resourceRegenRate: number
  resourceName:      string
  modifier:          string | null
  level:             number
  skills:            SkillRow[]
}

export interface CharacterRow {
  instanceId:    number
  characterId:   number
  name:          string
  art:           string | null
  factionName:   string
  factionColor:  string
  className:     string
  level:         number
  statHp:        number
  statSpeed:     number
  statDefense:   number
  statFortitude: number
  statFocus:     number
  gear1:         EquippedGearRow | null
  gear2:         EquippedGearRow | null
  passive1:      PassiveRow | null
  passive2:      PassiveRow | null
}
