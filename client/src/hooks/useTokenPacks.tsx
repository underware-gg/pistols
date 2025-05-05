import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { useTokenContracts } from '/src/hooks/useTokenContracts'
import { useTokenIdsByAccount } from '/src/stores/tokenStore'
import { useMemo } from 'react'

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
  const { packContractAddress } = useTokenContracts()
  const { tokenIds, isLoading } = useTokenIdsByAccount(packContractAddress, address)

  const packIds = useMemo(() => tokenIds.map(id => Number(id)), [tokenIds])
  return {
    packIds,
    isLoading,
  }
}
