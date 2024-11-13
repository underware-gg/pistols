import React, { ReactNode, createContext, useReducer, useContext, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { BigNumberish, contractClassResponseToLegacyCompiledContract } from 'starknet'
import { Opener, useOpener } from '@/lib/ui/useOpener'
import { bigintToHex } from '@/lib/utils/types'
import { useSettings } from './SettingsContext'
import { TABLES } from '@/games/pistols/generated/constants'
import { CommitMoveMessage } from '../utils/salt'
import { poseidon } from '@/lib/utils/starknet'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// Constants
//

export enum SceneName {
  Gate = 'Gate',
  Profile = 'Profile',
  Tavern = 'Tavern',
  Barkeep = 'Barkeep',
  Duelists = 'Duelists',
  YourDuels = 'Your Duels',
  LiveDuels = 'Live Duels',
  PastDuels = 'Past Duels',
  Tournament = 'Tournament',
  IRLTournament = 'IRL Tournament',
  Duel = 'Duel',
}

const tavernMenuItems: SceneName[] = [
  SceneName.Duelists,
  SceneName.YourDuels,
  SceneName.LiveDuels,
  SceneName.PastDuels,
  SceneName.Tournament,
  SceneName.IRLTournament,
]

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
  challengingId: 0n,
  currentScene: undefined as SceneName,
  lastScene: undefined as SceneName,
  duelistsAnon: true,
  moves: {} as StoredMoves,
  // injected
  connectOpener: null as Opener,
  duelistEditOpener: null as Opener,
  tableOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_ACCOUNT_MENU_KEY: 'SET_ACCOUNT_MENU_KEY',
  SET_SCENE: 'SET_SCENE',
  SELECT_DUEL: 'SELECT_DUEL',
  SELECT_DUELIST_ID: 'SELECT_DUELIST_ID',
  SELECT_CHALLENGING_ID: 'SELECT_CHALLENGING_ID',
  SELECT_DUELISTS_ANON: 'SELECT_DUELISTS_ANON',
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
  | { type: 'SELECT_CHALLENGING_ID', payload: bigint }
  | { type: 'SELECT_DUELISTS_ANON', payload: boolean }
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
  const duelistEditOpener = useOpener()
  const tableOpener = useOpener()

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
        newState.challengingId = 0n
        break
      }
      case PistolsActions.SELECT_DUELIST_ID: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = action.payload as bigint
        newState.challengingId = 0n
        break
      }
      case PistolsActions.SELECT_CHALLENGING_ID: {
        newState.selectedDuelId = 0n
        newState.selectedDuelistId = 0n
        newState.challengingId = action.payload as bigint
        break
      }
      case PistolsActions.SELECT_DUELISTS_ANON: {
        newState.duelistsAnon = action.payload as boolean
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
      duelistEditOpener,
      tableOpener,
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
  const dispatchSelectDuelistId = (newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUELIST_ID,
      payload: BigInt(newId),
    })
  }
  const dispatchChallengingDuelistId = (newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_CHALLENGING_ID,
      payload: BigInt(newId),
    })
  }
  const dispatchSelectDuel = (newId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUEL,
      payload: BigInt(newId),
    })
  }
  const dispatchDuelistsAnon = (newAnon: boolean) => {
    dispatch({
      type: PistolsActions.SELECT_DUELISTS_ANON,
      payload: newAnon,
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
    tavernMenuItems,
    // PistolsActions,
    dispatch,
    dispatchSetSig,
    dispatchSelectDuel,
    dispatchSelectDuelistId,
    dispatchChallengingDuelistId,
    dispatchDuelistsAnon,
    dispatchSetMoves,
    makeStoredMovesKey,
    __dispatchSetScene, // used internally only
  }
}





//-------------------------------------
// Scenes
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
  // standalone scenes
  [SceneName.Profile]: { baseUrl: '/profile', title: 'Pistols - Profile' },
  // scenes with duelId
  [SceneName.Duel]: { baseUrl: '/duel/', hasDuelId: true, title: 'Pistols - Duel!' },
  // scenes with tableId
  [SceneName.Tavern]: { baseUrl: '/tavern/', hasTableId: true },
  [SceneName.Barkeep]: { baseUrl: '/tavern/', hasTableId: true },
  [SceneName.Duelists]: { baseUrl: '/balcony/', hasTableId: true, title: 'Pistols - Duelists' },
  [SceneName.YourDuels]: { baseUrl: '/duels/', hasTableId: true, title: 'Pistols - Your Duels' },
  [SceneName.LiveDuels]: { baseUrl: '/live/', hasTableId: true, title: 'Pistols - Live Duels' },
  [SceneName.PastDuels]: { baseUrl: '/graveyard/', hasTableId: true, title: 'Pistols - Past Duels' },
  [SceneName.Tournament]: { baseUrl: '/tournament/', hasTableId: true, title: 'Pistols - Tournament' },
  [SceneName.IRLTournament]: { baseUrl: '/tournament/', hasTableId: true, title: 'Pistols - IRL Tournament' },
  // '/' must be the last...
  [SceneName.Gate]: { baseUrl: '/' },
}

export const usePistolsScene = () => {
  const { currentScene, lastScene, selectedDuelId, dispatchSelectDuel, __dispatchSetScene } = usePistolsContext()
  const { tableId, dispatchTableId } = useSettings()

  const router = useRouter()
  const currentRoute = useMemo(() => (router.isReady ? router.asPath : null), [router])

  // setting a scene will only the url
  const dispatchSetScene = (newScene: SceneName, slugs?: string[]) => {
    let route = sceneRoutes[newScene]
    let url = route.baseUrl
    let slug = ''
    if (sceneRoutes[newScene].hasTableId) {
      slug = `${slugs?.[0] || tableId || TABLES.LORDS}`
      dispatchTableId(slug)
    } else if (sceneRoutes[newScene].hasDuelId) {
      slug = `${bigintToHex(slugs?.[0] || selectedDuelId)}`
      dispatchSelectDuel(slug)
    }
    url += slug
    if (url != currentRoute) {
      router.push(url)
    }
    __dispatchSetScene(newScene)
  }

  const sceneTitle = useMemo(() => (sceneRoutes[currentScene]?.title ?? 'Pistols at 10 Blocks'), [currentScene])

  return {
    currentScene,
    lastScene,
    sceneTitle,
    tavernMenuItems,
    // helpers
    atGate: (currentScene == SceneName.Gate),
    // atTavern: (currentScene == SceneName.Tavern || tavernMenuItems.includes(currentScene)),
    atTavern: (currentScene == SceneName.Tavern),
    atBarkeep: (currentScene == SceneName.Barkeep),
    atProfile: (currentScene == SceneName.Profile),
    atDuel: (currentScene == SceneName.Duel),
    fromGate: (lastScene == SceneName.Gate),
    // PistolsActions,
    dispatchSetScene,
  }
}

// use only once!!!!
export const usePistolsSceneRoute = () => {
  const { currentScene, dispatchSelectDuel, __dispatchSetScene } = usePistolsContext()
  const { dispatchTableId } = useSettings()

  const router = useRouter()
  const currentRoute = useMemo(() => (router.isReady ? router.asPath : null), [router])
  const routeSlugs = useMemo(() => (
    (router.isReady && router.query.main) ? router.query.main.slice(1) : []
  ), [router]) // only when /[slug] changes

  //------------------------------
  // Detect scene from route
  // works on page reloads and navigation
  //
  // console.log(`MAIN???`, mainPage, currentRoute)
  useEffect(() => {
    if (currentRoute) {
      const newScene = Object.keys(sceneRoutes).find(key => {
        return currentRoute.startsWith(sceneRoutes[key].baseUrl)
      }) as SceneName
      // console.log(`ROUTE [${currentRoute}] >> SCENE [${newScene}]`, router)
      if (newScene) {
        const route = sceneRoutes[newScene]
        __dispatchSetScene(newScene)
        if (route.hasTableId) {
          dispatchTableId(routeSlugs[0] || TABLES.LORDS)
        } else if (route.hasDuelId) {
          dispatchSelectDuel(routeSlugs[0] || '0x0')
        }
      } else {
        router.push('/')
      }
    }
  }, [currentRoute, routeSlugs])

  const sceneTitle = useMemo(() => (sceneRoutes[currentScene]?.title ?? 'Pistols at 10 Blocks'), [currentScene])

  return {}
}
