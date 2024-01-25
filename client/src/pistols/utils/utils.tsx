import { getEntityIdFromKeys } from '@dojoengine/utils'
import { Entity } from '@dojoengine/recs'
import { shortString, ec } from 'starknet'

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

export const bigintToHex = (v: bigint | string): string => (`0x${BigInt(v).toString(16)}`)
export const bigintToEntity = (v: bigint | string): Entity => (getEntityIdFromKeys([BigInt(v)]) as Entity)
export const keysToEntity = (keys: any[]): Entity => (getEntityIdFromKeys(keys) as Entity)

export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const stringToFelt = (v: string): string => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (hex: string): string => (BigInt(hex) > 0n ? shortString.decodeShortString(hex) : '')
export const pedersen = (a: bigint | string | number, b: bigint | string | number): bigint => (BigInt(ec.starkCurve.pedersen(BigInt(a), BigInt(b))))

export const formatTimestamp = (t: number): string => {
  const timeUTC = new Date(t * 1000).getTime()
  const tzoffset = (new Date(0)).getTimezoneOffset() * 60000 // local timezone offset in milliseconds
  const localDate = new Date(timeUTC - tzoffset)
  const iso = localDate.toISOString()
  const [date, iso2] = iso.split('T')
  const [time, iso3] = iso2.split('.')
  const [hour, minutes, seconds] = time.split(':')
  return `${date} ${hour}:${minutes}`
}

export const formatTimestampElapsed = (start: number): string => {
  const now = Math.floor(new Date().getTime() / 1000)
  return formatTimestampDelta(start, now)
}

export const formatTimestampCountdown = (end: number): string => {
  const now = Math.floor(new Date().getTime() / 1000)
  return formatTimestampDelta(now, end)
}

export const formatTimestampDelta = (start: number, end: number): string => {
  const t = Math.max(0, end - start)
  const iso = (new Date(t * 1000).toISOString())
  const [date, iso2] = iso.split('T')
  const [time, iso3] = iso2.split('.')
  const [hour, minutes, seconds] = time.split(':')
  const days = Math.floor(t / (24 * 60 * 60))
  let result = ''
  if (days > 0) result += `${days}d `
  if (days > 0 || parseInt(hour) > 0) result += `${hour == '00' ? '0' : hour}h `
  return result + `${minutes}m ${seconds}s`
}

export const makeRandomInt = (maxNonInclusive: number) => (Math.floor(Math.random() * maxNonInclusive))
export const randomArrayElement = (array: any[]): any => (array.length > 0 ? array[makeRandomInt(array.length)] : null)

export const makeRandomHash = (hashSize = 32, prefix = '0x') => {
  const hexChars = '0123456789abcdef';
  let result = prefix ?? '';
  for (let i = 0; i < hashSize; ++i) {
    result += hexChars[makeRandomInt(hexChars.length)]
  }
  return result
}
