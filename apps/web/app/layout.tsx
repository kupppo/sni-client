import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { cn } from '../lib/utils'
import Header from '@/components/header'

export const metadata: Metadata = {
  title: 'SNI Web Client',
  description: 'A web interface for SNI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable)}
      suppressHydrationWarning
    >
      <body className={cn('min-h-screen bg-background antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <div className="container">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
