import 'react-circular-progressbar/dist/styles.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, SemanticFLOATS, Image, Button } from 'semantic-ui-react'
import { BigNumberish } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useFinishedDuelProgress } from '@/pistols/hooks/useContractCalls'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useTable } from '@/pistols/hooks/useTable'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '@/pistols/hooks/useRevealAction'
import { useIsYou } from '@/pistols/hooks/useIsYou'
import { useWager } from '@/pistols/hooks/useWager'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileModels } from '@/pistols/data/assets'
import { AnimationState } from '@/pistols/three/game'
import { ArchetypeNames } from '@/pistols/utils/pistols'
import { MenuDebugAnimations, MenuDuel } from '@/pistols/components/Menus'
import { Balance } from '@/pistols/components/account/Balance'
import { bigintToHex, serialize } from '@/lib/utils/types'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useDuelistOwner } from '../hooks/useTokenDuelist'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import 'react-circular-progressbar/dist/styles.css';
import Cards from './Cards'
import useGameAspect from '@/pistols/hooks/useGameApect'


export default function Duel({
  duelId
}) {
  const { gameImpl } = useThreeJsContext()
  const { animated, dispatchAnimated } = useGameplayContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { tableId, isFinished, quote, duelistIdA, duelistIdB, timestamp_start } = useChallenge(duelId)
  const { description } = useTable(tableId)
  const { value, fee, feeFormatted } = useWager(duelId)

  // guarantee to run only once when this component mounts
  const mounted = useMounted()
  const [duelSceneStarted, setDuelSceneStarted] = useState(false)
  const { profilePic: profilePicA, name: nameA } = useDuelist(duelistIdA)
  const { profilePic: profilePicB, name: nameB } = useDuelist(duelistIdB)
  const { isYou: isYouA } = useIsYou(duelistIdA)
  const { isYou: isYouB } = useIsYou(duelistIdB)
  useEffect(() => {
    if (gameImpl && mounted && !duelSceneStarted && profilePicA && profilePicB && nameA && nameB) {
      gameImpl.startDuelWithPlayers(nameA, ProfileModels[profilePicA], isYouA, isYouB, nameB, ProfileModels[profilePicB])
      setDuelSceneStarted(true)
      dispatchAnimated(AnimationState.None)
    }
  }, [gameImpl, mounted, duelSceneStarted, profilePicA, profilePicB, nameA, nameB, isYouA, isYouB])

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
    healthA, healthB
  } = useAnimatedDuel(duelId, duelSceneStarted)

  const { debugMode } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  //
  // MARIO: maybe we can replace all that Animated Duel crap for this
  // when this returns anythng, it's time to animate
  //
  const duelProgress = useFinishedDuelProgress(duelId)
  // useEffect(() => { if (duelProgress) console.log(`DUEL PROGRESS:`, duelProgress) }, [duelProgress])
  const { aspectWidth } = useGameAspect()

  if (!duelSceneStarted) return <></>

  return (
    <>
      <div>
        <DuelProgress 
          isA
          name={nameA}
          duelId={duelId}
          duelStage={duelStage}
          duelistId={duelistIdA}
          completedStages={completedStagesA}
          canAutoReveal={canAutoRevealA}
        />
      </div>
      <div>
        <DuelProgress
          isB
          name={nameB}
          duelId={duelId}
          duelStage={duelStage}
          duelistId={duelistIdB}
          completedStages={completedStagesB}
          canAutoReveal={canAutoRevealB}
        />
      </div>
      <Cards duelId={duelId}/>
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div className='TavernWager' data-contentlength={Math.floor(quote.length / 10)}>{`"${quote}"`}</div>
        <div className='TavernTable' data-contentlength={Math.floor(description.length / 10)}>{description}</div>
        {value > 0 &&
          <div style={{ position: 'absolute', top: '25%', left: '10%', width: aspectWidth(4), height: 'auto' }}>
            <Image src='/images/ui/wager_bag.png'/>
          </div>
        }
      </div>

      {(isFinished && animated == AnimationState.Finished) &&  /*TODO add a modal? or something where the winner and wager will be displayed!  */
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
        </Segment>
      }

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile floated='left' duelistId={duelistIdA} damage={healthA} />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile floated='left' duelistId={duelistIdA} damage={healthA} />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag' >
          <DuelProfile floated='right' duelistId={duelistIdB} damage={healthB} />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag' >
          <DuelistProfile floated='right' duelistId={duelistIdB} damage={healthB} />
        </div>
      </div>

      {duelProgress &&
        <div className='CenteredPanel'>
          <pre className='Code FillParent Scroller NoMargin'>
            {serialize(duelProgress, 2)}
          </pre>
        </div>
      }

      <MenuDuel duelStage={duelStage} duelId={duelId} tableId={tableId} />

      <DojoSetupErrorDetector />

      {debugMode && <MenuDebugAnimations />}
    </>
  )
}

function DuelProfile({
  duelistId,
  floated,
  damage,
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  damage: number
}) {
  const { profilePic, name, nameDisplay } = useDuelist(duelistId)
  const { owner } = useDuelistOwner(duelistId)
  const { aspectWidth } = useGameAspect()

  const contentLength = useMemo(() => Math.floor(nameDisplay.length/10), [nameDisplay])

  return (
    <>
      {floated == 'left' &&
        <>
          <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag' />
          <Image className='NoMouse NoDrag' src='/images/ui/player_profile.png' style={{ position: 'absolute' }} />
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), left: aspectWidth(8.3) }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><AddressShort copyLink={floated} address={owner} small/></div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div className='NoMouse NoDrag' style={{ zIndex: 10, position: 'absolute', top: aspectWidth(0.2), right: aspectWidth(8.3), display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><AddressShort copyLink={floated} address={owner} small/></div>
          </div>
          <ProfilePic circle profilePic={profilePic} className='NoMouse NoDrag'/>
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/player_profile.png' style={{ position: 'absolute' }} />
        </>
      }
    </>
  )
}

function DuelistProfile({
  duelistId,
  floated,
  damage,
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  damage: number
}) {
  const { profilePic, score } = useDuelist(duelistId)
  const { aspectWidth } = useGameAspect()

  const [archetypeImage, setArchetypeImage] = useState<string>()

  useEffect(() => {
    // let imageName = 'duelist_' + ProfileModels[profilePic].toLowerCase() + '_' + ArchetypeNames[score.archetype].toLowerCase()
    let imageName = 'duelist_female_' + (ArchetypeNames[score.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[score.archetype].toLowerCase())
    setArchetypeImage('/images/' + imageName + '.png')
  }, [score])

  return (
    <>
      <div className='DuelistHonourProgress NoMouse NoDrag' data-floated={floated}>
        <CircularProgressbar minValue={0} maxValue={10} circleRatio={10/15}  value={score.honour} strokeWidth={7} styles={buildStyles({ 
          pathColor: `#efc258`,
          trailColor: '#4c3926',
          strokeLinecap: 'butt',
          rotation: 0.6666666 })}/>
      </div>
      {floated == 'left' &&
        <>
          <ProfilePic className='NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{score.honourAndTotal}</div>
          </div>
          <DuelistPistol damage={damage} floated={floated} />
          <Image className='NoMouse NoDrag' src='/images/ui/duelist_profile.png' style={{ position: 'absolute' }} />
        </>
      }
      {floated == 'right' &&
        <>
          <ProfilePic className='FlipHorizontal NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{score.honourAndTotal}</div>
          </div>
          <DuelistPistol damage={damage} floated={floated} />
          <Image className='FlipHorizontal NoMouse NoDrag' src='/images/ui/duelist_profile.png' style={{ position: 'absolute' }} />
        </>
      }
    </>
  )
}

function DuelHealthBar({
  health,
  floated,
}) {
  const { aspectWidth } = useGameAspect()
  const healthUrl = useMemo(() => {
    return '/images/ui/health/health_' + health + '.png'
  }, [health])
  return (
    <div className='NoMouse NoDrag' style={{ position: 'absolute', width: aspectWidth(17.5) }}>
      <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={healthUrl} />
    </div>
  )
}

function DuelistPistol({
  damage,
  floated,
}) {
  const { aspectWidth } = useGameAspect()
  const healthUrl = useMemo(() => {
    return '/images/ui/gun/gun_damage_' + Math.min(damage, 4) + '.png'
  }, [damage])
  return (
    <>
      <div className='NoMouse NoDrag' style={{ position: 'absolute', width: aspectWidth(17.5), [floated == 'right' ? 'right' : 'left']: aspectWidth(8.9) }}>
        <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={'/images/ui/gun/gun_main.png'} />
      </div>
      <div className='NoMouse NoDrag' style={{ position: 'absolute', width: aspectWidth(17.5), [floated == 'right' ? 'right' : 'left']: aspectWidth(8.9) }}>
        <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={healthUrl} />
      </div>
    </>
  )
}


function DuelProgress({
  isA = false,
  isB = false,
  name,
  duelId,
  duelStage,
  duelistId,
  completedStages,
  canAutoReveal = false
}) {
  const { gameImpl } = useThreeJsContext()
  const { round1, roundNumber, challenge: { tableId } } = useDuel(duelId)
  const round1Moves = useMemo(() => (isA ? round1?.moves_a : round1?.moves_b), [isA, round1])

  const duelProgressRef = useRef(null)


  //------------------------------
  // Duelist interaction
  //
  const { isConnected } = useAccount()
  const { isYou } = useIsYou(duelistId)
  // const isTurn = useMemo(() => ((isA && turnA) || (isB && turnB)), [isA, isB, turnA, turnB])

  // Commit modal control
  const [didReveal, setDidReveal] = useState(false)
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, roundNumber, tableId, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal)


  // useEffect(() => {
  //   console.log(`COMMIT:`, duelStage, completedStages[duelStage], completedStages, round1)
  // }, [duelStage, completedStages, round1])
  // useEffect(() => { console.log(`+duelStage`) }, [duelStage])
  // useEffect(() => { console.log(`+completedStages`) }, [completedStages])
  // useEffect(() => { console.log(`+round1`) }, [round1])

  const onClick = useCallback(() => {
    if (!isConnected) console.warn(`onClickReveal: not connected!`)
    if (isYou && isConnected && completedStages[duelStage] === false) {
      if (duelStage == DuelStage.Round1Commit) {
        setCommitModalIsOpen(true)
      } else if (duelStage == DuelStage.Round1Reveal) {
        if (canReveal && !didReveal) {
          console.log(`reveal(${isA ? 'A' : 'B'}) hash:`, bigintToHex(round1Moves?.hashed ?? 0))
          setDidReveal(true)
          reveal()
        }
      }
    }
  }, [isYou, isConnected, duelStage, completedStages, canReveal])

  // auto-reveal
  useEffect(() => {
    if (canAutoReveal && canReveal) {
      onClick?.()
    }
  }, [onClick, canAutoReveal, canReveal])


  //-------------------------
  // Duel progression
  //
  useEffect(() => {
    gameImpl.updatePlayerProgress(isA, completedStages, onClick)
  }, [gameImpl, isA, completedStages, onClick])
  
  useEffect(() => {
    if (duelProgressRef.current) {
      gameImpl?.setDuelistElement(isA, duelProgressRef.current)
    }
  }, [gameImpl, duelProgressRef, isA, name]);

  const id = isA ? 'player-bubble-left' : 'player-bubble-right'

  const { canSign, sign_and_restore, hand } = useSignAndRestoreMovesFromHash(duelId, roundNumber, tableId, round1Moves?.hashed)
  // console.log(`>> SIGN MOVES:`, canSign, duelId, roundNumber, tableId, round1Moves?.hashed)

  //------------------------------
  return (
    <>
      <CommitPacesModal duelId={duelId} isOpen={roundNumber == 1 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <div id={id} className='dialog-container NoMouse NoDrag' ref={duelProgressRef}>
        <Image className='dialog-background' />
        <div className='dialog-data'>
          <div className='dialog-title'></div>
          <div className='dialog-duelist'></div>
          <div className='dialog-content'>
            <button className='dialog-button'></button>
            <div className='dialog-quote'></div>
            <div className='dialog-spinner'></div>
          </div>

          {(isYou && round1Moves?.hashed) &&
            <div className='TempRevealPanel'>
              <Button disabled={!canSign} onClick={() => sign_and_restore()}>Reveal My Cards</Button>
              <pre className='Code FillParent Scroller NoMargin'>
                {serialize(hand, ' ')}
              </pre>
            </div>
          }

        </div>
      </div>
    </>
  )
}