import React, { useMemo } from 'react'
import { Icon } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { Action, ActionNames, ChallengeState } from '@/pistols/utils/pistols'
import { ActionIcon, CompletedIcon, EmojiIcon, LoadingIcon } from '@/pistols/components/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'


export function DuelIcons({
  duelId,
  account,
  size = 'large',
}) {
  const {
    challenge: { duelistA, duelistB, state, winner, roundNumber, isFinished, lords },
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

  const wager1 = useMemo(() => ((shot1?.wager > otherShot1?.wager) ? EMOJI.MONEY : null), [shot1, otherShot1])
  const wager2 = useMemo(() => ((shot2?.wager > otherShot2?.wager) ? EMOJI.MONEY : null), [shot2, otherShot2])
  const wager3 = useMemo(() => ((shot3?.wager > otherShot3?.wager) ? EMOJI.MONEY : null), [shot3, otherShot3])

  const win1 = useMemo(() => ((!wager1 && isWinner && roundNumber == 1) ? EMOJI.WINNER : null), [wager1, isWinner, roundNumber])
  const win2 = useMemo(() => ((!wager2 && isWinner && roundNumber == 2) ? EMOJI.WINNER : null), [wager2, isWinner, roundNumber])
  const win3 = useMemo(() => ((!wager3 && isWinner && roundNumber == 3) ? EMOJI.WINNER : null), [wager3, isWinner, roundNumber])

  const _size = size as IconSizeProp

  if (state == ChallengeState.Awaiting) {
    return (<>
      {isA &&
        <CompletedIcon completed={true}>
          <EmojiIcon emoji={EMOJI.AGREEMENT} size={_size} />
        </CompletedIcon>
      }
      {isB &&
        <>
          <CompletedIcon completed={false}>
            <EmojiIcon emoji={EMOJI.AGREEMENT} size={_size} />
          </CompletedIcon>
        <span className='Important'> <LoadingIcon size={_size} /></span>
        </>
      }
    </>)
  }

  if (state == ChallengeState.InProgress) {
    return (<>
      {shot1 && duelStage >= DuelStage.Round1Commit &&
        <CompletedIcon completed={completedStages[DuelStage.Round1Commit]}>
          <EmojiIcon emoji={EMOJI.STEP} size={_size} />
        </CompletedIcon>
      }
      {shot1 && duelStage == DuelStage.Round1Reveal &&
        <CompletedIcon completed={completedStages[DuelStage.Round1Reveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {health1 && <EmojiIcon emoji={health1} size={_size} />}
      {shot2 && duelStage >= DuelStage.Round2Commit &&
        <CompletedIcon completed={completedStages[DuelStage.Round2Commit]}>
          <EmojiIcon emoji={EMOJI.BLADES} size={_size} />
        </CompletedIcon>
      }
      {shot2 && duelStage == DuelStage.Round2Reveal &&
        <CompletedIcon completed={completedStages[DuelStage.Round2Reveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {health2 && <EmojiIcon emoji={health2} size={_size} />}
      {isTurn && <span className='Important'> <LoadingIcon size={_size} /></span>}
    </>)
  }

  if (isFinished) {
    return (<>
      {shot1 && <ActionIcon action={parseInt(shot1.action)} size={_size} />}
      {health1 && <EmojiIcon emoji={health1} size={_size} />}
      {win1 && <EmojiIcon emoji={win1} size={_size} />}
      {wager1 && <EmojiIcon emoji={wager1} size={_size} />}

      {shot2 && <>+<ActionIcon action={parseInt(shot2.action)} size={_size} /></>}
      {health2 && <EmojiIcon emoji={health2} size={_size} />}
      {win2 && <EmojiIcon emoji={win2} size={_size} />}
      {wager2 && <EmojiIcon emoji={wager2} size={_size} />}

      {shot3 && <>+<ActionIcon action={parseInt(shot3.action)} size={_size} /></>}
      {health3 && <EmojiIcon emoji={health3} size={_size} />}
      {win3 && <EmojiIcon emoji={win3} size={_size} />}
      {wager3 && <EmojiIcon emoji={wager3} size={_size} />}
    </>)
  }

  return <></>
}

