import { BigNumberish } from 'starknet'
import { useERC20Balance } from 'src/hooks/useERC20'
import { useDeployedDojoSystem } from 'src/dojo/hooks/useDojoSystem'
import { useSelectedChain } from 'src/dojo/hooks/useChain'
import { getLordsAddress } from 'src/games/pistols/config/config'
import { bigintEquals } from 'src/utils/types'


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
