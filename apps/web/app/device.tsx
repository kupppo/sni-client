'use client'

import { useSNI } from '@/lib/sni'
import { Badge } from '@/components/ui/badge'
import { PropsWithChildren } from 'react'

const Label = (props: PropsWithChildren) => (
  <span className="font-bold block w-32">{props.children}</span>
)

const Value = (props: PropsWithChildren) => (
  <span className="font-mono text-sm">{props.children}</span>
)

export default function DeviceView(): JSX.Element {
  const data = useSNI('devices', { refreshInterval: 50 })
  const connected = data?.connected

  if (data.isLoading) {
    return <div>Loading...</div>
  }

  if (connected) {
    return (
      <div>
        <div className="-ml-2 mb-4">
          <Badge variant="connected">Connected</Badge>
        </div>
        <div className="flex mb-2">
          <Label>Name</Label>
          <Value>{data.current.displayName}</Value>
        </div>
        <div className="flex mb-2">
          <Label>Kind</Label>
          <Value>{data.current.kind}</Value>
        </div>
        <div className="flex mb-2">
          <Label>URI</Label>
          <Value>{data.current.uri}</Value>
        </div>
        {data.current.capabilities.length > 0 && (
          <div className="flex mb-2">
            <Label>Capabilities</Label>
            <ul className="list-none">
              {data.current.capabilities.map((capability: string) => (
                <li key={capability}>
                  <Value>{capability}</Value>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return <div>No device connected</div>
}
