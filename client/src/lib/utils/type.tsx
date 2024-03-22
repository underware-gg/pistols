import { getEntityIdFromKeys } from '@dojoengine/utils'
import { Entity } from '@dojoengine/recs'
import { BigNumberish } from 'starknet'

export const bigintEquals = (a: BigNumberish | null, b: BigNumberish | null): boolean => (a && b && BigInt(a) == BigInt(b))
export const bigintToHex = (v: BigNumberish): string => (`0x${BigInt(v).toString(16)}`)
export const bigintToEntity = (v: BigNumberish): Entity => (getEntityIdFromKeys([BigInt(v)]) as Entity)
export const keysToEntity = (keys: any[]): Entity => (getEntityIdFromKeys(keys) as Entity)
