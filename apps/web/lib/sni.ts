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
  useEffect(() => {
    setMounted(true)
  }, [mounted])
  const { data, ...hook } = useSWR(mounted && key, {
    ...opts,
    fetcher,
  })
  return { ...data, ...hook }
}
