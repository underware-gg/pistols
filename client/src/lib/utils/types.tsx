import { getEntityIdFromKeys } from '@dojoengine/utils'
import { BigNumberish } from 'starknet'

//
// numbers
//

export const isNumber = (v: string) => (/^\d+$/.test(v))

//
// strings
//

export const capitalize = (v: string) => (v.charAt(0).toUpperCase() + v.slice(1))

//
// BigNumberish
//

export const bigintToHex = (v: BigNumberish): `0x${string}` => (!v ? '0x0' : `0x${BigInt(v).toString(16)}`)
export const bigintToNumber = (v: BigNumberish): number => (!v ? 0 : Number(BigInt(v)))
export const bigintEquals = (a: BigNumberish | null, b: BigNumberish | null): boolean => (a != null && b != null && BigInt(a) == BigInt(b))
export const bigintAdd = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) + BigInt(b ?? 0))
export const bigintSub = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) - BigInt(b ?? 0))
export const isBigint = (v: BigNumberish | null): boolean => {
  try { return (v != null && BigInt(v) >= 0n) } catch { return false }
}
export const isPositiveBigint = (v: BigNumberish | null): boolean => {
  try { return (v != null && BigInt(v) > 0n) } catch { return false }
}
export const isNumeric = (v: string | null): boolean => (v != null && /^\d+$/.test(v))

export const bigintToEntity = (v: BigNumberish): string => (getEntityIdFromKeys([BigInt(v)]) as string)
export const keysToEntity = (keys: BigNumberish[]): string => (getEntityIdFromKeys(keys.map(v => BigInt(v ?? 0))) as string)

export const shortAddress = (address: string | null, small: boolean = false) => {
  const addresLength = small ? 7 : 12
  const sliceStart = small ? 2 : 6
  const sliceEnd = small ? 3 : 4
  return (
    !address ? '?'
      : !address.startsWith('0x') ? `(${address})`  // not hex
        : address.length < addresLength ? address             // size is good
          : `${address.slice(0, sliceStart)}..${address.slice(-sliceEnd)}`
  )
}

//
// arrays
//
export const arrayUnique = <T,>(array: T[]): T[] => (array?.filter((value, index, array) => (array.indexOf(value) === index)) ?? [])
export const arrayLast = <T,>(array: T[]): T => (array?.slice(-1)[0])
export const arrayRemoveValue = <T,>(array: T[], v: T): T[] => (array?.filter(e => (e !== v)) ?? [] ?? [])
export const arrayHasNullElements = <T,>(array: T[]): boolean => (array?.findIndex(e => (e == null)) >= 0)
export const arrayClean = <T,>(array: T[]): T[] => (array?.filter(e => (e != null)) ?? [])

//
// dictionaries
//

export const getObjectKeyByValue = (obj: any, value: any) => Object.keys(obj).find(key => obj[key] === value);
export const cleanObject = (obj: any): any => Object.keys(obj).reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key]
  return acc
}, {} as { [key: string]: any });

//
// serializer
//
// there is no default serializer for BigInt, make one
(BigInt.prototype as any).toJSON = function () {
  return (this <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(this) : bigintToHex(this))
}
export const serialize = (obj: any, space: number | string = null): any => JSON.stringify(obj, null, space);
