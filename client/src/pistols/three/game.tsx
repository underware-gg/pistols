import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
import { Rain } from './Rain'

// event emitter
// var ee = require('event-emitter');
import ee from 'event-emitter'
export var emitter = ee()

import { AudioName, AUDIO_ASSETS, TEXTURES, SPRITESHEETS, AnimName, sceneBackgrounds, TextureName } from '@/pistols/data/assets'
import { SceneName } from '@/pistols/hooks/PistolsContext'
import { map } from '@/pistols/utils/utils'
import { SpriteSheet, Actor } from './SpriteSheetMaker'
import { Blades } from '@/pistols/utils/pistols'
import constants from '@/pistols/utils/constants'

const PI = Math.PI
const HALF_PI = Math.PI * 0.5
const ONE_HALF_PI = Math.PI * 1.5
const TWO_PI = Math.PI * 2
const R_TO_D = (180 / Math.PI)

//---------------------------
// CONSTANTS
//

export const WIDTH = 1920//1200
export const HEIGHT = 1080//675
export const ASPECT = (WIDTH / HEIGHT)
const FOV = 45

const ACTOR_WIDTH = 140
const PACES_Y = -50
const PACES_X_0 = 40
const PACES_X_STEP = 45

const zoomedCameraPos = {
  x: 0,
  y: PACES_Y,
  z: -HEIGHT,
}

export enum AnimationState {
  None = 0,
  Round1 = 1,
  Round2 = 2,
  Round3 = 3,
  Finished = 4,
}

//-------------------------------------------
// Setup
//

let _textures: any = {}
let _spriteSheets: any = {}

export let _renderer: THREE.WebGLRenderer
export let _fullScreenGeom: THREE.PlaneGeometry = null

let _animationRequest = null
let _clock: THREE.Clock
let _staticCamera: THREE.OrthographicCamera
let _duelCamera: THREE.PerspectiveCamera
let _duelCameraRig: THREE.Object3D
let _supportsExtension: boolean = true
let _stats

let _currentScene: THREE.Scene = null
let _scenes: Partial<Record<SceneName, THREE.Scene>> = {}
let _sceneName: SceneName

let _sfxEnabled = true

const _tweens = {
  cameraPos: null,
  actorPosA: null,
  actorPosB: null,
  staticZoom: null,
  staticFade: null,
}

export const _makeStaticCamera = (x, y, z) => {
  let result = new THREE.OrthographicCamera(
    -WIDTH / 2,
    WIDTH / 2,
    HEIGHT / 2,
    -HEIGHT / 2,
    1, 10000)
  result.position.set(x, y, z)
  return result
}

export function dispose() {
  if (_animationRequest) cancelAnimationFrame(_animationRequest)
  _animationRequest = null
  _renderer?.dispose()
  _renderer = null
  _currentScene = null
  _scenes = {}
}

export async function init(canvas, width, height, statsEnabled = false) {

  if (Object.keys(_scenes).length > 0) {
    return
  }

  console.log(`THREE.init()`)

  Object.keys(TEXTURES).forEach(key => {
    const TEX = TEXTURES[key]
    const tex = new THREE.TextureLoader().load(TEX.path)
    // tex.colorSpace = THREE.LinearSRGBColorSpace
    _textures[key] = tex
  })
  Object.keys(SPRITESHEETS).forEach(actorName => {
    _spriteSheets[actorName] = {}
    Object.keys(SPRITESHEETS[actorName]).forEach(key => {
      _spriteSheets[actorName][key] = new SpriteSheet(key, SPRITESHEETS[actorName][key])
    })
  })

  // color space migration
  // https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
  // THREE.ColorManagement.enabled = false

  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas,
  })
  _renderer.setSize(WIDTH, HEIGHT)
  // _renderer.setClearColor(0, 1)
  _renderer.outputColorSpace = THREE.LinearSRGBColorSpace // fix bright textures
  _renderer.autoClear = false
  _renderer.autoClearColor = false

  _staticCamera = _makeStaticCamera(0, 0, HEIGHT)

  _duelCameraRig = new THREE.Object3D()
  _duelCameraRig.position.set(0, 0, 0)

  _duelCamera = new THREE.PerspectiveCamera(
    FOV,        // fov
    ASPECT,     // aspect
    0.01,       // near
    WIDTH * 2,  // far
  )
  _duelCameraRig.add(_duelCamera)

  _fullScreenGeom = new THREE.PlaneGeometry(WIDTH, HEIGHT)

  window.addEventListener('resize', onWindowResize)

  setupScenes()

  // framerate
  if (statsEnabled) {
    _stats = new Stats()
    document.body.appendChild(_stats.dom)
  }

  _clock = new THREE.Clock(true)

  console.log(`THREE.init() done 👍`)
}

function onWindowResize() {
  // calc canvas size
  const dpr = window.devicePixelRatio
  const winWidth = window.innerWidth
  const winHeight = window.innerHeight
  const aspect = winWidth / winHeight
  const canvasWidth = aspect > ASPECT ? winHeight * ASPECT : winWidth
  const canvasHeight = aspect > ASPECT ? winHeight : winWidth / ASPECT
  _renderer.setPixelRatio(dpr)
  _renderer.setSize(canvasWidth, canvasHeight)
  // calc cam height so I can work with (WIDTH, HEIGHT)
  const h_z_ratio = Math.tan(FOV / 2.0 * Math.PI / 180.0) * 2.0
  const scale = WIDTH / canvasWidth
  const camHeight = (canvasHeight * scale) / h_z_ratio
  // setup cam
  _duelCamera.up.set(0, 1, 0)
  _duelCamera.position.set(0, 0, camHeight)
  _duelCamera.lookAt(0, 0, 0)
  _duelCamera.updateProjectionMatrix()
}


//-------------------------------------------
// Game Loop
//

export function animate() {
  if (!_supportsExtension || !_renderer) return

  // limit framerate
  setTimeout(function () {
    _animationRequest = requestAnimationFrame(animate)
  }, 1000 / 60)

  if (_currentScene) {
    TWEEN.update()

    _renderer.clear()

    if (_sceneName == SceneName.Duel) {
      _actor.A.update(_clock)
      _actor.B.update(_clock)
      _renderer.render(_currentScene, _duelCamera)
      _stats?.update()
    } else {
      //@ts-ignore
      _currentScene.children.forEach(c => c.animate?.(_clock))
      _renderer.render(_currentScene, _staticCamera)
    }
  }
}


//-------------------------------------------
// Scene hook
//

let _actors: any = {}
let _actor: any = {}

function setupScenes() {
  _scenes = {}
  Object.keys(sceneBackgrounds).forEach((sceneName) => {
    if (sceneName == SceneName.Duel) {
      _scenes[sceneName] = setupDuelScene()
    } else {
      _scenes[sceneName] = setupStaticScene(sceneName)
    }
  })
  // switchScene(SceneName.Splash)
}

//
// SceneName.Duel
//
function setupDuelScene() {
  const scene = new THREE.Scene()
  scene.add(_duelCameraRig)

  // const light = new THREE.AmbientLight(0x404040) // soft white light
  // scene.add(light)

  // const testcard_mat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: _textures.Testcard })
  // const testcard = new THREE.Mesh(_fullScreenGeom, testcard_mat)
  // testcard.position.set(0, 0, -1)
  // scene.add(testcard)

  // BG
  const bg_duel_mat = new THREE.MeshBasicMaterial({ map: _textures.bg_duel })
  const bg_duel = new THREE.Mesh(_fullScreenGeom, bg_duel_mat)
  bg_duel.position.set(0, 0, 0)
  scene.add(bg_duel)


  _actors.FEMALE_A = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_WIDTH, true)
  _actors.FEMALE_B = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_WIDTH, false)

  _actors.FEMALE_A.mesh.position.set(-PACES_X_0, PACES_Y, 1)
  _actors.FEMALE_B.mesh.position.set(PACES_X_0, PACES_Y, 1)

  onWindowResize()

  return scene
}

export function resetDuelScene() {
  emitter.emit('animated', AnimationState.None)

  switchActor('A', 'FEMALE_A')
  switchActor('B', 'FEMALE_B')

  zoomCameraToPaces(10, 0)
  zoomCameraToPaces(0, 5)

  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)
  playActorAnimation('A', AnimName.STILL)
  playActorAnimation('B', AnimName.STILL)
}

//
// Static Scenes
//
function setupStaticScene(sceneName) {
  const scene = new THREE.Scene()

  const textureName: TextureName = sceneBackgrounds[sceneName]
  const bg_mat = new THREE.MeshBasicMaterial({
    map: _textures[textureName],
    color: 'white',
  })

  const bg = new THREE.Mesh(_fullScreenGeom, bg_mat)
  bg.name = 'bg'
  bg.position.set(0, 0, 0)
  scene.add(bg)

  if (sceneName == SceneName.Gate) {
    // const rain = new Rain(bg)
    // scene.add(rain)
  }

  return scene
}

export function resetStaticScene() {
  if (_tweens.staticZoom) TWEEN.remove(_tweens.staticZoom)
  if (_tweens.staticFade) TWEEN.remove(_tweens.staticFade)
  let bg = _currentScene.getObjectByName('bg') as THREE.Mesh
  
  // zoom out
  let from = 1.1
  bg.scale.set(from, from, from)
  _tweens.staticZoom = new TWEEN.Tween(bg.scale)
    .to({ x: 1, y: 1, z: 1 }, 60_000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start()
  
    // fade in
  let mat = bg.material as THREE.MeshBasicMaterial
  mat.color = new THREE.Color(0.25, 0.25, 0.25)
  _tweens.staticFade = new TWEEN.Tween(mat.color)
    .to({ r: 1, g: 1, b: 1 }, 2_000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start();

  //@ts-ignore
  _currentScene.children.forEach(c => c.reset?.())
}



//-------------------------------------------
// Game Interface
//

export function switchScene(sceneName) {
  _sceneName = sceneName
  _currentScene = _scenes[sceneName]
  if (sceneName == SceneName.Duel) {
    resetDuelScene()
  } else {
    resetStaticScene()
  }
}

export function getCameraRig() {
  return _duelCameraRig
}

export function switchActor(actorId, newActorName) {
  let position = null
  if (_actor[actorId]) {
    position = _actor[actorId].position
    _currentScene.remove(_actor[actorId].mesh)
  }
  _actor[actorId] = _actors[newActorName]
  _currentScene.add(_actor[actorId].mesh)
  if (position) _actor[actorId].position = position
}


export function playActorAnimation(actorId: string, key: AnimName, callback: Function = null) {
  _actor[actorId].setAnimation(key)
  _actor[actorId].playOnce(callback)
  if (key == AnimName.SHOOT) {
    playAudio(AudioName.SHOOT, _sfxEnabled)
  }
  if ([AnimName.SHOT_DEAD_FRONT, AnimName.SHOT_DEAD_BACK, AnimName.STRUCK_DEAD].includes(key)) {
    playAudio(AudioName.BODY_FALL, _sfxEnabled)
  }
  if ([AnimName.SHOT_INJURED_FRONT, AnimName.SHOT_INJURED_BACK, AnimName.STRUCK_INJURED].includes(key)) {
    playAudio(AudioName.GRUNT_FEMALE, _sfxEnabled)
  }
  if (key == AnimName.STRIKE_LIGHT) {
    playAudio(AudioName.STRIKE_LIGHT, _sfxEnabled)
  }
  if (key == AnimName.STRIKE_HEAVY) {
    playAudio(AudioName.STRIKE_HEAVY, _sfxEnabled)
  }
  if (key == AnimName.STRIKE_BLOCK) {
    playAudio(AudioName.STRIKE_BLOCK, _sfxEnabled)
  }
}



//----------------
// Animation triggers
//

export function zoomCameraToPaces(paceCount, seconds) {
  const targetPos = {
    x: map(paceCount, 0, 10, zoomedCameraPos.x, 0),
    y: map(paceCount, 0, 10, zoomedCameraPos.y, 0),
    z: map(paceCount, 0, 10, zoomedCameraPos.z, 0),
  }
  if (_tweens.cameraPos) TWEEN.remove(_tweens.cameraPos)
  if (seconds == 0) {
    // just set
    // console.log(`CAMS SET`, targetPos)
    _duelCameraRig.position.set(targetPos.x, targetPos.y, targetPos.z)
  } else {
    // console.log(`CAM ANIM`, targetPos)
    // animate
    _tweens.cameraPos = new TWEEN.Tween(_duelCameraRig.position)
      .to(targetPos, seconds * 1000)
      // .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        // emitter.emit('movedTo', { x: _duelCameraRig.position.x, y: _duelCameraRig.position.y, z: _duelCameraRig.position.z })
      })
      .start()
      .onComplete(() => {
        // console.log(`CAM ===`, _duelCamera.position, _duelCameraRig.position)
      })
  }
}

export function animateActorPaces(actorId, paceCount, seconds) {
  const tweenKey = `actorPos${actorId}`
  const direction = actorId == 'A' ? -1 : 1
  const start = PACES_X_0 * direction
  const targetPos = {
    x: map(paceCount, 0, 10, start, start + (PACES_X_STEP * paceCount * direction)),
    y: PACES_Y,
    z: 10,
  }
  if (_tweens[tweenKey]) TWEEN.remove(_tweens[tweenKey])
  if (seconds == 0) {
    // just set
    _actor[actorId].mesh.position.set(targetPos.x, targetPos.y, targetPos.z)
  } else {
    // animate
    _tweens[tweenKey] = new TWEEN.Tween(_actor[actorId].mesh.position)
      .to(targetPos, seconds * 1000)
      // .easing(TWEEN.Easing.Cubic.Out)
      .start()
  }
}

export function animateDuel(state:AnimationState, actionA: number, actionB:number, healthA:number, healthB:number) {
  if (state == AnimationState.Round1) {
    animateShootout(actionA, actionB, healthA, healthB);
  } else {
    animateBlades(state, actionA, actionA, healthA, healthB)
  }
}

function animateShootout(paceCountA: number, paceCountB: number, healthA: number, healthB: number) {
  const paceCount = Math.min(paceCountA, paceCountB)

  // animate camera
  zoomCameraToPaces(0, 0)
  zoomCameraToPaces(paceCount, paceCount)

  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)
  animateActorPaces('A', paceCount, paceCount)
  animateActorPaces('B', paceCount, paceCount)

  // animate sprites
  playActorAnimation('A', AnimName.STEP_1)
  playActorAnimation('B', AnimName.STEP_1)
  for (let i = 1; i < paceCount; ++i) {
    const key: AnimName = i % 2 == 1 ? AnimName.STEP_2 : AnimName.STEP_1
    setTimeout(() => {
      playActorAnimation('A', key)
      playActorAnimation('B', key)
    }, i * 1000)
  }

  // SHOOT!
  setTimeout(() => {
    //
    // Both fire at same time
    if (paceCountA == paceCountB) {
      playActorAnimation('A', AnimName.SHOOT, () => {
        if (healthA == 0) {
          playActorAnimation('A', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
        } else if (healthA < constants.FULL_HEALTH) {
          playActorAnimation('A', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
        } else {
          emitter.emit('animated', AnimationState.Round1)
        }
      })
      playActorAnimation('B', AnimName.SHOOT, () => {
        if (healthB == 0) {
          playActorAnimation('B', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
        } else if (healthB < constants.FULL_HEALTH) {
          playActorAnimation('B', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
        } else {
          emitter.emit('animated', AnimationState.Round1)
        }
      })
    }
    //
    // A fires first
    if (paceCountA < paceCountB) {
      const _chance = () => {
        playActorAnimation('B', AnimName.SHOOT, () => {
          if (healthA == 0) {
            playActorAnimation('A', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
          } else if (healthA < constants.FULL_HEALTH) {
            playActorAnimation('A', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
          } else {
            emitter.emit('animated', AnimationState.Round1)
          }
        })
      }
      playActorAnimation('A', AnimName.SHOOT, () => {
        if (healthB == 0) {
          playActorAnimation('B', AnimName.SHOT_DEAD_BACK, () => emitter.emit('animated', AnimationState.Round1))
        } else if (healthB < constants.FULL_HEALTH) {
          playActorAnimation('B', AnimName.SHOT_INJURED_BACK, () => _chance())
        } else {
          _chance()
        }
      })
    }
    //
    // B fires first
    if (paceCountB < paceCountA) {
      const _chance = () => {
        playActorAnimation('A', AnimName.SHOOT, () => {
          if (healthB == 0) {
            playActorAnimation('B', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
          } else if (healthB < constants.FULL_HEALTH) {
            playActorAnimation('B', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
          } else {
            emitter.emit('animated', AnimationState.Round1)
          }
        })
      }
      playActorAnimation('B', AnimName.SHOOT, () => {
        if (healthA == 0) {
          playActorAnimation('A', AnimName.SHOT_DEAD_BACK, () => emitter.emit('animated', AnimationState.Round1))
        } else if (healthA < constants.FULL_HEALTH) {
          playActorAnimation('A', AnimName.SHOT_INJURED_BACK, () => _chance())
        } else {
          _chance()
        }
      })
    }
  }, paceCount * 1000)

}

const _getBladeAnimName = (blade: Blades): AnimName => (
  blade == Blades.Fast ? AnimName.STRIKE_LIGHT
    : blade == Blades.Strong ? AnimName.STRIKE_HEAVY
      : AnimName.STRIKE_BLOCK)

function animateBlades(state: AnimationState, actionA: number, actionB: number, healthA: number, healthB: number) {

  // Rewind camera and
  zoomCameraToPaces(0, 0)
  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)

  // animate sprites
  playActorAnimation('A', _getBladeAnimName(actionA), () => {
    let survived = 0
    if (healthB == 0) {
      playActorAnimation('B', AnimName.STRUCK_DEAD, () => emitter.emit('animated', state))
    } else if (healthB < constants.FULL_HEALTH) {
      playActorAnimation('B', AnimName.STRUCK_INJURED, () => emitter.emit('animated', state))
    } else {
      survived++
    }
    if (healthA == 0) {
      playActorAnimation('A', AnimName.STRUCK_DEAD, () => emitter.emit('animated', state))
    } else if (healthA < constants.FULL_HEALTH) {
      playActorAnimation('A', AnimName.STRUCK_INJURED, () => emitter.emit('animated', state))
    } else {
      survived++
    }
    if (survived == 2) emitter.emit('animated', state)
  })

  playActorAnimation('B', _getBladeAnimName(actionB), () => {
    // only A need to animate
  })

}



//-------------------------------
// Audio
//
export function playAudio(name: AudioName, enabled: boolean = true) {
  const asset = AUDIO_ASSETS[name]
  if (asset?.object) {
    setTimeout(() => {
      if (asset.object.isPlaying) {
        asset.object.stop()
      }
      if (enabled) {
        asset.object.play()
      }
    }, (asset.delaySeconds ?? 0) * 1000)
  }
}

export function pauseAudio(name: AudioName) {
  const asset = AUDIO_ASSETS[name]
  asset?.object?.pause()
}

export function stopAudio(name: AudioName) {
  const asset = AUDIO_ASSETS[name]
  asset?.object?.stop()
}

export function setSfxEnabled(enabled: boolean) {
  _sfxEnabled = enabled
}
