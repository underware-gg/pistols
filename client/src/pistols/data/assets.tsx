import * as THREE from 'three'
import { SceneName } from '@/pistols/hooks/PistolsContext'


//----------------------------
// Texture Assets
//
export enum TextureName {
  Testcard = 'Testcard',
  bg_gate = 'bg_gate',
  bg_duelists = 'bg_duelists',
  bg_duels_yours = 'bg_duels_yours',
  bg_duels_live = 'BG_DUEL',
  bg_duels_past = 'BG_bg_duels_pastDUEL',
  bg_duel = 'bg_duel',
  duel_ground = 'duel_ground',
  duel_ground_normal = 'duel_ground_normal',
  duel_water_dudv = 'duel_water_dudv',
  duel_water_map = 'duel_water_map',
}
const TEXTURES: Record<TextureName, { path: string }> = {
  [TextureName.Testcard]: { path: '/textures/testcard.jpg' },
  [TextureName.bg_gate]: { path: '/images/bg_gate.jpg' },
  [TextureName.bg_duelists]: { path: '/images/bg_duelists.jpg' },
  [TextureName.bg_duels_yours]: { path: '/images/bg_duels_yours.jpg' },
  [TextureName.bg_duels_live]: { path: '/images/bg_duels_live.jpg' },
  [TextureName.bg_duels_past]: { path: '/images/bg_duels_past.jpg' },
  [TextureName.bg_duel]: { path: '/images/bg_duel.jpg' },
  [TextureName.duel_ground]: { path: '/textures/ground.ktx2' },
  [TextureName.duel_ground_normal]: { path: '/textures/ground_normalmap.ktx2' },
  [TextureName.duel_water_dudv]: { path: '/textures/waterdudv.jpg' },
  [TextureName.duel_water_map]: { path: '/textures/water_map.ktx2' },
}

export const sceneBackgrounds: Record<SceneName, TextureName> = {
  [SceneName.Splash]: TextureName.bg_duel,
  [SceneName.Gate]: TextureName.bg_gate,
  [SceneName.Tavern]: TextureName.bg_duelists,
  [SceneName.Duelists]: TextureName.bg_duelists,
  [SceneName.YourDuels]: TextureName.bg_duels_yours,
  [SceneName.LiveDuels]: TextureName.bg_duels_live,
  [SceneName.PastDuels]: TextureName.bg_duels_past,
  [SceneName.Duel]: TextureName.bg_duel,
}

enum CharacterType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}
export enum AnimName {
  STILL = 'STILL',
  STILL_BLADE = 'STILL_BLADE',
  STEP_1 = 'STEP_1',
  STEP_2 = 'STEP_2',
  TWO_STEPS = 'TWO_STEPS',
  SHOOT = 'SHOOT',
  SHOT_INJURED_BACK = 'SHOT_INJURED_BACK',
  SHOT_INJURED_FRONT = 'SHOT_INJURED_FRONT',
  SHOT_DEAD_BACK = 'SHOT_DEAD_BACK',
  SHOT_DEAD_FRONT = 'SHOT_DEAD_FRONT',
  STRIKE_LIGHT = 'STRIKE_LIGHT',
  STRIKE_HEAVY = 'STRIKE_HEAVY',
  STRIKE_BLOCK = 'STRIKE_BLOCK',
  STRUCK_INJURED = 'STRUCK_INJURED',
  STRUCK_DEAD = 'STRUCK_DEAD',
}
interface AnimationAsset {
  path: string
  frameCount: number
  frameRate: number
}
type Spritesheets = {
  [key in CharacterType]: Animations
}
type Animations = {
  [key in AnimName]: AnimationAsset
}
const SPRITESHEETS: Spritesheets = {
  FEMALE: {
    [AnimName.STILL]: {
      path: '/textures/animations/Female Duelist/Still',
      frameCount: 14,
      frameRate: 8,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Female Duelist/Still_Blade',
      frameCount: 1,
      frameRate: 8,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Female Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Female Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Female Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Female Duelist/Shoot',
      frameCount: 10,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Front',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Back',
      frameCount: 10,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Front',
      frameCount: 7,
      frameRate: 8,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Female Duelist/Struck_Injured',
      frameCount: 6,
      frameRate: 8,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Female Duelist/Struck_Dead',
      frameCount: 6,
      frameRate: 8,
    },
  },
  MALE: {
    [AnimName.STILL]: {
      path: '/textures/animations/Male Duelist/Still',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Male Duelist/Still_Blade',
      frameCount: 1,
      frameRate: 8,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Male Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Male Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Male Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Male Duelist/Shoot',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Back',
      frameCount: 11,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Front',
      frameCount: 11,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Back',
      frameCount: 11,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Front',
      frameCount: 11,
      frameRate: 8,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Male Duelist/Struck_Injured',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Male Duelist/Struck_Dead',
      frameCount: 12,
      frameRate: 8,
    },
  },
}

//----------------------------
// Profile Picture to animation model
//
const ProfileModels: Record<number, CharacterType> = {
  [0]: CharacterType.MALE,
  [1]: CharacterType.MALE,
  [2]: CharacterType.FEMALE,
  [3]: CharacterType.MALE,
  [4]: CharacterType.MALE,
  [5]: CharacterType.MALE,
  [6]: CharacterType.MALE,
  [7]: CharacterType.MALE,
  [8]: CharacterType.MALE,
  [9]: CharacterType.MALE,
  [10]: CharacterType.MALE,
  [11]: CharacterType.FEMALE,
  [12]: CharacterType.MALE,
  [13]: CharacterType.MALE,
  [14]: CharacterType.MALE,
  [15]: CharacterType.MALE,
}


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
  TEXTURES,
  SPRITESHEETS,
  ProfileModels,
  loadAudioAssets,
  isAudioAssetsLoaded,
  AudioName,
  AUDIO_ASSETS,
}
