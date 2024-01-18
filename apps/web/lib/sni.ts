'use client'

import SNIClient from '@repo/sni'
import useSWR from 'swr'
import { useEffect, useState } from 'react'

let CLIENT = new SNIClient({
  verbose: true,
})

export const SNI = CLIENT

const fetcher = async (key: string | string[] | null) => {
  if (!key) {
    return null
  }
  switch (true) {
    case key === 'connectedDevice':
      return { data: await SNI.connectedDevice() }
    case key === 'devices':
      return await SNI.listDevices()
    case key.includes('readDirectory'):
      return {
        data: await SNI.readDirectory(key[1] as string),
      }
    case key === 'currentScreen':
      return { data: await SNI.currentScreen() }
    default:
      return null
  }
}

export const useSNI = (key: string | string[], opts?: object) => {
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  useEffect(() => {
    setMounted(true)
    SNI.on('connected', () => {
      console.log('client connected')
      setClientReady(true)
    })
    // on disconnect, send invalidation signal
    SNI.on('disconnected', () => {
      console.log('client disconnected :(')
    })
  }, [mounted])
  const { data, ...hook } = useSWR(clientReady && mounted && key, {
    ...opts,
    fetcher,
  })
  return { ...data, ...hook }
}
