import { useCallback } from 'react'
import { PredeployedAccount } from 'src/games/pistols/config/networks'
import { PredeployedConnector } from 'src/games/pistols/dojo/predeployed'

export const usePredeployedConnector = (nodeUrl: string, chainId: string, predeployedAccounts: PredeployedAccount[]) => {
  const predeployed = useCallback(() => {
    return new PredeployedConnector(nodeUrl, chainId, predeployedAccounts)
  }, [nodeUrl, chainId, predeployedAccounts])
  return {
    predeployed,
  }
}
