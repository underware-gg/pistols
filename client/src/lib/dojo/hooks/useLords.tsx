import { useMemo } from 'react'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { BigNumberish } from 'starknet'


export const useLordsContract = () => {
  const { selectedChainConfig } = useStarknetContext()
  const lordsAddress = useMemo(() => (selectedChainConfig.lordsContractAddress), [selectedChainConfig])

  const { contractAddress: mockAddress, isDeployed, abi } = useDojoSystem('lords_mock')
  const isMock = !lordsAddress && isDeployed

  return {
    contractAddress: (isMock ? mockAddress : lordsAddress),
    isMock,
    abi,
  }
}

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useLordsContract()
  return useERC20Balance(contractAddress, address, fee)
}

export const useEtherBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { selectedChainConfig } = useSelectedChain()
  return useERC20Balance(selectedChainConfig.etherAddress, address, fee)
}
