import React, { ReactNode, createContext, useReducer, useContext } from 'react'

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

export const initialState = {
  duelistAddress: 0n,
  duelId: 0n,
  menuKey: MenuKey.YourDuels,
  sceneName: SceneName.Splash,
}

const PistolsActions = {
  SET_SCENE: 'SET_SCENE',
  SET_MENU_KEY: 'SET_MENU_KEY',
  SELECT_DUELIST: 'SELECT_DUELIST',
  SELECT_DUEL: 'SELECT_DUEL',
}


//--------------------------------
// Types
//
type PistolsContextStateType = typeof initialState

type ActionType =
  | { type: 'SET_SCENE', payload: SceneName }
  | { type: 'SET_MENU_KEY', payload: MenuKey }
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
  const [state, dispatch] = useReducer((state: PistolsContextStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case PistolsActions.SET_SCENE: {
        newState.sceneName = action.payload as SceneName
        break
      }
      case PistolsActions.SET_MENU_KEY: {
        newState.menuKey = action.payload as MenuKey
        newState.sceneName = action.payload as SceneName
        break
      }
      case PistolsActions.SELECT_DUELIST: {
        newState.duelistAddress = BigInt(action.payload)
        newState.duelId = 0n
        break
      }
      case PistolsActions.SELECT_DUEL: {
        newState.duelId = BigInt(action.payload)
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
    <PistolsContext.Provider value={{ state, dispatch }}>
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
  const dispatchSetScene = (scene: SceneName | null) => {
    dispatch({
      type: PistolsActions.SET_SCENE,
      payload: scene != SceneName.Tavern ? scene : state.menuKey,
    })
  }
  const dispatchSetMenu = (menuKey: MenuKey) => {
    dispatch({
      type: PistolsActions.SET_MENU_KEY,
      payload: menuKey,
    })
  }
  const dispatchSelectDuelist = (address: bigint) => {
    dispatch({
      type: PistolsActions.SELECT_DUELIST,
      payload: address,
    })
  }
  const dispatchSelectDuel = (duelId: bigint) => {
    dispatch({
      type: PistolsActions.SELECT_DUEL,
      payload: duelId,
    })
  }
  return {
    ...state,
    tavernMenuItems,
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
    dispatchSetScene,
    dispatchSetMenu,
    dispatchSelectDuelist,
    dispatchSelectDuel,
  }
}
