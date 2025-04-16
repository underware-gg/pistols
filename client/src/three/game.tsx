import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

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

import { TEXTURES, SPRITESHEETS, TextureName } from '/src/data/assets.tsx'
import { AudioName, AUDIO_ASSETS } from '/src/data/audioAssets.tsx'
import { SceneName } from '/src/data/assets.tsx'
import { map } from '@underware/pistols-sdk/utils'
import { SpriteSheet } from './SpriteSheetMaker.tsx'
import { DuelistsManager } from './DuelistsManager.tsx'
import { Action } from '/src/utils/pistols.tsx'
import { DuelistState } from '../components/ui/duel/DuelContext.tsx'


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
  farPlane: 150,
}

export const cameraDataStatic = {
  fieldOfView: 13,
  nearPlane: 0.1,
  farPlane: 1,
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

let _grassTransforms
let _growthPercentage = 0.0
let _grass

let _ground
let _groundMirror
let _skyVideo
let _skyVideoTexture
let _ladySecond
let _sirSecond
let _duelistManager: DuelistsManager

// Duelist highlight effects
let _duelistHighlightA: THREE.Group
let _duelistHighlightB: THREE.Group
let _duelistTentaclesA: THREE.Group
let _duelistTentaclesB: THREE.Group

let _scenes: Partial<Record<SceneName, THREE.Scene>> = {}
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

export async function init(canvas, framerate = 60, statsEnabled = false) {

  dispose()

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
    powerPreference: 'low-power' //TODO requires more testing
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

function createDuelistHighlight() {
  const playerColor = 0xff3333;
  const accentColor = 0xff6666;
  
  // Create tentacles
  // Tentacle configuration parameters
  const tentacleConfig = {
    baseThickness: 0.14,        // Base thickness of the tentacle
    tipTaperFactor: 2.5,        // Controls how much the tentacle tapers (higher = more tapering)
    length: 2.2,                // Base length of tentacles
    lengthVariation: 0.2,       // Variation in length (±20%)
    segments: 15,               // Number of segments for tentacle curve
    radialSegments: 8,          // Number of segments around the circumference
    curvatureStrength: 0.15,    // How much the tentacle curves (x-direction)
    secondaryCurve: 0.12,       // Secondary curve strength (z-direction)
    wiggleSpeed: 3.5,           // Base speed of wiggle animation
    wiggleSpeedVariation: 0.5,  // Variation in wiggle speed
    wiggleAmount: 0.4,          // Base amount of wiggle
    wiggleAmountVariation: 0.2, // Variation in wiggle amount
    positionVariation: 0.08,    // Position variation as fraction of radius (±8%)
    angleVariation: 0.03,       // Angle variation as fraction of circle (±3%)
    rotationVariation: 0.15     // Random rotation in other axes (±0.15 radians)
  };
  
  // Create tentacle material
  const tentacleMaterial = new THREE.MeshStandardMaterial({
    color: playerColor,
    emissive: playerColor,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0,
    roughness: 0.3,
    metalness: 0.2,
  });
  // Create tentacle group
  const tentacleGroup = new THREE.Group();
  
  // Function to create a tentacle with dynamic curve
  // const createTentacle = (length, segments) => {
  //   // Create initial curve points - these will be updated during animation
  //   const curvePoints = [];
  //   for (let j = 0; j <= segments; j++) {
  //     const t = j / segments;
  //     curvePoints.push(new THREE.Vector3(0, length * t, 0));
  //   }
    
  //   // Create a curve that will be updated
  //   const curve = new THREE.CatmullRomCurve3(curvePoints);
    
  //   // Create a tube with initial curve
  //   const tubeGeometry = new THREE.TubeGeometry(
  //     curve,
  //     segments * 3, // More segments for smoother curve
  //     tentacleConfig.baseThickness, // Starting radius
  //     tentacleConfig.radialSegments, // Radial segments
  //     false // Not closed
  //   );
    
  //   // Apply initial tapering
  //   const positionAttribute = tubeGeometry.getAttribute('position');
  //   const vertexCount = positionAttribute.count;
    
  //   // Store original vertex positions relative to their segment centers
  //   // This will help us update the geometry correctly during animation
  //   const originalRelativePositions = [];
    
  //   for (let i = 0; i < vertexCount; i++) {
  //     const tubularIndex = Math.floor(i / (tentacleConfig.radialSegments + 1));
  //     const t = tubularIndex / (segments * 3);
      
  //     // Non-linear taper for more realistic tentacle shape
  //     const radius = tentacleConfig.baseThickness * Math.pow(1 - t, tentacleConfig.tipTaperFactor);
  //     const scale = radius / tentacleConfig.baseThickness;
      
  //     // Get current position
  //     const x = positionAttribute.getX(i);
  //     const y = positionAttribute.getY(i);
  //     const z = positionAttribute.getZ(i);
      
  //     // Get position relative to center of current ring
  //     const ringCenter = curve.getPointAt(Math.min(t, 1));
  //     const relX = (x - ringCenter.x) * scale;
  //     const relY = (y - ringCenter.y) * scale;
  //     const relZ = (z - ringCenter.z) * scale;
      
  //     // Store the relative position and the tubular index for later use
  //     originalRelativePositions.push({
  //       relX, relY, relZ, 
  //       tubularIndex,
  //       t: Math.min(t, 1)
  //     });
      
  //     // Apply initial taper
  //     positionAttribute.setXYZ(
  //       i,
  //       ringCenter.x + relX,
  //       ringCenter.y + relY,
  //       ringCenter.z + relZ
  //     );
  //   }
    
  //   // Store the data needed for animation
  //   tubeGeometry.userData = {
  //     curve,
  //     curvePoints,
  //     originalRelativePositions,
  //     segments
  //   };
    
  //   positionAttribute.needsUpdate = true;
  //   tubeGeometry.computeVertexNormals();
    
  //   return new THREE.Mesh(tubeGeometry, tentacleMaterial.clone());
  // };
  
  // // Function to place tentacles in a circle
  // const createTentacleCircle = (radius, count) => {
  //   const tentacles = [];
    
  //   for (let i = 0; i < count; i++) {
  //     const angle = (i / count) * Math.PI * 2;
      
  //     // Add variation to length (±20%)
  //     const lengthVariation = 1 + (Math.random() * tentacleConfig.lengthVariation * 2 - tentacleConfig.lengthVariation);
  //     const tentacleLength = tentacleConfig.length * lengthVariation;
      
  //     // Create a single tentacle
  //     const tentacle = createTentacle(tentacleLength, tentacleConfig.segments);
  //     tentacle.name = 'tentacle';
      
  //     // Add position variation (±8% of radius)
  //     const radiusVariation = radius * (1 + (Math.random() * tentacleConfig.positionVariation * 2 - tentacleConfig.positionVariation));
      
  //     // Add angle variation (±3% of a full circle)
  //     const angleVariation = angle + (Math.random() * tentacleConfig.angleVariation * 2 - tentacleConfig.angleVariation);
      
  //     // Position the tentacle in a circle with variation
  //     tentacle.position.x = Math.cos(angleVariation) * radiusVariation;
  //     tentacle.position.z = Math.sin(angleVariation) * radiusVariation;
  //     tentacle.position.y = 0; // Start at ground level
      
  //     // Rotate to point outward from center
  //     tentacle.rotation.y = Math.PI * 2 - angleVariation;
      
  //     // Add random rotation in other axes for more organic look
  //     tentacle.rotation.x = (Math.random() * tentacleConfig.rotationVariation * 2) - tentacleConfig.rotationVariation;
  //     tentacle.rotation.z = (Math.random() * tentacleConfig.rotationVariation * 2) - tentacleConfig.rotationVariation;
      
  //     // Store animation data
  //     tentacle.userData = {
  //       ...tentacle.userData,
  //       initialAngle: angleVariation,
  //       initialRadius: radiusVariation,
  //       initialRotation: {
  //         x: tentacle.rotation.x,
  //         y: tentacle.rotation.y,
  //         z: tentacle.rotation.z
  //       },
  //       timeOffset: Math.random() * Math.PI * 2,
  //       wiggleSpeed: tentacleConfig.wiggleSpeed + Math.random() * tentacleConfig.wiggleSpeedVariation,
  //       wiggleAmount: tentacleConfig.wiggleAmount + Math.random() * tentacleConfig.wiggleAmountVariation,
  //       length: tentacleLength
  //     };
      
  //     tentacles.push(tentacle);
  //     tentacleGroup.add(tentacle);
  //   }
    
  //   return tentacles;
  // };
  
  // Create circle of tentacles (60% larger than teeth circle)
  const tentacleRadius = 0.24 * 1.6; // Using the same radius as the teeth would have been
  const tentacleCount = 12; // Fewer tentacles than teeth, as they're larger
  // const tentacles = createTentacleCircle(tentacleRadius, tentacleCount);
  
  // Store the initial time for animation
  const initialTime = Date.now() / 1000;
  const group = new THREE.Group();
  
  // Add animation function to the group
  // tentacleGroup.userData.animateTentacles = function(deltaTime, elapsedTime) {
  //   const time = elapsedTime;
    
  //   // Animate each tentacle
  //   tentacles.forEach((tentacle, index) => {
  //     const data = tentacle.userData;
  //     const geometry = tentacle.geometry;
  //     const geometryData = geometry.userData;
      
  //     // Update the curve points for wiggling effect
  //     // First point always stays at the base (0,0,0)
  //     geometryData.curvePoints[0].set(0, 0, 0);
      
  //     for (let j = 1; j <= geometryData.segments; j++) {
  //       const t = j / geometryData.segments;
        
  //       // Increase wiggle amount as we move up the tentacle
  //       const wiggleFactor = t * t; // Quadratic increase for more movement at the tip
        
  //       // Create different frequencies of movement
  //       const timeScale = data.wiggleSpeed;
  //       const xWiggle = Math.sin(time * timeScale + data.timeOffset + j * 0.5) * data.wiggleAmount * wiggleFactor;
  //       const zWiggle = Math.cos(time * timeScale * 0.7 + data.timeOffset + j * 0.3) * data.wiggleAmount * wiggleFactor;
        
  //       // The base of the tentacle stays relatively still, the tip moves more
  //       geometryData.curvePoints[j].set(
  //         xWiggle,
  //         data.length * t, // Height increases linearly
  //         zWiggle
  //       );
  //     }
      
  //     // Update the curve with new points
  //     geometryData.curve.points = geometryData.curvePoints;
      
  //     // Update all vertices based on the new curve
  //     const positionAttribute = geometry.getAttribute('position');
      
  //     for (let i = 0; i < geometryData.originalRelativePositions.length; i++) {
  //       const vertexData = geometryData.originalRelativePositions[i];
        
  //       // Get the updated position on the curve
  //       const pointOnCurve = geometryData.curve.getPointAt(vertexData.t);
        
  //       // Apply the relative offset to maintain the tube shape
  //       positionAttribute.setXYZ(
  //         i,
  //         pointOnCurve.x + vertexData.relX,
  //         pointOnCurve.y + vertexData.relY,
  //         pointOnCurve.z + vertexData.relZ
  //       );
  //     }
      
  //     positionAttribute.needsUpdate = true;
  //     geometry.computeVertexNormals();
      
  //     // Also apply some rotation to the entire tentacle for additional movement
  //     const rotWiggleX = Math.sin(time * 0.5 + data.timeOffset) * 0.05;
  //     const rotWiggleZ = Math.cos(time * 0.3 + data.timeOffset) * 0.05;
      
  //     tentacle.rotation.x = data.initialRotation.x + rotWiggleX;
  //     tentacle.rotation.z = data.initialRotation.z + rotWiggleZ;
  //   });
  // };
  
  // Rotating magical runes ring
  const runeRingGeometry = new THREE.RingGeometry(0.25, 0.32, 32, 2, 0, Math.PI * 2);
  const runeRingMaterial = new THREE.MeshBasicMaterial({
    color: playerColor,
    transparent: true,
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
    blending: THREE.AdditiveBlending
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
    blending: THREE.AdditiveBlending
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

  tentacleGroup.visible = false
  
  return {
    group,
    tentacleGroup
  };
}

function startSummoningAnimation(tentacleGroup: THREE.Group, group: THREE.Group, isPlayerHighlight = true) {
    // Set colors based on isPlayerHighlight
    const playerColor = isPlayerHighlight ? 0x00ff88 : 0xff3333;
    const accentColor = isPlayerHighlight ? 0x00ff88 : 0xff3333;
    
    // Update materials with the appropriate colors
    // tentacleGroup.traverse((child) => {
    //   if (child instanceof THREE.Mesh && child.material) {
    //     (child.material as THREE.MeshStandardMaterial).color.setHex(playerColor);
    //     (child.material as THREE.MeshStandardMaterial).emissive.setHex(playerColor);
    //   }
    // });
    
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
    
    // tentacleGroup.visible = true;
    
    // // Animate scale from 0 to 1
    // new TWEEN.Tween(tentacleGroup.scale)
    //   .to({ x: 1, y: 1, z: 1 }, 0)
    //   .easing(TWEEN.Easing.Linear.None)
    //   .start();
    
    // // Animate opacity of each tentacle from 0 to 1
    // tentacleGroup.children.forEach((tentacle, index) => {
    //   if (tentacle instanceof THREE.Mesh && tentacle.material) {
    //     // Add slight delay for each tentacle for a more organic appearance
    //     const delay = index * 50;
        
    //     new TWEEN.Tween((tentacle.material as THREE.MeshStandardMaterial))
    //       .to({ opacity: 1 }, 800)
    //       .delay(delay)
    //       .easing(TWEEN.Easing.Cubic.Out)
    //       .onComplete(() => {
    //         // When all tentacles are visible, fade in other effects
    //         if (index === tentacleGroup.children.length - 1) {
    //           fadeInHighlightEffects(tentacleGroup, group);
    //         }
    //       })
    //       .start();
    //   }
    // });

    fadeInHighlightEffects(tentacleGroup, group);
}

// Helper function to fade in the highlight effects (except tentacles)
function fadeInHighlightEffects(tentacleGroup: THREE.Group, group: THREE.Group) {
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
  
  // After effects are faded in, retract the tentacles
  // setTimeout(() => {
  //   retractTentacles(tentacleGroup);
  // }, 1000);
}

// Helper function to retract tentacles
function retractTentacles(tentacleGroup: THREE.Group) {
  if (tentacleGroup) {
    new TWEEN.Tween(tentacleGroup.position)
      .to({ y: -2 }, 2000)
      .easing(TWEEN.Easing.Quartic.InOut)
      .onComplete(() => {
        // Remove tentacles from scene to save resources
        tentacleGroup.visible = false
      })
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
  // Shared time value for syncing animations
  const time = performance.now() * 0.001;

  if (_duelistTentaclesA && _duelistTentaclesA.visible) {
    _duelistTentaclesA.userData.animateTentacles(deltaTime, time);
  }

  if (_duelistTentaclesB && _duelistTentaclesB.visible) {
    _duelistTentaclesB.userData.animateTentacles(deltaTime, time);
  }
  
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
        //@ts-ignore
        _currentScene.children.forEach(c => c.animate?.(deltaTime)) //replaced with deltaTime (could be elapsedTime), because if more than one childs had called getDelta() the animation wont work as supposed
        _renderer.render(_currentScene, _staticCamera)

        if (_currentScene instanceof InteractibleScene) {
          _currentScene.render(elapsedTime)
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

function setupScenes() {
  _scenes = {}
  Object.values(SceneName).forEach((sceneName) => {
    if (sceneName === SceneName.Duel) {
      _scenes[sceneName] = setupDuelScene()
    } else if (sceneName !== SceneName.TutorialDuel) {
      _scenes[sceneName] = setupStaticScene(sceneName, false)
    }
  })
}

//
// SceneName.Duel
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
  const { group: groupA, tentacleGroup: tentacleGroupA } = createDuelistHighlight();
  const { group: groupB, tentacleGroup: tentacleGroupB } = createDuelistHighlight();
  _duelistHighlightA = groupA;
  _duelistHighlightB = groupB;
  _duelistHighlightA.position.set(0.5, 0, 2);
  _duelistHighlightB.position.set(-0.5, 0, 2);
  scene.add(_duelistHighlightA);
  scene.add(_duelistHighlightB);

  _duelistTentaclesA = tentacleGroupA;
  _duelistTentaclesB = tentacleGroupB;
  _duelistTentaclesA.position.set(0.5, 0, 2);
  _duelistTentaclesB.position.set(-0.5, 0, 2);
  scene.add(_duelistTentaclesA);
  scene.add(_duelistTentaclesB);

  _duelistManager = new DuelistsManager(scene, _duelCamera, _spriteSheets)

  return scene
}

export function hideDialogs() {
  _duelistManager.hideElements()
}

export function resetDuelScene(resetCamera = true) {
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

  completeSummoningAnimation(_duelistTentaclesA)
  completeSummoningAnimation(_duelistTentaclesB)
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
  if (!_grassTransforms) return;
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
function setupStaticScene(sceneName, useLayered = false) {
  const scene = useLayered 
    ? new InteractibleLayeredScene(sceneName, _renderer, _staticCamera)
    : new InteractibleScene(sceneName, _renderer, _staticCamera)

  scene.add(_staticCamera)

  return scene
}



//-------------------------------------------
// Game Interface
//

export function switchScene(sceneName) {
  if (sceneName === SceneName.TutorialDuel) {
    sceneName = SceneName.Duel
  }

  if (_currentScene === sceneName) return;

  if (!_currentScene) {
    _sceneName = sceneName
    _currentScene = _scenes[sceneName]

    setTimeout(() => {
      fadeInCurrentScene();
    }, SCENE_CHANGE_ANIMATION_DURATION);
    
    if (sceneName != SceneName.Duel) {
      _duelistManager.hideElements()
    } else if (_statsEnabled) {
      resetDuelScene()
    }
  } else {
    fadeOutCurrentScene(() => {
      _sceneName = sceneName
      _currentScene = _scenes[sceneName]

      emitter.emit('hover_description', null)
      emitter.emit('hover_item', null)

      setTimeout(() => {
        fadeInCurrentScene();
      }, 0);
      
      if (sceneName != SceneName.Duel) {
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

  _tweens.staticFade?.stop();

  _tweens.staticFade = new TWEEN.Tween({ opacity: 0 })
    .to({ opacity: 1 }, SCENE_CHANGE_ANIMATION_DURATION)
    .onUpdate(({ opacity }) => {
      overlay.style.opacity = opacity.toString()
    })
    .onComplete(() => {
      callback();
    })
    .start();
}

function fadeInCurrentScene() {
  const overlay = document.getElementById('game-black-overlay');

  _tweens.staticFade?.stop();

  _tweens.staticFade = new TWEEN.Tween({ opacity: 1 })
    .to({ opacity: 0 }, SCENE_CHANGE_ANIMATION_DURATION)
    .onUpdate(({ opacity }) => {
      overlay.style.opacity = opacity.toString()
    })
    .start();
}

export function spawnDuelist(duelist, duelistName, duelistModel, isYou) {
  if (duelist == 'A') {
    _duelistManager.setupDuelistA(duelistName, duelistModel, isYou)
    setTimeout(() => {
      startSummoningAnimation(_duelistTentaclesA, _duelistHighlightA, isYou)
    }, 500)
  } else {
    _duelistManager.setupDuelistB(duelistName, duelistModel, isYou)
    setTimeout(() => {
      startSummoningAnimation(_duelistTentaclesB, _duelistHighlightB, isYou)
    }, 500)
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