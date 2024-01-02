import React, { ReactNode, createContext, useReducer, useContext } from 'react'
import { MESSAGES } from '@/pistols/data/messages'

export enum GameState {
  Lobby = 'lobby',
  Ready = 'ready',
  Playing = 'playing',
}

type ThreeJsGame = any;

//--------------------------------
// State
//
export const initialState = {
  gameImpl: null,
  gameState: GameState.Lobby,
  hasInteracted: false,
  hasLoadedAudioAssets: undefined,
  message: null,
  health: 100,
  animated: null, // from three.js
}

type GameplayStateType = {
  gameImpl: ThreeJsGame
  gameState: GameState
  hasInteracted: boolean
  hasLoadedAudioAssets: boolean
  message: string
  health: number,
  animated: number,
}

//--------------------------------
// Actions
//

const GameplayActions = {
  SET_GAME_IMPL: 'SET_GAME_IMPL',
  SET_INTERACTED: 'SET_INTERACTED',
  SET_LOADED_AUDIO_ASSETS: 'SET_LOADED_AUDIO_ASSETS',
  SET_STATE: 'SET_STATE',
  SET_MESSAGE: 'SET_MESSAGE',
  SET_ANIMATED: 'SET_ANIMATED',
}

type ActionType =
  | { type: 'SET_GAME_IMPL', payload: ThreeJsGame }
  | { type: 'SET_INTERACTED', payload: boolean }
  | { type: 'SET_LOADED_AUDIO_ASSETS', payload: boolean }
  | { type: 'SET_STATE', payload: GameState }
  | { type: 'SET_MESSAGE', payload: string }
  | { type: 'SET_ANIMATED', payload: number }



//--------------------------------
// Context
//
// React + Typescript + Context
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context
//

const GameplayContext = createContext<{
  state: GameplayStateType
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
  const [state, dispatch] = useReducer((state: GameplayStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case GameplayActions.SET_GAME_IMPL: {
        newState.gameImpl = action.payload as ThreeJsGame
        break
      }
      case GameplayActions.SET_INTERACTED: {
        newState.hasInteracted = action.payload as boolean
        break
      }
      case GameplayActions.SET_LOADED_AUDIO_ASSETS: {
        newState.hasLoadedAudioAssets = action.payload as boolean
        break
      }
      case GameplayActions.SET_STATE: {
        newState.gameState = action.payload as GameState
        console.log(`>>> GAME STATE:`, newState.gameState)
        break
      }
      case GameplayActions.SET_MESSAGE: {
        newState.message = action.payload as string
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
  const { state, dispatch } = useContext(GameplayContext)

  const dispatchGameImpl = (gameImpl: ThreeJsGame) => {
    dispatch({ type: GameplayActions.SET_GAME_IMPL, payload: gameImpl })
  }

  const dispatchInteracted = () => {
    dispatch({ type: GameplayActions.SET_INTERACTED, payload: true })
  }

  const dispatchLoadedAudioAssets = (loaded: boolean) => {
    dispatch({ type: GameplayActions.SET_LOADED_AUDIO_ASSETS, payload: loaded })
  }

  const dispatchMessage = (msg: string | null) => {
    if (msg !== null) {
      dispatch({ type: GameplayActions.SET_MESSAGE, payload: msg })
    }
  }

  const dispatchGameState = (newState: GameState) => {
    dispatch({ type: GameplayActions.SET_STATE, payload: newState })
    if (newState == GameState.Playing) {
      dispatchMessage(MESSAGES.GAME_START)
    }
  }

  const dispatchAnimated = (animated) => {
    dispatch({ type: GameplayActions.SET_ANIMATED, payload: animated })
  }

  return {
    state,
    ...state,
    isReady: (state.gameState == GameState.Ready),
    isPlaying: (state.gameState == GameState.Playing),
    dispatchGameImpl,
    dispatchInteracted,
    dispatchLoadedAudioAssets,
    dispatchMessage,
    dispatchGameState,
    dispatchAnimated,
  }
}

