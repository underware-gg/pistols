import { useAccount } from '@starknet-react/core'
import { useTokenConfig } from '/src/stores/tokenConfigStore'
import { usePackTokenContract } from '/src/hooks/useTokenContract'
import { useTokenIdsByAccount } from '/src/stores/tokenStore'

export const usePackTokenCount = () => {
  const { packContractAddress } = usePackTokenContract()
  const { mintedCount, isLoading } = useTokenConfig(packContractAddress)
  return {
    tokenCount: mintedCount ?? 0,
    isLoading,
  }
}

export const usePacksOfPlayer = () => {
  const { address } = useAccount()
  const { packContractAddress } = usePackTokenContract()
  const { tokenIds, isLoading } = useTokenIdsByAccount(packContractAddress, address)
  return {
    packIds: tokenIds.map(id => Number(id)),
    isLoading,
  }
}
