import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

const MAX_SKILLS_PER_GEAR = 3

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { skillId, gearInstanceId } = await req.json()
  if (!skillId || !gearInstanceId) {
    return NextResponse.json({ error: 'Missing skillId or gearInstanceId' }, { status: 400 })
  }

  // Verify gear instance belongs to this user
  const gearCheck = await db.execute({
    sql: 'SELECT id FROM gear_instances WHERE id = ? AND user_id = ?',
    args: [gearInstanceId, session.userId],
  })
  if (!gearCheck.rows.length) {
    return NextResponse.json({ error: 'Gear not found' }, { status: 404 })
  }

  // Check gear has an open slot
  const slotCheck = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM skill_instances WHERE equipped_to = ?',
    args: [gearInstanceId],
  })
  const slotsUsed = slotCheck.rows[0].count as number
  if (slotsUsed >= MAX_SKILLS_PER_GEAR) {
    return NextResponse.json({ error: 'Gear has no available skill slots' }, { status: 400 })
  }

  // Find one unequipped instance of this skill owned by the user
  const freeInstance = await db.execute({
    sql: 'SELECT id FROM skill_instances WHERE skill_id = ? AND user_id = ? AND equipped_to = 0 LIMIT 1',
    args: [skillId, session.userId],
  })
  if (!freeInstance.rows.length) {
    return NextResponse.json({ error: 'No unequipped instance of this skill' }, { status: 400 })
  }

  const instanceId = freeInstance.rows[0].id as number
  await db.execute({
    sql: 'UPDATE skill_instances SET equipped_to = ? WHERE id = ?',
    args: [gearInstanceId, instanceId],
  })

  return NextResponse.json({ success: true, skillInstanceId: instanceId })
}
