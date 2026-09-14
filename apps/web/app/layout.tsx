import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { cn } from '../lib/utils'

export const metadata: Metadata = {
  title: 'SNI Web Client',
  description: 'A web interface for SNI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <body className={cn('min-h-screen bg-background antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <Header />
          <div className="container">{children}</div>
        </ThemeProvider>
        <Toaster position="bottom-right" theme="system" />
        <Analytics />
      </body>
    </html>
  )
}
