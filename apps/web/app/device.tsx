'use client'

import { useSNI } from '@/lib/sni'

export default function DeviceView(): JSX.Element {
  const data = useSNI()
  const connected = data?.connected

  if (data.isLoading) {
    return <div>Loading...</div>
  }

  if (connected) {
    return (
      <div>
        <p>Name: {data.current.displayName}</p>
        <p>Kind: {data.current.kind}</p>
        <p>URI: {data.current.uri}</p>
      </div>
    )
  }

  return <div>No device connected</div>
}
