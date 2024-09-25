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
import { useFinishedDuelProgress } from '@/pistols/hooks/useContractCalls'
import { useDuelist } from '@/pistols/hooks/useDuelist'
import { useTable } from '@/pistols/hooks/useTable'
import { useRevealAction, useSignAndRestoreMovesFromHash } from '@/pistols/hooks/useRevealAction'
import { useIsYou } from '@/pistols/hooks/useIsYou'
import { useClientTimestamp } from '@/lib/utils/hooks/useTimestamp'
import { DojoSetupErrorDetector } from '@/pistols/components/account/ConnectionDetector'
import { DuelStage, useAnimatedDuel, useDuel } from '@/pistols/hooks/useDuel'
import { ProfilePic } from '@/pistols/components/account/ProfilePic'
import { EnvironmentCardsTextures, ProfileModels } from '@/pistols/data/assets'
import { AnimationState } from '@/pistols/three/game'
import { Action, ArchetypeNames } from '@/pistols/utils/pistols'
import { MenuDebugAnimations, MenuDuel } from '@/pistols/components/Menus'
import { bigintToHex } from '@/lib/utils/types'
import { AddressShort } from '@/lib/ui/AddressShort'
import { useDuelistOwner } from '../hooks/useTokenDuelist'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import CommitPacesModal from '@/pistols/components/CommitPacesModal'
import 'react-circular-progressbar/dist/styles.css';
import Cards, { CardsHandle, DuelistCardType, DuelistHand } from './Cards'
import useGameAspect from '@/pistols/hooks/useGameApect'
import { BladesCard, EnvCard, PacesCard, TacticsCard } from '@/games/pistols/generated/constants';
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
  } = useAnimatedDuel(duelId, duelSceneStarted)

  const { debugMode } = useSettings()
  const { dispatchSelectDuel } = usePistolsContext()

  useEffect(() => dispatchSelectDuel(duelId), [duelId])

  const [statsA, setStatsA] = useState<DuelistState>({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })
  const [statsB, setStatsB] = useState<DuelistState>({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })

  const [ isPlaying, setIsPlaying ] = useState(true)
  
  const cardRef = useRef<CardsHandle>(null)
  const playButtonRef = useRef(null)
  const currentStep = useRef(0)

  const hasSpawnedCardsA = useRef(false)
  const hasSpawnedCardsB = useRef(false)
  const hasUnmounted = useRef(false)

  //spawns cards for all duelists if they commited
  useEffect(() => {
    if (!cardRef.current) return

    setTimeout(() => {
      if (!isYouA) {
        if (completedStagesA[DuelStage.Round1Commit] && !hasSpawnedCardsA.current) {
          hasSpawnedCardsA.current = true
          cardRef.current?.spawnCards('A', { fire: PacesCard.None, dodge: PacesCard.None, blade: BladesCard.None, tactics: TacticsCard.None })
        }
      }
      if (!isYouB) {
        if (completedStagesB[DuelStage.Round1Commit] && !hasSpawnedCardsB.current) {
          hasSpawnedCardsB.current = true
          cardRef.current?.spawnCards('B', { fire: PacesCard.None, dodge: PacesCard.None, blade: BladesCard.None, tactics: TacticsCard.None })
        }
      }
    }, 1000);
  }, [completedStagesA, completedStagesB, isYouA, isYouB])

  //
  // MARIO: maybe we can replace all that Animated Duel crap for this
  // when this returns anythng, it's time to animate
  //

  const duelProgress = useFinishedDuelProgress(duelId)

  useEffect(() => {
    return () => {
      hasUnmounted.current = true
    }
  }, [])
  
  useEffect(() => {
    if (duelProgress) {

      resetEverything()

      const envCardsList = duelProgress.steps.reduce((acc, step) => {
        if (step.card_env !== EnvCard.None) {
          acc.push(EnvironmentCardsTextures[step.card_env]);
        }
        return acc;
      }, []);
      
      cardRef.current?.setAllEnvCards(envCardsList)

      setTimeout(() => {
        gameImpl?.hideDialogs()

        cardRef.current?.spawnCards('A', { fire: duelProgress.hand_a.card_fire, dodge: duelProgress.hand_a.card_dodge, blade: duelProgress.hand_a.card_blades, tactics: duelProgress.hand_a.card_tactics })
        cardRef.current?.spawnCards('B', { fire: duelProgress.hand_b.card_fire, dodge: duelProgress.hand_b.card_dodge, blade: duelProgress.hand_b.card_blades, tactics: duelProgress.hand_b.card_tactics })

        cardRef.current?.revealCard("A", DuelistCardType.TACTICS)
        cardRef.current?.revealCard("B", DuelistCardType.TACTICS)

        if (isPlaying) {
          setTimeout(() => {
            playStep()
          }, 1500)
        }
      }, 4000)
    }

    return () => {
        hasUnmounted.current = true
    };
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

    if (step.card_env != EnvCard.None) cardRef.current?.drawNextCard()

    let shouldDoblePause = false

    // Reveal all cards in hand A
    if (step.card_a.fire) {
      shouldDoblePause = true
      setTimeout(() => {
        cardRef.current?.revealCard("A", DuelistCardType.FIRE)
      }, 1200);
    }
    if (step.card_a.dodge) {
      shouldDoblePause = true
      setTimeout(() => {
        cardRef.current?.revealCard("A", DuelistCardType.DODGE)
      }, 1200);
    }
    if (step.card_a.blades) {
      setTimeout(() => {
        cardRef.current?.revealCard("A", DuelistCardType.BLADE)
      }, 2000);
    }

    // Reveal all cards in hand B
    if (step.card_b.fire) {
      shouldDoblePause = true
      setTimeout(() => {
        cardRef.current?.revealCard("B", DuelistCardType.FIRE)
      }, 1200);
    }
    if (step.card_b.dodge) {
      shouldDoblePause = true
      setTimeout(() => {
        cardRef.current?.revealCard("B", DuelistCardType.DODGE)
      }, 1200);
    }
    if (step.card_b.blades) {
      setTimeout(() => {
        cardRef.current?.revealCard("B", DuelistCardType.BLADE)
      }, 2000);
    }

    let newStatsA;
    let newStatsB;

    setStatsA((prevValue) => {
      newStatsA = { 
        damage: Number(step.state_a.damage),
        hitChance: Number(step.state_a.chances),
        health: Number(step.state_a.health),
        shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_a.fire ? currentStep.current : undefined),
        dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_a.dodge ? currentStep.current : undefined),
      }
      return newStatsA
    })
    setStatsB((prevValue) => {
      newStatsB = { 
        damage: Number(step.state_b.damage),
        hitChance: Number(step.state_b.chances),
        health: Number(step.state_b.health),
        shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_b.fire ? currentStep.current : undefined),
        dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_b.dodge ? currentStep.current : undefined),
      }
      return newStatsB
    })

    if (currentStep.current > 1 && step.card_env == EnvCard.None) {
      setTimeout(() => {
        gameImpl?.prepareActionAnimation()
        gameImpl?.animateDuelistBlade()
      }, 2000);
    }

    setTimeout(() => {
      cardRef.current?.updateDuelistData(newStatsA?.damage, newStatsB?.damage, newStatsA?.hitChance, newStatsB?.hitChance)
      if (step.card_env != EnvCard.None) {
        gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
      } else {
        gameImpl?.animateActions(Action[step.card_a.blades], Action[step.card_b.blades], newStatsA?.health, newStatsB?.health)
      }
    }, shouldDoblePause ? 2000 : 1000);

    if (currentStep.current < duelProgress.steps.length && isPlaying) {
      setTimeout(() => {
        if (hasUnmounted.current) {
          resetEverything()
        } else {
          playStep()
        }
      }, shouldDoblePause ? 3400 : 2000)
    }
  }

  const resetEverything = () => {
    currentStep.current = 0
    hasSpawnedCardsA.current = false
    hasSpawnedCardsB.current = false
    hasUnmounted.current = false
    setStatsA({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })
    setStatsB({ damage: 1, hitChance: 50, health: 3, shotPaces: undefined, dodgePaces: undefined })
    //cardRef.current?.resetCards()
    //gameImpl?.resetDuelScene() //TODO make a new reset function that resets only the necessary stuff for already in game duel
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
          revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('A', cards)}
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
          revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('B', cards)}
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
  revealCards,
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

  // Commit modal control
  const [didReveal, setDidReveal] = useState(false)
  const [commitModalIsOpen, setCommitModalIsOpen] = useState(false)
  const { reveal, canReveal } = useRevealAction(duelId, roundNumber, tableId, round1Moves?.hashed, duelStage == DuelStage.Round1Reveal)

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

  useEffect(() =>{
    if (isYou && canSign) {
      sign_and_restore()
    }
  }, [canSign, isYou])

  useEffect(() =>{
    if (isYou && hand && hand.card_fire && hand.card_dodge && hand.card_tactics && hand.card_blades) {
      setTimeout(() => {
        revealCards({
          fire: hand.card_fire,
          dodge: hand.card_dodge,
          tactics: hand.card_tactics,
          blade: hand.card_blades,
        })
      }, 1000);
    }
  }, [hand, isYou])

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
        </div>
      </div>
    </>
  )
}