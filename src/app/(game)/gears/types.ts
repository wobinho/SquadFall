export interface GearRow {
  instanceId:       number
  gearId:           number
  name:             string
  art:              string | null
  category:         string
  subcategory:      string
  statAttack:       number
  resourcePoolSize: number
  resourceRegenRate: number
  resourceName:     string
  modifier:         string | null
  level:            number
}
