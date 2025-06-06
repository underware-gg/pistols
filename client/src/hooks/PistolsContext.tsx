import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect, useCallback, useState } from 'react'
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router'
import { BigNumberish } from 'starknet'
import { Opener, useOpener } from '/src/hooks/useOpener'
import { bigintToHex, bigintToDecimal, isPositiveBigint, bigintEquals } from '@underware/pistols-sdk/utils'
import { DuelTutorialLevel, tutorialScenes } from '/src/data/tutorialConstants'
import { SceneName } from '/src/data/assets'
import { SCENE_CHANGE_ANIMATION_DURATION } from '/src/three/game'

import { emitter } from '/src/three/game'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// State
//

type SelectionState = {
  duelId: bigint,
  duelistId: bigint,
  playerAddress: bigint,
  challengingAddress: bigint,
  challengingDuelistId: bigint,
}

export const initialState = {
  walletSig: { address: 0n, sig: 0n },
  // opening modals
  selectedDuelId: 0n,
  selectedDuelistId: 0n,
  selectedPlayerAddress: 0n,
  
  // new challenge modal
  challengingAddress: 0n,
  challengingDuelistId: 0n,

  // selection history stack
  selectionHistory: [] as Array<SelectionState>,

  currentDuel: 0n,
  currentScene: undefined as SceneName,
  tutorialLevel: undefined as DuelTutorialLevel,
  sceneStack: [] as SceneName[],
  // injected
  connectOpener: null as Opener,
  shopOpener: null as Opener,
  tutorialOpener: null as Opener,
  bookOpener: null as Opener,
  duelistSelectOpener: null as Opener,
  walletFinderOpener: null as Opener,
  settingsOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_SCENE: 'SET_SCENE',
  POP_SCENE: 'POP_SCENE',
  SET_DUEL: 'SET_DUEL',
  SELECT_DUEL: 'SELECT_DUEL',
  SELECT_DUELIST_ID: 'SELECT_DUELIST_ID',
  SELECT_PLAYER_ADDRESS: 'SELECT_PLAYER_ADDRESS',
  SELECT_CHALLENGING_ADDRESS: 'SELECT_CHALLENGING_ADDRESS',
  SELECT_CHALLENGING_DUELIST_ID: 'SELECT_CHALLENGING_DUELIST_ID',
  SET_TUTORIAL_LEVEL: 'SET_TUTORIAL_LEVEL',
  RESET_VALUES: 'RESET_VALUES',
  POP_SELECTION: 'POP_SELECTION',
  CLEAR_SELECTION_HISTORY: 'CLEAR_SELECTION_HISTORY',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SIG', payload: bigint[] }
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'POP_SCENE', payload: null }
  | { type: 'SET_DUEL', payload: bigint }
  | { type: 'SELECT_DUEL', payload: bigint }
  | { type: 'SELECT_DUELIST_ID', payload: bigint }
  | { type: 'SELECT_PLAYER_ADDRESS', payload: bigint }
  | { type: 'SELECT_CHALLENGING_ADDRESS', payload: bigint }
  | { type: 'SELECT_CHALLENGING_DUELIST_ID', payload: bigint }
  | { type: 'RESET_VALUES', payload: null }
  | { type: 'SET_TUTORIAL_LEVEL', payload: DuelTutorialLevel }
  | { type: 'POP_SELECTION', payload: null }
  | { type: 'CLEAR_SELECTION_HISTORY', payload: null }

//--------------------------------
// Context
//
const PistolsContext = createContext<{
  state: PistolsContextStateType
  dispatch: React.Dispatch<any>
}>({
  state: initialState,
  dispatch: () => null,
})

//--------------------------------
// Helper Functions
//

const shouldAddToHistory = (state: PistolsContextStateType): boolean => {
  return isPositiveBigint(state.selectedDuelId) || 
         isPositiveBigint(state.selectedDuelistId) || 
         isPositiveBigint(state.selectedPlayerAddress) || 
         isPositiveBigint(state.challengingAddress) ||
         isPositiveBigint(state.challengingDuelistId)
}

const addToHistory = (state: PistolsContextStateType, oldState: PistolsContextStateType): PistolsContextStateType => {
  state.selectionHistory = [...oldState.selectionHistory, {
    duelId: oldState.selectedDuelId,
    duelistId: oldState.selectedDuelistId,
    playerAddress: oldState.selectedPlayerAddress,
    challengingAddress: oldState.challengingAddress,
    challengingDuelistId: oldState.challengingDuelistId,
  }]

  return state
} 

const clearSelections = (state: PistolsContextStateType): PistolsContextStateType => {
  return {
    ...state,
    selectedDuelId: 0n,
    selectedDuelistId: 0n,
    selectedPlayerAddress: 0n,
    challengingAddress: 0n,
    challengingDuelistId: 0n,
  }
}

const restoreFromHistory = (state: PistolsContextStateType): PistolsContextStateType => {
  const lastSelection = state.selectionHistory[state.selectionHistory.length - 1]
  state.selectionHistory = state.selectionHistory.slice(0, -1)

  if (lastSelection.duelId) {
    state.selectedDuelId = lastSelection.duelId
  } else if (lastSelection.duelistId) {
    state.selectedDuelistId = lastSelection.duelistId
  } else if (lastSelection.playerAddress) {
    state.selectedPlayerAddress = lastSelection.playerAddress
  } else if (lastSelection.challengingAddress) {
    state.challengingAddress = lastSelection.challengingAddress
    if (lastSelection.challengingDuelistId) {
      state.challengingDuelistId = lastSelection.challengingDuelistId
    }
  }
  
  return state
}

//--------------------------------
// Provider
//
interface PistolsProviderProps {
  children: string | JSX.Element | JSX.Element[] | ReactNode
}
const PistolsProvider = ({
  children,
}: PistolsProviderProps) => {
  const connectOpener = useOpener()
  const shopOpener = useOpener()
  const tutorialOpener = useOpener()
  const bookOpener = useOpener()
  const duelistSelectOpener = useOpener()
  const walletFinderOpener = useOpener()
  const settingsOpener = useOpener()

  const [hasSearchParams, setHasSearchParams] = useState(false)

  const [state, dispatch] = useReducer((state: PistolsContextStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case PistolsActions.RESET_VALUES: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = 0n
        newState.selectedPlayerAddress = 0n
        newState.challengingAddress = 0n
        break
      }
      case PistolsActions.SET_SIG: {
        newState.walletSig = {
          address: action.payload[0] as bigint,
          sig: action.payload[1] as bigint,
        }
        break
      }
      case PistolsActions.SET_SCENE: {
        const newScene = action.payload as SceneName
        
        // For Tavern and Gate, reset stack to just that scene
        if (newScene === SceneName.Tavern || newScene === SceneName.Gate) {
          newState.sceneStack = [newScene]
        } else {
          // Check if scene already exists in stack
          const existingIndex = state.sceneStack.indexOf(newScene)
          if (existingIndex !== -1) {
            // If exists, remove everything after it
            newState.sceneStack = state.sceneStack.slice(0, existingIndex + 1)
          } else {
            // Otherwise add new scene to stack
            newState.sceneStack = [...state.sceneStack, newScene]
          }
        }
        newState.currentScene = newScene
        break
      }
      case PistolsActions.POP_SCENE: {
        if (state.sceneStack.length > 1) {
          newState.sceneStack = state.sceneStack.slice(0, -1)
          newState.currentScene = newState.sceneStack[newState.sceneStack.length - 1]
        }
        break
      }
      case PistolsActions.SET_DUEL: {
        newState.currentDuel = action.payload as bigint
        break
      }
      case PistolsActions.SELECT_DUEL: {
        const newDuelId = action.payload as bigint
        if (newDuelId !== 0n && newDuelId !== state.selectedDuelId && shouldAddToHistory(state)) {
          newState = addToHistory(newState, state)
        }
        newState = clearSelections(newState)
        newState.selectedDuelId = newDuelId

        if (newDuelId == 0n && state.selectionHistory.length > 0) {
          newState = restoreFromHistory(newState)
        }
        break
      }
      case PistolsActions.SELECT_DUELIST_ID: {        
        const newDuelistId = action.payload as bigint
        if (newDuelistId !== 0n && newDuelistId !== state.selectedDuelistId && shouldAddToHistory(state)) {
          newState = addToHistory(newState, state)
        }
        newState = clearSelections(newState)
        newState.selectedDuelistId = newDuelistId

        if (newDuelistId == 0n && state.selectionHistory.length > 0) {
          newState = restoreFromHistory(newState)
        }
        break
      }
      case PistolsActions.SELECT_PLAYER_ADDRESS: {
        const newPlayerAddress = action.payload as bigint
        if (newPlayerAddress !== 0n && newPlayerAddress !== state.selectedPlayerAddress && shouldAddToHistory(state)) {
          newState = addToHistory(newState, state)
        }
        newState = clearSelections(newState)
        newState.selectedPlayerAddress = newPlayerAddress

        if (newPlayerAddress == 0n && state.selectionHistory.length > 0) {
          newState = restoreFromHistory(newState)
        }
        break
      }
      case PistolsActions.SELECT_CHALLENGING_ADDRESS: {
        const newChallengingAddress = action.payload as bigint
        if (newChallengingAddress !== 0n && newChallengingAddress !== state.challengingAddress && shouldAddToHistory(state)) {
          newState = addToHistory(newState, state)
        }
        newState = clearSelections(newState)
        newState.challengingAddress = newChallengingAddress
        
        if (newChallengingAddress == 0n && state.selectionHistory.length > 0) {
          newState = restoreFromHistory(newState)
        }
        break
      }
      case PistolsActions.SELECT_CHALLENGING_DUELIST_ID: {
        newState.challengingDuelistId = action.payload as bigint
        break
      }
      case PistolsActions.SET_TUTORIAL_LEVEL: {
        newState.tutorialLevel = action.payload as DuelTutorialLevel
        break
      }
      case PistolsActions.POP_SELECTION: {
        const isOnDuel = state.selectedDuelId > 0n
        newState = clearSelections(newState)
        if (state.selectionHistory.length > 0) {
          newState = restoreFromHistory(newState)
        }
        if (isOnDuel) {
          clearSelections(newState)
          if (state.selectionHistory.length > 0) {
            newState = restoreFromHistory(newState)
          }
        }
        break
      }
      case PistolsActions.CLEAR_SELECTION_HISTORY: {
        newState.selectionHistory = []
        newState = clearSelections(newState)
        break
      }
      default:
        console.warn(`PistolsProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, {
    ...initialState,
    connectOpener,
    shopOpener,
    tutorialOpener,
    bookOpener,
    duelistSelectOpener,
    walletFinderOpener,
    settingsOpener,
  })

  emitter.on('searchParams', (data) => {
    setHasSearchParams(data)
  })

  useEffect(() => {
    const hasModalOpen = connectOpener.isOpen || 
                        shopOpener.isOpen || 
                        tutorialOpener.isOpen || 
                        bookOpener.isOpen || 
                        duelistSelectOpener.isOpen || 
                        walletFinderOpener.isOpen ||
                        settingsOpener.isOpen ||
                        hasSearchParams ||
                        (state.challengingAddress && state.challengingDuelistId)

    emitter.emit('hasModalOpen', hasModalOpen)
  }, [
    connectOpener.isOpen,
    shopOpener.isOpen, 
    tutorialOpener.isOpen,
    bookOpener.isOpen,
    duelistSelectOpener.isOpen,
    walletFinderOpener.isOpen,
    settingsOpener.isOpen,
    hasSearchParams,
    state.challengingAddress,
    state.challengingDuelistId
  ])


  return (
    <PistolsContext.Provider value={{ dispatch, state: {
      ...state,
      connectOpener,
      shopOpener,
      tutorialOpener,
      bookOpener,
      duelistSelectOpener,
      walletFinderOpener,
      settingsOpener,
    } }}>
      {children}
    </PistolsContext.Provider>
  )
}

export { PistolsProvider, PistolsContext, PistolsActions }


//--------------------------------
// Hooks
//

export const usePistolsContext = () => {
  const { state, dispatch } = useContext(PistolsContext)

  const dispatchSetSig = useCallback((address: BigNumberish | null, sig: BigNumberish | null) => {
    dispatch({
      type: PistolsActions.SET_SIG,
      payload: [BigInt(address ?? 0n), BigInt(sig ?? 0n)]
    })
  }, [dispatch])

  const dispatchSetDuel = useCallback((newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SET_DUEL,
      payload: BigInt(newId),
    })
  }, [dispatch])

  const dispatchSelectDuelistId = useCallback((newId: BigNumberish, playerAddress?: BigNumberish) => {
    if (!isPositiveBigint(newId) && isPositiveBigint(playerAddress)) {
      dispatch({
        type: PistolsActions.SELECT_PLAYER_ADDRESS,
        payload: BigInt(playerAddress),
      })
    } else {
      dispatch({
        type: PistolsActions.SELECT_DUELIST_ID,
        payload: BigInt(newId),
      })
    }
  }, [dispatch])

  const dispatchSelectPlayerAddress = useCallback((newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_PLAYER_ADDRESS,
      payload: BigInt(newId),
    })
  }, [dispatch])

  const dispatchChallengingPlayerAddress = useCallback((address: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_CHALLENGING_ADDRESS,
      payload: BigInt(address),
    })
  }, [dispatch])

  const dispatchChallengingDuelistId = useCallback((duelistId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_CHALLENGING_DUELIST_ID,
      payload: BigInt(duelistId),
    })
  }, [dispatch])

  const dispatchSelectDuel = useCallback((newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUEL,
      payload: BigInt(newId),
    })
  }, [dispatch])

  const dispatchSetTutorialLevel = useCallback((newLevel: DuelTutorialLevel) => {
    dispatch({
      type: PistolsActions.SET_TUTORIAL_LEVEL,
      payload: newLevel,
    })
  }, [dispatch])

  const dispatchPopSelection = useCallback(() => {
    dispatch({
      type: PistolsActions.POP_SELECTION,
      payload: null,
    })
  }, [dispatch])

  const dispatchClearSelectionHistory = useCallback(() => {
    dispatch({
      type: PistolsActions.CLEAR_SELECTION_HISTORY,
      payload: null,
    })
  }, [dispatch])

  const __dispatchSetScene = useCallback((newScene: SceneName) => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: newScene,
    })
  }, [dispatch])

  const __dispatchSceneBack = useCallback(() => {
    dispatch({
      type: PistolsActions.POP_SCENE,
      payload: null,
    })
  }, [dispatch])

  const __dispatchResetValues = useCallback(() => {
    dispatch({
      type: PistolsActions.RESET_VALUES,
      payload: null,
    })
  }, [dispatch])

  return {
    ...state,
    hasSigned: (state.walletSig.sig > 0n),
    lastScene: state.sceneStack[state.sceneStack.length - 2],
    hasSelectionHistory: state.selectionHistory.length > 0,
    // PistolsActions,
    dispatch,
    dispatchSetSig,
    dispatchSetDuel,
    dispatchSelectDuel,
    dispatchSelectDuelistId,
    dispatchSelectPlayerAddress,
    dispatchChallengingPlayerAddress,
    dispatchChallengingDuelistId,
    dispatchSetTutorialLevel,
    dispatchPopSelection,
    dispatchClearSelectionHistory,
    __dispatchSetScene, // used internally only
    __dispatchSceneBack, // used internally only
    __dispatchResetValues,  // used internally only
  }
}





//-------------------------------------
// Scene management
//

type SceneRoute = {
  baseUrl: string
  title?: string
  hasDuelId?: boolean
  // makeRoute: (state: PistolsContextStateType) => string
}

// !!! all routes need to be configured in main.tsx
export const sceneRoutes: Record<SceneName, SceneRoute> = {
  // main game scenes (no slugs)
  [SceneName.Door]: { baseUrl: '/door' },
  [SceneName.Tavern]: { baseUrl: '/tavern' },
  
  [SceneName.DuelistBook]: { baseUrl: '/profile/duelistbook', title: 'Pistols - Duelists' },
  [SceneName.CardPacks]: { baseUrl: '/profile/cardpacks', title: 'Pistols - Card Packs' },
  [SceneName.Profile]: { baseUrl: '/profile', title: 'Pistols - Profile' },

  [SceneName.Duelists]: { baseUrl: '/balcony', title: 'Pistols - Duelists' },
  [SceneName.DuelsBoard]: { baseUrl: '/duels', title: 'Pistols - Your Duels' },
  [SceneName.Leaderboards]: { baseUrl: '/leaderboards', title: 'Pistols - Leaderboards' },
  [SceneName.Graveyard]: { baseUrl: '/graveyard', title: 'Pistols - Past Duels' },
  [SceneName.Tournament]: { baseUrl: '/__tournament__', title: 'Pistols - Tournament' },
  [SceneName.IRLTournament]: { baseUrl: '/__irltournament__', title: 'Pistols - IRL Tournament' },
  
  // scenes with duelId
  [SceneName.Duel]: { baseUrl: '/duel', hasDuelId: true, title: 'Pistols - Duel!' },
  
  // tutorial scenes
  [SceneName.Tutorial]: { baseUrl: '/tutorial/entry', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene2]: { baseUrl: '/tutorial/conflict', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene3]: { baseUrl: '/tutorial/barkeep', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene4]: { baseUrl: '/tutorial/demon', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene5]: { baseUrl: '/tutorial/resurrection', title: 'Pistols - Tutorial' },
  [SceneName.TutorialDuel]: { baseUrl: '/tutorial/duel', hasDuelId: true, title: 'Pistols - Tutorial' },
  
  // '/' must be the last...
  [SceneName.Gate]: { baseUrl: '/' },
}


//
// Scene <> URL sync
//
// A: Game loads from URL > read URL PATH and PARAMS to game context
//    > usePistolsSceneFromRoute()
//    > useSyncRouterParams()
// B: Game SCENE changes > update URL PATH
//    > usePistolsScene()
// C: Game CONTEXT changes (selected duel, etc.) > update URL params
//    > useSyncRouterParams()
// D: Browser BACK button > same as A
//
type SceneSlug = {
  duelId?: BigNumberish,
}
export const usePistolsScene = () => {
  const { currentScene, sceneStack, selectedDuelId, currentDuel, dispatchSetDuel, __dispatchSetScene, __dispatchSceneBack, __dispatchResetValues } = usePistolsContext()

  const location = useLocation()
  const navigate = useNavigate()

  // setting a scene will only the url
  const dispatchSetScene = useCallback((newScene: SceneName, setSlug: SceneSlug = {}) => {
    let route = sceneRoutes[newScene]
    let url = route.baseUrl
    let slug = ''
    if (sceneRoutes[newScene].hasDuelId) {
      slug = `${bigintToDecimal(setSlug.duelId || currentDuel)}`
      if (!bigintEquals(slug, currentDuel)) {
        dispatchSetDuel(slug)
      }
    }
    url += slug ? `/${slug}` : ''
    if (url != location.pathname) {
      console.log(`navigate >>>>> [${location.pathname}] > [${url}]`)
      navigate(url)
    }
    setTimeout(() => {
      __dispatchResetValues()
    }, SCENE_CHANGE_ANIMATION_DURATION)
    __dispatchSetScene(newScene)
  }, [location.pathname, navigate, selectedDuelId])

  const dispatchSceneBack = useCallback(() => {
    if (sceneStack.length > 1) {
      const prevScene = sceneStack[sceneStack.length - 2]
      let route = sceneRoutes[prevScene]
      let url = route.baseUrl
      let slug = ''
      if (route.hasDuelId) {
        slug = `${bigintToDecimal(currentDuel)}`
      }
      url += slug ? `/${slug}` : ''
      if (url != location.pathname) {
        console.log(`navigate back >>>>> [${location.pathname}] > [${url}]`)
        navigate(url)
      }
      __dispatchSceneBack()
    } else {
      // If no previous scene, determine the appropriate base scene
      const baseScene = (currentScene === SceneName.Door || tutorialScenes.includes(currentScene as typeof tutorialScenes[number])) 
        ? SceneName.Gate 
        : SceneName.Tavern;
      
      dispatchSetScene(baseScene);
    }
  }, [sceneStack, location.pathname, navigate, currentDuel, currentScene])

  const sceneTitle = useMemo(() => (sceneRoutes[currentScene]?.title ?? 'Pistols at Dawn'), [currentScene])

  return {
    currentScene,
    sceneStack,
    lastScene: sceneStack[sceneStack.length - 2],
    wasLastSceneTutorial: tutorialScenes.includes(sceneStack[sceneStack.length - 2] as typeof tutorialScenes[number]),
    sceneTitle,
    // helpers
    atGate: (currentScene == SceneName.Gate),
    atDoor: (currentScene == SceneName.Door),
    atTavern: (currentScene == SceneName.Tavern),
    atProfile: (currentScene == SceneName.Profile),
    atCardPacks: (currentScene == SceneName.CardPacks),
    atDuelistBook: (currentScene == SceneName.DuelistBook),
    atDuelists: (currentScene == SceneName.Duelists),
    atDuelsBoard: (currentScene == SceneName.DuelsBoard),
    atLeaderboards: (currentScene == SceneName.Leaderboards),
    atGraveyard: (currentScene == SceneName.Graveyard),
    atDuel: (currentScene == SceneName.Duel || currentScene == SceneName.TutorialDuel),
    atTutorial: tutorialScenes.includes(currentScene as typeof tutorialScenes[number]),
    atTutorialScene1: (currentScene == SceneName.Tutorial),
    atTutorialScene2: (currentScene == SceneName.TutorialScene2),
    atTutorialScene3: (currentScene == SceneName.TutorialScene3),
    atTutorialScene4: (currentScene == SceneName.TutorialScene4),
    atTutorialScene5: (currentScene == SceneName.TutorialScene5),
    // PistolsActions,
    dispatchSetScene,
    dispatchSceneBack,
  }
}

// use only once!!!!
export const usePistolsSceneFromRoute = () => {
  const { dispatchSetDuel, __dispatchSetScene, currentScene } = usePistolsContext()

  // URL slugs (/path/slug)
  // https://api.reactrouter.com/v7/functions/react_router.useParams.html
  const params = useParams()
  
  const location = useLocation()
  // useEffect(() => console.log(`location >>>>>`, location.key, location), [location])

  //------------------------------
  // Detect scene from route
  // works on page reloads and navigation
  //
  useEffect(() => {
    // console.log(`ROUTE  >>>>>`, location, location.pathname, params)
    if (location.pathname) {
      const newScene = Object.keys(sceneRoutes).find(key => {
        return location.pathname.startsWith(sceneRoutes[key].baseUrl)
      }) as SceneName
      if (newScene && newScene != currentScene) {
        const route = sceneRoutes[newScene]
        if (route.baseUrl != currentScene) {
          __dispatchSetScene(newScene)
          if (route.hasDuelId) {
            dispatchSetDuel(params['duel_id'] || '0x0')
          }
        }
      }
    }
  }, [location.pathname, params])

  return {}
}

// use only once!!!!
export const useSyncRouterParams = () => {
  // URL params (/path?param=value)
  // https://api.reactrouter.com/v7/functions/react_router.useSearchParams.html
  const [searchParams, setSearchParams] = useSearchParams()

  // Log if there are any search params
  useEffect(() => {
    emitter.emit('searchParams', searchParams.toString().length > 0)
  }, [searchParams])

  //--------------------------------------------
  // URL Params > Game Context
  // cases: A, D
  const { 
    dispatchSelectDuel, 
    dispatchSelectDuelistId, 
    dispatchSelectPlayerAddress,
    dispatchChallengingPlayerAddress,
    dispatchChallengingDuelistId 
  } = usePistolsContext()
  
  useEffect(() => {
    if (searchParams.get('duel')) {
      dispatchSelectDuel(searchParams.get('duel'))
    } else if (searchParams.get('duelist')) {
      dispatchSelectDuelistId(searchParams.get('duelist'))
    } else if (searchParams.get('player')) {
      dispatchSelectPlayerAddress(searchParams.get('player'))
    } else if (searchParams.get('challenging_address')) {
      dispatchChallengingPlayerAddress(searchParams.get('challenging_address'))
      if (searchParams.get('challenging_duelist')) {
        dispatchChallengingDuelistId(searchParams.get('challenging_duelist'))
      }
    }
  }, [searchParams])

  //--------------------------------------------
  // Game Context > URL params
  // (for shareable urls, back button support)
  // cases: C
  //
  const { 
    currentScene, 
    selectedDuelId, 
    selectedDuelistId, 
    selectedPlayerAddress,
    challengingAddress,
    challengingDuelistId 
  } = usePistolsContext()
  
  useEffect(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams()
      if (selectedDuelId) {
        params.set('duel', bigintToDecimal(selectedDuelId))
      } else if (selectedDuelistId) {
        params.set('duelist', bigintToDecimal(selectedDuelistId))
      } else if (selectedPlayerAddress) {
        params.set('player', bigintToHex(selectedPlayerAddress))
      } else if (challengingAddress) {
        params.set('challenging_address', bigintToHex(challengingAddress))
        if (challengingDuelistId) {
          params.set('challenging_duelist', bigintToDecimal(challengingDuelistId))
        }
      }
      // console.log(`params >>>>>`, params)
      return params
    })
  }, [
    selectedDuelId, 
    selectedDuelistId, 
    selectedPlayerAddress,
    challengingAddress,
    challengingDuelistId
  ])

  return {}
}
