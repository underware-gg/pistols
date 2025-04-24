import { CairoCustomEnum, BigNumberish, Abi, CallData, Calldata } from 'starknet'
import { keysToEntityId } from 'src/utils/hooks/useEntityId'
import { bigintToHex } from 'src/utils/misc/types'

export type CustomEnumValue = number | BigNumberish | BigNumberish[] | string

//
// parse cairo custom enum
// (see starknet.test.ts)
// https://starknetjs.com/docs/api/classes/cairocustomenum/
// https://starknetjs.com/docs/guides/cairo_enum#cairo-custom-enum
export const parseCustomEnum = <N extends string, T extends CustomEnumValue>(data: CairoCustomEnum | string | null): {
  variant: N | undefined, // variant name
  value: T | undefined,      // variant value
} => (
  !data ? { variant: undefined, value: undefined }
    : typeof data === 'string' ? { variant: data as N, value: undefined }
      : data instanceof CairoCustomEnum ? {
        variant: data.activeVariant() as N,
        value: data.unwrap() as T,
      } : { variant: undefined, value: undefined }
)
export const parseEnumVariant = <N extends string>(data: CairoCustomEnum | string | null): N | undefined => (
  parseCustomEnum<N, number>(data).variant
)

//
// make simple cairo custom enum, containing only the variant
// https://starknetjs.com/docs/guides/cairo_enum#send-cairo-custom-enum
//
// example:
// const myCustomEnum = new CairoCustomEnum({
//   Empty: {},
// });
//
export const makeCustomEnum = <T extends CustomEnumValue>(
  variant: string | null,
  value?: T,
): CairoCustomEnum | undefined => (
  (variant) ? new CairoCustomEnum({
    [variant]:
      typeof value === 'undefined' ? {} // Empty:()
        : typeof value === 'bigint' ? bigintToHex(value)
          : value
  }) : undefined
)

//
// make full cairo custom enum from ABI
// https://starknetjs.com/docs/guides/cairo_enum#send-cairo-custom-enum
//
// example:
// const myCustomEnum = new CairoCustomEnum({
//   Response: undefined,
//   Warning: undefined,
//   Error: undefined,
//   Critical: undefined,
//   Empty: {},
// });
//
export const makeAbiCustomEnum = <T extends CustomEnumValue>(
  abi: Abi,
  enumName: string,
  variant: string | null,
  value?: T,
): CairoCustomEnum | undefined => {
  if (!variant) return undefined
  const _abiEnum = CallData.getAbiEnum(abi)
  const _enum = _abiEnum[
    Object.keys(_abiEnum).find(fullVariantName => fullVariantName.endsWith(`::${enumName}`))
  ];
  if (!_enum) return undefined
  let _variants: any = {};
  _enum.variants.forEach(v => {
    const name = v.name
    _variants[name] = (v.name == variant ? makeCustomEnum(variant, value).unwrap() as T : undefined)
  });
  return new CairoCustomEnum(_variants)
}

//
// make the entity Id for a full CairoCustomEnum built with makeAbiCustomEnum()
//
export const makeCustomEnumEntityId = (data: CairoCustomEnum | undefined): string | undefined => {
  if (!data) return undefined
  let calldata: Calldata = CallData.compile([data])
  return keysToEntityId(calldata)
}
