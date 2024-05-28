import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import { WIDTH, HEIGHT, _makeStaticCamera, _renderer, _fullScreenGeom } from './game';



// Inspired by @senbaku
// https://twitter.com/senbaku/status/1473548401019355140
// and etudes
// https://boytchev.github.io/etudes/threejs/ghosts-in-the-rain.html

const N = 10000 // number of snowflakes
const G = THREE.MathUtils.randInt(5, 11) // number of ghosts
const R = 50 // radius of ghost
const R2 = R * R
const OFF = 40
var M = 0 // actual number of snowflakes


export class Rain extends THREE.Object3D {

  needToClear = true
  fbo: THREE.WebGLRenderTarget
  renderer: THREE.WebGLRenderer
  camera: THREE.OrthographicCamera
  scene: THREE.Scene
  snowflakes: THREE.BufferGeometry
  speeds = []
  ghosts = []
  ghostsEyes = []

  constructor(parent) {
    super()

    // FBO
    this.fbo = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
      format: THREE.RGBAFormat,
    })
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.fbo.texture,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    const cover = new THREE.Sprite(spriteMaterial)
    cover.scale.set(WIDTH, HEIGHT, 1)
    parent.add(cover)

    //
    // Scene
    this.scene = new THREE.Scene()
    this.camera = _makeStaticCamera(0, 0, HEIGHT / 2)



    //------------------------------------------
    // generate snowflake texture
    //
    var canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    var context = canvas.getContext('2d')
    var gradient = context.createRadialGradient(15, 15, 2, 15, 15, 15)
    gradient.addColorStop(0, 'white')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 32, 32)
    var snowflakeTexture = new THREE.CanvasTexture(canvas)

    // Snowflakes
    this.snowflakes = new THREE.BufferGeometry()
    var vertices = []
    for (var i = 0; i < N; i++) {
      vertices.push(THREE.MathUtils.randFloatSpread(WIDTH))
      vertices.push(-0.6 * HEIGHT)
      vertices.push(0)
      this.speeds.push(new THREE.Vector3(THREE.MathUtils.randFloat(-OFF, OFF), -100, 0))
    }
    this.snowflakes.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    // snow material
    var material = new THREE.PointsMaterial({
      color: '#e4fdfe',
      size: 1.5,
      map: snowflakeTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    var snow = new THREE.Points(this.snowflakes, material)
    this.scene.add(snow)

    // create ghosts
    var white = new THREE.MeshBasicMaterial({ color: 0x303060 })
    var eye = new THREE.CircleGeometry(8, 32)
    for (var i = 0; i < G; i++) {
      var eye1 = new THREE.Mesh(eye, white)
      var eye2 = new THREE.Mesh(eye, white)
      eye1.position.x = 14
      eye2.position.x = -14
      var ghost = new THREE.Group()
      ghost.add(eye1, eye2)
      ghost.position.set(THREE.MathUtils.randFloatSpread(0.8 * WIDTH), THREE.MathUtils.randFloatSpread(0.7 * HEIGHT), 0)
      this.ghostsEyes.push(ghost)
      this.ghosts.push(ghost.position)
      this.scene.add(ghost)
    }

    // clear material
    const clearMat = new THREE.MeshBasicMaterial({
      color: 'black',
      transparent: true,
      opacity: 0.05,
    })
    const clear = new THREE.Mesh(_fullScreenGeom, clearMat)
    clear.position.set(0, 0, 0)
    this.scene.add(clear)

  }

  reset() {
    this.needToClear = true
  }

  animate(clock) {
    var dTime = 0.01 //just in case so that it doesnt mess the clocks deltas, will be replaced back once rain is completely implemented
    var time = clock.getElapsedTime()
    if (M < N) M += 5
    const positions = this.snowflakes.getAttribute('position')
    var v = new THREE.Vector3()
    // move each snowflake
    for (var i = 0; i < M; i++) {
      // move down a snowflake
      let pos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i),
      )
      pos.addScaledVector(this.speeds[i], dTime)
      // acceleration
      if (this.speeds[i].y > -600 - (i % 600)) this.speeds[i].y -= 5
      //this.speeds[i].x -= THREE.MathUtils.randFloat(-0.1,0.1)

      // recycle 
      if (pos.y < -HEIGHT / 2) {
        pos.x = THREE.MathUtils.randFloatSpread(WIDTH)
        pos.y = HEIGHT / 2 + THREE.MathUtils.randFloat(0, 100)
        this.speeds[i].set(THREE.MathUtils.randFloat(-OFF, OFF), -400, 0)
      }

      // check for ghosts collission
      for (var g = 0; g < G; g++)
        if (pos.x < this.ghosts[g].x + R)
          if (pos.x > this.ghosts[g].x - R)
            if (pos.y > this.ghosts[g].y)
              if (pos.y < this.ghosts[g].y + R)
                if (pos.distanceToSquared(this.ghosts[g]) < R2) {
                  v.subVectors(pos, this.ghosts[g]).setLength(R).add(this.ghosts[g])
                  this.speeds[i].x = THREE.MathUtils.randFloat(-100, 100) + 50 * Math.sign(v.x)
                  this.speeds[i].y = THREE.MathUtils.randFloat(10, 160)
                  pos.set(v.x, v.y, v.z)
                  v.subVectors(pos, this.ghosts[g])
                }

      positions.setXYZ(i, pos.x, pos.y, pos.z)
    }
    positions.needsUpdate = true
    // animate ghosts
    for (var g = 0; g < G; g++) {
      this.ghostsEyes[g].visible = Math.sin(g / 2 + 3 * time) > -0.8
      this.ghostsEyes[g].position.y += THREE.MathUtils.randFloat(-1, 1)
    }

    // RENDER
    _renderer.setRenderTarget(this.fbo)
    if (this.needToClear) {
      // _renderer.clearColor()
      _renderer.clear()
      this.needToClear = false
    }
    _renderer.render(this.scene, this.camera)
    _renderer.setRenderTarget(null)
  }
}


// var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.1, depthWrite: false }));

// renderer.clearColor();

// function animate() {
//   renderer.render(plane, camera);
//   renderer.render(scene, camera);
// }

