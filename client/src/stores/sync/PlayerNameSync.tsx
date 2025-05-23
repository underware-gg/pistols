import { useEffect, useMemo } from 'react'
import { lookupAddresses } from '@cartridge/controller'
import { usePlayersAccounts, usePlayerDataStore } from '/src/stores/playerStore'
import { useStarknetContext, useConnectedController, supportedConnetorIds } from '@underware/pistols-sdk/dojo'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerNameSync() {
  const updateUsernames = usePlayerDataStore((state) => state.updateUsernames)
  const players_names = usePlayerDataStore((state) => state.players_names)
  const { playersAccounts } = usePlayersAccounts()

  const newPlayerAddresses = useMemo(() => (
    playersAccounts.filter(p => players_names[p] === undefined)
  ), [playersAccounts, players_names])

  const { connectorId, isControllerConnected } = useConnectedController()
  const { selectedNetworkConfig } = useStarknetContext()

  useEffect(() => {
    if (newPlayerAddresses.length == 0) return
    if (isControllerConnected) {
      lookupAddresses(newPlayerAddresses).then((result) => {
        // console.log("PlayerNameSync() GOT:", newPlayerAddresses, result)
        updateUsernames(result)
      })
    } else if (connectorId == supportedConnetorIds.PREDEPLOYED) {
      updateUsernames(
        selectedNetworkConfig.predeployedAccounts.reduce((acc, account) => {
          acc.set(account.address, account.name)
          return acc
        }, new Map<string, string>())
      )
    }
  }, [newPlayerAddresses, connectorId, isControllerConnected, selectedNetworkConfig])

  return (<></>)
}
