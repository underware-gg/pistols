import React, { useEffect } from 'react'
import { usePistolsScene } from '/src/hooks/PistolsContext'
import { useThreeJsContext } from '/src/hooks/ThreeJsContext'
import { useSettings } from '/src/hooks/SettingsContext'
import { useUserHasInteracted } from '@underware/pistols-sdk/utils/hooks'
import { loadAudioAssets, isAudioAssetsLoaded, AudioName } from '/src/data/audioAssets'
import { ActionButton } from '/src/components/ui/Buttons'
import GameCanvas from '/src/components/GameCanvas'

function GameContainer({
  isVisible,
}) {
  const { audioLoaded } = useThreeJsContext()
  const { initialized } = useSettings()

  if (!initialized) return <></>

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
  const { atDuel } = usePistolsScene()
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
      await loadAudioAssets()
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
  const { musicEnabled, sfxEnabled } = useSettings()
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
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume } = useSettings()
  const { gameImpl, audioLoaded } = useThreeJsContext()
  const { atGate, atDoor, atDuel, atTutorial } = usePistolsScene()

  useEffect(() => {
    return () => {
      gameImpl?.stopAudio(AudioName.MUSIC_MENUS)
    }
  }, [])

  useEffect(() => {
    gameImpl?.setVolumeMultiplier(musicVolume)
  }, [musicVolume, gameImpl])

  useEffect(() => {
    gameImpl?.setSfxVolumeMultiplier(sfxVolume)
  }, [sfxVolume, gameImpl])

  useEffect(() => {
    gameImpl?.playAudio(AudioName.MUSIC_MENUS, musicEnabled && audioLoaded && !atGate && !atDoor && !atDuel && !atTutorial, 2)
  }, [gameImpl, musicEnabled, audioLoaded, atGate, atDoor, atDuel])

  useEffect(() => {
    const handleClick = () => {
      if (sfxEnabled && gameImpl && audioLoaded && !atTutorial && !atGate) {
        gameImpl.playAudio(AudioName.KNIFE_SHARPEN, true)
      }
    }
    
    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [gameImpl, sfxEnabled, audioLoaded, atTutorial, atGate])

  return <></>
}

export default GameContainer
