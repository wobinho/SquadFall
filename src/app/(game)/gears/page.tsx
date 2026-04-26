import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { GearsGrid } from './GearsGrid'
import type { GearRow } from './types'

export default async function GearsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await db.execute({
    sql: `
      SELECT
        gi.id                  AS instance_id,
        g.id                   AS gear_id,
        g.name,
        g.art,
        g.category,
        g.subcategory,
        r.rarity_name          AS rarity,
        r.rarity_color         AS rarity_color,
        g.stat_attack,
        g.crit_damage,
        g.crit_chance,
        g.accuracy,
        g.penetration,
        g.chain,
        g.weight,
        g.resource_pool_size,
        g.resource_regen_rate,
        g.resource_name,
        gi.modifier,
        gi.level
      FROM gear_instances gi
      JOIN gears g ON g.id = gi.gear_id
      JOIN rarity r ON r.id = g.rarity
      WHERE gi.user_id = ?
      ORDER BY gi.acquired_at ASC
    `,
    args: [session.userId],
  })

  const gears: GearRow[] = await Promise.all(result.rows.map(async (r) => {
    const skillResult = await db.execute({
      sql: `
        SELECT s.*
        FROM skill_instances si
        JOIN skills s ON s.id = si.skill_id
        WHERE si.equipped_to = ?
        ORDER BY si.id ASC
      `,
      args: [r.instance_id as number],
    })

    return {
      instanceId:        r.instance_id        as number,
      gearId:            r.gear_id            as number,
      name:              r.name               as string,
      art:               r.art                as string | null,
      category:          r.category           as string,
      subcategory:       r.subcategory        as string,
      rarity:            r.rarity             as string,
      rarityColor:       `#${r.rarity_color as string}`,
      statAttack:        r.stat_attack        as number,
      critDamage:        r.crit_damage        as number,
      critChance:        r.crit_chance        as number,
      accuracy:          r.accuracy           as number,
      penetration:       r.penetration        as number,
      chain:             r.chain              as number,
      weight:            r.weight             as number,
      resourcePoolSize:  r.resource_pool_size as number,
      resourceRegenRate: r.resource_regen_rate as number,
      resourceName:      r.resource_name      as string,
      modifier:          r.modifier           as string | null,
      level:             r.level              as number,
      skills: skillResult.rows.map((sr) => ({
        id: sr.id as number,
        name: (sr.skill_name ?? sr.name) as string,
        art: sr.art as string | null,
        basePower: (sr.base_power ?? sr.power) as number,
        resourceCost: sr.resource_cost as number,
      })),
    }
  }))

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.25em', color: '#8a8e96', textTransform: 'uppercase', marginBottom: '6px' }}>
          Inventory · Weapon Collection
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: '#f2f0ea', lineHeight: 1 }}>
            Gears
          </h1>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#5a5e66', textTransform: 'uppercase' }}>
            {gears.length} Weapons
          </span>
        </div>
      </div>

      {gears.length === 0 ? (
        <div style={{ background: '#14171c', border: '1px dashed #3a3f48', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.25em', color: '#5a5e66', textTransform: 'uppercase' }}>
            — No Weapons Acquired —
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#3a3f48', textTransform: 'uppercase', marginTop: '12px' }}>
            Weapons are found on missions and in the store
          </div>
        </div>
      ) : (
        <GearsGrid gears={gears} />
      )}
    </div>
  )
}
