import React, { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { useCallToActions } from '/src/stores/eventsModelStore'
import { Icon, BookmarkIcon, EmojiIcon } from '/src/components/ui/Icons'
import { ChallengeLink, DuelistLink } from '/src/components/Links'
import { bigintToHex } from '@underware/pistols-sdk/utils'
import { EMOJI } from '/src/data/messages'

export const ActionIcon = (isActive: boolean) => {
  const { duelistIds } = useDuelistsOfPlayer()
  const { requiresAction, duelPerDuelist } = useCallToActions()
  const replyOnly = useMemo(() => (
    requiresAction && !Object.keys(duelPerDuelist).some((duelistId) => (duelistIds.includes(BigInt(duelistId))))
  ), [duelistIds, duelPerDuelist])
  const name = useMemo(() => (isActive ? 'circle' : 'circle outline'), [isActive])
  const className = useMemo(() => (
    replyOnly ? 'Warning'
      : requiresAction ? 'Positive'
        : ''
  ), [requiresAction, replyOnly])
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

  const { duelPerDuelist } = useCallToActions()
  const { duelistIds } = useDuelistsOfPlayer()
  const sortedDuelistIds = useMemo(() => (
    Array.from(new Set([
      // join with duelists in actions (other player when replying)
      ...duelistIds,
      ...Object.keys(duelPerDuelist).map((duelistId) => BigInt(duelistId))
    ])).sort((a, b) => {
      const duelA = duelPerDuelist[bigintToHex(a)] ?? null
      const duelB = duelPerDuelist[bigintToHex(b)] ?? null
      if (!duelA && !duelB) return Number(b - a)
      if (!duelA) return 1
      if (!duelB) return -1
      return Number(duelB.duelId - duelA.duelId)
      // return (duelB.timestamp - duelA.timestamp)
    })
  ), [duelistIds, duelPerDuelist])

  const actions = useMemo(() => (sortedDuelistIds.map((duelistId) => {
    const duel = duelPerDuelist[bigintToHex(duelistId)]
    const duelId = duel?.duelId ?? 0n
    const isReply = (duelId > 0n && !duelistIds.includes(duelistId))
    return (
      <ActionItem
        key={duelistId}
        duelistId={duelistId}
        duelId={duelId}
        isBookmarked={bookmarkedDuelists.includes(duelistId)}
        callToAction={duel?.callToAction ?? false}
        isReply={isReply}
      />
    )
  })), [sortedDuelistIds, duelistIds, duelPerDuelist, bookmarkedDuelists])

  return (
    <div className='FillParent'>
      {actions}
    </div>
  );
}


const ActionItem = ({
  duelistId,
  isBookmarked,
  duelId,
  callToAction,
  isReply,
}: {
  duelistId: BigNumberish
  isBookmarked?: boolean
  duelId: bigint
  callToAction: boolean
  isReply: boolean
}) => {
  const { isInactive } = useDuelist(duelistId)
  const { lives, isLoading } = useDuelistFameBalance(duelistId)

  // const { duelistContractAddress } = useDuelistTokenContract()
  // const { publish } = usePlayerBookmarkSignedMessage(duelistContractAddress, duelistId, !isBookmarked)

  if (isReply) {
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

  // in a duel, required to play
  if (duelId > 0n) {
    return callToAction ?
      <>
        <Icon name='circle' className='Positive' />
        <DuelistLink duelistId={duelistId} useName />
        {' required in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
      :
      <>
        <Icon name='circle' />
        <DuelistLink duelistId={duelistId} useName />
        {' waiting in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
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

