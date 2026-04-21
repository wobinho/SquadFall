import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CharactersGrid } from './CharactersGrid'
import type { CharacterRow, EquippedGearRow, PassiveRow, SkillRow } from './types'

export default async function CharactersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await db.execute({
    sql: `
      SELECT
        ci.id             AS instance_id,
        c.id              AS character_id,
        c.name,
        c.art,
        f.faction_name,
        f.faction_color,
        c.class_name,
        ci.level,
        c.stat_hp,
        c.stat_speed,
        c.stat_defense,
        c.stat_fortitude,
        c.stat_focus,
        c.passive_1,
        c.passive_2,
        ci.gear_1         AS gear_1_instance_id,
        ci.gear_2         AS gear_2_instance_id
      FROM character_instances ci
      JOIN characters c ON c.id = ci.character_id
      LEFT JOIN faction f ON f.id = c.faction
      WHERE ci.user_id = ?
      ORDER BY ci.acquired_at ASC
    `,
    args: [session.userId],
  })

  async function loadPassive(passiveId: number | null): Promise<PassiveRow | null> {
    if (!passiveId) return null
    const r = await db.execute({
      sql: `SELECT passive_name, passive_details FROM passive WHERE id = ?`,
      args: [passiveId],
    })
    if (!r.rows.length) return null
    const row = r.rows[0]
    return {
      name:    row.passive_name    as string,
      details: row.passive_details as string,
    }
  }

  async function loadGear(gearInstanceId: number | null): Promise<EquippedGearRow | null> {
    if (!gearInstanceId) return null
    const r = await db.execute({
      sql: `
        SELECT
          gi.id                  AS instance_id,
          g.name,
          g.art,
          g.category,
          g.subcategory,
          g.stat_attack,
          g.resource_pool_size,
          g.resource_regen_rate,
          g.resource_name,
          gi.modifier,
          gi.level
        FROM gear_instances gi
        JOIN gears g ON g.id = gi.gear_id
        WHERE gi.id = ?
      `,
      args: [gearInstanceId],
    })
    if (!r.rows.length) return null
    const row = r.rows[0]

    const skillsResult = await db.execute({
      sql: `
        SELECT si.id AS instance_id, s.skill_name AS name, s.art, s.base_power, s.resource_cost
        FROM skill_instances si
        JOIN skills s ON s.id = si.skill_id
        WHERE si.equipped_to = ? AND si.equipped_to != 0
        ORDER BY si.id ASC
      `,
      args: [row.instance_id as number],
    })

    const skills: SkillRow[] = skillsResult.rows.map((s) => ({
      instanceId:   s.instance_id   as number,
      name:         s.name          as string,
      art:          s.art           as string | null,
      basePower:    s.base_power    as number,
      resourceCost: s.resource_cost as number,
    }))

    return {
      instanceId:        row.instance_id        as number,
      name:              row.name               as string,
      art:               row.art                as string | null,
      category:          row.category           as string,
      subcategory:       row.subcategory        as string,
      statAttack:        row.stat_attack        as number,
      resourcePoolSize:  row.resource_pool_size as number,
      resourceRegenRate: row.resource_regen_rate as number,
      resourceName:      row.resource_name      as string,
      modifier:          row.modifier           as string | null,
      level:             row.level              as number,
      skills,
    }
  }

  const characters: CharacterRow[] = await Promise.all(
    result.rows.map(async (r) => {
      const [gear1, gear2, passive1, passive2] = await Promise.all([
        loadGear(r.gear_1_instance_id as number | null),
        loadGear(r.gear_2_instance_id as number | null),
        loadPassive(r.passive_1 as number | null),
        loadPassive(r.passive_2 as number | null),
      ])
      return {
        instanceId:    r.instance_id    as number,
        characterId:   r.character_id   as number,
        name:          r.name           as string,
        art:           r.art            as string | null,
        factionName:   (r.faction_name  as string | null) ?? '',
        factionColor:  '#' + ((r.faction_color as string | null) ?? '6a7d5a').replace(/^#/, ''),
        className:     r.class_name     as string,
        level:         r.level          as number,
        statHp:        r.stat_hp        as number,
        statSpeed:     r.stat_speed     as number,
        statDefense:   r.stat_defense   as number,
        statFortitude: r.stat_fortitude as number,
        statFocus:     r.stat_focus     as number,
        passive1,
        passive2,
        gear1,
        gear2,
      }
    })
  )

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.25em', color: '#6b8a3a', textTransform: 'uppercase', marginBottom: '6px' }}>
          Survivor Roster · Faction Registry
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: '#f2f0ea', lineHeight: 1 }}>
            Characters
          </h1>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#5a5e66', textTransform: 'uppercase' }}>
            {characters.length} Survivors
          </span>
        </div>
      </div>

      {characters.length === 0 ? (
        <div style={{ background: '#14171c', border: '1px dashed #3a3f48', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.25em', color: '#5a5e66', textTransform: 'uppercase' }}>
            — No Survivors Acquired —
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#3a3f48', textTransform: 'uppercase', marginTop: '12px' }}>
            Visit the store to recruit survivors
          </div>
        </div>
      ) : (
        <CharactersGrid characters={characters} />
      )}
    </div>
  )
}
