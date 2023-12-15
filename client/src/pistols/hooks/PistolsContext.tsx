import React, { ReactNode, createContext, useReducer, useContext } from 'react'

//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

//--------------------------------
// Constants
//
export const initialState = {
  duelId: 0n,
}

const PistolsActions = {
  SET_DUEL: 'SET_DUEL',
}


//--------------------------------
// Types
//
type PistolsContextStateType = {
  duelId: bigint
}

type ActionType =
  | { type: 'SET_DUEL', payload: bigint }



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
      case PistolsActions.SET_DUEL: {
        newState.duelId = action.payload as bigint
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
  const dispatchSetDuel = (duelId) => {
    dispatch({
      type: PistolsActions.SET_DUEL,
      payload: duelId,
    })
  }
  return {
    ...state,
    dispatch,
    PistolsActions,
    dispatchSetDuel,
  }
}

