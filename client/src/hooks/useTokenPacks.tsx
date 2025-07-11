import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { usePackTokenStore } from '/src/stores/tokenStore'

export const usePackTokenCount = () => {
  const { packContractAddress } = useTokenContracts()
  const { mintedCount, isLoading } = useTokenConfig(packContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const usePacksOfPlayer = () => {
  const { address } = useAccount()
  return usePacksOfOwner(address);
}

export const usePacksOfOwner = (address: BigNumberish) => {
  const state = usePackTokenStore((state) => state)
  const packIds = useMemo(() => state.getTokenIdsOfOwner(address).map(id => Number(id)), [state.tokens, address])
  return {
    packIds,
    isLoading: (state.tokens === null),
  }
}
