import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router'
import { BigNumberish } from 'starknet'
import { Opener, useOpener } from '/src/hooks/useOpener'
import { bigintToHex, bigintToDecimal, isPositiveBigint, poseidon, bigintEquals } from '@underware_gg/pistols-sdk/utils'
import { CommitMoveMessage } from '/src/utils/salt'
import { DuelTutorialLevel, tutorialScenes } from '/src/data/tutorialConstants'
import { SceneName } from '/src/data/assets'
import { useTableId } from '../stores/configStore'
import { SCENE_CHANGE_ANIMATION_DURATION } from '../three/game'

import { emitter } from '../three/game'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// State
//

type StoredMoves = {
  [key: string]: {
    moves: number[]
    salt: bigint
  }
}

export const initialState = {
  walletSig: { address: 0n, sig: 0n },
  selectedDuelId: 0n,
  selectedDuelistId: 0n,
  selectedPlayerAddress: 0n,
  challengingAddress: 0n,
  currentDuel: 0n,
  currentScene: undefined as SceneName,
  tutorialLevel: undefined as DuelTutorialLevel,
  lastScene: undefined as SceneName,
  moves: {} as StoredMoves,
  // injected
  connectOpener: null as Opener,
  shopOpener: null as Opener,
  tutorialOpener: null as Opener,
  bookOpener: null as Opener,
  cardPackOpener: null as Opener,
  tableOpener: null as Opener,
  walletFinderOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_SCENE: 'SET_SCENE',
  SET_DUEL: 'SET_DUEL',
  SELECT_DUEL: 'SELECT_DUEL',
  SELECT_DUELIST_ID: 'SELECT_DUELIST_ID',
  SELECT_PLAYER_ADDRESS: 'SELECT_PLAYER_ADDRESS',
  SELECT_CHALLENGING_ADDRESS: 'SELECT_CHALLENGING_ADDRESS',
  SET_MOVES: 'SET_MOVES',
  SET_TUTORIAL_LEVEL: 'SET_TUTORIAL_LEVEL',
  RESET_VALUES: 'RESET_VALUES',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SIG', payload: bigint[] }
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'SET_DUEL', payload: bigint }
  | { type: 'SELECT_DUEL', payload: bigint }
  | { type: 'SELECT_DUELIST_ID', payload: bigint }
  | { type: 'SELECT_PLAYER_ADDRESS', payload: bigint }
  | { type: 'SELECT_CHALLENGING_ADDRESS', payload: bigint }
  | { type: 'SET_MOVES', payload: StoredMoves }
  | { type: 'RESET_VALUES', payload: null }
  | { type: 'SET_TUTORIAL_LEVEL', payload: DuelTutorialLevel }

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
  const cardPackOpener = useOpener()
  const tableOpener = useOpener()
  const walletFinderOpener = useOpener()

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
        newState.lastScene = state.currentScene
        newState.currentScene = action.payload as SceneName
        break
      }
      case PistolsActions.SET_DUEL: {
        newState.currentDuel = action.payload as bigint
        break
      }
      case PistolsActions.SELECT_DUEL: {
        newState.selectedDuelId = action.payload as bigint
        newState.selectedDuelistId = 0n
        newState.selectedPlayerAddress = 0n
        newState.challengingAddress = 0n
        break
      }
      case PistolsActions.SELECT_DUELIST_ID: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = action.payload as bigint
        newState.selectedPlayerAddress = 0n
        newState.challengingAddress = 0n
        break
      }
      case PistolsActions.SELECT_PLAYER_ADDRESS: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = 0n
        newState.selectedPlayerAddress = action.payload as bigint
        newState.challengingAddress = 0n
        break
      }
      case PistolsActions.SELECT_CHALLENGING_ADDRESS: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = 0n
        newState.selectedPlayerAddress = 0n
        newState.challengingAddress = action.payload as bigint
        break
      }
      case PistolsActions.SET_MOVES: {
        const newMove = action.payload as StoredMoves
        newState.moves = { ...state.moves, ...newMove }
        break
      }
      case PistolsActions.SET_TUTORIAL_LEVEL: {
        newState.tutorialLevel = action.payload as DuelTutorialLevel
        break
      }
      default:
        console.warn(`PistolsProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)

  return (
    <PistolsContext.Provider value={{ dispatch, state: {
      ...state,
      connectOpener,
      shopOpener,
      tutorialOpener,
      bookOpener,
      cardPackOpener,
      tableOpener,
      walletFinderOpener,
    } }}>
      {children}
    </PistolsContext.Provider>
  )
}

export { PistolsProvider, PistolsContext, PistolsActions }


//--------------------------------
// Hooks
//

const makeStoredMovesKey = (message: CommitMoveMessage): string => {
  return message ? bigintToHex(poseidon([message.duelId, message.duelistId])) : null
}

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

  const dispatchSetMoves = useCallback((message: CommitMoveMessage, moves: number[], salt: bigint ) => {
    const key = makeStoredMovesKey(message)
    if (!key) {
      console.warn(`dispatchSetMoves: Invalid message [${message}] [${salt}]`)
      return
    }
    dispatch({
      type: PistolsActions.SET_MOVES,
      payload: { [key]: { moves, salt } },
    })
  }, [dispatch])

  const __dispatchSetScene = useCallback((newScene: SceneName) => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: newScene,
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
    // PistolsActions,
    dispatch,
    dispatchSetSig,
    dispatchSetDuel,
    dispatchSelectDuel,
    dispatchSelectDuelistId,
    dispatchSelectPlayerAddress,
    dispatchChallengingPlayerAddress,
    dispatchSetMoves,
    makeStoredMovesKey,
    __dispatchSetScene, // used internally only
    __dispatchResetValues,  // used internally only
    dispatchSetTutorialLevel,
  }
}





//-------------------------------------
// Scene management
//

type SceneRoute = {
  baseUrl: string
  title?: string
  hasTableId?: boolean
  hasDuelId?: boolean
  // makeRoute: (state: PistolsContextStateType) => string
}

// !!! all routes need to be configured in main.tsx
export const sceneRoutes: Record<SceneName, SceneRoute> = {
  // scenes with tableId (optional)
  [SceneName.Door]: { baseUrl: '/door', hasTableId: true },
  [SceneName.Tavern]: { baseUrl: '/tavern', hasTableId: true },
  [SceneName.Profile]: { baseUrl: '/profile', hasTableId: true, title: 'Pistols - Profile' },
  [SceneName.Duelists]: { baseUrl: '/balcony', hasTableId: true, title: 'Pistols - Duelists' },
  [SceneName.DuelsBoard]: { baseUrl: '/duels', hasTableId: true, title: 'Pistols - Your Duels' },
  [SceneName.Leaderboards]: { baseUrl: '/leaderboards', hasTableId: true, title: 'Pistols - Leaderboards' },
  [SceneName.Graveyard]: { baseUrl: '/graveyard', hasTableId: true, title: 'Pistols - Past Duels' },
  [SceneName.Tournament]: { baseUrl: '/__tournament__', hasTableId: true, title: 'Pistols - Tournament' },
  [SceneName.IRLTournament]: { baseUrl: '/__irltournament__', hasTableId: true, title: 'Pistols - IRL Tournament' },
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
  tableId?: string,
  duelId?: BigNumberish,
}
export const usePistolsScene = () => {
  const { currentScene, lastScene, selectedDuelId, currentDuel, dispatchSetDuel, __dispatchSetScene, __dispatchResetValues } = usePistolsContext()
  const { tableId, isSeason, isTutorial } = useTableId()

  const location = useLocation()
  const navigate = useNavigate()

  // setting a scene will only the url
  const dispatchSetScene = useCallback((newScene: SceneName, setSlug: SceneSlug = {}) => {
    let route = sceneRoutes[newScene]
    let url = route.baseUrl
    let slug = ''
    if (sceneRoutes[newScene].hasTableId) {
      slug = setSlug.tableId ?? (tableId && !isSeason ? tableId : '')
    } else if (sceneRoutes[newScene].hasDuelId) {
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
  }, [location.pathname, navigate, selectedDuelId, tableId, isSeason])

  const sceneTitle = useMemo(() => (sceneRoutes[currentScene]?.title ?? 'Pistols at Dawn'), [currentScene])

  return {
    currentScene,
    lastScene,
    wasLastSceneTutorial: tutorialScenes.includes(lastScene as typeof tutorialScenes[number]),
    sceneTitle,
    // helpers
    atGate: (currentScene == SceneName.Gate),
    atDoor: (currentScene == SceneName.Door),
    atTavern: (currentScene == SceneName.Tavern),
    atProfile: (currentScene == SceneName.Profile),
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
  const { dispatchSelectDuel, dispatchSelectDuelistId, dispatchSelectPlayerAddress } = usePistolsContext()
  useEffect(() => {
    if (searchParams.get('duel')) {
      dispatchSelectDuel(searchParams.get('duel'))
    } else if (searchParams.get('duelist')) {
      dispatchSelectDuelistId(searchParams.get('duelist'))
    } else if (searchParams.get('player')) {
      dispatchSelectPlayerAddress(searchParams.get('player'))
    }
  }, [searchParams])

  //--------------------------------------------
  // Game Context > URL params
  // (for shareable urls, back button support)
  // cases: C
  //
  const { currentScene, selectedDuelId, selectedDuelistId, selectedPlayerAddress } = usePistolsContext()
  useEffect(() => {
    setSearchParams((prev) => {
      // const params = new URLSearchParams(prev)
      const params = new URLSearchParams()
      if (selectedDuelId) {
        if (currentScene != SceneName.Duel) {
          params.set('duel', bigintToDecimal(selectedDuelId))
        }
      } else if (selectedDuelistId) {
        params.set('duelist', bigintToDecimal(selectedDuelistId))
      } else if (selectedPlayerAddress) {
        params.set('player', bigintToHex(selectedPlayerAddress))
      }
      // console.log(`params >>>>>`, params)
      return params
    })
  }, [selectedDuelId, selectedDuelistId, selectedPlayerAddress])

  return {}
}
