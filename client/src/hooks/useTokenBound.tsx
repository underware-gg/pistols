import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { makeTokenBoundAddress } from '@underware/pistols-sdk/pistols'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'

export const useTokenBoundAddress = (contractAddress: BigNumberish, tokenId: BigNumberish) => {
  const address = useMemo(() => makeTokenBoundAddress(contractAddress, tokenId), [contractAddress, tokenId])
  return {
    contractAddress,
    address,
  }
}

export const useDuelistTokenBoundAddress = (duelistId: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  return useTokenBoundAddress(duelistContractAddress, duelistId)
}
