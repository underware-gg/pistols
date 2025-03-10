import { useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware_gg/pistols-sdk/dojo'
import { useERC20Balance } from '@underware_gg/pistols-sdk/utils/hooks'
import { useDuelistTokenBoundAddress } from '/src/hooks/useTokenContract'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'

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
  const lives = useMemo(() => Math.floor(Number(result.balance / constants.FAME.ONE_LIFE)), [result.balance])
  return {
    ...result,
    lives,
    isAlive: (lives > 0),
  }
}
