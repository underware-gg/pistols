import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useRingTokenStore } from '/src/stores/tokenStore'
import { useMemo } from 'react'

export const useRingTokenCount = () => {
  const { ringContractAddress } = useTokenContracts()
  const { mintedCount, isLoading } = useTokenConfig(ringContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const useRingsOfPlayer = () => {
  const { address } = useAccount()
  const state = useRingTokenStore((state) => state)
  const ringIds = useMemo(() => state.getTokenIdsOfOwner(address).map(id => Number(id)), [state.tokens, address])
  return {
    ringIds,
    isLoading: (state.tokens === null),
  }
}
