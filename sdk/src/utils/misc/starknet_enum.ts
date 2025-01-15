import { CairoCustomEnum, BigNumberish, cairo } from 'starknet'
import { bigintToHex } from 'src/utils/misc/types'

//
// make cairo custom enum
// https://starknetjs.com/docs/guides/cairo_enum#send-cairo-custom-enum
export type CustomEnumValue = number | BigNumberish | BigNumberish[] | string
export const makeCustomEnum = <T extends CustomEnumValue>(variant: string | null, value?: T): CairoCustomEnum | undefined => (
  (variant) ? new CairoCustomEnum({
    [variant]:
      typeof value === 'undefined' ? {} // Empty:()
        : typeof value === 'bigint' ? bigintToHex(value)
          : value
  }) : undefined
)
//
// parse cairo custom enum
// (see starknet.test.ts)
// https://starknetjs.com/docs/api/classes/cairocustomenum/
// https://starknetjs.com/docs/guides/cairo_enum#cairo-custom-enum
export const parseCustomEnum = <T extends CustomEnumValue>(data: CairoCustomEnum | string | null): {
  variant: string | undefined, // variant name
  value: T | undefined,      // variant value
} => (
  !data ? { variant: undefined, value: undefined }
    : typeof data === 'string' ? { variant: data, value: undefined }
      : {
        variant: data.activeVariant(),
        value: data.unwrap() as T,
      }
)
export const parseEnumVariant = <T extends string>(data: CairoCustomEnum | string | null): T | undefined => (
  parseCustomEnum(data).variant as T
)
