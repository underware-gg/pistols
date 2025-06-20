import { useMemo } from 'react'
import { useDojoSystem, useDojoSetup } from '@underware/pistols-sdk/dojo'
import { bigintEquals, isPositiveBigint } from '@underware/pistols-sdk/utils'
import {
  getLordsAddress,
  getFameAddress,
  getFoolsAddress,
  getPackTokenAddress,
  getDuelistTokenAddress,
  getDuelTokenAddress,
  getRingTokenAddress,
  getTournamentTokenAddress,
} from '@underware/pistols-sdk/pistols/config'

export const useTokenContracts = () => {
  const { selectedNetworkId } = useDojoSetup()
  // erc-20
  const lordsContractAddress = getLordsAddress(selectedNetworkId)
  const fameContractAddress = getFameAddress(selectedNetworkId)
  const foolsContractAddress = getFoolsAddress(selectedNetworkId)
  // erc-721
  const packContractAddress = getPackTokenAddress(selectedNetworkId)
  const duelistContractAddress = getDuelistTokenAddress(selectedNetworkId)
  const duelContractAddress = getDuelTokenAddress(selectedNetworkId)
  const ringContractAddress = getRingTokenAddress(selectedNetworkId)
  const tournamentContractAddress = getTournamentTokenAddress(selectedNetworkId)
  return {
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    packContractAddress,
    duelistContractAddress,
    duelContractAddress,
    ringContractAddress,
    tournamentContractAddress,
  }
}

export const useLordsContract = () => {
  const { selectedNetworkId } = useDojoSetup()
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
