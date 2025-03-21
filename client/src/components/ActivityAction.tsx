import React, { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { usePendingChallengesIds } from '/src/stores/challengeStore'
import { useFameBalanceDuelist } from '/src/hooks/useFame'
import { useRequiredActions } from '/src/stores/eventsStore'
import { Icon, BookmarkIcon, EmojiIcon } from '/src/components/ui/Icons'
import { ChallengeLink, DuelistLink } from '/src/components/Links'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { EMOJI } from '/src/data/messages'

export const ActionIcon = (active: boolean) => {
  const { address } = useAccount()
  const { requiredDuelIds } = useRequiredActions()
  const { pendingDuelIds } = usePendingChallengesIds(address)
  const requiresAction = useMemo(() => (requiredDuelIds.length > 0), [requiredDuelIds])
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

  // pending duels (reply)
  const { pendingDuelIds } = usePendingChallengesIds(address)
  const pendingItems = useMemo(() => (pendingDuelIds.map((duelId) =>
    <PendingItem
      key={duelId}
      duelId={duelId}
    />)
  ), [pendingDuelIds])

  // all duelists
  const { duelPerDuelist } = useRequiredActions()
  const { duelistIds } = useDuelistsOfPlayer()
  const sortedDuelistIds = useMemo(() => (
    duelistIds.sort((a, b) => {
      // const duelA = duelPerDuelist[bigintToHex(a)] ?? 0n
      // const duelB = duelPerDuelist[bigintToHex(b)] ?? 0n
      // if (duelA == 0n && duelB == 0n) {
      //   return Number(b - a)
      // }
      // return Number(duelB - duelA)
      return Number(b - a)
    })
  ), [duelistIds, duelPerDuelist])
  const actionItems = useMemo(() => (sortedDuelistIds.map((duelistId) =>
    <ActionItem
      key={duelistId}
      duelistId={duelistId}
      isBookmarked={bookmarkedDuelists.includes(duelistId)}
      duelId={duelPerDuelist[bigintToHex(duelistId)]}
    />)
  ), [sortedDuelistIds])

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
      {/* <Icon name='circle' className='Invisible' /> */}
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
  duelId,
}: {
  duelistId: BigNumberish
  isBookmarked?: boolean
  duelId: bigint
}) => {
  const { isInAction, currentDuelId, isInactive } = useDuelist(duelistId)
  const { lives, isLoading } = useFameBalanceDuelist(duelistId)

  // const { duelistContractAddress } = useDuelistTokenContract()
  // const { publish } = usePlayerBookmarkSignedMessage(duelistContractAddress, duelistId, !isBookmarked)

  // in a duel, required to play
  if (duelId > 0n) {
    return (
      <>
        <Icon name='circle' className='Positive' />
        <DuelistLink duelistId={duelistId} useName />
        {' required in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
    )
  }

  // in a duel, waiting for other player
  if (isInAction) {
    return (
      <>
        <Icon name='circle' />
        <DuelistLink duelistId={duelistId} useName />
        {' waiting in '}
        <ChallengeLink duelId={currentDuelId} />
        <br />
      </>
    )
  }

  // dripping fame!
  if (isInactive) {
    return (
      <>
        <Icon name='circle' className='Negative' />
        <DuelistLink duelistId={duelistId} useName />
        {'is inactive losing FAME!'}
        <br />
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <Icon name='circle outline' />
        <DuelistLink duelistId={duelistId} useName />
        {'...'}
        <br />
      </>
    )
  }


  // dripping fame!
  if (lives == 0) {
    return (
      <>
        <EmojiIcon emoji={EMOJI.DEAD} />{' '}
        <DuelistLink duelistId={duelistId} useName />
        {' is dead!'}
        <br />
      </>
    )
  }

  // idle
  return (
    <>
      <Icon name='circle outline' />
      <DuelistLink duelistId={duelistId} useName />
      {' is ready to duel!'}
      <br />
    </>
  )
}

