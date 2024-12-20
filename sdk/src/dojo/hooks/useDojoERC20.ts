import { useMemo } from 'react'
import { BigNumberish, Account } from 'starknet'
import { useContractWrite } from 'src/hooks/useContractWrite'
import { bigintToU256 } from 'src/utils/starknet'
import { bigintToHex } from 'src/utils/types'
import { erc20_abi } from 'src/abis/abis'

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
