import { createClient } from '@libsql/client'
import path from 'path'

const url = `file:${path.join(process.cwd(), 'squadfall.db')}`

export const db = createClient({ url })

let initialized = false

export async function initDb() {
  if (initialized) return
  initialized = true
}

export default db
