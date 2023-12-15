import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { sni, sniClient } from '@/lib/sni'

let transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8190',
})

const DevicesClient = new sniClient.DevicesClient(transport)
const FSClient = new sniClient.DeviceFilesystemClient(transport)

export const listDevices = async () => {
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

const getFolders = (input: any[], path: string) => {
  const ignoreFolders = ['System Volume Information']
  const folders = input
    .filter(
      (entry: any) =>
        !entry.name.startsWith('.') && !ignoreFolders.includes(entry.name),
    )
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  return folders.map((entry) => ({
    ...entry,
    path: [path, entry.name].join('/').replace('//', '/'),
  }))
}

const getFiles = (input: any[], path: string) => {
  const files = input
    .filter((entry: any) => !entry.name.startsWith('.'))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  return files.map((entry) => ({
    ...entry,
    path: [path, entry.name].join('/').replace('//', '/'),
  }))
}

export const readDirectory = async (uri: string, path: string) => {
  const req = sni.ReadDirectoryRequest.create({ path, uri })
  const call = await FSClient.readDirectory(req)
  const data = call.response.entries
  const rawFiles = data.filter((entry) => entry.type === 1)
  const rawFolders = data.filter((entry) => entry.type === 0)
  const folders = getFolders(rawFolders, path)
  const files = getFiles(rawFiles, path)
  return folders.concat(files)
}
