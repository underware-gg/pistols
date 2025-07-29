import { useEffect, useMemo } from 'react'
import { lookupAddresses } from '@cartridge/controller'
import { usePlayersAccounts, usePlayerDataStore } from '/src/stores/playerStore'
import { useDojoSetup, useConnectedController } from '@underware/pistols-sdk/dojo'
import { supportedConnetorIds } from '@underware/pistols-sdk/pistols/config'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerNameSync() {
  const updateUsernames = usePlayerDataStore((state) => state.updateUsernames)
  const players_names = usePlayerDataStore((state) => state.players_names)
  const { playersAccounts } = usePlayersAccounts()

  const newPlayerAddresses = useMemo(() => (
    playersAccounts
      .filter(p => players_names[p] === undefined)
      .filter(isPositiveBigint)
      .slice(0, 999) // avoid rate limiting (will fetch the rest when players_names is updated with this batch)
  ), [playersAccounts, players_names])

  const { connectorId, isControllerConnected } = useConnectedController()
  const { selectedNetworkConfig } = useDojoSetup()

  useEffect(() => {
    if (newPlayerAddresses.length == 0) return
    if (connectorId == supportedConnetorIds.PREDEPLOYED) {
      // use predeployed accounts
      updateUsernames(
        selectedNetworkConfig.predeployedAccounts.reduce((acc, account) => {
          acc.set(account.address, account.name)
          return acc
        }, new Map<string, string>())
      )
    } else if (isControllerConnected) {
      // fetch controller names
      // console.log(`PlayerNameSync() =================> controllers:`, Object.keys(players_names).length, 'NEW>>', newPlayerAddresses.length)
      lookupAddresses(newPlayerAddresses).then((result) => {
        // debug.log("PlayerNameSync() GOT:", result)
        updateUsernames(result)
      })
    } 
  }, [newPlayerAddresses, connectorId, isControllerConnected, selectedNetworkConfig])

  return (<></>)
}
