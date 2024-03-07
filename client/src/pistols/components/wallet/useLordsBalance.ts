import { useCoin } from '@/pistols/hooks/useConfig'
import { bigintToHex } from '@/pistols/utils/utils'
import { useBalance } from '@starknet-react/core'

export const useLordsBalance = (address: string) => {
  const { contractAddress } = useCoin()
  const { data: balance } = useBalance({ address, token: bigintToHex(contractAddress), watch: true, refetchInterval: 5_000 })
  // console.log(balance)

  return {
    lordsBalance: balance?.value ?? 0n,
  }
}

