import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { SNI, Clients } from './lib'

export type DeviceKind = 'fxpakpro' | 'luabridge' | 'retroarch'

function setupTransport(baseUrl: string = 'http://localhost:8190') {
  return new GrpcWebFetchTransport({ baseUrl })
}

function setupClients(transport: GrpcWebFetchTransport) {
  return Object.keys(Clients).reduce((acc, key) => {
    const clientKey = key.replace('Client', '')
    acc[clientKey as string] = new Clients[key as keyof typeof Clients](transport)
    return acc
  }, {} as Record<string, any>)
}

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
  const clone = { ...SNI.Field }
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

class SNIClient {
  transport: GrpcWebFetchTransport
  clients: any

  constructor() {
    this.transport = setupTransport()
    this.clients = setupClients(this.transport)
  }

  async currentScreen (uri: string) {
    try {
      const req = await this.getFields(uri, ['RomFileName'])
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

  async bootFile (uri: string, path: string) {
    validatePath(path)
  
    const req = SNI.BootFileRequest.create({ uri, path })
    await this.clients.DeviceFilesystem.bootFile(req)
    return path
  }
  
  async deleteFile (uri: string, path: string) {
    validatePath(path)
  
    const req = SNI.RemoveFileRequest.create({ uri, path })
    await this.clients.DeviceFilesystem.removeFile(req)
    return path
  }

  async getFields (uri: string, inputFields: string[]) {
    const fields = inputFields.filter(
      (field) => FIELDS[field as keyof typeof FIELDS],
    )
    if (fields.length === 0) {
      throw new Error('No valid fields provided')
    }
    // TODO: Read fields from here
    const req = SNI.FieldsRequest.create({ uri, fields: [SNI.Field.RomFileName] })
    const call = await this.clients.DeviceInfo.fetchFields(req)
    return call.response
  }

  async listDevices(kinds?: string[]) {
    try {
      const req = SNI.DevicesRequest.create({ kinds })
      const devicesCall = await this.clients.Devices.listDevices(req)
      const devices: any[] = devicesCall.response.devices.map((device: any) => {
        const rawCapabilities = device.capabilities
        const capabilities = mapCapabilities(device.capabilities)
        return { ...device, capabilities, rawCapabilities }
      })

      return {
        connected: devices.length > 0,
        devices,
        // TODO: Make this configurable and rememberable
        current: devices[0],
      }

    } catch (err: unknown) {
      const error = err as Error
      console.debug('SNI.listDevices error', error)
      throw new Error('No Connection')
    }
  }

  async putFile (uri: string, path: string, fileContents: Uint8Array) {
    if (path.length === 0) {
      throw new Error('Invalid path')
    }
  
    const req = SNI.PutFileRequest.create({ uri, path, data: fileContents })
    await this.clients.DeviceFilesystem.putFile(req)
    return path
  }

  async readDirectory (uri: string, path: string) {
    const req = SNI.ReadDirectoryRequest.create({ path, uri })
    const call = await this.clients.DeviceFilesystem.readDirectory(req)
    const data = call.response.entries
    const rawFiles = data.filter((entry: any) => entry.type === 1)
    const rawFolders = data.filter((entry: any) => entry.type === 0)
    const folders = getFolders(rawFolders, path)
    const files = getFiles(rawFiles, path)
    return folders.concat(files)
  }

  async resetSystem(uri: string) {
    const req = SNI.ResetSystemRequest.create({ uri })
    const call = await this.clients.DeviceControl.resetSystem(req)
    return call.response
  }

  async resetToMenu (uri: string) {
    const req = SNI.ResetToMenuRequest.create({ uri })
    const call = await this.clients.DeviceControl.resetToMenu(req)
    return call.response
  }
}

export default SNIClient
