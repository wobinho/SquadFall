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
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  }

  await initDb()

  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: [username],
  })

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const hashedPassword = hashPassword(password)
  console.log('Resetting password for', username, 'new hash:', hashedPassword)

  const result = await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
    args: [hashedPassword, username],
  })

  console.log('Update result:', result)

  return NextResponse.json({ ok: true })
}
