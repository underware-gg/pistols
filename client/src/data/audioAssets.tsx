import * as THREE from 'three'

//----------------------------
// Audio Assets
//
enum AudioName {
  MUSIC_MENUS = 'MUSIC_MENUS',
  MUSIC_INGAME = 'MUSIC_INGAME',
  SHOOT = 'SHOOT',
  BODY_FALL = 'BODY_FALL',
  GRUNT_FEMALE = 'GRUNT_FEMALE',
  GRUNT_MALE = 'GRUNT_MALE',
  STRIKE_LIGHT = 'STRIKE_LIGHT',
  STRIKE_HEAVY = 'STRIKE_HEAVY',
  STRIKE_BLOCK = 'STRIKE_BLOCK',
}

interface AudioAsset {
  path: string
  loop?: boolean
  volume?: number
  disabled?: boolean
  delaySeconds?: number   // we can delay playback to match animation frame
  duration?: number       // usefull for tutorial to know when audio is finished to play next one
  
  
  // loader
  object?: any
  loaded?: boolean
}
type AudioAssets = {
  [key in AudioName]: AudioAsset
}


let AUDIO_ASSETS: AudioAssets = {
  MUSIC_MENUS: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
  },
  MUSIC_INGAME: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
    disabled: true,
  },
  SHOOT: {
    path: '/audio/sfx/pistol-shot.mp3',
    loop: false,
    delaySeconds: 1,
  },
  BODY_FALL: {
    path: '/audio/sfx/body-fall.mp3',
    loop: false,
    delaySeconds: 0.4,
  },
  GRUNT_FEMALE: {
    path: '/audio/sfx/grunt-female.mp3',
    loop: false,
    delaySeconds: 0.6,
  },
  GRUNT_MALE: {
    path: '/audio/sfx/grunt-man.mp3',
    loop: false,
    delaySeconds: 0.6,
  },
  STRIKE_LIGHT: {
    path: '/audio/sfx/strike-light.mp3',
    loop: false,
    delaySeconds: 0.8,
  },
  STRIKE_HEAVY: {
    path: '/audio/sfx/strike-heavy.mp3',
    loop: false,
    delaySeconds: 0.85,
  },
  STRIKE_BLOCK: {
    path: '/audio/sfx/strike-block.mp3',
    loop: false,
    delaySeconds: 0.9,
  },
}



//----------------------------
// Loaders
//
// Generic loader
const _loader = async (ASSETS: any, onLoading: Function) => {
  return new Promise<void>((resolve, reject) => {
    let assetsToLoad = Object.keys(ASSETS).length
    Object.keys(ASSETS).forEach((name) => {
      onLoading(name, (object: any) => {
        ASSETS[name].object = object
        if (--assetsToLoad == 0) {
          resolve()
        }
      })
    })
  })
}

//-----------------
// Audios
//
const _loadAudios = async (listener: THREE.AudioListener) => {
  const loader = new THREE.AudioLoader()
  return _loader(AUDIO_ASSETS, (name: string, resolve: Function) => {
    const asset = AUDIO_ASSETS[name]
    if (asset.disabled) {
      resolve(null)
      return
    }
    try {
      loader.load(asset.path, function (buffer) {
        // load asset...
        let audio = null
        // console.log(`CACHED AUDIO [${name}]:`, buffer)
        if (buffer) {
          audio = new THREE.Audio(listener).setBuffer(buffer)
          audio.setLoop(asset.loop ?? false)
          audio.setVolume(asset.volume ?? 1.0)
          audio.autoplay = false
        }
        resolve(audio)
      })
    } catch (e) {
      console.error(`CACHED AUDIO [${name}] FAILED!`, e)
    }
  })
}



//----------------------------
// Main Asset Loader
//

//
// Audios need to be loaded after user interaction
// call this from some button
let _audioAssetsLoaded: boolean
const loadAudioAssets = async () => {
  if (_audioAssetsLoaded === undefined) {
    _audioAssetsLoaded = false
    const listener = new THREE.AudioListener()
    await _loadAudios(listener)
    console.log(`--- CACHED AUDIOS! 👍`)
    _audioAssetsLoaded = true
  }
  return _audioAssetsLoaded
}
const isAudioAssetsLoaded = () => {
  return _audioAssetsLoaded
}

export {
  loadAudioAssets,
  isAudioAssetsLoaded,
  AudioName,
  AUDIO_ASSETS,
}