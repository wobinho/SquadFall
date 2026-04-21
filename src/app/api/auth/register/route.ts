import { NextRequest, NextResponse } from 'next/server'
import { scryptSync, randomBytes } from 'crypto'
import { db, initDb } from '@/lib/db'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, password } = body as { username?: string; password?: string }

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  await initDb()

  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: [username],
  })

  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const hashedPassword = hashPassword(password)

  await db.execute({
    sql: 'INSERT INTO users (username, password_hash, isAdmin) VALUES (?, ?, ?)',
    args: [username, hashedPassword, 0],
  })

  return NextResponse.json({ ok: true })
}
