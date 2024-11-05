import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

import { CharacterType, AudioName, AnimName } from '@/pistols/data/assets'
import { Action, ActionTypes } from '@/pistols/utils/pistols'

import { Actor } from './SpriteSheetMaker'
import { _sfxEnabled, AnimationState, ASPECT, emitter, playAudio } from './game'
import { ProgressDialogManager } from './ProgressDialog'
import { DuelistState } from '../components/scenes/Duel'

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

  public setDuelistSpeedFactor(speedFactor) {
    this.duelistA.actor.setSpeedFactor(speedFactor)
    this.duelistB.actor.setSpeedFactor(speedFactor)
  }


  //----------------
  // Animate duel
  //

  public resetActorPositions() {
    this.duelistA.actor.mesh.position.set(PACES_X_0, this.duelistA.actor.mesh.position.y, this.duelistA.actor.mesh.position.z)
    this.duelistB.actor.mesh.position.set(-PACES_X_0, this.duelistB.actor.mesh.position.y, this.duelistB.actor.mesh.position.z)
  }

  public animateDuelistBlade() {
    this.playActorAnimation(this.duelistA, AnimName.STILL_BLADE)
    this.playActorAnimation(this.duelistB, AnimName.STILL_BLADE)
  }

  public animatePace(pace: number, statsA: DuelistState, statsB: DuelistState) {
    if (!statsA || !statsB) return
    const step: AnimName = pace % 2 == 1 ? AnimName.STEP_2 : AnimName.STEP_1

    const hasDuelistAShotThisRound = statsA.shotPaces == pace
    const hasDuelistADodgedThisRound = statsA.dodgePaces == pace

    const hasDuelistBShotThisRound = statsB.shotPaces == pace
    const hasDuelistBDodgedThisRound = statsB.dodgePaces == pace

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
        if (statsA.health == 0 || statsB.health == 0) {
          this.finishAnimation(statsA.health, statsB.health)
        }
      }
    }

    if (hasDuelistAShotThisRound) {
      this.playActorAnimation(this.duelistA, AnimName.SHOOT)
    } else if (hasDuelistADodgedThisRound) {
      if (statsA.shotPaces) {
        this.playActorAnimation(this.duelistA, AnimName.DODGE_FRONT)
      } else {
        this.playActorAnimation(this.duelistA, AnimName.DODGE_BACK)
      }
    } else if (!statsA.shotPaces) {
      if (!(hasDuelistBShotThisRound && statsA.health != 3)) {
        this.playActorAnimation(this.duelistA, step)
      }
    }

    if (hasDuelistBShotThisRound) {
      this.playActorAnimation(this.duelistB, AnimName.SHOOT)
    } else if (hasDuelistBDodgedThisRound) {
      if (statsB.shotPaces) {
        this.playActorAnimation(this.duelistB, AnimName.DODGE_FRONT)
      } else {
        this.playActorAnimation(this.duelistB, AnimName.DODGE_BACK)
      }
    } else if (!statsB.shotPaces) {
      if (!(hasDuelistAShotThisRound && statsB.health != 3)) {
        this.playActorAnimation(this.duelistB, step)
      }
    }

    if (hasDuelistAShotThisRound) {
      if (!hasDuelistBDodgedThisRound) {
        if (statsB.shotPaces) {
          if (statsB.health == 0) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_DEAD_FRONT, () => _updateB())
          } else if (statsB.health < 3) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_INJURED_FRONT, () => _updateB())
          }
        } else {
          if (statsB.health == 0) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_DEAD_BACK, () => _updateB())
          } else if (statsB.health < 3) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_INJURED_BACK, () => _updateB())
          }
        }
      }
    }

    if (hasDuelistBShotThisRound) {
      if (!hasDuelistADodgedThisRound) {
        if (statsA.shotPaces) {
          if (statsA.health == 0) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_DEAD_FRONT, () => _updateA())
          } else if (statsA.health < 3) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_INJURED_FRONT, () => _updateA())
          }
        } else {
          if (statsA.health == 0) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_DEAD_BACK, () => _updateA())
          } else if (statsA.health < 3) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_INJURED_BACK, () => _updateA())
          }
        }
      }
    }
  }

  private finishAnimation(healthA, healthB) {
    emitter.emit('animated', AnimationState.Finished)
    this.duelProgressDialogManger.hideDialogs()
    this.duelProgressDialogManger.showDialogEnd(healthA, healthB)
  }

  public animateActions(actionA: Action, actionB: Action, healthA: number, healthB: number) {
    if(this.showDialogsTimeout) clearTimeout(this.showDialogsTimeout)
    
      const animA = this.getActionAnimName(actionA)
      const animB = this.getActionAnimName(actionB)

    // animate sprites
    if (animB != AnimName.SEPPUKU || animA == AnimName.SEPPUKU) {
      this.playActorAnimation(this.duelistA, animA, () => {
        let survived = 0
        if (animA != AnimName.SEPPUKU) {
          if (healthB == 0) {
            this.playActorAnimation(this.duelistB, AnimName.STRUCK_DEAD, () => this.finishAnimation(healthA, healthB))
          } else if (healthB < 3) {
            this.playActorAnimation(this.duelistB, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
          } else {
            survived++
          }

          if (healthA == 0) {
            this.playActorAnimation(this.duelistA, AnimName.STRUCK_DEAD, () => this.finishAnimation(healthA, healthB))
          } else if (healthA < 3) {
            this.playActorAnimation(this.duelistA, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
          } else {
            survived++
          }
        } else {
          this.finishAnimation(healthA, healthB)
        }
        if (survived == 2) emitter.emit('animated', AnimationState.Finished)
      })
    }

    if (animA != AnimName.SEPPUKU || animB == AnimName.SEPPUKU) {
      this.playActorAnimation(this.duelistB, this.getActionAnimName(actionB), () => {
        if (animB == AnimName.SEPPUKU) {
          this.finishAnimation(healthA, healthB)
        }
      })
    }
  }

  private getActionAnimName = (action: Action): AnimName => {
    const result = action == Action.Grapple ? AnimName.STRIKE_LIGHT
          : action == Action.Behead ? AnimName.STRIKE_HEAVY
            : action == Action.PocketPistol ? AnimName.STRIKE_BLOCK
              : AnimName.SEPPUKU

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
    } else if (key == AnimName.DODGE_BACK) {
      movement.x = 0.352 * 2
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