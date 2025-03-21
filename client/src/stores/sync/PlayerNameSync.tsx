import { useEffect, useMemo } from 'react'
import { lookupAddresses } from '@cartridge/controller'
import { usePlayerStore } from '/src/stores/playerStore'
import { useStarknetContext, useConnectedController, supportedConnetorIds } from '@underware/pistols-sdk/dojo'


//------------------------------------------------------
// Add only once to a top level component
//
export function PlayerNameSync() {
  const players = usePlayerStore((state) => state.players)
  const updateUsernames = usePlayerStore((state) => state.updateUsernames)
  
  const newPlayerAddresses = useMemo(() => (
    Object.keys(players).filter(p => players[p].isNew)
  ), [players])

  const { connectorId, controllerConnector } = useConnectedController()
  const { selectedNetworkConfig } = useStarknetContext()

  useEffect(() => {
    if (newPlayerAddresses.length == 0) return
    if (controllerConnector) {
      lookupAddresses(newPlayerAddresses).then((result) => {
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
  }, [newPlayerAddresses, connectorId, controllerConnector, selectedNetworkConfig])

  return (<></>)
}
