import { BigNumberish } from 'starknet'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useERC721OwnerOf } from '@underware/pistols-sdk/utils/hooks'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTokenIdsByAccount, useTokenIdsOfPlayer } from '/src/stores/tokenStore'


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
  const { tokenIds, isLoading } = useTokenIdsOfPlayer(duelistContractAddress)
  return {
    duelistIds: tokenIds,
    isLoading,
  }
}

export const useDuelistsOfOwner = (owner: BigNumberish) => {
  const { duelistContractAddress } = useDuelistTokenContract()
  const { tokenIds, isLoading } = useTokenIdsByAccount(duelistContractAddress, owner)
  return {
    duelistIds: tokenIds,
    isLoading,
  }
}
