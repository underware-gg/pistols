import React, { ReactNode, createContext, useReducer, useContext } from 'react'


//--------------------------------
// State
//
export const initialState = {
  health: 100,
  animated: null, // from three.js
}

type GameplayContextState = typeof initialState

//--------------------------------
// Actions
//

const GameplayActions = {
  SET_ANIMATED: 'SET_ANIMATED',
}

type ActionType =
  | { type: 'SET_ANIMATED', payload: number }


//--------------------------------
// Context
//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

const GameplayContext = createContext<{
  state: GameplayContextState
  dispatch: React.Dispatch<any>
}>({
  state: initialState,
  dispatch: () => null,
})

//--------------------------------
// Provider
//
interface GameplayProviderProps {
  children: string | JSX.Element | JSX.Element[] | ReactNode
}
const GameplayProvider = ({
  children,
}: GameplayProviderProps) => {
  const [state, dispatch] = useReducer((state: GameplayContextState, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case GameplayActions.SET_ANIMATED: {
        newState.animated = action.payload as number
        break
      }
      default:
        console.warn(`GameplayProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)

  return (
    <GameplayContext.Provider value={{ state, dispatch }}>
      {children}
    </GameplayContext.Provider>
  )
}

export { GameplayProvider, GameplayContext }


//--------------------------------
// Hooks
//

export const useGameplayContext = () => {
  const context = useContext(GameplayContext)
  if (!context) throw new Error("The `useGameplayContext` hook must be used within a `GameplayProvider`");
  const { state, dispatch } = context

  const dispatchAnimated = (animated) => {
    dispatch({ type: GameplayActions.SET_ANIMATED, payload: animated })
  }

  return {
    state,
    ...state,
    dispatchAnimated,
  }
}

