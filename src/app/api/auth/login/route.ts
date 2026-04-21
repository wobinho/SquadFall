import { NextRequest, NextResponse } from 'next/server'
import { scryptSync } from 'crypto'
import { createSession, COOKIE_NAME } from '@/lib/auth'
import { db, initDb } from '@/lib/db'

function verifyPassword(password: string, hash: string): boolean {
  // Handle legacy 'hashed' special case (dev account with password 'commander')
  if (hash === 'hashed') {
    return password === 'commander'
  }

  // Verify scrypt hashed password
  if (!hash.includes(':')) return false

  const [salt, storedHash] = hash.split(':')
  const computedHash = scryptSync(password, salt, 32).toString('hex')
  console.log('Password verification:', { salt, storedHashLength: storedHash.length, computedHashLength: computedHash.length, match: computedHash === storedHash })
  return computedHash === storedHash
}

async function checkPassword(
  username: string,
  password: string
): Promise<{ id: number; username: string; isAdmin: number } | null> {
  await initDb()
  const result = await db.execute({ sql: 'SELECT id, username, password_hash, isAdmin FROM users WHERE username = ?', args: [username] })
  const user = result.rows[0] as unknown as
    | { id: number; username: string; password_hash: string; isAdmin: number }
    | undefined
  if (!user) return null

  const valid = verifyPassword(password, user.password_hash)

  if (!valid) return null
  return { id: user.id, username: user.username, isAdmin: Number(user.isAdmin) }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { username, password } = body as { username?: string; password?: string }

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const user = await checkPassword(username, password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await createSession({ userId: user.id, username: user.username, isAdmin: user.isAdmin })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
