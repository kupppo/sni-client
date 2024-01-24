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

const useSNIClient = () => {
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    const onConnect = () => {
      // console.log('SNI Hook: connected')
      setClientReady(true)
    }
    const onDisconnect = () => {
      // console.log('SNI Hook: disconnected')
      setClientReady(false)
    }
    const onError = (err: any) => {
      console.log('SNI Hook: error', err)
      setError(err)
    }
    CLIENT.on('connected', onConnect)
    CLIENT.on('disconnected', onDisconnect)
    CLIENT.on('error', onError)
    const autoConnect = async () => {
      await CLIENT.connect()
    }
    if (mounted) {
      autoConnect()
    } else {
      setMounted(true)
    }
    return () => {
      CLIENT.off('connected', onConnect)
      CLIENT.off('disconnected', onDisconnect)
      CLIENT.off('error', onError)
    }
  }, [clientReady, mounted, setMounted, setClientReady])

  const hook = useSWR(clientReady && mounted && 'SNI', {
    fetcher: () => {
      console.log('fetching SNI client', CLIENT)
      return CLIENT
    },
  })
  return { ...hook, error: error || hook.error }
}

export const useSNI = (key: string | string[], opts?: object) => {
  const client = useSNIClient()
  const swrKey = client.data && key
  const { data, mutate, ...hook } = useSWR(swrKey, { ...opts, fetcher })
  return {
    ...data,
    mutate,
    ...hook,
    isLoading: hook.isLoading || !swrKey,
    error: client.error || hook.error,
  }
}
