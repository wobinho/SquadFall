import { createClient } from '@libsql/client'
import path from 'path'

const url = `file:${path.join(process.cwd(), 'squadfall.db')}`

export const db = createClient({ url })

let initialized = false

export async function initDb() {
  if (initialized) return
  initialized = true

  // Tables already exist in the user-managed squadfall.db — only seed missing data.
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: ['commander'],
  })
  if (existing.rows.length > 0) return

  // Seed the test user
  await db.execute({
    sql: 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    args: ['commander', 'test@squadfall.com', 'hashed'],
  })

  const userRow = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: ['commander'],
  })
  const userId = userRow.rows[0].id as number

  // Seed base characters if none exist
  const charCount = await db.execute({ sql: 'SELECT COUNT(*) as n FROM characters', args: [] })
  if ((charCount.rows[0].n as number) === 0) {
    const baseChars = [
      { name: 'Mara Vega',  faction: 'ironwatch', class_name: 'Rifleman'  },
      { name: 'Dax Rourke', faction: 'rustborn',  class_name: 'Scavenger' },
      { name: 'Sable Orin', faction: 'verdant',   class_name: 'Tracker'   },
    ]
    for (const c of baseChars) {
      await db.execute({
        sql: 'INSERT INTO characters (name, faction, class_name) VALUES (?, ?, ?)',
        args: [c.name, c.faction, c.class_name],
      })
    }
  }

  // Give the commander one instance of each character
  const allChars = await db.execute({ sql: 'SELECT id FROM characters', args: [] })
  for (const row of allChars.rows) {
    await db.execute({
      sql: 'INSERT INTO character_instances (user_id, character_id) VALUES (?, ?)',
      args: [userId, row.id as number],
    })
  }

  // Seed runs
  for (const [wave, status] of [[3, 'completed'], [5, 'failed'], [2, 'completed'], [7, 'active']] as const) {
    await db.execute({
      sql: 'INSERT INTO runs (user_id, wave, status) VALUES (?, ?, ?)',
      args: [userId, wave, status],
    })
  }
}

export default db
