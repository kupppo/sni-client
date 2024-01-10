# @sni/client
This is a Typescript/Javascript package to interact with SNI in both the browser and Node.js.

Current SNI Version: [0.0.95](https://github.com/alttpo/sni/releases/tag/v0.0.95)

## Installation
```sh
npm install @kupppo/client
```

## Example
```ts
import { SNI } from '@sni/client'

const client = new SNI()
const devices = await client.listDevices()
console.log(devices)
```

## Development
To work on this repo, you first need to build the Typescript files from the `sni.proto` file.
```sh
npm run proto
```
This will generate the necessary SNI Typescript files to [`lib/proto`](lib/proto).

## Updating SNI
Updating SNI is currently done manually via the [`protos/sni.proto`](protos/sni.proto) file.
