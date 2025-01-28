import { BigNumberish } from 'starknet'
import { useERC20Balance } from 'src/utils/hooks/useERC20'
import { useDojoSystem } from 'src/dojo/hooks/useDojoSystem'
import { useSelectedChain } from 'src/dojo/hooks/useChain'
import { getLordsAddress } from 'src/games/pistols/config/config'
import { bigintEquals, isPositiveBigint } from 'src/utils/misc/types'
import { useMemo } from 'react'


export const useLordsContract = () => {
  const { selectedChainId } = useSelectedChain()
  const lordsAddress = getLordsAddress(selectedChainId)

  const { contractAddress: mockAddress, abi } = useDojoSystem('lords_mock')
  const isMock = useMemo(() => (
    isPositiveBigint(mockAddress) && bigintEquals(lordsAddress, mockAddress)
  ), [lordsAddress, mockAddress])

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
