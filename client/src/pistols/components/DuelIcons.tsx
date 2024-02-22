import React from 'react'
import { Icon } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/pistols/hooks/useDuel'
import { Blades, ChallengeState } from '@/pistols/utils/pistols'
import { BladesIcon, CompletedIcon, EmojiIcon, StepsIcon } from '@/pistols/components/ui/Icons'
import { EMOJI } from '@/pistols/data/messages'
import constants from '@/pistols/utils/constants'


export function DuelIcons({
  duelId,
  account,
  size = 'large',
}) {
  const {
    challenge: { duelistA, duelistB, state, isFinished },
    round1, round2, duelStage, completedStagesA, completedStagesB, turnA, turnB,
  } = useDuel(duelId)

  const isA = account == duelistA
  const isB = account == duelistB
  const shotRound1 = isA ? (round1?.shot_a ?? null) : isB ? (round1?.shot_b ?? null) : null
  const shotRound2 = isA ? (round2?.shot_a ?? null) : isB ? (round2?.shot_b ?? null) : null
  const completedStages = isA ? (completedStagesA) : isB ? (completedStagesB) : null
  const isTurn = isA ? turnA : isB ? turnB : false

  const healthRound1 = shotRound1?.health == 0 ? EMOJI.DEAD : shotRound1?.health == constants.SINGLE_DAMAGE ? EMOJI.INJURED : null
  const healthRound2 = shotRound2?.health == 0 ? EMOJI.DEAD : (shotRound2?.health == constants.SINGLE_DAMAGE && !healthRound1) ? EMOJI.INJURED : null

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
          <span className='Important'> <Icon name='spinner' loading size={_size} /></span>
        </>
      }
    </>)
  }

  if (state == ChallengeState.InProgress) {
    return (<>
      {shotRound1 && duelStage >= DuelStage.StepsCommit &&
        <CompletedIcon completed={completedStages[DuelStage.StepsCommit]}>
          <EmojiIcon emoji={EMOJI.STEP} size={_size} />
        </CompletedIcon>
      }
      {shotRound1 && duelStage == DuelStage.StepsReveal &&
        <CompletedIcon completed={completedStages[DuelStage.StepsReveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {shotRound2 && duelStage >= DuelStage.BladesCommit &&
        <CompletedIcon completed={completedStages[DuelStage.BladesCommit]}>
          <EmojiIcon emoji={EMOJI.BLADES} size={_size} />
        </CompletedIcon>
      }
      {shotRound2 && duelStage == DuelStage.BladesReveal &&
        <CompletedIcon completed={completedStages[DuelStage.BladesReveal]}>
          <Icon name='eye' size={_size} />
        </CompletedIcon>
      }
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
      {isTurn && <span className='Important'> <Icon name='spinner' loading size={_size} /></span>}
    </>)
  }

  if (isFinished) {
    return (<>
      {shotRound1 && <StepsIcon stepCount={parseInt(shotRound1.move)} size={_size} />}
      {healthRound1 && <EmojiIcon emoji={healthRound1} size={_size} />}
      {shotRound2 && <BladesIcon blade={parseInt(shotRound2.move) as Blades} size={_size} />}
      {healthRound2 && <EmojiIcon emoji={healthRound2} size={_size} />}
    </>)
  }

  return <></>
}

