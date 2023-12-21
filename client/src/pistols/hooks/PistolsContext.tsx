import React, { ReactNode, createContext, useReducer, useContext } from 'react'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// Constants
//

export const menuItems = {
  Challenges: 'Challenges',
  Duelists: 'Duelists',
  Scoreboard: 'Scoreboard',
}

export const initialState = {
  duelistAddress: 0n,
  duelId: 0n,
  menuItem: menuItems.Challenges,
}

const PistolsActions = {
  SET_DUELIST: 'SET_DUELIST',
  SET_DUEL: 'SET_DUEL',
  SET_MENU_ITEM: 'SET_MENU_ITEM',
}


//--------------------------------
// Types
//
type PistolsContextStateType = {
  duelistAddress: bigint
  duelId: bigint
  menuItem: string
}

type ActionType =
  | { type: 'SET_DUELIST', payload: bigint }
  | { type: 'SET_DUEL', payload: bigint }
  | { type: 'SET_MENU_ITEM', payload: string }



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
        newState.menuItem = menuItems.Duelists
        newState.duelistAddress = action.payload as bigint
        newState.duelId = 0n
        break
      }
      case PistolsActions.SET_DUEL: {
        newState.menuItem = menuItems.Challenges
        newState.duelId = action.payload as bigint
        newState.duelistAddress = 0n
        break
      }
      case PistolsActions.SET_MENU_ITEM: {
        newState.menuItem = action.payload as string
        newState.duelistAddress = 0n
        newState.duelId = 0n
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
  const dispatchSetDuelist = (address) => {
    dispatch({
      type: PistolsActions.SET_DUELIST,
      payload: address,
    })
  }
  const dispatchSetDuel = (duelId) => {
    dispatch({
      type: PistolsActions.SET_DUEL,
      payload: duelId,
    })
  }
  const dispatchSetMenuItem = (menuItem) => {
    dispatch({
      type: PistolsActions.SET_MENU_ITEM,
      payload: menuItem,
    })
  }
  return {
    ...state,
    atDuelists: (state.menuItem == menuItems.Duelists),
    atDuels: (state.menuItem == menuItems.Challenges),
    atScoreboard: (state.menuItem == menuItems.Scoreboard),
    // PistolsActions,
    // dispatch,
    dispatchSetDuelist,
    dispatchSetDuel,
    dispatchSetMenuItem,
    dispatchSetMenuDuels: () => dispatchSetMenuItem(menuItems.Challenges),
    dispatchSetMenuDuelists: () => dispatchSetMenuItem(menuItems.Duelists),
  }
}

