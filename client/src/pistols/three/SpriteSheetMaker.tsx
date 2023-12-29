import * as THREE from 'three'

export class SpriteSheet {
  frameCount = 1
  textures = []
  material = null
  frameRate = 8

  constructor(SHEET) {
    this.frameCount = SHEET.frameCount
    for (let f = 1; f <= this.frameCount; ++f) {
      const frameNumber = ('000' + f.toString()).slice(-2)
      const path = `${SHEET.path}/frame_${frameNumber}.png`
      // console.log(path)
      const tex = new THREE.TextureLoader().load(path)
      this.textures.push(tex)
    }
    this.material = this.makeMaterial()
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
  sheet: SpriteSheet = null
  material: THREE.MeshBasicMaterial = null
  mesh: THREE.Mesh = null
  controls: any = {}
  ready: boolean = false

  constructor(spriteSheet: SpriteSheet, width: number, height: number, flipped: boolean) {
    this.sheet = spriteSheet

    const geometry = new THREE.PlaneGeometry(width, height)
    this.material = this.sheet.makeMaterial()

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.set(0, 0, 1)

    if (flipped) {
      this.mesh.rotation.set(0, Math.PI, 0)
    }

    this.controls.tileDisplayDuration = (1000 / this.sheet.frameRate)
    this.controls.lastDisplayTime = 0
    this.controls.currentTile = 0
    this.controls.paused = true
    this.controls.mustLoop = false
    this.controls.visible = true
    this.controls.clampWhenFinished = true
    this.controls.hideWhenFinished = false

    this.ready = true
  }


  update(time) {
    if (!this.ready || !time) return

    while (time - this.controls.lastDisplayTime >= this.controls.tileDisplayDuration) {

      this.controls.lastDisplayTime = time;

      this.controls.currentTile = (this.controls.currentTile + 1);

      // Restarts the animation if the last frame was reached at last call.
      if (this.controls.currentTile >= this.sheet.frameCount) {

        this.controls.currentTile = 0;

        // Call the user callbacks on the event 'loop'
        if (this.controls.mustLoop == true) {

          // listeners.forEach((listener) => {
          //   if (listener.eventName == 'loop') {
          //     listener.callback({
          //       type: 'loop',
          //       action: action
          //     });
          //   };
          // });

        } else { // action must not loop

          this.controls.paused = true;

          if (this.controls.clampWhenFinished == true) {

            if (this.controls.hideWhenFinished == true) {
              this.controls.visible = false;
            };

            this.callFinishedListeners();

          } else { // must restart the animation before to stop

            if (this.controls.hideWhenFinished == true) {
              this.controls.visible = false;
            };

            // Call updateAction() a last time after a frame duration,
            // even if the action is actually paused before, in order to restart
            // the animation.
            // setTimeout(() => {
            //   updateAction(action, this.controls.tileDisplayDuration);
            //   this.callFinishedListeners();
            // }, this.controls.tileDisplayDuration);

          };
        };
      };

      this.offsetTexture();
    };

  };

  // Call the user callbacks on the event 'finished'.
  callFinishedListeners() {
    // listeners.forEach((listener) => {
    //   if (listener.eventName == 'finished') {
    //     listener.callback({
    //       type: 'finished',
    //       action: action
    //     });
    //   };
    // }, this.action.tileDisplayDuration);
  };


  // reveal the sprite and play the action only once
  playOnce() {
    this.controls.mustLoop = false;
    this.controls.currentTile = 0;
    this.offsetTexture();
    this.controls.paused = false;
    this.controls.visible = true;
  };

  // resume the action if it was paused
  resume() {
    // this is in case setFrame was used to set a frame outside of the
    // animation range, which would lead to bugs.
    if (this.controls.currentTile > 0 && this.controls.currentTile < this.sheet.frameCount) {
      this.controls.currentTile = 0;
    };
    this.controls.paused = false;
    this.controls.visible = true;
  };

  // reveal the sprite and play it in a loop
  playLoop() {
    this.controls.mustLoop = true;
    this.controls.currentAction = this;
    this.controls.currentTile = 0;
    this.offsetTexture();
    this.controls.paused = false;
    this.controls.visible = true;
  };

  // pause the action when it reach the last frame
  pauseNextEnd() {
    this.controls.mustLoop = false;
  };

  // pause the action on the current frame
  pause() {
    this.controls.paused = true;
  };

  // pause and reset the action
  stop() {
    this.controls.lastDisplayTime = 0;
    this.controls.currentTile = 0;
    this.controls.paused = true;
    if (this.controls.hideWhenFinished) {
      this.controls.visible = false;
    };
    this.offsetTexture();
  };

  // Set manually a frame of the animation. Frame indexing starts at 0.
  setFrame(frameID) {
    this.controls.paused = true;
    this.controls.currentTile = frameID;
    this.offsetTexture();
  };

  offsetTexture() {
    this.material.map = this.sheet.textures[this.controls.currentTile]
  };


}

