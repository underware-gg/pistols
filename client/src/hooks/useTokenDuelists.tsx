import { BigNumberish } from 'starknet'
import { useTokenIdsByAccount, useTokenIdsOfPlayer, useOwnerOfTokenId } from '/src/stores/tokenStore'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useTokenConfig } from '/src/stores/tokenConfigStore'


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
  const { owner, isLoading } = useOwnerOfTokenId(duelistContractAddress, token_id)
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
