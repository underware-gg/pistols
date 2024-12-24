import React, { ReactNode, createContext, useReducer, useContext } from 'react'
import * as game from '/src/three/game'

type ThreeJsGame = typeof game;

//--------------------------------
// State
//
export const initialState = {
  game,
  gameImpl: null,
  audioLoaded: undefined,
}

type ThreeJsContextState = {
  game: ThreeJsGame
  gameImpl: ThreeJsGame | null
  audioLoaded: boolean | undefined
}

//--------------------------------
// Actions
//

const ThreeJsActions = {
  SET_GAME_IMPL: 'SET_GAME_IMPL',
  SET_LOADED_AUDIO_ASSETS: 'SET_LOADED_AUDIO_ASSETS',
}

type ActionType =
  | { type: 'SET_GAME_IMPL', payload: ThreeJsGame }
  | { type: 'SET_LOADED_AUDIO_ASSETS', payload: boolean }



//--------------------------------
// Context
//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

const ThreeJsContext = createContext<{
  state: ThreeJsContextState
  dispatch: React.Dispatch<any>
}>({
  state: initialState,
  dispatch: () => null,
})


//--------------------------------
// Provider
//
interface ThreeJsProviderProps {
  children: string | JSX.Element | JSX.Element[] | ReactNode
}
const ThreeJsProvider = ({
  children,
}: ThreeJsProviderProps) => {
  const [state, dispatch] = useReducer((state: ThreeJsContextState, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case ThreeJsActions.SET_GAME_IMPL: {
        newState.gameImpl = action.payload as ThreeJsGame
        break
      }
      case ThreeJsActions.SET_LOADED_AUDIO_ASSETS: {
        newState.audioLoaded = action.payload as boolean
        break
      }
      default:
        console.warn(`ThreeJsProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)

  return (
    <ThreeJsContext.Provider value={{ state, dispatch }}>
      {children}
    </ThreeJsContext.Provider>
  )
}

export { ThreeJsProvider, ThreeJsContext }


//--------------------------------
// Hooks
//

export const useThreeJsContext = () => {
  const context = useContext(ThreeJsContext)
  if (!context) throw new Error("The `useThreeJsContext` hook must be used within a `ThreeJsProvider`");
  const { state, dispatch } = context

  const dispatchGameImpl = (gameImpl: ThreeJsGame) => {
    dispatch({ type: ThreeJsActions.SET_GAME_IMPL, payload: gameImpl })
  }

  const dispatchLoadedAudioAssets = (loaded: boolean) => {
    dispatch({ type: ThreeJsActions.SET_LOADED_AUDIO_ASSETS, payload: loaded })
  }

  return {
    state,
    ...state,
    dispatchGameImpl,
    dispatchLoadedAudioAssets,
  }
}

