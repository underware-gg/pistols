import { shortString, ec } from 'starknet'

export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const stringToFelt = (v: string): string => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (hex: string): string => (BigInt(hex) > 0n ? shortString.decodeShortString(hex) : '')
export const pedersen = (a: bigint | string | number, b: bigint | string | number): bigint => (BigInt(ec.starkCurve.pedersen(BigInt(a), BigInt(b))))
