import { useMemo } from 'react'
import { useDojoSystem, useStarknetContext } from '@underware/pistols-sdk/dojo'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import {
  getFoolsAddress,
  getDuelistTokenAddress,
  getFameAddress,
  getLordsAddress,
  getPackTokenAddress,
  getDuelTokenAddress,
  getTournamentTokenAddress,
} from '@underware/pistols-sdk/pistols'

export const useTokenContracts = () => {
  const { selectedNetworkId } = useStarknetContext()
  // erc-20
  const lordsContractAddress = getLordsAddress(selectedNetworkId)
  const fameContractAddress = getFameAddress(selectedNetworkId)
  const foolsContractAddress = getFoolsAddress(selectedNetworkId)
  // erc-721
  const packContractAddress = getPackTokenAddress(selectedNetworkId)
  const duelistContractAddress = getDuelistTokenAddress(selectedNetworkId)
  const duelContractAddress = getDuelTokenAddress(selectedNetworkId)
  const tournamentContractAddress = getTournamentTokenAddress(selectedNetworkId)
  return {
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    packContractAddress,
    duelistContractAddress,
    duelContractAddress,
    tournamentContractAddress,
  }
}

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
