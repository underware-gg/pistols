import React, { ReactNode, createContext, useReducer, useContext } from 'react'
import { BigNumberish } from 'starknet'
import { Opener, useOpener } from '@/lib/ui/useOpener'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// Constants
//

export enum SceneName {
  Splash = 'Splash',
  Gate = 'Gate',
  Profile = 'Profile',
  Duelists = 'Duelists',
  Tavern = 'Tavern',
  YourDuels = 'Your Duels',
  LiveDuels = 'Live Duels',
  PastDuels = 'Past Duels',
  Tournament = 'Tournament',
  IRLTournament = 'IRL Tournament',
  Duel = 'Duel',
}

export enum MenuKey {
  Duelists = SceneName.Duelists,
  YourDuels = SceneName.YourDuels,
  LiveDuels = SceneName.LiveDuels,
  PastDuels = SceneName.PastDuels,
  Tournament = SceneName.Tournament,
  IRLTournament = SceneName.IRLTournament,
}

const tavernMenuItems: MenuKey[] = [
  MenuKey.Duelists,
  MenuKey.YourDuels,
  MenuKey.LiveDuels,
  MenuKey.PastDuels,
  MenuKey.Tournament,
  MenuKey.IRLTournament,
]

//--------------------------------
// State
//

export const initialState = {
  walletSig: { address: 0n, sig: 0n },
  selectedDuelId: 0n,
  selectedDuelistId: 0n,
  challengingId: 0n,
  menuKey: MenuKey.Duelists,
  currentScene: SceneName.Splash,
  lastScene: undefined,
  duelistsAnon: true,
  // injected
  connectOpener: null as Opener,
  accountSetupOpener: null as Opener,
  tableOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_ACCOUNT_MENU_KEY: 'SET_ACCOUNT_MENU_KEY',
  SET_MENU_KEY: 'SET_MENU_KEY',
  SET_SCENE: 'SET_SCENE',
  SELECT_DUEL: 'SELECT_DUEL',
  SELECT_DUELIST_ID: 'SELECT_DUELIST_ID',
  SELECT_CHALLENGING_ID: 'SELECT_CHALLENGING_ID',
  SELECT_DUELISTS_ANON: 'SELECT_DUELISTS_ANON',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SIG', payload: bigint[] }
  | { type: 'SET_MENU_KEY', payload: MenuKey }
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'SELECT_DUEL', payload: bigint }
  | { type: 'SELECT_DUELIST_ID', payload: bigint }
  | { type: 'SELECT_CHALLENGING_ID', payload: bigint }
  | { type: 'SELECT_DUELISTS_ANON', payload: boolean }



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
  const accountSetupOpener = useOpener()
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
      case PistolsActions.SET_MENU_KEY: {
        newState.menuKey = action.payload as MenuKey
        newState.lastScene = newState.currentScene
        newState.currentScene = action.payload as SceneName
        break
      }
      case PistolsActions.SET_SCENE: {
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
      accountSetupOpener,
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

export const usePistolsContext = () => {
  const { state, dispatch } = useContext(PistolsContext)
  const dispatchSetSig = (address: BigNumberish | null, sig: BigNumberish | null) => {
    dispatch({
      type: PistolsActions.SET_SIG,
      payload: [BigInt(address ?? 0n), BigInt(sig ?? 0n)]
    })
  }
  const dispatchSetMenu = (menuKey: MenuKey) => {
    dispatch({
      type: PistolsActions.SET_MENU_KEY,
      payload: menuKey,
    })
  }
  const dispatchSetScene = (scene: SceneName | null) => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: scene != SceneName.Tavern ? scene : state.menuKey,
    })
  }
  const dispatchSetLastScene = () => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: state.lastScene ?? SceneName.Duelists,
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
  return {
    ...state,
    SceneName,
    hasSigned: (state.walletSig.sig > 0n),
    tavernMenuItems,
    atSplash: (state.currentScene == SceneName.Splash),
    atGate: (state.currentScene == SceneName.Gate),
    atProfile: (state.currentScene == SceneName.Profile),
    atTavern: (state.currentScene as string == state.menuKey as string),
    atDuelists: (state.currentScene == SceneName.Duelists),
    atYourDuels: (state.currentScene == SceneName.YourDuels),
    atLiveDuels: (state.currentScene == SceneName.LiveDuels),
    atPastDuels: (state.currentScene == SceneName.PastDuels),
    atTournament: (state.currentScene == SceneName.Tournament),
    atIRLTournament: (state.currentScene == SceneName.IRLTournament),
    atDuel: (state.currentScene == SceneName.Duel),
    // PistolsActions,
    // dispatch,
    dispatchSetSig,
    dispatchSetMenu,
    dispatchSetScene,
    dispatchSetLastScene,
    dispatchSelectDuel,
    dispatchSelectDuelistId,
    dispatchChallengingDuelistId,
    dispatchDuelistsAnon,
  }
}
