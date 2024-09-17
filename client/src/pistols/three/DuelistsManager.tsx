import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

import { CharacterType, AudioName, AnimName } from '@/pistols/data/assets'
import { Action, ActionTypes } from '@/pistols/utils/pistols'

import { Actor } from './SpriteSheetMaker'
import { _sfxEnabled, AnimationState, ASPECT, emitter, playAudio } from './game'
import { ProgressDialogManager } from './ProgressDialog'

const ACTOR_WIDTH = 2.5
const ACTOR_HEIGHT = 1.35
const PACES_X_0 = 0.5

enum DuelistsData {
  DUELIST_A_MODEL = 'DUELIST_A_MODEL',
  DUELIST_A_NAME = 'DUELIST_A_NAME',

  DUELIST_B_MODEL = 'DUELIST_B_MODEL',
  DUELIST_B_NAME = 'DUELIST_B_NAME',
}

interface Duelist {
  id: string,
  model: CharacterType,
  name: string,
  actor: Actor,
}

export class DuelistsManager {
  
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private spriteSheets: any

  private mousePointer = new THREE.Vector2()
  private raycaster = new THREE.Raycaster()

  private darkBackground: THREE.Mesh

  private duelProgressDialogManger: ProgressDialogManager

  public duelistA: Duelist = {
    id: 'A',
    model: undefined,
    name: undefined,
    actor: undefined
  }
  public duelistB: Duelist = {
    id: 'B',
    model: undefined,
    name: undefined,
    actor: undefined
  }
 
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, spriteSheets: any) {
     
    this.scene = scene
    this.camera = camera
    this.spriteSheets = spriteSheets

    this.loadDuelists()
    this.setupCameraCardUI()

    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)

    this.duelProgressDialogManger = new ProgressDialogManager(scene, camera, positionA, positionB)

    this.setupEvents()
  }

  private loadDuelists() {
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistA.actor = new Actor(this.duelistA.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, false)
    this.scene.add(this.duelistA.actor.mesh)
    
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)
    this.duelistB.actor = new Actor(this.duelistB.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, true)
    this.scene.add(this.duelistB.actor.mesh)
  }

  private setupCameraCardUI() {
    this.createDarkBackground()
    //TODO add camera hand groups here already for easier managment??
  }

  createDarkBackground() {
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov * 0.5)
    const height = 2 * Math.tan(vFOV) * Math.abs(-2)
    const width = height * this.camera.aspect

    const geometry = new THREE.PlaneGeometry(width, height)

    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthTest: false
    });

    this.darkBackground = new THREE.Mesh(geometry, material);
    this.darkBackground.position.z = -2
    this.darkBackground.renderOrder = 500
    this.darkBackground.name = "Background"

    this.camera.add(this.darkBackground)
  }

  private setupEvents() {
  }


  //-------------------------------------------
  // Game Loop
  //

  public update(deltaTime: number, elapsedTime: number) {
    this.duelistA.actor?.update(elapsedTime)
    this.duelistB.actor?.update(elapsedTime)

    this.duelProgressDialogManger.update(this.duelistA.actor.mesh.position.x + 0.1, this.duelistB.actor.mesh.position.x - 0.1)
  }


  //----------------
  // New duel setup reset
  //

  public switchDuelists(duelistNameA: string, duelistModelA: CharacterType, isDuelistAYou: boolean, isDuelistBYou: boolean, duelistNameB: string, duelistModelB: CharacterType) {
    localStorage.setItem(DuelistsData.DUELIST_A_MODEL, duelistModelA)
    localStorage.setItem(DuelistsData.DUELIST_B_MODEL, duelistModelB)
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE

    localStorage.setItem(DuelistsData.DUELIST_A_NAME, duelistNameA)
    localStorage.setItem(DuelistsData.DUELIST_B_NAME, duelistNameB)
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)

    this.duelistA.actor.replaceSpriteSheets(this.spriteSheets[this.duelistA.model]) //TODO check if works instead of this.duelistA.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE
    this.duelistB.actor.replaceSpriteSheets(this.spriteSheets[this.duelistB.model])

    this.duelProgressDialogManger.setData(duelistNameA, duelistNameB, isDuelistAYou, isDuelistBYou)

    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x + 0.1, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x - 0.1, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)
    this.duelProgressDialogManger.updateDialogPositions(positionA, positionB)

    //called when we switch to the duel scene or reoload, makes the dialogs show up nicely
    this.showDialogsTimeout = setTimeout(() => {
      this.duelProgressDialogManger.showDialogs()
    }, 400)

    this.resetActorPositions()
  }

  private showDialogsTimeout

  public resetDuelists(): boolean {
    if (!this.duelistA.model || !this.duelistB.model) return false //TODO change if duelistmanager makes it so its always created to remove this if not check in duelist manager

    this.duelistA.actor?.stop()
    this.duelistB.actor?.stop()

    this.playActorAnimation(this.duelistA, AnimName.STILL, null, true)
    this.playActorAnimation(this.duelistB, AnimName.STILL, null, true)

    this.duelProgressDialogManger.showDialogs()

    return true
  }

  public updatePlayerProgress(isA: boolean, duelistState: any, onClick: any) {
    this.duelProgressDialogManger.updateDialogState(isA, duelistState, onClick)
  }

  public setDuelistElement(isA: boolean, duelistElement: any) {
    this.duelProgressDialogManger.setElementData(isA, duelistElement)
  }

  public hideElements() {
    this.duelProgressDialogManger.hideDialogs()
  }



  //----------------
  // Animate duel
  //

  private resetActorPositions() {
    this.duelistA.actor.mesh.position.set(PACES_X_0, this.duelistA.actor.mesh.position.y, this.duelistA.actor.mesh.position.z)
    this.duelistB.actor.mesh.position.set(-PACES_X_0, this.duelistB.actor.mesh.position.y, this.duelistB.actor.mesh.position.z)
  }

  public animateDuelistShootout(paceCountA: number, paceCountB: number, healthA: number, healthB: number, damageA: number, damageB: number) {
    if(this.showDialogsTimeout) clearTimeout(this.showDialogsTimeout)

    const minPaceCount = Math.min(paceCountA, paceCountB)

    this.resetActorPositions()

    // animate sprites
    for (let i = 0; i < minPaceCount + 2; i++) {
      const key: AnimName = i % 2 == 1 ? AnimName.STEP_2 : AnimName.STEP_1

      //To make the other duelist walk while one goes to shooting
      if (i == minPaceCount && paceCountA > paceCountB) {
        this.playActorAnimation(this.duelistA, key)
      } else if (i == minPaceCount && paceCountB > paceCountA) {
        this.playActorAnimation(this.duelistB, key)
      } else if (i > minPaceCount && paceCountA > paceCountB) {
        if (damageA == 0) {
          this.playActorAnimation(this.duelistA, key)
        }
      } else if (i > minPaceCount && paceCountB > paceCountA) {
        if (damageB == 0) {
          this.playActorAnimation(this.duelistB, key)
        }
      } else if (i < minPaceCount) {
        //timeout not needed with animationQueue
        this.playActorAnimation(this.duelistA, key)
        this.playActorAnimation(this.duelistB, key)
      }
    }

    // SHOOT!
    const _shootA = () => {
      this.playActorAnimation(this.duelistA, AnimName.SHOOT, () => {
        emitter.emit('animated', AnimationState.HealthB)
        if (healthB == 0) {
          this.playActorAnimation(this.duelistB, AnimName.SHOT_DEAD_FRONT, () => _updateB())
        } else if (damageB > 0) {
          this.playActorAnimation(this.duelistB, AnimName.SHOT_INJURED_FRONT, () => _updateB())
        } else {
          _updateB()
        }
      })
    }
    const _shootB = () => {
      this.playActorAnimation(this.duelistB, AnimName.SHOOT, () => {
        emitter.emit('animated', AnimationState.HealthA)
        if (healthA == 0) {
          this.playActorAnimation(this.duelistA, AnimName.SHOT_DEAD_FRONT, () => _updateA())
        } else if (damageA > 0) {
          this.playActorAnimation(this.duelistA, AnimName.SHOT_INJURED_FRONT, () => _updateA())
        } else {
          _updateA()
        }
      })
    }

    let hasUpdatedA = false
    let hasUpdatedB = false
    const _updateA = () => {
      if (!hasUpdatedA) {
        hasUpdatedA = true
        _updateAnimatedState()
      }
    }
    const _updateB = () => {
      if (!hasUpdatedB) {
        hasUpdatedB = true
        _updateAnimatedState()
      }
    }
    const _updateAnimatedState = () => {
      if (hasUpdatedA && hasUpdatedB) {
        emitter.emit('animated', AnimationState.Round1)
        if (healthA == 0 || healthB == 0) {
          this.duelProgressDialogManger.showDialogEnd(healthA, healthB)
        } else {
          this.duelProgressDialogManger.showDialogs()
        }
      }
    }

    //
    // Both fire at same time
    if (paceCountA == paceCountB) {
      _shootA()
      _shootB()
    }
    //
    // A fires first
    if (paceCountA < paceCountB) {
      this.playActorAnimation(this.duelistA, AnimName.SHOOT, () => {
        emitter.emit('animated', AnimationState.HealthB)
        if (healthB > 0 && damageB == 0) {
          _updateB()
          _shootB()
        }
      })
      if (healthB == 0) {
        this.playActorAnimation(this.duelistB, AnimName.SHOT_DEAD_BACK, () => _updateB())
      } else if (damageB > 0) {
        this.playActorAnimation(this.duelistB, AnimName.SHOT_INJURED_BACK, () => {
          _updateB()
          _shootB()
        })
      }
    }
    //
    // B fires first
    if (paceCountB < paceCountA) {
      this.playActorAnimation(this.duelistB, AnimName.SHOOT, () => {
        emitter.emit('animated', AnimationState.HealthA)
        if (healthA > 0 && damageA == 0) {
          _updateA()
          _shootA()
        }
      })
      if (healthA == 0) {
        this.playActorAnimation(this.duelistA, AnimName.SHOT_DEAD_BACK, () => _updateA())
      } else if (damageA > 0) {
        this.playActorAnimation(this.duelistA, AnimName.SHOT_INJURED_BACK, () => {
          _updateA()
          _shootA()
        })
      }
    }
  }

  public animateActions(state: AnimationState, actionA: Action, actionB: Action, healthA: number, healthB: number, damageA: number, damageB: number) {
    if(this.showDialogsTimeout) clearTimeout(this.showDialogsTimeout)
    this.resetActorPositions()

    const finishAnimation = () => {
      emitter.emit('animated', state)
      this.duelProgressDialogManger.hideDialogs()
      this.duelProgressDialogManger.showDialogEnd(healthA, healthB)
    }

    // animate sprites
    this.playActorAnimation(this.duelistA, this.getActionAnimName(actionA), () => {
      let survived = 0
      if (healthB == 0) {
        this.playActorAnimation(this.duelistB, AnimName.STRUCK_DEAD, () => finishAnimation())
      } else if (damageB > 0) {
        this.playActorAnimation(this.duelistB, AnimName.STRUCK_INJURED, () => finishAnimation())
      } else {
        survived++
      }
      if (healthA == 0) {
        this.playActorAnimation(this.duelistA, AnimName.STRUCK_DEAD, () => finishAnimation())
      } else if (damageA > 0) {
        this.playActorAnimation(this.duelistA, AnimName.STRUCK_INJURED, () => finishAnimation())
      } else {
        survived++
      }
      if (survived == 2) emitter.emit('animated', state)
    })

    this.playActorAnimation(this.duelistB, this.getActionAnimName(actionB), () => {
      // only A need to animate
    })
  }

  private getActionAnimName = (action: Action): AnimName => {
    const result = ActionTypes.paces.includes(action) ? AnimName.SHOOT
      : ActionTypes.runner.includes(action) ? AnimName.TWO_STEPS
        : action == Action.Grapple ? AnimName.STRIKE_LIGHT
          : action == Action.Behead ? AnimName.STRIKE_HEAVY
            : action == Action.PocketPistol ? AnimName.STRIKE_BLOCK
              : AnimName.STILL_BLADE

    return result
  }

  private playActorAnimation(duelist: Duelist, key: AnimName, onEnd: Function = null, loop: boolean = false) {
    let onStart = null
    let movement = {
      x: 0,
      y: 0,
      z: 0,
      frames: 0,
    }

    if (key == AnimName.STEP_1 || key == AnimName.STEP_2 || key == AnimName.TWO_STEPS) {
      movement.x = 0.352
    } else if (key == AnimName.SHOOT) {
      onStart = () => { playAudio(AudioName.SHOOT, _sfxEnabled) }
    } else if ([AnimName.SHOT_DEAD_FRONT, AnimName.SHOT_DEAD_BACK, AnimName.STRUCK_DEAD].includes(key)) {
      if (key == AnimName.SHOT_DEAD_BACK) {
        if (duelist.model == CharacterType.MALE) {
          movement.x = 0.088
          movement.frames = 2
        } else {
          movement.x = 0.176
          movement.frames = 4
        }
      }
      onStart = () => { playAudio(AudioName.BODY_FALL, _sfxEnabled) }
    } else if ([AnimName.SHOT_INJURED_FRONT, AnimName.SHOT_INJURED_BACK, AnimName.STRUCK_INJURED].includes(key)) {
      if (key == AnimName.SHOT_INJURED_BACK) {
        movement.x = 0.176
        movement.frames = 4
      }
      if (duelist.model == CharacterType.MALE) {
        onStart = () => { playAudio(AudioName.GRUNT_MALE, _sfxEnabled) }
      } else {
        onStart = () => { playAudio(AudioName.GRUNT_FEMALE, _sfxEnabled) }
      }
    } else if (key == AnimName.STRIKE_LIGHT) {
      onStart = () => { playAudio(AudioName.STRIKE_LIGHT, _sfxEnabled) }
    } else if (key == AnimName.STRIKE_HEAVY) {
      onStart = () => { playAudio(AudioName.STRIKE_HEAVY, _sfxEnabled) }
    } else if (key == AnimName.STRIKE_BLOCK) {
      onStart = () => { playAudio(AudioName.STRIKE_BLOCK, _sfxEnabled) }
    }

    if (loop) {
      duelist.actor.playLoop(key, movement, onStart, onEnd)
    } else {
      duelist.actor.playOnce(key, movement, onStart, onEnd)
    }
  }



  //----------------
  // Dispose
  //

  public dispose() {
      this.duelistA = {
        id: 'A',
        model: undefined,
        name: undefined,
        actor: undefined
      }
      this.duelistB = {
        id: 'B',
        model: undefined,
        name: undefined,
        actor: undefined
      }

      this.scene = null
      this.camera = null
      this.spriteSheets = null
  }
}