import {
  ec,
  shortString,
  Account,
  BigNumberish,
  AccountInterface,
  InvocationsDetails,
  InvokeFunctionResponse,
  Abi,
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
export const dummyAccount = (): Account => (new Account({}, '0x0', '0x0'))

export const splitU256 = (v: BigNumberish): { low: bigint, high: bigint } => ({
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
    this.logger.error("execute() error: ", error)
    return {
      transaction_hash: null,
    }
  }
}
