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
  Duelists = 'Duelists',
  Tavern = 'Tavern',
  YourDuels = 'Your Duels',
  LiveDuels = 'Live Duels',
  PastDuels = 'Past Duels',
  Duel = 'Duel',
}

export enum MenuKey {
  Duelists = SceneName.Duelists,
  YourDuels = SceneName.YourDuels,
  LiveDuels = SceneName.LiveDuels,
  PastDuels = SceneName.PastDuels,
}

const tavernMenuItems: MenuKey[] = [
  MenuKey.Duelists,
  MenuKey.YourDuels,
  MenuKey.LiveDuels,
  MenuKey.PastDuels,
]

export enum AccountMenuKey {
  Deploy = 'Deploy',
  Fund = 'Fund',
  Profile = 'Profile',
}

const accountMenuItems: AccountMenuKey[] = [
  AccountMenuKey.Deploy,
  AccountMenuKey.Fund,
  AccountMenuKey.Profile,
]

//--------------------------------
// State
//

export const initialState = {
  walletSig: { address: 0n, sig: 0n },
  accountIndex: 1,
  duelistAddress: 0n,
  duelId: 0n,
  menuKey: MenuKey.Duelists,
  accountMenuKey: AccountMenuKey.Deploy,
  sceneName: SceneName.Splash,
  // injected
  connectOpener: null as Opener,
  accountSetupOpener: null as Opener,
}

const PistolsActions = {
  SET_SIG: 'SET_SIG',
  SET_ACCOUNT_INDEX: 'SET_ACCOUNT_INDEX',
  SET_ACCOUNT_MENU_KEY: 'SET_ACCOUNT_MENU_KEY',
  SET_MENU_KEY: 'SET_MENU_KEY',
  SET_SCENE: 'SET_SCENE',
  SELECT_DUELIST: 'SELECT_DUELIST',
  SELECT_DUEL: 'SELECT_DUEL',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SIG', payload: bigint[] }
  | { type: 'SET_ACCOUNT_INDEX', payload: number }
  | { type: 'SET_ACCOUNT_MENU_KEY', payload: AccountMenuKey }
  | { type: 'SET_MENU_KEY', payload: MenuKey }
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'SELECT_DUELIST', payload: bigint }
  | { type: 'SELECT_DUEL', payload: bigint }



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
      case PistolsActions.SET_ACCOUNT_INDEX: {
        newState.accountIndex = action.payload as number
        break
      }
      case PistolsActions.SET_ACCOUNT_MENU_KEY: {
        newState.accountMenuKey = action.payload as AccountMenuKey
        break
      }
      case PistolsActions.SET_MENU_KEY: {
        newState.menuKey = action.payload as MenuKey
        newState.sceneName = action.payload as SceneName
        break
      }
      case PistolsActions.SET_SCENE: {
        newState.sceneName = action.payload as SceneName
        break
      }
      case PistolsActions.SELECT_DUELIST: {
        newState.duelistAddress = action.payload as bigint
        newState.duelId = 0n
        break
      }
      case PistolsActions.SELECT_DUEL: {
        newState.duelId = action.payload as bigint
        newState.duelistAddress = 0n
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
  const dispatchSetAccountIndex = (index: number) => {
    dispatch({
      type: PistolsActions.SET_ACCOUNT_INDEX,
      payload: index,
    })
  }
  const dispatchSetAccountMenu = (menuKey: AccountMenuKey) => {
    dispatch({
      type: PistolsActions.SET_ACCOUNT_MENU_KEY,
      payload: menuKey,
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
  const dispatchSelectDuelist = (address: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUELIST,
      payload: BigInt(address),
    })
  }
  const dispatchSelectDuel = (duelId: BigNumberish) => {
    dispatch({
      type: PistolsActions.SELECT_DUEL,
      payload: BigInt(duelId),
    })
  }
  return {
    ...state,
    hasSigned: (state.walletSig.sig > 0n),
    tavernMenuItems,
    accountMenuItems,
    atSplash: (state.sceneName == SceneName.Splash),
    atGate: (state.sceneName == SceneName.Gate),
    atTavern: (state.sceneName as string == state.menuKey as string),
    atDuelists: (state.sceneName == SceneName.Duelists),
    atYourDuels: (state.sceneName == SceneName.YourDuels),
    atLiveDuels: (state.sceneName == SceneName.LiveDuels),
    atPastDuels: (state.sceneName == SceneName.PastDuels),
    atDuel: (state.sceneName == SceneName.Duel),
    // PistolsActions,
    // dispatch,
    dispatchSetSig,
    dispatchSetAccountIndex,
    dispatchSetAccountMenu,
    dispatchSetMenu,
    dispatchSetScene,
    dispatchSelectDuelist,
    dispatchSelectDuel,
  }
}
