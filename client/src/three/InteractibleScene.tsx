import * as THREE from 'three'
import { clamp } from '@underware_gg/pistols-sdk/utils'
import {
  WIDTH, HEIGHT,
  _textures,
  _currentScene,
  emitter,
  ASPECT,
  cameraData,
  sizes,
  SCENE_CHANGE_ANIMATION_DURATION,
} from './game';
import { sceneBackgrounds, SceneData, SceneObject } from '/src/data/assets';
import { ShaderMaterial } from './shaders'
import TWEEN from '@tweenjs/tween.js'

export class InteractibleScene extends THREE.Scene {

  sceneData: SceneData

  maskOverlay: THREE.Mesh
  maskShader: ShaderMaterial

  fbo_mask: THREE.WebGLRenderTarget
  fbo_mask_scene: THREE.Scene
  fbo_background: THREE.WebGLRenderTarget
  fbo_background_scenes: THREE.Scene[] = []
  renderer: THREE.WebGLRenderer
  camera: THREE.Camera

  mousePos: THREE.Vector2
  mouseScreenPos: THREE.Vector2 // Normalized -1 to 1 screen coordinates
  pickedColor: THREE.Color
  pickedItem: SceneObject
  timeOffset: number
  isClickable: boolean = true

  lastClickTimeStamp: number

  constructor(sceneName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    super()

    this.renderer = renderer
    this.camera = camera

    this.setSceneData(sceneName)
  }

  public setSceneData(sceneName: string) {
    this.dispose()

    this.sceneData = sceneBackgrounds[sceneName]

    const bgDistance = -1
    const vFOV = THREE.MathUtils.degToRad(cameraData.fieldOfView * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(bgDistance)
    const width = height * ASPECT
    const fullScreenGeom = new THREE.PlaneGeometry(width, height)

    this.mousePos = new THREE.Vector2()
    this.mouseScreenPos = new THREE.Vector2()
    this.pickedColor = new THREE.Color(0, 0, 0)
    this.timeOffset = 0

    if (this.sceneData.backgrounds && this.sceneData.backgrounds.length > 0) {

      this.sceneData.backgrounds.forEach((background, index) => {
        const geometry = new THREE.PlaneGeometry(width, height)
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          map: _textures[background.texture]
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(0, 0, bgDistance)

        this.fbo_background_scenes[index] = new THREE.Scene();
        this.fbo_background_scenes[index].add(mesh)
      })

      this.fbo_background = new THREE.WebGLRenderTarget(
        WIDTH, HEIGHT,
        {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        }
      );
    }

    if (this.sceneData.items && this.sceneData.items.length > 0) {
      
      this.fbo_mask_scene = new THREE.Scene()

      this.sceneData.items.forEach(item => {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({
            transparent: true,
            map: _textures[item.mask]
          })
        )
        mesh.position.set(0, 0, bgDistance)
        this.fbo_mask_scene.add(mesh)
      })

      this.fbo_mask = new THREE.WebGLRenderTarget(
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
    this.maskShader.setUniformValue('uSamples', 1)
    this.maskShader.setUniformValue('uShiftAmount', 0.0)
    this.maskShader.setUniformValue('uTextureShift0', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift1', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift2', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift3', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift4', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uHighlightColor', new THREE.Color('#ffcf40'))
    this.maskShader.setUniformValue('uHighlightOpacity', 0.4)
    this.maskShader.setUniformValue('uMasksSize', this.sceneData.items?.length || 0)
    this.maskShader.setUniformValue('uMasks', this.sceneData.items?.map(item => _textures[item.mask]) || [])
    this.maskShader.setUniformValue('uMasksRenderOrder', this.sceneData.items?.map(item => item.renderOrder) || [])
    this.maskShader.setUniformValue('uTexturesSize', this.sceneData.backgrounds?.length || 0)
    this.maskShader.setUniformValue('uTextures', this.sceneData.backgrounds.map(background => _textures[background.texture]))
    this.maskShader.setUniformValue('uTexturesRenderOrder', this.sceneData.backgrounds.map(background => background.renderOrder))
    this.maskShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))

    this.maskOverlay = new THREE.Mesh(fullScreenGeom, this.maskShader)
    this.maskOverlay.position.set(0, 0, bgDistance)
    this.maskOverlay.name = 'bg'
    this.add(this.maskOverlay)

    if (this.sceneData.items && this.sceneData.items.length > 0) {
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

    this.calculateTextureShifts()

    if (this.renderer && enabled) {
      if (this.timeOffset === 0) {
        // always start rendering scene with a glow (4 seconds delay)
        this.timeOffset = (elapsedTime % 4.0) + 1.0;
      }
      this.maskShader.setUniformValue("uTime", elapsedTime - this.timeOffset)

      // Apply position offsets to the mask meshes in the fbo_mask_scene before rendering
      if (this.sceneData.items) {
          this.sceneData.items.forEach((item, index) => {
              const background = this.sceneData.backgrounds.find(background => background.renderOrder === item.renderOrder);
              if (background) {
                  const mesh = this.fbo_mask_scene.children[index] as THREE.Mesh
                  const offsetX = (this.mouseScreenPos.x * -background.shiftMultiplier * 2) * ((mesh.geometry as THREE.PlaneGeometry).parameters.width || 1) * 0.5;
                  const offsetY = (this.mouseScreenPos.y * -background.shiftMultiplier * 2) * ((mesh.geometry as THREE.PlaneGeometry).parameters.height || 1) * 0.5;
                  mesh.position.set(offsetX, offsetY, mesh.position.z)
              }
          });
      }

      // Render mask scene
      this.renderer.setRenderTarget(this.fbo_mask);
      this.renderer.clear();
      this.renderer.render(this.fbo_mask_scene, this.camera);

      const maskRead = new Float32Array(4);
      this.renderer.readRenderTargetPixels(this.fbo_mask, this.mousePos.x, this.mousePos.y, 1, 1, maskRead);

      this.checkRenderOrders(maskRead);
    } else {
      this.timeOffset = 0
      this.pickColor(0, 0, 0)
    }
  }

  private checkRenderOrders(maskRead: Float32Array) {
    const maskColor = new THREE.Color(maskRead[0], maskRead[1], maskRead[2]);
    let hasFoundOverlap = false;

    const hitMask = this.sceneData.items?.find(item => item.color == maskColor.getHexString())
    
    if (hitMask) {
    // Render background scenes
    this.renderer.setRenderTarget(this.fbo_background);
    this.sceneData.backgrounds.forEach((background, index) => {
        if (background.renderOrder < hitMask.renderOrder) {
          this.renderer.clear();
          this.renderer.render(this.fbo_background_scenes[index], this.camera);

          // Read pixel data and check alpha values
          const bgRead = new Float32Array(4);
          this.renderer.readRenderTargetPixels(this.fbo_background, this.mousePos.x, this.mousePos.y, 1, 1, bgRead);
          
          if (bgRead[3] > 0) {
            hasFoundOverlap = true;
          }
        }
      });
    }

    this.renderer.setRenderTarget(null);

    if (this.isClickable) {
      if (!hasFoundOverlap) {
        this.pickColor(maskRead[0], maskRead[1], maskRead[2]);
      } else {
        this.pickColor(0, 0, 0)
      }
    }
  }

  pickColor(r: number, g: number, b: number) {
    if (!this.sceneData.items) return
    if (Date.now() - this.lastClickTimeStamp < SCENE_CHANGE_ANIMATION_DURATION * 1.5) return
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

      // Calculate normalized screen coordinates (-1 to 1)
      const screenX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const screenY = -((event.clientY - rect.top) / rect.height) * 2 + 1
      this.mouseScreenPos.set(screenX, screenY)

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

  private calculateTextureShifts() {
    this.sceneData.backgrounds.forEach((background, index) => {
      this.maskShader.setUniformValue(`uTextureShift${index}`, this.mouseScreenPos.clone().multiplyScalar(background.shiftMultiplier))
    })
  }

  public toggleBlur(shouldBlur: boolean) {
    new TWEEN.Tween({ value: shouldBlur ? 1 : 20 })
      .to({ value: shouldBlur ? 20 : 1 }, 400)
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

  public shiftImage(isLeft: boolean) {
    this.setClickable(false);
    
    const shiftAmount = { value: 0 };
    new TWEEN.Tween(shiftAmount)
      .to({ value: isLeft ? 1 : -1 }, 1200)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onStart(() => {
        this.setClickable(false);
      })
      .onUpdate((obj) => {
        this.maskShader.setUniformValue('uShiftAmount', obj.value);
      })
      .onComplete(() => {
        this.maskShader.setUniformValue('uShiftAmount', 0.0);
        this.setClickable(true);
      })
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
    this.maskShader.setUniformValue('uExcludedColor', item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0))
  }

}
