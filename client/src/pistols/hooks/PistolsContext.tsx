import React, { ReactNode, createContext, useReducer, useContext } from 'react'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// Constants
//

export enum MenuKey {
  Duelists,
  YourDuels,
  LiveDuels,
  PastDuels,
}

const tavernMenuItems = {
  [MenuKey.Duelists]: 'Duelists',
  [MenuKey.YourDuels]: 'Your Duels',
  [MenuKey.LiveDuels]: 'Live Duels',
  [MenuKey.PastDuels]: 'Past Duels',
}

export const initialState = {
  duelistAddress: 0n,
  duelId: 0n,
  menuKey: MenuKey.YourDuels,
}

const PistolsActions = {
  SET_DUELIST: 'SET_DUELIST',
  SET_DUEL: 'SET_DUEL',
  SET_MENU_KEY: 'SET_MENU_KEY',
}


//--------------------------------
// Types
//
type PistolsContextStateType = {
  duelistAddress: bigint
  duelId: bigint
  menuKey: MenuKey
}

type ActionType =
  | { type: 'SET_DUELIST', payload: bigint }
  | { type: 'SET_DUEL', payload: bigint }
  | { type: 'SET_MENU_KEY', payload: MenuKey }



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
      case PistolsActions.SET_DUELIST: {
        newState.menuKey = MenuKey.Duelists
        newState.duelistAddress = BigInt(action.payload)
        newState.duelId = 0n
        break
      }
      case PistolsActions.SET_DUEL: {
        // newState.menuKey = MenuKey.LiveDuels
        newState.duelId = BigInt(action.payload)
        newState.duelistAddress = 0n
        break
      }
      case PistolsActions.SET_MENU_KEY: {
        newState.menuKey = action.payload as MenuKey
        if (newState.menuKey == MenuKey.Duelists) {
          newState.duelId = 0n
        }
        else {
          newState.duelistAddress = 0n
        }        
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
  const dispatchSetDuelist = (address: bigint) => {
    dispatch({
      type: PistolsActions.SET_DUELIST,
      payload: address,
    })
  }
  const dispatchSetMenu = (menuKey: MenuKey) => {
    dispatch({
      type: PistolsActions.SET_MENU_KEY,
      payload: menuKey,
    })
  }
  const dispatchSetDuel = (duelId: bigint, menuKey: MenuKey | null = null) => {
    dispatch({
      type: PistolsActions.SET_DUEL,
      payload: duelId,
    })
    if (state.menuKey == MenuKey.Duelists) {
      dispatchSetMenu(menuKey ?? MenuKey.YourDuels)
    }
  }
  return {
    ...state,
    tavernMenuItems,
    atDuelists: (state.menuKey == MenuKey.Duelists),
    atYourDuels: (state.menuKey == MenuKey.YourDuels),
    atLiveDuels: (state.menuKey == MenuKey.LiveDuels),
    atPastDuels: (state.menuKey == MenuKey.PastDuels),
    // PistolsActions,
    // dispatch,
    dispatchSetDuelist,
    dispatchSetDuel,
    dispatchSetMenu,
  }
}
