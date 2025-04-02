import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { makeTokenBoundAddress } from '@underware/pistols-sdk/pistols'
import { useTokenContracts } from '/src/hooks/useTokenContracts'

export const useTokenBoundAddress = (contractAddress: BigNumberish, tokenId: BigNumberish) => {
  const address = useMemo(() => makeTokenBoundAddress(contractAddress, tokenId), [contractAddress, tokenId])
  return {
    contractAddress,
    address,
  }
}

export const useDuelistTokenBoundAddress = (duelistId: BigNumberish) => {
  const { duelistContractAddress } = useTokenContracts()
  return useTokenBoundAddress(duelistContractAddress, duelistId)
}
