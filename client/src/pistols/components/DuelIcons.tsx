import React from 'react'
import { Icon } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { Blades, ChallengeState } from '@/pistols/utils/pistols'
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

  const isA = (account == duelistA)
  const isB = (account == duelistB)
  const isWinner = (isA && winner == 1) || (isB && winner == 2)
  const shotRound1 = isA ? (round1?.shot_a ?? null) : isB ? (round1?.shot_b ?? null) : null
  const shotRound2 = isA ? (round2?.shot_a ?? null) : isB ? (round2?.shot_b ?? null) : null
  const shotRound3 = isA ? (round3?.shot_a ?? null) : isB ? (round3?.shot_b ?? null) : null
  const completedStages = isA ? (completedStagesA) : isB ? (completedStagesB) : null
  const isTurn = isA ? turnA : isB ? turnB : false

  const healthRound1 = shotRound1?.health == 0 ? EMOJI.DEAD : shotRound1?.damage > 0 ? EMOJI.INJURED : null
  const healthRound2 = shotRound2?.health == 0 ? EMOJI.DEAD : shotRound2?.damage > 0 ? EMOJI.INJURED : null
  const healthRound3 = shotRound3?.health == 0 ? EMOJI.DEAD : shotRound3?.damage > 0 ? EMOJI.INJURED : null

  const emojiWinner = (lords > 0 ? EMOJI.MONEY : EMOJI.WINNER)

  const winRound1 = (isWinner && roundNumber == 1) ? emojiWinner : null
  const winRound2 = (isWinner && roundNumber == 1) ? emojiWinner : null
  const winRound3 = (isWinner && roundNumber == 1) ? emojiWinner : null

  // TODO: use shot wager flag
  // const gotWager = (shotRound2?.cash > 0 && shotRound2.action == Blades.Steal) ? EMOJI.MONEY : null
  const gotWager = (shotRound2?.health > 0 && shotRound2.action == Blades.Steal) ? EMOJI.MONEY : null

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
      {shotRound1 && duelStage >= DuelStage.Round1Commit &&
        <CompletedIcon completed={completedStages[DuelStage.Round1Commit]}>
          <EmojiIcon emoji={EMOJI.STEP} size={_size} />
        </CompletedIcon>
      }
      {shotRound1 && duelStage == DuelStage.Round1Reveal &&
        <CompletedIcon completed={completedStages[DuelStage.Round1Reveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {shotRound2 && duelStage >= DuelStage.Round2Commit &&
        <CompletedIcon completed={completedStages[DuelStage.Round2Commit]}>
          <EmojiIcon emoji={EMOJI.BLADES} size={_size} />
        </CompletedIcon>
      }
      {shotRound2 && duelStage == DuelStage.Round2Reveal &&
        <CompletedIcon completed={completedStages[DuelStage.Round2Reveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
      {isTurn && <span className='Important'> <LoadingIcon size={_size} /></span>}
    </>)
  }

  if (isFinished) {
    return (<>
      {shotRound1 && <ActionIcon action={parseInt(shotRound1.action)} size={_size} />}
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {winRound1 && <EmojiIcon emoji={winRound1} size={_size} />}

      {shotRound2 && <>+<ActionIcon action={parseInt(shotRound2.action)} size={_size} /></>}
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
      {winRound2 && <EmojiIcon emoji={winRound2} size={_size} />}
      {gotWager && <EmojiIcon emoji={gotWager} size={_size} />}

      {shotRound3 && <>+<ActionIcon action={parseInt(shotRound3.action)} size={_size} /></>}
      {healthRound3 && <EmojiIcon emoji={healthRound3} size={_size} />}
      {winRound3 && <EmojiIcon emoji={winRound3} size={_size} />}
    </>)
  }

  return <></>
}

