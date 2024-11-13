import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'
import { useGetConfigQuery } from '@/pistols/hooks/useSdkQueries'



export const useConfig = () => {
  const { config } = useGetConfigQuery()
  const isPaused = useMemo(() => config?.is_paused ?? false, [config])
  const treasuryAddress = useMemo(() => config ? BigInt(config.treasury_address) : null, [config])
  const lordsAddress = useMemo(() => config ? BigInt(config.lords_address) : null, [config])
  return {
    isPaused,
    treasuryAddress,
    lordsAddress,
  }
}

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const { TokenConfig } = useDojoComponents()
  const entityId = useMemo(() => bigintToEntity(contractAddress), [])
  const token_config = useComponentValue(TokenConfig, entityId)
  return {
    // minterAddress: token_config?.minter_address ?? null,
    // rendererAddress: token_config?.renderer_address ?? null,
    mintedCount: token_config?.minted_count ?? null,
    isPending: (token_config == null),
  }
}
