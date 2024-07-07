import {
  Account,
  AccountInterface,
  InvocationsDetails,
  InvokeFunctionResponse,
  RpcProvider,
  shortString,
  BigNumberish,
  Uint256,
  Abi,
  ec,
} from 'starknet'
import { bigintToHex } from './types'

export const ETH_TO_WEI = 1_000_000_000_000_000_000n

export const validateCairoString = (v: string): string => (v ? v.slice(0, 31) : '')
export const stringToFelt = (v: string): string => (v ? shortString.encodeShortString(v) : '0x0')
export const feltToString = (v: BigNumberish): string => (BigInt(v) > 0n ? shortString.decodeShortString(bigintToHex(v)) : '')
export const pedersen = (a: BigNumberish, b: BigNumberish): bigint => (BigInt(ec.starkCurve.pedersen(BigInt(a), BigInt(b))))
export const poseidon = (values: BigNumberish[]): bigint => (BigInt(ec.starkCurve.poseidonHashMany(values.map(v => BigInt(v)))))
export const ethToWei = (v: BigNumberish): bigint => (BigInt(v) * ETH_TO_WEI)
export const weiToEth = (v: BigNumberish): bigint => (BigInt(v) / ETH_TO_WEI)
export const weiToEthDecimals = (v: BigNumberish): bigint => (BigInt(v) % ETH_TO_WEI)
export const weiToEthString = (v: BigNumberish, decimals: number = 0, trailingZeros: boolean = false): string => {
  let result = Number(weiToEth(v)).toLocaleString('en-US', { maximumFractionDigits: 8 })
  if (decimals > 0) {
    let ethDecimals = weiToEthDecimals(v)
    let decimalsStr = (ETH_TO_WEI + ethDecimals).toString().slice(1, decimals + 1)
    while (!trailingZeros && decimalsStr.length > 1 && decimalsStr.at(-1) == '0') {
      decimalsStr = decimalsStr.slice(0, -1)
    }
    result += '.' + decimalsStr
  }
  return result
}

export const dummyAccount = (provider?: RpcProvider): Account => (new Account(provider ?? {}, '0x0', '0x0'))

export const Uint256ToBigint = (v: Uint256): bigint => ((BigInt(v.high) << 128n) + BigInt(v.low))
export const bigintToU256 = (v: BigNumberish): Uint256 => ({
  low: BigInt(v) & 0xffffffffffffffffffffffffffffffffn,
  high: BigInt(v) >> 128n,
})


//
// based on:
// https://github.com/dojoengine/dojo.js/blob/main/packages/core/src/provider/DojoProvider.ts#L157
//
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
