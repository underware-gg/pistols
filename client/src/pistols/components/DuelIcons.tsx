import React from 'react'
import { Icon } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { Blades, ChallengeState, HALF_HEALTH } from '@/pistols/utils/pistols'
import { BladesIcon, CompletedIcon, EmojiIcon, StepsIcon } from '@/pistols/components/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'


export function DuelIcons({
  duelId,
  account,
  size = 'large',
}) {
  const {
    challenge: { duelistA, duelistB, state, isFinished },
    round1, round2, duelStage, completedStagesA, completedStagesB,
  } = useDuel(duelId)

  const isA = account == duelistA
  const isB = account == duelistB
  const movesRound1 = isA ? (round1?.duelist_a ?? null) : isB ? (round1?.duelist_b ?? null) : null
  const movesRound2 = isA ? (round2?.duelist_a ?? null) : isB ? (round2?.duelist_b ?? null) : null
  const completedStages = isA ? (completedStagesA) : isB ? (completedStagesB) : null

  const healthRound1 = movesRound1?.health == 0 ? EMOJI.DEAD : movesRound1?.health == HALF_HEALTH ? EMOJI.INJURED : null
  const healthRound2 = movesRound2?.health == 0 ? EMOJI.DEAD : (movesRound2?.health == HALF_HEALTH && !healthRound1) ? EMOJI.INJURED : null

  const _size = size as IconSizeProp

  if (state == ChallengeState.Awaiting) {
    return (<>
      {isA &&
        <CompletedIcon completed={true}>
          <EmojiIcon emoji={EMOJI.AGREEMENT} size={_size} />
        </CompletedIcon>
      }
      {isB &&
        <CompletedIcon completed={false}>
          <EmojiIcon emoji={EMOJI.AGREEMENT} size={_size} />
        </CompletedIcon>
      }
    </>)
  }

  if (state == ChallengeState.InProgress) {
    return (<>
      {movesRound1 && duelStage >= DuelStage.StepsCommit &&
        <CompletedIcon completed={completedStages[DuelStage.StepsCommit]}>
          <EmojiIcon emoji={EMOJI.STEP} size={_size} />
        </CompletedIcon>
      }
      {movesRound1 && duelStage == DuelStage.StepsReveal &&
        <CompletedIcon completed={completedStages[DuelStage.StepsReveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {movesRound2 && duelStage >= DuelStage.BladesCommit &&
        <CompletedIcon completed={completedStages[DuelStage.BladesCommit]}>
          <EmojiIcon emoji={EMOJI.HEAVY} size={_size} />
        </CompletedIcon>
      }
      {movesRound2 && duelStage == DuelStage.BladesReveal &&
        <CompletedIcon completed={completedStages[DuelStage.BladesReveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
    </>)
  }

  if (isFinished) {
    return (<>
      {movesRound1 && <StepsIcon stepCount={parseInt(movesRound1.move)} size={_size} />}
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {movesRound2 && <BladesIcon blades={parseInt(movesRound2.move) as Blades} size={_size} />}
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
    </>)
  }

  return <></>
}

