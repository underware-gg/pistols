import React, { useEffect, useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useCallToChallenges } from '/src/stores/eventsModelStore'
import { useDuelistsOfPlayer } from '/src/hooks/useTokenDuelists'
import { usePlayerDuelistsOrganized } from '/src/stores/duelistStore'
import { DuelOpponentNameLink, ChallengeLink } from '/src/components/Links'
import { bigintToDecimal } from '@underware/pistols-sdk/utils'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { Icon } from '/src/components/ui/Icons'


export function usePlayersActions() {
  const { activeChallenges } = useCallToChallenges()
  const { duelistIds } = useDuelistsOfPlayer()

  const replyCount = useMemo(() => activeChallenges.filter((ch) => ch.action === constants.ChallengeAction.Reply).length, [activeChallenges])
  const waitingCount = useMemo(() => activeChallenges.filter((ch) => ch.action === constants.ChallengeAction.Waiting).length, [activeChallenges])
  const actionCount = useMemo(() => activeChallenges.filter((ch) => ch.requiresAction).length, [activeChallenges])
  const idleCount = useMemo(() => (duelistIds.length - activeChallenges.length), [duelistIds, activeChallenges])
  // console.log(`usePlayersActions() =================> activeChallenges:`, replyCount, actionCount, waitingCount, idleCount, duelistIds.length)

  return {
    activeChallenges,
    replyCount,
    actionCount,
    waitingCount,
    idleCount,
    duelistCount: duelistIds.length,
  }
}


export const ActionIcon = ({
  isActive
} : {
  isActive: boolean
}) => {
  const { actionCount, replyCount } = usePlayersActions()
  const pulsing = useMemo(() => (!isActive && (actionCount > 0 || replyCount > 0)), [isActive, actionCount, replyCount])
  const name = useMemo(() => (pulsing ? 'dot circle outline' : isActive ? 'circle' : 'circle outline'), [isActive, pulsing])
  const className = useMemo(() => {
    let classNames = []
    if (replyCount > 0 && replyCount == actionCount) classNames.push('Warning')
    else if (actionCount > 0) classNames.push('Positive')
    if (pulsing) classNames.push('IconPulse')
    return classNames.join(' ')
  }, [replyCount, actionCount, pulsing])
  return (
    <Icon size='small'
      className={className}
      name={name}
    />
  )
}

export default function ActivityAction() {
  const { isConnected } = useAccount()
  const { activeChallenges, idleCount, duelistCount } = usePlayersActions()
  const items = useMemo(() => (activeChallenges.map((a) => {
    return (
      <ActionItem
        key={bigintToDecimal(a.duelId)}
        duelId={a.duelId}
        action={a.action}
      />
    )
  })), [activeChallenges])
  return (
    <div className='FillParent'>
      {items}
      {idleCount > 0 && <>
        <Icon name='circle outline' />
        <b>+{idleCount}</b> Duelists ready to duel!
        <br />
      </>}
      {!isConnected && <div className='Brightest'>Disconnected</div>}
      {(isConnected && duelistCount > 0 && items.length == 0 && idleCount == 0) && <div className='Brightest'>Loading...</div>}
    </div>
  );
}


const ActionItem = ({
  duelId,
  action,
}: {
  duelId: BigNumberish
  action: constants.ChallengeAction
}) => {
  // const { isInactive } = useDuelist(duelistId)
  // const { lives } = useDuelistFameBalance(duelistId)

  if (action === constants.ChallengeAction.Reply) {
    console.log(`ActionItem() =================> reply....`, duelId, action)
    return (
      <>
        {/* <Icon name='circle' className='Invisible' /> */}
        <Icon name='circle' className='Warning' />
        {'Reply to '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
    )
  }

  // in a duel, required to play
  if (action === constants.ChallengeAction.Commit) {
    return (
      <>
        <Icon name='circle' className='Positive' />
        {'Shoot at '}
        <DuelOpponentNameLink duelId={duelId} />
        {' in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
    )
  }

  // in a duel, required to play
  if (action === constants.ChallengeAction.Reveal) {
    return (
      <>
        <Icon name='circle' className='Positive' />
        {'Confront '}
        <DuelOpponentNameLink duelId={duelId} />
        {' in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
    )
  }

  if (action === constants.ChallengeAction.Results) {
    return (
      <>
        <Icon name='circle' />
        {'Did you kill '}
        <DuelOpponentNameLink duelId={duelId} />
        {' in '}
        <ChallengeLink duelId={duelId} />
        {'?'}
        <br />
      </>
    )
  }

  if (action === constants.ChallengeAction.Waiting) {
    return (
      <>
        <Icon name='circle' />
        {'Standing by '}
        <DuelOpponentNameLink duelId={duelId} />
        {' in '}
        <ChallengeLink duelId={duelId} />
        <br />
      </>
    )
  }

  // // dripping fame!
  // if (isInactive) {
  //   return (
  //     <>
  //       <Icon name='circle' className='Negative' />
  //       <DuelistLink duelistId={duelistId} useName />
  //       {'is inactive losing FAME!'}
  //       <br />
  //     </>
  //   )
  // }

  // // dripping fame!
  // if (lives == 0) {
  //   return (
  //     <>
  //       <EmojiIcon emoji={EMOJIS.DEAD} />{' '}
  //       <DuelistLink duelistId={duelistId} useName />
  //       {' is dead!'}
  //       <br />
  //     </>
  //   )
  // }

  return <></>
}

