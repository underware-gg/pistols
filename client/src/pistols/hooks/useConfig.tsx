import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'

export const useConfig = () => {
  const { Config } = useDojoComponents()
  const entityId = useMemo(() => bigintToEntity(1n), [])
  const config = useComponentValue(Config, entityId)
  return {
    paused: config.is_paused ?? null,
    treasuryAddress: config.treasury_address ?? null,
  }
}

export const useTokenConfig = (contractAddress: BigNumberish) => {
  const { TokenConfig } = useDojoComponents()
  const entityId = useMemo(() => bigintToEntity(contractAddress), [])
  const token_config = useComponentValue(TokenConfig, entityId)
  return {
    // minterAddress: token_config?.minter_address ?? null,
    // treasuryAddress: token_config?.treasury_address ?? null,
    // rendererAddress: token_config?.renderer_address ?? null,
    feeAmount: token_config?.fee_amount ?? null,
    mintedCount: token_config?.minted_count ?? null,
    isPending: (token_config == null),
  }
}
