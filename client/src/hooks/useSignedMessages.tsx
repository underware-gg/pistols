import { useMemo } from 'react'
import { Account } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkPublishTypedData, useDojoSetup } from '@underware/pistols-sdk/dojo'
import {
  make_typed_data_PlayerOnline,
} from '@underware/pistols-sdk/pistols/dojo'


export function usePlayerOnlineSignedMessage(timestamp: number, available: boolean) {
  const { selectedNetworkId } = useDojoSetup()
  const { account } = useAccount()
  const typedData = useMemo(() => (
    timestamp > 0 ? make_typed_data_PlayerOnline({
      networkId: selectedNetworkId,
      identity: account?.address ?? 0,
      timestamp: Math.floor(timestamp),
      available,
    }) : null
  ), [account, timestamp, available])
  const { publish, isPublishing } = useSdkPublishTypedData(account as Account, typedData)
  return {
    publish,
    isPublishing,
  }
}
