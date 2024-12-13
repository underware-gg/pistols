import { Account, BigNumberish } from 'starknet'
import { useSdkPublishSignedMessage } from '@/lib/dojo/hooks/useSdkSignedMessage'
import { useAccount } from '@starknet-react/core'
import { getClientSeconds } from '@/lib/utils/timestamp'
import { TutorialProgress, getTutorialProgressValue } from '@/games/pistols/generated/constants'
import { bigintToHex } from '@/lib/utils/types'


export function usePlayerOnlineSignedMessage(timestamp?: number) {
  const { account } = useAccount()
  const { publish, isPublishing } = useSdkPublishSignedMessage(
    'pistols-PPlayerOnline', {
    identity: bigintToHex(account?.address ?? 0),
    timestamp: Math.floor(timestamp ?? getClientSeconds()),
  }, account as Account)
  return {
    publish,
    isPublishing,
  }
}

export function useTutorialProgressSignedMessage(progress: TutorialProgress) {
  const { account } = useAccount()
  const { publish, isPublishing } = useSdkPublishSignedMessage(
    'pistols-PPlayerTutorialProgress', {
    identity: bigintToHex(account?.address ?? 0),
    progress: getTutorialProgressValue(progress),
  }, account as Account)
  return {
    publish,
    isPublishing,
  }
}

export function usePlayerBookmarkSignedMessage(bookmark: BigNumberish, enabled: boolean) {
  const { account } = useAccount()
  const { publish, isPublishing } = useSdkPublishSignedMessage(
    'pistols-PPlayerBookmark', {
    identity: bigintToHex(account?.address ?? 0),
    bookmark: bigintToHex(bookmark),
    enabled: enabled,
  }, account as Account)
  return {
    publish,
    isPublishing,
  }
}
