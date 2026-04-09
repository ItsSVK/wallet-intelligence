import { Geist_Mono, Inter } from 'next/font/google'

import './globals.css'
import { FloatingThemeToggle } from '@/components/floating-theme-toggle'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Wallet Intelligence',
  description: 'AI-powered Solana wallet behavioral analysis',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', inter.variable)}
    >
      <body>
        <ThemeProvider>
          <FloatingThemeToggle />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
