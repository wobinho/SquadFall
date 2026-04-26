import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'

function assertAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.isAdmin !== 1) throw new Error('Unauthorized')
}

export async function GET() {
  try {
    const session = await getSession()
    assertAdmin(session)

    const [characters, gears, skills, enemies, enemySkills] = await Promise.all([
      db.execute(`
        SELECT
          c.id, c.name, c.art, c.class_name,
          c.stat_hp, c.stat_speed, c.stat_defense, c.stat_fortitude, c.stat_focus,
          f.faction_name, f.faction_color
        FROM characters c
        LEFT JOIN faction f ON f.id = c.faction
        ORDER BY c.name ASC
      `),
      db.execute(`
        SELECT
          g.id, g.name, g.art, g.category, g.subcategory,
          g.stat_attack, g.crit_damage, g.crit_chance,
          g.resource_pool_size, g.resource_regen_rate, g.resource_name
        FROM gears g
        ORDER BY g.name ASC
      `),
      db.execute(`
        SELECT id, skill_name AS name, base_power, resource_cost, art
        FROM skills
        ORDER BY skill_name ASC
      `),
      db.execute(`
        SELECT id, enemy_name, enemy_race, enemy_type, art,
               stat_hp, stat_atk, stat_def, stat_speed
        FROM enemy
        ORDER BY enemy_name ASC
      `),
      db.execute(`
        SELECT id, enemy_skill_name AS name, enemy_skill_description AS description, base_power
        FROM enemy_skills
        ORDER BY enemy_skill_name ASC
      `),
    ])

    return NextResponse.json({
      characters: characters.rows.map(r => ({
        id: r.id,
        name: r.name,
        art: r.art,
        className: r.class_name,
        statHp: r.stat_hp,
        statSpeed: r.stat_speed,
        statDefense: r.stat_defense,
        statFortitude: r.stat_fortitude,
        statFocus: r.stat_focus,
        factionName: r.faction_name ?? '',
        factionColor: r.faction_color ? '#' + String(r.faction_color).replace(/^#/, '') : '#6a7d5a',
      })),
      gears: gears.rows.map(r => ({
        id: r.id,
        name: r.name,
        art: r.art,
        category: r.category,
        subcategory: r.subcategory,
        statAttack: r.stat_attack,
        critDamage: r.crit_damage,
        critChance: r.crit_chance,
        resourcePoolSize: r.resource_pool_size,
        resourceRegenRate: r.resource_regen_rate,
        resourceName: r.resource_name,
      })),
      skills: skills.rows.map(r => ({
        id: r.id,
        name: r.name,
        basePower: r.base_power,
        resourceCost: r.resource_cost,
        art: r.art,
      })),
      enemies: enemies.rows.map(r => ({
        id: r.id,
        name: r.enemy_name,
        race: r.enemy_race,
        type: r.enemy_type,
        art: r.art,
        statHp: r.stat_hp,
        statAtk: r.stat_atk,
        statDef: r.stat_def,
        statSpeed: r.stat_speed,
      })),
      enemySkills: enemySkills.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        basePower: r.base_power,
      })),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 403 : 400 })
  }
}
