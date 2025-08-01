import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { Account } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkPublishTypedData, useDojoSetup } from '@underware/pistols-sdk/dojo'
import { make_typed_data_PlayerOnline } from '@underware/pistols-sdk/pistols/dojo'

interface PublishingState {
  isPublishing: boolean | undefined
  isSuccess: boolean | undefined
  isError: boolean | undefined
  timestamp: number | undefined
  setState: (isPublishing: boolean, isSuccess: boolean | undefined, isError: boolean | undefined) => void
}
const usePublishingtateStore = create<PublishingState>()((set, get) => ({
  isPublishing: undefined,
  isSuccess: undefined,
  isError: undefined,
  timestamp: undefined,
  setState: (isPublishing: boolean, isSuccess: boolean | undefined, isError: boolean | undefined) => {
    set({
      isPublishing,
      isSuccess,
      isError,
      timestamp: (isSuccess !== undefined || isError !== undefined ? Math.floor(Date.now() / 1000) : get().timestamp),
    })
  },
}))

export function usePlayerOnlineSignedMessage(timestamp: number, available: boolean) {
  // Make typed data
  const { account } = useAccount()
  const { selectedNetworkId } = useDojoSetup()
  const typedData = useMemo(() => (
    timestamp > 0 ? make_typed_data_PlayerOnline({
      networkId: selectedNetworkId,
      identity: account?.address ?? 0,
      timestamp: Math.floor(timestamp),
      available,
    }) : null
  ), [account, timestamp, available])
  // publish...
  const { publish, isPublishing, isSuccess, isError } = useSdkPublishTypedData(account as Account, typedData)
  // store globally
  const state = usePublishingtateStore((state) => state)
  useEffect(() => {
    if (isPublishing !== undefined || isSuccess !== undefined || isError !== undefined) {
      // console.log('SET ONLINE>>>>>', isPublishing, isSuccess, isError)
      state.setState(isPublishing, isSuccess, isError)
    }
  }, [isPublishing, isSuccess, isError])
  return {
    publish,
    isPublishing: state.isPublishing,
    isSuccess: state.isSuccess,
    isError: state.isError,
    lastTimestamp: state.timestamp,
  }
}
