import * as THREE from 'three'


//----------------------------
// Texture Assets
//

const TEXTURES = {
  TESTCARD: { path: '/textures/testcard.jpg' },
  BG_DUEL: { path: '/textures/bg_duel.png' },
}
const SPRITESHEETS = {
  FEMALE: {
    STILL: {
      path: '/textures/animations/Female Duelist/Still',
      frameCount: 1,
      frameRate: 8,
    },
    STEP_1: {
      path: '/textures/animations/Female Duelist/Step 1',
      frameCount: 8,
      frameRate: 8,
    },
    STEP_2: {
      path: '/textures/animations/Female Duelist/Step 2',
      frameCount: 8,
      frameRate: 8,
    },
    TWO_STEPS: {
      path: '/textures/animations/Female Duelist/Two Steps',
      frameCount: 16,
      frameRate: 8,
    },
    SHOOT: {
      path: '/textures/animations/Female Duelist/Shoot',
      frameCount: 16,
      frameRate: 8,
    },
    SHOT_INJURED_BACK: {
      path: '/textures/animations/Female Duelist/Shot and Injured Back',
      frameCount: 11,
      frameRate: 8,
    },
    SHOT_INJURED_FRONT: {
      path: '/textures/animations/Female Duelist/Shot and Injured Front',
      frameCount: 15,
      frameRate: 8,
    },
    SHOT_DEAD_BACK: {
      path: '/textures/animations/Female Duelist/Shot Dead Back',
      frameCount: 7,
      frameRate: 8,
    },
    SHOT_DEAD_FRONT: {
      path: '/textures/animations/Female Duelist/Shot Dead Front',
      frameCount: 11,
      frameRate: 8,
    },
    STRIKE: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    STRUCK_INJURED: {
      path: '/textures/animations/Female Duelist/Struck and Injured',
      frameCount: 6,
      frameRate: 8,
    },
    STRUCK_DEAD: {
      path: '/textures/animations/Female Duelist/Struck Dead',
      frameCount: 6,
      frameRate: 8,
    },
  },
}



//----------------------------
// Audio Assets
//
enum AudioName {
  AMBIENT = 'AMBIENT',
  // SHOT = 'SHOT',
}

interface AudioAsset {
  path: string
  loop?: boolean
  volume?: number
  object?: any
  loaded?: boolean
}
type AudioAssets = {
  [key in AudioName]: AudioAsset
}


let AUDIO_ASSETS: AudioAssets = {
  AMBIENT: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
  },
  SHOT: {
    path: '/audio/sfx/pistol-shot.mp3',
    loop: false,
  },
}



//----------------------------
// Loaders
//
// Generic loader
const _loader = async (ASSETS, onLoading) => {
  return new Promise<void>((resolve, reject) => {
    let assetsToLoad = Object.keys(ASSETS).length
    Object.keys(ASSETS).forEach((name) => {
      onLoading(name, (object) => {
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
const _loadAudios = async (listener) => {
  const loader = new THREE.AudioLoader()
  return _loader(AUDIO_ASSETS, (name, resolve) => {
    const asset = AUDIO_ASSETS[name]
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
      } catch(e) {
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
const loadAudioAssets = async (cameraRig: any) => {
  if (_audioAssetsLoaded === undefined) {
    _audioAssetsLoaded = false
    const listener = new THREE.AudioListener()
    cameraRig.add(listener)
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
  TEXTURES,
  SPRITESHEETS,
  loadAudioAssets,
  isAudioAssetsLoaded,
  AudioName,
  AUDIO_ASSETS,
}
