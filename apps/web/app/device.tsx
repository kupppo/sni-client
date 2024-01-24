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
  const { data, isLoading, error } = useSNI('connectedDevice')

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <SNIError error={error} />
  }

  if (data) {
    return (
      <div>
        <div className="-ml-2 mb-4">
          <Badge variant="connected">Connected</Badge>
        </div>
        <div className="flex gap-12">
          <div>
            <div className="flex mb-2">
              <Label>Name</Label>
              <Value>{data.displayName}</Value>
            </div>
            <div className="flex mb-2">
              <Label>Kind</Label>
              <Value>{data.kind}</Value>
            </div>
            <div className="flex mb-2">
              <Label>URI</Label>
              <Value>{data.uri}</Value>
            </div>
            {data.capabilities.length > 0 && (
              <div className="flex mb-2">
                <Label>Capabilities</Label>
                <ul className="list-none">
                  {data.capabilities.map((capability: string) => (
                    <li key={capability}>
                      <Value>{capability}</Value>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            {data.capabilities.includes('ResetSystem') && (
              <div className="mb-4">
                <Button
                  variant="default"
                  onClick={async (evt) => {
                    try {
                      evt.preventDefault()
                      await SNI.resetSystem()
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
            {data.capabilities.includes('ResetToMenu') && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={async (evt) => {
                    try {
                      evt.preventDefault()
                      await SNI.resetToMenu()
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
            <div>
              <Button
                variant="outline"
                onClick={async (evt) => {
                  evt.preventDefault()
                  const currentField = await SNI.getFields(['RomFileName'])
                  const value = currentField.values[0]
                  toast(`Current file: ${value}`)
                }}
              >
                Get Current file
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <div>No device connected</div>
}
