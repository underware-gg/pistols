import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'

export const useConfig = () => {
  const { Config } = useDojoComponents()
  const config = useComponentValue(Config, bigintToEntity(1n))
  return {
    initialized: config.initialized ?? null,
    paused: config.paused ?? null,
    ownerAddress: config.owner_address ?? null,
    treasuryAddress: config.treasury_address ?? null,
    duelistAddress: config.token_duelist_address ?? null,
    minterAddress: config.minter_address ?? null,
  }
}
