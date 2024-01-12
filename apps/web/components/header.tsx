'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import Status from './status'
import { useSNI } from '@/lib/sni'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { usePathname } from 'next/navigation'

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span className={'text-xs'} style={{ fontFamily: 'var(--font-geist-mono)' }}>
    {children}
  </span>
)

const getDeviceDisplay = (sniName: string) => {
  switch (sniName) {
    case 'fxpakpro':
      return 'FX Pak Pro'
    default:
      return ''
  }
}

const ConnectionStatus = () => {
  const data = useSNI('devices', { refreshInterval: 50 })
  const connected = data?.connected
  if (data.isLoading) {
    return (
      <Button variant="ghost" size="xs">
        <Status status="pending" label="Connecting" />
      </Button>
    )
  }
  if (data.error) {
    return (
      <Button variant="ghost" size="xs">
        <Status status="error" label="Error" />
      </Button>
    )
  }
  if (connected) {
    const deviceDisplay = getDeviceDisplay(data.current.kind)
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs">
            <Status status="connected" label={deviceDisplay} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-120">
          <div className={cn('text-sm')}>
            <p>
              <strong>Device Name</strong>
              <br />
              <Mono>{data.current.displayName}</Mono>
            </p>
            <br />
            <p>
              <strong>URI</strong>
              <br />
              <Mono>{data.current.uri}</Mono>
              <br />
            </p>
            <br />
            <p>
              <strong>Kind</strong>
              <br />
              <Mono>{data.current.kind}</Mono>
              <br />
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
  return <Status status="disconnected" label="Disconnected" />
}

export default function SiteHeader() {
  const LINKS = [
    {
      href: '/',
      label: 'Devices',
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
                  usePathname() === href && 'border-primary',
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
