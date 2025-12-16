import {
  shortString,
  BigNumberish,
  Uint256,
  uint256,
  ec,
  byteArray,
  ByteArray,
} from 'starknet'
import { bigintToHex, isBigint, isPositiveBigint } from 'src/utils/misc/types'
import { encodeBase64 } from 'src/utils/misc/decoder'


//
// Cairo functions
export const poseidon = (values: BigNumberish[]): bigint => (BigInt(ec.starkCurve.poseidonHashMany(values.map(v => BigInt(v)))))
export const poseidonString = (v: string): bigint => poseidon(byteArray.byteArrayFromString(encodeBase64(v)).data)

//
// Cairo type conversions
export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const chainIdToString = (chainId: string | bigint | null | undefined): string | undefined => (chainId ? (typeof chainId === 'string' ? chainId : feltToString(chainId)) : undefined)
export const chainIdToBigInt = (chainId: string | bigint | null | undefined): bigint | undefined => (chainId ? (typeof chainId === 'bigint' ? chainId : BigInt(chainId.startsWith('0x') ? chainId : stringToFelt(chainId))) : undefined)
export const U256ToBigint = (v: Uint256): bigint => (uint256.uint256ToBN(v))
export const bigintToU256 = (v: BigNumberish): Uint256 => (uint256.bnToUint256(v))
export const feltToString = (v: BigNumberish): string => (BigInt(v) > 0n ? shortString.decodeShortString(bigintToHex(v)) : '')
export const stringToFelt = (v: string): BigNumberish => (v ? shortString.encodeShortString(v) : '0x0')
export const stringToByteArray = (v: string): ByteArray => byteArray.byteArrayFromString(v ?? '')


//
// ETH conversions
export const ETH_TO_WEI = 1_000_000_000_000_000_000n
export const ethToWei = (eth: BigNumberish): bigint => isBigint(eth) ? (BigInt(eth) * ETH_TO_WEI) : 0n
export const weiToEth = (wei: BigNumberish): bigint => isBigint(wei) ? (BigInt(wei) / ETH_TO_WEI) : 0n
export const weiToEthDecimals = (wei: BigNumberish): bigint => (BigInt(wei) % ETH_TO_WEI)
export const weiToEthString = (wei: BigNumberish, decimals: number = 0, trailingZeros: boolean = false): string => {
  let result = Number(weiToEth(wei)).toLocaleString('en-US', { maximumFractionDigits: 8 })
  if (decimals > 0) {
    let ethDecimals = weiToEthDecimals(wei)
    let decimalsStr = (ETH_TO_WEI + ethDecimals).toString().slice(1, decimals + 1)
    while (!trailingZeros && decimalsStr.length > 1 && decimalsStr.at(-1) == '0') {
      decimalsStr = decimalsStr.slice(0, -1)
    }
    result += '.' + decimalsStr
  }
  return result
}
