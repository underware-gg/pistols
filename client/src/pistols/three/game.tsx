import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
//@ts-ignore
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

import { AudioName, AUDIO_ASSETS } from '@/pistols/data/assets'
import { DepthPostShader } from '@/pistols/three/DepthPostShader'
import { toRadians } from '@/pistols/utils/utils'

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

const SIZE = 1;
const CAM_FOV = 70;
const CAM_FAR = 5; // 1.3 .. 5
const TILT = 1;
const GAMMA = 1.25;
const COLOR_COUNT = 0; //16;
const DITHER = 0;
const DITHER_SIZE = 4;
const BAYER = 0;//4;
const PALETTE = 0;//1;

const TEXTURE_PATHS = [
  '/colors/gameboy.png',
  '/colors/blue.png',
  '/colors/pink.png',
  '/colors/purple.png',
  '/colors/earth.png',
  '/colors/hot.png',
  '/colors/spectrum.png',
  // '/colors/greeny.png',
]

let _width: number;
let _height: number;
let _aspect: number;
let _eyeZ: number;
let _textures = [];

let _animationRequest = null
let _renderer: THREE.WebGLRenderer;
let _camera: THREE.PerspectiveCamera;
let _cameraRig: THREE.Object3D;
let _scene: THREE.Scene
let _target, _postScene, _postCamera, _postMaterial;
let _supportsExtension: boolean = true;
let _gui
let _stats;


const defaultParams = {
  fov: CAM_FOV,
  far: CAM_FAR,
  tilt: TILT,
  gamma: GAMMA,
  colorCount: COLOR_COUNT,
  dither: DITHER,
  ditherSize: DITHER_SIZE,
  bayer: BAYER,
  palette: PALETTE,
  lightness: false,
  noiseAmount: 0.01,
  noiseSize: 10.0,
  ceilingHeight: 1.0,
};
let params = { ...defaultParams };


export function resetGameParams(newParams: any = {}) {
  // console.log(`resetGameParams() + `, newParams)
  Object.keys(defaultParams).forEach(key => {
    params[key] = newParams?.[key] ?? defaultParams[key]
  })
  _gui?.controllersRecursive().forEach(c => c.updateDisplay())
  paramsUpdated()
}

export function setGameParams(newParams: any) {
  // console.log(`setGameParams()`, newParams)
  Object.keys(newParams).forEach(key => {
    params[key] = newParams[key]
  })
  _gui?.controllersRecursive().forEach(c => c.updateDisplay())
  paramsUpdated()
}


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

export async function init(canvas, width, height, guiEnabled, statsEnabled = false) {

  if (_scene) return;

  _width = width;
  _height = height;
  _aspect = (width / height);
  _eyeZ = SIZE / 2;

  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    canvas,
  });

  if (_renderer.capabilities.isWebGL2 === false && _renderer.extensions.has('WEBGL_depth_texture') === false) {
    _supportsExtension = false;
    console.error(`WEBGL_depth_texture not supported!`)
    return;
  }

  _renderer.setPixelRatio(window.devicePixelRatio);
  _renderer.setSize(_width, _height);

  setupScene();

  _cameraRig = new THREE.Object3D();
  _cameraRig.position.set(0, 0, 0);
  _scene.add(_cameraRig)

  _camera = new THREE.PerspectiveCamera(
    CAM_FOV,  // fov
    _aspect,  // aspect
    0.01,     // near
    CAM_FAR,  // far
  );
  _cameraRig.add(_camera)
  _camera.up.set(0, 0, 1);
  _camera.position.set(0, 0, _eyeZ)
  _camera.lookAt(0, -SIZE, _eyeZ);

  // TEXTURE_PATHS.forEach(path => {
  //   const tex = new THREE.TextureLoader().load(path);
  //   tex.magFilter = THREE.NearestFilter;
  //   tex.minFilter = THREE.NearestFilter;
  //   _textures.push(tex);
  // })

  setupRenderTarget();
  setupPost();

  onWindowResize();
  window.addEventListener('resize', onWindowResize);

  if (guiEnabled !== null) {
    _gui = new GUI({ width: 300 });
    _gui.add(params, 'fov', 30, 90, 1).onChange(guiUpdated);
    _gui.add(params, 'far', 1, 20, 0.1).onChange(guiUpdated);
    _gui.add(params, 'tilt', 0, 15, 0.1).onChange(guiUpdated);
    _gui.add(params, 'gamma', 0, 2, 0.01).onChange(guiUpdated);
    _gui.add(params, 'colorCount', 0, 16, 1).onChange(guiUpdated);
    _gui.add(params, 'dither', 0, 0.5, 0.01).onChange(guiUpdated);
    _gui.add(params, 'ditherSize', 2, 5, 1).onChange(guiUpdated);
    _gui.add(params, 'bayer', 0, 4, 1).onChange(guiUpdated);
    _gui.add(params, 'lightness', true).onChange(guiUpdated);
    _gui.add(params, 'noiseAmount', 0, 1, 0.001).onChange(guiUpdated);
    _gui.add(params, 'noiseSize', 1, 100, 1).onChange(guiUpdated);
    // _gui.add(params, 'ceilingHeight', 1, 5, 0.25).onChange(guiUpdated);
    if (guiEnabled) {
      _gui.open();
    } else {
      _gui.close();
    }

    // framerate
    if (statsEnabled) {
      _stats = new Stats();
      document.body.appendChild(_stats.dom);
    }
  }

  // await loadAssets();
}

export function getCameraRig() {
  return _cameraRig
}

function guiUpdated() {
  paramsUpdated()
}

function paramsUpdated() {
  // Camera
  _camera.fov = params.fov;
  _camera.far = params.far;
  _camera.updateProjectionMatrix();
  _postMaterial.uniforms.uCameraNear.value = _camera.near;
  _postMaterial.uniforms.uCameraFar.value = _camera.far;
  _postMaterial.uniforms.uCameraFov.value = toRadians(_camera.fov);
  // Shader
  _postMaterial.uniforms.uGamma.value = params.gamma;
  _postMaterial.uniforms.uColorCount.value = params.colorCount;
  _postMaterial.uniforms.uDither.value = params.dither;
  _postMaterial.uniforms.uDitherSize.value = params.ditherSize;
  _postMaterial.uniforms.uBayer.value = params.bayer;
  _postMaterial.uniforms.uPalette.value = 0;
  _postMaterial.uniforms.tPalette.value = null;
  _postMaterial.uniforms.uLightness.value = params.lightness;
  _postMaterial.uniforms.uNoiseAmount.value = params.noiseAmount;
  _postMaterial.uniforms.uNoiseSize.value = params.noiseSize;
}

// Create a render target with depth texture
// const formats = { DepthFormat: THREE.DepthFormat, DepthStencilFormat: THREE.DepthStencilFormat };
// const types = { UnsignedShortType: THREE.UnsignedShortType, UnsignedIntType: THREE.UnsignedIntType, UnsignedInt248Type: THREE.UnsignedInt248Type };
function setupRenderTarget() {
  if (_target) _target.dispose();
  const format = THREE.DepthFormat;
  const type = THREE.UnsignedShortType;
  _target = new THREE.WebGLRenderTarget(_width, _height);
  _target.texture.minFilter = THREE.NearestFilter;
  _target.texture.magFilter = THREE.NearestFilter;
  // _target.stencilBuffer = (format === THREE.DepthStencilFormat) ? true : false;
  //@ts-ignore
  _target.depthTexture = new THREE.DepthTexture();
  _target.depthTexture.format = format;
  _target.depthTexture.type = type;
}

function setupPost() {
  _postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  _postMaterial = new THREE.ShaderMaterial({
    vertexShader: DepthPostShader.vertexShader,
    fragmentShader: DepthPostShader.fragmentShader,
    uniforms: {
      uCameraNear: { value: _camera.near },
      uCameraFar: { value: _camera.far },
      uCameraFov: { value: _camera.fov },
      uGamma: { value: GAMMA },
      uColorCount: { value: COLOR_COUNT },
      uDither: { value: DITHER },
      uDitherSize: { value: DITHER_SIZE },
      uBayer: { value: BAYER },
      uPalette: { value: params.palette },
      uLightness: { value: params.lightness },
      uNoiseAmount: { value: params.noiseAmount },
      uNoiseSize: { value: params.noiseSize },
      uTime: { value: 0.0 },
      tPalette: { value: null },
      tDiffuse: { value: null },
      tDepth: { value: null }
    }
  });
  guiUpdated();
  const postPlane = new THREE.PlaneGeometry(2, 2);
  const postQuad = new THREE.Mesh(postPlane, _postMaterial);
  _postScene = new THREE.Scene();
  _postScene.add(postQuad);
  postQuad.scale.set(-1, 1, 1);
}

function onWindowResize() {
  // const aspect = window.innerWidth / window.innerHeight;
  // camera.aspect = aspect;
  // camera.updateProjectionMatrix();
  // const dpr = renderer.getPixelRatio();
  // target.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  // renderer.setSize(window.innerWidth, window.innerHeight);
}


//-------------------------------------------
// Game Loop
//

export function animate(time) {
  if (!_supportsExtension || !_scene || !_renderer) return;

  _animationRequest = requestAnimationFrame(animate);

  _postMaterial.uniforms.uTime.value = time / 1000.0;

  TWEEN.update();

  // render scene into target
  _renderer.setRenderTarget(_target);
  _renderer.render(_scene, _camera);

  // render post FX
  _postMaterial.uniforms.tDiffuse.value = _target.texture;
  _postMaterial.uniforms.tDepth.value = _target.depthTexture;

  _renderer.setRenderTarget(null);
  _renderer.render(_postScene, _postCamera);

  _stats?.update();
}


//-------------------------------------------
// Scene hook
//

function setupScene() {
  _scene = new THREE.Scene();

  // _scene.add(_background)

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

