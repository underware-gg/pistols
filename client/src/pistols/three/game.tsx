import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
import { Rain } from './Rain'
import { Grass } from './Grass.tsx'
import * as shaders from './shaders.tsx'

// event emitter
// var ee = require('event-emitter');
import ee from 'event-emitter'
export var emitter = ee()

import { AudioName, AUDIO_ASSETS, TEXTURES, CARD_TEXTURES, SPRITESHEETS, sceneBackgrounds, TextureName } from '@/pistols/data/assets'
import { SceneName } from '@/pistols/hooks/PistolsContext'
import { map } from '@/lib/utils/math'
import { SpriteSheet } from './SpriteSheetMaker'
import { DuelistsManager } from './DuelistsManager.tsx'


//---------------------------
// CONSTANTS
//

/**
 * Sizes
 */
export const WIDTH = 1920//1200
export const HEIGHT = 1080//675
export const ASPECT = (WIDTH / HEIGHT)

export const sizes = {
  canvasWidth: WIDTH,
  canvasHeight: HEIGHT
}

/**
 * Camera Constants
 */
const cameraData = {
  fieldOfView: 13,
  nearPlane: 0.1,
  farPlane: 150,
}

const lightCameraShadowData = {
  intensity: 2,
  mapSize: 8192,
  near: 30,
  far: 80,
  top: 30,
  bottom: 10,
  left: -10,
  right: 10,
}

/**
 * glTF file custom object names
 */
const glTFNames = {
  light: 'Sun',
  ground: 'Ground',
  grass: 'Grass',
  water: 'SimpleWaterPlane',
  cliffs: 'Cliffs',
  skyBackground: 'Sky',
  sirSecond: 'Sir_Second',
  speechBubblesLeft: 'Speech_Bubbles',
  ladySecond: 'Lady_Second',
  duelistLeft: 'Sir',
  duelistRight: 'Lady',
}

const zoomedCameraPos = {
  x: 0,
  y: 0.4,
  z: -8,
}
const zoomedOutCameraPos = {
  x: 0,
  y: 4.0,
  z: -30,
}

export enum AnimationState {
  None = 0,
  Round1 = 1,
  Round2 = 2,
  Round3 = 3,
  Finished = 4,
  HealthA = 10,
  HealthB = 11,
}

const _skyState = {
  path: '/textures/animations/Sky/sky.mp4',
  frameRate: 8,
  framesCount: 126,
  isBackwards: false,
  lastDisplayTime: 0,
  currentFrame: 0
}

const waterColors = {
  shallow: 0x597f86,
  deep: 0x35595e
}

//-------------------------------------------
// Setup
//

let _framerate = 60

let _textures: any = {}
let _cardTextures: any = {}
let _spriteSheets: any = {}

export let _renderer: THREE.WebGLRenderer
let _fullScreenBackground: THREE.Mesh = null

let _animationRequest = null
let _clock: THREE.Clock
let _duelCamera: THREE.PerspectiveCamera
let _staticCamera: THREE.PerspectiveCamera
let _supportsExtension: boolean = true
let _stats
let _controls
export let _gui: GUI

let _grassTransforms
let _growthPercentage
let _grass

let _ground
let _groundMirror
let _skyVideo
let _skyVideoTexture
let _ladySecond
let _sirSecond
let _duelistManager: DuelistsManager

let _currentScene: THREE.Scene = null
let _scenes: Partial<Record<SceneName, THREE.Scene>> = {}
let _sceneName: SceneName

export let _sfxEnabled = true
export let _statsEnabled = false
let _round1Animated = false
let _round2Animated = false
let _round3Animated = false

const _tweens = {
  cameraPos: null,
  actorPosA: null,
  actorPosB: null,
  staticZoom: null,
  staticFade: null,
}

export async function init(canvas, framerate = 60, statsEnabled = false) {

  if (Object.keys(_scenes).length > 0) {
    return
  }

  _framerate = framerate
  _statsEnabled = statsEnabled

  setRender(canvas)

  console.log(`THREE.init() loading assets...`)

  // color space migration
  // https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
  // THREE.ColorManagement.enabled = false
  await loadAssets()
  console.log(`THREE.init() assets loaded...`)

  _growthPercentage = localStorage.getItem('GROWTH')
  
  if (_statsEnabled) {
    _stats = new Stats()
    document.body.appendChild(_stats.dom)
  }

  setCameras()

  window.addEventListener('beforeunload', dispose);
  window.addEventListener('resize', onWindowResize)
  onWindowResize()

  setupScenes()

  _clock = new THREE.Clock(true)

  console.log(`THREE.init() done 👍`)
}

async function loadAssets() {
  await shaders.loadShaders();

  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const ktx2Loader = new KTX2Loader(loadingManager)
  ktx2Loader.setTranscoderPath( '/basis/' )
  ktx2Loader.detectSupport( _renderer )
  ktx2Loader.setWorkerLimit(4)

  Object.keys(TEXTURES).forEach(key => {
    const TEX = TEXTURES[key]
    if (TEX.path.includes('.ktx2')) {
      ktxLoaderCount ++;
      ktx2Loader.load(TEX.path, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        _textures[key] = tex

        if (key == TextureName.duel_ground && _ground) {
          _ground.material.map = tex
          _ground.material.needsUpdate = true
        } else if (key == TextureName.duel_ground_normal && _ground) {
          _ground.material.normalMap = tex
          _ground.material.needsUpdate = true
        } else if (key == TextureName.duel_water_map && _groundMirror) {
          _groundMirror.setUniformValue('waterMap', tex)
        }

        ktxLoaderCount --;
      })
    } else {
      const tex = textureLoader.load(TEX.path)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter

      if (TEX == TEXTURES.cliffs) {
        // tex.flipY = false
      }
      _textures[key] = tex
    }
  })

  Object.keys(SPRITESHEETS).forEach(actorName => {
    _spriteSheets[actorName] = {}
    Object.keys(SPRITESHEETS[actorName]).forEach(key => {
      _spriteSheets[actorName][key] = new SpriteSheet(key, SPRITESHEETS[actorName][key], ktx2Loader)
    })
  })

  Object.keys(CARD_TEXTURES).forEach(cardKey => {
    const TEX = CARD_TEXTURES[cardKey]
    const tex = textureLoader.load(TEX.path)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    tex.minFilter = THREE.LinearFilter
    _cardTextures[cardKey] = tex
  })

  _textures[TextureName.duel_water_dudv].wrapS = _textures[TextureName.duel_water_dudv].wrapT = THREE.RepeatWrapping;
  
  setTimeout(() => {
    checkKTX2LoaderState(ktx2Loader)
  }, 5_000)
}

let ktxLoaderCount = 0
//make sure the ktx2 loader disposes AFTER all the textures have been loaded
function checkKTX2LoaderState(loader) {
  let completed = true
  Object.keys(SPRITESHEETS).forEach(actorName => {
    Object.keys(SPRITESHEETS[actorName]).forEach(key => {
      if (!_spriteSheets[actorName][key].isLoaded) {
        completed = false 
      }
    })
  })
  if (ktxLoaderCount == 0 && completed) {
    loader.dispose()
  } else {
    setTimeout(() => {
      checkKTX2LoaderState(loader)
    }, 1_000)
  } 
}

function setRender(canvas) {
  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas,
  })
  _renderer.setSize(WIDTH, HEIGHT)
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  // _renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  // _renderer.autoClear = false
  // _renderer.autoClearColor = false
  _renderer.shadowMap.enabled = true
  _renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // _renderer.debug.checkShaderErrors = false;
}

function setCameras() {
  _duelCamera = new THREE.PerspectiveCamera(
    cameraData.fieldOfView,
    ASPECT,
    cameraData.nearPlane,
    cameraData.farPlane,
  )
  _staticCamera = new THREE.PerspectiveCamera(
    cameraData.fieldOfView,
    ASPECT,
    cameraData.nearPlane,
    cameraData.farPlane,
  )
}

function onWindowResize() {
  // calc canvas size
  const winWidth = window.innerWidth
  const winHeight = window.innerHeight
  const aspect = winWidth / winHeight
  const canvasWidth = aspect > ASPECT ? winHeight * ASPECT : winWidth
  const canvasHeight = aspect > ASPECT ? winHeight : winWidth / ASPECT
  sizes.canvasWidth = canvasWidth
  sizes.canvasHeight = canvasHeight
  _renderer.setSize(canvasWidth, canvasHeight)
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
  console.log(`Canvas size:`, Math.ceil(canvasWidth), Math.ceil(canvasHeight), `${Math.ceil((canvasHeight / 1080) * 100)}%`)

  // setup cam
  _duelCamera.updateProjectionMatrix()
  _staticCamera.updateProjectionMatrix()
}

function setGUI() {
  _gui = new GUI({
    width: 400,
    title: 'Scene Debug UI',
    closeFolders: true,
  });
  _gui.close();
}



//-------------------------------------------
// Game Loop
//

let lastFrameTime = performance.now()

export function animate() {
  if (!_supportsExtension || !_renderer) return

  const now = performance.now()
  const delta = now - lastFrameTime

  const deltaTime = _clock.getDelta()
  const elapsedTime = _clock.getElapsedTime()

  const frameDuration = 1000 / _framerate

  // More precise frame rate controll
  if (delta >= frameDuration) {
    lastFrameTime = now - (delta % frameDuration)

    if (_currentScene) {
      TWEEN.update()

      _renderer.clear()

      if (_sceneName == SceneName.Duel) {
        _groundMirror?.setUniformValue("time", elapsedTime)
        _controls?.update()
        _grass?.update(deltaTime)

        _renderer.render(_currentScene, _duelCamera)
      } else {
        //@ts-ignore
        _currentScene.children.forEach(c => c.animate?.(deltaTime)) //replaced with deltaTime (could be elapsedTime), because if more than one childs had called getDelta() the animation wont work as supposed
        _renderer.render(_currentScene, _staticCamera)
      }

      _stats?.update()
    }
  }

  if (_currentScene && _sceneName == SceneName.Duel) {  //Duelists and sky take care of their own framerate so for frame consistency this is better
    _duelistManager.update(deltaTime, elapsedTime)
  }

  // Continue the animation loop
  _animationRequest = requestAnimationFrame(animate)
}


//-------------------------------------------
// Scene hook
//

function setupScenes() {
  _scenes = {}
  Object.keys(sceneBackgrounds).forEach((sceneName) => {
    if (sceneName == SceneName.Duel) {
      _scenes[sceneName] = setupDuelScene()
    } else {
      _scenes[sceneName] = setupStaticScene(sceneName)
    }
  })
}

//
// SceneName.Duel
//
function setupDuelScene() {
  const scene = new THREE.Scene()
  scene.add(_duelCamera)

  setEnvironment(scene)

  if (_statsEnabled) {
    setGUI()
    setCameraHelpers(scene)
  }

  loadGltf(scene)

  _duelistManager = new DuelistsManager(scene, _duelCamera, _spriteSheets, _cardTextures)

  return scene
}

export function resetDuelScene() {
  if (!_duelistManager.resetDuelists()) return

  emitter.emit('animated', AnimationState.None)

  if (_sirSecond && _ladySecond) {
    _sirSecond.visible = true
    _ladySecond.visible = true
  }

  _round1Animated = false
  _round2Animated = false
  _round3Animated = false

  zoomCameraToPaces(10, 0)
  zoomCameraToPaces(0, 5)
}

function setEnvironment(scene: THREE.Scene) { //TODO add skymap
  /**
   * Environment map
   * set the scene environment and or background
   */
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('/textures/sky_2k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
  })
}

function loadGltf(scene: THREE.Scene) {
  const loader = new GLTFLoader();

  loader.load(
    '/models/Duel_3_water_y.glb',
    function (gltf) {

      /**
       * Adjust gltf children
       */

      const grassTransforms = []
      Array.from(gltf.scene.children).forEach((child: any) => {
        if (child.isLight) {
          if (child.name == glTFNames.light) {
            child.intensity = lightCameraShadowData.intensity
            child.shadow.mapSize.set(lightCameraShadowData.mapSize, lightCameraShadowData.mapSize)
            child.shadow.camera.near = lightCameraShadowData.near
            child.shadow.camera.far = lightCameraShadowData.far
            child.shadow.camera.top = lightCameraShadowData.top
            child.shadow.camera.bottom = lightCameraShadowData.bottom
            child.shadow.camera.left = lightCameraShadowData.left
            child.shadow.camera.right = lightCameraShadowData.right
            child.castShadow = true

            //Light helpers
            // const dirLightCameraHelper2 = new THREE.CameraHelper(child.shadow.camera)
            // const directionalLightHelper2 = new THREE.DirectionalLightHelper(child) 
            // scene.add(directionalLightHelper2)
            // scene.add(dirLightCameraHelper2)
          }
        }

        if (child.name == glTFNames.sirSecond || child.name == glTFNames.ladySecond) {
          child.castShadow = true
          child.material.alphaTest = 0.5
          child.position.y = 0
          if (child.name == glTFNames.sirSecond) {
            _sirSecond = child
          } else {
            _ladySecond = child
          }
        } else if (child.name == glTFNames.duelistLeft || child.name == glTFNames.duelistRight) {
          child.castShadow = true
          child.material.alphaTest = 0.5
          child.visible = false
        }

        if (child.name == glTFNames.ground) {
          child.receiveShadow = true
          child.material.map = _textures[TextureName.duel_ground],
          child.material.normalMap = _textures[TextureName.duel_ground_normal],
          child.position.set(0, 0, 0)

          _ground = child
        }

        if (child.name.includes(glTFNames.grass)) {
          const matrix = new THREE.Matrix4()
          matrix.compose(child.getWorldPosition(new THREE.Vector3()), child.getWorldQuaternion(new THREE.Quaternion()), child.getWorldScale(new THREE.Vector3()))

          grassTransforms.push(matrix)

          gltf.scene.remove(child)
        }

        if (child.name.includes(glTFNames.cliffs)) {
          const texture = _textures[TextureName.cliffs]
          const textureAspectRatio = texture.image.width / texture.image.height
          
          const planeGeometry = new THREE.PlaneGeometry(textureAspectRatio, 1)
          const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, transparent: true, side: THREE.DoubleSide })
          const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)

          const boundingBox = new THREE.Box3().setFromObject(child)
          const childSize = new THREE.Vector3()
          boundingBox.getSize(childSize)

          planeMesh.position.copy(child.position)
          planeMesh.position.z += 15;
          // planeMesh.position.y += 2;
          planeGeometry.rotateY(Math.PI)
          planeMesh.scale.set(childSize.x * 0.73, childSize.x * 0.73, childSize.z)

          scene.add(planeMesh)

          child.visible = false
        }

        if (child.name == glTFNames.skyBackground) {
          child.material = new THREE.MeshBasicMaterial()
          child.renderOrder = -1
          child.position.y = 0.2
          child.position.z = 50

          const video = document.createElement('video');
          video.src = _skyState.path;
          video.muted = true;
          video.autoplay = true;
          video.loop = true;
          video.playbackRate = 0.5 //8 fps -> update with wind to go faster or slower even
          video.play()

          const texture = new THREE.VideoTexture(video);
          texture.colorSpace = THREE.SRGBColorSpace
          texture.flipY = false
          
          child.material.map = texture

          _skyVideo = video
          _skyVideoTexture = texture
        }

        if (child.name == glTFNames.water) {
          child.visible = false
          child.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));

          _groundMirror = createWaterPlane("Water", child.geometry, {
            height: -0.001,
            rotation: child.rotation,
            scale: child.scale
          })

          scene.add(_groundMirror)
        }
        
      })

      _grassTransforms = grassTransforms
      createGrass()
      
      scene.add(gltf.scene);
    }
  );
}

function createWaterPlane(name, geometry, params) {
  const water = new shaders.ReflectorMaterial("WATER", geometry, {
    clipBias: 0.0003,
    textureWidth: WIDTH,
    textureHeight: HEIGHT, //TODO check if this works??
  });

  water.setUniformValue('waterStrength', 0.04)
  water.setUniformValue('waterSpeed', 0.03)
  water.setUniformValue('waveStrength', 0.04)
  water.setUniformValue('waveSpeed', 0.05)
  water.setUniformValue('tDudv', _textures[TextureName.duel_water_dudv])
  water.setUniformValue('waterMap', _textures[TextureName.duel_water_map])
  water.setUniformValue('windDirection', new THREE.Vector2(1.0, 0.0))
  water.setUniformValue('colorDeep', new THREE.Color(waterColors.deep))
  water.setUniformValue('colorShallow', new THREE.Color(waterColors.shallow))

  water.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z)
  water.rotateX(Math.PI / 2)
  water.scale.set(params.scale.x, params.scale.z, params.scale.y)
  water.position.y = params.height;
  water.position.z += 0.01
  water.scale.x += 0.0025
  water.scale.y += 0.0025

  if (_statsEnabled) {
    let waterGUI = _gui.addFolder(name);
    waterGUI
      .add(water.getUniforms()['waterSpeed'], 'value')
      .name('waterSpeed')
      .min(0.0001).max(1).step(0.0001)
    waterGUI
      .add(water.getUniforms()['waterStrength'], 'value')
      .name('waterStrength')
      .min(0.0001).max(1).step(0.0001)
    waterGUI
      .add(water.getUniforms()['waveSpeed'], 'value')
      .name('waveSpeed')
      .min(0.0001).max(1).step(0.0001)
    waterGUI
      .add(water.getUniforms()['waveStrength'], 'value')
      .name('waveStrength')
      .min(0.0001).max(1).step(0.0001)
    waterGUI
      .add(water.getUniforms()['windDirection'].value, 'x')
      .name('windDirection - x')
      .min(-1.0).max(1.0).step(0.01)
    waterGUI
      .add(water.getUniforms()['windDirection'].value, 'y')
      .name('windDirection - y')
      .min(-1.0).max(1.0).step(0.01)
    waterGUI
      .addColor(waterColors, 'shallow')
      .onChange(() => {
        water.setUniformValue('colorShallow', new THREE.Color(waterColors.shallow))
      })
      .name('colorShallow');
    waterGUI
      .addColor(waterColors, 'deep')
      .onChange(() => {
        water.setUniformValue('colorDeep', new THREE.Color(waterColors.deep))
      })
      .name('colorDeep');
  }

  return water
}

function createGrass() {
  if (!_scenes[SceneName.Duel]) return;
  if (!_grassTransforms || _growthPercentage == undefined) return;
  if (_grass) return;

  _grass = new Grass(
    {
      height: 0,
      offset: 0.007,
      heightmap: null,
      dims: 256,
      transforms: _grassTransforms,
      growth: _growthPercentage
    }
  );

  _scenes[SceneName.Duel].add(_grass);
}

function setCameraHelpers(scene) {
  _controls = new OrbitControls(_duelCamera, _renderer.domElement)
  _controls.enableDamping = true
  _controls.dampingFactor = 0.04

  const axesHelper = new THREE.AxesHelper(3)
  scene.add(axesHelper)

  if (_statsEnabled) {
    _gui
      .add(_duelCamera, 'fov')
      .name('FOV')
      .min(0).max(60).step(0.1)
      .onChange(() => {
        _duelCamera.updateProjectionMatrix()
      })
  }
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

  const bgDistance = -1
  const vFOV = THREE.MathUtils.degToRad(cameraData.fieldOfView * 0.5)
  const height = 2 * Math.tan(vFOV) * Math.abs(bgDistance)
  const width = height * ASPECT
  const fullScreenGeom = new THREE.PlaneGeometry(width, height)

  _fullScreenBackground = new THREE.Mesh(fullScreenGeom, bg_mat)
  _fullScreenBackground.name = 'bg'
  _fullScreenBackground.renderOrder = 9999
  _fullScreenBackground.position.set(0, 0, bgDistance)
  scene.add(_fullScreenBackground)

  scene.add(_staticCamera)

  if (sceneName == SceneName.Gate) {
    // const rain = new Rain(bg)
    // scene.add(rain)
  }

  return scene
}

export function resetStaticScene() {
  if (!_currentScene) return
  
  if (_tweens.staticZoom) TWEEN.remove(_tweens.staticZoom)
  if (_tweens.staticFade) TWEEN.remove(_tweens.staticFade)

  // zoom out
  let from = 1.1
  _fullScreenBackground.scale.set(from, from, from)
  _tweens.staticZoom = new TWEEN.Tween(_fullScreenBackground.scale)
    .to({ x: 1, y: 1, z: 1 }, 60_000)
    .easing(TWEEN.Easing.Cubic.Out)
    .start()

  // fade in
  let mat = _fullScreenBackground.material as THREE.MeshBasicMaterial
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
  _fullScreenBackground.visible = sceneName != SceneName.Duel
  if (sceneName != SceneName.Duel) {
    resetStaticScene()
    _duelistManager.hideElements()
  } else if (_statsEnabled) {
    resetDuelScene()
  }
}

export function startDuelWithPlayers(duelistNameA, duelistModelA, isDuelistAYou, isDuelistBYou, duelistNameB, duelistModelB) {
  switchScene(SceneName.Duel) // make sure we're in the correct scene (duel page refresh)
  resetDuelScene()
  
  _duelistManager.switchDuelists(duelistNameA, duelistModelA, isDuelistAYou, isDuelistBYou, duelistNameB, duelistModelB)
}

export function setDuelTimePercentage(timePassed: number) {
  const timePassedPercentage = timePassed / 259_200_000.0 // grow for three days
  localStorage.setItem('GROWTH', timePassedPercentage.toString())
  _growthPercentage = parseFloat(localStorage.getItem('GROWTH'))
  createGrass()
}

export function updatePlayerProgress(isA, duelistState, onClick) {
  _duelistManager.updatePlayerProgress(isA, duelistState, onClick)
}

export function setDuelistElement(isA, duelistElement) {
  _duelistManager.setDuelistElement(isA, duelistElement)
}

//----------------
// Animation triggers
//

export function zoomCameraToPaces(paceCount, seconds) {
  const targetPos = {
    x: map(paceCount, 0, 10, zoomedCameraPos.x, zoomedOutCameraPos.x),
    y: map(paceCount, 0, 10, zoomedCameraPos.y, zoomedOutCameraPos.y),
    z: map(paceCount, 0, 10, zoomedCameraPos.z, zoomedOutCameraPos.z),
  }

  if (_tweens.cameraPos) TWEEN.remove(_tweens.cameraPos)
  if (seconds == 0) {
    // just set
    // console.log(`CAMS SET`, targetPos)
    _duelCamera.position.set(targetPos.x, targetPos.y, targetPos.z)
    _duelCamera.lookAt(0, 0.5, 2)
  } else {
    // console.log(`CAM ANIM`, targetPos)
    // animate
    _tweens.cameraPos = new TWEEN.Tween(_duelCamera.position)
      .to(targetPos, seconds * 1000)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .onUpdate(() => {
        // emitter.emit('movedTo', { x: _duelCameraRig.position.x, y: _duelCameraRig.position.y, z: _duelCameraRig.position.z })
        _duelCamera.lookAt(0, 0.5, 2)
      })
      .start()
      .onComplete(() => {
        // console.log(`CAM ===`, _duelCamera.position, _duelCamera.position)
      })
  }
}

export function animateDuel(state: AnimationState, actionA: number, actionB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
  //only animated once per entry safety
  if (state == AnimationState.Round1 && !_round1Animated) {
    _round1Animated = true
    _duelistManager.hideElements() 
    animateShootout(actionA, actionB, healthA, healthB, damageA, damageB);
  } else if (state == AnimationState.Round2 && !_round2Animated) {
    _round2Animated = true
    _duelistManager.hideElements()
    animateActions(state, actionA, actionB, healthA, healthB, damageA, damageB)
  } else if (state == AnimationState.Round3 && !_round3Animated) {
    _round3Animated = true
    _duelistManager.hideElements()
    animateActions(state, actionA, actionB, healthA, healthB, damageA, damageB)
  }
}

function animateShootout(paceCountA: number, paceCountB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
  const minPaceCount = Math.min(paceCountA, paceCountB)

  if (_ladySecond && _sirSecond) {
    if (minPaceCount < 5) {
      _sirSecond.visible = false
      _ladySecond.visible = false
    } else {
      _sirSecond.visible = true
      _ladySecond.visible = true
    }
  }

  // animate camera
  zoomCameraToPaces(0, 0)
  zoomCameraToPaces(minPaceCount, (minPaceCount + 1)) //adjusted zoom out value to minimize gliding effect for now.

  _duelistManager.animateDuelistShootout(paceCountA, paceCountB, healthA, healthB, damageA, damageB)
}

function animateActions(state: AnimationState, actionA: number, actionB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
  // Rewind camera and
  zoomCameraToPaces(1, 0)

  _duelistManager.animateActions(state, actionA, actionB, healthA, healthB, damageA, damageB)
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



//-------------------------------
// Dispose
//
export function dispose() {
  // 1. Stop the Animation Loop:
  if (_animationRequest) {
    cancelAnimationFrame(_animationRequest)
    _animationRequest = null
  }

  TWEEN.removeAll()

  // 2. Dispose of the Renderer:
  _renderer?.dispose()
  _renderer = null

  // 3. Dispose of Scenes and Objects:
  _currentScene = null
  for (const scene of Object.values(_scenes)) {
    disposeOfScene(scene)
  }
  _scenes = {}

  // 4. Dispose of Textures and Sprite Sheets:
  disposeTexturesAndSpriteSheets()

  // 5. Dispose of Cameras and Controls:
  _duelCamera = null
  _controls?.dispose()
  _controls = null

  // 6. Dispose of GUI and Stats:
  if (_gui) {
    _gui.destroy()
    _gui = null
  }
  if (_stats) {
    document.body.removeChild(_stats.dom)
    _stats = null
  }
  if (_grass) {
    _grass.dispose()
    _grass = null
  }
  if (_groundMirror) {
    _groundMirror.dispose()
    _groundMirror = null
  }

  // 7. Additional Cleanup (As Needed):
  // - Dispose of other custom objects or resources
  window.removeEventListener('resize', onWindowResize)

  Object.values(AUDIO_ASSETS).forEach(audio => {
      if (audio.object) {
          audio.object.stop()
          audio.object.disconnect()
      }
  });

  TWEEN.removeAll()
  _duelistManager.dispose()

  // 8. Clear References:
  _duelistManager = null
  _grassTransforms = null
  _growthPercentage = null
  _ground = null
  _skyVideo = null
  _skyVideoTexture = null
  _ladySecond = null
  _sirSecond = null
  _sfxEnabled = true
  _statsEnabled = false
  _round1Animated = false
  _round2Animated = false
  _round3Animated = false
  _fullScreenBackground = null
  _clock = null
}

// Helper function to dispose of a Three.js scene recursively
function disposeOfScene(scene) {
  if (!scene) return
  for (const child of scene.children) {
    if (child.type === "Mesh") {
      child.geometry?.dispose()
      child.material?.dispose()
    }
    if (child.dispose) {
      child.dispose()
    }
    disposeOfScene(child)
  }
}

//dispose textures and spritesheets
function disposeTexturesAndSpriteSheets() {
  for (const actorName of Object.keys(_spriteSheets)) {
    for (const animName of Object.keys(_spriteSheets[actorName])) {
      const spriteSheet = _spriteSheets[actorName][animName]
      for (const texture of spriteSheet.textures) {
        texture.dispose();
      }
      spriteSheet.textures = []
    }
  }
  _spriteSheets = {}
  
  for (const textureKey of Object.keys(_textures)) {
    _textures[textureKey].dispose()
  }
  _textures = {}

  for (const textureKey of Object.keys(_cardTextures)) {
    _cardTextures[textureKey].dispose()
  }
  _cardTextures = {}
}