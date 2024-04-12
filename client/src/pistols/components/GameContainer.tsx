import React, { useEffect } from 'react'
import { usePistolsContext } from '@/pistols/hooks/PistolsContext'
import { useThreeJsContext } from '@/pistols/hooks/ThreeJsContext'
import { useSettingsContext } from '@/pistols/hooks/SettingsContext'
import { useUserHasInteracted } from '@/lib/utils/hooks/useUserHasInteracted'
import { loadAudioAssets, isAudioAssetsLoaded, AudioName } from '@/pistols/data/assets'
import { ActionButton } from '@/pistols/components/ui/Buttons'
import GameCanvas from '@/pistols/components/GameCanvas'

function GameContainer({
  isVisible,
  duelId,
}) {
  const { dispatchSelectDuel } = usePistolsContext()
  const { audioLoaded } = useThreeJsContext()

  useEffect(() => {
    if (duelId) {
      dispatchSelectDuel(duelId)
    }
  }, [duelId])

  return (
    <div className={`GameContainer ${isVisible ? '' : 'Hidden'}`}>
      <GameCanvas />
      {!audioLoaded && <GameAudioLoader />}
      {audioLoaded && <GameAudios isVisible={isVisible} />}
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
    audioLoaded,
    dispatchLoadedAudioAssets,
  } = useThreeJsContext()

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
        {audioLoaded === undefined && <ActionButton large label={<h4>Ready!</h4>} onClick={() => console.log(`interacted`)} />}
        {audioLoaded === false && <h1>Loading Audio...</h1>}
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
  const { gameImpl, audioLoaded } = useThreeJsContext()

  useEffect(() => {
    const _play = (musicEnabled && isVisible && audioLoaded)
    gameImpl?.playAudio(AudioName.MUSIC_INGAME, _play)
  }, [musicEnabled, isVisible, audioLoaded])

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
  const { gameImpl, audioLoaded } = useThreeJsContext()

  useEffect(() => {
    return () => {
      gameImpl?.stopAudio(AudioName.MUSIC_MENUS)
    }
  }, [])

  useEffect(() => {
    gameImpl?.playAudio(AudioName.MUSIC_MENUS, musicEnabled && audioLoaded)
  }, [gameImpl, musicEnabled, audioLoaded])

  return <></>
}

export default GameContainer
