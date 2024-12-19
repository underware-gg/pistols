import { useMemo } from 'react'
import { BigNumberish, Account } from 'starknet'
import { useContractWrite } from '@underware_gg/pistols-sdk/hooks'
import { bigintToU256, bigintToHex } from '@underware_gg/pistols-sdk/utils'
import { erc20_abi } from '@underware_gg/pistols-sdk/abi'

export function useDojoERC20Transfer(contractAddress: BigNumberish, toAddress: BigNumberish, amount: bigint, fromAccount: Account = null) {
  const { low, high } = useMemo(() => bigintToU256(amount), [amount])
  const callData = useMemo(() => {
    return [
      bigintToHex(toAddress),
      bigintToHex(low),
      bigintToHex(high),
    ]
  }, [toAddress, low, high])
  const result = useContractWrite(contractAddress, erc20_abi, 'transfer', callData, fromAccount)
  return {
    ...result,
    transfer: result.write,
  }
}
