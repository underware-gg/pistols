import { BigNumberish } from 'starknet'
import { useDojoSystem } from '@underware/pistols-sdk/dojo'
import { useERC20Balance } from '@underware/pistols-sdk/utils/hooks'
import { useCoinBalance } from '/src/stores/coinStore'

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
  // return useCoinBalance(foolsContractAddress, address)
}
