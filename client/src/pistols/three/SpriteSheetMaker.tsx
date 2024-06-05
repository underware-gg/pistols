import * as THREE from 'three'

export class SpriteSheet {
  key = null
  frameCount = 1
  textures = []
  frameRate = 8
  isLoaded = false

  constructor(key, SHEET, loader) {
    this.key = key
    this.frameCount = SHEET.frameCount

    this.loadTextures(SHEET, loader)
    
    if (SHEET.frameRate) {
      this.frameRate = SHEET.frameRate
    }
  }

  async loadTextures(SHEET, loader) {
    for (let f = 1; f <= this.frameCount; ++f) {
      const frameNumber = ('000' + f.toString()).slice(-3)
      const path = `${SHEET.path}/frame_${frameNumber}.ktx2`
      const tex = await loader.loadAsync(path)

      tex.colorSpace = THREE.SRGBColorSpace
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter
      this.textures.push(tex)
    }

    this.isLoaded = true
  }

  makeMaterial() {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5
    })
  }
}

export class Actor {
  sheets: any = {}
  material: THREE.MeshBasicMaterial = null
  mesh: THREE.Mesh = null
  currentSheet: SpriteSheet = null
  controls: any = {}
  ready: boolean = false
  animationQueue: { key: string, count: number, loop: boolean, move: { x: number, y: number, z: number }, onStart: any, onEnd: any }[] = []  // Animation queue

  constructor(spriteSheets: any, width: number, height: number, flipped: boolean) {
    const geometry = new THREE.PlaneGeometry(width, height)

    Object.keys(spriteSheets).forEach((key, index) => {
      const sheet = spriteSheets[key]
      this.sheets[key] = sheet

      if (index === 0) {
        this.currentSheet = sheet
        this.playOnce(key)
      }
    })

    this.material = this.currentSheet.makeMaterial()
    this.mesh = new THREE.Mesh(geometry, this.material)

    if (flipped) {
      this.mesh.position.set(-0.5, (height / 2) - (height * 0.005), 2)
    } else {
      this.mesh.rotateY(Math.PI)
      this.mesh.position.set(0.5, (height / 2) - (height * 0.005), 2)
    }
    this.mesh.rotateZ(Math.PI)
    this.mesh.castShadow = true

    this.controls.lastDisplayTime = 0
    this.controls.currentTile = 0
    this.controls.delay = 0
    this.controls.paused = true
    this.controls.loopCount = 0
    this.controls.loop = false
    this.controls.visible = true
    this.controls.rewindWhenFinished = false
    this.controls.hideWhenFinished = false
    this.controls.callback = null
    this.controls.callbackTriggered = false
    this.controls.flipped = flipped
    this.controls.frameMovement = {}
    this.controls.frameReady = false

    this.ready = true
  }

  playOnce(key, frameMovement = { x: 0, y: 0, z: 0, frames: 0 }, onStart = null, onEnd = null) {
    this.playRepeat(key, 1, frameMovement, onStart, onEnd);
  }

  playRepeat(key, loopCount, frameMovement = { x: 0, y: 0, z: 0, frames: 0 }, onStart = null, onEnd = null, loop = null) {
    this.animationQueue.push({ key: key, count: loopCount, move: frameMovement, onStart: onStart, onEnd: onEnd, loop: loop });
  }

  playLoop(key, frameMovement = { x: 0, y: 0, z: 0, frames: 0 }, onStart = null, onEnd = null) {
    this.playRepeat(key, 1, frameMovement, onStart, onEnd, true);
  }

  update(seconds) {
    if (!this.ready || !seconds) return
    
    //Make sure the sheet is loaded and displayed properly
    if (!this.controls.frameReady) {
      if (this.currentSheet.isLoaded) {
        this.updateMaterialWithCurrentTile()
        this.controls.frameReady = true
      }
    }
    
    //Start playing animations if there are any in queue
    if (this.controls.paused) {
      if (this.animationQueue.length > 0) {
        this.updateNextAnimation();
      } else {
        return
      }
    }

    const elapsed = seconds - this.controls.lastDisplayTime
    if (elapsed >= this.controls.tileDisplaySeconds) {
      this.controls.lastDisplayTime = seconds
      this.controls.currentTile++;

      if (this.controls.currentTile >= this.controls.frameCount) {
        // Reset to the start of the animation
        this.controls.currentTile = 0
        this.controls.loopCount--

        if (this.controls.loopCount > 0 || this.controls.loop) {
          // Continue looping the current animation
          this.updateMaterialWithCurrentTile()
          if (this.controls.loopCount < 0) {
            this.controls.loopCount = 0
          }
        } else {
          // Current animation is finished, check if we should rewind
          if (this.controls.rewindWhenFinished) {
            this.controls.currentTile = 0;
            this.updateMaterialWithCurrentTile()
          }

          // Check if we should hide the mesh after the animation finishes
          if (this.controls.hideWhenFinished) {
            this.controls.visible = false
          }

          // Trigger callback if any
          if (this.controls.callback) {
            this.controls.callback()
            // Reset callback to ensure it's called only once
            this.controls.callback = null
          }

          // Check if there is another animation in the queue and set it up
          if (this.animationQueue.length > 0) {
            this.updateNextAnimation()
          } else {
            // No more animations in the queue, pause the actor
            this.controls.paused = true
          }
        }
      } else {
        this.updateMaterialWithCurrentTile()
      }
    } else {
      const t = Math.min((elapsed + (this.controls.currentTile * this.controls.tileDisplaySeconds)) / this.controls.totalAnimationMovementDuration, 1)
      this.interpolatePosition(t)
    }
  }

  interpolatePosition(t) {
    const easedT = this.fastInFastOut(t)
    const interpolatedX = this.controls.startPositionX + easedT * (this.controls.targetPositionX - this.controls.startPositionX)
    this.mesh.position.x = interpolatedX
  }

  cubicBezier(t, p1, p2, p3, p4) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    let p = uuu * p1; //initial anchor point
    p += 3 * uu * t * p2; //control point 1
    p += 3 * u * tt * p3; //control point 2
    p += ttt * p4; //end anchor point

    return p;
}

fastInFastOut(t) {
    return this.cubicBezier(t, 0, 0.3, 0.7, 1.0);
}

  updateMaterialWithCurrentTile() {
    this.material.map = this.currentSheet.textures[this.controls.currentTile]
  }

  updateNextAnimation() {
    const next = this.animationQueue.shift()
    this.currentSheet = this.sheets[next.key]
    this.controls.frameReady = this.currentSheet.isLoaded
    this.controls.loopCount = next.count
    this.controls.loop = next.loop
    this.controls.callback = next.onEnd
    
    this.controls.frameMovement = next.move
    this.controls.startPositionX = this.mesh.position.x;
    this.controls.targetPositionX = this.controls.startPositionX + this.controls.frameMovement.x * (this.controls.flipped ? -1 : 1);
    
    this.controls.tileDisplaySeconds = 1 / this.currentSheet.frameRate
    this.controls.frameCount = this.currentSheet.frameCount
    this.controls.totalAnimationMovementDuration = this.controls.tileDisplaySeconds * (this.controls.frameMovement.frames > 0 ? this.controls.frameMovement.frames : this.controls.frameCount)

    this.controls.callbackTriggered = false
    this.controls.currentTile = 0
    this.updateMaterialWithCurrentTile()
    this.controls.paused = false
    this.controls.visible = true

    if (next.onStart) {
      next.onStart()
    }
  }

  // pause and reset the action
  stop() {
    this.animationQueue = []
    this.controls.lastDisplayTime = 0;
    this.controls.currentTile = 0;
    this.controls.paused = true;
    if (this.controls.hideWhenFinished) {
      this.controls.visible = false;
    }
    this.updateMaterialWithCurrentTile()
  }
}
