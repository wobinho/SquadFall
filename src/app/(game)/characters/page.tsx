import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CharactersGrid } from './CharactersGrid'
import type { CharacterRow } from './types'

export default async function CharactersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await db.execute({
    sql: `
      SELECT
        ci.id           AS instance_id,
        c.id            AS character_id,
        c.name,
        c.art,
        c.faction,
        c.class_name,
        ci.level,
        c.stat_hp,
        c.stat_speed,
        c.stat_defense,
        c.stat_fortitude,
        c.stat_focus
      FROM character_instances ci
      JOIN characters c ON c.id = ci.character_id
      WHERE ci.user_id = ?
      ORDER BY ci.acquired_at ASC
    `,
    args: [session.userId],
  })

  const characters: CharacterRow[] = result.rows.map((r) => ({
    instanceId:    r.instance_id   as number,
    characterId:   r.character_id  as number,
    name:          r.name          as string,
    art:           r.art           as string | null,
    faction:       r.faction       as string,
    className:     r.class_name    as string,
    level:         r.level         as number,
    statHp:        r.stat_hp       as number,
    statSpeed:     r.stat_speed    as number,
    statDefense:   r.stat_defense  as number,
    statFortitude: r.stat_fortitude as number,
    statFocus:     r.stat_focus    as number,
  }))

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
