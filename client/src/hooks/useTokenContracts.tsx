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
  getBotPlayerAddress,
  getMatchmakerAddress,
} from '@underware/pistols-sdk/pistols/config'

export const useTokenContracts = () => {
  const { selectedNetworkId } = useDojoSetup()
  // erc-20
  const lordsContractAddress = useMemo(() => getLordsAddress(selectedNetworkId), [selectedNetworkId])
  const fameContractAddress = useMemo(() => getFameAddress(selectedNetworkId), [selectedNetworkId])
  const foolsContractAddress = useMemo(() => getFoolsAddress(selectedNetworkId), [selectedNetworkId])
  // erc-721
  const packContractAddress = useMemo(() => getPackTokenAddress(selectedNetworkId), [selectedNetworkId])
  const duelistContractAddress = useMemo(() => getDuelistTokenAddress(selectedNetworkId), [selectedNetworkId])
  const duelContractAddress = useMemo(() => getDuelTokenAddress(selectedNetworkId), [selectedNetworkId])
  const ringContractAddress = useMemo(() => getRingTokenAddress(selectedNetworkId), [selectedNetworkId])
  const tournamentContractAddress = useMemo(() => getTournamentTokenAddress(selectedNetworkId), [selectedNetworkId])
  // misc
  const botPlayerContractAddress = useMemo(() => getBotPlayerAddress(selectedNetworkId), [selectedNetworkId])
  const matchmakerContractAddress = useMemo(() => getMatchmakerAddress(selectedNetworkId), [selectedNetworkId])

  const erc20Tokens = useMemo(() => ({
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
  }), [lordsContractAddress, fameContractAddress, foolsContractAddress])
  const erc721Tokens = useMemo(() => ({
    packContractAddress,
    duelistContractAddress,
    duelContractAddress,
    ringContractAddress,
    tournamentContractAddress,
}), [packContractAddress, duelistContractAddress, duelContractAddress, ringContractAddress, tournamentContractAddress])
  const allTokens = useMemo(() => ({
    ...erc20Tokens,
    ...erc721Tokens,
  }), [erc20Tokens, erc721Tokens])
  
  return {
    // erc20
    lordsContractAddress,
    fameContractAddress,
    foolsContractAddress,
    erc20Tokens,
    // erc721
    packContractAddress,
    duelistContractAddress,
    duelContractAddress,
    ringContractAddress,
    tournamentContractAddress,
    erc721Tokens,
    // misc
    allTokens,
    botPlayerContractAddress,
    matchmakerContractAddress,
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
