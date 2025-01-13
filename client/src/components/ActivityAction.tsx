import React, { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useRequiredActions } from '/src/stores/eventsStore'
import { BookmarkIcon, EmojiIcon, Icon, OnlineStatusIcon } from '/src/components/ui/Icons'
import { ChallengeLink, DuelistLink, PlayerLink } from '/src/components/Links'
import { bigintEquals, bigintToDecimal } from '@underware_gg/pistols-sdk/utils'
import { usePendingChallengesIds } from '../stores/challengeStore'

export const ActionIcon = (active: boolean) => {
  const { address } = useAccount()
  const { duelistIds } = useDuelistsOfPlayer()
  const { duelsPerDuelist } = useRequiredActions(duelistIds)
  const { pendingDuelIds } = usePendingChallengesIds(address)
  const requiresAction = useMemo(() => (Object.keys(duelsPerDuelist).length > 0), [duelsPerDuelist])
  const name = useMemo(() => (active ? 'circle' : 'circle outline'), [active])
  const className = useMemo(() => (
    requiresAction ? 'Positive'
      : pendingDuelIds.length > 0 ? 'Warning'
        : ''
  ), [requiresAction, pendingDuelIds])
  return (
    <Icon size='small'
      name={name}
      className={className}
    />
  )
}

export default function ActivityAction() {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)

  const { duelistIds } = useDuelistsOfPlayer()
  const { duelsPerDuelist } = useRequiredActions(duelistIds)
  const sortedDuelistIds = useMemo(() => (
    duelistIds.sort((a, b) => {
      return Number(b - a)
    })
  ), [duelistIds])

  const actionItems = useMemo(() => (sortedDuelistIds.map((duelistId) =>
    <ActionItem
      key={duelistId}
      duelistId={duelistId}
      isBookmarked={bookmarkedDuelists.includes(duelistId)}
      requiredActionDuelId={duelsPerDuelist[bigintToDecimal(duelistId)]}
    />)
  ), [duelistIds])

  const { pendingDuelIds } = usePendingChallengesIds(address)
  const pendingItems = useMemo(() => (pendingDuelIds.map((duelId) =>
    <PendingItem
      key={duelId}
      duelId={duelId}
    />)
  ), [duelistIds])

  return (
    <div className='FillParent'>
      {pendingItems}
      {actionItems}
    </div>
  );
}


const PendingItem = ({
  duelId,
}: {
  duelId: BigNumberish
}) => {
  return (
    <>
      <Icon name='circle' className='Invisible' />
      <Icon name='circle' className='Warning' />
      {'Reply to  '}
      <ChallengeLink duelId={duelId} />
      <br />
    </>
  )
}


const ActionItem = ({
  duelistId,
  isBookmarked,
  requiredActionDuelId,
}: {
  duelistId: BigNumberish
  isBookmarked: boolean
  requiredActionDuelId: bigint
}) => {
  const { isInAction, currentDuelId } = useDuelist(duelistId)
  const requiresAction = useMemo(() => bigintEquals(currentDuelId, requiredActionDuelId), [currentDuelId, requiredActionDuelId])
  const { duelistContractAddress } = useDuelistTokenContract()
  const { publish } = usePlayerBookmarkSignedMessage(duelistContractAddress, duelistId, !isBookmarked)

  const icon = useMemo(() => {
    if (requiresAction) {
      return <Icon name='circle' className='Positive' />
    }
    if (isInAction) {
      return <Icon name='circle' />
    }
    return <Icon name='circle outline' />
  }, [isInAction])

  return (
    <>
      <BookmarkIcon isBookmarked={isBookmarked} onClick={publish} />
      {icon}
      <DuelistLink duelistId={duelistId} useName />
      {' '}
      {isInAction ?
        <>
          {requiresAction ? ' required in ' : ' awaits in '}
          <ChallengeLink duelId={currentDuelId} />
        </>
        : 'is idle'}
      <br />
    </>
  )
}

