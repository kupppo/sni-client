'use client'

import Status from './status'
import { useSNI } from '@/lib/sni'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const Mono = ({ children }: { children: React.ReactNode }) => (
  <span className={'text-xs'} style={{ fontFamily: 'var(--font-geist-mono)' }}>
    {children}
  </span>
)

const getDeviceDisplay = (sniName: string) => {
  switch (sniName) {
    case 'fxpakpro':
      return 'FX Pak Pro'
    case 'luabridge':
      return 'Luabridge'
    default:
      return ''
  }
}

const ConnectionStatus = () => {
  const { data, isLoading, error } = useSNI('connectedDevice', {
    refreshInterval: 50,
  })
  if (isLoading) {
    return (
      <Button variant="ghost" size="xs">
        <Status status="pending" label="Connecting" />
      </Button>
    )
  }
  if (error) {
    return (
      <Button variant="ghost" size="xs">
        <Status status="error" label="Error" />
      </Button>
    )
  }
  if (data) {
    const deviceDisplay = getDeviceDisplay(data.kind)
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
              <Mono>{data.displayName}</Mono>
            </p>
            <br />
            <p>
              <strong>URI</strong>
              <br />
              <Mono>{data.uri}</Mono>
              <br />
            </p>
            <br />
            <p>
              <strong>Kind</strong>
              <br />
              <Mono>{data.kind}</Mono>
              <br />
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
  return <Status status="disconnected" label="Disconnected" />
}

export default ConnectionStatus
