'use client'

import useSWR from 'swr'
import { listDevices, readDirectory } from './api'

const fetcher = async (key: string | string[]) => {
  console.debug('useSNI', key)
  switch (true) {
    case key === 'devices':
      return await listDevices()
    case key.includes('readDirectory'):
      if (!key[1] || !key[2]) {
        throw new Error('Invalid URI or path')
      }
      return {
        data: await readDirectory(key[2], key[1]),
      }
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
