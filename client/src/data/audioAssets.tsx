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

  // UI
  // UI_BUTTON_CLICK = 'UI_BUTTON_CLICK',

  // environment
  DOOR_KNOCKING = 'DOOR_KNOCKING',
  DOORKEEP_GRUNTING_1 = 'DOORKEEP_GRUNTING_1',
  DOORKEEP_GRUNTING_2 = 'DOORKEEP_GRUNTING_2',
  DOORKEEP_GRUNTING_3 = 'DOORKEEP_GRUNTING_3',
  DOORKEEP_GRUNTING_4 = 'DOORKEEP_GRUNTING_4',
  DOOR_CREAKING = 'DOOR_CREAKING',
  KNIFE_IMPACT = 'KNIFE_IMPACT',
  KNIFE_SHARPEN = 'KNIFE_SHARPEN',
  KNIFE_SWISH = 'KNIFE_SWISH',
}

enum AudioType {
  MUSIC = 'music',
  SFX = 'sfx',
} 

interface AudioAsset {
  path: string
  loop?: boolean
  volume?: number
  disabled?: boolean
  delaySeconds?: number   // we can delay playback to match animation frame
  duration?: number   
  type?: AudioType    // usefull for tutorial to know when audio is finished to play next one
  
  
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
    type: AudioType.MUSIC,
  },
  MUSIC_INGAME: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
    type: AudioType.MUSIC,
    disabled: true,
  },
  SHOOT: {
    path: '/audio/sfx/pistol-shot.mp3',
    loop: false,
    volume: 0.6,
    delaySeconds: 1,
    type: AudioType.SFX,
  },
  BODY_FALL: {
    path: '/audio/sfx/body-fall.mp3',
    loop: false,
    delaySeconds: 0.4,
    type: AudioType.SFX,
  },
  GRUNT_FEMALE: {
    path: '/audio/sfx/grunt-female.mp3',
    loop: false,
    delaySeconds: 0.6,
    type: AudioType.SFX,
  },
  GRUNT_MALE: {
    path: '/audio/sfx/grunt-man.mp3',
    loop: false,
    delaySeconds: 0.6,
    type: AudioType.SFX,
  },
  STRIKE_LIGHT: {
    path: '/audio/sfx/strike-light.mp3',
    loop: false,
    delaySeconds: 0.8,
    type: AudioType.SFX,
  },
  STRIKE_HEAVY: {
    path: '/audio/sfx/strike-heavy.mp3',
    loop: false,
    delaySeconds: 0.85,
    type: AudioType.SFX,
  },
  STRIKE_BLOCK: {
    path: '/audio/sfx/strike-block.mp3',
    loop: false,
    delaySeconds: 0.9,
    type: AudioType.SFX,
  },

  // environment
  DOOR_KNOCKING: {
    path: '/audio/sfx/env/door-knocking.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0.1,
    type: AudioType.SFX,
  },
  DOORKEEP_GRUNTING_1: {
    path: '/audio/sfx/env/doorkeep-grunting-1.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  DOORKEEP_GRUNTING_2: {
    path: '/audio/sfx/env/doorkeep-grunting-2.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  DOORKEEP_GRUNTING_3: {
    path: '/audio/sfx/env/doorkeep-grunting-3.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  DOORKEEP_GRUNTING_4: {
    path: '/audio/sfx/env/doorkeep-grunting-4.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  DOOR_CREAKING: {
    path: '/audio/sfx/env/door-creaking.mp3',
    loop: false,
    volume: 0.1,
    delaySeconds: 0.1,
    type: AudioType.SFX,
  },
  KNIFE_IMPACT: {
    path: '/audio/sfx/env/knife-impact.mp3',
    loop: false,
    volume: 0.5,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  KNIFE_SHARPEN: {
    path: '/audio/sfx/env/knife-sharpen.mp3',
    loop: false,
    volume: 0.5,
    delaySeconds: 0,
    type: AudioType.SFX,
  },
  KNIFE_SWISH: {
    path: '/audio/sfx/env/knife-swish.mp3',
    loop: false,
    volume: 0.5,
    delaySeconds: 0,
    type: AudioType.SFX,
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
  AudioType,
  AUDIO_ASSETS,
}