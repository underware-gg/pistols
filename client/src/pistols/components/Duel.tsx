import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Segment, Icon, Step } from 'semantic-ui-react'
import { useDojoAccount, useDojoSystemCalls } from '@/dojo/DojoContext'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { useCommitMove } from '@/pistols/hooks/useCommitReveal'
import { useEffectOnce } from '@/pistols/hooks/useEffectOnce'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { BladesNames, FULL_HEALTH, HALF_HEALTH } from '@/pistols/utils/pistols'
import { MenuDuel, MenuDebugAnimations } from '@/pistols/components/Menus'
import { AnimationState } from '@/pistols/three/game'
import { EmojiIcon } from '@/pistols/components/ui/Icons'
import CommitModal from '@/pistols/components/CommitModal'
import { MESSAGES } from '../data/messages'

const Row = Grid.Row
const Col = Grid.Column

export default function Duel({
  duelId
}) {
  const { account } = useDojoAccount()
  const { gameImpl, animated } = useGameplayContext()
  const { dispatchSetDuel } = usePistolsContext()

  const { isLive, isFinished, message, duelistA, duelistB } = useChallenge(duelId)
  const { challengeDescription } = useChallengeDescription(duelId)

  const { duelStage, completedStagesA, completedStagesB } = useAnimatedDuel(duelId)
  // console.log(`Round 1:`, round1)
  // console.log(`Round 2:`, round2)

  useEffectOnce(() => {
    gameImpl?.resetScene()
  }, [])

  useEffect(() => dispatchSetDuel(duelId, isLive ? MenuKey.LiveDuels : MenuKey.PastDuels), [duelId, isLive])

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
        <Segment compact className='NoMargin'>
          <ProfilePic duel profilePic={profilePic} />
        </Segment>
      }
      <Segment compact floated={floated} className='NoMargin'>
        <ProfileDescription address={address} />
      </Segment>
      {floated == 'right' &&
        <Segment compact className='NoMargin'>
          <ProfilePic duel profilePic={profilePic} />
        </Segment>
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
}) {
  const { round1, round2, roundNumber } = useDuel(duelId)
  const { name } = useDuelist(duelistAccount)

  //-------------------------
  // Duel progression
  //

  const _healthResult = (round: any) => {
    const health = isA ? round.duelist_a.health : round.duelist_b.health
    return (health == 0 ? 'is DEAD!' : health < FULL_HEALTH ? 'is INJURED!' : 'is ALIVE!')
  }

  const pistolsResult = useMemo(() => {
    if (duelStage > DuelStage.PistolsShootout) {
      const steps = isA ? round1.duelist_a.move : round1.duelist_b.move
      const health = _healthResult(round1)
      return <span>Walks <span className='Important'>{steps} steps</span><br />and {health}</span>
    }
    return null
  }, [round1, duelStage])

  const bladesResult = useMemo(() => {
    if (round2 && duelStage > DuelStage.BladesClash) {
      const blade = isA ? round2.duelist_a.move : round2.duelist_b.move
      const health = _healthResult(round2)
      return <span>Clashes with <span className='Important'>{BladesNames[blade]}</span><br />and {health}</span>
    }
    return null
  }, [round2, duelStage])

  const _resultBackground = (round) => {
    const health = isA ? round.duelist_a.health : round.duelist_b.health
    return health == FULL_HEALTH ? 'Positive' : health == HALF_HEALTH ? 'Warning' : 'Negative'
  }
  const _resultEmoji = (round) => {
    const health = isA ? round.duelist_a.health : round.duelist_b.health
    return health == FULL_HEALTH ? MESSAGES.ALIVE_EMOJI : health == HALF_HEALTH ? MESSAGES.INJURED_EMOJI : MESSAGES.DEAD_EMOJI
  }


  //------------------------------
  // Duelist interaction
  //
  const isYou = useMemo(() => (BigInt(account?.address) == duelistAccount), [account, duelistAccount])

  // Commit modal control
  const [commitStepsIsOpen, setCommitStepsIsOpen] = useState(false)
  const [commitBladesIsOpen, setCommitBladesIsOpen] = useState(false)
  const _commit = () => {
    if (roundNumber == 1) setCommitStepsIsOpen(true)
    if (roundNumber == 2) setCommitBladesIsOpen(true)
  }

  // Reveal
  const { reveal_move } = useDojoSystemCalls()
  const { hash, salt, move } = useCommitMove(duelId, roundNumber)
  const _reveal = () => {
    // console.log(`REVEAL`, duelId, roundNumber, hash, salt, move, pedersen(salt, move).toString(16))
    reveal_move(account, duelId, roundNumber, salt, move)
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
  }, [completedStages, duelStage, isYou])


  //------------------------------
  return (
    <>
      <CommitModal duelId={duelId} roundNumber={1} isOpen={commitStepsIsOpen} setIsOpen={setCommitStepsIsOpen} />
      <CommitModal duelId={duelId} roundNumber={2} isOpen={commitBladesIsOpen} setIsOpen={setCommitBladesIsOpen} />
      <Step.Group vertical size='small'>
        <ProgressItem
          stage={DuelStage.StepsCommit}
          duelStage={duelStage}
          completedStages={completedStages}
          title='Choose Steps'
          description=''
          icon='street view'
          emoji='👣'
          // emoji='🥾'
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
          emoji={pistolsResult ? _resultEmoji(round1) : null}
          floated={floated}
          onClick={onClick}
          className={pistolsResult ? _resultBackground(round1) : null}
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
              emoji='🗡️'
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
              emoji={bladesResult ? _resultEmoji(round2) : null}
              floated={floated}
              onClick={onClick}
              className={bladesResult ? _resultBackground(round2) : null}
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
  const _completed =
    ((stage < duelStage) || (stage == duelStage && completedStages[stage] === true))
     && stage != DuelStage.PistolsShootout && stage != DuelStage.BladesClash
  const _active = (duelStage == stage)
  const _disabled = (duelStage < stage)
  const _left = (floated == 'left')
  const _right = (floated == 'right')
  const _link = (onClick && _active && !_completed)
  let classNames = className ? [className] : []

  let _icon = useMemo(() => {
    const style = _right ? { margin: '0 0 0 1rem' } : {}
    if (icon) return <Icon name={icon} style={style} />
    if (emoji) return <EmojiIcon emoji={emoji} style={style} flipped={emojiFlipped} rotated={emojiRotated} />
    return <></>
  }, [icon, emoji, _completed, _right])

  // if (_right) classNames.push('AlignRight')
  classNames.push('AlignCenter')
  if (!_link) classNames.push('NoMouse')
  return (
    <Step
      className={classNames.join(' ')}
      completed={_completed}
      active={_active}
      disabled={_disabled}
      link={_link}
      onClick={_link ? onClick : null}
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
