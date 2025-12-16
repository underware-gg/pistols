import { useEffect, useMemo, useState } from 'react'
import { lookupAddresses } from '@cartridge/controller'
import { usePlayersAccounts, usePlayerDataStore } from '/src/stores/playerStore'
import { useDojoSetup, useConnectedController } from '@underware/pistols-sdk/dojo'
import { supportedConnetorIds } from '@underware/pistols-sdk/pistols/config'
import { cachedPlayerData } from '@underware/pistols-sdk/pistols/cached'
import { isPositiveBigint } from '@underware/pistols-sdk/utils'
import { debug } from '@underware/pistols-sdk/pistols'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerNameSync() {
  const updateUsernames = usePlayerDataStore((state) => state.updateUsernames)

  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    const usernames = Object.keys(cachedPlayerData).reduce((acc, player_address) => {
      const username = cachedPlayerData[player_address].username;
      if (username) acc.set(player_address, username);
      return acc
    }, new Map<string, string>())
    updateUsernames(usernames)
    setIsInitialized(true)
  }, [])

  // fill predeployed accounts
  const { connectorId, isControllerConnected } = useConnectedController()
  const { selectedNetworkConfig } = useDojoSetup()
  useEffect(() => {
    if (connectorId == supportedConnetorIds.PREDEPLOYED) {
      // use predeployed accounts
      console.log("PlayerNameSync() PREDEPLOYED =>", selectedNetworkConfig.predeployedAccounts)
      updateUsernames(
        selectedNetworkConfig.predeployedAccounts.reduce((acc, account) => {
          acc.set(account.address, account.name)
          return acc
        }, new Map<string, string>())
      )    }
  }, [selectedNetworkConfig])

  // fetch names for new players
  const { playersAccounts } = usePlayersAccounts()
  const players_names = usePlayerDataStore((state) => state.players_names)
  const newPlayerAddresses = useMemo(() => (
    playersAccounts
      .filter(p => players_names[p] === undefined)
      .filter(isPositiveBigint)
      .slice(0, 999) // avoid rate limiting (will fetch the rest when players_names is updated with this batch)
  ), [playersAccounts, players_names])

  useEffect(() => {
    if (isInitialized && isControllerConnected && newPlayerAddresses.length > 0) {
      // fetch controller names
      // console.log(`PlayerNameSync() =================> controllers:`, Object.keys(players_names).length, 'NEW>>', newPlayerAddresses.length)
      lookupAddresses(newPlayerAddresses).then((result) => {
        // debug.log("PlayerNameSync() GOT:", result)
        updateUsernames(result)
      })
    } 
  }, [isInitialized, isControllerConnected, newPlayerAddresses])

  return (<></>)
}
