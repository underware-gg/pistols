import React, { ReactNode, createContext, useReducer, useContext } from 'react'


type ThreeJsGame = any;

//--------------------------------
// State
//
export const initialState = {
  gameImpl: null,
  hasLoadedAudioAssets: undefined,
  health: 100,
  animated: null, // from three.js
}

type GameplayContextState = typeof initialState

//--------------------------------
// Actions
//

const GameplayActions = {
  SET_GAME_IMPL: 'SET_GAME_IMPL',
  SET_LOADED_AUDIO_ASSETS: 'SET_LOADED_AUDIO_ASSETS',
  SET_ANIMATED: 'SET_ANIMATED',
}

type ActionType =
  | { type: 'SET_GAME_IMPL', payload: ThreeJsGame }
  | { type: 'SET_LOADED_AUDIO_ASSETS', payload: boolean }
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
      case GameplayActions.SET_GAME_IMPL: {
        newState.gameImpl = action.payload as ThreeJsGame
        break
      }
      case GameplayActions.SET_LOADED_AUDIO_ASSETS: {
        newState.hasLoadedAudioAssets = action.payload as boolean
        break
      }
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

export { GameplayProvider, GameplayContext, GameplayActions }


//--------------------------------
// Hooks
//

export const useGameplayContext = () => {
  const context = useContext(GameplayContext)
  if (!context) throw new Error("The `useGameplayContext` hook must be used within a `GameplayProvider`");
  const { state, dispatch } = context

  const dispatchGameImpl = (gameImpl: ThreeJsGame) => {
    dispatch({ type: GameplayActions.SET_GAME_IMPL, payload: gameImpl })
  }

  const dispatchLoadedAudioAssets = (loaded: boolean) => {
    dispatch({ type: GameplayActions.SET_LOADED_AUDIO_ASSETS, payload: loaded })
  }

  const dispatchAnimated = (animated) => {
    dispatch({ type: GameplayActions.SET_ANIMATED, payload: animated })
  }

  return {
    state,
    ...state,
    dispatchGameImpl,
    dispatchLoadedAudioAssets,
    dispatchAnimated,
  }
}

