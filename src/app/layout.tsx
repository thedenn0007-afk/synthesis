import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Synaptic — AI Engineering Learning',
  description: 'Adaptive learning platform for AI engineering',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Theme init — runs before paint to prevent flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('synaptic-theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-c-bg text-c-text antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
