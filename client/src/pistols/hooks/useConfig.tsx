import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/types'

export const useConfig = () => {
  const { Config } = useDojoComponents()
  const config = useComponentValue(Config, bigintToEntity(1n))
  return {
    paused: config.paused ?? null,
    ownerAddress: config.owner_address ?? null,
    treasuryAddress: config.treasury_address ?? null,
  }
}
