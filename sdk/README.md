# Pistols at 10 Blocks SDK

### Packages

* `@underware_gg/pistols-sdk/pistols`: Pistols related code
* `@underware_gg/pistols-sdk/dojo`: Dojo utils and hooks
* `@underware_gg/pistols-sdk/utils`: Misc and Starknet utils
* `@underware_gg/pistols-sdk/hooks`: Misc and Starknet hooks
* `@underware_gg/pistols-sdk/abis`: Misc Starknet ABIs
* `@underware_gg/pistols-sdk/fix`: Temporary fixes for dependencies


## Dependencies

|                          | `/utils` | `/hooks` | `/abis` | `/dojo` | `/pistols` |
|--------------------------|:--------:|:--------:|:-------:|:-------:|:--------:|
| `starknet`               | ✅       | ✅       | ✅      | ✅      |  ✅      |
| `starknetid.js`          |          | ✅       |         |         |          |
| `get-starknet-core`      |          | ✅       |         | ✅      |          |
| `react`                  |          | ✅       |         | ✅      |          |
| `@starknet-react/core`   | ✅       | ✅       |         | ✅      |          |
| `@starknet-react/chains` |          |          |         | ✅      |          |
| `@apollo/client`         |          | ✅       |         | ✅      |          |
| `@cartridge/controller`  |          |          |         | ✅      | ✅       |
| `@cartridge/connector`   |          |          |         | ✅      |          |
| `@dojoengine/core`       |          |          |         | ✅      | ✅       |
| `@dojoengine/sdk`        |          |          |         | ✅      | ✅       |
| `@dojoengine/utils`      | ✅       |          |         |         |          |

* Environment variables

`VITE_CHAIN_ID`: should contain a valid chain from [chains.ts](src/dojo/setup/chains.ts)


## Installation

* Install dependency

```bash
pnpm install @underware_gg/pistols-sdk
```

* Import and use what you need...

```js
import { helloPistols } from '@underware_gg/pistols-sdk'
helloPistols();

import { bigintToHex } from '@underware_gg/pistols-sdk/utils'
const address = bigintToHex(1234567890n)
```






## Constants Generator

A very simple basic tool that generates a Typescript source containint all constants and enums from your cairo source code.

Usage: `npx @underware_gg/pistols-sdk generate-constants --src:<CAIRO_SRC_PATH> --out:<OUTPUT_PATH>`

* All `.cairo` files inside `<CAIRO_SRC_PATH>` will be parsed
* Only `const` declared inside a `mod` will be extracted
* All `enum` will be extracted
* A single Typscript file will be generated, containing one object per `mod` and `enum` found
* mods (containing consts) names must be unique
* mods need to be declared exactly as `mod mod_name {`
* mods with the `#[cfg(test)]` attribute will be ignored

Example mod:

```rust
mod rocket_builder {
  const ROCKET_ID: felt252 = 'RCKT';
  const ROCKET_NAME: ByteString = "Rocket Go Up";
  const ENGINE_COUNT: u8 = 8;
  const RocketLaunchedEvent: felt252 = 0x3b133634cb14989d3c29196028db74581fbdf3713ad6f45f67ab4bf81f5ac56;
}
enum PlayerCharacter {
  Godzilla,
  Dragon: (),
  Fox: u128,
  // Rhyno
}
```

The generated Typescript code for the above mod is:

```typescript
//
// constants
//
type rocket_builder_Type = {
  ROCKET_ID: string, // cairo: felt252
  ROCKET_NAME: string, // cairo: ByteArray
  ENGINE_COUNT: number, // cairo: u8
  RocketLaunchedEvent: BigNumberish, // cairo: felt252
};
export const rocket_builder: rocket_builder_Type = {
  ROCKET_ID: 'RCKT',
  ROCKET_NAME: "Rocket Go Up",
  ENGINE_COUNT: 8,
  RocketLaunchedEvent: '0x3b133634cb14989d3c29196028db74581fbdf3713ad6f45f67ab4bf81f5ac56',
};

//
// enums
//
export enum PlayerCharacter {
  Godzilla = '0',
  Dragon = '1',
  Fox = '2',
};
export type PlayerCharacterNames = 'Godzilla'|'Dragon'|'Fox';
export const PlayerCharacterValues: Record<PlayerCharacterNames, PlayerCharacter> = {
  'Godzilla': PlayerCharacter.Godzilla, // 0
  'Dragon': PlayerCharacter.Dragon, // 1
  'Fox': PlayerCharacter.Fox, // 2
};
```
