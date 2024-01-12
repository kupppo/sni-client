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
      if (!key[1] || !key[2]) {
        throw new Error('Invalid URI or path')
      }
      return {
        data: await SNI.readDirectory(key[1]),
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
  }, [])
  const { data, ...hook } = useSWR(clientReady && key, {
    ...opts,
    fetcher,
  })
  return { ...data, ...hook }
}
