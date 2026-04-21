import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { initDb } from '@/lib/db'
import GameSidebar from '@/components/layout/GameSidebar'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  await initDb()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }} className="game-layout">
      <GameSidebar username={session.username} isAdmin={session.isAdmin === 1} />
      <main style={{
        flex: 1, minWidth: 0,
        padding: '40px 32px 80px',
        overflowY: 'auto',
      }} className="game-main">
        {children}
      </main>
    </div>
  )
}
