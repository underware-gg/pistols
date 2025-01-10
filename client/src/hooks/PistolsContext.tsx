import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router'
import { BigNumberish } from 'starknet'
import { Opener, useOpener } from '/src/hooks/useOpener'
import { bigintToHex, bigintToNumber, bigintToDecimal, isPositiveBigint, poseidon } from '@underware_gg/pistols-sdk/utils'
import { useSettings } from '/src/hooks/SettingsContext'
import { constants } from '@underware_gg/pistols-sdk/pistols'
import { CommitMoveMessage } from '/src/utils/salt'
import { tutorialScenes } from '/src/data/tutorialConstants'
import { SceneName } from '/src/data/assets'

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
  currentScene: undefined as SceneName,
  lastScene: undefined as SceneName,
  moves: {} as StoredMoves,
  // injected
  connectOpener: null as Opener,
  shopOpener: null as Opener,
  tableOpener: null as Opener,
  walletFinderOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_SCENE: 'SET_SCENE',
  SELECT_DUEL: 'SELECT_DUEL',
  SELECT_DUELIST_ID: 'SELECT_DUELIST_ID',
  SELECT_PLAYER_ADDRESS: 'SELECT_PLAYER_ADDRESS',
  SELECT_CHALLENGING_ADDRESS: 'SELECT_CHALLENGING_ADDRESS',
  SET_MOVES: 'SET_MOVES',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SIG', payload: bigint[] }
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'SELECT_DUEL', payload: bigint }
  | { type: 'SELECT_DUELIST_ID', payload: bigint }
  | { type: 'SELECT_PLAYER_ADDRESS', payload: bigint }
  | { type: 'SELECT_CHALLENGING_ADDRESS', payload: bigint }
  | { type: 'SET_MOVES', payload: StoredMoves }



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
  const tableOpener = useOpener()
  const walletFinderOpener = useOpener()

  const [state, dispatch] = useReducer((state: PistolsContextStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
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
  const dispatchSetSig = (address: BigNumberish | null, sig: BigNumberish | null) => {
    dispatch({
      type: PistolsActions.SET_SIG,
      payload: [BigInt(address ?? 0n), BigInt(sig ?? 0n)]
    })
  }
  const dispatchSelectDuelistId = (newId: BigNumberish, playerAddress?: BigNumberish) => {
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
  }
  const dispatchSelectPlayerAddress = (newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_PLAYER_ADDRESS,
      payload: BigInt(newId),
    })
  }
  const dispatchChallengingPlayerAddress = (address: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_CHALLENGING_ADDRESS,
      payload: BigInt(address),
    })
  }
  const dispatchSelectDuel = (newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUEL,
      payload: BigInt(newId),
    })
  }
  const dispatchSetMoves = (message: CommitMoveMessage, moves: number[], salt: bigint ) => {
    const key = makeStoredMovesKey(message)
    if (!key) {
      console.warn(`dispatchSetMoves: Invalid message [${message}] [${salt}]`)
      return
    }
    dispatch({
      type: PistolsActions.SET_MOVES,
      payload: { [key]: { moves, salt } },
    })
  }
  const __dispatchSetScene = (newScene: SceneName) => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: newScene,
    })
  }
  return {
    ...state,
    hasSigned: (state.walletSig.sig > 0n),
    // PistolsActions,
    dispatch,
    dispatchSetSig,
    dispatchSelectDuel,
    dispatchSelectDuelistId,
    dispatchSelectPlayerAddress,
    dispatchChallengingPlayerAddress,
    dispatchSetMoves,
    makeStoredMovesKey,
    __dispatchSetScene, // used internally only
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

export const sceneRoutes: Record<SceneName, SceneRoute> = {
  // !!! all routes need to be redirected in next.config.js
  [SceneName.Door]: { baseUrl: '/door' },
  // standalone scenes
  [SceneName.Profile]: { baseUrl: '/profile', title: 'Pistols - Profile' },
  // scenes with duelId
  [SceneName.Duel]: { baseUrl: '/duel/', hasDuelId: true, title: 'Pistols - Duel!' },
  // scenes with tableId
  [SceneName.Tavern]: { baseUrl: '/tavern/', hasTableId: true },
  [SceneName.Duelists]: { baseUrl: '/balcony/', hasTableId: true, title: 'Pistols - Duelists' },
  [SceneName.Duels]: { baseUrl: '/duels/', hasTableId: true, title: 'Pistols - Your Duels' },
  [SceneName.Graveyard]: { baseUrl: '/graveyard/', hasTableId: true, title: 'Pistols - Past Duels' },
  [SceneName.Tournament]: { baseUrl: '/__tournament__/', hasTableId: true, title: 'Pistols - Tournament' },
  [SceneName.IRLTournament]: { baseUrl: '/__irltournament__/', hasTableId: true, title: 'Pistols - IRL Tournament' },
  // tutorial scenes
  [SceneName.Tutorial]: { baseUrl: '/tutorial/entry', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene2]: { baseUrl: '/tutorial/conflict', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene3]: { baseUrl: '/tutorial/barkeep', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene4]: { baseUrl: '/tutorial/demon', title: 'Pistols - Tutorial' },
  [SceneName.TutorialScene5]: { baseUrl: '/tutorial/resurection', title: 'Pistols - Tutorial' },
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

export const usePistolsScene = () => {
  const { currentScene, lastScene, selectedDuelId, dispatchSelectDuel, __dispatchSetScene } = usePistolsContext()
  const { tableId, dispatchTableId } = useSettings()

  const location = useLocation()
  const navigate = useNavigate()

  // setting a scene will only the url
  const dispatchSetScene = useCallback((newScene: SceneName, slugs?: string[]) => {
    let route = sceneRoutes[newScene]
    let url = route.baseUrl
    let slug = ''
    if (sceneRoutes[newScene].hasTableId) {
      slug = `${slugs?.[0] || tableId || constants.TABLES.LORDS}`
      dispatchTableId(slug)
    } else if (sceneRoutes[newScene].hasDuelId) {
      slug = `${bigintToNumber(slugs?.[0] || selectedDuelId)}`
      dispatchSelectDuel(slug)
    }
    url += slug
    if (url != location.pathname) {
      console.log(`navigate >>>>> [${location.pathname}] > [${url}]`)
      navigate(url)
    }
    __dispatchSetScene(newScene)
  }, [location.pathname, navigate])

  const sceneTitle = useMemo(() => (sceneRoutes[currentScene]?.title ?? 'Pistols at 10 Blocks'), [currentScene])

  return {
    currentScene,
    lastScene,
    sceneTitle,
    // helpers
    atGate: (currentScene == SceneName.Gate),
    atDoor: (currentScene == SceneName.Door),
    atTavern: (currentScene == SceneName.Tavern),
    atProfile: (currentScene == SceneName.Profile),
    atDuelists: (currentScene == SceneName.Duelists),
    atDuels: (currentScene == SceneName.Duels),
    atGraveyard: (currentScene == SceneName.Graveyard),
    atDuel: (currentScene == SceneName.Duel),
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
  const { currentScene, dispatchSelectDuel, __dispatchSetScene } = usePistolsContext()
  const { dispatchTableId } = useSettings()

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
      // console.log(`ROUTE [${currentRoute}] >> SCENE [${newScene}]`, router)
      if (newScene && newScene != currentScene) {
        const route = sceneRoutes[newScene]
        __dispatchSetScene(newScene)
        if (route.hasTableId) {
          dispatchTableId(params['table_id'] || constants.TABLES.LORDS)
        } else if (route.hasDuelId) {
          dispatchSelectDuel(params['duel_id'] || '0x0')
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
