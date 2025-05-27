import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAccount } from '@starknet-react/core'
import { useMounted } from '@underware/pistols-sdk/utils/hooks'
import { useDojoSystemCalls } from '@underware/pistols-sdk/dojo'
import { useGetChallenge } from '/src/stores/challengeStore'
import { useDuelist } from '/src/stores/duelistStore'
import { checkIsDuelistCharacter, useIsMyAccount } from '/src/hooks/useIsYou'
import { useDuelProgress } from '/src/hooks/usePistolsContractCalls'
import { useDuelCallToAction } from '/src/stores/eventsModelStore'
import { DuelStage, useAnimatedDuel } from '/src/hooks/useDuel'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { CharacterType } from '/src/data/assets'
import { useSettings } from '/src/hooks/SettingsContext'

export type DuelistState = {
  damage: number, 
  hitChance: number, 
  health: number,
  shotPaces: number, 
  dodgePaces: number,
}

export type DuelistInfo = {
  id: bigint,
  address: bigint,
  name: string,
  characterType: CharacterType,
  isYou: boolean,
  isCharacter: boolean,
  isPlayerCharacter: boolean,
}

export type DuelContextState = {
  duelId: bigint,
  isTutorial: boolean,
  isLoading: boolean,
  areDuelistsLoaded: boolean,
  isSceneStarted: boolean,
  isDataSet: boolean,
  isPlaying: boolean,
  duelInProgress: boolean,
  isYouA: boolean,
  isYouB: boolean,
  swapSides: boolean | undefined,
  duelStage: DuelStage,
  completedStagesLeft: Record<number, boolean>,
  completedStagesRight: Record<number, boolean>,
  canAutoRevealLeft: boolean,
  canAutoRevealRight: boolean,
  leftDuelist: DuelistInfo,
  rightDuelist: DuelistInfo,
  statsLeft: DuelistState,
  statsRight: DuelistState,
  settings: {
    duelSpeedFactor: number,
    debugMode: boolean,
  },
  challenge: {
    timestampStart: number,
    timestampEnd: number,
    isTutorial: boolean,
    isAwaiting: boolean, 
    isInProgress: boolean,
    isFinished: boolean,
    isExpired: boolean,
    isCanceled: boolean,
  },
  duelProgress: any,
  hasWithdrawnOrAbandoned: boolean,
  positionToAB: (position: 'left' | 'right') => 'a' | 'b',
  setSceneStarted: (value: boolean) => void,
  setDataSet: (value: boolean) => void,
  setDuelInProgress: (value: boolean) => void,
  setIsPlaying: (value: boolean) => void,
  setStatsLeft: React.Dispatch<React.SetStateAction<DuelistState>>,
  setStatsRight: React.Dispatch<React.SetStateAction<DuelistState>>,
  clearActionFlag: () => void,
  resetStats: () => void,
  setDuelistsLoaded: (value: boolean) => void,
}

const defaultState: DuelistState = {
  damage: 0, 
  hitChance: 0, 
  health: 3,
  shotPaces: undefined, 
  dodgePaces: undefined,
}

// Empty duelist info for initialization
const emptyDuelistInfo: DuelistInfo = {
  id: BigInt(0),
  address: BigInt(0),
  name: "",
  characterType: null,
  isYou: false,
  isCharacter: false,
  isPlayerCharacter: false,
}

// Default empty challenge
const defaultChallenge = {
  timestampStart: 0,
  timestampEnd: 0, 
  isTutorial: false,
  isAwaiting: false,
  isInProgress: false,
  isFinished: false,
  isExpired: false,
  isCanceled: false
}

const duelSettings = {
  duelSpeedFactor: 1,
  debugMode: false,
}

// Default empty completed stages
const defaultCompletedStages = {}

// Create a stable empty function for initialization
const noop = () => {};

// Create the context with default values to avoid null checks
const DuelContext = createContext<DuelContextState>({
  duelId: BigInt(0),
  isTutorial: false,
  isLoading: true,
  isSceneStarted: false,
  isDataSet: false,
  areDuelistsLoaded: false,
  isPlaying: true,
  duelInProgress: false,
  isYouA: false,
  isYouB: false,
  swapSides: undefined,
  duelStage: 0,
  completedStagesLeft: {},
  completedStagesRight: {},
  canAutoRevealLeft: false,
  canAutoRevealRight: false,
  leftDuelist: emptyDuelistInfo,
  rightDuelist: emptyDuelistInfo,
  statsLeft: defaultState,
  statsRight: defaultState,
  settings: duelSettings,
  challenge: defaultChallenge,
  duelProgress: null,
  hasWithdrawnOrAbandoned: false,
  positionToAB: () => 'a',
  setSceneStarted: noop,
  setDataSet: noop,
  setDuelInProgress: noop,
  setIsPlaying: noop,
  setStatsLeft: noop,
  setStatsRight: noop,
  clearActionFlag: noop,
  resetStats: noop,
  setDuelistsLoaded: noop,
});

export const useDuelContext = () => useContext(DuelContext);

// Use a stable identity function for positionToAB
const createPositionToAB = (swapSides: boolean) => {
  return (position: 'left' | 'right'): 'a' | 'b' => {
    if (swapSides) {
      return position === 'left' ? 'b' : 'a';
    }
    return position === 'left' ? 'a' : 'b';
  };
};

// Global tracker to prevent repeated setup across renders
const StateTracker = {
  sceneStarted: false,
  dataSet: false,
  duelIds: new Set<string>()
};

export const DuelContextProvider: React.FC<{ 
  children: React.ReactNode, 
  duelId: bigint,
}> = ({ children, duelId }) => {
  // State tracking
  const stateUpdateCount = useRef({
    sceneStarted: 0,
    dataSet: 0
  });

  const { duelSpeedFactor, debugMode } = useSettings()
  
  // Get challenge data
  const { 
    duelistIdA, duelistIdB, 
    duelistAddressA, duelistAddressB, 
    timestampStart, timestampEnd, 
    isTutorial, isAwaiting, isInProgress, isFinished,
    isExpired, isCanceled
  } = useGetChallenge(duelId);

  useEffect(() => {
    console.log('duelId', duelId,  duelistIdA, duelistIdB, 
    duelistAddressA, duelistAddressB, 
    timestampStart, timestampEnd, 
    isTutorial, isAwaiting, isInProgress, isFinished,
    isExpired, isCanceled)
  }, [duelId, duelistIdA, duelistIdB, 
    duelistAddressA, duelistAddressB, 
    timestampStart, timestampEnd, 
    isTutorial, isAwaiting, isInProgress, isFinished,
    isExpired, isCanceled])

  // Get duelist data
  const duelistA = useDuelist(duelistIdA);
  const duelistB = useDuelist(duelistIdB);
  
  // This is the critical part - directly check if the addresses match using isAddressMine
  // This is much faster and more reliable than the previous approach
  const { isMyAccount: isYouA } = useIsMyAccount(duelistAddressA);
  const { isMyAccount: isYouB } = useIsMyAccount(duelistAddressB);
  
  // Determine if we need to swap sides - true if duelist B is the user's duelist
  const swapSides = useMemo(() => isYouB, [isYouB]);
  
  // First mount tracking
  const isFirstMount = useRef(true);
  
  // Reset state tracking for new duels
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!StateTracker.duelIds.has(duelId.toString())) {
        StateTracker.duelIds.add(duelId.toString());
        StateTracker.sceneStarted = false;
        StateTracker.dataSet = false;
      }
    }
    
    return () => {};
  }, [duelId]);

  // Component state - use refs to limit render cycles where possible
  const [isSceneStarted, _setSceneStarted] = useState(StateTracker.sceneStarted);
  const [isDataSet, _setDataSet] = useState(StateTracker.dataSet);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duelInProgress, setDuelInProgress] = useState(false);
  const [statsLeft, setStatsLeft] = useState<DuelistState>(defaultState);
  const [statsRight, setStatsRight] = useState<DuelistState>(defaultState);
  const [areDuelistsLoaded, setDuelistsLoaded] = useState(false);
  // Create safe setters that prevent unnecessary state updates
  const setSceneStarted = useCallback((value: boolean) => {
    // Never set to false once it's been true
    if (value === false && isSceneStarted) {
      return;
    }
    
    // Only set true once
    if (value === true && !StateTracker.sceneStarted) {
      stateUpdateCount.current.sceneStarted++;
      StateTracker.sceneStarted = true;
      _setSceneStarted(true);
    }
  }, [isSceneStarted]);
  
  const setDataSet = useCallback((value: boolean) => {
    // Never set to false once it's been true
    if (value === false && isDataSet) {
      return;
    }
    
    // Only set true once
    if (value === true && !StateTracker.dataSet) {
      stateUpdateCount.current.dataSet++;
      StateTracker.dataSet = true;
      _setDataSet(true);
    }
  }, [isDataSet]);

  // For action flags - wrap in a stable callback
  const { account } = useAccount();
  const { game } = useDojoSystemCalls();
  const isRequired = useDuelCallToAction(duelId);

  // Get duel progress - use useMemo to prevent unnecessary re-renders
  const duelProgressData = useDuelProgress(duelId);
  const { duelProgress, isLoading } = duelProgressData;

  // Animated duel state - only re-compute when the scene is started
  const animatedDuelState = useAnimatedDuel(duelId, isSceneStarted);
  const {
    duelStage = 0,
    completedStagesA = defaultCompletedStages, 
    completedStagesB = defaultCompletedStages,
    canAutoRevealA = false, 
    canAutoRevealB = false,
  } = animatedDuelState || {};

  // Create a stable function to clear action flags
  const clearActionFlag = useCallback(() => {
    if ((isYouA || isYouB) && account && isRequired && isFinished) {
      if (isYouA) game.clear_call_to_action(account, duelistIdA);
      if (isYouB) game.clear_call_to_action(account, duelistIdB);
    }
  }, [isYouA, isYouB, account, isRequired, isFinished, game, duelistIdA, duelistIdB]);

  // Create a stable function to reset stats
  const resetStats = useCallback(() => {
    setStatsLeft(defaultState);
    setStatsRight(defaultState);
  }, []);

  // Only check for withdrawn state once, not on every render
  const hasWithdrawnOrAbandoned = useMemo(() => {
    if (!duelProgress) return false;
    
    // Check if hand data is missing for either duelist
    const handA = duelProgress.hand_a;
    const handB = duelProgress.hand_b;
    
    return (!handA || !handB || 
           handA.card_fire === constants.PacesCard.None ||
           handB.card_fire === constants.PacesCard.None);
  }, [duelProgress]);

  // Memoize the position converter
  const positionToAB = useMemo(() => createPositionToAB(swapSides), [swapSides]);

  // Memoize completed stages based on swapSides
  const completedStagesLeft = useMemo(() => 
    swapSides ? completedStagesB : completedStagesA,
  [swapSides, completedStagesA, completedStagesB]);
  
  const completedStagesRight = useMemo(() => 
    swapSides ? completedStagesA : completedStagesB,
  [swapSides, completedStagesA, completedStagesB]);
  
  // Memoize auto-reveal flags
  const canAutoRevealLeft = useMemo(() => 
    swapSides ? canAutoRevealB : canAutoRevealA,
  [swapSides, canAutoRevealA, canAutoRevealB]);
  
  const canAutoRevealRight = useMemo(() => 
    swapSides ? canAutoRevealA : canAutoRevealB,
  [swapSides, canAutoRevealA, canAutoRevealB]);

  const isCharacterA = checkIsDuelistCharacter(duelistIdA).isCharacter
  const isCharacterB = checkIsDuelistCharacter(duelistIdB).isCharacter
  const isPlayerCharacterA = checkIsDuelistCharacter(duelistIdA).isPlayerCharacter
  const isPlayerCharacterB = checkIsDuelistCharacter(duelistIdB).isPlayerCharacter

  // Prepare duelist information - only recompute when necessary
  const leftDuelist = useMemo(() => ({
    id: swapSides ? duelistIdB : duelistIdA,
    address: swapSides ? duelistAddressB : duelistAddressA,
    name: swapSides ? duelistB.name : duelistA.name,
    characterType: swapSides ? duelistB.characterType : duelistA.characterType,
    isYou: swapSides ? isYouB : isYouA,
    isCharacter: swapSides ? isCharacterB : isCharacterA,
    isPlayerCharacter: swapSides ? isPlayerCharacterB : isPlayerCharacterA,
  }), [
    swapSides, 
    duelistIdA, duelistIdB, 
    duelistAddressA, duelistAddressB, 
    duelistA.name, duelistB.name, 
    duelistA.characterType, duelistB.characterType, 
    isYouA, isYouB
  ]);

  const rightDuelist = useMemo(() => ({
    id: swapSides ? duelistIdA : duelistIdB,
    address: swapSides ? duelistAddressA : duelistAddressB,
    name: swapSides ? duelistA.name : duelistB.name,
    characterType: swapSides ? duelistA.characterType : duelistB.characterType,
    isYou: swapSides ? isYouA : isYouB,
    isCharacter: swapSides ? isCharacterA : isCharacterB,
    isPlayerCharacter: swapSides ? isPlayerCharacterA : isPlayerCharacterB,
  }), [
    swapSides, 
    duelistIdA, duelistIdB, 
    duelistAddressA, duelistAddressB, 
    duelistA.name, duelistB.name, 
    duelistA.characterType, duelistB.characterType,
    isYouA, isYouB
  ]);

  // Create the context value as a memoized object to prevent unnecessary re-renders
  const contextValue = useMemo<DuelContextState>(() => ({
    duelId,
    isTutorial: isTutorial || false,
    isLoading,
    isSceneStarted,
    isDataSet,
    areDuelistsLoaded,
    isPlaying, 
    duelInProgress,
    isYouA,
    isYouB,
    swapSides,
    duelStage,
    completedStagesLeft,
    completedStagesRight,
    canAutoRevealLeft,
    canAutoRevealRight,
    leftDuelist: leftDuelist || emptyDuelistInfo,
    rightDuelist: rightDuelist || emptyDuelistInfo,
    statsLeft,
    statsRight,
    settings: {
      duelSpeedFactor,
      debugMode,
    },
    challenge: {
      timestampStart: timestampStart || 0,
      timestampEnd: timestampEnd || 0,
      isTutorial: isTutorial || false,
      isAwaiting: isAwaiting || false,
      isInProgress: isInProgress || false,
      isFinished: isFinished || false,
      isExpired: isExpired || false,
      isCanceled: isCanceled || false,
    },
    duelProgress,
    hasWithdrawnOrAbandoned,
    positionToAB,
    setSceneStarted,
    setDataSet,
    setDuelInProgress,
    setIsPlaying,
    setStatsLeft,
    setStatsRight,
    clearActionFlag,
    resetStats,
    setDuelistsLoaded,
  }), [
    duelId, isTutorial, isLoading, isSceneStarted, isDataSet, isPlaying, duelInProgress,
    swapSides, duelStage, completedStagesLeft, completedStagesRight,
    canAutoRevealLeft, canAutoRevealRight, leftDuelist, rightDuelist,
    statsLeft, statsRight, duelProgress, hasWithdrawnOrAbandoned,
    positionToAB, setSceneStarted, setDataSet, setDuelInProgress, setIsPlaying,
    setStatsLeft, setStatsRight, clearActionFlag, resetStats, setDuelistsLoaded,
    timestampStart, timestampEnd, isAwaiting, isInProgress, isFinished, isExpired, isCanceled,
    areDuelistsLoaded,
  ]);

  return (
    <DuelContext.Provider value={contextValue}>
      {children}
    </DuelContext.Provider>
  );
} 