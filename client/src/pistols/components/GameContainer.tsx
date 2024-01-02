import React, { useEffect, useState } from 'react'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { GameState, useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { loadAudioAssets, isAudioAssetsLoaded } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameView from '@/pistols/components/GameView'

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
  const { gameImpl, hasInteracted, isReady, dispatchGameState, dispatchInteracted } = useGameplayContext()
  const [audioAssetsLoaded, setAudioAssetsLoaded] = useState(undefined)
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
      setAudioAssetsLoaded(false)
      await loadAudioAssets(gameImpl?.getCameraRig())
      setAudioAssetsLoaded(true)
      // dispatchReset(null, true)
    }
    setAudioAssetsLoaded(isAudioAssetsLoaded())
    if (isReady && hasInteracted) {
      _preloadAudio()
    }
  }, [isReady, hasInteracted])

  if (audioAssetsLoaded === true) {
    return <></>
  }

  return (
    <div className={`GameView Overlay CenteredContainer AboveAll`}>
      {audioAssetsLoaded === undefined && <ActionButton large label='READY!' onClick={() => dispatchInteracted()} />}
      {audioAssetsLoaded === false && <h1>loading assets...</h1>}
    </div>
  )
}

export default GameContainer
