import { BigNumberish } from 'starknet'
import { useERC20Balance } from 'src/utils/hooks/useERC20'
import { useDojoSystem } from 'src/dojo/hooks/useDojoSystem'
import { useStarknetContext } from 'src/dojo/contexts/StarknetProvider'
import { getLordsAddress } from 'src/games/pistols/config/config'
import { bigintEquals, isPositiveBigint } from 'src/utils/misc/types'
import { useMemo } from 'react'


export const useLordsContract = () => {
  const { selectedNetworkId } = useStarknetContext()
  const lordsAddress = getLordsAddress(selectedNetworkId)

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
  const { selectedNetworkConfig } = useStarknetContext()
  return useERC20Balance(selectedNetworkConfig.etherAddress, address, fee, watch)
}
