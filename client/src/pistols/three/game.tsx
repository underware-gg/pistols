import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'

import { AudioName, AUDIO_ASSETS } from '@/pistols/data/assets'

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

const TEXTURE_PATHS = {
  TESTCARD: { path: '/textures/testcard.jpg' },
  BG_DUEL: { path: '/textures/bg_duel.png' },
}
let _textures: any = {
}

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

  Object.keys(TEXTURE_PATHS).forEach(key => {
    const TEX = TEXTURE_PATHS[key]
    const tex = new THREE.TextureLoader().load(TEX.path)
    // tex.magFilter = THREE.NearestFilter
    // tex.minFilter = THREE.NearestFilter
    _textures[key] = tex
  })

  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    canvas,
  })
  _renderer.setSize(WIDTH, HEIGHT)
  _renderer.outputColorSpace = THREE.LinearSRGBColorSpace // fix bright textures

  setupScene()

  _cameraRig = new THREE.Object3D()
  _cameraRig.position.set(0, 0, 0)
  _scene.add(_cameraRig)

  _camera = new THREE.PerspectiveCamera(
    FOV,        // fov
    ASPECT,     // aspect
    0.01,       // near
    WIDTH * 2,  // far
  )
  _cameraRig.add(_camera)

  onWindowResize()

  window.addEventListener('resize', onWindowResize)

  // framerate
  if (statsEnabled) {
    _stats = new Stats()
    document.body.appendChild(_stats.dom)
  }
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
  console.log(canvasWidth, canvasHeight, h_z_ratio, camHeight)
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

  _renderer.render(_scene, _camera)

  _stats?.update()
}


//-------------------------------------------
// Scene hook
//

let _fullScreenGeom: THREE.PlaneGeometry = null

function setupScene() {
  _scene = new THREE.Scene()

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



  // const mat_blue = new THREE.MeshBasicMaterial({ color: 'blue' })
  // const mat_red = new THREE.MeshBasicMaterial({ color: 'red' })
  // const quad1 = new THREE.Mesh(_fullScreenGeom, mat_blue)
  // quad1.position.set(0, 0, 1)
  // _scene.add(quad1)
  // const quad2_geometry = new THREE.PlaneGeometry(WIDTH / 2, HEIGHT / 2)
  // const quad2 = new THREE.Mesh(quad2_geometry, mat_red)
  // quad2.position.set(WIDTH / 2, HEIGHT / 2, 1)
  // _scene.add(quad2)

}

export function getCameraRig() {
  return _cameraRig
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

