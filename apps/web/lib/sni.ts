'use client'

import SNIClient from '@repo/sni'
import useSWR from 'swr'
import { useEffect, useState } from 'react'

let CLIENT = new SNIClient({
  autoConnect: false,
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
    const onConnect = () => setClientReady(true)
    const onDisconnect = () => setClientReady(false)
    SNI.on('connected', onConnect)
    SNI.on('disconnected', onDisconnect)
    const autoConnect = async () => {
      await SNI.connect()
    }
    if (mounted) {
      autoConnect()
    } else {
      setMounted(true)
    }
    return () => {
      SNI.off('connected', onConnect)
      SNI.off('disconnected', onDisconnect)
    }
  }, [mounted])

  const swrKey = clientReady && mounted && key
  const { data, ...hook } = useSWR(swrKey, { ...opts, fetcher })

  return { ...data, ...hook }
}
