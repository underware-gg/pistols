import React, { useMemo } from 'react'
import { useAccount } from '@starknet-react/core'
import { BigNumberish } from 'starknet'
import { useDuelist } from '/src/stores/duelistStore'
import { usePlayer } from '/src/stores/playerStore'
import { useDuelistFameBalance } from '/src/stores/coinStore'
import { useCallToActions } from '/src/stores/eventsModelStore'
import { Icon, EmojiIcon } from '/src/components/ui/Icons'
import { DuelOpponentNameLink, ChallengeLink, DuelistLink, DuelistOwnerLink } from '/src/components/Links'
import { bigintToDecimal, bigintToHex } from '@underware/pistols-sdk/utils'
import { EMOJIS } from '@underware/pistols-sdk/pistols/constants'
import { usePlayerDuelistsOrganized } from '/src/stores/duelistStore'


type ActionType = 'Waiting' | 'ReplyChallenge' | 'ActionRequired' | 'Idle';
type Action = {
  actionType: ActionType
  duelId?: bigint
  duelistId?: BigNumberish
}

export function usePlayersActions() {
  const { duelPerDuelist } = useCallToActions()
  const { activeDuelists: duelistIds } = usePlayerDuelistsOrganized();

  const sortedDuelistIds = useMemo(() => (
    Array.from(new Set([
      // join with duelists in actions (other player when replying)
      ...duelistIds,
      ...Object.keys(duelPerDuelist).map((duelistId) => BigInt(duelistId))
    ])).sort((a, b) => {
      const duelA = duelPerDuelist[bigintToHex(a)] ?? null
      const duelB = duelPerDuelist[bigintToHex(b)] ?? null
      if (!duelA && !duelB) {
        // Convert BigNumberish to bigint before subtraction
        const bigA = typeof a === 'bigint' ? a : BigInt(a.toString())
        const bigB = typeof b === 'bigint' ? b : BigInt(b.toString())
        return Number(bigB - bigA)
      }
      if (!duelA) return 1
      if (!duelB) return -1
      return Number(duelB.duelId - duelA.duelId)
      // return (duelB.timestamp - duelA.timestamp)
    })
  ), [duelistIds, duelPerDuelist])

  const actions = useMemo(() => (
    sortedDuelistIds.map(d => BigInt(d)).map((duelistId) => {
      const duel = duelPerDuelist[bigintToHex(duelistId)]
      const duelId = BigInt(duel?.duelId ?? 0)
      const isReply = (duelId > 0n && !duelistIds.some(id =>
        (typeof id === 'bigint' && typeof duelistId === 'bigint')
          ? id === duelistId
          : BigInt(id.toString()) === BigInt(duelistId.toString())
      ))
      const actionType =
        isReply ? 'ReplyChallenge'
          : duelId > 0n ? (duel?.callToAction ? 'ActionRequired' : 'Waiting')
            : 'Idle'
      const action: Action = {
        actionType,
        duelId,
        duelistId,
      }
      return action
    })//.sort((a, b) => Number(b.duelId - a.duelId))
  ), [sortedDuelistIds, duelPerDuelist])

  const replyCount = useMemo(() => actions.filter((a) => a.actionType === 'ReplyChallenge').length, [actions])
  const actionCount = useMemo(() => actions.filter((a) => a.actionType === 'ActionRequired').length, [actions])
  const waitingCount = useMemo(() => actions.filter((a) => a.actionType === 'Waiting').length, [actions])
  const idleCount = useMemo(() => actions.filter((a) => a.actionType === 'Idle').length, [actions])

  return {
    actions,
    replyCount,
    actionCount,
    waitingCount,
    idleCount,
    duelistCount: duelistIds.length,
  }
}


export const ActionIcon = (isActive: boolean) => {
  const { actionCount, replyCount } = usePlayersActions()
  const pulsing = useMemo(() => (!isActive && (actionCount > 0 || replyCount > 0)), [isActive, actionCount, replyCount])
  const name = useMemo(() => (pulsing ? 'dot circle outline' : isActive ? 'circle' : 'circle outline'), [isActive, pulsing])
  const className = useMemo(() => {
    let classNames = []
    if (actionCount > 0) classNames.push('Positive')
    else if (replyCount > 0) classNames.push('Warning')
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
  const { actions, idleCount, duelistCount } = usePlayersActions()
  const items = useMemo(() => (actions.map((a) => {
    return (
      <ActionItem
        key={`${a.actionType}-${bigintToDecimal(a.duelId ?? 0) }-${bigintToDecimal(a.duelistId ?? 0) }`}
        duelistId={a.duelistId}
        duelId={a.duelId}
        actionType={a.actionType}
      />
    )
  })), [actions])
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
  duelistId,
  duelId,
  actionType,
}: {
  duelistId: BigNumberish
  duelId: BigNumberish
  actionType: ActionType
}) => {
  // const { isInactive } = useDuelist(duelistId)
  // const { lives } = useDuelistFameBalance(duelistId)

  if (actionType === 'ReplyChallenge') {
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
  if (actionType === 'ActionRequired') {
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

  if (actionType === 'Waiting') {
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

  // if (isLoading) {
  //   return (
  //     <>
  //       <Icon name='circle outline' />
  //       <DuelistLink duelistId={duelistId} useName />
  //       {'...'}
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

  // // idle
  // return (
  //   <>
  //     <Icon name='circle outline' />
  //     <DuelistLink duelistId={duelistId} useName />
  //     {' is ready to duel!'}
  //     <br />
  //   </>
  // )

  return <></>
}

