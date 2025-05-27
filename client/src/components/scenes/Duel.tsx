import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useSettings } from '/src/hooks/SettingsContext'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'
import { CardsHandle } from '/src/components/cards/DuelCards'
import { DuelContextProvider, useDuelContext } from '/src/components/ui/duel/DuelContext'
import { DuelAnimationController, DuelAnimationControllerRef } from '/src/components/ui/duel/DuelAnimationController'
import { DuelUIControls } from '/src/components/ui/duel/DuelUIControls'
import { DuelSceneManager } from '/src/components/ui/duel/DuelSceneManager'

// Import UI components
import Cards from '/src/components/cards/DuelCards'
import DuelProgress from '/src/components/ui/duel/DuelProgress'
import DuelistProfile from '/src/components/ui/duel/DuelistProfile'
import DuelProfile from '/src/components/ui/duel/DuelProfile'
import DuelHeader from '/src/components/ui/duel/DuelHeader'
import DuelStateDisplay from '/src/components/ui/duel/DuelStateDispaly'
import DuelTutorialOverlay from '/src/components/ui/duel/DuelTutorialOverlay'
import { usePistolsContext } from '/src/hooks/PistolsContext'

/**
 * Main Duel component that orchestrates the duel scene and UI.
 */
export default function Duel({
  duelId,
  tutorial = DuelTutorialLevel.NONE
} : {
  duelId: bigint,
  tutorial: DuelTutorialLevel
}) {

  return (
    <DuelContextProvider duelId={duelId}>
      <DuelContent 
        duelId={duelId}
        tutorial={tutorial}
      />
    </DuelContextProvider>
  )
}

/**
 * Inner component that uses the DuelContext
 */
const DuelContent: React.FC<{
  duelId: bigint,
  tutorial: DuelTutorialLevel,
}> = ({
  duelId,
  tutorial,
}) => {
  const {
    isSceneStarted,
    isDataSet,
    isLoading,
    leftDuelist,
    rightDuelist,
    duelStage,
    statsLeft,
    statsRight,
    swapSides,
    completedStagesLeft,
    completedStagesRight,
    canAutoRevealLeft,
    canAutoRevealRight,
    settings,
    challenge,
    clearActionFlag
  } = useDuelContext()
  
  const { tutorialOpener } = usePistolsContext()
  
  // Animation control refs and state
  const cardsRef = useRef<CardsHandle>(null)
  const currentStepRef = useRef(0)
  const isPlayingRef = useRef(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [triggerReset, setTriggerReset] = useState(false)

  // Force a reset of current step and animation state when duelId changes
  useEffect(() => {
    currentStepRef.current = 0
    isPlayingRef.current = true
    setIsPlaying(true)
    setTriggerReset(prev => !prev) // Toggle to force reset
  }, [duelId])

  // Track first render for animation timing
  const hasInitializedCards = useRef(false)
  const animationsDelayedForLoading = useRef(false)
  
  const duelAnimationControllerRef = useRef<DuelAnimationControllerRef>(null)

  const handlePlay = () => {
    isPlayingRef.current = !isPlayingRef.current
    setIsPlaying(isPlayingRef.current)
    
    if (isPlayingRef.current && duelAnimationControllerRef.current) {
      setTimeout(() => {
        if (duelAnimationControllerRef.current && isPlayingRef.current) {
          duelAnimationControllerRef.current.stepForward()
        }
      }, 100)
    }
  }

  const handleReset = () => {
    if (duelAnimationControllerRef.current) {
      
      duelAnimationControllerRef.current.resetDuel()
    }
    
  }
  
  // Effect to detect triggerReset changes
  useEffect(() => {
    if (triggerReset && duelAnimationControllerRef.current) {
      duelAnimationControllerRef.current.resetDuel()
    }
  }, [triggerReset])
  
  // Once data is set, trigger card animations with a delay
  useEffect(() => {
    if (isDataSet && !hasInitializedCards.current) {
      hasInitializedCards.current = true
      
      // Delay card animations to allow scene to fully render
      const timer = setTimeout(() => {
        if (cardsRef.current) {
          animationsDelayedForLoading.current = true
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isDataSet])

  useEffect(() => {
    clearActionFlag()
  }, [clearActionFlag])

  // Conditionally render animation controller to prevent update loops
  const shouldShowAnimations = useMemo(() => {
    return isSceneStarted && isDataSet && !isLoading
  }, [isSceneStarted, isDataSet, isLoading])

  return (
    <>
      <DuelSceneManager 
        duelId={duelId} 
        tutorialLevel={tutorial} 
      />
      
      {/* Animation controller - only rendered when data is ready */}
      {shouldShowAnimations && (
        <DuelAnimationController
          cardsRef={cardsRef}
          isPlayingRef={isPlayingRef}
          currentStepRef={currentStepRef}
          tutorialLevel={tutorial}
          ref={duelAnimationControllerRef}
        />
      )}

      {/* Progress UI components */}
      <DuelProgress 
        isA
        swapSides={swapSides || false}
        name={leftDuelist?.name || "Duelist A"}
        duelId={duelId}
        duelStage={duelStage || 0}
        duelistId={leftDuelist?.id || BigInt(0)}
        completedStages={completedStagesLeft || {}}
        canAutoReveal={canAutoRevealLeft || false}
        isYou={leftDuelist?.isYou || false}
        revealCards={(cards) => {
          if (cardsRef.current && isSceneStarted && isDataSet) {
            cardsRef.current.spawnCards('A', cards)
            duelAnimationControllerRef.current.setCardsSpawnedLeft(true);
          }
        }}
      />
      <DuelProgress
        isB
        swapSides={swapSides || false}
        name={rightDuelist?.name || "Duelist B"}
        duelId={duelId}
        duelStage={duelStage || 0}
        duelistId={rightDuelist?.id || BigInt(0)}
        completedStages={completedStagesRight || {}}
        canAutoReveal={canAutoRevealRight || false}
        isYou={rightDuelist?.isYou || false}
        revealCards={(cards) => {
          if (cardsRef.current && isSceneStarted && isDataSet) {
            cardsRef.current.spawnCards('B', cards)
            duelAnimationControllerRef.current.setCardsSpawnedRight(true);
          }
        }}
      />

      <Cards 
        duelistIdA={leftDuelist?.id || BigInt(0)} 
        duelistIdB={rightDuelist?.id || BigInt(0)} 
        ref={cardsRef} 
        tutorialLevel={tutorial}
        speedFactor={settings.duelSpeedFactor}
      />
      
      <DuelHeader duelId={duelId} tutorialLevel={tutorial} />
      <DuelStateDisplay duelId={duelId} />

      <div>
        <div className='DuelProfileA NoMouse NoDrag'>
          <DuelProfile 
            floated='left' 
            playerAddress={leftDuelist?.address || BigInt(0)} 
            duelistId={leftDuelist?.id || BigInt(0)} 
            isTutorial={challenge?.isTutorial || false} 
          />
        </div>
        <div className='DuelistProfileA NoMouse NoDrag'>
          <DuelistProfile 
            floated='left' 
            duelistId={leftDuelist?.id || BigInt(0)} 
            damage={statsLeft?.damage || 0} 
            hitChance={statsLeft?.hitChance || 0} 
            speedFactor={settings.duelSpeedFactor} 
            tutorialLevel={tutorial} 
          />
        </div>
      </div>
      <div>
        <div className='DuelProfileB NoMouse NoDrag'>
          <DuelProfile 
            floated='right' 
            playerAddress={rightDuelist?.address || BigInt(0)} 
            duelistId={rightDuelist?.id || BigInt(0)} 
            isTutorial={challenge?.isTutorial || false} 
          />
        </div>
        <div className='DuelistProfileB NoMouse NoDrag'>
          <DuelistProfile 
            floated='right' 
            duelistId={rightDuelist?.id || BigInt(0)} 
            damage={statsRight?.damage || 0} 
            hitChance={statsRight?.hitChance || 0} 
            speedFactor={settings.duelSpeedFactor} 
            tutorialLevel={tutorial} 
          />
        </div>
      </div>

      <DuelTutorialOverlay 
        tutorialType={tutorial} 
        opener={tutorialOpener} 
      />

      <DuelUIControls
        duelId={duelId}
        debugMode={settings.debugMode}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onStep={() => {
          if (isSceneStarted && isDataSet) {
            if (duelAnimationControllerRef.current) {
              duelAnimationControllerRef.current.stepForward();
            }
          }
        }}
        onReset={handleReset}
      />
    </>
  )
} 


// import React, { useEffect, useRef, useState } from 'react'
// import { useAccount } from '@starknet-react/core'
// import { useMounted, useClientTimestamp, useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
// import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
// import { usePistolsContext } from '/src/hooks/PistolsContext'
// import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
// import { useGameplayContext } from '/src/hooks/GameplayContext'
// import { useSettings } from '/src/hooks/SettingsContext'
// import { useGetChallenge } from '/src/stores/challengeStore'
// import { useDuelist } from '/src/stores/duelistStore'
// import { useIsMyDuelist } from '/src/hooks/useIsYou'
// import { useDuelProgress } from '/src/hooks/usePistolsContractCalls'
// import { useDuelCallToAction } from '../../stores/eventsModelStore'
// import { DuelStage, useAnimatedDuel } from '/src/hooks/useDuel'
// import { DojoSetupErrorDetector } from '../account/DojoSetupErrorDetector'
// import { EnvironmentCardsTextures } from '@underware/pistols-sdk/pistols/constants'
// import { AnimationState } from '/src/three/game'
// import { Action } from '/src/utils/pistols'
// import { MenuDuel, MenuDuelControl } from '/src/components/Menus'
// import { MenuDebugAnimations } from '/src/components/MenusDebug'
// import { constants } from '@underware/pistols-sdk/pistols/gen'
// import { DuelistCardType } from '/src/components/cards/Cards'
// import Cards, { CardsHandle, DuelistHand } from '/src/components/cards/DuelCards'
// import * as Constants from '/src/data/cardConstants'
// import { DuelTutorialLevel } from '/src/data/tutorialConstants'
// import DuelProgress from '/src/components/ui/duel/DuelProgress'
// import DuelistProfile from '/src/components/ui/duel/DuelistProfile'
// import DuelProfile from '/src/components/ui/duel/DuelProfile'
// import DuelHeader from '/src/components/ui/duel/DuelHeader'
// import DuelStateDisplay from '/src/components/ui/duel/DuelStateDispaly'
// import DuelTutorialOverlay from '/src/components/ui/duel/DuelTutorialOverlay'

// export type DuelistState = {
//   damage: number, 
//   hitChance: number, 
//   health: number,
//   shotPaces: number, 
//   dodgePaces: number,
// }

// export default function Duel({
//   duelId,
//   tutorial = DuelTutorialLevel.NONE
// } : {
//   duelId: bigint,
//   tutorial: DuelTutorialLevel
// }) {
//   const { gameImpl } = useThreeJsContext()
//   const { dispatchAnimated } = useGameplayContext()
//   const { dispatchSetDuel, tutorialOpener } = usePistolsContext()
//   const { debugMode, duelSpeedFactor } = useSettings()
//   const { clientSeconds } = useClientTimestamp(false)

//   const { duelistIdA, duelistIdB, duelistAddressA, duelistAddressB, timestampStart, isTutorial, timestampEnd, isAwaiting, isInProgress, isFinished  } = useGetChallenge(duelId)

//   // guarantee to run only once when this component mounts
//   const mounted = useMounted()
//   const [duelSceneStarted, setDuelSceneStarted] = useState(false)
//   const [dataSet, setDataSet] = useState(false)

//   const { name: nameA, characterType: characterTypeA } = useDuelist(duelistIdA)
//   const { name: nameB, characterType: characterTypeB } = useDuelist(duelistIdB)
//   const isYouA = useIsMyDuelist(duelistIdA)
//   const isYouB = useIsMyDuelist(duelistIdB)

//   // Determine if we need to swap sides to put the player on the left
//   const swapSides = isYouB

//   // Get the correct duelist IDs, names, etc. based on whether we need to swap
//   const leftDuelistId = swapSides ? duelistIdB : duelistIdA
//   const rightDuelistId = swapSides ? duelistIdA : duelistIdB
//   const leftDuelistAddress = swapSides ? duelistAddressB : duelistAddressA
//   const rightDuelistAddress = swapSides ? duelistAddressA : duelistAddressB
//   const leftName = swapSides ? nameB : nameA
//   const rightName = swapSides ? nameA : nameB
//   const leftCharacterType = swapSides ? characterTypeB : characterTypeA
//   const rightCharacterType = swapSides ? characterTypeA : characterTypeB
//   const isLeftYou = swapSides ? isYouB : isYouA
//   const isRightYou = swapSides ? isYouA : isYouB

//   // clear required action flag
//   const { account } = useAccount()
//   const { game } = useDojoSystemCalls()
//   const isRequired = useDuelCallToAction(duelId)

//   useEffect(() => {
//     if ((isYouA || isYouB) && mounted && account && isRequired && isFinished) {
//       console.log('clearing required action flag...')
//       if (isYouA) game.clear_call_to_action(account, duelistIdA)
//       if (isYouB) game.clear_call_to_action(account, duelistIdB)
//     }
//   }, [isYouA, isYouB, mounted, account, isRequired, isFinished])

//   // Animated duel is useDuel added with intermediate animation stages
//   const {
//     duelStage,
//     completedStagesA, completedStagesB,
//     canAutoRevealA, canAutoRevealB,
//   } = useAnimatedDuel(duelId, duelSceneStarted)

//   // Use the correct completed stages and auto reveal flags based on whether we need to swap
//   const leftCompletedStages = swapSides ? completedStagesB : completedStagesA
//   const rightCompletedStages = swapSides ? completedStagesA : completedStagesB
//   const leftCanAutoReveal = swapSides ? canAutoRevealB : canAutoRevealA
//   const rightCanAutoReveal = swapSides ? canAutoRevealA : canAutoRevealB

//   const [ statsA, setStatsA ] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })
//   const [ statsB, setStatsB ] = useState<DuelistState>({ damage: 0, hitChance: 0, health: 3, shotPaces: undefined, dodgePaces: undefined })
//   const [ isPlaying, setIsPlaying ] = useState(true)
//   const [ triggerReset, setTriggerReset ] = useState(false)
//   const [ duelInProgress, setDuelInProgress ] = useState(false)
  
//   const cardRef = useRef<CardsHandle>(null)
//   const hasSpawnedCardsA = useRef(false)
//   const hasSpawnedCardsB = useRef(false)
//   const cardRevealTimeout = useRef(null);
  
//   const currentStep = useRef(0)
//   const isAnimatingStepRef = useRef(false)
//   const isPlayingRef = useRef(true)
//   const speedRef = useRef(duelSpeedFactor)
//   const hasUnmounted = useRef(false)
//   const nextStepCallback = useRef(null);
//   const gameAnimationTimeout = useRef(null);
//   const gameBladeAnimationTimeout = useRef(null);

//   const { duelProgress } = useDuelProgress(duelId)

//   useEffect(() => dispatchSetDuel(duelId), [duelId])

//   useEffect(() => {
//     if (tutorial != DuelTutorialLevel.NONE && isTutorial) {
//       tutorialOpener.open()
//     } else {
//       tutorialOpener.close()
//     }
//   }, [tutorial, isTutorial])

//   useEffect(() => {
//     if (gameImpl && mounted && !duelSceneStarted && duelistAddressA && duelistAddressB) {
//       gameImpl.setDuelData(Number(duelId), Number(leftDuelistId), Number(rightDuelistId))
//       gameImpl.resetDuelScene()
//       setDuelSceneStarted(true)
//       dispatchAnimated(AnimationState.None)
//     }
//   }, [gameImpl, mounted, duelSceneStarted, duelistAddressA, duelistAddressB, leftDuelistId, rightDuelistId])

//   useEffect(() => {
//     if (gameImpl && mounted && nameA && nameB && characterTypeA && characterTypeB && !dataSet) {
//       gameImpl.startDuelWithPlayers(leftName, leftCharacterType, isLeftYou, isRightYou, rightName, rightCharacterType)
      
//       const timer = setTimeout(() => {
//         setDataSet(true)
//       }, 5000)
      
//       return () => clearTimeout(timer)
//     }
//   }, [gameImpl, mounted, characterTypeA, characterTypeB, nameA, nameB, leftName, rightName, leftCharacterType, rightCharacterType, isLeftYou, isRightYou, dataSet])

//   // setup grass animation 
//   //TODO change due new timeouts...
//   useEffect(() => {
//     if (timestampStart && clientSeconds) {
//       const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 days in seconds
//       let percentage = 0;
      
//       if (isAwaiting && timestampStart && timestampEnd) {
//         // Challenge created but not accepted - use actual start/end time
//         const timePassed = clientSeconds - timestampStart;
//         const totalDuration = timestampEnd - timestampStart;
//         percentage = Math.min(Math.max(timePassed / totalDuration, 0), 1);
//       } else if (isFinished && timestampStart && timestampEnd) {
//         // Duel completed - use actual duration capped at 7 days
//         const duelLength = timestampEnd - timestampStart;
//         percentage = Math.min(Math.max(duelLength / SEVEN_DAYS, 0), 1);
//       } else {
//         const timePassed = clientSeconds - timestampStart;
//         percentage = Math.min(Math.max(timePassed / SEVEN_DAYS, 0), 1);
//       }

//       gameImpl?.setDuelTimePercentage(percentage);
//     }
//   }, [gameImpl, clientSeconds, timestampStart, timestampEnd])

//   useEffect(() => {
//     speedRef.current = duelSpeedFactor
//     gameImpl?.setDuelistSpeedFactor(duelSpeedFactor)
//   }, [duelSpeedFactor, gameImpl])

//   //spawns cards for all duelists if they committed
//   useEffect(() => {
//     if (!cardRef.current) return

//     setTimeout(() => {
//       if(leftCompletedStages[DuelStage.Round1Reveal] && rightCompletedStages[DuelStage.Round1Reveal]) return
      
//       if (!isLeftYou) {
//         if (leftCompletedStages[DuelStage.Round1Commit] && !hasSpawnedCardsA.current) {
//           cardRef.current?.spawnCards('A', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
//         }
//       }
//       if (!isRightYou) {
//         if (rightCompletedStages[DuelStage.Round1Commit] && !hasSpawnedCardsB.current) {
//           cardRef.current?.spawnCards('B', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
//         }
//       }
//     }, 1000);
//   }, [leftCompletedStages, rightCompletedStages, isLeftYou, isRightYou])

//   useEffect(() => {
//     return () => {
//       hasUnmounted.current = true
//     }
//   }, [])
  
//   useEffect(() => {
//     console.log('duelProgress', duelProgress)
//     if (duelProgress && !duelInProgress) {
//       setDuelInProgress(true)

//       resetEverything()

//       const envCardsList = duelProgress.steps.reduce((acc, step) => {
//         if (step.card_env !== constants.EnvCard.None) {
//           acc.push(EnvironmentCardsTextures[step.card_env]);
//         }
//         return acc;
//       }, []);
      
//       cardRef.current?.setAllEnvCards(envCardsList)

//       setTimeout(() => {
//         // Get the correct hands based on swapSides
//         const leftHand = swapSides ? duelProgress.hand_b : duelProgress.hand_a
//         const rightHand = swapSides ? duelProgress.hand_a : duelProgress.hand_b

//         if (!hasSpawnedCardsA.current) {
//           hasSpawnedCardsA.current = true
//           cardRef.current?.spawnCards('A', { fire: leftHand.card_fire, dodge: leftHand.card_dodge, blade: leftHand.card_blades, tactics: leftHand.card_tactics })
//         }
//         if (!hasSpawnedCardsB.current) {
//           hasSpawnedCardsB.current = true
//           cardRef.current?.spawnCards('B', { fire: rightHand.card_fire, dodge: rightHand.card_dodge, blade: rightHand.card_blades, tactics: rightHand.card_tactics })
//         }
//       }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 1500)

//       setTimeout(() => {
//         const step = duelProgress.steps[currentStep.current]
        
//         // Get the correct states and cards based on swapSides
//         const leftState = swapSides ? step.state_b : step.state_a
//         const rightState = swapSides ? step.state_a : step.state_b
//         const leftCard = swapSides ? step.card_b : step.card_a
//         const rightCard = swapSides ? step.card_a : step.card_b

//         setStatsA((prevValue) => {
//           return { 
//             damage: Number(leftState.damage),
//             hitChance: Number(leftState.chances),
//             health: Number(leftState.health),
//             shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (leftCard.fire ? currentStep.current : undefined),
//             dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (leftCard.dodge ? currentStep.current : undefined),
//           }
//         })
//         setStatsB((prevValue) => {
//           return { 
//             damage: Number(rightState.damage),
//             hitChance: Number(rightState.chances),
//             health: Number(rightState.health),
//             shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (rightCard.fire ? currentStep.current : undefined),
//             dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (rightCard.dodge ? currentStep.current : undefined),
//           }
//         })
//       }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 2500);

//       setTimeout(() => {
//         gameImpl?.hideDialogs()

//         cardRef.current?.revealCard('A', DuelistCardType.TACTICS, speedRef.current)
//         cardRef.current?.revealCard('B', DuelistCardType.TACTICS, speedRef.current)

//         if (isPlayingRef.current) {
//           nextStepCallback.current = setTimeout(() => {
//             gameImpl?.removeHighlightEffects()
//             playStep()
//           }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : (Constants.BASE_CARD_REVEAL_DURATION * 1.2) / speedRef.current)
//         }
//       }, tutorial === DuelTutorialLevel.SIMPLE ? 0 : 4000)
//     }

//     return () => {
//         hasUnmounted.current = true
//     };
//   }, [duelProgress, triggerReset, tutorial, swapSides, duelInProgress])

//   const playStep = () => {
//     currentStep.current += 1

//     const step = duelProgress.steps[currentStep.current]

//     if (!step) return

//     isAnimatingStepRef.current = true

//     if (step.card_env != constants.EnvCard.None) cardRef.current?.drawNextCard(speedRef.current)

//     let shouldDoblePause = false

//     let revealCardsA = [];
//     let revealCardsB = [];
    
//     // Get the correct cards and states based on swapSides
//     const leftCard = swapSides ? step.card_b : step.card_a
//     const rightCard = swapSides ? step.card_a : step.card_b
//     const leftState = swapSides ? step.state_b : step.state_a
//     const rightState = swapSides ? step.state_a : step.state_b
    
//     // Reveal all cards in left hand
//     if (leftCard.fire) {
//       shouldDoblePause = true;
//       revealCardsA.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
//     }
//     if (leftCard.dodge) {
//       shouldDoblePause = true;
//       revealCardsA.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
//     }
//     if (leftCard.blades) {
//       revealCardsA.push({ type: DuelistCardType.BLADE, delay: 1000 });
//     }

//     // Reveal all cards in right hand
//     if (rightCard.fire) {
//       shouldDoblePause = true;
//       revealCardsB.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
//     }
//     if (rightCard.dodge) {
//       shouldDoblePause = true;
//       revealCardsB.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
//     }
//     if (rightCard.blades) {
//       revealCardsB.push({ type: DuelistCardType.BLADE, delay: 1000 });
//     }

//     if (tutorial !== DuelTutorialLevel.SIMPLE) {
//       cardRevealTimeout.current = setTimeout(() => {
//         revealCardsA.forEach(card => cardRef.current?.revealCard('A', card.type, speedRef.current, leftState.health > 0));
//         revealCardsB.forEach(card => cardRef.current?.revealCard('B', card.type, speedRef.current, rightState.health > 0));
//       }, Math.max(...[...revealCardsA, ...revealCardsB].map(card => card.delay || 0), 0) / speedRef.current);
//     }

//     let newStatsA: DuelistState;
//     let newStatsB: DuelistState;

//     setStatsA((prevValue) => {
//       newStatsA = { 
//         damage: Number(leftState.damage),
//         hitChance: Number(leftState.chances),
//         health: Number(leftState.health),
//         shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (leftCard.fire ? currentStep.current : undefined),
//         dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (leftCard.dodge ? currentStep.current : undefined),
//       }
//       return newStatsA
//     })
//     setStatsB((prevValue) => {
//       newStatsB = { 
//         damage: Number(rightState.damage),
//         hitChance: Number(rightState.chances),
//         health: Number(rightState.health),
//         shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (rightCard.fire ? currentStep.current : undefined),
//         dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (rightCard.dodge ? currentStep.current : undefined),
//       }
//       return newStatsB
//     })

//     let hasHealthChangedA = leftState.health < 3;
//     let hasHealthChangedB = rightState.health < 3;

//     if (tutorial !== DuelTutorialLevel.SIMPLE && currentStep.current > 1 && step.card_env == constants.EnvCard.None) {
//       gameBladeAnimationTimeout.current = setTimeout(() => {
//         gameImpl?.prepareActionAnimation()
//         gameImpl?.animateDuelistBlade()
//       }, 1000 / speedRef.current);
//     }

//     const timeDelay = Constants.DRAW_CARD_BASE_DURATION + 200 + (shouldDoblePause ? (Constants.BASE_CARD_REVEAL_DURATION + 200) : 200)
//     const timeDelayNextStep = (tutorial === DuelTutorialLevel.SIMPLE ? 500 : timeDelay) + 
//       (shouldDoblePause ? ((hasHealthChangedA || hasHealthChangedB) ? 2800 : 1400) : 1000)

//     gameAnimationTimeout.current = setTimeout(() => {
//       cardRef.current?.updateDuelistData(newStatsA?.damage, newStatsB?.damage, newStatsA?.hitChance, newStatsB?.hitChance)
//       if (step.card_env != constants.EnvCard.None) {
//         gameImpl?.animatePace(currentStep.current, newStatsA, newStatsB)
//       } else {
//         // Get the correct blade actions based on swapSides
//         const leftBlade = swapSides ? Action[step.card_b.blades] : Action[step.card_a.blades]
//         const rightBlade = swapSides ? Action[step.card_a.blades] : Action[step.card_b.blades]
//         gameImpl?.animateActions(leftBlade, rightBlade, newStatsA?.health, newStatsB?.health)
//       }
//     }, tutorial === DuelTutorialLevel.SIMPLE ? 500 : step.card_env != constants.EnvCard.None ? (timeDelay / speedRef.current) : 3000 / speedRef.current);

//     if (currentStep.current < duelProgress.steps.length && isPlayingRef.current) {
//       nextStepCallback.current = setTimeout(() => {
//         if (hasUnmounted.current) {
//           resetEverything()
//         } else {
//           playStep()
//         }
//       }, timeDelayNextStep / speedRef.current)
//     }
//     setTimeout(() => {
//       isAnimatingStepRef.current = false
//     }, timeDelayNextStep / speedRef.current) 
//   }

//   const resetStep = () => {
//     clearTimeout(nextStepCallback.current)
//     clearTimeout(cardRevealTimeout.current)
//     clearTimeout(gameBladeAnimationTimeout.current)
//     clearTimeout(gameAnimationTimeout.current)
//   }

//   const resetDuel = () => {
//     resetStep()
//     resetEverything()
//     cardRef.current?.resetCards()
//     gameImpl?.resetDuelScene(false)
    
//     setTimeout(() => {
//       setDuelInProgress(false)
//       setTriggerReset(!triggerReset)
//     }, 1200);
//   }

//   const resetEverything = () => {
//     setStatsA((prevValue) => {
//         return { 
//           damage: 0,
//           hitChance: 0,
//           health: 3,
//           shotPaces: undefined,
//           dodgePaces: undefined,
//         }
//       })
//       setStatsB((prevValue) => {
//         return { 
//           damage: 0,
//           hitChance: 0,
//           health: 3,
//           shotPaces: undefined,
//           dodgePaces: undefined,
//         }
//       })
    
//     currentStep.current = 0
//     hasSpawnedCardsA.current = false
//     hasSpawnedCardsB.current = false
//     hasUnmounted.current = false

//     nextStepCallback.current = null
//     cardRevealTimeout.current = null
//     gameBladeAnimationTimeout.current = null
//     gameAnimationTimeout.current = null
//   }

//   if (!duelSceneStarted) return <></>

//   return (
//     <>
//       <DuelProgress 
//         isA
//         swapSides={swapSides}
//         name={leftName}
//         duelId={duelId}
//         duelStage={duelStage}
//         duelistId={leftDuelistId}
//         completedStages={leftCompletedStages}
//         canAutoReveal={leftCanAutoReveal}
//         isYou={isLeftYou}
//         revealCards={(cards: DuelistHand) => {
//           cardRef.current?.spawnCards('A', cards)
//           hasSpawnedCardsA.current = true
//         }}
//       />
//       <DuelProgress
//         isB
//         swapSides={swapSides}
//         name={rightName}
//         duelId={duelId}
//         duelStage={duelStage}
//         duelistId={rightDuelistId}
//         completedStages={rightCompletedStages}
//         canAutoReveal={rightCanAutoReveal}
//         isYou={isRightYou}
//         revealCards={(cards: DuelistHand) => {
//           cardRef.current?.spawnCards('B', cards)
//           hasSpawnedCardsB.current = true
//         }}
//       />

//       <Cards duelistIdA={leftDuelistId} duelistIdB={rightDuelistId} ref={cardRef} tutorialLevel={tutorial} />
      
//       <DuelHeader duelId={duelId} tutorialLevel={tutorial} />

//       <DuelStateDisplay duelId={duelId} />

//       <div>
//         <div className='DuelProfileA NoMouse NoDrag'>
//           <DuelProfile floated='left' playerAddress={leftDuelistAddress} duelistId={leftDuelistId} isTutorial={isTutorial} />
//         </div>
//         <div className='DuelistProfileA NoMouse NoDrag'>
//           <DuelistProfile floated='left' duelistId={leftDuelistId} damage={statsA.damage} hitChance={statsA.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
//         </div>
//       </div>
//       <div>
//         <div className='DuelProfileB NoMouse NoDrag' >
//           <DuelProfile floated='right' playerAddress={rightDuelistAddress} duelistId={rightDuelistId} isTutorial={isTutorial} />
//         </div>
//         <div className='DuelistProfileB NoMouse NoDrag' >
//           <DuelistProfile floated='right' duelistId={rightDuelistId} damage={statsB.damage} hitChance={statsB.hitChance} speedFactor={duelSpeedFactor} tutorialLevel={tutorial} />
//         </div>
//       </div>

//       <DuelTutorialOverlay tutorialType={tutorial ? tutorial : undefined} opener={tutorialOpener} />

//       {/* {duelProgress &&
//         <div className='CenteredPanel'>
//           <pre className='Code FillParent Scroller NoMargin'>
//             {serialize(duelProgress, 2)}
//           </pre>
//         </div>
//       } */}

//       <MenuDuel duelId={duelId} />
//       <MenuDuelControl 
//         clickPlay={() => {
//           isPlayingRef.current = !isPlayingRef.current
//           setIsPlaying(isPlayingRef.current)
//           if (isPlayingRef.current) {
//             playStep()
//           }
//         }} 
//         clickStep={() => {
//           if (!isAnimatingStepRef.current) {
//             playStep()
//           }
//         }} 
//         clickReset={() => {
//           resetDuel()
//         }} 
//         isPlaying={isPlaying} />

//       <DojoSetupErrorDetector />

//       {debugMode && <MenuDebugAnimations />}
//     </>
//   )
// }

// //TODO on page refresh in duel, automatically pause duel and instead of the ready button call start button so sounds are enabled + duel starts properly
// //TODO on refresh add a black overlay or round overlay with brown background that is shown and animated untill the assets are loaded and duel can be started!
// //TODO on duel end add rechallenge option!
// //TODO handle duel replay when someone withdrew/abandoned the duel or timedout currently it play the duel out without cards for one side 
