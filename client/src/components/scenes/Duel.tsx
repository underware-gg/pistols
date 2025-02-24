import React, { useEffect, useRef, useState } from 'react'
import { useMounted, useClientTimestamp } from '@underware_gg/pistols-sdk/utils/hooks'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useIsYou } from '/src/hooks/useIsYou'
import { useDuelProgress } from '/src/hooks/usePistolsContractCalls'
import { useSyncToActiveDuelists } from '/src/hooks/useSyncDuelist'
import { DuelStage, useAnimatedDuel } from '/src/hooks/useDuel'
import { DojoSetupErrorDetector } from '../account/ConnectionDetector'
import { EnvironmentCardsTextures } from '/src/data/cardAssets'
import { AnimationState } from '/src/three/game'
import { Action } from '/src/utils/pistols'
import { MenuDuel, MenuDuelControl } from '/src/components/Menus'
import { MenuDebugAnimations } from '/src/components/MenusDebug'
import { constants } from '@underware_gg/pistols-sdk/pistols/gen'
import { DuelistCardType } from '/src/components/cards/Cards'
import Cards, { CardsHandle, DuelistHand } from '/src/components/cards/DuelCards'
import * as Constants from '/src/data/cardConstants'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import DuelProgress from '../ui/duel/DuelProgress'
import DuelistProfile from '../ui/duel/DuelistProfile'
import DuelProfile from '../ui/duel/DuelProfile'
import DuelHeader from '../ui/duel/DuelHeader'
import DuelStateDisplay from '../ui/duel/DuelStateDispaly'
import DuelTutorialOverlay from '../ui/duel/DuelTutorialOverlay'


export type DuelistState = {
  damage: number, 
  hitChance: number, 
  health: number,
  shotPaces: number, 
  dodgePaces: number,
}

export default function Duel({
  duelId,
  tutorial = DuelTutorialLevel.NONE
} : {
  duelId: bigint,
  tutorial: DuelTutorialLevel
}) {
  const { gameImpl } = useThreeJsContext()
  const { dispatchAnimated } = useGameplayContext()
  const { dispatchSetDuel } = usePistolsContext()
  const { debugMode, duelSpeedFactor } = useSettings()
  const { clientSeconds } = useClientTimestamp(false)

  const { duelistIdA, duelistIdB, timestamp_start } = useGetChallenge(duelId)
  const { isTutorial } = useGetChallenge(duelId)

  // switch to active duelist, if owned by player
  const { isSynced } = useSyncToActiveDuelists([duelistIdA, duelistIdB])

  // guarantee to run only once when this component mounts
  const mounted = useMounted()
  const [duelSceneStarted, setDuelSceneStarted] = useState(false)
  const { name: nameA, characterType: characterTypeA } = useDuelist(duelistIdA)
  const { name: nameB, characterType: characterTypeB } = useDuelist(duelistIdB)
  const { isYou: isYouA } = useIsYou(duelistIdA)
  const { isYou: isYouB } = useIsYou(duelistIdB)

  // Animated duel is useDuel added with intermediate animation stages
  const {
    duelStage,
    completedStagesA, completedStagesB,
    canAutoRevealA, canAutoRevealB,
  } = useAnimatedDuel(duelId, duelSceneStarted)

  const [ statsA, setStatsA ] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })
  const [ statsB, setStatsB ] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })
  const [ isPlaying, setIsPlaying ] = useState(true)
  const [ triggerReset, setTriggerReset ] = useState(false)
  
  const cardRef = useRef<CardsHandle>(null)
  const hasSpawnedCardsA = useRef(false)
  const hasSpawnedCardsB = useRef(false)
  const cardRevealTimeout = useRef(null);
  
  const currentStep = useRef(0)
  const isAnimatingStepRef = useRef(false)
  const isPlayingRef = useRef(true)
  const speedRef = useRef(duelSpeedFactor)
  const hasUnmounted = useRef(false)
  const nextStepCallback = useRef(null);
  const gameAnimationTimeout = useRef(null);
  const gameBladeAnimationTimeout = useRef(null);

  const { duelProgress } = useDuelProgress(duelId)

  useEffect(() => dispatchSetDuel(duelId), [duelId])

 useEffect(() => {
    if (gameImpl && mounted && !duelSceneStarted && isSynced && nameA && nameB && characterTypeA && characterTypeB) {
      gameImpl.startDuelWithPlayers(nameA, characterTypeA, isYouA, isYouB, nameB, characterTypeB)
      setDuelSceneStarted(true)
      dispatchAnimated(AnimationState.None)
    }
  }, [gameImpl, mounted, duelSceneStarted, characterTypeA, characterTypeB, nameA, nameB, isSynced, isYouA, isYouB])

  // setup grass animation 
  useEffect(() => {
    if (clientSeconds && timestamp_start) {
      gameImpl?.setDuelTimePercentage(clientSeconds - timestamp_start)
    }
  }, [gameImpl, clientSeconds, timestamp_start])

  useEffect(() => {
    speedRef.current = duelSpeedFactor
    gameImpl?.setDuelistSpeedFactor(duelSpeedFactor)
  }, [duelSpeedFactor, gameImpl])

  //spawns cards for all duelists if they committed
  useEffect(() => {
    if (!cardRef.current) return

    setTimeout(() => {
      if(completedStagesA[DuelStage.Round1Reveal] && completedStagesB[DuelStage.Round1Reveal]) return
      if (!isYouA) {
        if (completedStagesA[DuelStage.Round1Commit] && !hasSpawnedCardsA.current) {
          hasSpawnedCardsA.current = true
          cardRef.current?.spawnCards('A', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
      if (!isYouB) {
        if (completedStagesB[DuelStage.Round1Commit] && !hasSpawnedCardsB.current) {
          hasSpawnedCardsB.current = true
          cardRef.current?.spawnCards('B', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
    }, 1000);
  }, [completedStagesA, completedStagesB, isYouA, isYouB])

  useEffect(() => {
    return () => {
      hasUnmounted.current = true
    }
  }, [])
  
  useEffect(() => {
    if (duelProgress) {

      resetEverything()

      const envCardsList = duelProgress.steps.reduce((acc, step) => {
        if (step.card_env !== constants.EnvCard.None) {
          acc.push(EnvironmentCardsTextures[step.card_env]);
        }
        return acc;
      }, []);
      
      cardRef.current?.setAllEnvCards(envCardsList)

      setTimeout(() => {
        cardRef.current?.spawnCards('A', { fire: duelProgress.hand_a.card_fire, dodge: duelProgress.hand_a.card_dodge, blade: duelProgress.hand_a.card_blades, tactics: duelProgress.hand_a.card_tactics })
        cardRef.current?.spawnCards('B', { fire: duelProgress.hand_b.card_fire, dodge: duelProgress.hand_b.card_dodge, blade: duelProgress.hand_b.card_blades, tactics: duelProgress.hand_b.card_tactics })
      }, tutorial === DuelTutorialLevel.NONE ? 1500 : 0)

      setTimeout(() => {
        const step = duelProgress.steps[currentStep.current]

        setStatsA((prevValue) => {
          return { 
            damage: Number(step.state_a.damage),
            hitChance: Number(step.state_a.chances),
            health: Number(step.state_a.health),
            shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_a.fire ? currentStep.current : undefined),
            dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_a.dodge ? currentStep.current : undefined),
          }
        })
        setStatsB((prevValue) => {
          return { 
            damage: Number(step.state_b.damage),
            hitChance: Number(step.state_b.chances),
            health: Number(step.state_b.health),
            shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (step.card_b.fire ? currentStep.current : undefined),
            dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (step.card_b.dodge ? currentStep.current : undefined),
          }
        })
      }, tutorial === DuelTutorialLevel.NONE ? 2500 : 500);

      setTimeout(() => {
        gameImpl?.hideDialogs()

        cardRef.current?.revealCard("A", DuelistCardType.TACTICS, speedRef.current)
        cardRef.current?.revealCard("B", DuelistCardType.TACTICS, speedRef.current)

        if (isPlayingRef.current) {
          nextStepCallback.current = setTimeout(() => {
            playStep()
          }, tutorial === DuelTutorialLevel.NONE ? (Constants.BASE_CARD_REVEAL_DURATION * 1.2) / speedRef.current : 200)
        }
      }, tutorial === DuelTutorialLevel.NONE ? 4000 : 1000)
    }

    return () => {
        hasUnmounted.current = true
    };
  }, [duelProgress, triggerReset, tutorial])

  const playStep = () => {
    currentStep.current += 1

    const step = duelProgress.steps[currentStep.current]

    if (!step) return

    isAnimatingStepRef.current = true

    if (step.card_env != constants.EnvCard.None) cardRef.current?.drawNextCard(speedRef.current)

    let shouldDoblePause = false

    let revealCardsA = [];
    let revealCardsB = [];
    
    // Reveal all cards in hand A
    if (step.card_a.fire) {
      shouldDoblePause = true;
      revealCardsA.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_a.dodge) {
      shouldDoblePause = true;
      revealCardsA.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_a.blades) {
      revealCardsA.push({ type: DuelistCardType.BLADE, delay: 1000 });
    }

    // Reveal all cards in hand B
    if (step.card_b.fire) {
      shouldDoblePause = true;
      revealCardsB.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_b.dodge) {
      shouldDoblePause = true;
      revealCardsB.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
    }
    if (step.card_b.blades) {
      revealCardsB.push({ type: DuelistCardType.BLADE, delay: 1000 });
    }

    cardRevealTimeout.current = setTimeout(() => {
      revealCardsA.forEach(card => cardRef.current?.revealCard("A", card.type, speedRef.current, step.state_a.health > 0));
      revealCardsB.forEach(card => cardRef.current?.revealCard("B", card.type, speedRef.current, step.state_b.health > 0));
    }, Math.max(...[...revealCardsA, ...revealCardsB].map(card => card.delay || 0), 0) / speedRef.current);

    let newStatsA: DuelistState;
    let newStatsB: DuelistState;

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

    if (currentStep.current > 1 && step.card_env == constants.EnvCard.None) {
      gameBladeAnimationTimeout.current = setTimeout(() => {
        gameImpl?.prepareActionAnimation()
        gameImpl?.animateDuelistBlade()
      }, 1000 / speedRef.current);
    }

    const timeDelay = Constants.DRAW_CARD_BASE_DURATION + 200 + (shouldDoblePause ? (Constants.BASE_CARD_REVEAL_DURATION + 200) : 200)
    const timeDelayNextStep = timeDelay + (shouldDoblePause ? 1400 : 1000)

    gameAnimationTimeout.current = setTimeout(() => {
      cardRef.current?.updateDuelistData(newStatsA?.damage, newStatsB?.damage, newStatsA?.hitChance, newStatsB?.hitChance)
      if (step.card_env != constants.EnvCard.None) {
        gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
      } else {
        gameImpl?.animateActions(Action[step.card_a.blades], Action[step.card_b.blades], newStatsA?.health, newStatsB?.health)
      }
    }, step.card_env != constants.EnvCard.None ? (timeDelay / speedRef.current) : 3000 / speedRef.current);

    if (currentStep.current < duelProgress.steps.length && isPlayingRef.current) {
      nextStepCallback.current = setTimeout(() => {
        if (hasUnmounted.current) {
          resetEverything()
        } else {
          playStep()
        }
      }, timeDelayNextStep / speedRef.current)
    }
    setTimeout(() => {
      isAnimatingStepRef.current = false
    }, timeDelayNextStep / speedRef.current) 
  }

  const resetStep = () => {
    clearTimeout(nextStepCallback.current)
    clearTimeout(cardRevealTimeout.current)
    clearTimeout(gameBladeAnimationTimeout.current)
    clearTimeout(gameAnimationTimeout.current)
  }

  const resetDuel = () => {
    resetStep()
    resetEverything()
    cardRef.current?.resetCards()
    gameImpl?.resetDuelScene(false)
    
    setTimeout(() => {
      setTriggerReset(!triggerReset)
    }, 1200);
  }

  const resetEverything = () => {
    setStatsA((prevValue) => {
        return { 
          damage: 0,
          hitChance: 0,
          health: 3,
          shotPaces: undefined,
          dodgePaces: undefined,
        }
      })
      setStatsB((prevValue) => {
        return { 
          damage: 0,
          hitChance: 0,
          health: 3,
          shotPaces: undefined,
          dodgePaces: undefined,
        }
      })
    
    currentStep.current = 0
    hasSpawnedCardsA.current = false
    hasSpawnedCardsB.current = false
    hasUnmounted.current = false

    nextStepCallback.current = null
    cardRevealTimeout.current = null
    gameBladeAnimationTimeout.current = null
    gameAnimationTimeout.current = null
  }

  if (!duelSceneStarted) return <></>

  return (
    <>
      <DuelProgress 
        isA
        name={nameA}
        duelId={duelId}
        duelStage={duelStage}
        duelistId={duelistIdA}
        completedStages={completedStagesA}
        canAutoReveal={canAutoRevealA}
        isYou={isYouA}
        revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('A', cards)}
      />
      <DuelProgress
        isB
        name={nameB}
        duelId={duelId}
        duelStage={duelStage}
        duelistId={duelistIdB}
        completedStages={completedStagesB}
        canAutoReveal={canAutoRevealB}
        isYou={isYouB}
        revealCards={(cards: DuelistHand) => cardRef.current?.spawnCards('B', cards)}
      />

      <Cards duelId={duelId} ref={cardRef} tutorialLevel={tutorial} />
      
      <DuelHeader duelId={duelId} tutorialLevel={tutorial} />

      <DuelStateDisplay duelId={duelId} />

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile floated='left' duelistId={duelistIdA} />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile floated='left' duelistId={duelistIdA} damage={statsA.damage} hitChance={statsA.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag' >
          <DuelProfile floated='right' duelistId={duelistIdB} />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag' >
          <DuelistProfile floated='right' duelistId={duelistIdB} damage={statsB.damage} hitChance={statsB.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
        </div>
      </div>

      {isTutorial && <DuelTutorialOverlay tutorialType={tutorial} isOpen={tutorial != DuelTutorialLevel.NONE} setIsOpen={() => {}} />}

      {/* {duelProgress &&
        <div className='CenteredPanel'>
          <pre className='Code FillParent Scroller NoMargin'>
            {serialize(duelProgress, 2)}
          </pre>
        </div>
      } */}

      <MenuDuel duelId={duelId} />
      <MenuDuelControl 
        clickPlay={() => {
          isPlayingRef.current = !isPlayingRef.current
          setIsPlaying(isPlayingRef.current)
          if (isPlayingRef.current) {
            playStep()
          }
        }} 
        clickStep={() => {
          if (!isAnimatingStepRef.current) {
            playStep()
          }
        }} 
        clickReset={() => {
          resetDuel()
        }} 
        isPlaying={isPlaying} />

      <DojoSetupErrorDetector />

      {debugMode && <MenuDebugAnimations />}
    </>
  )
}

//TODO on page refresh in duel, automatically pause duel and instead of the ready button call start button so sounds are enabled + duel starts properly
//TODO on refresh add a black overlay or round overlay with brown background that is shown and animated untill the assets are loaded and duel can be started!
//TODO on duel end add rechallenge option!