import React, { useMemo } from 'react'
import { Icon, Grid } from 'semantic-ui-react'
import { IconSizeProp } from 'semantic-ui-react/dist/commonjs/elements/Icon/Icon'
import { DuelStage, useDuel } from '@/hooks/useDuel'
import { CompletedIcon, EmojiIcon, LoadingIcon } from '@/components/ui/Icons'
import { BladesIcon, PacesIcon } from '@/components/ui/PistolsIcon'
import { bigintEquals } from '@underware_gg/pistols-sdk/utils'
import { EMOJI } from '@/data/messages'
import { BigNumberish } from 'starknet'
import { constants } from '@underware_gg/pistols-sdk/pistols'

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
    challenge: { duelistIdA, duelistIdB, winner, isAwaiting, isInProgress, isFinished },
    round1, duelStage, completedStagesA, completedStagesB, turnA, turnB,
  } = useDuel(duelId)

  const isA = useMemo(() => bigintEquals(duelistId, duelistIdA), [duelistId, duelistIdA])
  const isB = useMemo(() => bigintEquals(duelistId, duelistIdB), [duelistId, duelistIdB])

  const moves1 = useMemo(() => (isA ? (round1?.moves_a ?? null) : isB ? (round1?.moves_b ?? null) : null), [isA, isB, round1])
  const state1 = useMemo(() => (isA ? (round1?.state_a ?? null) : isB ? (round1?.state_b ?? null) : null), [isA, isB, round1])

  const isWinner = useMemo(() => (isA && winner == 1) || (isB && winner == 2), [isA, isB, winner])
  const isTurn = useMemo(() => (isA ? turnA : isB ? turnB : false), [isA, isB, turnA, turnB])
  const completedStages = useMemo(() => (isA ? (completedStagesA) : isB ? (completedStagesB) : null), [isA, isB, completedStagesA, completedStagesB])

  const dead = useMemo(() => ((isFinished && state1?.health == 0) ? EMOJI.DEAD : null), [state1, isFinished])
  const win1 = useMemo(() => (isWinner ? EMOJI.WINNER : null), [isWinner])
  const bloodCount = useMemo(() => (
    (isFinished && !dead && state1 && state1.health < constants.CONST.FULL_HEALTH) ? (constants.CONST.FULL_HEALTH - state1.health) : 0
  ), [state1, isFinished, dead])

  // console.log(`ICONS:`, duelistId, dead, win1, bloodCount, state1)

  const iconSize = size as IconSizeProp

  const { icons } = useMemo(() => {
    let icons = []
    //
    // Awaiting (B is always pending)
    if (isAwaiting) {
      if (isA) {
        icons = [
          <CompletedIcon key='isA' completed={true}>
            <EmojiIcon emoji={EMOJI.AGREEMENT} size={iconSize} />
          </CompletedIcon>
        ]
      } else {
        icons = [
          <CompletedIcon key='isB' completed={false}>
            <EmojiIcon emoji={EMOJI.AGREEMENT} size={iconSize} />
          </CompletedIcon>,
          <LoadingIcon key='isTurn' size={iconSize} className='Brightest' />
        ]
      }
    }
    //
    // In Progress...
    if ((isAwaiting && isA) || isInProgress) {
      if (state1) {
        if (duelStage >= DuelStage.Round1Commit) {
          icons.push(
            <CompletedIcon key='commit1' completed={completedStages[DuelStage.Round1Commit]}>
              <EmojiIcon emoji={EMOJI.PACES} size={iconSize} />
            </CompletedIcon>
          )
        }
        if (duelStage == DuelStage.Round1Reveal) {
          icons.push(
            <CompletedIcon key='reveal1' completed={completedStages[DuelStage.Round1Reveal]}>
              <Icon name='eye' size={iconSize} />
            </CompletedIcon>
          )
        }
      }
      if (isTurn) {
        icons.push(<LoadingIcon key='isTurn' size={iconSize} className='Brightest' />)
      }
    }
    //
    // Finished...
    if (isFinished) {
      if (state1 && moves1) {
        const pacesFire = moves1.card_1
        const pacesDodge = moves1.card_2
        const cardFire = constants.getPacesCardFromValue(pacesFire)
        const cardDodge = constants.getPacesCardFromValue(pacesDodge)
        if (pacesDodge <= pacesFire) {
          icons.push(<PacesIcon key='dodge' paces={cardDodge} size={iconSize} dodge />)
          icons.push(<PacesIcon key='fire' paces={cardFire} size={iconSize} />)
        } else {
          icons.push(<PacesIcon key='fire' paces={cardFire} size={iconSize} />)
          icons.push(<PacesIcon key='dodge' paces={cardDodge} size={iconSize} dodge />)
        }
      }

      for (let i = 0; i < bloodCount; i++) {
        icons.push(<EmojiIcon key={`blood${i}`} emoji={EMOJI.INJURED} size={iconSize} />)
      }

      if (round1?.endedInBlades) {
        const cardBlades = constants.getBladesCardFromValue(moves1.card_4)
        icons.push(<BladesIcon key='blades' blade={cardBlades} size={iconSize} />)
      }

      if (dead) icons.push(<EmojiIcon key='dead' emoji={dead} size={iconSize} />)
      if (win1) icons.push(<EmojiIcon key='win1' emoji={win1} size={iconSize} />)
    }

    return { icons }
  }, [isAwaiting, isInProgress, isFinished, duelStage, isA, isB, isTurn, state1, completedStages, win1, dead, bloodCount, iconSize])

  return {
    icons,
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
  const { icons } = useDuelIcons({ duelId, duelistId, size })

  return (
    <>
      {icons}
    </>
  )
}


export function DuelIconsAsGrid({
  duelId,
  duelistIdA,
  duelistIdB,
  size = 'big',
}: {
  duelId: BigNumberish
  duelistIdA: BigNumberish
  duelistIdB: BigNumberish
  size: IconSizeProp
}) {
  const { icons: iconsA, isAwaiting } = useDuelIcons({ duelId, duelistId: duelistIdA, size })
  const { icons: iconsB } = useDuelIcons({ duelId, duelistId: duelistIdB, size })

  return (
    <Grid textAlign='center' verticalAlign='middle' className='TitleCase'>
      {iconsA.length > 0 &&
        <Row>
          <Col width={6} textAlign='right'>
            {iconsA}
          </Col>
          <Col width={4}>
            {isAwaiting ? 'Pact' : 'Round 1'}
          </Col>
          <Col width={6} textAlign='left'>
            {iconsB}
          </Col>
        </Row>
      }
    </Grid>
  )
}
