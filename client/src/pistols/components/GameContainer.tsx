import React, { useEffect, useState } from 'react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useGameplayContext } from '../hooks/GameplayContext'
import { loadAudioAssets, isAudioAssetsLoaded } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameView from '@/pistols/components/GameView'
import GameUI from '@/pistols/components/GameUI'

function GameContainer({
  isPlaying,
  duelId,
}) {
  const { dispatchSetDuel } = usePistolsContext()

  useEffect(() => {
    if (duelId) {
      dispatchSetDuel(duelId)
    }
  }, [duelId])

  return (
    <div className={`GameContainer UIBorder ${isPlaying ? '' : 'Hidden'}`}>
      <GameView />
      <GameUI />
      <GameStartOverlay />
    </div>
  )
}


//------------------------------------------------
// Overlay to load audio ssets
// Asks for interaction if necessary
//
function GameStartOverlay({
}) {
  const { gameImpl, hasInteracted, isReady, dispatchInteracted } = useGameplayContext()
  const [audioAssetsLoaded, setAudioAssetsLoaded] = useState(undefined)

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
    <div className={`GameView Overlay CenteredContainer`}>
      {audioAssetsLoaded === undefined && <ActionButton large label='START GAME' onClick={() => dispatchInteracted()} />}
      {audioAssetsLoaded === false && <h1>loading assets...</h1>}
    </div>
  )
}

export default GameContainer
