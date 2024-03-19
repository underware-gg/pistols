import { bigintToHex } from '@/lib/utils/type'
import { useBalance } from '@starknet-react/core'
import { useMemo } from 'react'
import { BigNumberish } from 'starknet'

export const useLordsBalance = (contractAddress:BigNumberish, address: BigNumberish, fee: BigNumberish = 0) => {
  const { data: balance } = useBalance({ address: BigInt(address).toString(), token: bigintToHex(contractAddress), watch: true, refetchInterval: 5_000 })
  // console.log(balance)

  const noFunds = useMemo(() => {
    if (!fee || !balance) return false
    return (BigInt(balance.value) < BigInt(fee))
  }, [balance, fee])

  return {
    balance: balance?.value ?? 0n,        // wei
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
    noFunds,
  }
}
