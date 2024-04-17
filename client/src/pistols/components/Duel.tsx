import React, { useEffect, useMemo, useState } from 'react'
import { Grid, Segment, Icon, Step, SegmentGroup } from 'semantic-ui-react'
import { useDojoAccount } from '@/lib/dojo/DojoContext'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '../hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useEffectOnce } from '@/lib/utils/hooks/useEffectOnce'
import { useWager } from '@/pistols/hooks/useWager'
import { DuelStage, useAnimatedDuel, useDuel, useDuelResult } from '@/pistols/hooks/useDuel'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { MenuDuel } from '@/pistols/components/Menus'
import { AnimationState } from '@/pistols/three/game'
import { EmojiIcon, LoadingIcon } from '@/lib/ui/Icons'
import { ActionEmojis, ActionTypes } from '../utils/pistols'
import { Balance } from '@/pistols/components/account/Balance'
import { constants } from '@/pistols/utils/constants'
import { EMOJI } from '@/pistols/data/messages'
import PlayerSwitcher from '@/pistols/components/PlayerSwitcher'
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import CommitBladesModal from '@/pistols/components/CommitBladesModal'
import RevealModal from '@/pistols/components/RevealModal'
import { bigintEquals } from '@/lib/utils/types'

const Row = Grid.Row
const Col = Grid.Column

export default function Duel({
  duelId
}) {
  const { accountAddress } = useDojoAccount()
  const { gameImpl } = useThreeJsContext()
  const { animated } = useGameplayContext()
  const { dispatchSelectDuel } = usePistolsContext()

  const { isLive, isFinished, message, duelistA, duelistB } = useChallenge(duelId)
  const { challengeDescription } = useChallengeDescription(duelId)

  const { duelStage,
    completedStagesA, completedStagesB,
    canAutoRevealA, canAutoRevealB,
    healthA, healthB,
  } = useAnimatedDuel(duelId)
  const { coin, value } = useWager(duelId)

  useEffectOnce(() => {
    gameImpl?.resetDuelScene()
  }, [])

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  return (
    <>
      <div className='TavernTitle' style={{ maxWidth: '350px' }}>
        <h1 className='Quote'>{`“${message}”`}</h1>
        {value > 0 &&
          <h5><Balance big coin={coin} wei={value} /></h5>
        }
        {(isFinished && animated == AnimationState.Finished) &&
          <Segment>
            <h3 className='Important'>{challengeDescription}</h3>
          </Segment>
        }
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelProfile floated='left' address={duelistA} health={healthA} />
        </div>
        <DuelProgress floated='left'
          isA
          duelId={duelId}
          duelStage={duelStage}
          accountAddress={accountAddress}
          duelistAccount={duelistA}
          completedStages={completedStagesA}
          canAutoReveal={canAutoRevealA}
        />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelProfile floated='right' address={duelistB} health={healthB} />
        </div>
        <DuelProgress floated='right'
          isB
          duelId={duelId}
          duelStage={duelStage}
          accountAddress={accountAddress}
          duelistAccount={duelistB}
          completedStages={completedStagesB}
          canAutoReveal={canAutoRevealB}
        />
      </div>

      <MenuDuel duelStage={duelStage} duelId={duelId} />

      <PlayerSwitcher />

      {/* {process.env.NEXT_PUBLIC_DEBUG &&
        <MenuDebugAnimations />
      } */}
    </>
  )
}

function DuelProfile({
  address,
  floated,
  health,
}) {
  const { name, profilePic } = useDuelist(address)

  return (
    <>
      {floated == 'left' &&
        <ProfilePic duel profilePic={profilePic} />
      }
      <div className='ProfileAndHealth'>
        <Segment compact floated={floated} className='ProfileDescription'>
          <ProfileDescription address={address} displayAddress />
        </Segment>
        <DuelHealthBar health={health} floated={floated} />
      </div>
      {floated == 'right' &&
        <ProfilePic duel profilePic={profilePic} />
      }
    </>
  )
}

function DuelHealthBar({
  health,
  floated,
}) {
  const points = useMemo(() => {
    let result = []
    for (let i = 1; i <= constants.FULL_HEALTH; ++i) {
      const full = (health >= i)
      result.push(
        <Segment key={`${i}_${full ? 'full' : 'empty'}`} className={full ? 'HealthPointFull' : 'HealthPointEmpty'} />
      )
    }
    if (floated == 'right') {
      result.reverse()
    }
    return result
  }, [health])
  return (
    <SegmentGroup horizontal className='HealthBar'>
      {points}
    </SegmentGroup>
  )
}


function DuelProgress({
  isA = false,
  isB = false,
  duelId,
  duelStage,
  accountAddress,
  duelistAccount,
  completedStages,
  floated,
  canAutoReveal = false
}) {
  const { round1, round2, round3, roundNumber, turnA, turnB, } = useDuel(duelId)
  const round1Shot = useMemo(() => (isA ? round1?.shot_a : round1?.shot_b), [isA, round1])
  const round2Shot = useMemo(() => (isA ? round2?.shot_a : round2?.shot_b), [isA, round2])
  const round3Shot = useMemo(() => (isA ? round3?.shot_a : round3?.shot_b), [isA, round3])
  const currentRoundAction = useMemo(() => (roundNumber == 1 ? round1Shot : roundNumber == 2 ? round2Shot : round3Shot), [roundNumber, round1Shot, round2Shot, round3Shot])

  //-------------------------
  // Duel progression
  //
  const round1Result = useDuelResult(round1, round1Shot, duelStage, DuelStage.Round1Animation);
  const round2Result = useDuelResult(round2, round2Shot, duelStage, DuelStage.Round2Animation);
  const round3Result = useDuelResult(round3, round3Shot, duelStage, DuelStage.Round3Animation);

  const _resultBackground = (shot: any) => {
    return shot.health == 0 ? 'Negative' : shot.damage > 0 ? 'Warning' : 'Positive'
  }
  const _resultEmoji = (shot: any) => {
    const actionEmoji = ActionEmojis[shot.action]
    return ActionTypes.runner.includes(shot.action) ? actionEmoji
      : shot.health == 0 ? EMOJI.DEAD
        : shot.wager > 0 ? EMOJI.WAGER
          : shot.win > 0 ? EMOJI.WINNER
            : shot.damage > 0 ? EMOJI.INJURED
              : actionEmoji // EMOJI.ALIVE
  }


  //------------------------------
  // Duelist interaction
  //
  const isYou = useMemo(() => bigintEquals(accountAddress, duelistAccount), [accountAddress, duelistAccount])
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
      if (duelStage == DuelStage.Round1Commit || duelStage == DuelStage.Round2Commit) {
        return _commit
      }
      if (duelStage == DuelStage.Round1Reveal || duelStage == DuelStage.Round2Reveal) {
        return _reveal
      }
    }
    return null
  }, [isYou, duelStage, completedStages])

  // auto-reveal
  useEffect(() => {
    if (canAutoReveal) {
      onClick?.()
    }
  }, [onClick, canAutoReveal])

  //------------------------------
  return (
    <>
      <CommitPacesModal duelId={duelId} isOpen={roundNumber == 1 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <CommitBladesModal duelId={duelId} isOpen={roundNumber == 2 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} isA={isA} isB={isB} />
      <RevealModal duelId={duelId} roundNumber={roundNumber} isOpen={revealModalIsOpen} hash={currentRoundAction?.hash} setIsOpen={setRevealModalIsOpen} />
      <Step.Group vertical size='small'>
        <ProgressItem
          stage={DuelStage.Round1Commit}
          duelStage={duelStage}
          completedStages={completedStages}
          title='Choose Paces'
          description=''
          icon='street view'
          // emoji=EMOJI.PACES
          floated={floated}
          onClick={onClick}
        />
        {duelStage <= DuelStage.Round1Reveal &&
          <ProgressItem
            stage={DuelStage.Round1Reveal}
            duelStage={duelStage}
            completedStages={completedStages}
            title='Reveal Paces'
            description=''
            icon='eye'
            floated={floated}
            onClick={onClick}
          />
        }
        <ProgressItem
          stage={DuelStage.Round1Animation}
          duelStage={duelStage}
          completedStages={completedStages}
          title={round1Result ?? 'Pistols shootout!'}
          description=''
          icon={round1Result ? null : 'target'}
          emoji={round1Result ? _resultEmoji(round1Shot) : null}
          floated={floated}
          onClick={onClick}
          className={round1Result ? _resultBackground(round1Shot) : null}
        />

        {(round2 && duelStage >= DuelStage.Round2Commit) &&
          <>
            <ProgressItem
              stage={DuelStage.Round2Commit}
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
            {duelStage <= DuelStage.Round2Reveal &&
              <ProgressItem
                stage={DuelStage.Round2Reveal}
                duelStage={duelStage}
                completedStages={completedStages}
                title='Reveal Blades'
                description=''
                icon='eye'
                floated={floated}
                onClick={onClick}
              />
            }
            <ProgressItem
              stage={DuelStage.Round2Animation}
              duelStage={duelStage}
              completedStages={completedStages}
              title={round2Result ?? 'Blades clash!'}
              description=''
              icon={round2Result ? null : 'target'}
              emoji={round2Result ? _resultEmoji(round2Shot) : null}
              floated={floated}
              onClick={onClick}
              className={round2Result ? _resultBackground(round2Shot) : null}
            />
          </>
        }

        {(round3 && duelStage >= DuelStage.Round3Animation) &&
          <ProgressItem
            stage={DuelStage.Round3Animation}
            duelStage={duelStage}
            completedStages={completedStages}
            title={round3Result ?? 'Blades clash!'}
            description=''
            icon={round3Result ? null : 'target'}
            emoji={round3Result ? _resultEmoji(round3Shot) : null}
            floated={floated}
            onClick={onClick}
            className={round3Result ? _resultBackground(round3Shot) : null}
          />
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
    stage != DuelStage.Round1Animation && stage != DuelStage.Round2Animation && stage != DuelStage.Round3Animation // animations do not complete
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
    if (_currentStage && !_completed) return <LoadingIcon style={style} />
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
      active={Boolean(_currentStage && _onClick)}
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
