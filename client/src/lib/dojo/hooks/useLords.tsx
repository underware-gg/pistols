import { BigNumberish } from 'starknet'
import { useDeployedDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { useConfig } from '@/pistols/stores/configStore'
import { bigintEquals } from '@/lib/utils/types'


export const useLordsContract = () => {
  const { lordsAddress } = useConfig()

  const { contractAddress: mockAddress, isDeployed, abi } = useDeployedDojoSystem('lords_mock')
  const isMock = bigintEquals(lordsAddress, mockAddress) && isDeployed

  return {
    lordsContractAddress: lordsAddress,
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
