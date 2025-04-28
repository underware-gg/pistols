import React, { ReactNode, createContext, useReducer, useContext, useState, useCallback, useMemo } from 'react'
import { useCookies } from 'react-cookie'
import { BigNumberish } from 'starknet'
import { useEffectOnce } from '@underware/pistols-sdk/utils/hooks'
import { constants } from '@underware/pistols-sdk/pistols/gen'

//--------------------------------
// Constants
//
export const initialState = {
  debugMode: false,
  debugScene: false,
  framerate: 60,
  musicEnabled: true,
  musicVolume: 1.0,
  sfxEnabled: true,
  sfxVolume: 1.0,
  duelSpeedFactor: 1.0,
  completedTutorialLevel: 0,
  // internal
  initialized: false,
}

const SettingsActions = {
  DEBUG_MODE: 'settings.DEBUG_MODE',
  DEBUG_SCENE: 'settings.DEBUG_SCENE',
  FRAMERATE: 'settings.FRAMERATE',
  MUSIC_ENABLED: 'settings.MUSIC_ENABLED',
  MUSIC_VOLUME: 'settings.MUSIC_VOLUME',
  SFX_ENABLED: 'settings.SFX_ENABLED',
  SFX_VOLUME: 'settings.SFX_VOLUME',
  DUEL_SPEED_FACTOR: 'settings.DUEL_SPEED_FACTOR',
  TUTORIAL_LEVEL: 'settings.TUTORIAL_LEVEL',
}

//--------------------------------
// Types
//
type SettingsStateType = typeof initialState

type ActionType =
  | { type: 'DEBUG_MODE', payload: boolean }
  | { type: 'DEBUG_SCENE', payload: boolean }
  | { type: 'FRAMERATE', payload: number }
  | { type: 'MUSIC_ENABLED', payload: boolean }
  | { type: 'MUSIC_VOLUME', payload: number }
  | { type: 'SFX_ENABLED', payload: boolean }
  | { type: 'SFX_VOLUME', payload: number }
  | { type: 'DUEL_SPEED_FACTOR', payload: number }
  | { type: 'TUTORIAL_LEVEL', payload: number }
  // internal
  | { type: 'INITIALIZED', payload: boolean }



//--------------------------------
// Context
//
const SettingsContext = createContext<{
  state: SettingsStateType
  dispatch: React.Dispatch<any>
}>({
  state: initialState,
  dispatch: () => null,
})

//--------------------------------
// Provider
//
interface SettingsProviderProps {
  children: string | JSX.Element | JSX.Element[] | ReactNode
}
const SettingsProvider = ({
  children,
}: SettingsProviderProps) => {
  const [cookies, setCookie] = useCookies(Object.values(SettingsActions));

  const cookieSetter = useCallback((cookieName: string, state: SettingsStateType) => {
    const _options = { path: '/' }
    const _setters = {
      [SettingsActions.DEBUG_MODE]: () => setCookie(cookieName, state.debugMode, _options),
      [SettingsActions.DEBUG_SCENE]: () => setCookie(cookieName, state.debugScene, _options),
      [SettingsActions.FRAMERATE]: () => setCookie(cookieName, state.framerate, _options),
      [SettingsActions.MUSIC_ENABLED]: () => setCookie(cookieName, state.musicEnabled, _options),
      [SettingsActions.MUSIC_VOLUME]: () => setCookie(cookieName, state.musicVolume, _options),
      [SettingsActions.SFX_ENABLED]: () => setCookie(cookieName, state.sfxEnabled, _options),
      [SettingsActions.SFX_VOLUME]: () => setCookie(cookieName, state.sfxVolume, _options),
      [SettingsActions.DUEL_SPEED_FACTOR]: () => setCookie(cookieName, Number(state.duelSpeedFactor), _options),
      [SettingsActions.TUTORIAL_LEVEL]: () => setCookie(cookieName, state.completedTutorialLevel, _options),
    }
    _setters[cookieName]?.()
  }, [setCookie])

  const [state, dispatch] = useReducer((state: SettingsStateType, action: ActionType) => {
    let newState = { ...state }
    switch (action.type) {
      case 'INITIALIZED': {
        newState.initialized = action.payload as boolean
        break
      }
      case SettingsActions.DEBUG_MODE: {
        newState.debugMode = action.payload as boolean
        cookieSetter(SettingsActions.DEBUG_MODE, newState)
        break
      }
      case SettingsActions.DEBUG_SCENE: {
        newState.debugScene = action.payload as boolean
        cookieSetter(SettingsActions.DEBUG_SCENE, newState)
        break
      }
      case SettingsActions.FRAMERATE: {
        newState.framerate = action.payload as number
        cookieSetter(SettingsActions.FRAMERATE, newState)
        break
      }
      case SettingsActions.MUSIC_ENABLED: {
        newState.musicEnabled = action.payload as boolean
        cookieSetter(SettingsActions.MUSIC_ENABLED, newState)
        break
      }
      case SettingsActions.SFX_ENABLED: {
        newState.sfxEnabled = action.payload as boolean
        cookieSetter(SettingsActions.SFX_ENABLED, newState)
        break
      }
      case SettingsActions.MUSIC_VOLUME: {
        newState.musicVolume = action.payload as number
        cookieSetter(SettingsActions.MUSIC_VOLUME, newState)
        break
      }
      case SettingsActions.SFX_VOLUME: {
        newState.sfxVolume = action.payload as number
        cookieSetter(SettingsActions.SFX_VOLUME, newState)
        break
      }
      case SettingsActions.DUEL_SPEED_FACTOR: {
        newState.duelSpeedFactor = action.payload as number
        cookieSetter(SettingsActions.DUEL_SPEED_FACTOR, newState)
        break
      }
      case SettingsActions.TUTORIAL_LEVEL: {
        newState.completedTutorialLevel = action.payload as number
        cookieSetter(SettingsActions.TUTORIAL_LEVEL, newState)
        break
      }
      default:
        console.warn(`SettingsProvider: Unknown action [${action.type}]`)
        return state
    }
    return newState
  }, initialState)

  // initialize from cookies
  useEffectOnce(() => {
    if (dispatch && cookies) {
      Object.keys(SettingsActions).forEach((key) => {
        const name = SettingsActions[key]
        const cookieValue = cookies[name]
        if (cookieValue != null) {
          // read from cookie
          dispatch({ type: name, payload: cookieValue })
        } else {
          // initialize cookie
          cookieSetter(name, state)
        }
      })
      dispatch({ type: 'INITIALIZED', payload: true })
    }
  }, [dispatch, cookies])

  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export { SettingsProvider, SettingsContext, SettingsActions }


//--------------------------------
// Hooks
//

export const useSettings = () => {
  const { state, dispatch } = useContext(SettingsContext)

  const dispatchSetting = (key: string, value: any) => {
    dispatch({
      type: key,
      payload: value,
    })
  }

  const settings = useMemo(() => ({
    ...state,
    hasFinishedTutorial: (state.completedTutorialLevel > 2),
  }), [state])

  return {
    ...settings,    // expose individual settings values directly
    settings,       // expose settings as object {}
    SettingsActions,
    dispatchSetting,
  }
}

