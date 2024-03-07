import { useCoin, COIN_LORDS } from '@/pistols/hooks/useConfig'
import { bigintToHex } from '@/pistols/utils/utils'
import { useBalance } from '@starknet-react/core'

export const useLordsBalance = (address: string) => {
  const { contractAddress } = useCoin(COIN_LORDS)
  const { data: balance } = useBalance({ address, token: bigintToHex(contractAddress), watch: true, refetchInterval: 5_000 })
  console.log(balance)

  return {
    balance: balance?.value ?? 0n,        // wei
    formatted: balance?.formatted ?? 0,   // eth
    decimals: balance?.decimals ?? 0,     // 18
    symbol: balance?.symbol ?? '?',       // eth
  }
}
