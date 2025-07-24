import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useRingTokenStore } from '/src/stores/tokenStore'

export const useRingTokenCount = () => {
  const { ringContractAddress } = useTokenContracts()
  const { mintedCount, isLoading } = useTokenConfig(ringContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const useRingIdsOwnedByPlayer = () => {
  const { address } = useAccount()
  return useRingIdsOwnedByAccount(address)
}

export const useRingIdsOwnedByAccount = (address: BigNumberish) => {
  const state = useRingTokenStore((state) => state)
  const ringIds = useMemo(() => state.getTokenIdsOwnedByAccount(address).map(id => Number(id)), [state.tokens, address])
  return {
    ringIds,
    isLoading: (state.tokens === null),
  }
}
