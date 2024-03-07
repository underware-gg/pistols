import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity } from '../utils/utils'

export const useConfig = () => {
  const { Config } = useDojoComponents()
  const config = useComponentValue(Config, bigintToEntity(1n))
  return {
    lordsAddress: config.lords_address ?? null,
    duelFeeMin: config.duel_fee_min ?? null,
    duelFeePct: config.duel_fee_pct ?? null,
  }
}
