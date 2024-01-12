'use client'

import SNIClient from '@repo/sni'
import useSWR from 'swr'

export const SNI = new SNIClient()

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
        data: await SNI.readDirectory(key[2], key[1]),
      }
    case key.includes('currentScreen'):
      if (!key[1]) {
        throw new Error('Invalid URI')
      }
      return { data: await SNI.currentScreen(key[1]) }
    default:
      return null
  }
}

export const useSNI = (key: string | string[], opts?: object) => {
  const { data, ...hook } = useSWR(key, {
    ...opts,
    fetcher,
  })
  return { ...data, ...hook }
}
