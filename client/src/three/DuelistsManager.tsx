import * as THREE from 'three'
import { CharacterType, AnimName } from '/src/data/assets'
import { DuelistState } from '/src/components/ui/duel/DuelContext'
import { AudioName } from '/src/data/audioAssets'
import { Action } from '/src/utils/pistols'
import { Actor } from './SpriteSheetMaker'
import { _sfxEnabled, AnimationState, emitter, playAudio, shakeCamera } from './game'
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
  private spriteSheets: any

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
    this.spriteSheets = spriteSheets

    this.loadDuelists()

    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)

    this.duelProgressDialogManger = new ProgressDialogManager(scene, camera, positionA, positionB)
  }

  private loadDuelists() {
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistA.actor = new Actor(this.duelistA.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, false)
    this.scene.add(this.duelistA.actor.mesh)
    this.hideActor(true)
    
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)
    this.duelistB.actor = new Actor(this.duelistB.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, true)
    this.scene.add(this.duelistB.actor.mesh)
    this.hideActor(false)
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

  public setupDuelistA(duelistName: string, duelistModel: CharacterType, isDuelistAYou: boolean) {
    localStorage.setItem(DuelistsData.DUELIST_A_MODEL, duelistModel)
    localStorage.setItem(DuelistsData.DUELIST_A_NAME, duelistName)
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistA.actor.replaceSpriteSheets(this.spriteSheets[this.duelistA.model])

    this.duelProgressDialogManger.setDataA(duelistName, isDuelistAYou)
    
    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x + 0.1, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    this.duelProgressDialogManger.updateDialogPositions(positionA)

    this.showDialogsTimeout = setTimeout(() => {
      this.duelProgressDialogManger.showDialogs()
    }, 400)

    this.resetActorPositions()
    this.showActor(true)
  }

  public setupDuelistB(duelistName: string, duelistModel: CharacterType, isDuelistBYou: boolean) {
    localStorage.setItem(DuelistsData.DUELIST_B_MODEL, duelistModel)
    localStorage.setItem(DuelistsData.DUELIST_B_NAME, duelistName)
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)
    this.duelistB.actor.replaceSpriteSheets(this.spriteSheets[this.duelistB.model])

    this.duelProgressDialogManger.setDataB(duelistName, isDuelistBYou)

    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x - 0.1, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)
    this.duelProgressDialogManger.updateDialogPositions(null, positionB)

    this.showDialogsTimeout = setTimeout(() => {
      this.duelProgressDialogManger.showDialogs()
    }, 400)

    this.resetActorPositions()
    this.showActor(false)
  }

  private showDialogsTimeout

  public resetDuelists(): boolean {
    if (!this.duelistA.model || !this.duelistB.model) return false //TODO change if duelistmanager makes it so its always created to remove this if not check in duelist manager

    this.duelistA.actor?.stop()
    this.duelistB.actor?.stop()

    this.playActorAnimation(this.duelistA, AnimName.STILL, null, true)
    this.playActorAnimation(this.duelistB, AnimName.STILL, null, true)

    this.duelProgressDialogManger.showDialogs()

    this.hideActor(true)
    this.hideActor(false)

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

  public showActor(isA: boolean) {
    if (isA) {
      this.duelistA.actor.mesh.visible = true
    } else {
      this.duelistB.actor.mesh.visible = true
    }
  }

  public hideActor(isA: boolean) {
    if (isA) {
      this.duelistA.actor.mesh.visible = false
    } else {
      this.duelistB.actor.mesh.visible = false
    }
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
    } else {
      _updateB()
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
    } else {
      _updateA()
    }
  }

  private finishAnimation(healthA, healthB) {
    console.log('finishAnimation', healthA, healthB)
    emitter.emit('animated', AnimationState.Finished)
    this.duelProgressDialogManger.hideDialogs()
    this.duelProgressDialogManger.showDialogEnd(healthA, healthB)
  }

  public animateActions(actionA: Action, actionB: Action, healthA: number, healthB: number) {
    if(this.showDialogsTimeout) clearTimeout(this.showDialogsTimeout)
    
    const animA = this.getActionAnimName(actionA)
    const animB = this.getActionAnimName(actionB)

    let survivedCount = 0
    const checkBothSurvived = () => {
      survivedCount++
      if (survivedCount === 2) {
        emitter.emit('animated', AnimationState.Finished)
      }
    }

    // Handle seppuku cases first
    if (animA === AnimName.SEPPUKU) {
      this.playActorAnimation(this.duelistA, AnimName.SEPPUKU, () => this.finishAnimation(healthA, healthB))
    }

    if (animB === AnimName.SEPPUKU) {
      this.playActorAnimation(this.duelistB, AnimName.SEPPUKU, () => this.finishAnimation(healthA, healthB))
    }

    if (animA == AnimName.SEPPUKU || animB == AnimName.SEPPUKU) {
      return
    }

    // Handle normal combat animations
    if (healthA === 0) {
      this.playActorAnimation(this.duelistA, AnimName.STRUCK_DEAD, () => this.finishAnimation(healthA, healthB))
    } else if (healthA < 3) {
      this.playActorAnimation(this.duelistA, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
      checkBothSurvived()
    } else {
      checkBothSurvived()
    }

    if (healthB === 0) {
      this.playActorAnimation(this.duelistB, AnimName.STRUCK_DEAD, () => this.finishAnimation(healthA, healthB))
    } else if (healthB < 3) {
      this.playActorAnimation(this.duelistB, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
      checkBothSurvived()
    } else {
      checkBothSurvived()
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
      onStart = () => { 
        playAudio(AudioName.SHOOT, _sfxEnabled)
        setTimeout(() => {
          shakeCamera(150, 0.01)
        }, 900)
      }
    } else if ([AnimName.SHOT_DEAD_FRONT, AnimName.SHOT_DEAD_BACK, AnimName.STRUCK_DEAD].includes(key)) {
      if (key == AnimName.SHOT_DEAD_BACK) {
        if (duelist.model == CharacterType.MALE) {
          movement.x = 0.352 + 0.088
          movement.frames = 8 + 2
        } else {
          movement.x = 0.352 + 0.176
          movement.frames = 8 + 4
        }
      }
      onStart = () => { playAudio(AudioName.BODY_FALL, _sfxEnabled) }
    } else if ([AnimName.SHOT_INJURED_FRONT, AnimName.SHOT_INJURED_BACK, AnimName.STRUCK_INJURED].includes(key)) {
      if (key == AnimName.SHOT_INJURED_BACK) {
        movement.x = 0.352 * 2
        movement.frames = 8 * 2
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
    this.spriteSheets = null
  }
}