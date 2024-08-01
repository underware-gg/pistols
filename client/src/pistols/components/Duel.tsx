import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Grid, Segment, Icon, Step, SegmentGroup, SemanticFLOATS } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useTable } from '@/pistols/hooks/useTable'
import { useRevealAction } from '@/pistols/hooks/useRevealAction'
import { useIsYou } from '@/pistols/hooks/useIsMyDuelist'
import { useWager } from '@/pistols/hooks/useWager'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { DuelStage, useAnimatedDuel, useDuel, useDuelResult } from '@/pistols/hooks/useDuel'
import { ProfileDescription } from '@/pistols/components/account/ProfileDescription'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileModels } from '@/pistols/data/assets'
import { AnimationState } from '@/pistols/three/game'
import { EmojiIcon, LoadingIcon } from '@/lib/ui/Icons'
import { ActionEmojis, ActionTypes } from '@/pistols/utils/pistols'
import { MenuDebugAnimations, MenuDuel } from '@/pistols/components/Menus'
import { Balance } from '@/pistols/components/account/Balance'
import { EMOJI } from '@/pistols/data/messages'
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import CommitBladesModal from '@/pistols/components/CommitBladesModal'
import { constants } from '@/games/pistols/generated/constants'

const Row = Grid.Row
const Col = Grid.Column

export default function Duel({
  duelId
}) {
  const { gameImpl } = useThreeJsContext()
  const { animated } = useGameplayContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { tableId, isFinished, message, duelistIdA, duelistIdB, timestamp_start } = useChallenge(duelId)
  const { description } = useTable(tableId)
  const { value } = useWager(duelId)

  // guarantee to run only once when this component mounts
  const mounted = useMounted()
  const [duelSceneStarted, setDuelSceneStarted] = useState(false)
  const { profilePic: profilePicA, nameDisplay: nameA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB, nameDisplay: nameB } = useDuelist(duelistIdB)
  useEffect(() => {
    if (gameImpl && mounted && !duelSceneStarted && profilePicA && profilePicB && nameA && nameB) {
      gameImpl.startDuelWithPlayers(nameA, ProfileModels[profilePicA], nameB, ProfileModels[profilePicB])
      setDuelSceneStarted(true)
    }
  }, [gameImpl, mounted, duelSceneStarted, profilePicA, profilePicB, nameA, nameB])

  // setup grass animation
  const { clientTimestamp } = useClientTimestamp(false)
  useEffect(() => {
    if (clientTimestamp && timestamp_start) {
      gameImpl?.setDuelTimePercentage(clientTimestamp - timestamp_start)
    }
  }, [gameImpl, clientTimestamp, timestamp_start])

  // Animated duel is useDuel added with intermediate animation stages
  const {
    duelStage,
    completedStagesA, completedStagesB,
    canAutoRevealA, canAutoRevealB,
    healthA, healthB,
  } = useAnimatedDuel(duelId, duelSceneStarted)

  const { debugMode } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  if (!duelSceneStarted) return <></>

  return (
    <>
      <div className='TavernTitle' style={{ maxWidth: '350px' }}>
        <h3 className='Important'>{description}</h3>
        <h1 className='Quote'>{`“${message}”`}</h1>
        {value > 0 &&
          <h5><Balance big tableId={tableId} wei={value} /></h5>
        }
        {(isFinished && animated == AnimationState.Finished) &&
          <Segment>
            <h3 className='Important'>{challengeDescription}</h3>
          </Segment>
        }
      </div>

      <div className='DuelSideA'>
        <div className='DuelProfileA' >
          <DuelProfile floated='left' duelistId={duelistIdA} health={healthA} />
        </div>
        <DuelProgress floated='left'
          isA
          duelId={duelId}
          duelStage={duelStage}
          duelistId={duelistIdA}
          completedStages={completedStagesA}
          canAutoReveal={canAutoRevealA}
        />
      </div>
      <div className='DuelSideB'>
        <div className='DuelProfileB' >
          <DuelProfile floated='right' duelistId={duelistIdB} health={healthB} />
        </div>
        <DuelProgress floated='right'
          isB
          duelId={duelId}
          duelStage={duelStage}
          duelistId={duelistIdB}
          completedStages={completedStagesB}
          canAutoReveal={canAutoRevealB}
        />
      </div>

      <MenuDuel duelStage={duelStage} duelId={duelId} tableId={tableId} />

      <DojoSetupErrorDetector />

      {debugMode && <MenuDebugAnimations />}
    </>
  )
}

function DuelProfile({
  duelistId,
  floated,
  health,
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  health: number
}) {
  const { profilePic } = useDuelist(duelistId)

  return (
    <>
      {floated == 'left' &&
        <ProfilePic duel profilePic={profilePic} />
      }
      <div className='ProfileAndHealth'>
        <Segment compact floated={floated} className='ProfileDescription'>
          <ProfileDescription duelistId={duelistId} displayOwnerAddress />
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
  duelistId,
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
  const { isConnected } = useAccount()
  const { isYou } = useIsYou(duelistId)
  // const isTurn = useMemo(() => ((isA && turnA) || (isB && turnB)), [isA, isB, turnA, turnB])

  // Commit modal control
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal } = useRevealAction(duelId, roundNumber, currentRoundAction?.hash, duelStage == DuelStage.Round1Reveal || duelStage == DuelStage.Round2Reveal)
  const onClick = useCallback(() => {
    if (isYou && isConnected && completedStages[duelStage] === false) {
      if (duelStage == DuelStage.Round1Commit || duelStage == DuelStage.Round2Commit) {
        setCommitModalIsOpen(true)
      }
      if (duelStage == DuelStage.Round1Reveal || duelStage == DuelStage.Round2Reveal) {
        console.log(`_reveal()....`)
        reveal()
      }
    }
  }, [isYou, isConnected, duelStage, completedStages])

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
          onClick={isYou ? onClick : null}
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
            onClick={isYou ? onClick : null}
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
          onClick={null}
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
              onClick={isYou ? onClick : null}
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
                onClick={isYou ? onClick : null}
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
              onClick={null}
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
            onClick={null}
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
  const _isCurrentStage = (duelStage == stage)
  const _completed =
    stage != DuelStage.Round1Animation && stage != DuelStage.Round2Animation && stage != DuelStage.Round3Animation // animations do not complete
    && (
      (stage < duelStage) // past stage
      || (_isCurrentStage && completedStages[stage] === true
      ))
  const _canClick = (_isCurrentStage && !_completed && Boolean(onClick))

  const _disabled = (duelStage < stage)
  const _left = (floated == 'left')
  const _right = (floated == 'right')

  const classNames = useMemo(() => {
    let classNames = ['AlignCenter']
    if (className) classNames.push(className)
    if (!_canClick) classNames.push('NoMouse')
    return classNames
  }, [className, _canClick])

  let _icon = useMemo(() => {
    const style = _right ? { margin: '0 0 0 1rem' } : {}
    if (_isCurrentStage && !_completed) return <LoadingIcon style={style} />
    if (icon) return <Icon name={icon} style={style} />
    if (emoji) return <EmojiIcon emoji={emoji} style={style} flipped={emojiFlipped} rotated={emojiRotated} />
    return <></>
  }, [icon, emoji, _completed, _right])

  // if (_right) classNames.push('AlignRight')
  return (
    <Step
      className={classNames.join(' ')}
      completed={_completed}
      active={_canClick}
      disabled={_disabled}
      link={_canClick}
      onClick={() => (_canClick ? onClick : null)?.()}
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
