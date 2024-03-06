import React, { useMemo } from 'react'
import { Icon, Grid } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { ActionIcon, CompletedIcon, EmojiIcon, LoadingIcon } from '@/pistols/components/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'

const Row = Grid.Row
const Col = Grid.Column

export function useDuelIcons({
  duelId,
  account,
  size = 'large',
}) {
  const {
    challenge: { duelistA, duelistB, winner, roundNumber, isAwaiting, isInProgress, isFinished, lords },
    round1, round2, round3, duelStage, completedStagesA, completedStagesB, turnA, turnB,
  } = useDuel(duelId)

  const isA = useMemo(() => (account == duelistA), [account, duelistA])
  const isB = useMemo(() => (account == duelistB), [account, duelistB])

  const shot1 = useMemo(() => (isA ? (round1?.shot_a ?? null) : isB ? (round1?.shot_b ?? null) : null), [isA, isB, round1])
  const shot2 = useMemo(() => (isA ? (round2?.shot_a ?? null) : isB ? (round2?.shot_b ?? null) : null), [isA, isB, round2])
  const shot3 = useMemo(() => (isA ? (round3?.shot_a ?? null) : isB ? (round3?.shot_b ?? null) : null), [isA, isB, round3])
  const otherShot1 = useMemo(() => (isA ? (round1?.shot_b ?? null) : isB ? (round1?.shot_a ?? null) : null), [isA, isB, round1])
  const otherShot2 = useMemo(() => (isA ? (round2?.shot_b ?? null) : isB ? (round2?.shot_a ?? null) : null), [isA, isB, round2])
  const otherShot3 = useMemo(() => (isA ? (round3?.shot_b ?? null) : isB ? (round3?.shot_a ?? null) : null), [isA, isB, round3])

  const isWinner = useMemo(() => (isA && winner == 1) || (isB && winner == 2), [isA, isB, winner])
  const isTurn = useMemo(() => (isA ? turnA : isB ? turnB : false), [isA, isB, turnA, turnB])
  const completedStages = useMemo(() => (isA ? (completedStagesA) : isB ? (completedStagesB) : null), [isA, isB, completedStagesA, completedStagesB])

  const health1 = useMemo(() => (shot1?.health == 0 ? EMOJI.DEAD : shot1?.damage > 0 ? EMOJI.INJURED : null), [shot1])
  const health2 = useMemo(() => (shot2?.health == 0 ? EMOJI.DEAD : shot2?.damage > 0 ? EMOJI.INJURED : null), [shot2])
  const health3 = useMemo(() => (shot3?.health == 0 ? EMOJI.DEAD : shot3?.damage > 0 ? EMOJI.INJURED : null), [shot3])

  const wager1 = useMemo(() => ((shot1?.wager > otherShot1?.wager) ? EMOJI.WAGER : null), [shot1, otherShot1])
  const wager2 = useMemo(() => ((shot2?.wager > otherShot2?.wager) ? EMOJI.WAGER : null), [shot2, otherShot2])
  const wager3 = useMemo(() => ((shot3?.wager > otherShot3?.wager) ? EMOJI.WAGER : null), [shot3, otherShot3])

  const win1 = useMemo(() => ((!wager1 && isWinner && roundNumber == 1) ? EMOJI.WINNER : null), [wager1, isWinner, roundNumber])
  const win2 = useMemo(() => ((!wager2 && isWinner && roundNumber == 2) ? EMOJI.WINNER : null), [wager2, isWinner, roundNumber])
  const win3 = useMemo(() => ((!wager3 && isWinner && roundNumber == 3) ? EMOJI.WINNER : null), [wager3, isWinner, roundNumber])

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
      if (shot1) {
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
      }
      if (shot2) {
        if (duelStage >= DuelStage.Round2Commit) {
          icons2.push(
            <CompletedIcon key='commit2' completed={completedStages[DuelStage.Round2Commit]}>
              <EmojiIcon emoji={EMOJI.BLADES} size={iconSize} />
            </CompletedIcon>
          )
        }
        if (duelStage == DuelStage.Round2Reveal) {
          icons2.push(
            <CompletedIcon key='reveal2' completed={completedStages[DuelStage.Round2Reveal]}>
              <Icon name='eye' size={iconSize} />
            </CompletedIcon>
          )
        }
        if (health2) icons2.push(<EmojiIcon key='health2' emoji={health2} size={iconSize} />)
      }
      if (isTurn) {
        (icons2.length > 0 ? icons2 : icons1).push(<LoadingIcon key='isTurn' size={iconSize} className='Brightest' />)
      }
    }
    //
    // Finished...
    if (isFinished) {
      if (shot1) icons1.push(<ActionIcon key='shot1' action={parseInt(shot1.action)} size={iconSize} />)
      if (health1) icons1.push(<EmojiIcon key='health1' emoji={health1} size={iconSize} />)
      if (win1) icons1.push(<EmojiIcon key='win1' emoji={win1} size={iconSize} />)
      if (wager1) icons1.push(<EmojiIcon key='wager1' emoji={wager1} size={iconSize} />)

      if (shot2) icons2.push(<ActionIcon key='shot2' action={parseInt(shot2.action)} size={iconSize} />)
      if (health2) icons2.push(<EmojiIcon key='health2' emoji={health2} size={iconSize} />)
      if (win2) icons2.push(<EmojiIcon key='win2' emoji={win2} size={iconSize} />)
      if (wager2) icons2.push(<EmojiIcon key='wager2' emoji={wager2} size={iconSize} />)

      if (shot3) icons3.push(<ActionIcon key='shot3' action={parseInt(shot3.action)} size={iconSize} />)
      if (health3) icons3.push(<EmojiIcon key='health3' emoji={health3} size={iconSize} />)
      if (win3) icons3.push(<EmojiIcon key='win3' emoji={win3} size={iconSize} />)
      if (wager3) icons3.push(<EmojiIcon key='wager3' emoji={wager3} size={iconSize} />)
    }

    return { icons1, icons2, icons3 }
  }, [isAwaiting, isInProgress, isFinished, duelStage, isA, isB, isTurn, shot1, shot2, shot3, shot3, completedStages, health1, health2, health3, win1, win2, win3, wager1, wager2, wager3, iconSize])

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
  account,
  size = 'large',
}) {
  const { icons1, icons2, icons3 } = useDuelIcons({ duelId, account, size })

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
  duelistA,
  duelistB,
  size = 'large',
}) {
  const { icons1: icons1A, icons2: icons2A, icons3: icons3A, isAwaiting } = useDuelIcons({ duelId, account: duelistA, size: 'big' })
  const { icons1: icons1B, icons2: icons2B, icons3: icons3B } = useDuelIcons({ duelId, account: duelistB, size: 'big' })

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
