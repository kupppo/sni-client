'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import ConnectionStatus from './connectionStatus'

export default function SiteHeader() {
  const currentPath = usePathname()
  const LINKS = [
    {
      href: '/',
      label: 'Device',
    },
    {
      href: '/files',
      label: 'Files',
    },
  ]

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      )}
    >
      <div className={cn('container flex items-center justify-between py-4')}>
        <div className={cn('flex items-baseline')}>
          <Link href="/" className={cn('text-md font-normal mr-12')}>
            SNI Web Client
          </Link>
          <nav
            className={cn('flex items-center text-sm font-medium space-x-4')}
          >
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'border-b border-transparent hover:border-primary transition-colors',
                  currentPath === href && 'border-primary',
                )}
              >
                <div className={cn('pb-1 px-0.5')}>{label}</div>
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <ConnectionStatus />
        </div>
      </div>
    </header>
  )
}
