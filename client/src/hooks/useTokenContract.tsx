import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware/pistols-sdk/dojo'
import { poseidon } from '@underware/pistols-sdk/utils/starknet'

export const usePackTokenContract = () => {
  const { contractAddress } = useDojoSystem('pack_token')
  return {
    packContractAddress: contractAddress,
  }
}

export const useDuelistTokenContract = () => {
  const { contractAddress } = useDojoSystem('duelist_token')
  return {
    duelistContractAddress: contractAddress,
  }
}

export const useDuelTokenContract = () => {
  const { contractAddress } = useDojoSystem('duel_token')
  return {
    duelContractAddress: contractAddress,
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

