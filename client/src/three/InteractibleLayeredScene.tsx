import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { clamp } from '@underware/pistols-sdk/utils'
import {
  WIDTH, HEIGHT,
  _textures,
  _currentScene,
  emitter,
  ASPECT,
  sizes,
  SCENE_CHANGE_ANIMATION_DURATION,
  cameraDataStatic,
} from './game';
import { sceneBackgrounds } from '/src/data/assets';
import { SceneData, SceneObject, TextureName, TextureState, AnimatedLayer, SceneBackgroundObject } from '/src/data/assetsTypes';
import { ShaderManager, ShaderMaterial } from './shaders'
import TWEEN from '@tweenjs/tween.js'

class BackgroundLayer {
  background: SceneBackgroundObject
  masks: SceneObject[]
  scaleAddon: number

  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.Camera
  
  maskScene: THREE.Scene
  fbo_background: THREE.WebGLRenderTarget
  fbo_scene: THREE.Scene

  backgroundMesh: THREE.Mesh
  backgroundShader: ShaderMaterial
  maskMeshes: THREE.Mesh[] = []
  fboMesh: THREE.Mesh

  currentTexture: THREE.Texture
  
  opacity: number = 1.0
  opacityTween: any

  currentSamples: number = 0
  samplesTween: any

  currentDarkStrength: number = 0.0
  darkStrengthTween: any
  
  pickedColor: THREE.Color = new THREE.Color(0, 0, 0)

  animatedData: AnimatedLayer = null

  currentRandomValue: number = 0
  targetRandomValue: number = 0
  nextTargetRandomValue: number = 0

  layerShiftAmount: THREE.Vector2 = new THREE.Vector2(0.0, 0.0)
  animatedLayerShiftAmount: THREE.Vector2 = new THREE.Vector2(0.0, 0.0)

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.Camera, fbo_background: THREE.WebGLRenderTarget, maskScene: THREE.Scene, background: SceneBackgroundObject, masks: SceneObject[], width: number, height: number, bgDistance: number, scaleAddon: number = 0) {
    this.scene = scene
    this.renderer = renderer
    this.camera = camera
    this.fbo_background = fbo_background
    this.maskScene = maskScene
    this.fbo_scene = new THREE.Scene()

    this.background = background
    this.masks = masks
    this.scaleAddon = scaleAddon

    this.opacity = background.hidden ? 0.0 : 1.0
    
    const fullScreenGeom = new THREE.PlaneGeometry(width, height)

    this.backgroundShader = new ShaderMaterial("INTERACTIBLE_TEXTURE", {
      transparent: true,
      depthTest: false,
      alphaTest: 0.5,
    })

    // this.resetRandomInterpolation()
    console.log(this.masks)

    this.backgroundShader.setUniformValue('uTime', 0.0)
    this.backgroundShader.setUniformValue('uClickable', true)
    this.backgroundShader.setUniformValue('uHiddenOpacity', this.opacity)
    this.backgroundShader.setUniformValue('uOpaque', background.opaque || false)
    this.backgroundShader.setUniformValue('uSamples', this.currentSamples)
    this.backgroundShader.setUniformValue('uDarkStrength', this.currentDarkStrength)
    this.backgroundShader.setUniformValue('uShiftAmount', this.layerShiftAmount)
    this.backgroundShader.setUniformValue('uPickedColor', this.pickedColor)
    this.backgroundShader.setUniformValue('uExcludedColor', new THREE.Color(0, 0, 0))
    this.backgroundShader.setUniformValue('uHighlightColor', new THREE.Color('#eeb4ff'))
    this.backgroundShader.setUniformValue('uHighlightOpacityShimmer', 0.8)
    this.backgroundShader.setUniformValue('uHighlightOpacitySelected', 0.4)
    this.backgroundShader.setUniformValue('uMasksSize', this.masks?.length || 0)
    this.backgroundShader.setUniformValue('uMasks', this.masks?.map(item => _textures[item.mask]) || [])
    this.backgroundShader.setUniformValue('uTexture', _textures[background.texture])
    this.backgroundShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))

    this.backgroundMesh = new THREE.Mesh(fullScreenGeom, this.backgroundShader)
    this.backgroundMesh.position.set(0, 0, bgDistance + this.background.renderOrder * 0.0001)
    if (this.scaleAddon) {
      this.backgroundMesh.scale.set(1 + this.scaleAddon, 1 + this.scaleAddon, 1)
    }
    this.backgroundMesh.name = this.background.texture
    this.fboMesh = this.backgroundMesh.clone()
    
    this.scene.add(this.backgroundMesh)
    this.fbo_scene.add(this.fboMesh)

    if (this.background.isAnimated && this.background.states) {
      this.initializeAnimation()
    }

    this.masks.forEach(item => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          transparent: true,
          map: _textures[item.mask]
        })
      )
      mesh.position.set(0, 0, bgDistance + this.background.renderOrder * 0.0001)
      if (this.scaleAddon) {
        mesh.scale.set(1 + this.scaleAddon, 1 + this.scaleAddon, 1)
      }
      this.maskScene.add(mesh)
      this.maskMeshes.push(mesh)
    })
  }

  public render(elapsedTime: number, mouseScreenPos: THREE.Vector2, progress: number, smoothProgress: number) {
    this.backgroundShader.setUniformValue('uTime', elapsedTime)

    this.updatePositions(mouseScreenPos, progress, smoothProgress)
    
    if (this.background.isAnimated && this.animatedData) {
      this.updateAnimation(elapsedTime)
    }
  }

  public checkOverlap(hitMask: SceneObject, mousePos: THREE.Vector2): boolean {
    if (this.background.renderOrder > hitMask.renderOrder && !this.background.opaque) {
      this.renderer.clear();
      this.renderer.render(this.fbo_scene, this.camera);

      const bgRead = new Float32Array(4);
      this.renderer.readRenderTargetPixels(this.fbo_background, mousePos.x, mousePos.y, 1, 1, bgRead);
      
      if (bgRead[3] > 0.001) {
        return true;
      }
    }

    return false;
  }

  private updatePositions(mouseScreenPos: THREE.Vector2, progress: number, smoothProgress: number) {
    this.updateRandomInterpolation(progress, smoothProgress)

    if (this.background.animateShift?.enabled) {
      this.animatedLayerShiftAmount.x += (this.background.animateShift.isLeft ? -1 : 1) * this.background.animateShift.speed;
    } else {
      const aspectRatio = 1920/1080;
      const screenSize = Math.min(window.innerWidth, window.innerHeight);
      const width = screenSize * aspectRatio;
      const height = screenSize;
      const scaledMousePos = mouseScreenPos.clone();
      scaledMousePos.x *= width/window.innerWidth;
      scaledMousePos.y *= height/window.innerHeight;
      const textureShift = scaledMousePos.clone().multiplyScalar(this.background.shiftMultiplier);
      
      scaledMousePos.multiplyScalar(-this.background.shiftMultiplier * 2);
      const offsetX = scaledMousePos.x * ((this.backgroundMesh.geometry as THREE.PlaneGeometry).parameters.width || 1) * 0.5;
      const offsetY = scaledMousePos.y * ((this.backgroundMesh.geometry as THREE.PlaneGeometry).parameters.height || 1) * 0.5;
      
      this.layerShiftAmount.set(offsetX + this.currentRandomValue, offsetY + this.currentRandomValue)
      emitter.emit(`texture_shift_${this.background.renderOrder}`, textureShift);
    }
    this.backgroundShader.setUniformValue('uShiftAmount', this.animatedLayerShiftAmount)
    
    this.backgroundMesh.position.set(this.layerShiftAmount.x, this.layerShiftAmount.y, this.backgroundMesh.position.z)
    this.fboMesh.position.set(this.layerShiftAmount.x, this.layerShiftAmount.y, this.fboMesh.position.z)
    this.maskMeshes.forEach(mask => {
      mask.position.set(this.layerShiftAmount.x, this.layerShiftAmount.y, mask.position.z)
    })
  }

  private updateRandomInterpolation(progress: number, smoothProgress: number) {
    if (this.background.animatedIdle) {
      this.currentRandomValue = this.targetRandomValue * (1 - smoothProgress) + 
                              this.nextTargetRandomValue * smoothProgress
                              
      if (progress >= 1) {
        this.targetRandomValue = this.nextTargetRandomValue
        this.nextTargetRandomValue = Math.random() * this.background.animatedIdle
      }
    }
  }

  public setOpacity(opacity: number, duration: number = 400) {
    if (this.opacityTween) {
      this.opacityTween.stop();
    }
    
    this.opacityTween = new TWEEN.Tween({ value: this.opacity })
      .to({ value: opacity }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        this.opacity = obj.value;
        this.backgroundShader.setUniformValue('uHiddenOpacity', this.opacity);
      })
      .start();
  }

  public setDarkStrength(strength: number, duration: number = 400) {
    if (this.darkStrengthTween) {
      this.darkStrengthTween.stop();
    }
    
    this.darkStrengthTween = new TWEEN.Tween({ value: this.currentDarkStrength })
      .to({ value: strength }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        this.currentDarkStrength = obj.value;
        this.backgroundShader.setUniformValue('uDarkStrength', this.currentDarkStrength);
      })
      .start();
  }

  public setSamples(samples: number, duration: number = 400) {
    if (this.samplesTween) {
      this.samplesTween.stop();
    }
    
    this.samplesTween = new TWEEN.Tween({ value: this.currentSamples })
      .to({ value: samples }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        this.currentSamples = Math.round(obj.value);
        this.backgroundShader.setUniformValue('uSamples', this.currentSamples);
      })
      .start();
  }

  public setExcludedColor(color: THREE.Color) {
    this.backgroundShader.setUniformValue('uExcludedColor', color);
  }

  public setPickedColor(color: THREE.Color) {
    this.pickedColor = color;
    this.backgroundShader.setUniformValue('uPickedColor', this.pickedColor);
  }

  public setClickable(clickable: boolean) {
    this.backgroundShader.setUniformValue('uClickable', clickable);
  }

  public resize() {
    this.backgroundShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))
  }

  public shiftImage(isLeft: boolean, duration: number = 1200) {
    new TWEEN.Tween({ value: 0 })
      .to({ value: isLeft ? 1 : -1 }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onStart(() => {
        this.setClickable(false);
      })
      .onUpdate((obj) => {
        this.animatedLayerShiftAmount.x += obj.value;
        this.backgroundShader.setUniformValue('uShiftAmount', this.animatedLayerShiftAmount)
      })
      .onComplete(() => {
        this.backgroundShader.setUniformValue('uShiftAmount', 0.0);
      })
      .start();
  }

  private initializeAnimation() {
    if (!this.background.states || !this.background.isAnimated) return
    
    const initialState = this.background.states[0]
    const nextTexture = this.getNextTexture(initialState)
    
    this.animatedData = {
      currentState: initialState,
      nextTexture,
      currentDuration: this.calculateDuration(initialState),
      startTime: 0
    }

    this.currentTexture = _textures[initialState.texture]
    this.backgroundShader.setUniformValue('uTexture', this.currentTexture)
  }
  
  private getNextTexture(currentState: TextureState): TextureName {
    if (!currentState.nextTextures?.length) return currentState.texture
    
    if (currentState.transitionProbabilities) {
      const total = currentState.transitionProbabilities.reduce((a, b) => a + b, 0)
      let random = Math.random() * total
      for (let i = 0; i < currentState.nextTextures.length; i++) {
        random -= currentState.transitionProbabilities[i]
        if (random <= 0) return currentState.nextTextures[i]
      }
    }
    
    return currentState.nextTextures[Math.floor(Math.random() * currentState.nextTextures.length)]
  }
  
  private calculateDuration(state: TextureState): number {
    const normalRandom = () => {
      let u = 0, v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }

    const range = state.maxDuration - state.minDuration
    const stdDev = range / 4
    
    let duration = state.baseDuration + (normalRandom() * stdDev)
    duration = Math.max(state.minDuration, Math.min(state.maxDuration, duration))
    
    return duration
  }
  
  private updateAnimation(deltaTime: number) {
    if (!this.animatedData) return
    
    if (deltaTime - this.animatedData.startTime >= this.animatedData.currentDuration) {
      const nextState = this.background.states?.find(
        state => state.texture === this.animatedData.nextTexture
      )
      
      if (nextState) {
        this.animatedData.currentState = nextState
        this.animatedData.nextTexture = this.getNextTexture(nextState)
        this.animatedData.currentDuration = this.calculateDuration(nextState)
        this.animatedData.startTime = deltaTime

        this.currentTexture = _textures[nextState.texture]
        this.backgroundShader.setUniformValue('uTexture', this.currentTexture)
      }
    }
  }

  public dispose() {
    // Stop any active tweens
    if (this.opacityTween) {
      this.opacityTween.stop();
      this.opacityTween = null;
    }
    
    if (this.samplesTween) {
      this.samplesTween.stop();
      this.samplesTween = null;
    }
    
    if (this.darkStrengthTween) {
      this.darkStrengthTween.stop();
      this.darkStrengthTween = null;
    }
    
    // Remove the mesh from the scene if it exists
    if (this.backgroundMesh && this.scene) {
      this.scene.remove(this.backgroundMesh);
      this.backgroundMesh.geometry.dispose();
      this.backgroundMesh = null;
    }

    this.backgroundShader?.dispose();
    this.backgroundShader = null;
    this.fbo_scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
            child.material.dispose();
        }
      }
    });
    this.fbo_scene = null;

    this.maskMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.maskMeshes = [];
  }
}

export class InteractibleLayeredScene extends THREE.Scene {

  sceneData: SceneData

  fbo_background: THREE.WebGLRenderTarget
  fbo_blur_background: THREE.WebGLRenderTarget
  fbo_mask: THREE.WebGLRenderTarget
  fbo_mask_scene: THREE.Scene

  backgroundLayers: BackgroundLayer[] = []

  renderer: THREE.WebGLRenderer
  camera: THREE.Camera

  mousePos: THREE.Vector2
  mouseScreenPos: THREE.Vector2 // Normalized -1 to 1 screen coordinates
  
  pickedColor: THREE.Color
  pickedItem: SceneObject
  
  timeOffset: number
  isClickable: boolean = true

  lastClickTimeStamp: number
  private randomInterpolationProgress: number = 0
  private readonly RANDOM_INTERPOLATION_SPEED = 0.01

  composer: EffectComposer
  blurPass: ShaderPass
  
  constructor(sceneName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    super()

    this.renderer = renderer
    this.camera = camera

    this.composer = new EffectComposer(renderer);

    this.blurPass = new ShaderPass({
      uniforms: { 
        uResolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
        uExcludedColor: { value: new THREE.Color(0, 0, 0) },
        uSamples: { value: 0 },
        uMask: { value: null },
        uTexture: { value: null },
        
       },
      vertexShader: ShaderManager.shaderCode['TEXTURE_BLUR'].vsh,
      fragmentShader: ShaderManager.shaderCode['TEXTURE_BLUR'].fsh,
    });
    
    this.composer.addPass(this.blurPass);

    this.setSceneData(sceneName)

    emitter.on('hasModalOpen', (data) => {
      this.setClickable(!data)
    })
  }

  public setSceneData(sceneName: string) {
    this.dispose()

    this.sceneData = sceneBackgrounds[sceneName]

    if (!this.sceneData.backgrounds) return

    const bgDistance = -1
    const vFOV = THREE.MathUtils.degToRad(cameraDataStatic.fieldOfView * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(bgDistance)
    const width = height * ASPECT

    this.mousePos = new THREE.Vector2()
    this.mouseScreenPos = new THREE.Vector2()
    this.pickedColor = new THREE.Color(0, 0, 0)
    this.timeOffset = 0
    this.randomInterpolationProgress = 0

    if (this.sceneData.backgrounds && this.sceneData.backgrounds.length > 0) {
      this.fbo_background = new THREE.WebGLRenderTarget(
        WIDTH, HEIGHT,
        {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        }
      );
      this.fbo_blur_background = new THREE.WebGLRenderTarget(
        WIDTH, HEIGHT,
        {
          minFilter: THREE.NearestFilter,
          magFilter: THREE.NearestFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType
        }
      );

      if (this.sceneData.items) {
        this.fbo_mask_scene = new THREE.Scene()
      }

      this.sceneData.backgrounds.forEach((background, index) => {
        const masks = this.sceneData.items?.filter(item => item.renderOrder === background.renderOrder)
        const backgroundLayer = new BackgroundLayer(this, this.renderer, this.camera, this.fbo_background, this.fbo_mask_scene, background, masks, width, height, bgDistance, this.sceneData.scaleAddon)
        this.backgroundLayers.push(backgroundLayer)
      })
    }

    if (this.sceneData.items && this.sceneData.items.length > 0) {
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

    if (this.sceneData.backgrounds && this.sceneData.backgrounds.length > 0) {
      document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    } 
    if (this.sceneData.items && this.sceneData.items.length > 0) {
      document.addEventListener('click', this.onMouseClick.bind(this), false);
    }

    window.addEventListener('resize', this.onResize, false)
  }

  public dispose() {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.removeEventListener('click', this.onMouseClick.bind(this), false);
    window.removeEventListener('resize', this.onResize, false);

    this.backgroundLayers.forEach(layer => layer.dispose())
    this.backgroundLayers = []

    // Dispose of WebGLRenderTargets
    this.fbo_mask?.dispose();
    
    // Dispose of scene objects
    this.fbo_mask_scene?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
                child.material.dispose();
            }
        }
    });

    this.fbo_mask_scene = null;
  }

  public render(elapsedTime: number, enabled: boolean = true) {
    if (!this.isClickable) return
    
    this.randomInterpolationProgress += this.RANDOM_INTERPOLATION_SPEED
    if (this.randomInterpolationProgress >= 1) {
      this.randomInterpolationProgress = 0
    }
    // Use cosine interpolation for smooth transitions
    const smoothProgress = (1 - Math.cos(this.randomInterpolationProgress * Math.PI)) / 2

    if (this.renderer && enabled) {
      if (this.timeOffset === 0) {
        // always start rendering scene with a glow (4 seconds delay)
        this.timeOffset = (elapsedTime % 4.0) + 1.0;
      }
      this.backgroundLayers.forEach(layer => layer.render(elapsedTime - this.timeOffset, this.mouseScreenPos, this.randomInterpolationProgress, smoothProgress))

      // Apply position offsets to the mask meshes in the fbo_mask_scene before rendering
      if (this.sceneData.items) {
        this.renderer.setRenderTarget(this.fbo_mask);
        this.renderer.clear();
        this.renderer.render(this.fbo_mask_scene, this.camera);

        this.renderer.setRenderTarget(this.fbo_blur_background);
        this.renderer.clear();
        this.renderer.render(this, this.camera);

        const maskRead = new Float32Array(4);
        this.renderer.readRenderTargetPixels(this.fbo_mask, this.mousePos.x, this.mousePos.y, 1, 1, maskRead);
        const maskColor = new THREE.Color(maskRead[0], maskRead[1], maskRead[2]);

        const hitMask = this.sceneData.items?.find(item => item.color == maskColor.getHexString())
        let hasFoundOverlap = false

        if (hitMask) {
          this.renderer.setRenderTarget(this.fbo_background);
          hasFoundOverlap = this.backgroundLayers.some(layer => layer.checkOverlap(hitMask, this.mousePos))
        }

        if (this.isClickable) {
          if (!hasFoundOverlap) {
            this.pickColor(maskRead[0], maskRead[1], maskRead[2]);
          } else {
            this.pickColor(0, 0, 0)
          }
        }

        this.blurPass.uniforms.uMask.value = this.fbo_mask.texture;
        this.blurPass.uniforms.uTexture.value = this.fbo_blur_background.texture;

        this.renderer.setRenderTarget(null);
        
        this.composer.render();
      }
    } else {
      this.timeOffset = 0
      this.pickColor(0, 0, 0)
    }
    
  }

  pickColor(r: number, g: number, b: number) {
    if (!this.sceneData.items) return
    if (Date.now() - this.lastClickTimeStamp < SCENE_CHANGE_ANIMATION_DURATION * 1.5) return
    const newColor = new THREE.Color(r, g, b)

    if (!this.pickedColor.equals(newColor)) {
      this.pickedColor.copy(newColor)
      this.changeMouseCursor(!this.pickedColor.equals(new THREE.Color(0, 0, 0)) && this.isClickable)
      this.backgroundLayers.forEach(layer => layer.setPickedColor(this.pickedColor))
      this.pickedItem = this.sceneData.items?.find(item => item.color == this.pickedColor.getHexString())
      emitter.emit('hover_item', this.pickedItem?.name)
      emitter.emit('hover_description', this.pickedItem?.description)
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
    this.backgroundLayers.forEach(layer => layer.resize())
    this.blurPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight); 
  }

  // get mouse position over the canvas for bar interaction
  onMouseMove(event: MouseEvent) {
    event.preventDefault();

    const domElement = this.renderer?.domElement

    var rect = domElement.getBoundingClientRect();
    let x = (event.clientX - rect.left) / rect.width
    let y = (event.clientY - rect.top) / rect.height
    x = (clamp(x, 0, 1) * WIDTH)
    y = HEIGHT - (clamp(y, 0, 1) * HEIGHT)

    // apply bg animation scale, from the center of the screen
    const scale = this.scale.x
    x = Math.floor((WIDTH / 2) + (x - WIDTH / 2) / scale)
    y = Math.floor((HEIGHT / 2) + (y - HEIGHT / 2) / scale)

    this.mousePos.set(x, y)

    // Calculate normalized screen coordinates (-1 to 1)
    const screenX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const screenY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.mouseScreenPos.set(screenX, screenY)
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
    const targetSamples = shouldBlur ? 30 : 0
    const targetDarkStrength = shouldBlur ? 0.8 : 0.0;
    
    this.backgroundLayers.forEach((layer, index) => {
      layer.setSamples(targetSamples, 400)
      layer.setDarkStrength(targetDarkStrength, 400)
    })

    this.blurPass.uniforms.uSamples.value = targetSamples;
  }

  public shiftImage(isLeft: boolean) {
    this.setClickable(false);

    this.backgroundLayers.forEach(layer => layer.shiftImage(isLeft, 1200))
    
    setTimeout(() => {
      this.setClickable(true);
    }, 1200);
  }

  public setClickable(isClickable: boolean) {
    this.isClickable = isClickable
    this.backgroundLayers.forEach(layer => layer.setClickable(isClickable))
    if (!isClickable) {
      this.pickColor(0, 0, 0)
    }
  }

  public canClick() {
    return this.isClickable
  }

  public excludeItem(mask?: TextureName) {
    const item = this.sceneData.items.find(item => item.mask === mask)
    this.backgroundLayers.forEach(layer => layer.setExcludedColor(item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0)))
    this.blurPass.uniforms.uExcludedColor.value.set(item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0));
  }

  public includeItem(mask?: TextureName) {
    this.backgroundLayers.forEach(layer => layer.setExcludedColor(new THREE.Color(0, 0, 0)))
    this.blurPass.uniforms.uExcludedColor.value.set(new THREE.Color(0, 0, 0))
  }

  public hideItem(item: TextureName, instant: boolean = false) {
    const index = this.sceneData.backgrounds.findIndex(background => background.texture === item)
    this.backgroundLayers[index].setOpacity(0, instant ? 0 : 400)
  }

  public showItem(item: TextureName, instant: boolean = false) {
    const index = this.sceneData.backgrounds.findIndex(background => background.texture === item)
    this.backgroundLayers[index].setOpacity(1, instant ? 0 : 400)
  }

}
