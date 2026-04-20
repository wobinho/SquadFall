import { NextRequest, NextResponse } from 'next/server'
import { createSession, COOKIE_NAME } from '@/lib/auth'
import { db, initDb } from '@/lib/db'

async function checkPassword(
  username: string,
  password: string
): Promise<{ id: number; username: string } | null> {
  await initDb()
  const result = await db.execute({ sql: 'SELECT id, username, password_hash FROM users WHERE username = ?', args: [username] })
  const user = result.rows[0] as unknown as
    | { id: number; username: string; password_hash: string }
    | undefined
  if (!user) return null
  const valid =
    user.password_hash === 'hashed'
      ? password === 'commander'
      : user.password_hash === password
  if (!valid) return null
  return { id: user.id, username: user.username }
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

  const token = await createSession({ userId: user.id, username: user.username })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
