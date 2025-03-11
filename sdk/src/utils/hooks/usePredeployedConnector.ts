import { useCallback } from 'react'
import { PredeployedConnector, PredeployedAccount } from 'src/utils/starknet/predeployed'

export const usePredeployedConnector = (nodeUrl: string, chainId: string, predeployedAccounts: PredeployedAccount[]) => {
  const predeployed = useCallback(() => {
    return new PredeployedConnector(nodeUrl, chainId, predeployedAccounts)
  }, [nodeUrl, chainId, predeployedAccounts])
  return {
    predeployed,
  }
}
