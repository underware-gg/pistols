import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useContractWrite } from 'src/utils/hooks/useContractWrite'
import { bigintToU256 } from 'src/starknet/starknet'
import { bigintToHex } from 'src/utils/misc/types'
import { erc20_abi } from 'src/abis/abis'

export function useDojoERC20Transfer(contractAddress: BigNumberish, toAddress: BigNumberish, amount: bigint) {
  const { low, high } = useMemo(() => bigintToU256(amount), [amount])
  const callData = useMemo(() => {
    return [
      bigintToHex(toAddress),
      bigintToHex(low),
      bigintToHex(high),
    ]
  }, [toAddress, low, high])
  const result = useContractWrite(contractAddress, erc20_abi, 'transfer', callData)
  return {
    ...result,
    transfer: result.write,
  }
}
