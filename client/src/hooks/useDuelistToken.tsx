import { BigNumberish } from 'starknet'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useERC721OwnerOf } from '@underware_gg/pistols-sdk/hooks'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTokenIdsByOwner, useTokenIdsOfPlayer } from '/src/stores/duelistTokenStore'


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
