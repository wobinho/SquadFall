import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import db from '@/lib/db'
import type { InValue } from '@libsql/client'

const ALLOWED_TABLES = [
  'users', 'characters', 'character_instances',
  'gears', 'gear_instances', 'skills', 'skill_instances',
  'runs', 'passive', 'faction', 'modifier', 'modifier_effect',
]

function assertAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.isAdmin !== 1) throw new Error('Unauthorized')
}

function assertTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) throw new Error(`Table "${table}" not allowed`)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    assertAdmin(session)

    const { searchParams } = new URL(req.url)
    const table = searchParams.get('table')

    if (!table) {
      // Return schema for all tables
      const schema: Record<string, { name: string; type: string }[]> = {}
      for (const t of ALLOWED_TABLES) {
        const info = await db.execute(`PRAGMA table_info(${t})`)
        schema[t] = info.rows.map((r) => ({ name: r.name as string, type: r.type as string }))
      }
      const counts: Record<string, number> = {}
      for (const t of ALLOWED_TABLES) {
        const r = await db.execute(`SELECT COUNT(*) as n FROM ${t}`)
        counts[t] = r.rows[0].n as number
      }
      return NextResponse.json({ schema, counts })
    }

    assertTable(table)
    const [result, pragmaResult] = await Promise.all([
      db.execute(`SELECT * FROM ${table} LIMIT 500`),
      db.execute(`PRAGMA table_info(${table})`),
    ])
    const typeMap: Record<string, string> = {}
    for (const r of pragmaResult.rows) typeMap[r.name as string] = r.type as string

    const colNames = result.columns
    const rows = result.rows.map((r) => {
      const obj: Record<string, unknown> = {}
      colNames.forEach((col, i) => { obj[col] = r[i] })
      return obj
    })
    const columns = colNames.map((name) => ({ name, type: typeMap[name] ?? '' }))
    return NextResponse.json({ rows, columns })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 403 : 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    assertAdmin(session)

    const body = await req.json()
    const { table, row } = body as { table: string; row: Record<string, unknown> }
    assertTable(table)

    const cols = Object.keys(row)
    const vals = Object.values(row) as InValue[]
    const placeholders = cols.map(() => '?').join(', ')

    await db.execute({
      sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      args: vals,
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 403 : 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    assertAdmin(session)

    const body = await req.json()
    const { table, id, updates } = body as { table: string; id: number; updates: Record<string, unknown> }
    assertTable(table)

    const sets = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
    const vals = [...Object.values(updates), id] as InValue[]

    await db.execute({
      sql: `UPDATE ${table} SET ${sets} WHERE id = ?`,
      args: vals,
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 403 : 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    assertAdmin(session)

    const body = await req.json()
    const { table, id } = body as { table: string; id: number }
    assertTable(table)

    await db.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [id] })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 403 : 400 })
  }
}
