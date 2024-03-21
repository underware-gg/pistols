import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/dojo/DojoContext'
import { bigintToEntity } from '@/lib/utils/type'
import { feltToString } from '@/lib/utils/starknet'

export const useConfig = () => {
  const { Config } = useDojoComponents()
  const config = useComponentValue(Config, bigintToEntity(1n))
  return {
    initialized: config.initialized ?? null,
    paused: config.paused ?? null,
    treasury_address: config.treasury_address ?? null,
  }
}

export const COIN_LORDS = 1;

export const useCoin = (coinKey:number = COIN_LORDS) => {
  const { Coin } = useDojoComponents()
  const coin = useComponentValue(Coin, bigintToEntity(BigInt(coinKey)))
  return {
    contractAddress: coin?.contract_address ?? 0n,
    description: coin ? feltToString(coin.description) : '?',
    feeMin: coin?.fee_min ?? null,
    feePct: coin?.fee_pct ?? null,
    enabled: coin?.enabled ?? false,
  }
}