import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'

import { AudioName, AUDIO_ASSETS, TEXTURES, SPRITESHEETS } from '@/pistols/data/assets'
import { map } from '../utils/utils'
import { SpriteSheet, Actor } from './SpriteSheetMaker'

const PI = Math.PI
const HALF_PI = Math.PI * 0.5
const ONE_HALF_PI = Math.PI * 1.5
const TWO_PI = Math.PI * 2
const R_TO_D = (180 / Math.PI)

//
// Depth render based on:
// https://threejs.org/examples/#webgl_depth_texture
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_depth_texture.html
//

const WIDTH = 1920//1200
const HEIGHT = 1080//675
const ASPECT = (WIDTH / HEIGHT)
const FOV = 45

const PACES_Y = -50
const PACES_X_0 = 40
const PACES_X_10 = 500

let _textures: any = {}
let _spriteSheets: any = {}

let _animationRequest = null
let _renderer: THREE.WebGLRenderer
let _camera: THREE.PerspectiveCamera
let _cameraRig: THREE.Object3D
let _scene: THREE.Scene
let _supportsExtension: boolean = true
let _stats

//-------------------------------------------
// Setup
//

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
  resetScene()

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
  // testcard.position.set(0, 0, 0)
  // _scene.add(testcard)

  // BG
  const bg_duel_mat = new THREE.MeshBasicMaterial({ map: _textures.BG_DUEL })
  const bg_duel = new THREE.Mesh(_fullScreenGeom, bg_duel_mat)
  bg_duel.position.set(0, 0, 0)
  _scene.add(bg_duel)


  _actors.FEMALE_A = new Actor(_spriteSheets.FEMALE, 70, 70, true)
  _actors.FEMALE_B = new Actor(_spriteSheets.FEMALE, 70, 70, false)

  _actors.FEMALE_A.mesh.position.set(-PACES_X_0, PACES_Y, 1)
  _actors.FEMALE_B.mesh.position.set(PACES_X_0, PACES_Y, 1)

  // current Actors
  switchActor('A', 'FEMALE_A')
  switchActor('B', 'FEMALE_B')

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

export function playActorAnimation(actorId, key) {
  _actor[actorId].setAnimation(key)
  _actor[actorId].playOnce()
}

export function resetScene() {
  // reset camera
  onWindowResize()

  zoomToPaces(0, 5)
}

// Camera zoom
let _tweenCameraPos = null
export function zoomToPaces(targetPaces, seconds) {
  const zeroCameraPos = {
    x: 0,
    y: PACES_Y,
    z: -HEIGHT,
  }

  const targetCameraPos = {
    x: map(targetPaces, 0, 10, zeroCameraPos.x, 0),
    y: map(targetPaces, 0, 10, zeroCameraPos.y, 0),
    z: map(targetPaces, 0, 10, zeroCameraPos.z, 0),
  }

  if (_tweenCameraPos) TWEEN.remove(_tweenCameraPos)
  _tweenCameraPos = new TWEEN.Tween(_cameraRig.position)
    .to(targetCameraPos, seconds * 1000)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(() => {
      // emitter.emit('movedTo', { x: _cameraRig.position.x, y: _cameraRig.position.y, z: _cameraRig.position.z })
    })
    .start()
}



//-------------------------------
// Audio
//
export function playAudio(name: AudioName, enabled: boolean = true) {
  const asset = AUDIO_ASSETS[name]
  if (asset?.object) {
    if (asset.object.isPlaying) {
      asset.object.stop()
    }
    if (enabled) {
      asset.object.play()
    }
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

