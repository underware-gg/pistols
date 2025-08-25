import {
  BigNumberish,
  addAddressPadding,
  encode,
} from 'starknet'

//
// misc
//

export const hasNull = (v: any[]): boolean => (v.some(e => (e == null)))
export const hasNotNull = (v: any[]): boolean => (!hasNull(v))
export const nullGate = <T>(v: any[], result: T): (T | null) => (!hasNull(v) ? result : null)

//
// numbers
//

export const isNumber = (v: string) => (/^\d+$/.test(v))
export const formatOrdinalNumber = (v: number) => {
  const lastDigit = v % 10
  const lastTwoDigits = v % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${v}th`
  if (lastDigit === 1) return `${v}st`
  if (lastDigit === 2) return `${v}nd`
  if (lastDigit === 3) return `${v}rd`
  return `${v}th`
}

//
// strings
//

export const capitalize = (v: string) => (v.charAt(0).toUpperCase() + v.slice(1))

//
// BigNumberish
//

export const bigintToHex = (v: BigNumberish): `0x${string}` => (!v ? '0x0' : `0x${BigInt(v).toString(16)}`)
export const bigintToAddress = (v: BigNumberish): `0x${string}` => addAddressPadding(bigintToHex(v)) as `0x${string}`
export const bigintToAddressEth = (v: BigNumberish): `0x${string}` => (!v ? '0x0' : `0x${BigInt(v).toString(16).padStart(ETHEREUM_ADDRESS_LENGTH - 2, '0')}`)
export const bigintToDecimal = (v: BigNumberish): string => (!v ? '0' : BigInt(v).toString())
export const bigintToNumber = (v: BigNumberish): number => (!v ? 0 : Number(BigInt(v)))
export const bigintEquals = (a: BigNumberish | null, b: BigNumberish | null): boolean => (a != null && b != null && BigInt(a) == BigInt(b))
export const bigintAdd = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) + BigInt(b ?? 0))
export const bigintSub = (a: BigNumberish | null, b: BigNumberish | null): bigint => (BigInt(a ?? 0) - BigInt(b ?? 0))
export const isBigint = (v: any | null): boolean => {
  try { return (v != null && BigInt(v) >= 0n) } catch { return false }
}
export const isPositiveBigint = (v: BigNumberish | null): boolean => {
  try { return (v != null && BigInt(v) > 0n) } catch { return false }
}
export const isNumeric = (v: string | null): boolean => (v != null && /^\d+$/.test(v))
export const sanitizedAddress = (v: BigNumberish): string | null => (isPositiveBigint(v) ? encode.sanitizeHex(bigintToHex(v)) : null)
export const shortAddress = (address: bigint | string | null) => {
  const _address = (typeof address === 'bigint' || isBigint(address)) ? bigintToHex(address) : address
  const addresLength = 12
  const sliceStart = 6
  const sliceEnd = 4
  return (
    !_address ? '?'
      : !_address.startsWith('0x') ? `(${_address})`  // not hex
        : _address.length < addresLength ? _address             // size is good
          : `${_address.slice(0, sliceStart)}..${_address.slice(-sliceEnd)}`
  )
}

// Starknet address: 0x + 64 hex digits (or less)
// starknet ex: 0xe29882a1fcba1e7e10cad46212257fea5c752a4f9b1b1ec683c503a2cf5c8a
// starknet ex: 0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
export const STARKNET_ADDRESS_LENGTH = 66
export const isStarknetAddress = (v: BigNumberish): boolean => Math.abs(STARKNET_ADDRESS_LENGTH - sanitizedAddress(v)?.length) <= 2
// Ethereum address: 0x + 40 hex digits (or less)
// ex: 0x8822d811b5749c544e80aad7421fe17555feed29
// ex: 0x5fae26ee1a7f27201bf8e23173ac1c2f9a0c7d
export const ETHEREUM_ADDRESS_LENGTH = 42
export const isEthereumAddress = (v: BigNumberish): boolean => Math.abs(ETHEREUM_ADDRESS_LENGTH - sanitizedAddress(v)?.length) <= 2

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

export const getObjectKeyByValue = <T extends object>(obj: T, value: any): string | undefined =>
  (Object.keys(obj) as (keyof T)[])
    .find(key => obj[key] === value) as string;
export const cleanObject = <T extends object>(obj: T): T =>
  (Object.keys(obj) as (keyof T)[])
    .reduce((acc, key) => {
      if (obj[key] !== undefined) acc[key] = obj[key]
      return acc
    }, {} as T);
export const sortObjectByValue = <T extends object>(obj: T, sorter: (a: any, b: any) => number): T =>
  (Object.keys(obj) as (keyof T)[])
    .sort((a, b) => sorter(obj[a], obj[b]))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as T);


//
// serializer
//

// there is no default serializer for BigInt, make one
(BigInt.prototype as any).toJSON = function () {
  return (this <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(this) : bigintToHex(this))
}
export const serialize = (obj: any, space?: number | string): any => JSON.stringify(obj, null, space);
