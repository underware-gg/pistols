import { useMemo } from 'react'
import { useBalance } from '@starknet-react/core'
import { bigintToHex } from '@/lib/utils/types'
import { BigNumberish } from 'starknet'

export const useERC20Balance = (contractAddress: BigNumberish, ownerAddress: BigNumberish, fee: BigNumberish = 0n) => {
  const { data: balance } = useBalance({
    token: bigintToHex(contractAddress),
    address: bigintToHex(ownerAddress),
    watch: true,
    refetchInterval: 1_000,
    enabled: (Boolean(contractAddress) && Boolean(ownerAddress)),
  })
  // console.log(`BALANCE`, shortAddress(bigintToHex(contractAddress)), shortAddress(bigintToHex(ownerAddress)), balance)

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
