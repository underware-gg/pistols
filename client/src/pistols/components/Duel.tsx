import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Segment, Icon, Step } from 'semantic-ui-react'
import { useDojoAccount } from '@/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '../hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { MenuDuel } from '@/pistols/components/Menus'
import { AnimationState } from '@/pistols/three/game'
import { EmojiIcon } from '@/pistols/components/ui/Icons'
import CommitStepsModal from '@/pistols/components/CommitStepsModal'
import CommitBladesModal from '@/pistols/components/CommitBladesModal'
import RevealModal from '@/pistols/components/RevealModal'
import { EMOJI } from '@/pistols/data/messages'
import { BladesNames } from '@/pistols/utils/pistols'
import constants from '@/pistols/utils/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function Duel({
  duelId
}) {
  const { account } = useDojoAccount()
  const { gameImpl } = useThreeJsContext()
  const { animated } = useGameplayContext()
  const { dispatchSelectDuel } = usePistolsContext()

  const { isLive, isFinished, message, duelistA, duelistB } = useChallenge(duelId)
  const { challengeDescription } = useChallengeDescription(duelId)

  const { duelStage, completedStagesA, completedStagesB, canAutoRevealA, canAutoRevealB } = useAnimatedDuel(duelId)
  // console.log(`Round 1:`, round1)
  // console.log(`Round 2:`, round2)

  useEffectOnce(() => {
    gameImpl?.resetDuelScene()
  }, [])

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  return (
    <>
      <div className='TavernTitle' style={{ maxWidth: '250px' }}>
        <h1 className='Quote'>{`“${message}”`}</h1>
        {(isFinished && animated == AnimationState.Finished) &&
          <Segment>
            <h3 className='Important'>{challengeDescription}</h3>
          </Segment>
        }
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelProfile floated='left' address={duelistA} />
        </div>
        <DuelProgress floated='left'
          isA
          duelId={duelId}
          duelStage={duelStage}
          account={account}
          duelistAccount={duelistA}
          completedStages={completedStagesA}
          canAutoReveal={canAutoRevealA}
        />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelProfile floated='right' address={duelistB} />
        </div>
        <DuelProgress floated='right'
          isB
          duelId={duelId}
          duelStage={duelStage}
          account={account}
          duelistAccount={duelistB}
          completedStages={completedStagesB}
          canAutoReveal={canAutoRevealB}
        />
      </div>

      <MenuDuel duelStage={duelStage} />

      {/* {process.env.NEXT_PUBLIC_DEBUG &&
        <MenuDebugAnimations />
      } */}
    </>
  )
}

function DuelProfile({
  address,
  floated,
}) {
  const { name, profilePic } = useDuelist(address)

  return (
    <>
      {floated == 'left' &&
        <ProfilePic duel profilePic={profilePic} />
      }
      <Segment compact floated={floated} className='ProfileDescription'>
        <ProfileDescription address={address} />
      </Segment>
      {floated == 'right' &&
        <ProfilePic duel profilePic={profilePic} />
      }
    </>
  )
}


function DuelProgress({
  isA = false,
  isB = false,
  duelId,
  duelStage,
  account,
  duelistAccount,
  completedStages,
  floated,
  canAutoReveal = false
}) {
  const { round1, round2, roundNumber, turnA, turnB, } = useDuel(duelId)
  const round1Action = useMemo(() => (isA ? round1?.shot_a : round1?.shot_b), [isA, round1])
  const round2Action = useMemo(() => (isA ? round2?.shot_a : round2?.shot_b), [isA, round2])
  const currentRoundAction = useMemo(() => (roundNumber == 1 ? round1Action : round2Action), [roundNumber, round1Action, round2Action])

  //-------------------------
  // Duel progression
  //

  const _healthResult = (health: number) => {
    return (health == 0 ? 'is DEAD!' : health < constants.FULL_HEALTH ? 'is INJURED!' : 'is ALIVE!')
  }

  const pistolsResult = useMemo(() => {
    if (duelStage > DuelStage.PistolsShootout) {
      const steps = round1Action.action
      const health = _healthResult(round1Action.health)
      return <span>Walks <span className='Important'>{steps} steps</span><br />and {health}</span>
    }
    return null
  }, [round1, duelStage])

  const bladesResult = useMemo(() => {
    if (round2 && duelStage > DuelStage.BladesClash) {
      const blade = round2Action.action
      const health = _healthResult(round2Action.health)
      return <span>Clashes with <span className='Important'>{BladesNames[blade]}</span><br />and {health}</span>
    }
    return null
  }, [round2, duelStage])

  const _resultBackground = (health: number) => {
    return health == constants.FULL_HEALTH ? 'Positive' : health == constants.SINGLE_DAMAGE ? 'Warning' : 'Negative'
  }
  const _resultEmoji = (health: number) => {
    return health == constants.FULL_HEALTH ? EMOJI.ALIVE : health == constants.SINGLE_DAMAGE ? EMOJI.INJURED : EMOJI.DEAD
  }


  //------------------------------
  // Duelist interaction
  //
  const isYou = useMemo(() => (BigInt(account?.address) == duelistAccount), [account, duelistAccount])
  // const isTurn = useMemo(() => ((isA && turnA) || (isB && turnB)), [isA, isB, turnA, turnB])

  // Commit modal control
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const [revealModalIsOpen, setRevealModalIsOpen] = useState(false)
  const _commit = () => {
    setCommitModalIsOpen(true)
  }
  const _reveal = () => {
    setRevealModalIsOpen(true)
  }

  // onClick
  const onClick = useMemo(() => {
    if (isYou && !completedStages[duelStage]) {
      if (duelStage == DuelStage.StepsCommit || duelStage == DuelStage.BladesCommit) {
        return _commit
      }
      if (duelStage == DuelStage.StepsReveal || duelStage == DuelStage.BladesReveal) {
        return _reveal
      }
    }
    return null
  }, [isYou, duelStage, completedStages])

  // auto-reveal
  useEffect(() => {
    if (onClick && canAutoReveal) {
      onClick()
    }
  }, [onClick, canAutoReveal])

  //------------------------------
  return (
    <>
      <CommitStepsModal duelId={duelId} isOpen={roundNumber == 1 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <CommitBladesModal duelId={duelId} isOpen={roundNumber == 2 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <RevealModal duelId={duelId} roundNumber={roundNumber} isOpen={revealModalIsOpen} hash={currentRoundAction?.hash} setIsOpen={setRevealModalIsOpen} />
      <Step.Group vertical size='small'>
        <ProgressItem
          stage={DuelStage.StepsCommit}
          duelStage={duelStage}
          completedStages={completedStages}
          title='Choose Steps'
          description=''
          icon='street view'
          // emoji=EMOJI.STEP
          floated={floated}
          onClick={onClick}
        />
        <ProgressItem
          stage={DuelStage.StepsReveal}
          duelStage={duelStage}
          completedStages={completedStages}
          title='Reveal Steps'
          description=''
          icon='eye'
          floated={floated}
          onClick={onClick}
        />
        <ProgressItem
          stage={DuelStage.PistolsShootout}
          duelStage={duelStage}
          completedStages={completedStages}
          title={pistolsResult ?? 'Pistols shootout!'}
          description=''
          icon={pistolsResult ? null : 'target'}
          emoji={pistolsResult ? _resultEmoji(round1Action.health) : null}
          floated={floated}
          onClick={onClick}
          className={pistolsResult ? _resultBackground(round1Action.health) : null}
        />

        {(round2 && duelStage >= DuelStage.BladesCommit) &&
          <>
            <ProgressItem
              stage={DuelStage.BladesCommit}
              duelStage={duelStage}
              completedStages={completedStages}
              title='Choose Blades'
              description=''
              icon='shield'
              emoji={EMOJI.BLADES}
              // emojiFlipped='horizontally'
              // emojiRotated='clockwise'
              floated={floated}
              onClick={onClick}
            />
            <ProgressItem
              stage={DuelStage.BladesReveal}
              duelStage={duelStage}
              completedStages={completedStages}
              title='Reveal Blades'
              description=''
              icon='eye'
              floated={floated}
              onClick={onClick}
            />
            <ProgressItem
              stage={DuelStage.BladesClash}
              duelStage={duelStage}
              completedStages={completedStages}
              title={bladesResult ?? 'Blades clash!'}
              description=''
              icon={bladesResult ? null : 'target'}
              emoji={bladesResult ? _resultEmoji(round2Action.health) : null}
              floated={floated}
              onClick={onClick}
              className={bladesResult ? _resultBackground(round2Action.health) : null}
            />
          </>
        }
      </Step.Group>
    </>
  )
}

function ProgressItem({
  stage,
  duelStage,
  completedStages = {},
  title,
  description,
  icon = null,
  emoji = null,
  emojiFlipped = null,
  emojiRotated = null,
  floated,
  onClick = null,
  className = null,
}) {
  const _currentStage = (duelStage == stage)
  const _completed =
    stage != DuelStage.PistolsShootout && stage != DuelStage.BladesClash // animations do not complete
    && (
      (stage < duelStage) // past stage
      || (_currentStage && completedStages[stage] === true
      ))
  const _onClick = (_currentStage && !_completed ? onClick : null)
  const _disabled = (duelStage < stage)
  const _left = (floated == 'left')
  const _right = (floated == 'right')
  let classNames = className ? [className] : []

  let _icon = useMemo(() => {
    const style = _right ? { margin: '0 0 0 1rem' } : {}
    if (icon) return <Icon name={icon} style={style} />
    if (emoji) return <EmojiIcon emoji={emoji} style={style} flipped={emojiFlipped} rotated={emojiRotated} />
    return <></>
  }, [icon, emoji, _completed, _right])

  // if (_right) classNames.push('AlignRight')
  classNames.push('AlignCenter')
  if (!_onClick) classNames.push('NoMouse')
  return (
    <Step
      className={classNames.join(' ')}
      completed={_completed}
      active={_currentStage}
      disabled={_disabled}
      link={_onClick != null}
      onClick={_onClick}
    >
      {_left && _icon}
      <Step.Content className='AutoMargin'>
        <Step.Title>{title}</Step.Title>
        <Step.Description>{description}</Step.Description>
      </Step.Content>
      {_right && _icon}
    </Step>
  )
}
