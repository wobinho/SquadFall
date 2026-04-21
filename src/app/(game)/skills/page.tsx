import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { SkillsGrid } from './SkillsGrid'
import type { SkillCardData, GearSlotData } from './SkillsGrid'

const MAX_SKILLS_PER_GEAR = 3

export default async function SkillsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Skills with owned/equipped counts
  const skillsResult = await db.execute({
    sql: `
      SELECT
        s.id,
        s.skill_name,
        s.base_power,
        s.resource_cost,
        s.art,
        s.description,
        COUNT(si.id)                                          AS owned,
        SUM(CASE WHEN si.equipped_to != 0 THEN 1 ELSE 0 END) AS equipped
      FROM skills s
      JOIN skill_instances si ON si.skill_id = s.id AND si.user_id = ?
      GROUP BY s.id
      ORDER BY s.id ASC
    `,
    args: [session.userId],
  })

  const skills: SkillCardData[] = skillsResult.rows.map((r) => ({
    id:           r.id            as number,
    name:         r.skill_name    as string,
    art:          r.art           as string | null,
    basePower:    r.base_power    as number,
    resourceCost: r.resource_cost as number,
    description:  r.description   as string | null,
    owned:        r.owned         as number,
    equipped:     (r.equipped ?? 0) as number,
  }))

  // Gear instances with slot availability for the infuse panel
  const gearsResult = await db.execute({
    sql: `
      SELECT
        gi.id             AS instance_id,
        g.name,
        g.art,
        g.subcategory,
        g.category,
        COUNT(si.id)      AS slots_used
      FROM gear_instances gi
      JOIN gears g ON g.id = gi.gear_id
      LEFT JOIN skill_instances si ON si.equipped_to = gi.id
      WHERE gi.user_id = ?
      GROUP BY gi.id
      ORDER BY gi.acquired_at ASC
    `,
    args: [session.userId],
  })

  const gearSlots: GearSlotData[] = gearsResult.rows.map((r) => ({
    instanceId:    r.instance_id as number,
    name:          r.name        as string,
    art:           r.art         as string | null,
    subcategory:   r.subcategory as string,
    category:      r.category    as string,
    slotsUsed:     r.slots_used  as number,
    slotsTotal:    MAX_SKILLS_PER_GEAR,
  }))

  const totalOwned = skills.reduce((acc, s) => acc + s.owned, 0)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.25em',
          color: '#c53030',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Ability Codex · Combat Skills
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '40px',
            letterSpacing: '0.04em',
            color: '#f2f0ea',
            lineHeight: 1,
          }}>
            Skills
          </h1>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: '#5a5e66',
            textTransform: 'uppercase',
          }}>
            {skills.length} Unique · {totalOwned} Total
          </span>
        </div>
      </div>

      {skills.length === 0 ? (
        <div style={{
          background: '#14171c',
          border: '1px dashed #3a3f48',
          padding: '80px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.25em',
            color: '#5a5e66',
            textTransform: 'uppercase',
          }}>
            — No Skills Acquired —
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: '#3a3f48',
            textTransform: 'uppercase',
            marginTop: '12px',
          }}>
            Visit the store to acquire skills
          </div>
        </div>
      ) : (
        <SkillsGrid skills={skills} gearSlots={gearSlots} />
      )}
    </div>
  )
}
