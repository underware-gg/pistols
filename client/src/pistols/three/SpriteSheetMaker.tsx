import * as THREE from 'three'

export class SpriteSheet {
  key = null
  frameCount = 1
  textures = []
  frameRate = 8

  constructor(key, SHEET) {
    this.key = key
    this.frameCount = SHEET.frameCount
    for (let f = 1; f <= this.frameCount; ++f) {
      const frameNumber = ('000' + f.toString()).slice(-2)
      const path = `${SHEET.path}/frame_${frameNumber}.png`
      // console.log(path)
      const tex = new THREE.TextureLoader().load(path)
      this.textures.push(tex)
    }
    if (SHEET.frameRate) {
      this.frameRate = SHEET.frameRate
    }
  }

  makeMaterial() {
    return new THREE.MeshBasicMaterial({
      map: this.textures[0],
      transparent: true,
      side: THREE.DoubleSide,
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

  constructor(spriteSheets: any, width: number, height: number, flipped: boolean) {
    const geometry = new THREE.PlaneGeometry(width, height)

    Object.keys(spriteSheets).forEach((key, index) => {
      const sheet = spriteSheets[key]
      this.sheets[key] = sheet

      if(index == 0) {
        this.currentSheet = sheet
        this.setAnimation(key)
      }
    })

    this.material = this.currentSheet.makeMaterial()

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.set(0, 0, 10)
    if (flipped) {
      this.mesh.rotation.set(0, Math.PI, 0)
    }

    this.controls.lastDisplayTime = 0
    this.controls.currentTile = 0
    this.controls.paused = true
    this.controls.loopCount = 0;
    this.controls.visible = true
    this.controls.rewindWhenFinished = false
    this.controls.hideWhenFinished = false
    this.controls.callback = null
    this.controls.callbackTriggered = false

    this.ready = true
  }

  setAnimation(key) {
    this.currentSheet = this.sheets[key]
    this.controls.tileDisplaySeconds = (1 / this.currentSheet.frameRate)
    this.controls.frameCount = this.currentSheet.frameCount
  }

  updateMaterialWithCurrentTile() {
    this.material.map = this.currentSheet.textures[this.controls.currentTile]
  }


  update(clock: THREE.Clock) {
    const seconds = clock.getElapsedTime()

    if (!this.ready || !seconds) return

    if (this.controls.paused) return

    while (seconds - this.controls.lastDisplayTime >= this.controls.tileDisplaySeconds) {

      this.controls.lastDisplayTime = seconds;

      this.controls.currentTile++

      // Last frame...
      if (this.controls.currentTile >= this.controls.frameCount) {

        this.controls.loopCount--;

        if (this.controls.loopCount > 0) {
          //
          // Loop!
          //
          // back to first frame
          this.controls.currentTile = 0;

          // listeners.forEach((listener) => {
          //   if (listener.eventName == 'loop') {
          //     listener.callback({
          //       type: 'loop',
          //       action: action
          //     });
          //   }
          // });

        } else {
          //
          // Finished playing
          //
          this.controls.paused = true;

          if (this.controls.rewindWhenFinished == true) {
            // back to first frame?
            this.controls.currentTile = 0
          } else {
            // stay at last frame
            this.controls.currentTile--
          }

          if (this.controls.hideWhenFinished == true) {
            this.controls.visible = false;
          }

          this.controls.callbackTriggered = true
          this.controls.callback?.()

          this.callFinishedListeners()
        }
      }

      this.updateMaterialWithCurrentTile()
    }

  }

  // Call the user callbacks on the event 'finished'.
  callFinishedListeners() {
    // listeners.forEach((listener) => {
    //   if (listener.eventName == 'finished') {
    //     listener.callback({
    //       type: 'finished',
    //       action: action
    //     });
    //   }
    // }, this.action.tileDisplaySeconds);
  }

  // reveal the sprite and play the action only once
  playOnce(callback: Function = null) {
    this.playRepeat(1, callback)
  }

  playRepeat(loopCount: number, callback: Function = null) {
    if (!this.controls.callbackTriggered) {
      this.controls.callbackTriggered = true;
      this.controls.callback?.()
    }
    this.controls.callbackTriggered = false;
    this.controls.callback = callback;
    this.controls.loopCount = loopCount;
    this.controls.currentTile = 0;
    this.updateMaterialWithCurrentTile()
    this.controls.paused = false;
    this.controls.visible = true;
  }

  // resume the action if it was paused
  resume() {
    // this is in case setFrame was used to set a frame outside of the
    // animation range, which would lead to bugs.
    if (this.controls.currentTile > 0 && this.controls.currentTile < this.controls.frameCount) {
      this.controls.currentTile = 0;
    }
    this.controls.paused = false;
    this.controls.visible = true;
  }

  // reveal the sprite and play it in a loop
  playLoop(callback: Function = null) {
    if (!this.controls.callbackTriggered) {
      this.controls.callbackTriggered = true;
      this.controls.callback?.()
    }
    this.controls.callbackTriggered = false;
    this.controls.callback = callback;
    this.controls.loopCount = Number.MAX_SAFE_INTEGER;
    this.controls.currentAction = this;
    this.controls.currentTile = 0;
    this.updateMaterialWithCurrentTile()
    this.controls.paused = false;
    this.controls.visible = true;
  }

  // pause the action when it reach the last frame
  pauseNextEnd() {
    this.controls.loopCount = 1;
  }

  // pause the action on the current frame
  pause() {
    this.controls.paused = true;
  }

  // pause and reset the action
  stop() {
    this.controls.lastDisplayTime = 0;
    this.controls.currentTile = 0;
    this.controls.paused = true;
    if (this.controls.hideWhenFinished) {
      this.controls.visible = false;
    }
    this.updateMaterialWithCurrentTile()
  }

  // Set manually a frame of the animation. Frame indexing starts at 0.
  setFrame(frameID) {
    this.controls.paused = true;
    this.controls.currentTile = frameID;
    this.updateMaterialWithCurrentTile()
  }



}

