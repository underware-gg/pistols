import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, SemanticFLOATS, Image } from 'semantic-ui-react'
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
import { bigintToHex } from '@/lib/utils/types'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useDuelistOwner } from '../hooks/useTokenDuelist'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import 'react-circular-progressbar/dist/styles.css';


const Row = Grid.Row
const Col = Grid.Column

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
  const { isYou: isYouA} = useIsYou(duelistIdA)
  const { isYou: isYouB} = useIsYou(duelistIdB)
  useEffect(() => {
    console.log(isYouA, isYouB, value)
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

  if (!duelSceneStarted) return <></>

  return (
    <>
      <div className='TavernBoard' style={{ backgroundImage: 'url(/images/ui/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={Math.floor((quote.length + 2) / 10)}>{`“${quote}”`}</div>
        {value > 0 ? /*TODO IF no wager center the TavernTitle? Or display that there is no wager? */
          // <div className='TavernWager' data-contentlength={Math.floor(`Wager: ${value} $LORDS`.length / 10)}>Wager: {value.toString()} $LORDS</div>
          <div className='TavernWager' data-contentlength={Math.floor(`Wager: ${value} $LORDS`.length / 10)}>Wager: <Balance clean wei={value}/> $LORDS</div>
          :
          <div className='TavernWager' data-contentlength={Math.floor(`Wager: ${value} $LORDS`.length / 10)}>Wager: - $LORDS</div>
        }
        <div className='TavernTable' data-contentlength={Math.floor(description.length / 10)}>{description}</div>
        {value > 0 &&
          <div style={{ position: 'absolute', top: '25%', left: '10%', width: '4vw', height: 'auto' }}>
            <Image src='/images/ui/wager_bag.png'/>
          </div>
        }
      </div>

      {(isFinished && animated == AnimationState.Finished) &&  /*TODO add a modal? or something where the winner and wager will be displayed!  */
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: '1.3vw' }}>{challengeDescription}</h3>
        </Segment>
      }

      <div>
        <div className='DuelProfileA'>
          <DuelProfile floated='left' duelistId={duelistIdA} health={healthA} />
        </div>
        <div className='DuelistProfileA'>
          <DuelistProfile floated='left' duelistId={duelistIdA} health={healthA} />
        </div>
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
        <div className='DuelProfileB' >
          <DuelProfile floated='right' duelistId={duelistIdB} health={healthB} />
        </div>
        <div className='DuelistProfileB' >
          <DuelistProfile floated='right' duelistId={duelistIdB} health={healthB} />
        </div>
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
  const { profilePic, name, nameDisplay } = useDuelist(duelistId)
  const { owner } = useDuelistOwner(duelistId)

  const contentLength = Math.floor(nameDisplay.length/10)

  return (
    <>
      {floated == 'left' &&
        <>
          <ProfilePic circle profilePic={profilePic}  />
          <Image src='/images/ui/player_profile.png' style={{ position: 'absolute', width: '25vw', pointerEvents: 'none' }} />
          <div style={{ zIndex: 10, position: 'absolute', left: '7.3vw' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><AddressShort copyLink={floated} address={owner} small/></div>
          </div>
        </>
      }
      {floated == 'right' &&
        <>
          <div style={{ zIndex: 10, position: 'absolute', right: '7.3vw', display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
            <div className='NoMargin ProfileName' data-contentlength={contentLength}>{nameDisplay}</div>
            <div className='NoMargin ProfileAddress'><AddressShort copyLink={floated} address={owner} small/></div>
          </div>
          <ProfilePic circle profilePic={profilePic} />
          <Image className='FlipHorizontal' src='/images/ui/player_profile.png' style={{ position: 'absolute', width: '25vw', pointerEvents: 'none' }} />
        </>
      }
    </>
  )
}

function DuelistProfile({
  duelistId,
  floated,
  health,
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  health: number
}) {
  const { profilePic, score } = useDuelist(duelistId)

  const [archetypeImage, setArchetypeImage] = useState<string>()

  useEffect(() => {
    // let imageName = 'duelist_' + ProfileModels[profilePic].toLowerCase() + '_' + ArchetypeNames[score.archetype].toLowerCase()
    let imageName = 'duelist_female_' + (ArchetypeNames[score.archetype].toLowerCase() == 'undefined' ? 'honourable' : ArchetypeNames[score.archetype].toLowerCase())
    setArchetypeImage('/images/' + imageName + '.png')
  }, [score])

  return (
    <>
      <div className='DuelistHonourProgress' data-floated={floated}>
        <CircularProgressbar minValue={0} maxValue={10} circleRatio={10/15}  value={score.honour} strokeWidth={7} styles={buildStyles({ 
          pathColor: `#efc258`,
          trailColor: '#4c3926',
          strokeLinecap: 'butt',
          rotation: 0.6666666 })}/>
      </div>
      {floated == 'left' &&
        <>
          <ProfilePic duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour' data-floated={floated}>
            <div style={{ fontSize: '1vw', fontWeight: 'bold', color: '#25150b' }}>{score.honourAndTotal}</div>
          </div>
          <DuelHealthBar health={health} floated={floated} />
          <Image src='/images/ui/duelist_profile.png' style={{ position: 'absolute', width: '25vw', pointerEvents: 'none' }} />
        </>
      }
      {floated == 'right' &&
        <>
          <ProfilePic className='FlipHorizontal' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour' data-floated={floated}>
            <div style={{ fontSize: '1vw', fontWeight: 'bold', color: '#25150b' }}>{score.honourAndTotal}</div>
          </div>
          <DuelHealthBar health={health} floated={floated} />
          <Image className='FlipHorizontal' src='/images/ui/duelist_profile.png' style={{ position: 'absolute', width: '25vw', pointerEvents: 'none' }} />
        </>
      }
    </>
  )
}

function DuelHealthBar({
  health,
  floated,
}) {
  const healthUrl = useMemo(() => {
    return '/images/ui/health/health_' + health + '.png'
  }, [health])
  return (
    <div style={{ position: 'absolute', width: '17.5vw' }}>
      <Image className={ floated == 'right' ? 'FlipHorizontal' : ''} src={healthUrl} />
    </div>
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

  //------------------------------
  return (
    <>
      <CommitPacesModal duelId={duelId} isOpen={roundNumber == 1 && commitModalIsOpen} setIsOpen={setCommitModalIsOpen} />
      <div id={id} className='dialog-container' ref={duelProgressRef}>
        <Image className='dialog-background' />
        <div className='dialog-data'>
          <div className='dialog-title'></div>
          <div className='dialog-duelist'></div>
          <div className='dialog-content'>
            <button className='dialog-button'></button>
            <div className='dialog-quote'></div>
            <div className='dialog-spinner'></div>
          </div>
        </div>
      </div>
    </>
  )
}