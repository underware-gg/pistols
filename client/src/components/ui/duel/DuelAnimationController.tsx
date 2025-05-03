import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useDuelContext } from '/src/components/ui/duel/DuelContext'
import { AnimationState } from '/src/three/game'
import { Action } from '/src/utils/pistols'
import { DuelistCardType } from '/src/components/cards/Cards'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import * as Constants from '/src/data/cardConstants'
import { CardsHandle } from '/src/components/cards/DuelCards'
import { DuelStage } from '/src/hooks/useDuel'
import { EnvironmentCardsTextures } from '@underware/pistols-sdk/pistols/constants'
import { DuelTutorialLevel } from '/src/data/tutorialConstants'

export interface DuelAnimationControllerProps {
  cardsRef: React.RefObject<CardsHandle>;
  isPlayingRef: React.MutableRefObject<boolean>;
  currentStepRef: React.MutableRefObject<number>;
  tutorialLevel: DuelTutorialLevel;
}

// Define the ref type with the resetDuel function
export interface DuelAnimationControllerRef {
  resetDuel: () => void;
  stepForward: () => void;
  setCardsSpawnedLeft: (left: boolean) => void;
  setCardsSpawnedRight: (right: boolean) => void;
}

// Convert component to forwardRef to expose resetDuel function
export const DuelAnimationController = forwardRef<DuelAnimationControllerRef, DuelAnimationControllerProps>(({
  cardsRef,
  isPlayingRef,
  currentStepRef,
  tutorialLevel
}, ref) => {
  const { gameImpl } = useThreeJsContext()
  const { 
    duelProgress, 
    duelInProgress, 
    setDuelInProgress, 
    completedStagesLeft,
    completedStagesRight,
    leftDuelist, 
    rightDuelist,
    statsLeft,
    statsRight,
    settings: {
      duelSpeedFactor,
    },
    areDuelistsLoaded,
    setDuelistsLoaded,
    setStatsLeft,
    setStatsRight,
    resetStats,
    positionToAB
  } = useDuelContext()

  // Animation timeout refs
  const nextStepCallbackRef = useRef(null);
  const cardRevealTimeoutRef = useRef(null);
  const gameBladeAnimationTimeoutRef = useRef(null);
  const gameAnimationTimeoutRef = useRef(null);
  const hasSpawnedCardsLeftRef = useRef(false);
  const hasSpawnedCardsRightRef = useRef(false);
  const isAnimatingStepRef = useRef(false);

  const speedFactorRef = useRef(duelSpeedFactor);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      resetStep();
    };
  }, []);

  useEffect(() => {
    speedFactorRef.current = duelSpeedFactor;
  }, [duelSpeedFactor]);

  useEffect(() => {
    if (!cardsRef.current) return

    setTimeout(() => {
      if(completedStagesLeft[DuelStage.Round1Reveal] && completedStagesRight[DuelStage.Round1Reveal]) return
      
      if (!leftDuelist?.isYou) {
        if (completedStagesLeft[DuelStage.Round1Commit] && !hasSpawnedCardsLeftRef.current) {
          cardsRef.current?.spawnCards('A', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
      if (!rightDuelist?.isYou) {
        if (completedStagesRight[DuelStage.Round1Commit] && !hasSpawnedCardsRightRef.current) {
          cardsRef.current?.spawnCards('B', { fire: constants.PacesCard.None, dodge: constants.PacesCard.None, blade: constants.BladesCard.None, tactics: constants.TacticsCard.None })
        }
      }
    }, 1000);
  }, [completedStagesLeft, completedStagesRight, leftDuelist?.isYou, rightDuelist?.isYou])

  // Add initialization check to prevent running animations too early
  useEffect(() => {
    if (!duelProgress || !gameImpl) {
      return; // Don't run if we don't have the progress data or game implementation
    }

    // Safety check for the uninitialized case
    if (!leftDuelist?.id || !rightDuelist?.id) {
      console.log("Waiting for duelist data to be fully loaded before starting animations");
      return;
    }

    // Throttle initial animation when first mounting or after refresh
    if (!duelInProgress) {
      console.log("Waiting for duelists to be fully loaded before starting animations", areDuelistsLoaded);
      if (!areDuelistsLoaded) return;
      
      // Use a timeout to make sure the initialization happens after the scene is fully ready
      const initTimer = setTimeout(() => {
        setDuelInProgress(true);
        resetEverything();

        // Get environment cards
        const envCardsList = duelProgress.steps.reduce((acc, step) => {
          if (step.card_env !== constants.EnvCard.None) {
            acc.push(EnvironmentCardsTextures[step.card_env]);
          }
          return acc;
        }, []);
        
        if (cardsRef.current) {
          cardsRef.current.setAllEnvCards(envCardsList);
        }

        // Use sequential timeouts to ensure proper timing
        const startCards = () => {
          // Get the correct hands based on position
          const leftPosition = positionToAB('left');
          const rightPosition = positionToAB('right');
          const leftHand = leftPosition === 'a' ? duelProgress.hand_a : duelProgress.hand_b;
          const rightHand = rightPosition === 'a' ? duelProgress.hand_a : duelProgress.hand_b;

          if (cardsRef.current) {
            if (!hasSpawnedCardsLeftRef.current) {
              hasSpawnedCardsLeftRef.current = true;
              cardsRef.current.spawnCards('A', { 
                fire: leftHand.card_fire, 
                dodge: leftHand.card_dodge, 
                blade: leftHand.card_blades, 
                tactics: leftHand.card_tactics 
              });
            }
            
            if (!hasSpawnedCardsRightRef.current) {
              hasSpawnedCardsRightRef.current = true;
              cardsRef.current.spawnCards('B', { 
                fire: rightHand.card_fire, 
                dodge: rightHand.card_dodge, 
                blade: rightHand.card_blades, 
                tactics: rightHand.card_tactics 
              });
            }
          }
          
          // After spawning cards, proceed to set stats
          setTimeout(startStats, 1500);
        };
        
        const startStats = () => {
          if (!duelProgress || !duelProgress.steps || duelProgress.steps.length === 0) {
            console.error("Duel progress data is invalid");
            return;
          }
          
          try {
            // Safely get the first step
            const step = duelProgress.steps[currentStepRef.current];
            
            // Get the correct states and cards based on position
            const leftPosition = positionToAB('left');
            const rightPosition = positionToAB('right');
            
            const leftState = leftPosition === 'a' ? step.state_a : step.state_b;
            const rightState = rightPosition === 'a' ? step.state_a : step.state_b;
            const leftCard = leftPosition === 'a' ? step.card_a : step.card_b;
            const rightCard = rightPosition === 'a' ? step.card_a : step.card_b;

            // Update stats safely
            setStatsLeft(prev => ({
              damage: Number(leftState?.damage ?? 0),
              hitChance: Number(leftState?.chances ?? 0),
              health: Number(leftState?.health ?? 3),
              shotPaces: prev.shotPaces ? prev.shotPaces : (leftCard?.fire ? currentStepRef.current : undefined),
              dodgePaces: prev.dodgePaces ? prev.dodgePaces : (leftCard?.dodge ? currentStepRef.current : undefined),
            }));
            
            setStatsRight(prev => ({
              damage: Number(rightState?.damage ?? 0),
              hitChance: Number(rightState?.chances ?? 0),
              health: Number(rightState?.health ?? 3),
              shotPaces: prev.shotPaces ? prev.shotPaces : (rightCard?.fire ? currentStepRef.current : undefined),
              dodgePaces: prev.dodgePaces ? prev.dodgePaces : (rightCard?.dodge ? currentStepRef.current : undefined),
            }));
            
            // After setting stats, start revealing cards
            setTimeout(startReveal, 1500);
          } catch (error) {
            console.error("Error initializing stats:", error);
          }
        };
        
        const startReveal = () => {
          if (gameImpl) gameImpl.hideDialogs();

          if (cardsRef.current) {
            // Start by revealing tactics cards
            cardsRef.current.revealCard('A', DuelistCardType.TACTICS);
            cardsRef.current.revealCard('B', DuelistCardType.TACTICS);
          }

          // Start animation if set to play
          if (isPlayingRef.current) {
            nextStepCallbackRef.current = setTimeout(() => {
              gameImpl.hideDialogs();
              playStep();
            }, tutorialLevel === DuelTutorialLevel.SIMPLE ? 500 : (Constants.BASE_CARD_REVEAL_DURATION * 1.2) / speedFactorRef.current);
          }
        };
        
        // Start the card initialization sequence
        setTimeout(startCards, 1000);
        
      }, 500); // Short delay to ensure DOM is ready
      
      return () => {
        clearTimeout(initTimer);
      };
    }
  }, [duelProgress, duelInProgress, gameImpl, leftDuelist?.id, rightDuelist?.id, tutorialLevel, areDuelistsLoaded]);

  // Main function for playing animation steps
  const playStep = () => {
    // Safety check - don't try to play steps if we don't have progress data
    if (!duelProgress || !duelProgress.steps || currentStepRef.current >= duelProgress.steps.length - 1) {
      isAnimatingStepRef.current = false;
      return;
    }

    // If we're not in playing mode, don't continue to next step automatically
    if (!isPlayingRef.current && nextStepCallbackRef.current) {
      clearTimeout(nextStepCallbackRef.current);
      nextStepCallbackRef.current = null;
    }

    isAnimatingStepRef.current = true;

    currentStepRef.current += 1;
    const step = duelProgress.steps[currentStepRef.current];

    if (!step) {
      isAnimatingStepRef.current = false;
      return;
    }

    // Draw a new environment card if present
    if (step.card_env !== constants.EnvCard.None) {
      if (cardsRef.current) {
        cardsRef.current.drawNextCard();
      }
    }

    let shouldDoblePause = false;
    let revealCardsA = [];
    let revealCardsB = [];
    
    try {
      // Get the correct cards and states based on position
      const leftPosition = positionToAB('left');
      const rightPosition = positionToAB('right');
      
      const leftCard = leftPosition === 'a' ? step.card_a : step.card_b;
      const rightCard = rightPosition === 'a' ? step.card_a : step.card_b;
      const leftState = leftPosition === 'a' ? step.state_a : step.state_b;
      const rightState = rightPosition === 'a' ? step.state_a : step.state_b;
      
      // Safety check for invalid data
      if (!leftCard || !rightCard || !leftState || !rightState) {
        console.error("Missing card or state data for step", currentStepRef.current);
        isAnimatingStepRef.current = false;
        return;
      }
      
      // Reveal all cards in left hand
      if (leftCard.fire) {
        shouldDoblePause = true;
        revealCardsA.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
      }
      if (leftCard.dodge) {
        shouldDoblePause = true;
        revealCardsA.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
      }
      if (leftCard.blades) {
        revealCardsA.push({ type: DuelistCardType.BLADE, delay: 1000 });
      }

      // Reveal all cards in right hand
      if (rightCard.fire) {
        shouldDoblePause = true;
        revealCardsB.push({ type: DuelistCardType.FIRE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
      }
      if (rightCard.dodge) {
        shouldDoblePause = true;
        revealCardsB.push({ type: DuelistCardType.DODGE, delay: Constants.DRAW_CARD_BASE_DURATION + 200 });
      }
      if (rightCard.blades) {
        revealCardsB.push({ type: DuelistCardType.BLADE, delay: 1000 });
      }

      if (tutorialLevel !== DuelTutorialLevel.SIMPLE && cardsRef.current) {
        cardRevealTimeoutRef.current = setTimeout(() => {
          revealCardsA.forEach(card => {
            if (cardsRef.current) {
              cardsRef.current.revealCard('A', card.type, leftState.health > 0);
            }
          });
          revealCardsB.forEach(card => {
            if (cardsRef.current) {
              cardsRef.current.revealCard('B', card.type, rightState.health > 0);
            }
          });
        }, Math.max(...[...revealCardsA, ...revealCardsB].map(card => card.delay || 0), 0) / speedFactorRef.current);
      }

      let newStatsLeft: typeof statsLeft = null;
      let newStatsRight: typeof statsRight = null;

      setStatsLeft((prevValue) => {
        newStatsLeft = { 
          damage: Number(leftState.damage ?? 0),
          hitChance: Number(leftState.chances ?? 0),
          health: Number(leftState.health ?? 3),
          shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (leftCard.fire ? currentStepRef.current : undefined),
          dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (leftCard.dodge ? currentStepRef.current : undefined),
        };
        return newStatsLeft;
      });
      
      setStatsRight((prevValue) => {
        newStatsRight = { 
          damage: Number(rightState.damage ?? 0),
          hitChance: Number(rightState.chances ?? 0),
          health: Number(rightState.health ?? 3),
          shotPaces: prevValue.shotPaces ? prevValue.shotPaces : (rightCard.fire ? currentStepRef.current : undefined),
          dodgePaces: prevValue.dodgePaces ? prevValue.dodgePaces : (rightCard.dodge ? currentStepRef.current : undefined),
        };
        return newStatsRight;
      });

      let hasHealthChangedLeft = leftState.health < 3;
      let hasHealthChangedRight = rightState.health < 3;

      if (tutorialLevel !== DuelTutorialLevel.SIMPLE && currentStepRef.current > 1 && step.card_env == constants.EnvCard.None && gameImpl) {
        gameBladeAnimationTimeoutRef.current = setTimeout(() => {
          if (gameImpl) {
            gameImpl.prepareActionAnimation();
            gameImpl.animateDuelistBlade();
          }
        }, 1000 / speedFactorRef.current);
      }

      const timeDelay = Constants.DRAW_CARD_BASE_DURATION + 200 + (shouldDoblePause ? (Constants.BASE_CARD_REVEAL_DURATION + 200) : 200);
      const timeDelayNextStep = (tutorialLevel === DuelTutorialLevel.SIMPLE ? 500 : timeDelay) + 
        (shouldDoblePause ? ((hasHealthChangedLeft || hasHealthChangedRight) ? 2800 : 1400) : 1000);

      gameAnimationTimeoutRef.current = setTimeout(() => {
        if (cardsRef.current) {
          cardsRef.current.updateDuelistData(
            newStatsLeft?.damage ?? 0, 
            newStatsRight?.damage ?? 0, 
            newStatsLeft?.hitChance ?? 0, 
            newStatsRight?.hitChance ?? 0
          );
        }
        
        if (!gameImpl) {
          console.error("Game implementation not available for animation");
          return;
        }
        
        if (step.card_env != constants.EnvCard.None) {
          gameImpl.animatePace(currentStepRef.current, newStatsLeft, newStatsRight);
        } else {
          // Get the correct blade actions based on position
          const leftPosition = positionToAB('left');
          const rightPosition = positionToAB('right');
          const leftBlade = leftPosition === 'a' ? Action[step.card_a.blades] : Action[step.card_b.blades];
          const rightBlade = rightPosition === 'a' ? Action[step.card_a.blades] : Action[step.card_b.blades];
          
          gameImpl.animateActions(
            leftBlade, 
            rightBlade, 
            newStatsLeft?.health ?? 3, 
            newStatsRight?.health ?? 3
          );
        }
      }, tutorialLevel === DuelTutorialLevel.SIMPLE ? 500 : step.card_env != constants.EnvCard.None ? (timeDelay / speedFactorRef.current) : 3000 / speedFactorRef.current);

      // Schedule next step if we have more steps and are in playing mode
      if (currentStepRef.current < duelProgress.steps.length - 1 && isPlayingRef.current) {
        nextStepCallbackRef.current = setTimeout(() => {
          if (isPlayingRef.current) { // Double check we're still in play mode
            playStep();
          } else {
            // Not playing, just mark as not animating
            isAnimatingStepRef.current = false;
            console.log("Animation paused");
          }
        }, timeDelayNextStep / speedFactorRef.current);
      } else {
        // If this is the last step or not playing, mark as finished
        setTimeout(() => {
          isAnimatingStepRef.current = false;
          console.log("Animation sequence complete");
        }, timeDelayNextStep / speedFactorRef.current);
      }
    } catch (error) {
      console.error("Error in playStep:", error);
      isAnimatingStepRef.current = false;
    }
  };

  // Clears all animation timeouts
  const resetStep = () => {
    if (nextStepCallbackRef.current) {
      clearTimeout(nextStepCallbackRef.current);
      nextStepCallbackRef.current = null;
    }
    if (cardRevealTimeoutRef.current) {
      clearTimeout(cardRevealTimeoutRef.current);
      cardRevealTimeoutRef.current = null;
    }
    if (gameBladeAnimationTimeoutRef.current) {
      clearTimeout(gameBladeAnimationTimeoutRef.current);
      gameBladeAnimationTimeoutRef.current = null;
    }
    if (gameAnimationTimeoutRef.current) {
      clearTimeout(gameAnimationTimeoutRef.current);
      gameAnimationTimeoutRef.current = null;
    }
    
    // Force animation step to be complete
    isAnimatingStepRef.current = false;
  };

  // Reset the entire duel
  const resetDuel = () => {
    resetStep();
    resetEverything();
    
    if (cardsRef.current) {
      cardsRef.current.resetCards();
    }
    
    if (gameImpl) {
      gameImpl.resetDuelScene(false, false);
    }
    
    setTimeout(() => {
      setDuelInProgress(false);
    }, 1000);
  };

  // Reset to initial state
  const resetEverything = () => {
    console.log("Performing full duel reset");
    // Reset stats to default
    resetStats();

    setDuelistsLoaded(false);
    
    // Reset all animation variables
    currentStepRef.current = 0;
    hasSpawnedCardsLeftRef.current = false;
    hasSpawnedCardsRightRef.current = false;
    isAnimatingStepRef.current = false;
    
    // Clear all timeout references
    nextStepCallbackRef.current = null;
    cardRevealTimeoutRef.current = null;
    gameBladeAnimationTimeoutRef.current = null;
    gameAnimationTimeoutRef.current = null;
  };
  
  // Expose resetDuel function to parent component through ref
  useImperativeHandle(ref, () => ({
    resetDuel,
    stepForward: () => {
      if (!isAnimatingStepRef.current) {
        playStep();
      }
    },
    setCardsSpawnedLeft: (left: boolean) => {
      hasSpawnedCardsLeftRef.current = left;
    },
    setCardsSpawnedRight: (right: boolean) => {
      hasSpawnedCardsRightRef.current = right;
    }
  }), []);

  return null; // This component doesn't render anything
}); 