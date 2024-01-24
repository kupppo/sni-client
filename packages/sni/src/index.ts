import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import EventEmitter from 'eventemitter3'
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

export type SNIClientOptions = {
  autoConnect?: boolean
  healthTimeout?: number
  transportUrl?: string
  verbose?: boolean
}

const DEFAULT_OPTIONS = {
  autoConnect: true,
  healthTimeout: 5000,
  transportUrl: 'http://localhost:8190',
  verbose: false,
}

class SNIClient {
  transport: GrpcWebFetchTransport
  clients: any
  connectedUri: string | null = null
  options: SNIClientOptions
  #emitter: EventEmitter

  constructor(options: Partial<SNIClientOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.transport = setupTransport(this.options.transportUrl)
    this.clients = setupClients(this.transport)
    this.#emitter = new EventEmitter()

    this.#emitter.on('connected', (uri: string) => {
      this.#log(`Connected to: ${uri}`)
    })

    if (this.options.autoConnect) {
      this.connect()
    }

    return this
  }

  #getConnectedUri() {
    const uri = this.connectedUri
    if (!uri) {
      throw new Error('No connected device')
    }
    return uri
  }

  async #onHealth() {
    const checkConnection = await this.getFields(['DeviceVersion'])
    const timeout = this.options.healthTimeout
    const timer = new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject('Health check timed out')
      }, timeout)
    })
    return Promise.race([checkConnection, timer])
  }

  async #health() {
    try {
      this.#log('Health check')
      await this.#onHealth()
      setTimeout(() => {
        this.#health()
      }, 5000)
    } catch (err: unknown) {
      const error = err as Error
      this.#log('Health check error:', error.message)
      this.disconnect()
    }
  }

  #log(...args: any[]) {
    if (this.options.verbose) {
      console.debug('%c[SNI Client]%c', 'color: rgb(120, 120, 120)', 'color: inherit', ...args)
    }
  }

  off(eventName: string, listener: (...args: any[]) => void) {
    this.#emitter.off(eventName, listener)
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    this.#emitter.on(eventName, listener)
  }

  once(eventName: string, listener: (...args: any[]) => void) {
    this.#emitter.once(eventName, listener)
  }

  async connect(input?: DeviceKind | string | null) {
    try {
      const devices = await this.listRawDevices()
      if (devices.length > 0) {
        const firstDevice = devices[0]
        const uri = firstDevice.uri

        // TODO: Should this fire a disconnected event if there is already a connectedUri?
        //       Technically, it has not disconnected, although the client has switched
        this.connectedUri = uri
        this.#emitter.emit('connected', uri)
        this.#health()
        return uri
      } else {
        return null
      }
    } catch (err: unknown) {
      console.error(err)
    }
  }

  disconnect() {
    this.connectedUri = null
    this.#emitter.emit('disconnected')
  }

  async connectedDevice() {
    try {
      const uri = this.#getConnectedUri()
      const devices = await this.listRawDevices({ uri })
      if (devices.length === 0) {
        throw new Error('No connected device')
      }
      const device = devices[0]
      return device
    } catch (err: unknown) {
      const error = err as Error
      console.error('SNI.connectedDevice error', error)
      throw error
    }
  }

  async currentScreen () {
    try {
      const req = await this.getFields(['RomFileName'])
      // the FxPak Pro will either use menu.bin or m3nu.bin
      // and a game will normally end with .sfc or .smc
      if (req.values[0].endsWith('.bin')) {
        return 'menu'
      }
      return 'game'
    } catch (err: unknown) {
      const error = err as Error
      console.error('currentScreen', error.message)
      return 'menu'
    }
  }

  async bootFile (path: string) {
    validatePath(path)
    const uri = this.#getConnectedUri()
  
    const req = SNI.BootFileRequest.create({ uri, path })
    await this.clients.DeviceFilesystem.bootFile(req)
    return path
  }
  
  async deleteFile (path: string) {
    validatePath(path)
    const uri = this.#getConnectedUri()
  
    const req = SNI.RemoveFileRequest.create({ uri, path })
    await this.clients.DeviceFilesystem.removeFile(req)
    return path
  }

  async getFields (inputFields: string[]) {
    const uri = this.#getConnectedUri()
    const fields = inputFields
      .filter(
        (field) => FIELDS[field as keyof typeof FIELDS],
      )
      .map((field) => FIELDS[field as keyof typeof FIELDS])
    if (fields.length === 0) {
      throw new Error('No valid fields provided')
    }
    // TODO: Read fields from here
    // @ts-ignore
    const req = SNI.FieldsRequest.create({ uri, fields })
    const call = await this.clients.DeviceInfo.fetchFields(req)
    return call.response
  }

  // TODO: Refactor this to align with SNI's own `listDevices`
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
        // TODO: Remove this
        current: devices[0],
      }

    } catch (err: unknown) {
      const error = err as Error
      this.#log('listDevices error', error)
      throw new Error('No Connection')
    }
  }

  async listRawDevices(args?: { kinds?: DeviceKind[], uri?: string }) {
    const req = SNI.DevicesRequest.create(args)
    const devicesCall = await this.clients.Devices.listDevices(req)
    const devices: any[] = devicesCall.response.devices.map((device: any) => {
      const rawCapabilities = device.capabilities
      const capabilities = mapCapabilities(device.capabilities)
      return { ...device, capabilities, rawCapabilities }
    })
    return devices
  }

  async putFile (path: string, fileContents: Uint8Array) {
    validatePath(path)
    const uri = this.#getConnectedUri()
  
    const req = SNI.PutFileRequest.create({ uri, path, data: fileContents })
    await this.clients.DeviceFilesystem.putFile(req)
    return path
  }

  async readDirectory (path: string) {
    const uri = this.#getConnectedUri()
    const req = SNI.ReadDirectoryRequest.create({ path, uri })
    const call = await this.clients.DeviceFilesystem.readDirectory(req)
    const data = call.response.entries
    const rawFiles = data.filter((entry: any) => entry.type === 1)
    const rawFolders = data.filter((entry: any) => entry.type === 0)
    const folders = getFolders(rawFolders, path)
    const files = getFiles(rawFiles, path)
    return folders.concat(files)
  }

  async resetSystem() {
    const uri = this.#getConnectedUri()
    const req = SNI.ResetSystemRequest.create({ uri })
    const call = await this.clients.DeviceControl.resetSystem(req)
    return call.response
  }

  async resetToMenu () {
    const uri = this.#getConnectedUri()
    const req = SNI.ResetToMenuRequest.create({ uri })
    const call = await this.clients.DeviceControl.resetToMenu(req)
    return call.response
  }
}

export default SNIClient
