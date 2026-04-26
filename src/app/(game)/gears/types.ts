export interface Skill {
  id: number
  name: string
  art: string | null
  basePower: number
  resourceCost: number
}

export interface GearRow {
  instanceId:       number
  gearId:           number
  name:             string
  art:              string | null
  category:         string
  subcategory:      string
  rarity:           string
  rarityColor:      string
  statAttack:       number
  critDamage:       number
  critChance:       number
  accuracy:         number
  penetration:      number
  chain:            number
  weight:           number
  resourcePoolSize: number
  resourceRegenRate: number
  resourceName:     string
  modifier:         string | null
  level:            number
  skills:           Skill[]
}
