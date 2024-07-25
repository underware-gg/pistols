import { getEntityIdFromKeys } from '@dojoengine/utils'
import { Component, Entity, getComponentValue } from '@dojoengine/recs'
import { BigNumberish } from 'starknet'

//
// Numbers
//

export const isNumber = (v: string) => (/^\d+$/.test(v))


//
// BigNumberish
//

export const bigintToHex = (v: BigNumberish): string => (!v ? '0x0' : `0x${BigInt(v).toString(16)}`)
export const bigintEquals = (a: BigNumberish | null, b: BigNumberish | null): boolean => (a != null && b != null && BigInt(a) == BigInt(b))
export const bigintAdd = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) + BigInt(b ?? 0))
export const bigintSub = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) - BigInt(b ?? 0))
export const isBigint = (v: BigNumberish | null): boolean => {
  try { return (v != null && BigInt(v) >= 0n) } catch { return false }
}
export const isPositiveBigint = (v: BigNumberish | null): boolean => {
  try { return (v != null && BigInt(v) > 0n) } catch { return false }
}

export const bigintToEntity = (v: BigNumberish): Entity => (getEntityIdFromKeys([BigInt(v)]) as Entity)
export const keysToEntity = (keys: BigNumberish[]): Entity => (getEntityIdFromKeys(keys.map(v => BigInt(v ?? 0))) as Entity)
export const entityIdToKey = (component: Component, keyName: string, entityId: Entity) => (BigInt(getComponentValue(component, entityId)[keyName]))

export const shortAddress = (address: string | null) => (
  !address ? '?'
    : !address.startsWith('0x') ? `(${address})`  // not hex
      : address.length < 12 ? address             // size is good
        : `${address.slice(0, 6)}..${address.slice(-4)}`
)

//
// arrays
//
export const arrayUnique = <T,>(array: T[]) => array?.filter((value, index, array) => (array.indexOf(value) === index))
export const arrayLast = <T,>(array: T[]) => array?.slice(-1)[0]
export const arrayRemoveValue = <T,>(array: T[], v: T) => array?.filter(e => (e !== v)) ?? []

//
// dictionaries
//

export const getObjectKeyByValue = (obj: any, value: any) => Object.keys(obj).find(key => obj[key] === value)
export const cleanObject = (obj: any): any => Object.keys(obj).reduce((acc, key) => {
  if (obj[key] !== undefined) acc[key] = obj[key]
  return acc
}, {} as { [key: string]: any })
