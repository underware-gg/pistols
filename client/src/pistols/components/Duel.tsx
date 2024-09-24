import 'react-circular-progressbar/dist/styles.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid, Segment, SemanticFLOATS, Image, Button } from 'semantic-ui-react'
import { BigNumberish, num } from 'starknet'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@/lib/utils/hooks/useMounted'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { useSettings } from '@/pistols/hooks/SettingsContext'
import { useChallenge, useChallengeDescription } from '@/pistols/hooks/useChallenge'
import { useDuelProgress, useFinishedDuelProgress } from '@/pistols/hooks/useContractCalls'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useTable } from '@/pistols/hooks/useTable'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '@/pistols/hooks/useRevealAction'
import { useIsYou } from '@/pistols/hooks/useIsYou'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { ProfileModels } from '@/pistols/data/assets'
import { AnimationState } from '@/pistols/three/game'
import { ArchetypeNames } from '@/pistols/utils/pistols'
import { MenuDebugAnimations, MenuDuel } from '@/pistols/components/Menus'
import { bigintToHex, serialize } from '@/lib/utils/types'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useDuelistOwner } from '../hooks/useTokenDuelist'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import 'react-circular-progressbar/dist/styles.css';
import Cards, { CardsHandle, DuelistCardType } from './Cards'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { BladesCard, PacesCard, TacticsCard } from '@/games/pistols/generated/constants';
import { clearTimeout } from 'timers';

export type DuelistState = {
  damage: number, 
  hitChance: number, 
  health: number,
  shotPaces: number, 
  dodgePaces: number
}

export default function Duel({
  duelId
}) {
  const { gameImpl } = useThreeJsContext()
  const { animated, dispatchAnimated } = useGameplayContext()

  const { challengeDescription } = useChallengeDescription(duelId)
  const { tableId, isFinished, quote, duelistIdA, duelistIdB, timestamp_start } = useChallenge(duelId)
  const { description } = useTable(tableId)

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

  const [statsA, setStatsA] = useState<DuelistState>({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })
  const [statsB, setStatsB] = useState<DuelistState>({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })

  const { debugMode } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  const [ isPlaying, setIsPlaying ] = useState(true)
  
  const cardRef = useRef<CardsHandle>(null)
  const playButtonRef = useRef(null)
  const currentStep = useRef(0)

  let nextStepCallback;

  //
  // MARIO: maybe we can replace all that Animated Duel crap for this
  // when this returns anythng, it's time to animate
  //

  //TODO use this to subscribe to duelist hands and spawn them when needed
  // const duelProgress2 = useDuelProgress(duelId)
  // useEffect(() => {
  //   if (duelProgress2) {
  //     console.log("PROGRESS: ", duelProgress2)

  //   }
  // }, [duelProgress2])

  //TODO maybe reset the cards here? If not here then it must be once we exit or enter this scene!!
  const duelProgress = useFinishedDuelProgress(duelId)
  useEffect(() => {
    if (duelProgress) {
      //TODO cards should be spawned already so only steps are needed
      //1. make a loop that calls each step after 1400 ms
      //2. if is play call the loop if is pause dont call, on click of play resume if its in progress
      //3. for each step call game.playstep (animations to play)
      //4. for each step call cards.reveal cards env and if theres a reveal in the cards of the player
      //5. handle aftermath of all animations?

      clearTimeout(nextStepCallback)
      currentStep.current = 0
      cardRef.current.resetCards()
      gameImpl?.resetDuelScene()

      setTimeout(() => {
        cardRef.current.spawnCards('A', { fire: PacesCard.Paces10, dodge: PacesCard.Paces10, blade: BladesCard.Behead, tactics: TacticsCard.CoinToss })
        cardRef.current.spawnCards('B', { fire: PacesCard.Paces10, dodge: PacesCard.Paces10, blade: BladesCard.Behead, tactics: TacticsCard.CoinToss })

        setTimeout(() => {
          cardRef.current.revealCard("A", DuelistCardType.TACTICS)
          cardRef.current.revealCard("B", DuelistCardType.TACTICS)
        }, 2000)

        if (isPlaying) {
          setTimeout(() => {
            playStep()
          }, 3000)
        }
      }, 5000)
    }
  }, [duelProgress])

  // useEffect(() => {
  //   console.log("HERE - play")
  //   clearTimeout(nextStepCallback)
  //   if (isPlaying) {
  //     if (duelProgress && currentStep.current < duelProgress.steps?.length) {
  //       playStep()
  //     }
  //   }
  // }, [isPlaying])
  
  const { aspectWidth } = useGameAspect()

  const playStep = () => {
    currentStep.current += 1

    const step = duelProgress.steps[currentStep.current]

    if (!step) return

    cardRef.current.drawNextCard(step.card_env)

    let shouldDoblePause = false

        // Reveal all cards in hand A
    if (step.card_a.fire) {
      cardRef.current.revealCard("A", DuelistCardType.FIRE)
      shouldDoblePause = true
    }
    if (step.card_a.dodge) {
      cardRef.current.revealCard("A", DuelistCardType.DODGE)
      shouldDoblePause = true
    }
    if (step.card_a.blades) {
      cardRef.current.revealCard("A", DuelistCardType.BLADE)
    }

    // Reveal all cards in hand B
    if (step.card_b.fire) {
      cardRef.current.revealCard("B", DuelistCardType.FIRE)
      shouldDoblePause = true
    }
    if (step.card_b.dodge) {
      cardRef.current.revealCard("B", DuelistCardType.DODGE)
      shouldDoblePause = true
    }
    if (step.card_b.blades) {
      cardRef.current.revealCard("B", DuelistCardType.BLADE)
    }

    const newStatsA = { 
      damage: Number(step.state_a.damage),
      hitChance: Number(step.state_a.chances),
      health: Number(step.state_a.health),
      shotPaces: statsA.shotPaces ? statsA.shotPaces : (step.card_a.fire ? currentStep.current : undefined),
      dodgePaces: statsA.dodgePaces ? statsA.dodgePaces : (step.card_a.dodge ? currentStep.current : undefined),
    }

    const newStatsB = { 
      damage: Number(step.state_b.damage),
      hitChance: Number(step.state_b.chances),
      health: Number(step.state_b.health),
      shotPaces: statsB.shotPaces ? statsB.shotPaces : (step.card_b.fire ? currentStep.current : undefined),
      dodgePaces: statsB.dodgePaces ? statsB.dodgePaces : (step.card_b.dodge ? currentStep.current : undefined),
    }

    setTimeout(() => {
      cardRef.current.updateDuelistData(newStatsA.damage, newStatsB.damage, newStatsA.hitChance, newStatsB.hitChance)
      gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
    }, 1000);

    setStatsA(newStatsA)
    setStatsB(newStatsB)

    if (currentStep.current < duelProgress.steps.length && isPlaying) {
      nextStepCallback = setTimeout(() => {
        playStep()
      }, shouldDoblePause ? 3000 : 2000)
    }
  }

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
      <Cards duelId={duelId} ref={cardRef} />
      <div className='TavernBoard NoMouse NoDrag' style={{ backgroundImage: 'url(/images/ui/wager_main.png)', backgroundSize: '100% 100%' }}>
        <div className='TavernTitle' data-contentlength={1}>Settling the matter of:</div>
        <div className='TavernWager' data-contentlength={Math.floor(quote.length / 10)}>{`"${quote}"`}</div>
        <div className='TavernTable' data-contentlength={Math.floor(description.length / 10)}>{description}</div>
      </div>

      {(isFinished && animated == AnimationState.Finished) &&  /*TODO add a modal? or something where the winner and wager will be displayed!  */
        <Segment style={{ position: 'absolute', top: '50%' }}>
          <h3 className='Important' style={{ fontSize: aspectWidth(1.3) }}>{challengeDescription}</h3>
        </Segment>
      }

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile floated='left' duelistId={duelistIdA} />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile floated='left' duelistId={duelistIdA} damage={statsA.damage} hitChance={statsA.hitChance} />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag' >
          <DuelProfile floated='right' duelistId={duelistIdB} />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag' >
          <DuelistProfile floated='right' duelistId={duelistIdB} damage={statsB.damage} hitChance={statsB.hitChance} />
        </div>
      </div>

      {/* {duelProgress &&
        <div className='CenteredPanel'>
          <pre className='Code FillParent Scroller NoMargin'>
            {serialize(duelProgress, 2)}
          </pre>
        </div>
      } */}

      <MenuDuel duelStage={duelStage} duelId={duelId} tableId={tableId} />

      <DojoSetupErrorDetector />

      {debugMode && <MenuDebugAnimations />}
    </>
  )
}

function DuelProfile({
  duelistId,
  floated
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
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
  hitChance
}: {
  duelistId: BigNumberish,
  floated: SemanticFLOATS
  damage: number
  hitChance: number
}) {
  const { score } = useDuelist(duelistId)
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
        <CircularProgressbar minValue={0} maxValue={100} circleRatio={10/15}  value={hitChance} strokeWidth={7} styles={buildStyles({ 
          pathColor: `#efc258`,
          trailColor: '#4c3926',
          strokeLinecap: 'butt',
          rotation: 0.6666666 })}/>
      </div>
      {floated == 'left' &&
        <>
          <ProfilePic className='NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{hitChance + "%"}</div>
          </div>
          <DuelistPistol damage={damage} floated={floated} />
          <Image className='NoMouse NoDrag' src='/images/ui/duelist_profile.png' style={{ position: 'absolute' }} />
        </>
      }
      {floated == 'right' &&
        <>
          <ProfilePic className='FlipHorizontal NoMouse NoDrag' duel profilePicUrl={archetypeImage} />
          <div className='DuelistHonour NoMouse NoDrag' data-floated={floated}>
            <div style={{ fontSize: aspectWidth(1), fontWeight: 'bold', color: '#25150b' }}>{hitChance + "%"}</div>
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