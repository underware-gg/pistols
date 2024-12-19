import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware_gg/pistols-sdk/dojo'
import { poseidon } from '@underware_gg/pistols-sdk/utils'

export const useDuelistTokenContract = () => {
  const { contractAddress: duelistContractAddress } = useDojoSystem('duelist_token')
  return {
    duelistContractAddress,
  }
}

export const useDuelTokenContract = () => {
  const { contractAddress: duelContractAddress } = useDojoSystem('duel_token')
  return {
    duelContractAddress,
  }
}

export const useTokenBoundAddress = (contractAddress: BigNumberish, tokenId: BigNumberish) => {
  const address = useMemo(() => poseidon([contractAddress, tokenId]), [contractAddress, tokenId])
  return {
    contractAddress,
    address,
  }
}

export const useDuelistTokenBoundAddress = (duelistId: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  return useTokenBoundAddress(duelistContractAddress, duelistId)
}

