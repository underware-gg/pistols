import * as THREE from 'three'
import { clamp } from 'three/src/math/MathUtils'
import {
  WIDTH, HEIGHT,
  _textures,
  _sceneName, _currentScene,
} from './game';
import { TextureName } from '../data/assets';




export class BarMenu extends THREE.Object3D {

  fbo: THREE.WebGLRenderTarget
  fbo_scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  mousePos: THREE.Vector2

  constructor(bgScene: THREE.Scene, bgMesh: THREE.Mesh) {
    super()

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
      color: 'white',
      transparent: true,
    })
    let bg_mask = new THREE.Mesh(bgMesh.geometry.clone(), bg_mask_mat)
    bg_mask.position.set(bgMesh.position.x, bgMesh.position.y, bgMesh.position.z)
    this.fbo_scene = new THREE.Scene()
    this.fbo_scene.add(bg_mask)

    // uncomment to see the mask
    // bgScene.add(bg_mask.clone())

    this.mousePos = new THREE.Vector2()

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
  }

  render(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    this.renderer = renderer
    if (!this.renderer) return

    this.renderer.setRenderTarget(this.fbo);
    this.renderer.clear();
    this.renderer.render(this.fbo_scene, camera)
    this.renderer.setRenderTarget(null);

    const read = new Float32Array(4);
    this.renderer.readRenderTargetPixels(this.fbo, this.mousePos.x, this.mousePos.y, 1, 1, read);
    let r = Math.floor(read[0] * 255);
    let g = Math.floor(read[1] * 255);
    let b = Math.floor(read[2] * 255);
    console.log(`X/Y ${this.mousePos.x} ${this.mousePos.y} RGB: [${r},${g},${b}]`);
  }

  // get mouse position over the canvas for bar interaction
  onDocumentMouseMove(event) {
    event.preventDefault();

    if (this.renderer) {
      var rect = this.renderer.domElement.getBoundingClientRect();
      let x = (event.clientX - rect.left) / rect.width
      let y = (event.clientY - rect.top) / rect.height
      x = Math.floor(clamp(x, 0, 1) * WIDTH)
      y = HEIGHT - Math.floor(clamp(y, 0, 1) * HEIGHT)
      this.mousePos.set(x, y)
    } else {
      this.mousePos.set(0, 0)
    }

  }

}

