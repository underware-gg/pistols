import React, { useMemo } from 'react'
import { Icon, Grid } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { CompletedIcon, EmojiIcon, LoadingIcon } from '@/lib/ui/Icons'
import { ActionIcon } from '@/pistols/components/ui/PistolsIcon'
import { bigintEquals } from '@/lib/utils/types'
import { EMOJI } from '@/pistols/data/messages'
import { BigNumberish } from 'starknet'
import { Action } from '../utils/pistols'
import { getPacesCardFromValue } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export function useDuelIcons({
  duelId,
  duelistId,
  size = 'large',
}: {
  duelId: BigNumberish
  duelistId: BigNumberish
  size: IconSizeProp
}) {
  const {
    challenge: { duelistIdA, duelistIdB, winner, roundNumber, isAwaiting, isInProgress, isFinished },
    round1, duelStage, completedStagesA, completedStagesB, turnA, turnB,
  } = useDuel(duelId)

  const isA = useMemo(() => bigintEquals(duelistId, duelistIdA), [duelistId, duelistIdA])
  const isB = useMemo(() => bigintEquals(duelistId, duelistIdB), [duelistId, duelistIdB])

  const moves1 = useMemo(() => (isA ? (round1?.moves_a ?? null) : isB ? (round1?.moves_b ?? null) : null), [isA, isB, round1])
  const state1 = useMemo(() => (isA ? (round1?.state_a ?? null) : isB ? (round1?.state_b ?? null) : null), [isA, isB, round1])
  const otherState1 = useMemo(() => (isA ? (round1?.state_b ?? null) : isB ? (round1?.state_a ?? null) : null), [isA, isB, round1])

  const isWinner = useMemo(() => (isA && winner == 1) || (isB && winner == 2), [isA, isB, winner])
  const isTurn = useMemo(() => (isA ? turnA : isB ? turnB : false), [isA, isB, turnA, turnB])
  const completedStages = useMemo(() => (isA ? (completedStagesA) : isB ? (completedStagesB) : null), [isA, isB, completedStagesA, completedStagesB])

  const health1 = useMemo(() => (state1?.health == 0 ? EMOJI.DEAD : state1?.damage > 0 ? EMOJI.INJURED : null), [state1])
  const health1b = useMemo(() => (health1 == EMOJI.INJURED && state1.damage > 1 ? EMOJI.INJURED : null), [health1])
  const wager1 = useMemo(() => ((state1?.wager > otherState1?.wager) ? EMOJI.WAGER : null), [state1, otherState1])
  const win1 = useMemo(() => ((!wager1 && isWinner && roundNumber == 1) ? EMOJI.WINNER : null), [wager1, isWinner, roundNumber])

  const iconSize = size as IconSizeProp

  const { icons1, icons2, icons3 } = useMemo(() => {
    let icons1 = []
    let icons2 = []
    let icons3 = []
    //
    // Awaiting (B is always pending)
    if (isAwaiting) {
      if (isA) {
        icons1 = [
          <CompletedIcon key='isA' completed={true}>
            <EmojiIcon emoji={EMOJI.AGREEMENT} size={iconSize} />
          </CompletedIcon>
        ]
      } else {
        icons1 = [
          <CompletedIcon key='isB' completed={false}>
            <EmojiIcon emoji={EMOJI.AGREEMENT} size={iconSize} />
          </CompletedIcon>,
          <LoadingIcon key='isTurn' size={iconSize} className='Brightest' />
        ]
      }
    }
    //
    // In Progress...
    if (isInProgress) {
      if (state1) {
        if (duelStage >= DuelStage.Round1Commit) {
          icons1.push(
            <CompletedIcon key='commit1' completed={completedStages[DuelStage.Round1Commit]}>
              <EmojiIcon emoji={EMOJI.PACES} size={iconSize} />
            </CompletedIcon>
          )
        }
        if (duelStage == DuelStage.Round1Reveal) {
          icons1.push(
            <CompletedIcon key='reveal1' completed={completedStages[DuelStage.Round1Reveal]}>
              <Icon name='eye' size={iconSize} />
            </CompletedIcon>
          )
        }
        if (health1) icons1.push(<EmojiIcon key='health1' emoji={health1} size={iconSize} />)
        if (health1b) icons1.push(<EmojiIcon key='health1b' emoji={health1b} size={iconSize} />)
      }
      if (isTurn) {
        (icons2.length > 0 ? icons2 : icons1).push(<LoadingIcon key='isTurn' size={iconSize} className='Brightest' />)
      }
    }
    //
    // Finished...
    if (isFinished) {
      if (state1) icons1.push(<ActionIcon key='state1' action={getPacesCardFromValue(moves1.card_1) as unknown as Action} size={iconSize} />)
      if (health1) icons1.push(<EmojiIcon key='health1' emoji={health1} size={iconSize} />)
      if (health1b) icons1.push(<EmojiIcon key='health1b' emoji={health1b} size={iconSize} />)
      if (win1) icons1.push(<EmojiIcon key='win1' emoji={win1} size={iconSize} />)
      if (wager1) icons1.push(<EmojiIcon key='wager1' emoji={wager1} size={iconSize} />)
    }

    return { icons1, icons2, icons3 }
  }, [isAwaiting, isInProgress, isFinished, duelStage, isA, isB, isTurn, state1, completedStages, health1, win1, wager1, iconSize])

  return {
    icons1,
    icons2,
    icons3,
    isAwaiting,
    isInProgress,
    isFinished,
  }
}


export function DuelIconsAsRow({
  duelId,
  duelistId,
  size = 'large',
}: {
  duelId: BigNumberish
  duelistId: BigNumberish
  size: IconSizeProp
}) {
  const { icons1, icons2, icons3 } = useDuelIcons({ duelId, duelistId, size })

  return (
    <>
      {icons1}
      {icons2.length > 0 && '+'}
      {icons2}
      {icons3.length > 0 && '+'}
      {icons3}
    </>
  )
}


export function DuelIconsAsGrid({
  duelId,
  duelistIdA,
  duelistIdB,
  size = 'large',
}: {
  duelId: BigNumberish
  duelistIdA: BigNumberish
  duelistIdB: BigNumberish
  size: IconSizeProp
}) {
  const { icons1: icons1A, icons2: icons2A, icons3: icons3A, isAwaiting } = useDuelIcons({ duelId, duelistId: duelistIdA, size: 'big' })
  const { icons1: icons1B, icons2: icons2B, icons3: icons3B } = useDuelIcons({ duelId, duelistId: duelistIdB, size: 'big' })

  return (
    <Grid textAlign='center' verticalAlign='middle' className='TitleCase'>
      {icons1A.length > 0 &&
        <Row>
          <Col width={6} textAlign='right'>
            {icons1A}
          </Col>
          <Col width={4}>
            {isAwaiting ? 'Pact' : 'Round 1'}
          </Col>
          <Col width={6} textAlign='left'>
            {icons1B}
          </Col>
        </Row>
      }
      {icons2A.length > 0 &&
        <Row>
          <Col width={6} textAlign='right'>
            {icons2A}
          </Col>
          <Col width={4}>
            Round 2
          </Col>
          <Col width={6} textAlign='left'>
            {icons2B}
          </Col>
        </Row>
      }
      {icons3A.length > 0 &&
        <Row>
          <Col width={6} textAlign='right'>
            {icons3A}
          </Col>
          <Col width={4}>
            Round 3
          </Col>
          <Col width={6} textAlign='left'>
            {icons3B}
          </Col>
        </Row>
      }
    </Grid>
  )
}
