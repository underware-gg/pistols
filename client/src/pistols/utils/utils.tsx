import { getEntityIdFromKeys } from '@dojoengine/utils'
import { Entity } from '@dojoengine/recs'
import { shortString } from 'starknet'

export const abs = (v: number): number => (v < 0 ? -v : v)
export const min = (v1: number, v2: number): number => (v1 < v2 ? v1 : v2)
export const max = (v1: number, v2: number): number => (v1 > v2 ? v1 : v2)
export const sign = (v: number): number => (v > 0 ? 1 : v < 0 ? -1 : 0)
export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v)
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (min: number, max: number, f: number): number => (min + (max - min) * f)
export const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => (outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin)))
export const modf = (v: number, m: number): number => (v - m * Math.floor(v / m))
export const fmod = (a: number, b: number): number => Number((a - (Math.floor(a / b) * b)).toPrecision(8)) // TODO: TEST THIS!!!

const DEGREES_PER_RADIANS = (180 / Math.PI);
export const toDegrees = (r: number) => (r * DEGREES_PER_RADIANS)
export const toRadians = (d: number) => (d / DEGREES_PER_RADIANS)

export const randomArrayElement = (array: any[]) => (array.length > 0 ? array[Math.floor(Math.random() * array.length)] : null)

export const bigintToHex = (value: bigint | string) => `0x${BigInt(value).toString(16)}`

export const bigintToEntity = (value: bigint | string): Entity => {
  return getEntityIdFromKeys([BigInt(value)]) as Entity;
}

export const keysToEntity = (keys: any[]): Entity => {
  return getEntityIdFromKeys(keys) as Entity;
}

export const validateCairoString = (value: string): string => {
  return (value ? value.slice(0, 31) : '')
}

export const stringToFelt = (value: string): string => {
  return (value ? shortString.encodeShortString(value) : '0x0')
}

export const feltToString = (hexValue: string): string => {
  return (BigInt(hexValue) > 0n ? shortString.decodeShortString(hexValue) : '')
}
