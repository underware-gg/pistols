import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelistTokenStore } from '/src/stores/tokenStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useAccount } from '@starknet-react/core'


export const useDuelistTokenCount = () => {
  const { duelistContractAddress } = useTokenContracts()
  const { mintedCount, isLoading } = useTokenConfig(duelistContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const useOwnerOfDuelist = (token_id: BigNumberish) => {
  const state = useDuelistTokenStore((state) => state)
  const owner = useMemo(() => state.getOwnerOfTokenId(token_id), [state.tokens, token_id])
  return {
    owner,
    isLoading: (state.tokens === null),
  }
}

export const useDuelistsOwnedByPlayer = () => {
  const { address } = useAccount()
  return useDuelistIdsOwnedByAccount(address)
}

export const useDuelistIdsOwnedByAccount = (owner: BigNumberish) => {
  const state = useDuelistTokenStore((state) => state)
  const tokenIds = useMemo(() => state.getTokenIdsOwnedByAccount(owner), [state.tokens, owner])
  return {
    duelistIds: tokenIds,
    isLoading: (state.tokens === null),
  }
}

export const useDuelistIdsOwnedByAccounts = (owners: BigNumberish[]) => {
  const state = useDuelistTokenStore((state) => state)
  const tokenIds = useMemo(() => state.getTokenIdsOwnedByAccounts(owners), [state.tokens, owners])
  return {
    duelistIds: tokenIds,
    isLoading: (state.tokens === null),
  }
}
