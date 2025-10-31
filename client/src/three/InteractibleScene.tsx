import * as THREE from 'three'
import { clamp } from '@underware/pistols-sdk/utils'
import {
  WIDTH, HEIGHT,
  _textures,
  _currentScene,
  emitter,
  ASPECT,
  cameraDataStatic,
  sizes,
  SCENE_CHANGE_ANIMATION_DURATION,
} from './game';
import { sceneBackgrounds } from '/src/data/assets';
import { SceneData, SceneObject, TextureName, TextureState, AnimatedLayer, SceneBackgroundObject } from '/src/data/assetsTypes';
import { ShaderManager, ShaderMaterial } from './shaders'
import TWEEN from '@tweenjs/tween.js'

const _vectorHasChanged = (a: THREE.Vector2, b: THREE.Vector2, f: number = 0.0001) => {
  if (!a || !b) return true;
  // console.log(`_vectorHasChanged`, a.x, b.y, Math.abs(a.x - b.x))
  return (Math.abs(a.x - b.x) > f || Math.abs(a.y - b.y) > f);
}

export class InteractibleScene extends THREE.Scene {

  sceneData: SceneData

  maskOverlay: THREE.Mesh
  maskShader: ShaderMaterial
  
  backgroundScene: THREE.Scene
  backgroundMesh: THREE.Mesh
  backgroundBlurShader: ShaderMaterial

  fbo_mask: THREE.WebGLRenderTarget
  fbo_mask_scene: THREE.Scene
  fbo_blur_background: THREE.WebGLRenderTarget

  renderer: THREE.WebGLRenderer
  camera: THREE.Camera

  mousePos: THREE.Vector2
  mouseScreenPos: THREE.Vector2 // Normalized -1 to 1 screen coordinates
  filteredMouseScreenPos: THREE.Vector2
  mouseFilterStrength: number = 0.1 // Filter strength for mouse movement smoothing
  pickedColor: THREE.Color
  pickedItem: SceneObject
  timeOffset: number
  isSceneClickable: boolean = true
  isModalOpen: boolean = false
  isClickable: boolean = true

  opacityTweens: any[] = []
  currentOpacities: number[] = [1, 1, 1, 1, 1, 1, 1]
  currentSamples: number[] = []
  currentDarkStrength: number = 0.0
  blurTween: any;

  blurEnabled: boolean = true
  sceneShiftEnabled: boolean = true

  lastClickTimeStamp: number
  private currentRandomValues: number[] = []
  private targetRandomValues: number[] = []
  private nextTargetRandomValues: number[] = []
  private randomInterpolationProgress: number = 0
  private readonly RANDOM_INTERPOLATION_SPEED = 0.01
  private animatedShiftValues: number[] = []
  private layerShiftAmounts: number[] = []

  private animatedLayers: Map<number, AnimatedLayer> = new Map();
  private currentTextures: THREE.Texture[] = [];

  private emittedVectors: Map<string, THREE.Vector2> = new Map();

  constructor(sceneName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    super()

    this.renderer = renderer
    this.camera = camera

    this.setSceneData(sceneName)

    emitter.on('hasModalOpen', (data) => {
      this.isModalOpen = data
      this.updateClickable()
    })
  }

  public setSceneData(sceneName: string) {
    this.dispose()
    this.animatedLayers.clear()
    this.currentTextures = [];

    this.sceneData = sceneBackgrounds[sceneName]

    if (!this.sceneData.backgrounds) return

    this.currentTextures = this.sceneData.backgrounds.map(background => _textures[background.texture]);
    this.currentSamples = this.sceneData.backgrounds.map(background => background.blurred ? (background.samples || 0) : 0);
    this.currentDarkStrength = 0.0;

    const bgDistance = -1
    const vFOV = THREE.MathUtils.degToRad(cameraDataStatic.fieldOfView * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(bgDistance)
    const width = height * ASPECT
    const fullScreenGeom = new THREE.PlaneGeometry(width, height)

    this.mousePos = new THREE.Vector2()
    this.mouseScreenPos = new THREE.Vector2()
    this.filteredMouseScreenPos = new THREE.Vector2()
    this.pickedColor = new THREE.Color(0, 0, 0)
    this.timeOffset = 0

    const numBackgrounds = this.sceneData.backgrounds?.length || 0
    this.currentRandomValues = new Array(numBackgrounds).fill(0)
    this.targetRandomValues = new Array(numBackgrounds).fill(0).map((_, i) => {
      const background = this.sceneData.backgrounds[i]
      return Math.random() * (background.animatedIdle || 0)
    })
    this.nextTargetRandomValues = new Array(numBackgrounds).fill(0).map((_, i) => {
      const background = this.sceneData.backgrounds[i]
      return Math.random() * (background.animatedIdle || 0)
    })
    this.animatedShiftValues = new Array(numBackgrounds).fill(0)
    this.layerShiftAmounts = new Array(numBackgrounds).fill(0)

    if (this.sceneData.backgrounds && this.sceneData.backgrounds.length > 0) {
      this.sceneData.backgrounds.forEach((background, index) => {
        if (background.isAnimated) {
          this.initializeAnimationLayer(background, index);
        }
      })

      this.fbo_blur_background = new THREE.WebGLRenderTarget(
        WIDTH, HEIGHT,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
          generateMipmaps: false,
          colorSpace: THREE.SRGBColorSpace,
          depthBuffer: false,
          stencilBuffer: false,
        }
      );
    }

    if (this.sceneData.items && this.sceneData.items.length > 0) {
      this.fbo_mask_scene = new THREE.Scene()

      this.sceneData.backgrounds.forEach(background => {
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new ShaderMaterial("MASK_OCCLUSION", {
            transparent: true,
            depthTest: false,
            alphaTest: 0.5,
          })
        )
        mesh.material.setUniformValue('uTexture', _textures[background.texture])
        mesh.material.setUniformValue('uOpaque', background.opaque)
        mesh.name = `bg_${background.renderOrder}`
        mesh.position.set(0, 0, bgDistance + background.renderOrder * 0.00001)
        
        if (this.sceneData.scaleAddon) {
          mesh.scale.set(1 + this.sceneData.scaleAddon, 1 + this.sceneData.scaleAddon, 1)
        }

        this.fbo_mask_scene.add(mesh)

        this.sceneData.items.forEach(item => {
          if (item.renderOrder === background.renderOrder) {
            const itemMesh = new THREE.Mesh(
              new THREE.PlaneGeometry(width, height),
              new THREE.MeshBasicMaterial({
                transparent: true, 
                map: _textures[item.mask]
              })
            )
            itemMesh.name = `mask_${item.mask}_${background.renderOrder}`
            itemMesh.position.set(0, 0, bgDistance + background.renderOrder * 0.00001)
            
            if (this.sceneData.scaleAddon) {
              itemMesh.scale.set(1 + this.sceneData.scaleAddon, 1 + this.sceneData.scaleAddon, 1)
            }
            
            this.fbo_mask_scene.add(itemMesh)
          }
        })
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

    this.maskShader = new ShaderMaterial("INTERACTIBLE_MASK", {
      transparent: true,
      depthTest: false,
      alphaTest: 0.5,
    })

    this.resetRandomInterpolation()
    this.currentOpacities = this.currentOpacities.map((_, i) => this.sceneData.backgrounds[i] ? (this.sceneData.backgrounds[i].hidden ? 0 : 1) : 1);
    this.opacityTweens = this.opacityTweens.map(tween => {
      tween?.stop();
      return tween;
    });

    this.maskShader.setUniformValue('uTime', 0.0)
    this.maskShader.setUniformValue('uPickedColor', this.pickedColor)
    this.maskShader.setUniformValue('uExcludedColor', new THREE.Color(0, 0, 0))
    this.maskShader.setUniformValue('uHiddenOpacities', this.sceneData.backgrounds.map(background => background.hidden ? 0.0 : 1.0))
    this.maskShader.setUniformValue('uOpaque', this.sceneData.backgrounds.map(background => background.opaque || false))
    this.maskShader.setUniformValue('uClickable', this.isClickable)
    this.maskShader.setUniformValue('uSamples', this.currentSamples)
    this.maskShader.setUniformValue('uDarkStrength', this.currentDarkStrength)
    this.maskShader.setUniformValue('uShiftAmount', 0.0)
    this.maskShader.setUniformValue('uShiftAmountLayer', this.layerShiftAmounts)
    this.maskShader.setUniformValue('uTextureShift0', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift1', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift2', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift3', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift4', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift5', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uTextureShift6', new THREE.Vector2(0.0, 0.0))
    this.maskShader.setUniformValue('uRandomShift0', 0.0)
    this.maskShader.setUniformValue('uRandomShift1', 0.0)
    this.maskShader.setUniformValue('uRandomShift2', 0.0)
    this.maskShader.setUniformValue('uRandomShift3', 0.0)
    this.maskShader.setUniformValue('uRandomShift4', 0.0)
    this.maskShader.setUniformValue('uRandomShift5', 0.0)
    this.maskShader.setUniformValue('uRandomShift6', 0.0)
    this.maskShader.setUniformValue('uHighlightColor', new THREE.Color('#eeb4ff'))
    this.maskShader.setUniformValue('uHighlightOpacityShimmer', 0.8)
    this.maskShader.setUniformValue('uHighlightOpacitySelected', 0.4)
    this.maskShader.setUniformValue('uMasksSize', this.sceneData.items?.length || 0)
    this.maskShader.setUniformValue('uMasks', this.sceneData.items?.map(item => _textures[item.mask]) || [])
    this.maskShader.setUniformValue('uMasksRenderOrder', this.sceneData.items?.map(item => item.renderOrder) || [])
    this.maskShader.setUniformValue('uTexturesSize', this.sceneData.backgrounds?.length || 0)
    this.maskShader.setUniformValue('uTextures', this.currentTextures)
    this.maskShader.setUniformValue('uTexturesRenderOrder', this.sceneData.backgrounds.map(background => background.renderOrder))
    this.maskShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))

    this.maskOverlay = new THREE.Mesh(fullScreenGeom, this.maskShader)
    this.maskOverlay.position.set(0, 0, bgDistance)
    if (this.sceneData.scaleAddon) {
      this.maskOverlay.scale.set(1 + this.sceneData.scaleAddon, 1 + this.sceneData.scaleAddon, 1)
    }
    this.maskOverlay.name = 'bg'
    this.add(this.maskOverlay)

    this.backgroundBlurShader = new ShaderMaterial("TEXTURE_BLUR", {
      transparent: false,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    })

    this.backgroundScene = new THREE.Scene()
    this.backgroundMesh = new THREE.Mesh(fullScreenGeom, this.backgroundBlurShader)
    this.backgroundMesh.position.set(0, 0, bgDistance)
    if (this.sceneData.scaleAddon) {
      this.backgroundMesh.scale.set(1 + this.sceneData.scaleAddon, 1 + this.sceneData.scaleAddon, 1)
    }
    this.backgroundScene.add(this.backgroundMesh)

    this.backgroundBlurShader.setUniformValue('uMask', null)
    this.backgroundBlurShader.setUniformValue('uTexture', null)
    this.backgroundBlurShader.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))
    this.backgroundBlurShader.setUniformValue('uExcludedColor', new THREE.Color(0, 0, 0))
    this.backgroundBlurShader.setUniformValue('uSamples', 0)
  }

  public dispose() {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.removeEventListener('click', this.onMouseClick.bind(this), false);
    window.removeEventListener('resize', this.onResize, false);

    this.fbo_mask?.dispose();
    this.fbo_blur_background?.dispose();
    
    this.fbo_mask_scene?.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
                child.material.dispose();
            }
        }
    });

    this.fbo_mask_scene = null;

    this.maskShader?.dispose();
    this.maskShader = null;
    this.backgroundBlurShader?.dispose();
    this.backgroundBlurShader = null;
    
    // Dispose background scene
    if (this.backgroundScene) {
      this.backgroundScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.backgroundScene = null;
    }
    
    this.backgroundMesh = null;
  }

  public render(elapsedTime: number, enabled: boolean = true) {
    if (this.isClickable && this.sceneShiftEnabled) {
      // Update filtered mouse position continuously
      if (this.mouseScreenPos) {
        this.filteredMouseScreenPos.x += (this.mouseScreenPos.x - this.filteredMouseScreenPos.x) * this.mouseFilterStrength
        this.filteredMouseScreenPos.y += (this.mouseScreenPos.y - this.filteredMouseScreenPos.y) * this.mouseFilterStrength
      }
      
      this.calculateTextureShifts()
      this.updateAnimation(elapsedTime - this.timeOffset)
    }

    if (this.renderer && enabled) {
      if (this.timeOffset === 0) {
        this.timeOffset = (elapsedTime % 4.0) + 1.0;
      }
      this.maskShader.setUniformValue("uTime", elapsedTime - this.timeOffset)

      this.renderer.setRenderTarget(this.fbo_blur_background);
      this.renderer.clear();
      this.renderer.render(this, this.camera);

      this.backgroundBlurShader.setUniformValue('uTexture', this.fbo_blur_background.texture)

      if (this.sceneData.items) {
        this.renderer.setRenderTarget(this.fbo_mask);
        this.renderer.clear();
        this.renderer.render(this.fbo_mask_scene, this.camera);
      }
      this.renderer.setRenderTarget(null);

      this.renderer.render(this.backgroundScene, this.camera);

    } else {
      this.timeOffset = 0
      this.pickColor(0, 0, 0)
    }
  }

  private performColorPick() {
    const maskRead = new Float32Array(4);
    this.renderer.readRenderTargetPixels(this.fbo_mask, this.mousePos.x, this.mousePos.y, 1, 1, maskRead);

    this.checkRenderOrders(maskRead);
  }

  private checkRenderOrders(maskRead: Float32Array) {
    const maskColor = new THREE.Color(maskRead[0], maskRead[1], maskRead[2]);
    const hitMask = this.sceneData.items?.find(item => item.color == maskColor.getHexString())

    if (this.isClickable) {
      if (hitMask) {
        this.pickColor(maskRead[0], maskRead[1], maskRead[2]);
      } else {
        this.pickColor(0, 0, 0)
      }
    }

    this.renderer.setRenderTarget(null);
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
    this.maskShader?.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))
    this.backgroundBlurShader?.setUniformValue('uResolution', new THREE.Vector2(sizes.canvasWidth, sizes.canvasHeight))
  }

  private lastPickTime: number = 0;
  private readonly PICK_INTERVAL = 80;

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
    const scale = this.maskOverlay.parent.scale.x
    x = Math.floor((WIDTH / 2) + (x - WIDTH / 2) / scale)
    y = Math.floor((HEIGHT / 2) + (y - HEIGHT / 2) / scale)

    this.mousePos.set(x, y)

    // Calculate normalized screen coordinates (-1 to 1)
    const screenX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const screenY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.mouseScreenPos.set(screenX, screenY)

    if (this.sceneData.items) {
      const now = performance.now();
      if (now - this.lastPickTime > this.PICK_INTERVAL) {
        this.lastPickTime = now;
        this.performColorPick();
      }
    }
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

  public activate() {
    if (this.sceneData.backgrounds && this.sceneData.backgrounds.length > 0) {
      document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    } 
    if (this.sceneData.items && this.sceneData.items.length > 0) {
      document.addEventListener('click', this.onMouseClick.bind(this), false);
    }
    window.addEventListener('resize', this.onResize, false);
  }

  public deactivate() {
    if (this.renderer) {
      this.renderer.setRenderTarget(null);
      
      if (this.fbo_blur_background) {
        this.renderer.setRenderTarget(this.fbo_blur_background);
        this.renderer.clear();
      }
      
      if (this.fbo_mask) {
        this.renderer.setRenderTarget(this.fbo_mask);
        this.renderer.clear();
      }
      
      this.renderer.setRenderTarget(null);
      this.renderer.clear();
    }
    this.pickColor(0, 0, 0);
    this.pickedItem = null;
    document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.removeEventListener('click', this.onMouseClick.bind(this), false);
    window.removeEventListener('resize', this.onResize, false);
  }

  private resetRandomInterpolation() {
    this.currentRandomValues = new Array(this.sceneData.backgrounds?.length || 0).fill(0)
    this.targetRandomValues = new Array(this.sceneData.backgrounds?.length || 0).fill(0)
    this.nextTargetRandomValues = new Array(this.sceneData.backgrounds?.length || 0).fill(0)
    this.randomInterpolationProgress = 0
    this.animatedShiftValues = new Array(this.sceneData.backgrounds?.length || 0).fill(0)
    this.layerShiftAmounts = new Array(this.sceneData.backgrounds?.length || 0).fill(0)
  }

  private calculateTextureShifts() {
    this.randomInterpolationProgress += this.RANDOM_INTERPOLATION_SPEED
    
    if (this.randomInterpolationProgress >= 1) {
      this.randomInterpolationProgress = 0
      this.targetRandomValues = [...this.nextTargetRandomValues]
      this.nextTargetRandomValues = this.nextTargetRandomValues.map((_, i) => {
        const background = this.sceneData.backgrounds[i]
        return Math.random() * (background.animatedIdle || 0)
      })
    }

    const smoothProgress = (1 - Math.cos(this.randomInterpolationProgress * Math.PI)) / 2

    this.sceneData.backgrounds.forEach((background, index) => {
      if (background.animatedIdle) {
        this.currentRandomValues[index] = this.targetRandomValues[index] * (1 - smoothProgress) + 
                                        this.nextTargetRandomValues[index] * smoothProgress
      } else {
        this.currentRandomValues[index] = 0
      }

      if (background.animateShift?.enabled) {
        this.layerShiftAmounts[index] += (background.animateShift.isLeft ? -1 : 1) * background.animateShift.speed;
        const shiftVector = new THREE.Vector2(this.layerShiftAmounts[index], 0);
        this.maskShader.setUniformValue(`uTextureShift${index}`, shiftVector);
        this.maskShader.setUniformValue(`uRandomShift${index}`, this.currentRandomValues[index]);
        const emit_key = `texture_shift_${index}`;
        if (_vectorHasChanged(this.emittedVectors.get(emit_key), shiftVector)) {
          emitter.emit(emit_key, shiftVector);
          this.emittedVectors.set(emit_key, shiftVector);
        }
      } else {
        const aspectRatio = 1920/1080;
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        const width = screenSize * aspectRatio;
        const height = screenSize;
        const scaledMousePos = this.filteredMouseScreenPos.clone();
        scaledMousePos.x *= width/window.innerWidth;
        scaledMousePos.y *= height/window.innerHeight;
        const textureShift = scaledMousePos.multiplyScalar(background.shiftMultiplier);
        this.maskShader.setUniformValue(`uTextureShift${index}`, textureShift);
        this.maskShader.setUniformValue(`uRandomShift${index}`, this.currentRandomValues[index]);
        const emit_key = `texture_shift_${index}`;
        if (_vectorHasChanged(this.emittedVectors.get(emit_key), textureShift)) {
          emitter.emit(emit_key, textureShift);
          this.emittedVectors.set(emit_key, textureShift);
        }
      }
    })
    
    // Apply position offsets to the mask meshes in the fbo_mask_scene before rendering
    if (this.sceneData.items) {
      this.sceneData.items.forEach((item, index) => {
        const background = this.sceneData.backgrounds.find(background => background.renderOrder === item.renderOrder);
        if (background) {
          const meshes = this.fbo_mask_scene.children.filter(child => child.name === `bg_${background.renderOrder}` || child.name === `mask_${item.mask}_${background.renderOrder}`) as THREE.Mesh[]
          const aspectRatio = 1920/1080;
          const screenSize = Math.min(window.innerWidth, window.innerHeight);
          const width = screenSize * aspectRatio;
          const height = screenSize;
          const scaledMousePos = this.filteredMouseScreenPos.clone();
          scaledMousePos.x *= width/window.innerWidth;
          scaledMousePos.y *= height/window.innerHeight;
          scaledMousePos.multiplyScalar(-background.shiftMultiplier * 2);
          const offsetX = scaledMousePos.x * ((meshes[0].geometry as THREE.PlaneGeometry).parameters.width || 1) * 0.5;
          const offsetY = scaledMousePos.y * ((meshes[0].geometry as THREE.PlaneGeometry).parameters.height || 1) * 0.5;
          meshes.forEach(mesh => {
            mesh.position.set(offsetX, offsetY, mesh.position.z)
          })
        }
      });
    
      this.backgroundBlurShader.setUniformValue('uMask', this.fbo_mask.texture)
    }
    
    this.maskShader.setUniformValue('uShiftAmountLayer', this.layerShiftAmounts);
  }

  public updateSettings(sceneShiftEnabled: boolean, blurEnabled: boolean) {
    this.sceneShiftEnabled = sceneShiftEnabled
    this.blurEnabled = blurEnabled

    this.toggleBlur(false)

    if (!this.sceneShiftEnabled) {
      this.layerShiftAmounts = this.sceneData.backgrounds.map(() => 0);
      this.maskShader.setUniformValue('uShiftAmountLayer', this.layerShiftAmounts);
      
      this.sceneData.backgrounds.forEach((background, index) => {
        this.maskShader.setUniformValue(`uTextureShift${index}`, new THREE.Vector2(0, 0));
        this.maskShader.setUniformValue(`uRandomShift${index}`, 0.0);
      });
      
      if (this.sceneData.items) {
        this.sceneData.items.forEach((item) => {
          const background = this.sceneData.backgrounds.find(bg => bg.renderOrder === item.renderOrder);
          if (background) {
            const meshes = this.fbo_mask_scene.children.filter(
              child => child.name === `bg_${background.renderOrder}` || 
                      child.name === `mask_${item.mask}_${background.renderOrder}`
            ) as THREE.Mesh[];
            
            meshes.forEach(mesh => {
              mesh.position.set(0, 0, mesh.position.z);
            });
          }
        });
      }
    }
  }

  public toggleBlur(shouldBlur: boolean) {
    if (this.blurTween) {
      this.blurTween.stop();
    }
    
    const startSamples = [...this.currentSamples];
    const startDarkStrength = this.currentDarkStrength;
    
    const targetSamples = this.sceneData.backgrounds.map(background => {
      if (shouldBlur && this.blurEnabled) {
        return 30;
      } else {
        return background.blurred ? (background.samples || 0) : 0;
      }
    });
    
    const targetDarkStrength = shouldBlur ? 0.8 : 0.0;
    
    this.blurTween = new TWEEN.Tween({ progress: 0 })
      .to({ progress: 1 }, 600)
      .easing(TWEEN.Easing.Quartic.Out)
      .onUpdate((obj) => {
        this.currentSamples = startSamples.map((startValue, index) => {
          const targetValue = targetSamples[index];
          return Math.round(startValue + (targetValue - startValue) * obj.progress);
        });
        
        this.currentDarkStrength = startDarkStrength + (targetDarkStrength - startDarkStrength) * obj.progress;
        
        this.maskShader.setUniformValue('uSamples', this.currentSamples);
        this.maskShader.setUniformValue('uDarkStrength', this.currentDarkStrength);

        this.backgroundBlurShader.setUniformValue('uSamples', this.currentSamples[0]);

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

  public shiftImage(isLeft: boolean, duration: number = 1200) {
    this.setClickable(false);
    
    const shiftAmount = { value: 0 };
    new TWEEN.Tween(shiftAmount)
      .to({ value: isLeft ? 1 : -1 }, duration)
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
    this.isSceneClickable = isClickable
    this.updateClickable()
  }

  public updateClickable() {
    this.isClickable = this.isSceneClickable && !this.isModalOpen
    this.maskShader.setUniformValue('uClickable', this.isClickable)
    if (!this.isClickable) {
      this.pickColor(0, 0, 0)
    }
  }

  public canClick() {
    return this.isClickable
  }

  public excludeItem(mask?: TextureName) {
    const item = this.sceneData.items.find(item => item.mask === mask)
    this.maskShader.setUniformValue('uExcludedColor', item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0))
    this.backgroundBlurShader.setUniformValue('uExcludedColor', item ? new THREE.Color('#' + item.color) : new THREE.Color(0, 0, 0))
  }

  public includeItem(mask?: TextureName) {
    const item = this.sceneData.items.find(item => item.mask === mask)
    this.maskShader.setUniformValue('uExcludedColor', item ? new THREE.Color(0, 0, 0) : new THREE.Color(0, 0, 0))
    this.backgroundBlurShader.setUniformValue('uExcludedColor', new THREE.Color(0, 0, 0))
  }

  public hideItem(item: TextureName, instant: boolean = false) {
    const index = this.sceneData.backgrounds.findIndex(background => background.texture === item)
    this.opacityTweens[index]?.stop()
    this.opacityTweens[index] = new TWEEN.Tween({ value: this.currentOpacities[index] })
      .to({ value: 0 }, instant ? 0 : 400)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        this.currentOpacities[index] = obj.value
        this.maskShader.setUniformValue('uHiddenOpacities', this.currentOpacities);
      })
      .start();
  }

  public hideItemInstantly(item: TextureName) {
    const index = this.sceneData.backgrounds.findIndex(background => background.texture === item)
    this.currentOpacities[index] = 0
    this.maskShader.setUniformValue('uHiddenOpacities', this.currentOpacities);
  }

  public showItem(item: TextureName, instant: boolean = false) {
    const index = this.sceneData.backgrounds.findIndex(background => background.texture === item)

    this.opacityTweens[index]?.stop()
    this.opacityTweens[index] = new TWEEN.Tween({ value: this.currentOpacities[index] })
      .to({ value: 1 }, instant ? 0 : 400)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        this.currentOpacities[index] = obj.value
        this.maskShader.setUniformValue('uHiddenOpacities', this.currentOpacities);
      })
      .start();
  }

  private initializeAnimationLayer(background: SceneBackgroundObject, index: number) {
    if (!background.states || !background.isAnimated) return;
    
    const initialState = background.states[0];
    const nextTexture = this.getNextTexture(initialState);
    
    this.animatedLayers.set(index, {
      currentState: initialState,
      nextTexture,
      currentDuration: this.calculateDuration(initialState),
      startTime: 0
    });

    this.currentTextures[index] = _textures[initialState.texture];
  }
  
  private getNextTexture(currentState: TextureState): TextureName {
    if (!currentState.nextTextures.length) return currentState.texture;
    
    if (currentState.transitionProbabilities) {
      const total = currentState.transitionProbabilities.reduce((a, b) => a + b, 0);
      let random = Math.random() * total;
      for (let i = 0; i < currentState.nextTextures.length; i++) {
        random -= currentState.transitionProbabilities[i];
        if (random <= 0) return currentState.nextTextures[i];
      }
    }
    
    return currentState.nextTextures[Math.floor(Math.random() * currentState.nextTextures.length)];
  }
  
  private calculateDuration(state: TextureState): number {
    const normalRandom = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const range = state.maxDuration - state.minDuration;
    const stdDev = range / 4;
    
    let duration = state.baseDuration + (normalRandom() * stdDev);
    
    duration = Math.max(state.minDuration, Math.min(state.maxDuration, duration));
    
    return duration;
  }
  
  public updateAnimation(deltaTime: number) {
    this.animatedLayers.forEach((layer, index) => {
      
      if (deltaTime - layer.startTime >= layer.currentDuration) {
        const nextState = this.sceneData.backgrounds[index].states?.find(
          state => state.texture === layer.nextTexture
        );
        
        if (nextState) {
          layer.currentState = nextState;
          layer.nextTexture = this.getNextTexture(nextState);
          layer.currentDuration = this.calculateDuration(nextState);
          layer.startTime = deltaTime;

          this.currentTextures[index] = _textures[nextState.texture];
          
          this.maskShader.setUniformValue('uTextures', this.currentTextures);
        }
      }
    });
  }

  public setLayerVariant(textureName: TextureName, variantName: string): boolean {
    const layerIndex = this.sceneData.backgrounds.findIndex(background => background.texture === textureName);
    
    if (layerIndex === -1) {
      console.warn(`Layer with texture ${textureName} not found`);
      return false;
    }

    const background = this.sceneData.backgrounds[layerIndex];
    
    if (!background.variants || background.variants.length === 0) {
      console.warn(`Layer ${textureName} has no variants defined`);
      return false;
    }

    const variant = background.variants.find(v => v.name === variantName);
    
    if (!variant) {
      console.warn(`Variant ${variantName} not found for layer ${textureName}`);
      return false;
    }

    // Update the current variant and texture
    this.currentTextures[layerIndex] = _textures[variant.texture];
    
    // Update shader uniforms
    this.maskShader.setUniformValue('uTextures', this.currentTextures);

    return true;
  }
}
