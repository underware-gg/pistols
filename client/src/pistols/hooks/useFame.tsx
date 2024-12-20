import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware_gg/pistols-sdk/dojo'
import { useERC20Balance } from '@underware_gg/pistols-sdk/hooks'
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
