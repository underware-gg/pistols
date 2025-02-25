import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware_gg/pistols-sdk/dojo'
import { useERC20Balance } from '@underware_gg/pistols-sdk/utils/hooks'

export const useFoolsContract = () => {
  const { contractAddress: foolsContractAddress, abi } = useDojoSystem('fools_coin')
  return {
    foolsContractAddress,
    abi,
  }
}

export const useFoolsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { foolsContractAddress } = useFoolsContract()
  return useERC20Balance(foolsContractAddress, address, fee)
}
