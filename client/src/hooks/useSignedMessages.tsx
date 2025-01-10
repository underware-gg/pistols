import { useMemo } from 'react'
import { Account, BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useSdkPublishTypedData } from '@underware_gg/pistols-sdk/dojo'
import {
  constants,
  make_typed_data_PlayerBookmark,
  make_typed_data_PlayerOnline,
  make_typed_data_PlayerTutorialProgress,
} from '@underware_gg/pistols-sdk/pistols'


export function usePlayerOnlineSignedMessage(timestamp: number) {
  const { account } = useAccount()
  const typedData = useMemo(() => (
    make_typed_data_PlayerOnline({
      identity: account?.address ?? 0,
      timestamp: Math.floor(timestamp),
    })
  ), [account, timestamp])
  const { publish, isPublishing } = useSdkPublishTypedData(account as Account, typedData)
  return {
    publish,
    isPublishing,
  }
}

export function useTutorialProgressSignedMessage(progress: constants.TutorialProgress) {
  const { account } = useAccount()
  const typedData = useMemo(() => (
    make_typed_data_PlayerTutorialProgress({
      identity: account?.address ?? 0,
      progress,
    })
  ), [account, progress])
  const { publish, isPublishing } = useSdkPublishTypedData(account as Account, typedData)
  return {
    publish,
    isPublishing,
  }
}

export function usePlayerBookmarkSignedMessage(target_address: BigNumberish, target_id: BigNumberish, enabled: boolean) {
  const { account } = useAccount()
  const typedData = useMemo(() => (
    make_typed_data_PlayerBookmark({
      identity: account?.address ?? 0,
      target_address,
      target_id,
      enabled,
    })
  ), [account, target_address, target_id, enabled])
  const { publish, isPublishing } = useSdkPublishTypedData(account as Account, typedData)
  return {
    publish,
    isPublishing,
  }
}
