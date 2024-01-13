'use client'

import SNIClient from '@repo/sni'
import useSWR from 'swr'
import { useEffect, useState } from 'react'

let CLIENT = new SNIClient()

export const SNI = CLIENT

const fetcher = async (key: string | string[] | null) => {
  if (!key) {
    return null
  }
  switch (true) {
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
  const [clientReady, setClientReady] = useState(false)
  useEffect(() => {
    const autoConnect = async () => {
      await SNI.connect()
      setClientReady(true)
    }
    autoConnect()
    // TODO: Set up an event to listen to when the device is disconnected to
    // remove the connectedURI
  }, [])
  const { data, ...hook } = useSWR(clientReady && key, {
    ...opts,
    fetcher,
  })
  return { ...data, ...hook }
}
