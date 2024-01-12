'use client'

import { useSNI } from '@/lib/sni'
import SNIError from '@/components/sniError'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SNI } from '@/lib/sni'
import { toast } from 'sonner'
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

  if (data.error) {
    return <SNIError error={data.error} />
  }

  if (connected) {
    return (
      <div>
        <div className="-ml-2 mb-4">
          <Badge variant="connected">Connected</Badge>
        </div>
        <div className="flex gap-12">
          <div>
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
          <div>
            {data.current.capabilities.includes('ResetSystem') && (
              <div className="mb-4">
                <Button
                  variant="default"
                  onClick={async (evt) => {
                    try {
                      evt.preventDefault()
                      await SNI.resetSystem(data.current.uri)
                    } catch (err) {
                      const error = err as Error
                      const notConfigured = error.message.includes(
                        'device not configured',
                      )
                      if (notConfigured) {
                        toast.error('Device is not configured', {
                          description: 'Please try again shortly',
                        })
                      } else {
                        console.error(error)
                        toast.error('Failed to reset system')
                      }
                    }
                  }}
                >
                  Reset System
                </Button>
              </div>
            )}
            {data.current.capabilities.includes('ResetToMenu') && (
              <div>
                <Button
                  variant="outline"
                  onClick={async (evt) => {
                    try {
                      evt.preventDefault()
                      await SNI.resetToMenu(data.current.uri)
                    } catch (err) {
                      const error = err as Error
                      const notConfigured = error.message.includes(
                        'device not configured',
                      )
                      if (notConfigured) {
                        toast.error('Device is not configured', {
                          description: 'Please try again shortly',
                        })
                      } else {
                        console.error(error)
                        toast.error('Failed to reset to menu')
                      }
                    }
                  }}
                >
                  Reset to Menu
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <div>No device connected</div>
}
