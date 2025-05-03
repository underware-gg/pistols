import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import TWEEN, { Tween } from '@tweenjs/tween.js'

const CARD_WIDTH = 8.5 * 0.065
const CARD_HEIGHT = 12 * 0.065
const ANIMATION_DURATION = 1200

export class CardMesh extends THREE.Mesh {
  private frontMaterialPath: string
  private backMaterialPath: string
  private onLoadComplete: (() => void) | null = null
  
  public currentAnimations: {
    position: Tween<any> | null,
    rotation: Tween<any> | null,
    scale: Tween<any> | null,
  }

  constructor() {
    const frontGeometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT)
    const backGeometry = frontGeometry.clone().translate(0, 0, 0.0001)
    frontGeometry.rotateY(Math.PI)

    const mergedGeometry = mergeGeometries([frontGeometry, backGeometry], false)
    mergedGeometry.addGroup(0, frontGeometry.index.count, 0);
    mergedGeometry.addGroup(frontGeometry.index.count, backGeometry.index.count, 1);

    const materials = [
      new THREE.MeshBasicMaterial({ 
        transparent: true, 
        alphaTest: 0.5, 
        depthTest: true 
      }),
      new THREE.MeshBasicMaterial({ 
        transparent: true, 
        alphaTest: 0.5, 
        depthTest: true 
      })
    ]

    super(mergedGeometry, materials)
    this.name = "Card"

    this.currentAnimations = {
      position: null,
      rotation: null,
      scale: null
    }

    this.position.set(0, 0, 0)
  }

  public setFrontMaterialPath(path: string) {
    this.frontMaterialPath = path
    this.loadMaterials()
  }

  public setBackMaterialPath(path: string) {
    this.backMaterialPath = path
    this.loadMaterials()
  }

  public setLoadCompleteCallback(callback: () => void) {
    this.onLoadComplete = callback
  }

  private loadMaterials() {
    if (!this.frontMaterialPath || !this.backMaterialPath) return

    let backLoaded = false
    let frontLoaded = false

    const checkAllLoaded = () => {
      if (backLoaded && frontLoaded && this.onLoadComplete) {
        this.onLoadComplete()
      }
    }

    const loader = new THREE.TextureLoader()
    loader.load(this.backMaterialPath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = false
      texture.minFilter = THREE.LinearFilter
      this.material[1].map = texture
      this.material[1].needsUpdate = true
      
      backLoaded = true
      checkAllLoaded()
    })

    this.loadSymbol(() => {
      frontLoaded = true
      checkAllLoaded()
    })
  }
  
  private loadSymbol(onSymbolLoaded: () => void) {
    if (!this.frontMaterialPath) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1446;
    const context = canvas.getContext('2d');
    if (!context) return;

    const drawImageToCanvas = (img: HTMLImageElement) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      ) * 0.9;

      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      context.drawImage(img, x, y, img.width * scale, img.height * scale);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.needsUpdate = true;

      if (this.material[0] instanceof THREE.MeshBasicMaterial) {
        this.material[0].map = texture;
        this.material[0].needsUpdate = true;
      }

      onSymbolLoaded();
    };

    const loadImage = (url: string, fallbackUrl?: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => drawImageToCanvas(img);

      img.onerror = () => {
        if (fallbackUrl) {
          // Retry with proxy
          fetch(fallbackUrl)
            .then(res => res.text())
            .then(svgText => {
              const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
              const blobUrl = URL.createObjectURL(svgBlob);
              img.onload = () => {
                drawImageToCanvas(img);
                URL.revokeObjectURL(blobUrl);
              };
              img.src = blobUrl;
            })
            .catch(err => {
              console.error('Error fetching SVG via proxy:', err);
              onSymbolLoaded(); // Failsafe
            });
        } else {
          onSymbolLoaded(); // Failsafe
        }
      };

      img.src = url;
    };

    // const corsProxy = "https://corsproxy.io/?";
    // const safeUrl = corsProxy + encodeURIComponent(this.frontMaterialPath);

    // loadImage(this.frontMaterialPath, safeUrl);
    loadImage(this.frontMaterialPath);
  }

  public dispose() {
    this.geometry.dispose();
    (this.material[0] as THREE.MeshBasicMaterial).dispose();
    (this.material[1] as THREE.MeshBasicMaterial).dispose();
    this.removeFromParent()
  }
}

export class Card extends THREE.Group {
  public camera: THREE.PerspectiveCamera
  
  public cardAnimations: {
    position: Tween<any> | null,
    rotation: Tween<any> | null,
    scale: Tween<any> | null,
  }

  public mesh: CardMesh
  private isLeft: boolean
  private isLoading: boolean = false
  private isLoaded: boolean = false
  private onLoadComplete: (() => void) | null = null

  private finalPosition: THREE.Vector3
  private speedFactor: number = 1
  
  constructor(isLeft: boolean = false, xOffset: number, zOffset: number, camera: THREE.PerspectiveCamera) {
    super()
    this.name = "Card"

    this.camera = camera
    this.isLeft = isLeft
    
    this.mesh = new CardMesh()
    this.add(this.mesh)

    this.finalPosition = new THREE.Vector3(isLeft ? xOffset : -xOffset, 0.56, zOffset)

    this.visible = false

    this.cardAnimations = {
      position: null,
      rotation: null,
      scale: null
    }
  }

  public setSpeedFactor(speedFactor: number) {
    this.speedFactor = speedFactor
  }

  public setFrontMaterialPath(path: string) {
    this.isLoading = true
    this.isLoaded = false
    
    // Set callback before setting path to catch loading event
    this.mesh.setLoadCompleteCallback(() => {
      this.isLoading = false
      this.isLoaded = true
      if (this.onLoadComplete) {
        this.onLoadComplete()
      }
    })
    
    this.mesh.setFrontMaterialPath(path)
  }

  public setBackMaterialPath(path: string) {
    this.mesh.setBackMaterialPath(path)
  }
  
  public setLoadCompleteCallback(callback: () => void) {
    this.onLoadComplete = callback
    
    // If already loaded, call immediately
    if (this.isLoaded && !this.isLoading) {
      callback()
    }
  }
  
  public isFullyLoaded(): boolean {
    return this.isLoaded && !this.isLoading
  }

  public resetAnimations() {
    if (this.cardAnimations.position) {
      this.cardAnimations.position.stop()
      this.cardAnimations.position = null
    }
    
    if (this.cardAnimations.rotation) {
      this.cardAnimations.rotation.stop() 
      this.cardAnimations.rotation = null
    }
    
    if (this.cardAnimations.scale) {
      this.cardAnimations.scale.stop()
      this.cardAnimations.scale = null
    }
  }

  public reset() {
    this.resetAnimations()
    this.rotation.set(0, 0, 0)
    this.visible = false
  }

  public playEnter(onComplete?: Function) {
    this.resetAnimations()

    const behindCameraOffset = 2;
    const leftCornerOffset = this.isLeft ? 1.5 : -1.5;

    this.position.set(
      this.camera.position.x + leftCornerOffset, 
      this.camera.position.y - 0.5, 
      this.camera.position.z - behindCameraOffset
    )

    this.visible = true

    this.cardAnimations.position = new TWEEN.Tween(this.position)
      .to({ 
        x: this.finalPosition.x,
        y: this.finalPosition.y, 
        z: this.finalPosition.z 
      }, ANIMATION_DURATION / this.speedFactor)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()

    const rotationDirection = this.isLeft ? -1 : 1
    this.cardAnimations.rotation = new TWEEN.Tween(this.rotation)
      .to({ y: rotationDirection * Math.PI * 2 }, ANIMATION_DURATION / this.speedFactor)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.rotation.y = 0 
        
        if (onComplete) {
          onComplete();
        }
      })
      .start()
  }

  public hide() {
    this.visible = false
  }

  public dispose() {
    this.resetAnimations()
    
    if (this.mesh) {
      this.mesh.dispose()
    }
    
    this.removeFromParent()
  }
}