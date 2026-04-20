import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Squadfall',
  description: 'Tactical zombie squad combat',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
