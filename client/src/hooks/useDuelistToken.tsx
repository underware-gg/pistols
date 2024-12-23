import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '@/stores/tokenConfigStore'
import { useERC721OwnerOf } from '@underware_gg/pistols-sdk/hooks'
import { useDuelistTokenContract } from '@/hooks/useTokenContract'
import { useTokenIdsByOwner, useTokenIdsOfPlayer } from '@/stores/duelistTokenStore'
import { PROFILE_PIC_COUNT } from '@/utils/constants'
import { poseidon } from '@underware_gg/pistols-sdk/utils'


export const useDuelistTokenCount = () => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { mintedCount, isLoading } = useTokenConfig(duelistContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const useOwnerOfDuelist = (token_id: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { owner, isLoading } = useERC721OwnerOf(duelistContractAddress, token_id)
  return {
    owner,
    isLoading,
  }
}

export const useDuelistsOfPlayer = () => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { tokenIds } = useTokenIdsOfPlayer(duelistContractAddress)
  return {
    duelistIds: tokenIds,
    isLoading: false,
  }
}

export const useDuelistsOfOwner = (owner: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { tokenIds, isLoading } = useTokenIdsByOwner(duelistContractAddress, owner)
  return {
    duelistIds: tokenIds,
    isLoading,
  }
}

export const useNextRandomProfilePic = () => {
  const { address } = useAccount()
  const { duelistIds } = useDuelistsOfPlayer()
  const randomPic = useMemo(() => 
    (Number(poseidon([address ?? 0n, duelistIds.length ?? 0n]) % BigInt(PROFILE_PIC_COUNT)) + 1),
  [address, duelistIds.length])
  return {
    randomPic,
  }
}
