import * as THREE from 'three'
import { clamp } from 'three/src/math/MathUtils'
import {
  WIDTH, HEIGHT,
  _textures,
  _sceneName, _currentScene,
  emitter,
} from './game';
import { TextureName } from '../data/assets';
import { ShaderMaterial } from './shaders'
import { SceneName } from '../hooks/PistolsContext';

const BAR_SCENES = {
  'ff0000': SceneName.Barkeep,    // red: bartender
  '00ff00': SceneName.Duelists,   // bottle: green
  '0000ff': SceneName.YourDuels,  // pistol: blue
  'ff00ff': SceneName.PastDuels,  // shovel: magenta
}

export class BarMenu extends THREE.Object3D {

  fbo: THREE.WebGLRenderTarget
  fbo_scene: THREE.Scene
  maskShader: ShaderMaterial
  maskOverlay: THREE.Mesh
  renderer: THREE.WebGLRenderer

  mousePos: THREE.Vector2
  pickedColor: THREE.Color
  pickedScene: SceneName
  timeOffset: number

  constructor(bgScene: THREE.Scene, bgMesh: THREE.Mesh) {
    super()

    this.mousePos = new THREE.Vector2()
    this.pickedColor = new THREE.Color(0, 0, 0)
    this.timeOffset = 0

    this.fbo = new THREE.WebGLRenderTarget(
      WIDTH, HEIGHT,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType
      }
    )

    // create scene with mask for the FBO to render
    const bg_mask_mat = new THREE.MeshBasicMaterial({
      map: _textures[TextureName.bg_tavern_mask],
      transparent: true,
    })
    let bg_mask = new THREE.Mesh(bgMesh.geometry, bg_mask_mat)
    bg_mask.position.set(bgMesh.position.x, bgMesh.position.y, bgMesh.position.z)
    this.fbo_scene = new THREE.Scene()
    this.fbo_scene.add(bg_mask)

    // mask overlay (highlighted)
    this.maskShader = new ShaderMaterial("BAR_MASK", {
      transparent: true,
      depthTest: false,
      alphaTest: 0.5,
    })
    this.maskShader.setUniformValue('uTime', 0.0)
    this.maskShader.setUniformValue('uPickedColor', this.pickedColor)
    this.maskShader.setUniformValue('uHighlightColor', new THREE.Color('#ffcf40'))
    this.maskShader.setUniformValue('uHighlightOpacity', 0.4)
    this.maskShader.setUniformValue('uMask', _textures[TextureName.bg_tavern_mask])

    // add overlay as child of bg, to inherit aimations (zoom)
    this.maskOverlay = new THREE.Mesh(bgMesh.geometry, this.maskShader)
    this.maskOverlay.position.set(0, 0, 0.0001)
    bgMesh.add(this.maskOverlay)

    // uncomment to see the original mask
    // bgScene.add(bg_mask.clone())

    document.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.addEventListener('click', this.onMouseClick.bind(this), false);
  }

  public dispose() {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.removeEventListener('click', this.onMouseClick.bind(this), false);
  }

  // return hex color over the mouse
  render(renderer: THREE.WebGLRenderer, camera: THREE.Camera, elapsedTime: number, enabled: boolean): string {
    this.renderer = renderer
    if (this.renderer && enabled) {
      if (this.timeOffset === 0) {
        // always start rendering scene with a glow (4 seconds delay)
        this.timeOffset = (elapsedTime % 4.0) - 3;
      }
      this.maskShader.setUniformValue("uTime", elapsedTime - this.timeOffset)

      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();
      this.renderer.render(this.fbo_scene, camera)
      this.renderer.setRenderTarget(null);

      const read = new Float32Array(4);
      this.renderer.readRenderTargetPixels(this.fbo, this.mousePos.x, this.mousePos.y, 1, 1, read);
      this.pickColor(read[0], read[1], read[2])
    } else {
      this.timeOffset = 0
      this.pickColor(0, 0, 0)
    }
    return this.pickedColor.getHexString()
  }

  pickColor(r: number, g: number, b: number) {
    const newColor = new THREE.Color(r, g, b)
    if (!this.pickedColor.equals(newColor)) {
      this.pickedColor.copy(newColor)
      this.pickedScene = BAR_SCENES[this.pickedColor.getHexString()]
      this.changeMouseCursor(this.pickedScene != null)
      this.maskShader.setUniformValue('uPickedColor', this.pickedColor)
      // console.log(`X/Y ${this.mousePos.x} ${this.mousePos.y} RGB: [${this.pickedColor.getHexString()}]`, this.pickedScene);
    }
  }

  changeMouseCursor(clickable: boolean) {
    if (clickable) {
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'default'
    }
  }

  // get mouse position over the canvas for bar interaction
  onMouseMove(event: MouseEvent) {
    event.preventDefault();

    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY)
    const domElement = this.renderer?.domElement

    if (elementAtPoint && domElement?.contains(elementAtPoint)) {
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
    event.preventDefault();
    if (this.pickedScene) {
      emitter.emit('change_scene', this.pickedScene)
      this.pickColor(0, 0, 0)
    }
  }

}

