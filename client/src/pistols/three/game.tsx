import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js'

import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
import { Rain } from './Rain'
import { Grass } from './Grass.tsx';
import * as shaders from './shaders.tsx'

// event emitter
// var ee = require('event-emitter');
import ee from 'event-emitter'
export var emitter = ee()

import { AudioName, AUDIO_ASSETS, TEXTURES, SPRITESHEETS, AnimName, sceneBackgrounds, TextureName } from '@/pistols/data/assets'
import { SceneName } from '@/pistols/hooks/PistolsContext'
import { map } from '@/lib/utils/math'
import { SpriteSheet, Actor } from './SpriteSheetMaker'
import { Action, ActionTypes } from '@/pistols/utils/pistols'


//---------------------------
// CONSTANTS
//

/**
 * Sizes
 */
export const WIDTH = 1920//1200
export const HEIGHT = 1080//675
export const ASPECT = (WIDTH / HEIGHT)

/**
 * Camera Constants
 */
const cameraData = {
    fieldOfView: 16,
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
    water: 'WaterPlane',
    puddles: 'Puddles',
    cliffs: 'Cliffs',
    skyBackground: 'Sky',
    sirSecond: 'Sir_Second',
    speechBubblesLeft: 'Speech_Bubbles',
    ladySecond: 'Lady_Second',
    duelistLeft: 'Sir',
    duelistRight: 'Lady',
}

const ACTOR_WIDTH = 2.5
const ACTOR_HEIGHT = 1.35
const PACES_X_0 = 0.5
const PACES_X_STEP = 0.32

const zoomedCameraPos = {
	x: 0,
	y: 0.3,
	z: -3,
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

//-------------------------------------------
// Setup
//

let _textures: any = {}
let _spriteSheets: any = {}

export let _renderer: THREE.WebGLRenderer
export let _fullScreenGeom: THREE.PlaneGeometry = null //TODO test what this is

let _animationRequest = null
let _clock: THREE.Clock
let _staticCamera: THREE.OrthographicCamera
let _duelCamera: THREE.PerspectiveCamera
let _supportsExtension: boolean = true
let _stats
let _controls
let _mixer
let _animations
let _gui;

let _duelistAModel
let _duelistBModel
let _grass
let _groundMirrorShallow
let _groundMirrorDeep
let _sky
let _ladySecond
let _sirSecond

let _currentScene: THREE.Scene = null
let _scenes: Partial<Record<SceneName, THREE.Scene>> = {}
let _sceneName: SceneName

let _sfxEnabled = true

const _skyState = {
    key: 'SKY',
    frameRate: 8,
    framesCount: 126,
    isBackwards: false,
    lastDisplayTime: 0,
    currentFrame: 0
}

const _tweens = {
	cameraPos: null,
	actorPosA: null,
	actorPosB: null,
	staticZoom: null,
	staticFade: null,
}

export const _makeStaticCamera = (x, y, z) => {
	let result = new THREE.OrthographicCamera( //TODO maybe switch to perspective??? Backround is the only problem
		-WIDTH / 2,
		WIDTH / 2,
		HEIGHT / 2,
		-HEIGHT / 2,
		cameraData.nearPlane, cameraData.farPlane
    )
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

    // color space migration
	// https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
	// THREE.ColorManagement.enabled = false
    await loadAssets()

    _duelistAModel = localStorage.getItem("DUELIST_A")
    _duelistBModel = localStorage.getItem("DUELIST_B")

    if (statsEnabled) {
        _stats = new Stats()
        document.body.appendChild(_stats.dom)
    }

    _fullScreenGeom = new THREE.PlaneGeometry(WIDTH, HEIGHT)
    setCameras()
    
    setRender(canvas)
    setupScenes(statsEnabled)

	window.addEventListener('resize', onWindowResize)

	_clock = new THREE.Clock(true)

	console.log(`THREE.init() done 👍`)
}

function setCameras() {
    _staticCamera = _makeStaticCamera(0, 0, 10)

	_duelCamera = new THREE.PerspectiveCamera(
		cameraData.fieldOfView,
		ASPECT,
		cameraData.nearPlane,
		cameraData.farPlane,
	)
}

async function loadAssets() {
    await shaders.loadShaders();
    
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager); 
    const ddsLoader = new DDSLoader(loadingManager);
    
    Object.keys(TEXTURES).forEach(key => {
		const TEX = TEXTURES[key]
		const tex = textureLoader.load(TEX.path)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
		_textures[key] = tex
	})
	Object.keys(SPRITESHEETS).forEach(actorName => {
		_spriteSheets[actorName] = {}
		Object.keys(SPRITESHEETS[actorName]).forEach(key => {
			_spriteSheets[actorName][key] = new SpriteSheet(key, SPRITESHEETS[actorName][key], textureLoader)
		})
	})

    for (let f = 1; f <= _skyState.framesCount; ++f) {
        const frameNumber = ('000' + f.toString()).slice(-3)
        let path = `/textures/animations/sky/frame_${frameNumber}.dds`
        let tex = ddsLoader.load(path)
        
        tex.colorSpace = THREE.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        tex.flipY = false
        
        if (!_textures[_skyState.key]) {
            _textures[_skyState.key] = []
        }
        _textures[_skyState.key].push(tex)
      }

    _textures[TextureName.duel_water_dudv].wrapS = _textures[TextureName.duel_water_dudv].wrapT = THREE.RepeatWrapping;
}

function setGUI() {
    _gui = new GUI({
        width: 400,
        title: 'Scene Debug UI',
        closeFolders: true,
    });
    _gui.close();
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

function onWindowResize() {
	// calc canvas size
	const winWidth = window.innerWidth
	const winHeight = window.innerHeight
	const aspect = winWidth / winHeight
	const canvasWidth = aspect > ASPECT ? winHeight * ASPECT : winWidth
	const canvasHeight = aspect > ASPECT ? winHeight : winWidth / ASPECT
	_renderer.setSize(canvasWidth, canvasHeight)
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

	// setup cam
	_duelCamera.position.set(0, 0.3, -3)
	_duelCamera.lookAt(0, 0.5, 2)
	_duelCamera.updateProjectionMatrix()
}


//-------------------------------------------
// Game Loop
//

let lastFrameTime = performance.now();
const frameDuration = 1000 / 60;

export function animate() {
    if (!_supportsExtension || !_renderer) return;

    const now = performance.now();
    const delta = now - lastFrameTime;

    const deltaTime = _clock.getDelta();
    const elapsedTime = _clock.getElapsedTime();

    // More precise frame rate controll
    if (delta >= frameDuration) {
        lastFrameTime = now - (delta % frameDuration);

        if (_currentScene) {
            TWEEN.update();

            _renderer.clear();

            if (_sceneName == SceneName.Duel) {
                _groundMirrorShallow?.setUniformValue("time", elapsedTime);
                _groundMirrorDeep?.setUniformValue("time", elapsedTime);
                _mixer?.update(deltaTime);
                _controls?.update();
                _grass?.update(deltaTime);

                _renderer.render(_currentScene, _duelCamera);
            } else {
                //@ts-ignore
                _currentScene.children.forEach(c => c.animate?.(deltaTime)); //replaced with deltaTime (could be elapsedTime), because if more than one childs had called getDelta() the animation wont work as supposed
                _renderer.render(_currentScene, _staticCamera);
            }

            _stats?.update();
        }
    }

    if (_currentScene && _sceneName == SceneName.Duel) {  //Duelists and sky take care of their own framerate so for frame consistency this is better
        _actor.A?.update(elapsedTime);
        _actor.B?.update(elapsedTime);
        
        updateSky(elapsedTime)
    }

    // Continue the animation loop
    _animationRequest = requestAnimationFrame(animate);
}


//-------------------------------------------
// Scene hook
//

let _actors: any = {}
let _actor: any = {}

function setupScenes(statsEnabled: boolean) {
	_scenes = {}
	Object.keys(sceneBackgrounds).forEach((sceneName) => {
		if (sceneName == SceneName.Duel) {
			_scenes[sceneName] = setupDuelScene(statsEnabled)
		} else {
			_scenes[sceneName] = setupStaticScene(sceneName)
		}
	})
	// switchScene(SceneName.Splash)
}

//
// SceneName.Duel
//
function setupDuelScene(statsEnabled) {
	const scene = new THREE.Scene()
	scene.add(_duelCamera)

    setEnvironment(scene)

    if (statsEnabled) {
        setGUI()
    }

    loadDuelists()
	loadGltf(scene, statsEnabled)

	return scene
}

export function resetDuelScene() {
	emitter.emit('animated', AnimationState.None)

    _actor['A']?.stop()
    _actor['B']?.stop()

	switchActor('A', _duelistAModel)
	switchActor('B', _duelistBModel)
    
	zoomCameraToPaces(10, 0)
	zoomCameraToPaces(0, 5)

	resetActorPositions()
	playActorAnimation('A', AnimName.STILL)
	playActorAnimation('B', AnimName.STILL)
}

/**
 * Environment map
 * set the scene environment and or background
 */
function setEnvironment(scene: THREE.Scene) { //TODO add skymap
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/textures/sky_2k.hdr', (environmentMap) => {
        environmentMap.mapping = THREE.EquirectangularReflectionMapping

        scene.background = environmentMap
        scene.environment = environmentMap
    })
}

function loadDuelists() {
    _actors.MALE_A = new Actor(_spriteSheets.MALE, ACTOR_WIDTH, ACTOR_HEIGHT, false)
	_actors.FEMALE_A = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, false)
    
	_actors.MALE_B = new Actor(_spriteSheets.MALE, ACTOR_WIDTH, ACTOR_HEIGHT, true)
	_actors.FEMALE_B = new Actor(_spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, true)
}

/**
 * glTF loading
 */
function loadGltf(scene: THREE.Scene, statsEnabled: boolean) {
    const loader = new GLTFLoader();

    loader.load(
        '/models/Duel_3.glb',
        function ( gltf ) {

            setCamera(gltf.cameras[0])
            if (statsEnabled) {
                setCameraControls(scene)
            }

            /**
             * Load Animations
             */

            _mixer = new THREE.AnimationMixer(gltf.scene);
            _animations = gltf.animations

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
                    child.material.map = _textures[TextureName.duel_ground]
                    child.material.normalMap = _textures[TextureName.duel_ground_normal]
                    child.position.set(0, 0, 0)
                }

                if (child.name.includes(glTFNames.grass)) {
                    const matrix = new THREE.Matrix4()
                    matrix.compose(child.getWorldPosition(new THREE.Vector3()), child.getWorldQuaternion(new THREE.Quaternion()), child.getWorldScale(new THREE.Vector3()))

                    grassTransforms.push(matrix)

                    gltf.scene.remove(child)
                }

                if (child.name == glTFNames.skyBackground) {
                    child.material.alphaTest = 0.5
                    child.renderOrder = -1
                    child.position.y = 0.2
                    child.position.z = 50

                    _sky = child
                }

                if (child.name == glTFNames.water) {
                    child.visible = false
                    child.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX( - Math.PI / 2));

                    _groundMirrorShallow = createWaterPlane("WaterShallow", child.geometry, {
                        color: 0x597f86,
                        height: -0.001,
                        rotation: child.rotation,
                        scale: child.scale
                    }, statsEnabled)

                    scene.add(_groundMirrorShallow)
                }

                if (child.name == glTFNames.puddles) {
                    child.visible = false
                    child.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX( - Math.PI / 2));

                    _groundMirrorDeep = createWaterPlane("WaterDeep", child.geometry, {
                        color: 0x35595e,
                        height: -0.0001,
                        rotation: child.rotation,
                        scale: child.scale
                    }, statsEnabled)

                    scene.add(_groundMirrorDeep)
                }
            })

            _grass = new Grass(
                {
                    height: 0,
                    offset: 0.007,
                    heightmap: null,
                    dims: 256,
                    transforms: grassTransforms
                }, 
                statsEnabled,
                _gui
            );
    
            scene.add( _grass );
            scene.add( gltf.scene );

            onWindowResize()
        }
    );
}

function setCamera(cameraObject) {
    _duelCamera = cameraObject
    _duelCamera.near = cameraData.nearPlane
    _duelCamera.far = cameraData.farPlane
    _duelCamera.fov = cameraData.fieldOfView
    _duelCamera.aspect = ASPECT;
    _duelCamera.updateProjectionMatrix();
}

function createWaterPlane(name, geometry, params, statsEnabled) {
    const water = new shaders.ReflectorMaterial( "WATER", geometry, {
        clipBias: 0.0003,
        textureWidth: WIDTH,
        textureHeight: HEIGHT, //TODO check if this works??
        color: params.color
    } );

    water.setUniformValue('waterStrength', 0.04)
    water.setUniformValue('waterSpeed', 0.03)
    water.setUniformValue('waveStrength', 0.04)
    water.setUniformValue('waveSpeed', 0.05)
    water.setUniformValue('tDudv', _textures[TextureName.duel_water_dudv])
    water.setUniformValue('windDirection', new THREE.Vector2(1.0, 0.0))
    water.setUniformValue('windDirection', new THREE.Vector2(1.0, 0.0))
    
    water.position.y = params.height;
    water.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z)
    water.rotateX(Math.PI / 2)
    water.scale.set(params.scale.x, params.scale.z, params.scale.y)

    if (statsEnabled) {
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
            //@ts-ignore
            .addColor(water.getUniforms().color, 'value')
            .name('waterColor')
    }

    return water
}

function setCameraControls(scene) {
    // _controls = new OrbitControls(_duelCamera, _renderer.domElement)
    // _controls.enableDamping = true
    // _controls.dampingFactor = 0.04

    const axesHelper = new THREE.AxesHelper(3)
    scene.add(axesHelper)
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

export function switchScene(sceneName, duelistModelA, duelistModelB) {
	_sceneName = sceneName
	_currentScene = _scenes[sceneName]
	if (sceneName == SceneName.Duel) {
        localStorage.setItem("DUELIST_A", duelistModelA == "MALE" ? "MALE_A" : "FEMALE_A")
        localStorage.setItem("DUELIST_B", duelistModelB == "MALE" ? "MALE_B" : "FEMALE_B")
		_duelistAModel = localStorage.getItem("DUELIST_A")
		_duelistBModel = localStorage.getItem("DUELIST_B")
		resetDuelScene()
	} else {
		resetStaticScene()
	}
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


export function playActorAnimation(actorId: string, key: AnimName, onEnd: Function = null) {
    let onStart = null
    let movement = {
        x: 0,
        y: 0, 
        z: 0
    }

    if(key == AnimName.STEP_1 || key == AnimName.STEP_2 || key == AnimName.TWO_STEPS) {
        movement.x = 0.044
    } else if (key == AnimName.SHOOT) {
		onStart = () => { playAudio(AudioName.SHOOT, _sfxEnabled) }
	} else if ([AnimName.SHOT_DEAD_FRONT, AnimName.SHOT_DEAD_BACK, AnimName.STRUCK_DEAD].includes(key)) {
		onStart = () => { playAudio(AudioName.BODY_FALL, _sfxEnabled) }
	} else if ([AnimName.SHOT_INJURED_FRONT, AnimName.SHOT_INJURED_BACK, AnimName.STRUCK_INJURED].includes(key)) {
		if (actorId == 'A') {
			if (_duelistAModel == "MALE_A") {
				onStart = () => { playAudio(AudioName.GRUNT_MALE, _sfxEnabled) }
			} else {
				onStart = () => { playAudio(AudioName.GRUNT_FEMALE, _sfxEnabled) }
			}
		} else {
			if (_duelistBModel == "MALE_B") {
				onStart = () => { playAudio(AudioName.GRUNT_MALE, _sfxEnabled) }
			} else {
				onStart = () => { playAudio(AudioName.GRUNT_FEMALE, _sfxEnabled) }
			}
		}
	} else if (key == AnimName.STRIKE_LIGHT) {
		onStart = () => { playAudio(AudioName.STRIKE_LIGHT, _sfxEnabled) }
	} else if (key == AnimName.STRIKE_HEAVY) {
		onStart = () => { playAudio(AudioName.STRIKE_HEAVY, _sfxEnabled) }
	} else if (key == AnimName.STRIKE_BLOCK) {
		onStart = () => { playAudio(AudioName.STRIKE_BLOCK, _sfxEnabled) }
	}

	_actor[actorId].playOnce(key, movement, onStart, onEnd)
	
}

function updateSky(seconds) {
    if (!_sky) return
    
    const elapsed = seconds - _skyState.lastDisplayTime
    if (elapsed >= 1 / _skyState.frameRate) {
        _skyState.lastDisplayTime = seconds
        if (_skyState.isBackwards) {
            _skyState.currentFrame--;
        } else {
            _skyState.currentFrame++;
        }

        if (_skyState.currentFrame >= _skyState.framesCount) {
            _skyState.currentFrame = 0
        } else if (_skyState.currentFrame < 0) {
            _skyState.currentFrame = _skyState.framesCount - 1
        }

        _sky.material.map = _textures[_skyState.key][_skyState.currentFrame]
    }
}



//----------------
// Animation triggers
//

export function zoomCameraToPaces(paceCount, seconds) {
	const targetPos = {
		x: map(paceCount, 0, 10, zoomedCameraPos.x, 0),
		y: map(paceCount, 0, 10, zoomedCameraPos.y, 2),
		z: map(paceCount, 0, 10, zoomedCameraPos.z, -45),
	}

	if (_tweens.cameraPos) TWEEN.remove(_tweens.cameraPos)
	if (seconds == 0) {
		// just set
		// console.log(`CAMS SET`, targetPos)
		_duelCamera.position.set(targetPos.x, targetPos.y, targetPos.z)
	} else {
		// console.log(`CAM ANIM`, targetPos)
		// animate
		_tweens.cameraPos = new TWEEN.Tween(_duelCamera.position)
			.to(targetPos, seconds * 1000)
			.easing(TWEEN.Easing.Sinusoidal.Out)
			.onUpdate(() => {
				// emitter.emit('movedTo', { x: _duelCameraRig.position.x, y: _duelCameraRig.position.y, z: _duelCameraRig.position.z })
			})
			.start()
			.onComplete(() => {
				// console.log(`CAM ===`, _duelCamera.position, _duelCamera.position)
			})
	}
}

export function resetActorPositions() {
    _actor['A'].mesh.position.set(PACES_X_0, _actor['A'].mesh.position.y, _actor['A'].mesh.position.z)
    _actor['B'].mesh.position.set(-PACES_X_0, _actor['B'].mesh.position.y, _actor['B'].mesh.position.z)
}

export function animateDuel(state: AnimationState, actionA: number, actionB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
	if (state == AnimationState.Round1) {
		animateShootout(actionA, actionB, healthA, healthB, damageA, damageB);
	} else {
		animateActions(state, actionA, actionB, healthA, healthB, damageA, damageB)
	}
}

function animateShootout(paceCountA: number, paceCountB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
	const minPaceCount = Math.min(paceCountA, paceCountB)
    const paceDifference = Math.min(Math.abs(paceCountA - paceCountB), 2) //if one duelist walks further, we add 1 or 2 steps so his walking animation matches the other duelists shoot asnimation

    if (minPaceCount == 4 || minPaceCount == 5) {
        _sirSecond.visible = false
        _ladySecond.visible = false
    } else {
        _sirSecond.visible = true
        _ladySecond.visible = true
    }

	// animate camera
	zoomCameraToPaces(0, 0)
	zoomCameraToPaces(minPaceCount / 2, (minPaceCount + 1)) //adjusted zoom out value to minimize gliding effect for now.

	resetActorPositions()

	// animate sprites
	for (let i = 0; i < minPaceCount + paceDifference; i++) {
		const key: AnimName = i % 2 == 1 ? AnimName.STEP_2 : AnimName.STEP_1

        //To make the other duelist walt while one goes to shooting
        if (i >= minPaceCount) {
            if (paceCountA > paceCountB) {
                playActorAnimation('A', key)
            } else if (paceCountB > paceCountA) {
                playActorAnimation('B', key)
            }
        } else {
            //timeout not needed with animationQueue
            playActorAnimation('A', key)
            playActorAnimation('B', key)
        }
	}

	// SHOOT!
    const _shootA = () => {
        playActorAnimation('A', AnimName.SHOOT, () => {
            emitter.emit('animated', AnimationState.HealthB)
            if (healthB == 0) {
                playActorAnimation('B', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
            } else if (damageB > 0) {
                playActorAnimation('B', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
            } else {
                emitter.emit('animated', AnimationState.Round1)
            }
        })
    }
    const _shootB = () => {
        playActorAnimation('B', AnimName.SHOOT, () => {
            emitter.emit('animated', AnimationState.HealthA)
            if (healthA == 0) {
                playActorAnimation('A', AnimName.SHOT_DEAD_FRONT, () => emitter.emit('animated', AnimationState.Round1))
            } else if (damageA > 0) {
                playActorAnimation('A', AnimName.SHOT_INJURED_FRONT, () => emitter.emit('animated', AnimationState.Round1))
            } else {
                emitter.emit('animated', AnimationState.Round1)
            }
        })
    }

    //
    // Both fire at same time
    if (paceCountA == paceCountB) {
        _shootA()
        _shootB()
    }
    //
    // A fires first
    if (paceCountA < paceCountB) {
        playActorAnimation('A', AnimName.SHOOT, () => {
            emitter.emit('animated', AnimationState.HealthB)
            if (healthB == 0) {
                playActorAnimation('B', AnimName.SHOT_DEAD_BACK, () => emitter.emit('animated', AnimationState.Round1))
            } else if (damageB > 0) {
                playActorAnimation('B', AnimName.SHOT_INJURED_BACK, () => _shootB())
            } else {
                _shootB()
            }
        })
    }
    //
    // B fires first
    if (paceCountB < paceCountA) {
        playActorAnimation('B', AnimName.SHOOT, () => {
            emitter.emit('animated', AnimationState.HealthA)
            if (healthA == 0) {
                playActorAnimation('A', AnimName.SHOT_DEAD_BACK, () => emitter.emit('animated', AnimationState.Round1))
            } else if (damageA > 0) {
                playActorAnimation('A', AnimName.SHOT_INJURED_BACK, () => _shootA())
            } else {
                _shootA()
            }
        })
    }
}

const _getActionAnimName = (action: Action): AnimName => {
	const result = ActionTypes.paces.includes(action) ? AnimName.SHOOT
		: ActionTypes.runner.includes(action) ? AnimName.TWO_STEPS
			: action == Action.Fast ? AnimName.STRIKE_LIGHT
				: action == Action.Strong ? AnimName.STRIKE_HEAVY
					: action == Action.Block ? AnimName.STRIKE_BLOCK
						: AnimName.STILL_BLADE
	// console.log(`_getActionAnimName:`, action, result)
	return result
}

function animateActions(state: AnimationState, actionA: number, actionB: number, healthA: number, healthB: number, damageA: number, damageB: number) {

	// Rewind camera and
	zoomCameraToPaces(0, 0)
	resetActorPositions()

	// animate sprites
	playActorAnimation('A', _getActionAnimName(actionA), () => {
		let survived = 0
		if (healthB == 0) {
			playActorAnimation('B', AnimName.STRUCK_DEAD, () => emitter.emit('animated', state))
		} else if (damageB > 0) {
			playActorAnimation('B', AnimName.STRUCK_INJURED, () => emitter.emit('animated', state))
		} else {
			survived++
		}
		if (healthA == 0) {
			playActorAnimation('A', AnimName.STRUCK_DEAD, () => emitter.emit('animated', state))
		} else if (damageA > 0) {
			playActorAnimation('A', AnimName.STRUCK_INJURED, () => emitter.emit('animated', state))
		} else {
			survived++
		}
		if (survived == 2) emitter.emit('animated', state)
	})

	playActorAnimation('B', _getActionAnimName(actionB), () => {
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
