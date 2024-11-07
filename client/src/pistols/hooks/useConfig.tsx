import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { PistolsQuery, useSdkGetConfig } from '@/lib/dojo/hooks/useSdkQuery'
import { bigintToEntity } from '@/lib/utils/types'
import { CONFIG } from '@/games/pistols/generated/constants'


export const useConfigQuery = () => {
  const query = useMemo<PistolsQuery>(() => ({
    pistols: {
      Config: {
        $: {
          where: {
            key: {
              $eq: CONFIG.CONFIG_KEY,
            },
          },
        },
      },
    },
  }), [])
  const { config } = useSdkGetConfig({ query })
  return config
}

export const useConfig = () => {
  const config = useConfigQuery()
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
