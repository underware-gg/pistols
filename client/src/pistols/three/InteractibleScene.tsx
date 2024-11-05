import * as THREE from 'three'
import { clamp } from 'three/src/math/MathUtils'
import {
  WIDTH, HEIGHT,
  _textures,
  _sceneName, _currentScene,
  emitter,
  ASPECT,
  cameraData,
  sizes,
  SCENE_CHANGE_ANIMATION_DURATION,
} from './game';
import { TextureName, sceneBackgrounds, SceneData, SceneObject } from '../data/assets';
import { ShaderMaterial } from './shaders'
import TWEEN from '@tweenjs/tween.js'

export class InteractibleScene extends THREE.Scene {

  sceneData: SceneData

  maskOverlay: THREE.Mesh
  maskShader: ShaderMaterial

  bgMaskMesh: THREE.Mesh

  fbo: THREE.WebGLRenderTarget
  fbo_scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.Camera

  mousePos: THREE.Vector2
  pickedColor: THREE.Color
  pickedItem: SceneObject
  timeOffset: number
  isClickable: boolean = true

  lastClickTimeStamp: number

  constructor(sceneName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    super()

    this.renderer = renderer
    this.camera = camera
    this.sceneData = sceneBackgrounds[sceneName]

    const bgDistance = -1
    const vFOV = THREE.MathUtils.degToRad(cameraData.fieldOfView * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(bgDistance)
    const width = height * ASPECT
    const fullScreenGeom = new THREE.PlaneGeometry(width, height)

    this.mousePos = new THREE.Vector2()
    this.pickedColor = new THREE.Color(0, 0, 0)
    this.timeOffset = 0

    if (this.sceneData.mask) {
      // create scene with mask for the FBO to render
      const bg_mask_mat = new THREE.MeshBasicMaterial({
        map: _textures[this.sceneData.mask],
        transparent: true,
      })
      this.bgMaskMesh = new THREE.Mesh(fullScreenGeom, bg_mask_mat)
      this.bgMaskMesh.position.set(0, 0, bgDistance)
      this.fbo_scene = new THREE.Scene()
      this.fbo_scene.add(this.bgMaskMesh)

      this.fbo = new THREE.WebGLRenderTarget(
        WIDTH, HEIGHT,
        {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        }
      )
    }

    this.maskShader = new ShaderMaterial("BAR_MASK", {
      transparent: true,
      depthTest: false,
      alphaTest: 0.5,
    })

    this.maskShader.setUniformValue('uTime', 0.0)
    this.maskShader.setUniformValue('uPickedColor', this.pickedColor)
    this.maskShader.setUniformValue('uExcludedColor', new THREE.Color(0, 0, 0))
    this.maskShader.setUniformValue('uClickable', this.isClickable)
    this.maskShader.setUniformValue('uSamples', 3)
    this.maskShader.setUniformValue('uHighlightColor', new THREE.Color('#ffcf40'))
    this.maskShader.setUniformValue('uHighlightOpacity', 0.4)
    this.maskShader.setUniformValue('uMask', _textures[this.sceneData.mask])
    this.maskShader.setUniformValue('uTexture', _textures[this.sceneData.background])
    this.maskShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))

    this.maskOverlay = new THREE.Mesh(fullScreenGeom, this.maskShader)
    this.maskOverlay.position.set(0, 0, bgDistance)
    this.maskOverlay.name = 'bg'
    this.add(this.maskOverlay)

    if (this.sceneData.mask) {
      document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
      document.addEventListener('click', this.onMouseClick.bind(this), false);
    }

    window.addEventListener('resize', this.onResize, false)
  }

  public dispose() {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.removeEventListener('click', this.onMouseClick.bind(this), false);

    window.removeEventListener('resize', this.onResize, false)
  }

  public render(elapsedTime: number, enabled: boolean = true) {
    if (!this.sceneData.items) return

    if (this.renderer && enabled) {
      if (this.timeOffset === 0) {
        // always start rendering scene with a glow (4 seconds delay)
        this.timeOffset = (elapsedTime % 4.0) + 1.0;
      }
      this.maskShader.setUniformValue("uTime", elapsedTime - this.timeOffset)

      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();
      this.renderer.render(this.fbo_scene, this.camera)
      this.renderer.setRenderTarget(null);

      const read = new Float32Array(4);
      this.renderer.readRenderTargetPixels(this.fbo, this.mousePos.x, this.mousePos.y, 1, 1, read);
      if (this.isClickable) {
        this.pickColor(read[0], read[1], read[2])
      }
    } else {
      this.timeOffset = 0
      this.pickColor(0, 0, 0)
    }
  }

  pickColor(r: number, g: number, b: number) {
    if (!this.sceneData.items) return
    if (Date.now() - this.lastClickTimeStamp < SCENE_CHANGE_ANIMATION_DURATION * 1.2) return
    const newColor = new THREE.Color(r, g, b)
    if (!this.pickedColor.equals(newColor)) {
      this.pickedColor.copy(newColor)
      this.changeMouseCursor(!this.pickedColor.equals(new THREE.Color(0, 0, 0)) && this.isClickable)
      this.maskShader.setUniformValue('uPickedColor', this.pickedColor)
      this.pickedItem = this.sceneData.items?.find(item => item.color == this.pickedColor.getHexString())
      emitter.emit('hover_scene', this.pickedItem?.description)
    }
  }

  changeMouseCursor(clickable: boolean) {
    if (clickable) {
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'default'
    }
  }

  onResize() {
    this.maskShader?.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))
  }

  // get mouse position over the canvas for bar interaction
  onMouseMove(event: MouseEvent) {
    if (!this.sceneData.items) return

    event.preventDefault();

    const domElement = this.renderer?.domElement
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    const isHoveringBarMenu = (domElement && elements[0] === domElement)

    if (isHoveringBarMenu) {
      var rect = domElement.getBoundingClientRect();
      let x = (event.clientX - rect.left) / rect.width
      let y = (event.clientY - rect.top) / rect.height
      x = (clamp(x, 0, 1) * WIDTH)
      y = HEIGHT - (clamp(y, 0, 1) * HEIGHT)

      // apply bg animation scale, from the center of the screen
      const scale = this.maskOverlay.parent.scale.x
      x = Math.floor((WIDTH / 2) + (x - WIDTH / 2) / scale)
      y = Math.floor((HEIGHT / 2) + (y - HEIGHT / 2) / scale)

      this.mousePos.set(x, y)

      return
    }

    // element not found our blocked
    this.mousePos.set(0, 0)
  }

  onMouseClick(event: PointerEvent) {
    if (!this.sceneData.items) return
    
    event.preventDefault();
    if (!this.pickedColor.equals(new THREE.Color(0, 0, 0))) {
      emitter.emit('scene_click', this.pickedItem?.name)
      this.pickColor(0, 0, 0)
      this.lastClickTimeStamp = Date.now()
    } else {
      emitter.emit('scene_click', null)
    }
  }

  public toggleBlur(shouldBlur: boolean) {
    new TWEEN.Tween({ value: shouldBlur ? 3 : 20 })
      .to({ value: shouldBlur ? 20 : 3 }, 400)
      .easing(TWEEN.Easing.Quartic.Out)
      .onUpdate((obj) => {
        this.maskShader.setUniformValue('uSamples', obj.value);
      })
      .start();
  }

  public zoomIn(x: number, y: number) {
    new TWEEN.Tween(this.maskOverlay.position)
      .to({ x: x, y: y, z: this.maskOverlay.position.z }, 400)
      .easing(TWEEN.Easing.Quartic.Out)
      .start();

    new TWEEN.Tween(this.maskOverlay.scale)
      .to({ x: 1.5, y: 1.5, z: 1.5 }, 400)
      .easing(TWEEN.Easing.Quartic.Out)
      .start();
  }

  public reset() {
    this.toggleBlur(false)
    this.setClickable(true)

    new TWEEN.Tween(this.maskOverlay.position)
      .to({ x: 0, y: 0, z: this.maskOverlay.position.z }, 400)
      .easing(TWEEN.Easing.Quartic.Out)
      .start();

    new TWEEN.Tween(this.maskOverlay.scale)
      .to({ x: 1, y: 1, z: 1 }, 400)
      .easing(TWEEN.Easing.Quartic.Out)
      .start();
  }

  public setClickable(isClickable: boolean) {
    this.isClickable = isClickable
    this.maskShader.setUniformValue('uClickable', isClickable)
    if (!isClickable) {
      this.pickColor(0, 0, 0)
    }
  }

  public canClick() {
    return this.isClickable
  }

  public excludeItem(item?: SceneObject) {
    console.log(item)
    this.maskShader.setUniformValue('uExcludedColor', item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0))
  }

}

