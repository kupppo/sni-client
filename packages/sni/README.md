# @sni/client
This is a Typescript/Javascript package to interact with SNI in both the browser and Node.js.

Current SNI Version: [0.0.95](https://github.com/alttpo/sni/releases/tag/v0.0.95)

## Installation
```sh
npm install @kupppo/client
```


## Example
```ts
import SNI from '@sni/client'

const client = new SNI()
await client.connect()
const devices = await client.readDirectory('/')
console.log(devices)
```


## Getting Started

### Creating and Connecting
After installation, you'll need to create a client and then connect to a device.
```ts
import SNI from '@sni/client'

const client = new SNI()
```

The client will automatically connect to the first device found. This auto-connect can be disabled in the options.
```ts
// Connect to the first device found
const client = new SNI({ autoConnect: false })
await client.connect()
```

You can also specify a type or URI to be more specific.
```ts
// Connect to the first device of a specific type
await client.connect('fxpakpro')

// Connect to a specific device
const devices = await client.listDevices()
await client.connect(devices[1].uri)
```


## Development
To work on this repo, you first need to build the Typescript files from the `sni.proto` file.
```sh
npm run proto
```
This will generate the necessary SNI Typescript files to [`lib/proto`](src/lib/proto).

From there, you can run `npm run dev` to watched for changes or `npm run build` to build the package.


## Updating SNI
Updating SNI is currently done manually via the [`protos/sni.proto`](src/protos/sni.proto) file.
