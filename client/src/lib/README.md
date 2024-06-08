
# @/lib

common code used by all our games, to be moved to a `@underware` package

## Dependencies

* `starknet`
* `@starknet-react/core`
* `@starknet-react/chains`
* `@dojoengine/core`
* `@dojoengine/recs`
* `semantic-ui-react` (@/lib/ui)


## Constants Generator

A very simple basic tool that generates a Typescript source containint all constants from your cairo source code.

Usage: `generateConstants.cjs <CAIRO_SRC_PATH> <OUTPUT_FILE>`

* All `.cairo` files inside `<CAIRO_SRC_PATH>` will be parsed
* Only `const` declared inside a `mod` will be extracted
* A single Typscript file will be generated, containing one object per `mod` parsed
* mods (containing consts) names must be unique
* mods need to be declared exactly as `mod mod_name {`
* mods with the `#[cfg(test)]` attribute will be ignored

Example mod:

```rust
mod rocket {
  const ROCKET_NAME: felt252 = "Rocket Go Up";
  const ENGINE_COUNT: u8 = 8;
  const RocketLaunchedEvent: felt252 = 0x3b133634cb14989d3c29196028db74581fbdf3713ad6f45f67ab4bf81f5ac56;
}
// ends with exactly '}'
```

The generated Typescript code for the above mod is:

```typescript
type mod_rocket_Type = {
  ROCKET_NAME: string, // cairo: felt252
  ENGINE_COUNT: number, // cairo: u8
  RocketLaunchedEvent: BigNumberish, // cairo: felt252
};
export const rocket: mod_rocket_Type = {
  ROCKET_NAME: "Rocket Go Up",
  ENGINE_COUNT: 8,
  RocketLaunchedEvent: '0x3b133634cb14989d3c29196028db74581fbdf3713ad6f45f67ab4bf81f5ac56',
};
```
