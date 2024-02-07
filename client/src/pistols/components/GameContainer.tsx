import React, { useEffect } from 'react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useGameplayContext } from '@/pistols/hooks/GameplayContext'
import { loadAudioAssets, isAudioAssetsLoaded, AudioName } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameView from '@/pistols/components/GameView'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useUserHasInteracted } from '@/pistols/hooks/useUserHasInteracted'

function GameContainer({
  isVisible,
  duelId,
}) {
  const { dispatchSelectDuel } = usePistolsContext()
  const { hasLoadedAudioAssets } = useGameplayContext()

  useEffect(() => {
    if (duelId) {
      dispatchSelectDuel(duelId)
    }
  }, [duelId])

  return (
    <div className={`GameContainer ${isVisible ? '' : 'Hidden'}`}>
      <GameView />
      {!hasLoadedAudioAssets && <GameAudioLoader />}
      {hasLoadedAudioAssets && <GameAudios isVisible={isVisible} />}
    </div>
  )
}


//------------------------------------------------
// Overlay to load audio assets
// Asks for interaction if necessary
//
function GameAudioLoader() {
  const { atDuel } = usePistolsContext()
  const {
    gameImpl,
    hasLoadedAudioAssets,
    dispatchLoadedAudioAssets,
  } = useGameplayContext()

  const { userHasInteracted } = useUserHasInteracted()

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
    } else if (gameImpl && userHasInteracted) {
      _preloadAudio()
    }
  }, [gameImpl, userHasInteracted])

  if (!gameImpl) {
    return (
      <div className='Overlay'>
        <h1>Starting Renderer...</h1>
      </div>
    )
  }

  if (gameImpl && atDuel) {
    return (
      <div className='Overlay'>
        {hasLoadedAudioAssets === undefined && <ActionButton large label='Ready!' onClick={() => console.log(`interacted`)} />}
        {hasLoadedAudioAssets === false && <h1>Loading Audio...</h1>}
      </div>
    )
  }

  return <></>
}

//-------------------------------------------------
// Displayed only when the three.js game is visible
//
const GameAudios = ({
  isVisible
}) => {
  const { musicEnabled, sfxEnabled } = useSettingsContext()
  const { gameImpl, hasLoadedAudioAssets } = useGameplayContext()

  useEffect(() => {
    const _play = (musicEnabled && isVisible && hasLoadedAudioAssets)
    gameImpl?.playAudio(AudioName.MUSIC_INGAME, _play)
  }, [musicEnabled, isVisible, hasLoadedAudioAssets])

  useEffect(() => {
    if (!isVisible) {
      gameImpl?.stopAudio(AudioName.MUSIC_INGAME)
    }
  }, [isVisible])

  useEffect(() => {
    gameImpl?.setSfxEnabled(sfxEnabled)
  }, [sfxEnabled])

  return <></>
}

//-----------------------------------------------------
// Displayed only when the three.js game is NOT visible
// Will disable MUSIC settings if not interacted yet
//
export const TavernAudios = () => {
  const { musicEnabled } = useSettingsContext()
  const { gameImpl, hasLoadedAudioAssets } = useGameplayContext()

  useEffect(() => {
    return () => {
      gameImpl?.stopAudio(AudioName.MUSIC_MENUS)
    }
  }, [])

  useEffect(() => {
    gameImpl?.playAudio(AudioName.MUSIC_MENUS, musicEnabled && hasLoadedAudioAssets)
  }, [gameImpl, musicEnabled, hasLoadedAudioAssets])

  return <></>
}

export default GameContainer
