import * as THREE from 'three'


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
    path: '/audio/music-ambient.m4a',
    volume: 0.5,
    loop: true,
  },
  // SHOT: {
  //   path: '/audio/sfx/shot.m4a',
  //   loop: true,
  // },
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
  loadAudioAssets,
  isAudioAssetsLoaded,
  AudioName,
  AUDIO_ASSETS,
}
