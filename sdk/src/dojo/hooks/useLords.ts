import { BigNumberish } from 'starknet'
import { useERC20Balance } from '../../hooks'
import { bigintEquals } from '../../utils'
import {
  useDeployedDojoSystem,
  useSelectedChain,
} from '../../dojo'
import {
  getLordsAddress,
} from '../../games/pistols'


export const useLordsContract = () => {
  const lordsAddress = getLordsAddress()

  const { contractAddress: mockAddress, isDeployed, abi } = useDeployedDojoSystem('lords_mock')
  const isMock = bigintEquals(lordsAddress, mockAddress) && isDeployed

  return {
    lordsContractAddress: lordsAddress || mockAddress,
    isMock,
    abi,
  }
}

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { lordsContractAddress } = useLordsContract()
  return useERC20Balance(lordsContractAddress, address, fee)
}

export const useEtherBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { selectedChainConfig } = useSelectedChain()
  return useERC20Balance(selectedChainConfig.etherAddress, address, fee)
}
