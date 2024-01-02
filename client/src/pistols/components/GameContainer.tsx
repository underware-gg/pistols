import React, { useEffect, useState } from 'react'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { GameState, useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { loadAudioAssets, isAudioAssetsLoaded, AudioName } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameView from '@/pistols/components/GameView'
import { useSettingsContext } from '../hooks/SettingsContext'

function GameContainer({
  isVisible,
  duelId,
}) {
  const { dispatchSetDuel } = usePistolsContext()

  useEffect(() => {
    if (duelId) {
      dispatchSetDuel(duelId, MenuKey.YourDuels)
    }
  }, [duelId])

  return (
    <div className={`GameContainer ${isVisible ? '' : 'Hidden'}`}>
      <GameView />
      <GameStartOverlay isVisible={isVisible} />
    </div>
  )
}


//------------------------------------------------
// Overlay to load audio assets
// Asks for interaction if necessary
//
function GameStartOverlay({
  isVisible
}) {
  const {
    gameImpl, isReady,
    hasInteracted, hasLoadedAudioAssets,
    dispatchGameState, dispatchInteracted, dispatchLoadedAudioAssets,
  } = useGameplayContext()
  // console.log(isReady, hasInteracted, gameImpl)

  // gameImpl loaded by GameCanvas
  useEffect(() => {
    if(gameImpl) {
      dispatchGameState(GameState.Ready)
    }
  }, [gameImpl])

  useEffect(() => {
    const hasBeenActive = navigator?.userActivation?.hasBeenActive
    if (isVisible && hasBeenActive && !hasInteracted) {
      dispatchInteracted()
    }
  }, [isVisible])

  //
  // Load audio assets
  useEffect(() => {
    const _preloadAudio = async () => {
      dispatchLoadedAudioAssets(false)
      await loadAudioAssets(gameImpl?.getCameraRig())
      dispatchLoadedAudioAssets(true)
    }
    if (isAudioAssetsLoaded()) {
      dispatchLoadedAudioAssets(true)
    } else if (isReady && hasInteracted) {
      _preloadAudio()
    }
  }, [isReady, hasInteracted])

  if (hasLoadedAudioAssets === true) {
    return <GameAudios isVisible={isVisible}/>
  }

  return (
    <div className={`GameView Overlay CenteredContainer AboveAll`}>
      {hasLoadedAudioAssets === undefined && <ActionButton large label='READY!' onClick={() => dispatchInteracted()} />}
      {hasLoadedAudioAssets === false && <h1>loading assets...</h1>}
    </div>
  )
}

const GameAudios = ({
  isVisible
}) => {
  const { musicEnabled, sfxEnabled } = useSettingsContext()
  const { gameImpl } = useGameplayContext()

  useEffect(() => {
    const _play = (musicEnabled && isVisible)
    gameImpl?.playAudio(AudioName.AMBIENT, _play)
  }, [musicEnabled, isVisible])

  useEffect(() => {
    if (!isVisible) {
      gameImpl?.stopAudio(AudioName.AMBIENT)
    }
  }, [isVisible])

  useEffect(() => {
    gameImpl?.setSfxEnabled(sfxEnabled)
  }, [sfxEnabled])

  return <></>
}


export default GameContainer
