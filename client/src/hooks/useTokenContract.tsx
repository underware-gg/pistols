import { useMemo } from 'react'
import { useDojoSystem, useStarknetContext } from '@underware/pistols-sdk/dojo'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import { getLordsAddress } from '@underware/pistols-sdk/pistols'

//---------------------------------------
// ERC-20
//

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

export const useFameContract = () => {
  const { contractAddress: fameContractAddress, abi } = useDojoSystem('fame_coin')
  return {
    fameContractAddress,
    abi,
  }
}

export const useFoolsContract = () => {
  const { contractAddress: foolsContractAddress, abi } = useDojoSystem('fools_coin')
  return {
    foolsContractAddress,
    abi,
  }
}


//---------------------------------------
// ERC-721
//
export const usePackTokenContract = () => {
  const { contractAddress, abi } = useDojoSystem('pack_token')
  return {
    packContractAddress: contractAddress,
    abi,
  }
}

export const useDuelistTokenContract = () => {
  const { contractAddress, abi } = useDojoSystem('duelist_token')
  return {
    duelistContractAddress: contractAddress,
    abi,
  }
}

export const useDuelTokenContract = () => {
  const { contractAddress, abi } = useDojoSystem('duel_token')
  return {
    duelContractAddress: contractAddress,
    abi,
  }
}
