import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware/pistols-sdk/dojo'
import { useERC20Balance } from '@underware/pistols-sdk/utils/hooks'
import { useDuelistTokenBoundAddress } from '/src/hooks/useTokenContract'
import { useCoinBalance } from '/src/stores/coinStore'
import { constants } from '@underware/pistols-sdk/pistols/gen'

export const useFameContract = () => {
  const { contractAddress: fameContractAddress, abi } = useDojoSystem('fame_coin')
  return {
    fameContractAddress,
    abi,
  }
}

export const useFameBalanceDuelist = (duelistId: BigNumberish, fee: BigNumberish = 0n) => {
  const { address } = useDuelistTokenBoundAddress(duelistId)
  return useFameBalance(address, fee)
}

export const useFameBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { fameContractAddress } = useFameContract()
  const result = useERC20Balance(fameContractAddress, address, fee)
  // const result = useCoinBalance(fameContractAddress, address)
  const lives = useMemo(() => Math.floor(Number(result.balance / constants.FAME.ONE_LIFE)), [result.balance])
  return {
    ...result,
    lives,
    isAlive: (lives > 0),
  }
}
