import * as THREE from 'three'
import { CharacterType, AnimName } from '/src/data/assets'
import { DuelistState } from '/src/components/ui/duel/DuelContext'
import { AudioName } from '/src/data/audioAssets'
import { Action } from '/src/utils/pistols'
import { Actor } from './SpriteSheetMaker'
import { Card } from './CardMesh'
import { _sfxEnabled, AnimationState, emitter, playAudio, shakeCamera } from './game'
import { ProgressDialogManager } from './ProgressDialog'

const ACTOR_WIDTH = 2.5
const ACTOR_HEIGHT = 1.35
const PACES_X_0 = 0.5
const ACTOR_Z = 2

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
  spawnCard: Actor,
  spawnExplosion: Actor,
  cardMesh: Card
}

export class DuelistsManager {
  
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private spriteSheets: any

  private duelProgressDialogManger: ProgressDialogManager

  private speedFactor: number = 1

  public duelistA: Duelist = {
    id: 'A',
    model: undefined,
    name: undefined,
    actor: undefined,
    spawnCard: undefined,
    spawnExplosion: undefined,
    cardMesh: undefined
  }
  public duelistB: Duelist = {
    id: 'B',
    model: undefined,
    name: undefined,
    actor: undefined,
    spawnCard: undefined,
    spawnExplosion: undefined,
    cardMesh: undefined
  }
 
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, spriteSheets: any) {
     
    this.scene = scene
    this.camera = camera
    this.spriteSheets = spriteSheets

    this.loadDuelists()

    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)

    this.duelProgressDialogManger = new ProgressDialogManager(scene, camera, positionA, positionB)
  }

  private loadDuelists() {
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistA.actor = new Actor(this.duelistA.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, ACTOR_Z, false)
    this.duelistA.spawnCard = new Actor(this.spriteSheets.CARD, ACTOR_WIDTH * 1.2, ACTOR_HEIGHT * 1.1, PACES_X_0, ACTOR_Z - 0.04, false)
    this.duelistA.spawnExplosion = new Actor(this.spriteSheets.EXPLOSION, ACTOR_WIDTH * 1.2, ACTOR_HEIGHT * 1.2, PACES_X_0, ACTOR_Z - 0.06, false)
    this.duelistA.cardMesh = new Card(true, PACES_X_0, ACTOR_Z - 0.02, this.camera)
    
    this.scene.add(this.duelistA.actor.mesh)
    this.scene.add(this.duelistA.spawnCard.mesh)
    this.scene.add(this.duelistA.spawnExplosion.mesh)
    this.scene.add(this.duelistA.cardMesh)
    
    this.hideActor(true)
    
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)
    this.duelistB.actor = new Actor(this.duelistB.model == CharacterType.MALE ? this.spriteSheets.MALE : this.spriteSheets.FEMALE, ACTOR_WIDTH, ACTOR_HEIGHT, PACES_X_0, ACTOR_Z, true)
    this.duelistB.spawnCard = new Actor(this.spriteSheets.CARD, ACTOR_WIDTH * 1.2, ACTOR_HEIGHT * 1.1, PACES_X_0, ACTOR_Z - 0.04, true)
    this.duelistB.spawnExplosion = new Actor(this.spriteSheets.EXPLOSION, ACTOR_WIDTH * 1.2, ACTOR_HEIGHT * 1.2, PACES_X_0, ACTOR_Z - 0.06, true)
    this.duelistB.cardMesh = new Card(false, PACES_X_0, ACTOR_Z - 0.02, this.camera)
    
    this.scene.add(this.duelistB.actor.mesh)
    this.scene.add(this.duelistB.spawnCard.mesh)
    this.scene.add(this.duelistB.spawnExplosion.mesh)
    this.scene.add(this.duelistB.cardMesh)
    
    this.hideActor(false)
  }

  //-------------------------------------------
  // Game Loop
  //

  public update(deltaTime: number, elapsedTime: number) {
    this.duelistA.actor?.update(elapsedTime)
    this.duelistA.spawnCard?.update(elapsedTime)
    this.duelistA.spawnExplosion?.update(elapsedTime)
    
    this.duelistB.actor?.update(elapsedTime)
    this.duelistB.spawnCard?.update(elapsedTime)
    this.duelistB.spawnExplosion?.update(elapsedTime)

    this.duelProgressDialogManger.update(this.duelistA.actor.mesh.position.x + 0.1, this.duelistB.actor.mesh.position.x - 0.1)
  }


  //----------------
  // New duel setup reset
  //

  private spawnHighlightA: () => void
  private spawnHighlightB: () => void
  private duelistsSpawned = false

  public setupDuelistA(duelistName: string, duelistModel: CharacterType, isDuelistAYou: boolean, frontMaterialPath: string, backMaterialPath: string, spawnHighlight: () => void) {
    localStorage.setItem(DuelistsData.DUELIST_A_MODEL, duelistModel)
    localStorage.setItem(DuelistsData.DUELIST_A_NAME, duelistName)
    this.duelistA.model = localStorage.getItem(DuelistsData.DUELIST_A_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistA.name = localStorage.getItem(DuelistsData.DUELIST_A_NAME)
    this.duelistA.actor.replaceSpriteSheets(this.spriteSheets[this.duelistA.model])

    this.spawnHighlightA = spawnHighlight

    this.duelProgressDialogManger.setDataA(duelistName, isDuelistAYou)
    
    const positionA = new THREE.Vector3(this.duelistA.actor.mesh.position.x + 0.1, ACTOR_HEIGHT * (this.duelistA.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistA.actor.mesh.position.z)
    this.duelProgressDialogManger.updateDialogPositions(positionA)

    this.resetActorPositions()

    // Reset card mesh to prepare for the animation
    this.duelistA.cardMesh.reset()
    this.duelistA.cardMesh.setLoadCompleteCallback(() => {
      this.deferAnimateExplosion(true)
    })
    this.duelistA.cardMesh.setFrontMaterialPath(frontMaterialPath)
    this.duelistA.cardMesh.setBackMaterialPath(backMaterialPath)
  }

  public setupDuelistB(duelistName: string, duelistModel: CharacterType, isDuelistBYou: boolean, frontMaterialPath: string, backMaterialPath: string, spawnHighlight: () => void) {
    localStorage.setItem(DuelistsData.DUELIST_B_MODEL, duelistModel)
    localStorage.setItem(DuelistsData.DUELIST_B_NAME, duelistName)
    this.duelistB.model = localStorage.getItem(DuelistsData.DUELIST_B_MODEL) == CharacterType.MALE ? CharacterType.MALE : CharacterType.FEMALE
    this.duelistB.name = localStorage.getItem(DuelistsData.DUELIST_B_NAME)
    this.duelistB.actor.replaceSpriteSheets(this.spriteSheets[this.duelistB.model])

    this.spawnHighlightB = spawnHighlight

    this.duelProgressDialogManger.setDataB(duelistName, isDuelistBYou)

    const positionB = new THREE.Vector3(this.duelistB.actor.mesh.position.x - 0.1, ACTOR_HEIGHT * (this.duelistB.model == CharacterType.MALE ? 0.85 : 0.75), this.duelistB.actor.mesh.position.z)
    this.duelProgressDialogManger.updateDialogPositions(null, positionB)

    this.resetActorPositions()
    
    // Reset card mesh to prepare for the animation
    this.duelistB.cardMesh.reset()
    this.duelistB.cardMesh.setLoadCompleteCallback(() => {
      this.deferAnimateExplosion(false)
    })
    this.duelistB.cardMesh.setFrontMaterialPath(frontMaterialPath)
    this.duelistB.cardMesh.setBackMaterialPath(backMaterialPath)
  }

  private animateExplosionTimeoutA: NodeJS.Timeout
  private animateExplosionTimeoutB: NodeJS.Timeout
  private showActorTimeoutA: NodeJS.Timeout
  private showActorTimeoutB: NodeJS.Timeout

  public clearAnimationTimeouts(timeout: NodeJS.Timeout) {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  private deferAnimateExplosion(isA: boolean, delay: number = 1000) {
    this.clearAnimationTimeouts(isA ? this.animateExplosionTimeoutA : this.animateExplosionTimeoutB)
    this.clearAnimationTimeouts(isA ? this.showActorTimeoutA : this.showActorTimeoutB)
    
    if (this.duelistsSpawned) {
      this.onLoadCompleteCallback?.()
      this.showActor(isA)
      if (isA) {
        this.spawnHighlightA()
      } else {
        this.spawnHighlightB()
      }
      this.duelProgressDialogManger.showDialogs()
      return
    }

    let timeout;
    let showActorTimeout;
    
    timeout = setTimeout(() => {
      const duelist = isA ? this.duelistA : this.duelistB;
    
      duelist.cardMesh.playEnter(() => {
        this.duelistsSpawned = true
        this.animateExplosion(isA)
        
        showActorTimeout = setTimeout(() => {
          this.onLoadCompleteCallback?.()
          this.showActor(isA)
          if (isA) {
            this.spawnHighlightA()
          } else {
            this.spawnHighlightB()
          }
          this.showDialogsTimeout = setTimeout(() => {
            this.duelProgressDialogManger.showDialogs()
          }, 400 / this.speedFactor)
        }, (400 + ((1000 / 8.0) * 3.0)) / this.speedFactor)
      });
    }, delay)

    if (isA) {
      this.animateExplosionTimeoutA = timeout
      this.showActorTimeoutA = showActorTimeout
    } else {
      this.animateExplosionTimeoutB = timeout
      this.showActorTimeoutB = showActorTimeout
    }
  }

  private onLoadCompleteCallback: () => void

  public setLoadCompleteCallback(callback: () => void) {
    this.onLoadCompleteCallback = callback
  }

  public resetDuelistsSpawned() {
    this.duelistsSpawned = false;
    
    this.clearAnimationTimeouts(this.animateExplosionTimeoutA);
    this.clearAnimationTimeouts(this.animateExplosionTimeoutB);
    this.clearAnimationTimeouts(this.showActorTimeoutA);
    this.clearAnimationTimeouts(this.showActorTimeoutB);
    
    if (this.showDialogsTimeout) {
      clearTimeout(this.showDialogsTimeout);
      this.showDialogsTimeout = null;
    }
  }

  private showDialogsTimeout

  public resetDuelists(): boolean {
    if (!this.duelistA.model || !this.duelistB.model) return false //TODO change if duelistmanager makes it so its always created to remove this if not check in duelist manager

    this.duelistA.actor?.stop()
    this.duelistB.actor?.stop()

    this.playActorAnimation(this.duelistA, AnimName.STILL, null, true)
    this.playActorAnimation(this.duelistB, AnimName.STILL, null, true)

    if (!this.duelistsSpawned) {
      this.duelistA.spawnCard.playLoop(AnimName.STILL, null, () => {
        this.duelistA.spawnCard.mesh.visible = true
      }, null)
      this.duelistB.spawnCard.playLoop(AnimName.STILL, null, () => {
        this.duelistB.spawnCard.mesh.visible = true
      }, null)

      this.duelistA.spawnExplosion.mesh.visible = false
      this.duelistB.spawnExplosion.mesh.visible = false

      // Reset card meshes
      this.duelistA.cardMesh.reset()
      this.duelistB.cardMesh.reset()

      this.hideActor(true)
      this.hideActor(false)

      this.duelProgressDialogManger.resetDialogs()

      this.hideElements()
    } else {
      this.showElements()
    }

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

  public showElements() {
    this.duelProgressDialogManger.showDialogs()
  }

  public setDuelistSpeedFactor(speedFactor) {
    this.duelistA.actor.setSpeedFactor(speedFactor)
    this.duelistA.spawnCard.setSpeedFactor(speedFactor)
    this.duelistA.spawnExplosion.setSpeedFactor(speedFactor)
    this.duelistA.cardMesh.setSpeedFactor(speedFactor)

    this.duelistB.actor.setSpeedFactor(speedFactor)
    this.duelistB.spawnCard.setSpeedFactor(speedFactor)
    this.duelistB.spawnExplosion.setSpeedFactor(speedFactor)
    this.duelistB.cardMesh.setSpeedFactor(speedFactor)

    this.speedFactor = speedFactor
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
    this.playActorAnimation(this.duelistA, AnimName.STILL_BLADE, null, true)
    this.playActorAnimation(this.duelistB, AnimName.STILL_BLADE, null, true)
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
          } else {
            _updateB()
          }
        } else {
          if (statsB.health == 0) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_DEAD_BACK, () => _updateB())
          } else if (statsB.health < 3) {
            this.playActorAnimation(this.duelistB, AnimName.SHOT_INJURED_BACK, () => _updateB())
          } else {
            _updateB()
          }
        }
      } else {
        _updateB()
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
          } else {
            _updateA()
          }
        } else {
          if (statsA.health == 0) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_DEAD_BACK, () => _updateA())
          } else if (statsA.health < 3) {
            this.playActorAnimation(this.duelistA, AnimName.SHOT_INJURED_BACK, () => _updateA())
          } else {
            _updateA()
          }
        }
      } else {
        _updateA()
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
      // this.playActorAnimation(this.duelistA, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
      checkBothSurvived()
    } else {
      checkBothSurvived()
    }

    if (healthB === 0) {
      this.playActorAnimation(this.duelistB, AnimName.STRUCK_DEAD, () => this.finishAnimation(healthA, healthB))
    } else if (healthB < 3) {
      // this.playActorAnimation(this.duelistB, AnimName.STRUCK_INJURED, () => this.finishAnimation(healthA, healthB))
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

  public playActorAnimationTest(duelist: string, key: AnimName) {
    if (duelist == 'A') {
      this.playActorAnimation(this.duelistA, key, null, false)
    } else {
      this.playActorAnimation(this.duelistB, key, null, false)
    }
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
        playAudio(AudioName.SHOOT, _sfxEnabled, 0.0, this.speedFactor)
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
      onStart = () => { playAudio(AudioName.BODY_FALL, _sfxEnabled, 0.0, this.speedFactor) }
    } else if ([AnimName.SHOT_INJURED_FRONT, AnimName.SHOT_INJURED_BACK].includes(key)) {
      if (duelist.model == CharacterType.MALE && key == AnimName.SHOT_INJURED_BACK) {
        movement.x = 0.352
        movement.frames = 8
      } else if (duelist.model == CharacterType.FEMALE && key == AnimName.SHOT_INJURED_BACK) {
        movement.x = 0.352 * 2
        movement.frames = 8 * 2
      }
      if (duelist.model == CharacterType.MALE) {
        onStart = () => { playAudio(AudioName.GRUNT_MALE, _sfxEnabled, 0.0, this.speedFactor) }
      } else {
        onStart = () => { playAudio(AudioName.GRUNT_FEMALE, _sfxEnabled, 0.0, this.speedFactor) }
      }
    } else if (key == AnimName.STRIKE_LIGHT) {
      onStart = () => { playAudio(AudioName.STRIKE_LIGHT, _sfxEnabled, 0.0, this.speedFactor) }
    } else if (key == AnimName.STRIKE_HEAVY) {
      onStart = () => { playAudio(AudioName.STRIKE_HEAVY, _sfxEnabled, 0.0, this.speedFactor) }
    } else if (key == AnimName.STRIKE_BLOCK) {
      onStart = () => { playAudio(AudioName.STRIKE_BLOCK, _sfxEnabled, 0.0, this.speedFactor) }
    }

    if (loop) {
      duelist.actor.playLoop(key, movement, onStart, onEnd)
    } else {
      duelist.actor.playOnce(key, movement, onStart, onEnd)
    }
  }

  public animateExplosion(isA: boolean) {
    const duelist = isA ? this.duelistA : this.duelistB
    setTimeout(() => {
      duelist.cardMesh.hide()
    }, ((1000 / 8.0) * 4) / this.speedFactor)
    duelist.spawnCard.playOnce(AnimName.BURN, { x: 0, y: 0, z: 0, frames: 0 }, null, () => {
      duelist.spawnCard.mesh.visible = false
    })

    setTimeout(() => {
      duelist.spawnExplosion.playOnce(AnimName.EXPLODE, { x: 0, y: 0, z: 0, frames: 0 }, () => {
        duelist.spawnExplosion.mesh.visible = true
      }, () => {
        duelist.spawnExplosion.mesh.visible = false
      })
    }, (400 / this.speedFactor))
  }

  //----------------
  // Dispose
  //

  public dispose() {
    // Clean up card meshes
    if (this.duelistA.cardMesh) {
      this.duelistA.cardMesh.resetAnimations();
      this.scene.remove(this.duelistA.cardMesh);
    }
    
    if (this.duelistB.cardMesh) {
      this.duelistB.cardMesh.resetAnimations();
      this.scene.remove(this.duelistB.cardMesh);
    }
    
    this.duelistA = {
      id: 'A',
      model: undefined,
      name: undefined,
      actor: undefined,
      spawnCard: undefined,
      spawnExplosion: undefined,
      cardMesh: undefined
    }
    this.duelistB = {
      id: 'B',
      model: undefined,
      name: undefined,
      actor: undefined,
      spawnCard: undefined,
      spawnExplosion: undefined,
      cardMesh: undefined
    }

    this.scene = null
    this.spriteSheets = null
  }

}