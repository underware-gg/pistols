import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { useDuelistTokenBoundAddress } from '@/pistols/hooks/useTokenContract'

export const useFameContract = () => {
  const { contractAddress: fameContractAddress, abi } = useDojoSystem('fame_coin')
  return {
    fameContractAddress,
    abi,
  }
}

export const useFameBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { fameContractAddress } = useFameContract()
  return useERC20Balance(fameContractAddress, address, fee)
}

export const useFameBalanceDuelist = (duelistId: BigNumberish, fee: BigNumberish = 0n) => {
  const { address } = useDuelistTokenBoundAddress(duelistId)
  return useFameBalance(address, fee)
}
