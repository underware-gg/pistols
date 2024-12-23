import React, { ReactNode, createContext, useReducer, useContext } from 'react'
import { AnimationState } from '@/three/game'


//--------------------------------
// State
//
export const initialState = {
  health: 100,
  animated: 0, //AnimationState.None
  animatedHealthA: false,
  animatedHealthB: false,
}

type GameplayContextState = typeof initialState

//--------------------------------
// Actions
//

const GameplayActions = {
  SET_ANIMATED: 'SET_ANIMATED',
  SET_HEALTH_A: 'SET_HEALTH_A',
  SET_HEALTH_B: 'SET_HEALTH_B',
}

type ActionType =
  | { type: 'SET_ANIMATED', payload: number }
  | { type: 'SET_HEALTH_A', payload: boolean }
  | { type: 'SET_HEALTH_B', payload: boolean }


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
      case GameplayActions.SET_HEALTH_A: {
        newState.animatedHealthA = action.payload as boolean
        break
      }
      case GameplayActions.SET_HEALTH_B: {
        newState.animatedHealthB = action.payload as boolean
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

  const dispatchAnimated = (animated: AnimationState) => {
    if (animated == AnimationState.HealthA) {
      dispatch({ type: GameplayActions.SET_HEALTH_A, payload: true })
    } else if (animated == AnimationState.HealthB) {
      dispatch({ type: GameplayActions.SET_HEALTH_B, payload: true })
    } else {
      dispatch({ type: GameplayActions.SET_ANIMATED, payload: animated })
      if (animated == AnimationState.None) {
        dispatch({ type: GameplayActions.SET_HEALTH_A, payload: false })
        dispatch({ type: GameplayActions.SET_HEALTH_B, payload: false })
      }
    }
  }

  return {
    state,
    ...state,
    dispatchAnimated,
  }
}

