import React, { useEffect, useRef, useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useMounted, useClientTimestamp, useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { usePistolsContext } from '/src/hooks/PistolsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useGameplayContext } from '/src/hooks/GameplayContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { useIsMyDuelist } from '/src/hooks/useIsYou'
import { useDuelProgress } from '/src/hooks/usePistolsContractCalls'
import { useDuelRequiresAction } from '/src/stores/eventsStore'
import { DuelStage, useAnimatedDuel } from '/src/hooks/useDuel'
import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
import { EnvironmentCardsTextures } from '/src/data/cardAssets'
import { AnimationState } from '/src/three/game'
import { Action } from '/src/utils/pistols'
import { MenuDuel, MenuDuelControl } from '/src/components/Menus'
import { MenuDebugAnimations } from '/src/components/MenusDebug'
import { constants } from '@underware/pistols-sdk/pistols/gen'
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
  const { dispatchSetDuel, tutorialOpener } = usePistolsContext()
  const { debugMode, duelSpeedFactor } = useSettings()
  const { clientSeconds } = useClientTimestamp(false)

  const { duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, timestampStart, isTutorial, timestampEnd, isAwaiting, isInProgress, isFinished  } = useGetChallenge(duelId)

  // guarantee to run only once when this component mounts
  const mounted = useMounted()
  const [duelSceneStarted, setDuelSceneStarted] = useState(false)
  const [dataSet, setDataSet] = useState(false)

  const { name: nameA, characterType: characterTypeA } = useDuelist(duelistIdA)
  const { name: nameB, characterType: characterTypeB } = useDuelist(duelistIdB)
  const isYouA = useIsMyDuelist(duelistIdA)
  const isYouB = useIsMyDuelist(duelistIdB)

  // clear required action flag
  const { account } = useAccount()
  const { game } = useDojoSystemCalls()
  const isRequired = useDuelRequiresAction(duelId)

  useEffect(() => {
    if ((isYouA || isYouB) && mounted && account && isRequired && isFinished) {
      console.log('clearing required action flag...')
      if (isYouA) game.clear_required_action(account, duelistIdA)
      if (isYouB) game.clear_required_action(account, duelistIdB)
    }
  }, [isYouA, isYouB, mounted, account, isRequired, isFinished])

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
    if (tutorial != DuelTutorialLevel.NONE && isTutorial) {
      tutorialOpener.open()
    } else {
      tutorialOpener.close()
    }
  }, [tutorial, isTutorial])

  useEffect(() => {
    if (gameImpl && mounted && !duelSceneStarted && duelistAddressA && duelistAddressB) {
      gameImpl.setDuelData(Number(duelId), Number(duelistIdA), Number(duelistIdB))
      gameImpl.resetDuelScene()
      setDuelSceneStarted(true)
      dispatchAnimated(AnimationState.None)
    }
  }, [gameImpl, mounted, duelSceneStarted, duelistAddressA, duelistAddressB])

  useEffect(() => {
    if (gameImpl && mounted && nameA && nameB && characterTypeA && characterTypeB && !dataSet) {
      gameImpl.startDuelWithPlayers(nameA, characterTypeA, isYouA, isYouB, nameB, characterTypeB)
      
      const timer = setTimeout(() => {
        setDataSet(true)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [gameImpl, mounted, characterTypeA, characterTypeB, nameA, nameB, isYouA, isYouB, dataSet])

  // setup grass animation 
  //TODO change due new timeouts...
  useEffect(() => {
    if (timestampStart && clientSeconds) {
      const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 days in seconds
      let percentage = 0;
      
      if (isAwaiting && timestampStart && timestampEnd) {
        // Challenge created but not accepted - use actual start/end time
        const timePassed = clientSeconds - timestampStart;
        const totalDuration = timestampEnd - timestampStart;
        percentage = Math.min(Math.max(timePassed / totalDuration, 0), 1);
      } else if (isFinished && timestampStart && timestampEnd) {
        // Duel completed - use actual duration capped at 7 days
        const duelLength = timestampEnd - timestampStart;
        percentage = Math.min(Math.max(duelLength / SEVEN_DAYS, 0), 1);
      } else {
        const timePassed = clientSeconds - timestampStart;
        percentage = Math.min(Math.max(timePassed / SEVEN_DAYS, 0), 1);
      }

      gameImpl?.setDuelTimePercentage(percentage);
    }
  }, [gameImpl, clientSeconds, timestampStart, timestampEnd])

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
          cardRef.current?.spawnCards('A', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
      if (!isYouB) {
        if (completedStagesB[DuelStage.Round1Commit] && !hasSpawnedCardsB.current) {
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
        if (!hasSpawnedCardsA.current) {
          hasSpawnedCardsA.current = true
          cardRef.current?.spawnCards('A', { fire: duelProgress.hand_a.card_fire, dodge: duelProgress.hand_a.card_dodge, blade: duelProgress.hand_a.card_blades, tactics: duelProgress.hand_a.card_tactics })
        }
        if (!hasSpawnedCardsB.current) {
          hasSpawnedCardsB.current = true
          cardRef.current?.spawnCards('B', { fire: duelProgress.hand_b.card_fire, dodge: duelProgress.hand_b.card_dodge, blade: duelProgress.hand_b.card_blades, tactics: duelProgress.hand_b.card_tactics })
        }
      }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 1500)

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
      }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 2500);

      setTimeout(() => {
        gameImpl?.hideDialogs()

        cardRef.current?.revealCard("A", DuelistCardType.TACTICS, speedRef.current)
        cardRef.current?.revealCard("B", DuelistCardType.TACTICS, speedRef.current)

        if (isPlayingRef.current) {
          nextStepCallback.current = setTimeout(() => {
            playStep()
          }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : (Constants.BASE_CARD_REVEAL_DURATION * 1.2) / speedRef.current)
        }
      }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 4000)
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

    if (tutorial !== DuelTutorialLevel.SIMPLE) {
      cardRevealTimeout.current = setTimeout(() => {
        revealCardsA.forEach(card => cardRef.current?.revealCard("A", card.type, speedRef.current, step.state_a.health > 0));
        revealCardsB.forEach(card => cardRef.current?.revealCard("B", card.type, speedRef.current, step.state_b.health > 0));
      }, Math.max(...[...revealCardsA, ...revealCardsB].map(card => card.delay || 0), 0) / speedRef.current);
    }

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

    if (tutorial !== DuelTutorialLevel.SIMPLE && currentStep.current > 1 && step.card_env == constants.EnvCard.None) {
      gameBladeAnimationTimeout.current = setTimeout(() => {
        gameImpl?.prepareActionAnimation()
        gameImpl?.animateDuelistBlade()
      }, 1000 / speedRef.current);
    }

    const timeDelay = Constants.DRAW_CARD_BASE_DURATION + 200 + (shouldDoblePause ? (Constants.BASE_CARD_REVEAL_DURATION + 200) : 200)
    const timeDelayNextStep = (tutorial === DuelTutorialLevel.SIMPLE ? 500 : timeDelay) + (shouldDoblePause ? 1400 : 1000)

    gameAnimationTimeout.current = setTimeout(() => {
      cardRef.current?.updateDuelistData(newStatsA?.damage, newStatsB?.damage, newStatsA?.hitChance, newStatsB?.hitChance)
      if (step.card_env != constants.EnvCard.None) {
        gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
      } else {
        gameImpl?.animateActions(Action[step.card_a.blades], Action[step.card_b.blades], newStatsA?.health, newStatsB?.health)
      }
    }, tutorial === DuelTutorialLevel.SIMPLE ? 500 : step.card_env != constants.EnvCard.None ? (timeDelay / speedRef.current) : 3000 / speedRef.current);

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
        revealCards={(cards: DuelistHand) => {
          cardRef.current?.spawnCards('A', cards)
          hasSpawnedCardsA.current = true
        }}
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
        revealCards={(cards: DuelistHand) => {
          cardRef.current?.spawnCards('B', cards)
          hasSpawnedCardsB.current = true
        }}
      />

      <Cards duelId={duelId} ref={cardRef} tutorialLevel={tutorial} />
      
      <DuelHeader duelId={duelId} tutorialLevel={tutorial} />

      <DuelStateDisplay duelId={duelId} />

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile floated='left' playerAddress={duelistAddressA} duelistId={duelistIdA} isTutorial={isTutorial} />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile floated='left' duelistId={duelistIdA} damage={statsA.damage} hitChance={statsA.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag' >
          <DuelProfile floated='right' playerAddress={duelistAddressB} duelistId={duelistIdB} isTutorial={isTutorial} />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag' >
          <DuelistProfile floated='right' duelistId={duelistIdB} damage={statsB.damage} hitChance={statsB.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
        </div>
      </div>

      {isTutorial && <DuelTutorialOverlay tutorialType={tutorial} opener={tutorialOpener} />}

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
//TODO handle duel replay when someone withdrew/abandoned the duel or timedout currently it play the duel out without cards for one side 