import {
  Account,
  AccountInterface,
  InvocationsDetails,
  InvokeFunctionResponse,
  shortString,
  BigNumberish,
  Uint256,
  uint256,
  encode,
  Abi,
  ec,
  byteArray,
} from 'starknet'
import { bigintToHex, isBigint, isPositiveBigint } from 'src/utils/misc/types'
import { encodeBase64 } from 'src/utils/misc/decoder'

//
// Lenghts of a Starknet address
export const STARKNET_ADDRESS_LENGTHS = [66, 64] // [max,min]
export const ETHEREUM_ADDRESS_LENGTH = 42

//
// Cairo functions
export const poseidon = (values: BigNumberish[]): bigint => (BigInt(ec.starkCurve.poseidonHashMany(values.map(v => BigInt(v)))))
export const poseidonString = (v: string): bigint => poseidon(byteArray.byteArrayFromString(encodeBase64(v)).data)

//
// Cairo type conversions
export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const sanitizedAddress = (v: BigNumberish): string | null => (isPositiveBigint(v) ? encode.sanitizeHex(bigintToHex(v)) : null)
export const stringToFelt = (v: string): BigNumberish => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (v: BigNumberish): string => (BigInt(v) > 0n ? shortString.decodeShortString(bigintToHex(v)) : '')
export const chainIdToString = (chainId: string | bigint | null | undefined): string | undefined => (chainId ? (typeof chainId === 'string' ? chainId : feltToString(chainId)) : undefined)
export const chainIdToBigInt = (chainId: string | bigint | null | undefined): bigint | undefined => (chainId ? (typeof chainId === 'bigint' ? chainId : BigInt(chainId.startsWith('0x') ? chainId : stringToFelt(chainId))) : undefined)
export const U256ToBigint = (v: Uint256): bigint => (uint256.uint256ToBN(v))
export const bigintToU256 = (v: BigNumberish): Uint256 => (uint256.bnToUint256(v))


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


//
// execute() based on:
// https://github.com/dojoengine/dojo.js/blob/main/packages/core/src/provider/DojoProvider.ts#L157
export async function execute(
  account: Account | AccountInterface,
  contractAddress: string,
  abi: Abi,
  entrypoint: string,
  calldata: BigNumberish[],
  transactionDetails?: InvocationsDetails | undefined
): Promise<InvokeFunctionResponse> {
  try {
    const nonce = await account?.getNonce()
    return await account?.execute(
      [
        {
          contractAddress,
          entrypoint,
          calldata,
        },
      ],
      [abi],
      {
        maxFee: 0, // TODO: Update this value as needed.
        ...transactionDetails,
        nonce,
      }
    )
  } catch (error) {
    console.error("execute() error: ", error)
    return {
      transaction_hash: null,
    }
  }
}
