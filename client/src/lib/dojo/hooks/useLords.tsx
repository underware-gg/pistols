import { useMemo } from 'react'
import { useStarknetContext } from '@/lib/dojo/StarknetProvider'
import { useDojoSystem } from '@/lib/dojo/hooks/useDojoSystem'
import { useERC20Balance } from '@/lib/utils/hooks/useERC20'
import { BigNumberish } from 'starknet'


export const useLordsContract = () => {
  const { selectedChainConfig } = useStarknetContext()
  const contractAddress = useMemo(() => (selectedChainConfig.lordsContractAddress), [selectedChainConfig])

  const { systemAddress, systemExists, abi } = useDojoSystem('lords_mock')
  const isMock = !contractAddress && systemExists

  return {
    contractAddress: (isMock ? systemAddress : contractAddress),
    abi: (isMock ? abi : null),
    isMock,
  }
}

export const useLordsBalance = (address: BigNumberish, fee: BigNumberish = 0n) => {
  const { contractAddress } = useLordsContract()
  return useERC20Balance(contractAddress, address, fee)
}
