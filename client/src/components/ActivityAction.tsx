import React, { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useDuelistsOfPlayer } from '/src/hooks/useDuelistToken'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { usePlayerBookmarkSignedMessage } from '/src/hooks/useSignedMessages'
import { useDuelistTokenContract } from '/src/hooks/useTokenContract'
import { useRequiredActions } from '/src/stores/eventsStore'
import { BookmarkIcon, Icon, OnlineStatusIcon } from '/src/components/ui/Icons'
import { ChallengeLink, DuelistLink, PlayerLink } from '/src/components/Links'
import { bigintEquals, bigintToDecimal } from '@underware_gg/pistols-sdk/utils'

export const ActionIcon = (active: boolean) => {
  const { duelistIds } = useDuelistsOfPlayer()
  const { duelsPerDuelist } = useRequiredActions(duelistIds)
  const requiresAction = useMemo(() => (Object.keys(duelsPerDuelist).length > 0), [duelsPerDuelist])
  const name = useMemo(() => (active ? 'circle' : 'circle outline'), [active])
  return (
    <Icon size='small'
      name={name}
      className={requiresAction ? 'Positive' : ''}
    />
  )
}

export default function ActivityAction() {
  const { address } = useAccount()
  const { bookmarkedDuelists } = usePlayer(address)

  const { duelistIds } = useDuelistsOfPlayer()
  const { duelsPerDuelist } = useRequiredActions(duelistIds)
  console.log("ActivityAction() duelsPerDuelist >>>>>", duelistIds, duelsPerDuelist)
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
      requiredActionDuelId={duelsPerDuelist[bigintToDecimal(duelistId)]}
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

