import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
import { Rain } from './Rain.tsx'
import { Grass } from './Grass.tsx'
import * as shaders from './shaders.tsx'
import { InteractibleScene } from './InteractibleScene'
import { InteractibleLayeredScene } from './InteractibleLayeredScene'

// event emitter
// var ee = require('event-emitter');
import ee from 'event-emitter'
export var emitter = ee()

import { TEXTURES, SPRITESHEETS } from '/src/data/assets.tsx'
import { AnimName, TextureName, SceneName } from "/src/data/assetsTypes.tsx"
import { AudioName, AUDIO_ASSETS, AudioType } from '/src/data/audioAssets.tsx'
import { map } from '@underware/pistols-sdk/utils'
import { SpriteSheet } from './SpriteSheetMaker.tsx'
import { DuelistsManager } from './DuelistsManager.tsx'
import { Action } from '/src/utils/pistols.tsx'
import { DuelistState } from '/src/components/ui/duel/DuelContext.tsx'


//---------------------------
// CONSTANTS
//

export const SCENE_CHANGE_ANIMATION_DURATION = 250

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
export const cameraData = {
  fieldOfView: 13,
  nearPlane: 0.1,
  farPlane: 15000,
}

export const cameraDataStatic = {
  fieldOfView: 13,
  nearPlane: 0.1,
  farPlane: 1,
}

const lightCameraShadowData = {
  intensity: 2,
  mapSize: 8192,
  near: 45,
  far: 70,
  top: 20,
  bottom: 12,
  left: -10,
  right: 10,
}

const grassLightCameraShadowData = {
  intensity: 0,
  mapSize: 1024,
  near: 45,
  far: 55,
  top: 14,
  bottom: 12,
  left: -9,
  right: 9,
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
  y: 5.0,
  z: -30,
}

export enum AnimationState { //TODO add state for each step instead of round!
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

export let _textures: any = {}
let _spriteSheets: any = {}

export let _renderer: THREE.WebGLRenderer

let _animationRequest = null
let _clock: THREE.Clock
let _duelCamera: THREE.PerspectiveCamera
let _duelCameraParent: THREE.Object3D
let _staticCamera: THREE.PerspectiveCamera
let _supportsExtension: boolean = true
let _stats
let _controls
export let _gui: GUI

let _sunLight: THREE.DirectionalLight

let _grassTransforms
let _growthPercentage = 0.0
let _grass

let _ground
let _groundMirror
let _groundMirrorChildItem
let _skyVideo
let _skyVideoTexture
let _ladySecond
let _sirSecond
let _duelistManager: DuelistsManager

// Duelist highlight effects
let _duelistHighlightA: THREE.Group
let _duelistHighlightB: THREE.Group

let _duelScene: THREE.Scene = null
let _staticScene: InteractibleScene = null
export let _currentScene: THREE.Scene = null
export let _sceneName: SceneName

export let _currentDuelId: number
export let _currentDuelistAId: number
export let _currentDuelistBId: number

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

// Setup default quality settings - these will be used for initial instantiation
let _currentQualitySettings = {
  shadowMapEnabled: true,
  shadowMapType: THREE.PCFSoftShadowMap as THREE.ShadowMapType,
  shadowMapSize: 8192,
  resolutionScale: 1.0,
  grassCount: 32 * 5,
  grassSegments: 6,
  reflectionsEnabled: true,
  reflectionQuality: 1.0,
  waterEffects: true,
  particlesMultiplier: 1.0,
  sceneShiftEnabled: true,
  blurEnabled: true
};

export async function init(canvas, framerate = 60, statsEnabled = false) {

  dispose()

  if (_duelScene || _staticScene) {
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
  
  if (_statsEnabled) {
    _stats = new Stats()
    document.body.appendChild(_stats.dom)
  }

  setCameras()

  window.addEventListener('beforeunload', dispose);
  window.addEventListener('resize', onWindowResize)
  onWindowResize()

  _duelScene = setupDuelScene();
  _staticScene = setupStaticScene(SceneName.Tavern, false);

  _clock = new THREE.Clock(true)

  console.log(`THREE.init() done 👍`)
}

async function loadAssets() {
  shaders.loadShaders();

  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);
  const ktx2Loader = new KTX2Loader(loadingManager)
  ktx2Loader.setTranscoderPath('/basis/')
  ktx2Loader.detectSupport(_renderer)
  ktx2Loader.setWorkerLimit(4)

  await Promise.all(Object.keys(TEXTURES).map(async key => {
    const TEX = TEXTURES[key]
    if (TEX.path.includes('.ktx2')) {
      const tex = await ktx2Loader.loadAsync(TEX.path);

      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      _textures[key] = tex;

      if (key == TextureName.duel_ground && _ground) {
        _ground.material.map = tex;
        _ground.material.needsUpdate = true;
      } else if (key == TextureName.duel_ground_normal && _ground) {
        _ground.material.normalMap = tex;
        _ground.material.needsUpdate = true;
      } else if (key == TextureName.duel_water_map && _groundMirror) {
        _groundMirror.setUniformValue("waterMap", tex);
      }
    } else {
      const tex = textureLoader.load(TEX.path)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter

      _textures[key] = tex

    }
  }))

  Object.keys(SPRITESHEETS).forEach(actorName => {
    _spriteSheets[actorName] = {}
    Object.keys(SPRITESHEETS[actorName]).forEach(key => {
      _spriteSheets[actorName][key] = new SpriteSheet(key, SPRITESHEETS[actorName][key], ktx2Loader)
    })
  })

  _textures[TextureName.duel_water_dudv].wrapS = _textures[TextureName.duel_water_dudv].wrapT = THREE.RepeatWrapping;

  setTimeout(() => {
    ktx2Loader.dispose();
  }, 10_000);
}

function setRender(canvas) {
  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas
  })
  _renderer.setSize(WIDTH, HEIGHT)
  _renderer.setPixelRatio(window.devicePixelRatio * _currentQualitySettings.resolutionScale);
  // _renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  // _renderer.autoClear = false
  // _renderer.autoClearColor = false
  _renderer.shadowMap.enabled = _currentQualitySettings.shadowMapEnabled
  _renderer.shadowMap.type = _currentQualitySettings.shadowMapType

  // _renderer.debug.checkShaderErrors = false;
}

export function setCameras() {
  _duelCameraParent = new THREE.Object3D()
  _duelCamera = new THREE.PerspectiveCamera(
    cameraData.fieldOfView,
    ASPECT,
    cameraData.nearPlane,
    cameraData.farPlane,
  )
  _duelCameraParent.add(_duelCamera)
  _duelCamera.position.set(0, 0.05, 0)
  _staticCamera = new THREE.PerspectiveCamera(
    cameraDataStatic.fieldOfView,
    ASPECT,
    cameraDataStatic.nearPlane,
    cameraDataStatic.farPlane,
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
  _renderer.setPixelRatio(window.devicePixelRatio * _currentQualitySettings.resolutionScale);
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

function createDuelistHighlight() {
  const playerColor = 0xff3333;
  const accentColor = 0xff6666;

  const group = new THREE.Group();
  
  // Rotating magical runes ring
  const runeRingGeometry = new THREE.RingGeometry(0.25, 0.32, 32, 2, 0, Math.PI * 2);
  const runeRingMaterial = new THREE.MeshBasicMaterial({
    color: playerColor,
    transparent: true,
    alphaTest: 0.5,
    opacity: 0, // Start invisible
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const runeRing = new THREE.Mesh(runeRingGeometry, runeRingMaterial);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.002;
  runeRing.name = 'rotatingElement';
  group.add(runeRing);
  
  // Create pillar of light
  const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.3, 10, 16, 10, true);
  const pillarMaterial = new THREE.MeshBasicMaterial({
    color: playerColor,
    transparent: true,
    opacity: 0, // Start invisible
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false // Don't write to depth buffer
  });
  const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
  pillar.position.y = 5;
  pillar.name = 'lightPillar';
  group.add(pillar);
  
  // Add spotlight effect
  const spotLight = new THREE.SpotLight(playerColor, 0); // Start with intensity 0
  spotLight.position.set(0, 5, 0);
  spotLight.target.position.set(0, 0, 0);
  spotLight.angle = 0.3;
  spotLight.penumbra = 0.7;
  spotLight.distance = 10;
  spotLight.decay = 2;
  spotLight.name = 'spotlight';
  group.add(spotLight);
  group.add(spotLight.target);
  
  // Create magical particles/flames effect
  const particlesCount = 200;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesMaterial = new THREE.PointsMaterial({
    color: accentColor,
    size: 0.04,
    transparent: true,
    opacity: 1, // Start invisible
    blending: THREE.AdditiveBlending,
    depthWrite: false // Don't write to depth buffer
  });
  
  const positions = new Float32Array(particlesCount * 3);
  const scales = new Float32Array(particlesCount);
  const velocities = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.2 + Math.random() * 0.25;
    
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.05 + Math.random() * 0.1;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    
    // Add upward velocity for rising particles
    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = 0.05 + Math.random() * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    
    scales[i] = Math.random();
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  particlesGeometry.userData.velocities = velocities;
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.name = 'magicParticles';
  group.add(particles);
  
  // Set initial state - invisible
  group.visible = false;
  group.scale.set(0.01, 0.01, 0.01);  
  
  return group;
}

function startSummoningAnimation(group: THREE.Group, isPlayerHighlight = true) {
    // Set colors based on isPlayerHighlight
    const playerColor = isPlayerHighlight ? 0x00ff88 : 0xff3333;
    const accentColor = isPlayerHighlight ? 0x00ff88 : 0xff3333;
    
    // Update colors for all effect elements
    const runeRing = group.getObjectByName('rotatingElement') as THREE.Mesh;
    if (runeRing && runeRing.material) {
      (runeRing.material as THREE.MeshBasicMaterial).color.setHex(playerColor);
    }
    
    const lightPillar = group.getObjectByName('lightPillar') as THREE.Mesh;
    if (lightPillar && lightPillar.material) {
      (lightPillar.material as THREE.MeshBasicMaterial).color.setHex(playerColor);
    }
    
    const spotlight = group.getObjectByName('spotlight') as THREE.SpotLight;
    if (spotlight) {
      spotlight.color.setHex(playerColor);
    }
    
    const particles = group.getObjectByName('magicParticles') as THREE.Points;
    if (particles && particles.material) {
      (particles.material as THREE.PointsMaterial).color.setHex(accentColor);
    }

    fadeInHighlightEffects(group);
}

// Helper function to fade in the highlight effects (except tentacles)
function fadeInHighlightEffects(group: THREE.Group) {
  group.visible = true;

  new TWEEN.Tween(group.scale)
      .to({ x: 1, y: 1, z: 1 }, 1500)
      .easing(TWEEN.Easing.Elastic.Out)
      .start();

  // Fade in the magical rune ring
  const runeRing = group.getObjectByName('rotatingElement') as THREE.Mesh;
  if (runeRing && runeRing.material) {
    new TWEEN.Tween((runeRing.material as THREE.MeshBasicMaterial))
      .to({ opacity: 0.6 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  // Fade in the light pillar
  const lightPillar = group.getObjectByName('lightPillar') as THREE.Mesh;
  if (lightPillar && lightPillar.material) {
    new TWEEN.Tween((lightPillar.material as THREE.MeshBasicMaterial))
      .to({ opacity: 0.02 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  // Fade in the spotlight
  const spotlight = group.getObjectByName('spotlight') as THREE.SpotLight;
  if (spotlight) {
    new TWEEN.Tween(spotlight)
      .to({ intensity: 0.5 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  // Fade in the particles
  const particles = group.getObjectByName('magicParticles') as THREE.Points;
  if (particles && particles.material) {
    new TWEEN.Tween((particles.material as THREE.PointsMaterial))
      .to({ opacity: 0.4 }, 800)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
}

export function removeHighlightEffects() {
  completeSummoningAnimation(_duelistHighlightA)
  completeSummoningAnimation(_duelistHighlightB)
}
  
function completeSummoningAnimation(group: THREE.Group) {
  // Fade out all remaining effects
  const runeRing = group.getObjectByName('rotatingElement') as THREE.Mesh;
  const lightPillar = group.getObjectByName('lightPillar') as THREE.Mesh;
  const spotlight = group.getObjectByName('spotlight') as THREE.SpotLight;
  const particles = group.getObjectByName('magicParticles') as THREE.Points;
  
  // Create a master tween to track all fade-outs
  const fadeOutDuration = 800;
  
  if (runeRing && runeRing.material) {
    new TWEEN.Tween((runeRing.material as THREE.MeshBasicMaterial))
      .to({ opacity: 0 }, fadeOutDuration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  if (lightPillar && lightPillar.material) {
    new TWEEN.Tween((lightPillar.material as THREE.MeshBasicMaterial))
      .to({ opacity: 0 }, fadeOutDuration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  if (spotlight) {
    new TWEEN.Tween(spotlight)
      .to({ intensity: 0 }, fadeOutDuration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  if (particles && particles.material) {
    new TWEEN.Tween((particles.material as THREE.PointsMaterial))
      .to({ opacity: 0 }, fadeOutDuration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();
  }
  
  // Shrink and hide the entire group
  new TWEEN.Tween(group.scale)
    .to({ x: 0.01, y: 0.01, z: 0.01 }, fadeOutDuration)
    .easing(TWEEN.Easing.Back.In)
    .onComplete(() => {
      group.visible = false;
    })
    .start();
}

// Function to animate the highlight effects
function animateHighlights(deltaTime) {
  if (_duelistHighlightA && _duelistHighlightA.visible) {    
    // Animate particles
    const particlesA = _duelistHighlightA.getObjectByName('magicParticles') as THREE.Points;
    if (particlesA) {
      const positions = particlesA.geometry.attributes.position.array as Float32Array;
      const scales = particlesA.geometry.attributes.scale.array as Float32Array;
      const velocities = particlesA.geometry.userData.velocities as Float32Array;
      
      for (let i = 0; i < scales.length; i++) {
        // Update position based on velocity
        positions[i * 3] += velocities[i * 3] * deltaTime * 10;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 10;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime * 10;
        
        // Reset particles that go too high
        if (positions[i * 3 + 1] > 1.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.2 + Math.random() * 0.25;
          
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = 0.05;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
          
          scales[i] = Math.random() * 0.5;
        }
        
        // Fade out as they rise
        scales[i] -= deltaTime * 0.1;
        if (scales[i] <= 0.1) scales[i] = Math.random() * 0.5;
      }
      
      particlesA.geometry.attributes.position.needsUpdate = true;
      particlesA.geometry.attributes.scale.needsUpdate = true;
    }
  }
  
  if (_duelistHighlightB && _duelistHighlightB.visible) {
    // Animate particles
    const particlesB = _duelistHighlightB.getObjectByName('magicParticles') as THREE.Points;
    if (particlesB) {
      const positions = particlesB.geometry.attributes.position.array as Float32Array;
      const scales = particlesB.geometry.attributes.scale.array as Float32Array;
      const velocities = particlesB.geometry.userData.velocities as Float32Array;
      
      for (let i = 0; i < scales.length; i++) {
        // Update position based on velocity
        positions[i * 3] += velocities[i * 3] * deltaTime * 10;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 10;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime * 10;
        
        // Reset particles that go too high
        if (positions[i * 3 + 1] > 1.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.2 + Math.random() * 0.25;
          
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = 0.05;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
          
          scales[i] = Math.random() * 0.5;
        }
        
        // Fade out as they rise
        scales[i] -= deltaTime * 0.1;
        if (scales[i] <= 0.1) scales[i] = Math.random() * 0.5;
      }
      
      particlesB.geometry.attributes.position.needsUpdate = true;
      particlesB.geometry.attributes.scale.needsUpdate = true;
    }
  }
}

//-------------------------------------------
// Game Loop
//

export function shakeCamera(duration = 500, magnitude = 0.01) {
  const initialPosition = _duelCameraParent.position.clone(); // Store the initial position of the camera

  const shake = () => {
    const offsetX = (Math.random() - 0.5) * 2 * magnitude;
    const offsetY = (Math.random() - 0.5) * 2 * magnitude;
    const offsetZ = (Math.random() - 0.5) * 2 * magnitude;

    _duelCameraParent.position.set(
      initialPosition.x + offsetX,
      initialPosition.y + offsetY,
      initialPosition.z + offsetZ
    );
  };

  new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, duration)
    .onUpdate(() => { shake() })
    .onComplete(() => { _duelCameraParent.position.copy(initialPosition) })
    .start();
}

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
        
        // Animate highlight effects
        animateHighlights(deltaTime)

        _renderer.render(_currentScene, _duelCamera)
      } else {  
        _renderer.render(_currentScene, _staticCamera)

        if (_currentScene instanceof InteractibleScene) {
          //@ts-ignore
          _currentScene.children.forEach((c) => c.animate?.(deltaTime));
          if (_currentScene.sceneData?.backgrounds) {
            _currentScene.render(elapsedTime);
          }
        } else if (_currentScene instanceof InteractibleLayeredScene) {
          _currentScene.render(elapsedTime)
        }
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

function setupDuelScene() {
  const scene = new THREE.Scene()
  scene.add(_duelCameraParent)

  setEnvironment(scene)

  if (_statsEnabled) {
    setGUI()
    setCameraHelpers(scene)
  }

  loadGltf(scene)
  
  // Create duelist highlight effects
  const groupA = createDuelistHighlight();
  const groupB = createDuelistHighlight();
  _duelistHighlightA = groupA;
  _duelistHighlightB = groupB;
  _duelistHighlightA.position.set(0.5, 0, 2);
  _duelistHighlightB.position.set(-0.5, 0, 2);
  scene.add(_duelistHighlightA);
  scene.add(_duelistHighlightB);

  _duelistManager = new DuelistsManager(scene, _duelCamera, _spriteSheets)

  return scene
}

export function hideDialogs() {
  _duelistManager.hideElements()
}

export function resetDuelScene(resetCamera = true, fullReset = true) {
  if (fullReset) _duelistManager?.resetDuelistsSpawned()
  if (!_duelistManager.resetDuelists()) return

  emitter.emit('animated', AnimationState.None)

  if (_sirSecond && _ladySecond) {
    _sirSecond.visible = true
    _ladySecond.visible = true
  }

  _round1Animated = false
  _round2Animated = false
  _round3Animated = false

  if (resetCamera) {
    zoomCameraToPaces(10, 0)
  }
  zoomCameraToPaces(0, 4)
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
  var dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath( 'js/libs/draco/gltf/' );

  const loader = new GLTFLoader();
  loader.setDRACOLoader( dracoLoader );
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
            child.shadow.bias = -0.0001; 
            child.shadow.normalBias = 0.01;
            child.castShadow = true

            _sunLight = child
            

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
          // const textureAspectRatio = texture.image.width / texture.image.height
          const textureAspectRatio = 1.777
          
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

          _groundMirrorChildItem = child

          _groundMirror = createWaterPlane(
            _currentQualitySettings.reflectionsEnabled ? "WATER" : "WATER_NONREFLECTIVE",
            _groundMirrorChildItem.geometry, 
            _currentQualitySettings.reflectionsEnabled, 
            {
              height: -0.001,
              rotation: child.rotation,
              scale: child.scale,
              waveEnabled: _currentQualitySettings.waterEffects,
              renderScale: _currentQualitySettings.reflectionQuality
            }
          )

          scene.add(_groundMirror)
        }
        
      })

      _grassTransforms = grassTransforms
      createGrass()
      
      scene.add(gltf.scene);
    }
  );
}

function createWaterPlane(name, geometry, reflective, params) {
  let water; 

  if (reflective) {
    water = new shaders.ReflectorMaterial("WATER", geometry, {
      clipBias: 0.0003,
      textureWidth: WIDTH * params.renderScale,
      textureHeight: HEIGHT * params.renderScale, //TODO check if this works??
    });
    
    // Add customProgramCacheKey to the material to fix shader compilation
    (water.material as any).customProgramCacheKey = function() {
      return 'ReflectorMaterial-WATER-' + Math.random();
    };
  } else {
    water = new shaders.NonReflectorMaterial("WATER_NONREFLECTIVE", geometry);
    
    // Add customProgramCacheKey to the material to fix shader compilation
    (water.material as any).customProgramCacheKey = function() {
      return 'NonReflectorMaterial-WATER_NONREFLECTIVE-' + Math.random();
    };
  }

  water.setUniformValue('waterStrength', params.waveEnabled ? 0.04 : 0.0)
  water.setUniformValue('waterSpeed', params.waveEnabled ? 0.03 : 0.0)
  water.setUniformValue('waveStrength', params.waveEnabled ? 0.04 : 0.0)
  water.setUniformValue('waveSpeed', params.waveEnabled ? 0.05 : 0.0)
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
  if (!_duelScene) return;
  if (!_grassTransforms) return;

  _grass = new Grass(
    {
      height: 0,
      offset: 0.007,
      heightmap: null,
      dims: 256,
      transforms: _grassTransforms,
      growth: _growthPercentage,
      density: _currentQualitySettings.grassCount,
      segments: _currentQualitySettings.grassSegments
    }
  );

  _duelScene.add(_grass);
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
// Static Scene
//
function setupStaticScene(sceneName: string, useLayered = false): InteractibleScene {
  // const scene = useLayered 
  //   ? new InteractibleLayeredScene(sceneName, _renderer, _staticCamera)
  //   : new InteractibleScene(sceneName, _renderer, _staticCamera)

  const scene = new InteractibleScene(sceneName, _renderer, _staticCamera)

  scene.add(_staticCamera)

  return scene
}



//-------------------------------------------
// Game Interface
//

export function switchScene(sceneName: SceneName) {
  if (sceneName === SceneName.TutorialDuel) {
    sceneName = SceneName.Duel
  }

  if (_sceneName === sceneName && _currentScene) return;

  const isDuelScene = sceneName === SceneName.Duel
  const wasDuelScene = _sceneName === SceneName.Duel

  if (!_currentScene) {
    _sceneName = sceneName
    
    if (isDuelScene) {
      _currentScene = _duelScene
    } else {
      _currentScene = _staticScene
      _staticScene.setSceneData(sceneName)
      _staticScene.activate()
    }

    setTimeout(() => {
      fadeInCurrentScene();
    }, SCENE_CHANGE_ANIMATION_DURATION);
    
    if (!isDuelScene) {
      _duelistManager.hideElements()
    } else if (_statsEnabled) {
      resetDuelScene()
    }
  } else {
    // Scene transition
    fadeOutCurrentScene(() => {
      // Deactivate previous scene
      if (!wasDuelScene && isDuelScene) {
        _staticScene.deactivate()
      }
      
      _sceneName = sceneName

      // Switch to appropriate scene
      if (isDuelScene) {
        _currentScene = _duelScene
      } else {
        _currentScene = _staticScene
        requestAnimationFrame(() => {
          _staticScene.setSceneData(sceneName)
          if (wasDuelScene) {
            _staticScene.activate()
          }
        })
      }

      emitter.emit('hover_description', null)
      emitter.emit('hover_item', null)

      setTimeout(() => {
        fadeInCurrentScene();
      }, 0);
      
      if (!isDuelScene) {
        _duelistManager.hideElements()
        _renderer.getContext().disable(_renderer.getContext().DEPTH_TEST);
      } else if (_statsEnabled) {
        resetDuelScene()
        _renderer.getContext().enable(_renderer.getContext().DEPTH_TEST);
      } else {
        _renderer.getContext().enable(_renderer.getContext().DEPTH_TEST);
      }
    });
  }
}

function fadeOutCurrentScene(callback) {
  const overlay = document.getElementById('game-black-overlay');

  if (!overlay) {
    return;
  }

  _tweens.staticFade?.stop();

  _tweens.staticFade = new TWEEN.Tween({ opacity: 0 })
    .to({ opacity: 1 }, SCENE_CHANGE_ANIMATION_DURATION)
    .onUpdate(({ opacity }) => {
      if (overlay) {
        overlay.style.opacity = opacity.toString()
      }
    })
    .onComplete(() => {
      callback();
    })
    .start();
}

function fadeInCurrentScene() {
  const overlay = document.getElementById('game-black-overlay');

  if (!overlay) {
    return;
  }

  _tweens.staticFade?.stop();

  _tweens.staticFade = new TWEEN.Tween({ opacity: 1 })
    .to({ opacity: 0 }, SCENE_CHANGE_ANIMATION_DURATION)
    .onUpdate(({ opacity }) => {
      if (overlay) {
        overlay.style.opacity = opacity.toString()
      }
    })
    .onComplete(() => {
      if (_currentScene instanceof InteractibleScene) {
        (_currentScene as InteractibleScene).activate();
      }
    })
    .start();
}

export function setOnLoadComplete(onLoadComplete: () => void) {
  _duelistManager.setLoadCompleteCallback(onLoadComplete)
}

export function setDuelistSelectDataA(duelistName: string, isDuelistAYou: boolean) {
  _duelistManager.setDuelistSelectDataA(duelistName, isDuelistAYou)
}

export function spawnDuelist(duelist, duelistName, duelistModel, isYou, frontMaterialPath, backMaterialPath) {
  if (duelist == 'A') {
    _duelistManager.setupDuelistA(duelistName, duelistModel, isYou, frontMaterialPath, backMaterialPath, () => {
      startSummoningAnimation(_duelistHighlightA, isYou)
    })
  } else {
    _duelistManager.setupDuelistB(duelistName, duelistModel, isYou, frontMaterialPath, backMaterialPath, () => {
      startSummoningAnimation(_duelistHighlightB, isYou)
    })
  }
}

export function setDuelTimePercentage(timePassed: number) {
  _growthPercentage = timePassed
  if (_grass) {
    _grass.setGrassGrowth(_growthPercentage)
  }
}

export function updatePlayerProgress(isA, duelistState, onClick) {
  _duelistManager.updatePlayerProgress(isA, duelistState, onClick)
}

export function setIsLoading(isA, isLoading) {
  _duelistManager.setIsLoading(isA, isLoading)
}

export function setDuelistElement(isA, duelistElement) {
  _duelistManager.setDuelistElement(isA, duelistElement)
}

export function setDuelistSpeedFactor(speedFactor) {
  _duelistManager.setDuelistSpeedFactor(speedFactor)
}

export function setDuelData(duelId: number, duelistAId: number, duelistBId: number) {
  _currentDuelId = duelId
  _currentDuelistAId = duelistAId
  _currentDuelistBId = duelistBId
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
    _duelCamera.position.set(targetPos.x, targetPos.y, targetPos.z);
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

export function animatePace(pace: number, statsA: DuelistState, statsB: DuelistState) {
  zoomCameraToPaces(pace, 3)

  _duelistManager.animatePace(pace, statsA, statsB)
}

export function animateDuel(state: AnimationState) {
  //only animated once per entry safety
  if (state == AnimationState.Round1 && !_round1Animated) {
    _round1Animated = true
    _duelistManager.hideElements()
  } else if (state == AnimationState.Round2 && !_round2Animated) {
    _round2Animated = true
    _duelistManager.hideElements()
  } else if (state == AnimationState.Round3 && !_round3Animated) {
    _round3Animated = true
    _duelistManager.hideElements()
  }
}

export function prepareActionAnimation() {
  zoomCameraToPaces(1, 4)
  _duelistManager.resetActorPositions()
}

export function animateDuelistBlade() {
  _duelistManager.animateDuelistBlade()
}

export function animateActions(actionA: Action, actionB: Action, healthA: number, healthB: number) {

  setTimeout(() => {
    _duelistManager.animateActions(actionA, actionB, healthA, healthB)
  }, 2000);
}

export function animateDuelistTest(duelist: string, key: AnimName) {
  _duelistManager.playActorAnimationTest(duelist, key)
}

//-------------------------------
// Audio
//

let volumeMultiplier = 1.0
let sfxVolumeMultiplier = 1.0

export function setVolumeMultiplier(multiplier: number) {
  volumeMultiplier = multiplier
  // Update volume for all currently playing music tracks
  Object.entries(AUDIO_ASSETS).forEach(([name, asset]) => {
    if (asset?.object?.isPlaying && asset.type === AudioType.MUSIC) {
      asset.object.setVolume((asset.volume ?? 1) * volumeMultiplier)
    }
  })
}

export function setSfxVolumeMultiplier(multiplier: number) {
  sfxVolumeMultiplier = multiplier
  // Update volume for all currently playing sfx tracks
  Object.entries(AUDIO_ASSETS).forEach(([name, asset]) => {
    if (asset?.object?.isPlaying && asset.type === AudioType.SFX) {
      asset.object.setVolume((asset.volume ?? 1) * sfxVolumeMultiplier)
    }
  })
}

export function playAudio(name: AudioName, enabled: boolean = true, fadeInDuration: number = 0.0, speedFactor: number = 1.0) {
  const asset = AUDIO_ASSETS[name]
  if (asset?.object) {
    setTimeout(() => {
      if (asset.object.isPlaying) {
        asset.object.stop()
      }
      if (enabled) {
        // Set initial volume to 0 for fade in
        const originalVolume = (asset.volume ?? 1) * (asset.type === AudioType.SFX ? sfxVolumeMultiplier : volumeMultiplier)
        asset.object.setVolume(0)
        asset.object.play()
        
        // Fade in
        if (fadeInDuration > 0) {
          const startTime = Date.now()
          const fadeInterval = setInterval(() => {
            const elapsedTime = (Date.now() - startTime) / 1000
            const progress = Math.min(elapsedTime / fadeInDuration, 1)
            asset.object.setVolume(progress * originalVolume)
            
            if (progress >= 1) {
              clearInterval(fadeInterval)
            }
          }, 50)
        } else {
          asset.object.setVolume(originalVolume)
        }
      }
    }, (asset.delaySeconds ?? 0) * 1000 / speedFactor)
  }
}

export function pauseAudio(name: AudioName) {
  const asset = AUDIO_ASSETS[name]
  asset?.object?.pause()
}

export function stopAudio(name: AudioName, fadeOutDuration: number = 0.0) {
  const asset = AUDIO_ASSETS[name]
  if (asset?.object?.isPlaying) {
    if (fadeOutDuration <= 0) {
      asset.object.stop()
    } else {
      // Fade out
      const originalVolume = asset.object.getVolume() * (asset.type === AudioType.SFX ? sfxVolumeMultiplier : volumeMultiplier)
      const startTime = Date.now()
      const fadeInterval = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000
        const progress = Math.min(elapsedTime / fadeOutDuration, 1)
        asset.object.setVolume(originalVolume * (1 - progress))
        
        if (progress >= 1) {
          clearInterval(fadeInterval)
          asset.object.stop()
          // Reset volume to original
          asset.object.setVolume(originalVolume)
        }
      }, 50)
    }
  }
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

  // 3. Dispose of Scenes and Objects - now using single static scene 🐙:
  _currentScene = null
  
  if (_duelScene) {
    disposeOfScene(_duelScene)
    _duelScene = null
  }
  
  if (_staticScene) {
    _staticScene.dispose() // Use InteractibleScene's dispose method
    disposeOfScene(_staticScene)
    _staticScene = null
  }

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
  window.removeEventListener('resize', onWindowResize)

  Object.values(AUDIO_ASSETS).forEach(audio => {
      if (audio.object) {
          audio.object.stop()
          audio.object.disconnect()
      }
  });

  TWEEN.removeAll()
  _duelistManager?.dispose()

  // 8. Clear References:
  _duelistManager = null
  _grassTransforms = null
  _growthPercentage = 0.0
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
}

// Add quality setting functions before the dispose function
// Functions to update quality settings for the current scene

/**
 * Updates shadow settings for the current scene
 * @param enabled Whether shadows are enabled
 * @param shadowType The type of shadow mapping to use
 * @param mapSize The shadow map size
 */
export function updateShadows(enabled: boolean, shadowType: THREE.ShadowMapType, mapSize: number) {
  // Save current settings
  _currentQualitySettings.shadowMapEnabled = enabled;
  _currentQualitySettings.shadowMapType = shadowType;
  _currentQualitySettings.shadowMapSize = mapSize;
  
  // Update renderer shadow settings
  if (_renderer) {
    // First disable shadows to reset state
    _renderer.shadowMap.enabled = false
    _renderer.shadowMap.autoUpdate = false
    
    // Force renderer to clear shadow maps
    _renderer.shadowMap.needsUpdate = true
    
    // Now re-enable with new settings
    _renderer.shadowMap.type = shadowType
    _renderer.shadowMap.enabled = enabled
    _renderer.shadowMap.autoUpdate = enabled
  }
  
  // Update directional light shadow settings
  if (_sunLight) {
    _sunLight.castShadow = enabled
    
    if (enabled) {
      // Clean up existing shadow map
      if (_sunLight.shadow.map) {
        _sunLight.shadow.map.dispose()
        _sunLight.shadow.map = null
      }
      
      // Reset shadow settings
      _sunLight.shadow.mapSize.set(mapSize, mapSize)
      _sunLight.shadow.bias = -0.0001
      _sunLight.shadow.normalBias = 0.01
      
      // Update the shadow camera and force an updat
      _sunLight.shadow.camera.updateProjectionMatrix()
      _sunLight.shadow.needsUpdate = true
      _sunLight.updateMatrixWorld(true)
      
      // Force a re-render
      if (_renderer) {
        _renderer.shadowMap.needsUpdate = true
      }
    }
  }
  
  console.log(`Shadow settings updated: ${enabled ? 'Enabled' : 'Disabled'}, Type: ${shadowType}, Map Size: ${mapSize}x${mapSize}`);
}

/**
 * Updates the resolution scale for the renderer
 * @param scale Resolution scale (0.5 - 1.0)
 */
export function updateResolution(scale: number) {
  // Save current setting
  _currentQualitySettings.resolutionScale = scale;

  if (_renderer) {
    _renderer.setPixelRatio(window.devicePixelRatio * scale);
  }
}

/**
 * Updates grass quality settings
 * @param density Number of grass instances
 * @param segments Number of grass segments
 */
export function updateGrass(density: number, segments: number) {
  // Save current settings
  _currentQualitySettings.grassCount = density;
  _currentQualitySettings.grassSegments = segments;
  
  // Recreate grass with new settings if it exists
  if (_grass) {
    // Remove old grass
    if (_duelScene) {
      _duelScene.remove(_grass)
    }
    
    // Dispose of old grass
    _grass.dispose()
    
    createGrass()
  }
}

/**
 * Updates water quality settings
 * @param reflective Whether to use reflective water
 * @param quality Water quality multiplier (0.5-1.0)
 * @param waveEffects Whether wave effects are enabled
 */
export function updateWater(reflective: boolean, quality: number, waveEffects: boolean) {
  // Save current settings
  _currentQualitySettings.reflectionsEnabled = reflective;
  _currentQualitySettings.reflectionQuality = quality;
  _currentQualitySettings.waterEffects = waveEffects;
  
  // If we have a water plane
  if (_groundMirror) {
    // Remove existing water plane from the scene
    _duelScene.remove(_groundMirror)
    
    // Dispose of the current water object
    _groundMirror?.dispose();
    _groundMirror = null

    _groundMirror = createWaterPlane(
      reflective ? "WATER" : "WATER_NONREFLECTIVE", 
      _groundMirrorChildItem.geometry, 
      reflective, 
      {
        height: -0.001,
        rotation: _groundMirrorChildItem.rotation || new THREE.Euler(),
        scale: _groundMirrorChildItem.scale || new THREE.Vector3(1, 1, 1),
        waveEnabled: waveEffects,
        renderScale: quality
      }
    );

    _duelScene.add(_groundMirror)
     
  }
}

/**
 * Updates particle effect quality
 * @param density Particle density multiplier (0.5-1.0)
 */
export function updateParticles(density: number) {
  // Save current setting
  _currentQualitySettings.particlesMultiplier = density;
  
  // Update any particle systems (Rain, highlight effects, etc.)
  if (_duelistHighlightA) {
    const particlesA = _duelistHighlightA.getObjectByName('magicParticles') as THREE.Points
    if (particlesA && particlesA.geometry) {
      // Update particle visibility based on density
      const scales = particlesA.geometry.attributes.scale.array as Float32Array
      for (let i = 0; i < scales.length; i++) {
        if (i < scales.length * density) {
          scales[i] = Math.random() * 0.5
        } else {
          scales[i] = 0
        }
      }
      particlesA.geometry.attributes.scale.needsUpdate = true
    }
  }
  
  if (_duelistHighlightB) {
    const particlesB = _duelistHighlightB.getObjectByName('magicParticles') as THREE.Points
    if (particlesB && particlesB.geometry) {
      // Update particle visibility based on density
      const scales = particlesB.geometry.attributes.scale.array as Float32Array
      for (let i = 0; i < scales.length; i++) {
        if (i < scales.length * density) {
          scales[i] = Math.random() * 0.5
        } else {
          scales[i] = 0
        }
      }
      particlesB.geometry.attributes.scale.needsUpdate = true
    }
  }
}

export function updateInteractibeSceneSettings(sceneShiftEnabled: boolean, blurEnabled: boolean) {
  // Save current settings
  _currentQualitySettings.sceneShiftEnabled = sceneShiftEnabled;
  _currentQualitySettings.blurEnabled = blurEnabled;
  
  // Update the single static scene instance 🐙
  if (_staticScene instanceof InteractibleScene) {
    _staticScene.updateSettings(sceneShiftEnabled, blurEnabled)
  }
}
