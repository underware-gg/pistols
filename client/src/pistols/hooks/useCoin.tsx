import { useComponentValue } from '@dojoengine/react'
import { useDojoComponents } from '@/lib/dojo/DojoContext'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { bigintToEntity } from '@/lib/utils/types'
import { feltToString } from '@/lib/utils/starknet'
import { BigNumberish } from 'starknet'

export const useCoin = (coinKey: number) => {
  const { Coin } = useDojoComponents()
  const coin = useComponentValue(Coin, bigintToEntity(BigInt(coinKey ?? 0n)))
  return {
    contractAddress: coin?.contract_address ?? 0n,
    description: coin ? feltToString(coin.description) : '?',
    feeMin: coin?.fee_min ?? null,
    feePct: coin?.fee_pct ?? null,
    enabled: coin?.enabled ?? false,
  }
}

export const useCoinBalance = (coin: number, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useCoin(coin)
  return useERC20Balance(contractAddress, address, fee)
}
