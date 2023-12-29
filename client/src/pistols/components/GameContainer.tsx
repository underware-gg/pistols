import React, { useEffect, useState } from 'react'
import { usePistolsContext, MenuKey } from '@/pistols/hooks/PistolsContext'
import { GameState, useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { loadAudioAssets, isAudioAssetsLoaded } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameView from '@/pistols/components/GameView'

function GameContainer({
  isPlaying,
  duelId,
}) {
  const { dispatchSetDuel } = usePistolsContext()

  useEffect(() => {
    if (duelId) {
      dispatchSetDuel(duelId, MenuKey.YourDuels)
    }
  }, [duelId])

  return (
    <div className={`GameContainer ${isPlaying ? '' : 'Hidden'}`}>
      <GameView />
      <GameStartOverlay />
    </div>
  )
}


//------------------------------------------------
// Overlay to load audio assets
// Asks for interaction if necessary
//
function GameStartOverlay({
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

  const _startGame = async () => {
    setAudioAssetsLoaded(false)
    await loadAudioAssets(gameImpl?.getCameraRig())
    setAudioAssetsLoaded(true)
    // dispatchReset(null, true)
  }

  useEffect(() => {
    setAudioAssetsLoaded(isAudioAssetsLoaded())
    if (isReady && hasInteracted) {
      _startGame()
    }
  }, [isReady, hasInteracted])

  if (audioAssetsLoaded === true) {
    return <></>
  }

  return (
    <div className={`GameView Overlay CenteredContainer AboveAll`}>
      {audioAssetsLoaded === undefined && <ActionButton large label='START GAME' onClick={() => dispatchInteracted()} />}
      {audioAssetsLoaded === false && <h1>loading assets...</h1>}
    </div>
  )
}

export default GameContainer
