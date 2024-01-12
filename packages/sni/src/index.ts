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

class SNIClient {
  transport: GrpcWebFetchTransport
  clients: any

  constructor() {
    this.transport = setupTransport()
    this.clients = setupClients(this.transport)
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
}

export default SNIClient
