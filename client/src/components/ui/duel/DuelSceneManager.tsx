import React, { useEffect, useRef } from 'react';
import { useDuelContext } from './DuelContext';
import { useThreeJsContext } from '/src/hooks/ThreeJsContext';
import { useGameplayContext } from '/src/hooks/GameplayContext';
import { AnimationState } from '/src/three/game';
import { usePistolsContext } from '/src/hooks/PistolsContext';
import { DuelTutorialLevel } from '/src/data/tutorialConstants';

interface DuelSceneManagerProps {
  duelId: bigint;
  tutorialLevel: DuelTutorialLevel;
}

export const DuelSceneManager: React.FC<DuelSceneManagerProps> = ({
  duelId,
  tutorialLevel
}) => {
  // Component instance state tracking
  const didSceneInit = useRef(false);
  const didPlayersInitA = useRef(false);
  const didPlayersInitB = useRef(false);
  const didTutorialRun = useRef(false);
  const didImmediateReset = useRef(false);
  
  const { gameImpl } = useThreeJsContext();
  const { animated, dispatchAnimated } = useGameplayContext();
  const { tutorialOpener } = usePistolsContext();
  const context = useDuelContext();

  // Immediate reset on component mount (only once)
  useEffect(() => {
    if (didImmediateReset.current) return;
    
    if (gameImpl) {
      gameImpl.resetDuelScene(true);
      didImmediateReset.current = true;
    }
  }, [gameImpl]);
  
  // Reset on duelId change
  useEffect(() => {
    didSceneInit.current = false;
    didPlayersInitA.current = false;
    didPlayersInitB.current = false;
    didTutorialRun.current = false;
    
    if (gameImpl) {
      gameImpl.resetDuelScene(true);
    }
  }, [duelId, gameImpl]);

  useEffect(() => {
    if (gameImpl) {
      gameImpl.setDuelistSpeedFactor(context.settings.duelSpeedFactor);
    }
  }, [context.settings.duelSpeedFactor, gameImpl]);
  
  // Handle tutorial visibility
  useEffect(() => {
    if (didTutorialRun.current) return;
    
    if (!context.leftDuelist?.id || !context.rightDuelist?.id) {
      return;
    }
    
    didTutorialRun.current = true;

    if (tutorialLevel !== DuelTutorialLevel.NONE && context.challenge.isTutorial) {
      tutorialOpener.open();
    } else {
      tutorialOpener.close();
    }
  }, [tutorialLevel, context.challenge.isTutorial, tutorialOpener, context.leftDuelist, context.rightDuelist]);

  // Set duel time percentage
  useEffect(() => {
    if (!gameImpl || !didSceneInit.current || !didPlayersInitA.current || !didPlayersInitB.current) {
      return;
    }

    if (gameImpl && context.challenge.timestampStart) {
      try {
        const SEVEN_DAYS = 7 * 24 * 60 * 60;
        let percentage = 0;
        
        const { timestampStart, timestampEnd, isAwaiting, isFinished } = context.challenge;
        const now = Date.now() / 1000;
        
        if (isAwaiting && timestampStart && timestampEnd) {
          const timePassed = now - timestampStart;
          const totalDuration = timestampEnd - timestampStart;
          percentage = Math.min(Math.max(timePassed / totalDuration, 0), 1);
        } else if (isFinished && timestampStart && timestampEnd) {
          const duelLength = timestampEnd - timestampStart;
          percentage = Math.min(Math.max(duelLength / SEVEN_DAYS, 0), 1);
        } else {
          const timePassed = now - timestampStart;
          percentage = Math.min(Math.max(timePassed / SEVEN_DAYS, 0), 1);
        }
        
        gameImpl.setDuelTimePercentage(percentage);
      } catch (error) {
        console.error("Error setting duel time percentage:", error);
      }
    }
  }, [gameImpl, context.challenge, didSceneInit.current, didPlayersInitA.current, didPlayersInitB.current]);

  // Main initialization effect
  useEffect(() => {
    const pollForData = () => {
      if (!gameImpl) {
        setTimeout(pollForData, 100);
        return;
      }
      
      // Initialize scene
      if (!didSceneInit.current) {
        try {          
          gameImpl.setDuelData(
            Number(duelId), 
            Number(context.leftDuelist.id), 
            Number(context.rightDuelist.id)
          );
          gameImpl.resetDuelScene(false);
          
          didSceneInit.current = true;
          
          setTimeout(() => {
            try {
              context.setSceneStarted(true);
              dispatchAnimated(AnimationState.None);
            } catch (e) {
              console.error("Error updating scene state:", e);
            }
          }, 10);
        } catch (error) {
          console.error("Error initializing scene:", error);
          didSceneInit.current = false;
          setTimeout(pollForData, 500);
        }
        return;
      }      
    };
    
    pollForData();
  }, [duelId, context, gameImpl, dispatchAnimated]);

  // Update left duelist info when it changes
  useEffect(() => {
    if (!gameImpl || !didSceneInit.current || !context.leftDuelist.id) return;
    
    // Skip delay if we already have initialized duelists
    const spawnDelay = didPlayersInitA.current ? 0 : 600;
    
    const timerA = setTimeout(() => {
      try {
        gameImpl.spawnDuelist(
          'A',
          context.leftDuelist.name,
          context.leftDuelist.characterType,
          context.leftDuelist.isYou
        );
        didPlayersInitA.current = true;
      } catch (error) {
        console.error("Error updating left duelist info:", error);
      }
    }, spawnDelay);
    
    return () => clearTimeout(timerA);
  }, [
    gameImpl, 
    context.leftDuelist.id,
    context.leftDuelist.name, 
    context.leftDuelist.characterType,
    context.leftDuelist.isYou,
    context.duelInProgress
  ]);

  useEffect(() => {
    if (animated == AnimationState.Round1) {
      gameImpl?.removeHighlightEffects();
    }
  }, [animated, gameImpl]);

  // Update right duelist info when it changes
  useEffect(() => {
    if (!gameImpl || !didSceneInit.current || !context.rightDuelist.id) return;
    
    // Skip delay if we already have initialized duelists
    const spawnDelay = didPlayersInitB.current ? 0 : 600;
    
    const timerB = setTimeout(() => {
      try {
        gameImpl.spawnDuelist(
          'B',
          context.rightDuelist.name,
          context.rightDuelist.characterType,
          context.rightDuelist.isYou
        );
        didPlayersInitB.current = true;
      } catch (error) {
        console.error("Error updating right duelist info:", error);
      }
    }, spawnDelay);
    
    return () => clearTimeout(timerB);
  }, [
    gameImpl, 
    context.rightDuelist.id,
    context.rightDuelist.name, 
    context.rightDuelist.characterType,
    context.rightDuelist.isYou,
    context.duelInProgress
  ]);

  useEffect(() => {
    setTimeout(() => {
      try {
        context.setDataSet(true);
      } catch (e) {
        console.error("Error updating data state:", e);
      }
    }, 1000);
  }, [didPlayersInitA.current, didPlayersInitB.current]);

  return null;
}; 