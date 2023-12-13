'use client'

import useSWR from 'swr'
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { sni, sniClient } from '@/lib/sni'

let transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8190',
})
const DevicesClient = new sniClient.DevicesClient(transport)

const fetcher = async () => {
  try {
    const req = sni.DevicesRequest.create()
    const devicesCall = await DevicesClient.listDevices(req)
    const devices: any[] = devicesCall.response.devices

    if (devices.length === 0) {
      throw new Error('No devices found')
    }

    return {
      connected: devices.length > 0,
      devices,
      // TODO: Make this configurable and rememberable
      current: devices[0],
    }
  } catch (error) {
    return { connected: false, devices: [], current: null }
  }
}

export const useSNIConnected = () => {
  const { data, ...hook } = useSWR(`ListDevices`, {
    refreshInterval: 50,
    fetcher,
  })
  return { ...data, ...hook }
}
