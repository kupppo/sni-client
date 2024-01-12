import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { sni, sniClient } from '@/lib/sni'

let transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8190',
})

const DevicesClient = new sniClient.DevicesClient(transport)
const DeviceControlClient = new sniClient.DeviceControlClient(transport)
const FSClient = new sniClient.DeviceFilesystemClient(transport)
const DeviceInfoClient = new sniClient.DeviceInfoClient(transport)

const CAPABILITIES = {
  None: 0,
  ReadMemory: 1,
  WriteMemory: 2,
  ExecuteASM: 3,
  ResetSystem: 4,
  PauseUnpauseEmulation: 5,
  PauseToggleEmulation: 6,
  ResetToMenu: 7,
  FetchFields: 8,
  ReadDirectory: 10,
  MakeDirectory: 11,
  RemoveFile: 12,
  RenameFile: 13,
  PutFile: 14,
  GetFile: 15,
  BootFile: 16,
  NWACommand: 20,
}

const mapCapabilities = (input: number[]) =>
  input.map((capability) => {
    return Object.keys(CAPABILITIES).find(
      (key) => CAPABILITIES[key as keyof typeof CAPABILITIES] === capability,
    )
  })

const fetchFields = () => {
  const clone = { ...sni.Field }
  // remove all keys that are numbers
  Object.keys(clone).forEach((key: string | number) => {
    if (!isNaN(Number(key))) {
      delete clone[key as keyof typeof clone]
    }
  })
  return clone
}

const FIELDS = fetchFields()

const mapFields = (input: string[]) => {
  return input.map((field) => {
    return Object.keys(FIELDS).find(
      (key) => FIELDS[key as keyof typeof FIELDS] === field,
    )
  })
}

const validatePath = (path: string) => {
  try {
    if (path.length === 0) {
      throw new Error('No path provided')
    }
    return true
  } catch (err: unknown) {
    const error = err as Error
    console.error(`Could not validate path '${path}':`, error.message)
    throw error
  }
}

export const listDevices = async () => {
  try {
    const req = sni.DevicesRequest.create()
    const devicesCall = await DevicesClient.listDevices(req)
    const devices: any[] = devicesCall.response.devices.map((device) => {
      const rawCapabilities = device.capabilities
      const capabilities = mapCapabilities(device.capabilities)
      return { ...device, capabilities, rawCapabilities }
    })

    // if (devices.length === 0) {
    //   throw new Error('No devices found')
    // }

    return {
      connected: devices.length > 0,
      devices,
      // TODO: Make this configurable and rememberable
      current: devices[0],
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('listDevices', error.message)
    throw new Error('NoConnection')
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

export const resetSystem = async (uri: string) => {
  const req = sni.ResetSystemRequest.create({ uri })
  const call = await DeviceControlClient.resetSystem(req)
  return call.response
}

export const resetToMenu = async (uri: string) => {
  const req = sni.ResetToMenuRequest.create({ uri })
  const call = await DeviceControlClient.resetToMenu(req)
  return call.response
}

export const putFile = async (
  uri: string,
  path: string,
  fileContents: Uint8Array,
) => {
  validatePath(path)

  const req = sni.PutFileRequest.create({ uri, path, data: fileContents })
  await FSClient.putFile(req)
  return path
}

export const bootFile = async (uri: string, path: string) => {
  validatePath(path)

  const req = sni.BootFileRequest.create({ uri, path })
  await FSClient.bootFile(req)
  return path
}

export const deleteFile = async (uri: string, path: string) => {
  validatePath(path)

  const req = sni.RemoveFileRequest.create({ uri, path })
  await FSClient.removeFile(req)
  return path
}

export const getFields = async (uri: string, inputFields: string[]) => {
  const fields = inputFields.filter(
    (field) => FIELDS[field as keyof typeof FIELDS],
  )
  if (fields.length === 0) {
    throw new Error('No valid fields provided')
  }
  const req = sni.FieldsRequest.create({ uri, fields: [sni.Field.RomFileName] })
  const call = await DeviceInfoClient.fetchFields(req)
  // const call = await DeviceControlClient.state(req)
  // const call = await DeviceControlClient.state(req)
  return call.response
}

export const currentScreen = async (uri: string) => {
  try {
    const req = await getFields(uri, ['RomFileName'])
    if (req.values[0] !== '/sd2snes/m3nu.bin') {
      return 'game'
    }
    return 'menu'
  } catch (err: unknown) {
    const error = err as Error
    console.error('currentScreen', error.message)
    return 'menu'
  }
}
