# @sni/client
This is a Typescript/Javascript package to interact with SNI in both the browser and Node.js.

## Installation
```sh
npm install @sni/client
```

## API
First, you need to initialize the client.
```ts
import { SNI } from '@sni/client'

const client = new SNI()
await client.listDevices()
```
