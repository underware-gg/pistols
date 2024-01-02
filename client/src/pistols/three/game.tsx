import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'

// event emitter
// var ee = require('event-emitter');
import ee from 'event-emitter'
export var emitter = ee()

import { AudioName, AUDIO_ASSETS, TEXTURES, SPRITESHEETS } from '@/pistols/data/assets'
import { map } from '../utils/utils'
import { SpriteSheet, Actor } from './SpriteSheetMaker'
import { Blades, FULL_HEALTH } from '../utils/pistols'

const PI = Math.PI
const HALF_PI = Math.PI * 0.5
const ONE_HALF_PI = Math.PI * 1.5
const TWO_PI = Math.PI * 2
const R_TO_D = (180 / Math.PI)

//---------------------------
// CONSTANTS
//

const WIDTH = 1920//1200
const HEIGHT = 1080//675
const ASPECT = (WIDTH / HEIGHT)
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
  None,
  Pistols,
  Blades,
}

//-------------------------------------------
// Setup
//

let _textures: any = {}
let _spriteSheets: any = {}

let _animationRequest = null
let _renderer: THREE.WebGLRenderer
let _camera: THREE.PerspectiveCamera
let _cameraRig: THREE.Object3D
let _scene: THREE.Scene
let _supportsExtension: boolean = true
let _stats


export function dispose() {
  if (_animationRequest) cancelAnimationFrame(_animationRequest)
  _animationRequest = null
  _renderer?.dispose()
  _renderer = null
  _scene = null
}

export async function init(canvas, width, height, statsEnabled = false) {

  if (_scene) return

  console.log(`THREE.init()`)

  Object.keys(TEXTURES).forEach(key => {
    const TEX = TEXTURES[key]
    const tex = new THREE.TextureLoader().load(TEX.path)
    // tex.magFilter = THREE.NearestFilter
    // tex.minFilter = THREE.NearestFilter
    _textures[key] = tex
  })
  Object.keys(SPRITESHEETS).forEach(actorName => {
    _spriteSheets[actorName] = {}
    Object.keys(SPRITESHEETS[actorName]).forEach(key => {
      _spriteSheets[actorName][key] = new SpriteSheet(key, SPRITESHEETS[actorName][key])
    })
  })

  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    canvas,
  })
  _renderer.setSize(WIDTH, HEIGHT)
  _renderer.outputColorSpace = THREE.LinearSRGBColorSpace // fix bright textures

  _cameraRig = new THREE.Object3D()
  _cameraRig.position.set(0, 0, 0)

  _camera = new THREE.PerspectiveCamera(
    FOV,        // fov
    ASPECT,     // aspect
    0.01,       // near
    WIDTH * 2,  // far
  )
  _cameraRig.add(_camera)

  window.addEventListener('resize', onWindowResize)

  setupScene()

  // framerate
  if (statsEnabled) {
    _stats = new Stats()
    document.body.appendChild(_stats.dom)
  }

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
  _camera.up.set(0, 1, 0)
  _camera.position.set(0, 0, camHeight)
  _camera.lookAt(0, 0, 0)
  _camera.updateProjectionMatrix()
}


//-------------------------------------------
// Game Loop
//

export function animate(time) {
  if (!_supportsExtension || !_scene || !_renderer) return

  _animationRequest = requestAnimationFrame(animate)

  TWEEN.update()

  _actor.A.update(time)
  _actor.B.update(time)

  _renderer.render(_scene, _camera)

  _stats?.update()
}


//-------------------------------------------
// Scene hook
//

let _fullScreenGeom: THREE.PlaneGeometry = null
let _actors: any = {}
let _actor: any = {}

function setupScene() {
  _scene = new THREE.Scene()
  _scene.add(_cameraRig)

  // const light = new THREE.AmbientLight(0x404040) // soft white light
  // _scene.add(light)

  _fullScreenGeom = new THREE.PlaneGeometry(WIDTH, HEIGHT)

  // const testcard_mat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: _textures.TESTCARD })
  // const testcard = new THREE.Mesh(_fullScreenGeom, testcard_mat)
  // testcard.position.set(0, 0, -1)
  // _scene.add(testcard)

  // BG
  const bg_duel_mat = new THREE.MeshBasicMaterial({ map: _textures.BG_DUEL })
  const bg_duel = new THREE.Mesh(_fullScreenGeom, bg_duel_mat)
  bg_duel.position.set(0, 0, 0)
  _scene.add(bg_duel)


  _actors.FEMALE_A = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_WIDTH, true)
  _actors.FEMALE_B = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_WIDTH, false)

  _actors.FEMALE_A.mesh.position.set(-PACES_X_0, PACES_Y, 1)
  _actors.FEMALE_B.mesh.position.set(PACES_X_0, PACES_Y, 1)

  onWindowResize()

  switchActor('A', 'FEMALE_A')
  switchActor('B', 'FEMALE_B')

  resetScene()

}

export function resetScene() {
  emitter.emit('animated', AnimationState.None)

  zoomCameraToPaces(0, 5)

  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)
  playActorAnimation('A', 'STILL')
  playActorAnimation('B', 'STILL')
}

export function getCameraRig() {
  return _cameraRig
}

export function switchActor(actorId, newActorName) {
  let position = null
  if (_actor[actorId]) {
    position = _actor[actorId].position
    _scene.remove(_actor[actorId].mesh)
  }
  _actor[actorId] = _actors[newActorName]
  _scene.add(_actor[actorId].mesh)
  if (position) _actor[actorId].position = position
}


export function playActorAnimation(actorId: string, key: string, callback: Function = null) {
  _actor[actorId].setAnimation(key)
  _actor[actorId].playOnce(callback)
  if (key == 'SHOOT') {
    playAudio(AudioName.SHOOT)
  }
  if (['SHOT_DEAD_FRONT', 'SHOT_DEAD_BACK', 'STRUCK_DEAD'].includes(key)) {
    playAudio(AudioName.BODY_FALL)
  }
  if (['SHOT_INJURED_FRONT', 'SHOT_INJURED_BACK', 'STRUCK_INJURED'].includes(key)) {
    playAudio(AudioName.GRUNT_FEMALE)
  }
  if (key == 'STRIKE_LIGHT') {
    playAudio(AudioName.STRIKE_LIGHT)
  }
  if (key == 'STRIKE_HEAVY') {
    playAudio(AudioName.STRIKE_HEAVY)
  }
  if (key == 'STRIKE_BLOCK') {
    playAudio(AudioName.STRIKE_BLOCK)
  }
}



//----------------
// Animation triggers
//
const _tweens = {
  cameraPos: null,
  actorPosA: null,
  actorPosB: null,
}

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
    _cameraRig.position.set(targetPos.x, targetPos.y, targetPos.z)
  } else {
    // console.log(`CAM ANIM`, targetPos)
    // animate
    _tweens.cameraPos = new TWEEN.Tween(_cameraRig.position)
      .to(targetPos, seconds * 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        // emitter.emit('movedTo', { x: _cameraRig.position.x, y: _cameraRig.position.y, z: _cameraRig.position.z })
      })
      .start()
      .onComplete(() => {
        // console.log(`CAM ===`, _camera.position, _cameraRig.position)
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

export function animateShootout(paceCountA, paceCountB, healthA, healthB) {
  const paceCount = Math.min(paceCountA, paceCountB)

  // animate camera
  zoomCameraToPaces(0, 0)
  zoomCameraToPaces(paceCount, paceCount)

  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)
  animateActorPaces('A', paceCount, paceCount)
  animateActorPaces('B', paceCount, paceCount)

  // animate sprites
  playActorAnimation('A', 'STEP_1')
  playActorAnimation('B', 'STEP_1')
  for(let i = 1 ; i < paceCount ; ++i) {
    const key = i % 2 == 1 ? 'STEP_2' : 'STEP_1'
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
      playActorAnimation('A', 'SHOOT', () => {
        if (healthA == 0) {
          playActorAnimation('A', 'SHOT_DEAD_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
        } else if (healthA < FULL_HEALTH) {
          playActorAnimation('A', 'SHOT_INJURED_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
        } else {
          emitter.emit('animated', AnimationState.Pistols)
        }
      })
      playActorAnimation('B', 'SHOOT', () => {
        if (healthB == 0) {
          playActorAnimation('B', 'SHOT_DEAD_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
        } else if (healthB < FULL_HEALTH) {
          playActorAnimation('B', 'SHOT_INJURED_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
        } else {
          emitter.emit('animated', AnimationState.Pistols)
        }
      })
    }
    //
    // A fires first
    if (paceCountA < paceCountB) {
      const _chance = () => {
        playActorAnimation('B', 'SHOOT', () => {
          if (healthA == 0) {
            playActorAnimation('A', 'SHOT_DEAD_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
          } else if (healthA < FULL_HEALTH) {
            playActorAnimation('A', 'SHOT_INJURED_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
          } else {
            emitter.emit('animated', AnimationState.Pistols)
          }
        })
      }
      playActorAnimation('A', 'SHOOT', () => {
        if (healthB == 0) {
          playActorAnimation('B', 'SHOT_DEAD_BACK', () => emitter.emit('animated', AnimationState.Pistols))
        } else if (healthB < FULL_HEALTH) {
          playActorAnimation('B', 'SHOT_INJURED_BACK', () => _chance())
        } else {
          _chance()
        }
      })
    }
    //
    // B fires first
    if (paceCountB < paceCountA) {
      const _chance = () => {
        playActorAnimation('A', 'SHOOT', () => {
          if (healthB == 0) {
            playActorAnimation('B', 'SHOT_DEAD_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
          } else if (healthB < FULL_HEALTH) {
            playActorAnimation('B', 'SHOT_INJURED_FRONT', () => emitter.emit('animated', AnimationState.Pistols))
          } else {
            emitter.emit('animated', AnimationState.Pistols)
          }
        })
      }
      playActorAnimation('B', 'SHOOT', () => {
        if (healthA == 0) {
          playActorAnimation('A', 'SHOT_DEAD_BACK', () => emitter.emit('animated', AnimationState.Pistols))
        } else if (healthA < FULL_HEALTH) {
          playActorAnimation('A', 'SHOT_INJURED_BACK', () => _chance())
        } else {
          _chance()
        }
      })
    }
  }, paceCount * 1000)

}

const _getBladeAnimName = (blade) => (blade == Blades.Light ? 'STRIKE_LIGHT' : blade == Blades.Heavy ? 'STRIKE_HEAVY' : 'STRIKE_BLOCK')

export function animateBlades(bladeA, bladeB, healthA, healthB) {

  // Rewind camera and
  zoomCameraToPaces(0, 0)
  animateActorPaces('A', 0, 0)
  animateActorPaces('B', 0, 0)

  // animate sprites
  playActorAnimation('A', _getBladeAnimName(bladeA), () => {
    let survived = 0
    if (healthB == 0) {
      playActorAnimation('B', 'STRUCK_DEAD', () => emitter.emit('animated', AnimationState.Blades))
    } else if (healthB < FULL_HEALTH) {
      playActorAnimation('B', 'STRUCK_INJURED', () => emitter.emit('animated', AnimationState.Blades))
    } else {
      survived++
    }
    if (healthA == 0) {
      playActorAnimation('A', 'STRUCK_DEAD', () => emitter.emit('animated', AnimationState.Blades))
    } else if (healthA < FULL_HEALTH) {
      playActorAnimation('A', 'STRUCK_INJURED', () => emitter.emit('animated', AnimationState.Blades))
    } else {
      survived++
    }
    if (survived == 2) emitter.emit('animated', AnimationState.Blades)
  })

  playActorAnimation('B', _getBladeAnimName(bladeB), () => {
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
