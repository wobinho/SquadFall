import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { COOKIE_NAME } from './constants'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'squadfall-dev-secret-change-in-production'
)

export interface SessionPayload {
  userId: number
  username: string
  isAdmin: number
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export { COOKIE_NAME } from './constants'
