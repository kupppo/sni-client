'use client'

import { useSNI } from '@/lib/sni'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resetSystem, resetToMenu } from '@/lib/sni/api'
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
    if (data.error.message.includes('NoConnection')) {
      return (
        <article className="max-w-xl">
          <h1 className="text-3xl font-bold mb-2">Cannot connect to SNI</h1>
          <p className="mb-12">
            Unfortunately, we cannot connect to SNI on your machine.
            <br />
            Here are some ideas to get everything up and running.
          </p>
          <h2 className="text-xl font-bold mb-1">Verify that SNI is running</h2>
          <p className="mb-2">
            You should be able to see SNI in your taskbar / menubar / systray.
          </p>
          <p className="mb-12">
            If you do not see SNI here, please{' '}
            <a
              href="https://github.com/alttpo/sni/releases/latest"
              target="_blank"
            >
              download the latest version
            </a>{' '}
            and follow the instructions{' '}
            <a
              href="https://github.com/alttpo/sni?tab=readme-ov-file#for-end-users"
              target="_blank"
            >
              "For End Users"
            </a>{' '}
            in the README.
          </p>
          <h2 className="text-xl font-bold mb-1">
            Ensure you are using the latest version
          </h2>
          <p className="mb-2">
            This client requires version{' '}
            <span className="font-mono text-sm">v0.0.89</span> or later.
          </p>
          <p className="mb-12">
            Please download and install{' '}
            <a
              href="https://github.com/alttpo/sni/releases/latest"
              target="_blank"
            >
              the latest version
            </a>{' '}
            of SNI to make sure you are up to date.
          </p>
        </article>
      )
    } else {
      return <div>Unknown error</div>
    }
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
                      await resetSystem(data.current.uri)
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
                      await resetToMenu(data.current.uri)
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
