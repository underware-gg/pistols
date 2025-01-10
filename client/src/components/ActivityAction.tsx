import React, { useEffect, useMemo } from 'react'
import { BigNumberish } from 'starknet'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'
import { BookmarkIcon, Icon, OnlineStatusIcon } from '/src/components/ui/Icons'
import { ChallengeLink, DuelistLink, PlayerLink } from '/src/components/Links'
import { useDuelist } from '../stores/duelistStore'
import { usePlayerBookmarkSignedMessage } from '../hooks/useSignedMessages'
import { useDuelistTokenContract } from '../hooks/useTokenContract'
import { usePlayer } from '../stores/playerStore'
import { useAccount } from '@starknet-react/core'

export const ActionIcon = () => {
  return <Icon name='circle outline' size='small' />
}

export default function ActivityAction() {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)

  const { duelistIds } = useDuelistsOfPlayer()
  const sortedDuelistIds = useMemo(() => (
    duelistIds.sort((a, b) => {
      return Number(b - a)
    })
  ), [duelistIds])

  const items = useMemo(() => (sortedDuelistIds.map((duelistId) =>
    <ActionItem
      key={duelistId}
      duelistId={duelistId}
      isBookmarked={bookmarkedDuelists.includes(duelistId)}
    />)
  ), [duelistIds])

  return (
    <div className='FillParent'>
      {items}
    </div>
  );
}


const ActionItem = ({
  duelistId,
  isBookmarked,
}: {
  duelistId: BigNumberish
  isBookmarked: boolean
}) => {
  const { isInAction, currentDuelId } = useDuelist(duelistId)
  const { duelistContractAddress } = useDuelistTokenContract()
  const { publish } = usePlayerBookmarkSignedMessage(duelistContractAddress, duelistId, !isBookmarked)

  const icon = useMemo(() => {
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
          {' in '}
          <ChallengeLink duelId={currentDuelId} />
        </>
        : 'is idle'}
      <br />
    </>
  )
}

