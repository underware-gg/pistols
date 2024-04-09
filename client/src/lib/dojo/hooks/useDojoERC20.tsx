import { useMemo } from 'react'
import { useDojoContractWrite } from '@/lib/dojo/hooks/useDojoContractWrite'
import { splitU256 } from '@/lib/utils/starknet'
import { bigintToHex } from '@/lib/utils/types'
import { erc20_abi } from '@/lib/abi'
import { BigNumberish } from 'starknet'

export function useDojoERC20Transfer(contractAddress: BigNumberish, toAddress: BigNumberish, amount: bigint) {
  const { low, high } = useMemo(() => splitU256(amount), [amount])
  const callData = useMemo(() => {
    return [
      bigintToHex(toAddress),
      bigintToHex(low),
      bigintToHex(high),
    ]
  }, [toAddress, low, high])
  const result = useDojoContractWrite(contractAddress, erc20_abi, 'transfer', callData)
  return {
    ...result,
    transfer: result.write,
  }
}
