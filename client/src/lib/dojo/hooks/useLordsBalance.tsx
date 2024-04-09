import { bigintToHex } from '@/lib/utils/types'
import { useCoin, COIN_LORDS } from '@/pistols/hooks/useConfig'
import { useBalance } from '@starknet-react/core'
import { useMemo } from 'react'
import { BigNumberish } from 'starknet'

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useCoin(COIN_LORDS)
  return useCoinBalance(contractAddress, address, fee)
}

export const useCoinBalance = (contractAddress: BigNumberish, address: BigNumberish, fee: BigNumberish = 0n) => {
  const { data: balance } = useBalance({ address: BigInt(address ?? 0n).toString(), token: bigintToHex(contractAddress), watch: true, refetchInterval: 5_000 })

  const noFundsForFee = useMemo(() => {
    if (!fee || !balance) return false
    return (BigInt(balance.value) < BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance?.value ?? 0n,        // wei
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
    noFundsForFee,
  }
}
