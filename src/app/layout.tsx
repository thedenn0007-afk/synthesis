import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Synaptic — AI Engineering Learning',
  description: 'Adaptive learning platform for AI engineering',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-[#e8e8f0] antialiased font-sans">{children}</body>
    </html>
  )
}
