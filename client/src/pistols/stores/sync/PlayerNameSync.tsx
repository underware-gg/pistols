import { useEffect, useMemo } from 'react'
import { lookupAddresses } from '@cartridge/controller'
import { usePlayerStore } from '@/pistols/stores/playerStore'
import { useSelectedChain } from '@/lib/dojo/hooks/useChain'
import { useConnectedController } from '@/lib/dojo/hooks/useController'
import { supportedConnetorIds } from '@/lib/dojo/setup/connectors'


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
  const { selectedChainConfig } = useSelectedChain()

  useEffect(() => {
    if (newPlayerAddresses.length == 0) return
    if (controllerConnector) {
      lookupAddresses(newPlayerAddresses).then((result) => {
        updateUsernames(result)
      })
    } else if (connectorId == supportedConnetorIds.PREDEPLOYED) {
      updateUsernames(
        selectedChainConfig.predeployedAccounts.reduce((acc, account) => {
          acc.set(account.address, account.name)
          return acc
        }, new Map<string, string>())
      )
    }
  }, [newPlayerAddresses, connectorId, controllerConnector, selectedChainConfig])

  return (<></>)
}