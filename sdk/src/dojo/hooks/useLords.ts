import { BigNumberish } from 'starknet'
import { useERC20Balance } from 'src/utils/hooks/useERC20'
import { useDeployedDojoSystem } from 'src/dojo/hooks/useDojoSystem'
import { useSelectedChain } from 'src/dojo/hooks/useChain'
import { getLordsAddress } from 'src/games/pistols/config/config'
import { bigintEquals } from 'src/utils/misc/types'


export const useLordsContract = () => {
  const { selectedChainId } = useSelectedChain()
  const lordsAddress = getLordsAddress(selectedChainId)

  const { contractAddress: mockAddress, isDeployed, abi } = useDeployedDojoSystem('lords_mock')
  const isMock = bigintEquals(lordsAddress, mockAddress) && isDeployed

  return {
    lordsContractAddress: lordsAddress || mockAddress,
    isMock,
    abi,
  }
}

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n, watch: boolean = false) => {
  const { lordsContractAddress } = useLordsContract()
  return useERC20Balance(lordsContractAddress, address, fee, watch)
}

export const useEtherBalance = (address: BigNumberish, fee: BigNumberish = 0n, watch: boolean = false) => {
  const { selectedChainConfig } = useSelectedChain()
  return useERC20Balance(selectedChainConfig.etherAddress, address, fee, watch)
}
