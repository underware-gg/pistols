import * as THREE from 'three'
import TWEEN, { update } from '@tweenjs/tween.js'
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js' 
import { DuelStage } from '/src/hooks/useDuel'
import { _currentDuelId, _currentDuelistAId, _currentDuelistBId, sizes } from './game'

enum DuelState {
  CHOOSING_STEPS,       //I'm choosing steps
  STEPS_CHOSEN,         //I have chosen my steps but the opponent hasn't
  REVEALING_STEPS,      //I have to reveal my steps
  STEPS_REVEALED,       //I have revealed my steps but my opponent hasn't
  CHOOSING_ACTIONS,     //I'm choosing my actions
  ACTIONS_CHOSEN,       //I have chosen my actions but my opponent hasn't
  REVEALING_ACTIONS,    //I have to reveal my actions
  ACTIONS_REVEALED      //I have revealed my actions but my opponent hasn't
}

enum DuelOutcome {
  ALIVE_DEAD,
  INJURED_DEAD,
  DEAD_DEAD
}

interface DialogProperties {
  isThinkingBubble: boolean,
  messages: string[],
  opponentText: string
}

type DialogOptions = {
  [key in DuelState]: DialogProperties
}

type EndingMessages = {
  [key in DuelOutcome]: string[]
}

// Define the DialogOptions object with different states and corresponding messages
const dialogOptions: DialogOptions = {
  [DuelState.CHOOSING_STEPS]: {
    isThinkingBubble: true,
    opponentText: "I'm choosin' my steps...",
    messages: [
      "Choose your steps, quick!",
      "Decide on your steps now!",
      "What's your plan? Choose fast!",
      "Make your move, no delay!",
      "Pick your steps, time's short!",
      "Choose wisely, partner!",
      "Hurry, choose your steps!",
      "Think fast, pick steps!",
      "Time's ticking, choose!",
      "Choose your path, quick!",
      "Step up, make your choice!",
      "Decide your steps, hurry!",
      "Pick fast or regret it!",
      "Your move, no time to waste!",
      "Choose and don't dawdle!",
      "Make your steps count!",
      "Decide swiftly, partner!",
      "Hurry, pick your path!",
      "Your steps, choose now!",
      "Don't delay, pick steps!",
      "Make your choice, hurry!",
      "Fast decisions win duels!",
      "Choose quick, no time!",
      "Your move, partner!",
      "Step it up, decide!",
      "Choose steps, no delay!",
      "Pick your path fast!",
      "Decide quick, partner!",
      "Time's short, choose!",
      "Move fast, pick now!"
    ]
  },
  [DuelState.STEPS_CHOSEN]: {
    isThinkingBubble: false,
    opponentText: "",
    messages: [
      "Choose you filthy wretch!",
      "I ain't got the whole day!",
      "What are you waiting for?!",
      "Tsk, are you scared?",
      "Try and keep up, if you can!",
      "Better pick up the pace, pal!",
      "Quit stallin', make a choice!",
      "Move it, scum!",
      "Choose, you coward!",
      "Don't dawdle, pick!",
      "Get on with it, bastard!",
      "Time's wasting, scum!",
      "Hurry up, you dog!",
      "Move, filthy wretch!",
      "Pick, you mangy cur!",
      "Quit delayin', choose!",
      "Hurry, ya sluggard!",
      "What's takin' so long?",
      "Come on, scum!",
      "Get to it, bastard!",
      "Quit thinkin', act!",
      "Make a move, coward!",
      "Time's tickin', scum!",
      "Decide, you dog!",
      "Move along, wretch!",
      "Pick up the pace!",
      "Don't stall, dog!",
      "Quit waitin', choose!",
      "Get on with it, wretch!",
      "Make yer choice, scum!"
    ]
  },
  [DuelState.REVEALING_STEPS]: {
    isThinkingBubble: true,
    opponentText: "Revealin' my steps...",
    messages: [
      "Let's see what you choose.",
      "Reveal your steps!",
      "Reveal and get ready!",
      "Ready to reveal your choice?",
      "Let's get going, reveal moves!",
      "Show your hand, partner!",
      "Time to reveal, no delay!",
      "Let's see your steps!",
      "Reveal, no time to waste!",
      "Time to show your steps!",
      "Reveal your path, quick!",
      "Show us what you chose!",
      "Reveal, partner, hurry!",
      "Let's see it, no delay!",
      "Show your steps now!",
      "Reveal, time's ticking!",
      "Let's see your choice!",
      "Reveal quick, partner!",
      "Time to show your plan!",
      "Reveal your moves now!",
      "Reveal, partner, quick!",
      "Show what you chose!",
      "Reveal and prepare!",
      "Reveal your steps fast!",
      "Show your hand quick!",
      "Reveal, time's short!",
      "Let's see your steps, hurry!",
      "Reveal now, no delay!",
      "Show your path now!",
      "Reveal your steps, fast!"
    ]
  },
  [DuelState.STEPS_REVEALED]: {
    isThinkingBubble: false,
    opponentText: "",
    messages: [
      "Prepare to meet your maker!",
      "I ain't got the whole day!",
      "You're digging your grave!",
      "You're pissing me off, hurry!",
      "What? Scared?",
      "Tick-tock, reveal or die!",
      "Ready to die, scum?",
      "Make your move, coward!",
      "Quit stallin', bastard!",
      "Reveal, you cur!",
      "Get on with it, scum!",
      "Make yer choice, dog!",
      "Quit waitin', wretch!",
      "Don't dawdle, bastard!",
      "Reveal, you coward!",
      "Hurry up, scum!",
      "Time's up, show it!",
      "Move along, wretch!",
      "Get to it, bastard!",
      "Come on, scum!",
      "Reveal, ya coward!",
      "Quit delayin', dog!",
      "Make yer move, scum!",
      "Show us, bastard!",
      "Move it, wretch!",
      "Tick-tock, scum!",
      "Reveal now, coward!",
      "Hurry, ya scum!",
      "Show it, you dog!",
      "Reveal yer choice, scum!"
    ]
  },
  [DuelState.CHOOSING_ACTIONS]: {
    isThinkingBubble: true,
    opponentText: "I'm choosin' my actions...",
    messages: [
      "Choose your actions, quick!",
      "Decide your actions now!",
      "What's your plan? Act fast!",
      "Make your move, no delay!",
      "Pick actions, time's short!",
      "Choose wisely, partner!",
      "Hurry, choose your actions!",
      "Think fast, pick actions!",
      "Time's ticking, choose!",
      "Act fast, quick!",
      "Move up, make your choice!",
      "Decide actions, hurry!",
      "Pick fast or regret it!",
      "Your move, no time to waste!",
      "Choose and don't dawdle!",
      "Make your actions count!",
      "Decide swiftly, partner!",
      "Hurry, pick your path!",
      "Your actions, choose now!",
      "Don't delay, pick actions!",
      "Make your choice, hurry!",
      "Fast decisions win duels!",
      "Choose quick, no time!",
      "Your move, partner!",
      "Move it up, decide!",
      "Choose actions, no delay!",
      "Pick your path fast!",
      "Decide quick, partner!",
      "Time's short, choose!",
      "Move fast, pick now!"
    ]
  },
  [DuelState.ACTIONS_CHOSEN]: {
    isThinkingBubble: false,
    opponentText: "Revealin' my actions...",
    messages: [
      "Choose, you filthy wretch!",
      "I ain't got the whole day!",
      "What are you waiting for?!",
      "Tsk tsk, are you scared?",
      "Try and keep up, if you can!",
      "Better pick up the pace, pal!",
      "Quit stallin', make a choice!",
      "Move it, scum!",
      "Choose, you coward!",
      "Don't dawdle, pick!",
      "Get on with it, bastard!",
      "Time's wasting, scum!",
      "Hurry up, you dog!",
      "Move, filthy wretch!",
      "Pick, you mangy cur!",
      "Quit delayin', choose!",
      "Hurry, ya sluggard!",
      "What's takin' so long?",
      "Come on, scum!",
      "Get to it, bastard!",
      "Quit thinkin', act!",
      "Make a move, coward!",
      "Time's tickin', scum!",
      "Decide, you dog!",
      "Move along, wretch!",
      "Pick up the pace!",
      "Don't stall, dog!",
      "Quit waitin', choose!",
      "Get on with it, wretch!",
      "Make yer choice, scum!"
    ]
  },
  [DuelState.REVEALING_ACTIONS]: {
    isThinkingBubble: true,
    opponentText: "",
    messages: [
      "Reveal your actions now!",
      "Show us your move, quick!",
      "Reveal your plan, hurry!",
      "Let's see it, no delay!",
      "Reveal actions, partner!",
      "Show your hand, quick!",
      "Time to reveal, no wait!",
      "Reveal your move now!",
      "Let's see your actions!",
      "Reveal, time's ticking!",
      "Show your path quick!",
      "Reveal actions, hurry!",
      "Reveal now, partner!",
      "Let's see your choice!",
      "Reveal, time's short!",
      "Show your hand fast!",
      "Reveal, partner, quick!",
      "Show what you chose!",
      "Reveal and prepare!",
      "Reveal your moves fast!",
      "Show your hand quick!",
      "Reveal, no delay!",
      "Let's see your actions!",
      "Reveal now, no wait!",
      "Reveal your steps fast!",
      "Show it now, hurry!",
      "Reveal your path, quick!",
      "Let's see your actions!",
      "Reveal quick, partner!",
      "Show your move now!"
    ]
  },
  [DuelState.ACTIONS_REVEALED]: {
    isThinkingBubble: false,
    opponentText: "",
    messages: [
      "Prepare to meet your maker!",
      "I ain't got the whole day!",
      "You're digging your grave!",
      "You're pissing me off, hurry!",
      "What? Scared?",
      "Tick-tock, reveal or die!",
      "Ready to die, scum?",
      "Make your move, coward!",
      "Quit stallin', bastard!",
      "Reveal, you cur!",
      "Get on with it, scum!",
      "Make yer choice, dog!",
      "Quit waitin', wretch!",
      "Don't dawdle, bastard!",
      "Reveal, you coward!",
      "Hurry up, scum!",
      "Time's up, show it!",
      "Move along, wretch!",
      "Get to it, bastard!",
      "Come on, scum!",
      "Reveal, ya coward!",
      "Quit delayin', dog!",
      "Make yer move, scum!",
      "Show us, bastard!",
      "Move it, wretch!",
      "Tick-tock, scum!",
      "Reveal now, coward!",
      "Hurry, ya scum!",
      "Show it, you dog!",
      "Reveal yer choice, scum!"
    ]
  }
}

// Define the EndingMessages object with the different outcomes and corresponding messages
const duelEndingMessages: EndingMessages = {
  [DuelOutcome.ALIVE_DEAD]: [
    // Proud
    "Got what ye deserved, poltroon.",
    "Down ye go, scum.",
    "Dead like a dog, bastard.",
    "Victory's mine, wretch.",
    "Rest in hell, ye swine.",
    "I'm the victor, ye dog.",
    "Dead as dirt, fool.",
    "Proud o' this kill, scum.",
    "Gotcha, ye filthy bastard.",
    "Yer end's come, wretch.",

    // Got what you deserved scum
    "Deserved it, ye scum.",
    "Justice served, caitiff.",
    "Rot in hell, swine.",
    "Got what ye earned, dog.",
    "Death suits ya, wretch.",
    "Fate's cruel, bastard.",
    "Deserved every bit, scum.",
    "Yer fate's sealed, varlet.",
    "Justice done, ye dog.",
    "Earned yer death, swine."
  ],
  [DuelOutcome.INJURED_DEAD]: [
    // Angry but won
    "Ye died, damn ya!",
    "Won, but damn ye!",
    "Fuck ya, scum!",
    "Cursed win, heretic!",
    "Won, but damn ya, dog!",
    "Damn ya, wretch!",
    "Won, but fuck ya, swine!",
    "Cursed win, scum!",
    "Damn ya, filthy cur!",
    "Won, but damn ya, dog!",

    // Close one
    "Close call, bastard.",
    "Too close, scum.",
    "Barely won, dog.",
    "Close one, wretch.",
    "Damn near lost, swine.",
    "Too close, ye serf.",
    "Near miss, scum.",
    "Barely made it, dog.",
    "Close win, wretch.",
    "Too damn close, damn you.",

    // Proud
    "Proud win, snake.",
    "Won, ye scum.",
    "Victory's mine, dog.",
    "Proud o' this, wretch.",
    "Won the duel, swine.",
    "In the dirt with ye, bastard.",
    "I won, ye fool.",
    "Victory's sweet, dog.",
    "Proud o' this win, wretch.",
    "I won, ye filthy swine."
  ],
  [DuelOutcome.DEAD_DEAD]: [
    // Empty because no messages for both dead
  ]
}


export class ProgressDialogManager {

  private dialogA: ProgressDialogMesh
  private dialogB: ProgressDialogMesh

  private lastDuelStageA: any
  private lastDuelStageB: any
  private lastDuelStateA: DuelState
  private lastDuelStateB: DuelState
  private lastDuelOutcomeA: DuelOutcome
  private lastDuelOutcomeB: DuelOutcome

  private isDialogAYou: boolean = true

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, duelistAPosition: THREE.Vector3, duelistBPosition: THREE.Vector3) {
    this.dialogA = new ProgressDialogMesh(camera, duelistAPosition, true)
    this.dialogB = new ProgressDialogMesh(camera, duelistBPosition, false)
  }

  public setDataA(duelistAName: string, isYouA: boolean) {
    this.isDialogAYou = isYouA

    this.dialogA.setDuelistData(duelistAName, isYouA)
  }

  public setDataB(duelistBName: string, isYouB: boolean) {
    this.dialogB.setDuelistData(duelistBName, isYouB)
  }

  public setElementData(isA: boolean, duelistElement: any) {
    if (isA) {
      this.dialogA.setElement(duelistElement)
    } else {
      this.dialogB.setElement(duelistElement)
    }
  }

  public showDialogs() {
    this.dialogA.showElement()
    this.dialogB.showElement()
  }
  
  public resetDialogs() {
    this.dialogA.reset()
    this.dialogB.reset()
  }

  public hideDialogs() {
    this.dialogA.hideElement()
    this.dialogB.hideElement()
  }

  public updateDialogPositions(positionA?: THREE.Vector3, positionB?: THREE.Vector3) {
    if (positionA) {
      this.dialogA.updatePosition(positionA)
    }
    if (positionB) {
      this.dialogB.updatePosition(positionB)
    }
  }

  public update(duelistAPositionX: number, duelistBPositionX: number) {
    //TODO check why position is not updated??
    this.dialogA.updatePosition(duelistAPositionX)
    this.dialogB.updatePosition(duelistBPositionX)

    this.dialogA.update()
    this.dialogB.update()
  }

  public updateDialogState(isA: boolean, stage: any, onClick: any): boolean {
    if (isA) {
      this.lastDuelStageA = stage
      this.dialogA.updateElementClick(onClick)
    } else {
      this.lastDuelStageB = stage
      this.dialogB.updateElementClick(onClick)
    }

    if (!this.lastDuelStageA || !this.lastDuelStageB) return false

    const { stateA, stateB } = this.findCurrentDuelStates(this.lastDuelStageA, this.lastDuelStageB)

    const dialogAProps = dialogOptions[stateA]
    if (this.lastDuelStateA != stateA || !this.dialogA.message) {
      const messageIndex = ((_currentDuelId * 31) + (_currentDuelistAId * 17)) % dialogAProps.messages.length

      const messageA = this.isDialogAYou
        ? dialogAProps.messages[messageIndex]
        : dialogAProps.isThinkingBubble
        ? dialogAProps.opponentText
        : dialogAProps.messages[messageIndex]

      this.dialogA.updateElementData(dialogAProps.isThinkingBubble, messageA)
    }

    const dialogBProps = dialogOptions[stateB]
    if (this.lastDuelStateB != stateB || !this.dialogB.message) {
      const messageIndex = ((_currentDuelId * 31) + (_currentDuelistBId * 17)) % dialogBProps.messages.length

      const messageB = !this.isDialogAYou
        ? dialogBProps.messages[messageIndex]
        : dialogBProps.isThinkingBubble
        ? dialogBProps.opponentText
        : dialogBProps.messages[messageIndex]

      this.dialogB.updateElementData(dialogBProps.isThinkingBubble, messageB)
    }

    this.lastDuelStateA = stateA
    this.lastDuelStateB = stateB

    return isA ? dialogAProps.isThinkingBubble : dialogBProps.isThinkingBubble
  }

  private findCurrentDuelStates(stageA: any, stageB: any): { stateA: DuelState, stateB: DuelState } {
    let stateA, stateB

    if (stageA[DuelStage.Round1Commit] == false) stateA = DuelState.CHOOSING_STEPS
    else if (stageA[DuelStage.Round1Reveal] == false) stateA = DuelState.REVEALING_STEPS
    else stateA = DuelState.ACTIONS_REVEALED

    if (stageB[DuelStage.Round1Commit] == false) stateB = DuelState.CHOOSING_STEPS
    else if (stageB[DuelStage.Round1Reveal] == false) stateB = DuelState.REVEALING_STEPS
    else stateB = DuelState.ACTIONS_REVEALED

    if (stateA == DuelState.REVEALING_STEPS && stateB == DuelState.CHOOSING_STEPS) stateA = DuelState.STEPS_CHOSEN
    else if (stateB == DuelState.REVEALING_STEPS && stateA == DuelState.CHOOSING_STEPS) stateB = DuelState.STEPS_CHOSEN
    else if (stateA == DuelState.CHOOSING_ACTIONS && stateB == DuelState.REVEALING_STEPS) stateA = DuelState.STEPS_REVEALED
    else if (stateB == DuelState.CHOOSING_ACTIONS && stateA == DuelState.REVEALING_STEPS) stateB = DuelState.STEPS_REVEALED
    else if (stateA == DuelState.REVEALING_ACTIONS && stateB == DuelState.CHOOSING_ACTIONS) stateA = DuelState.ACTIONS_CHOSEN
    else if (stateB == DuelState.REVEALING_ACTIONS && stateA == DuelState.CHOOSING_ACTIONS) stateB = DuelState.ACTIONS_CHOSEN

    return { stateA, stateB }
  }

  public showDialogEnd(healthA: number, healthB: number) {
    // Handle duelist A outcome independently
    let outcomeA: DuelOutcome
    if (healthA > 0 && healthB == 0) {
      outcomeA = healthA == 3 ? DuelOutcome.ALIVE_DEAD : DuelOutcome.INJURED_DEAD
    } else {
      outcomeA = DuelOutcome.DEAD_DEAD
    }

    // Handle duelist B outcome independently
    let outcomeB: DuelOutcome
    if (healthB > 0 && healthA == 0) {
      outcomeB = healthB == 3 ? DuelOutcome.ALIVE_DEAD : DuelOutcome.INJURED_DEAD
    } else {
      outcomeB = DuelOutcome.DEAD_DEAD
    }

    // Update dialog A independently
    if (this.lastDuelOutcomeA != outcomeA) {
      const messageA = duelEndingMessages[outcomeA][Math.floor(Math.random() * duelEndingMessages[outcomeA].length)]
      this.dialogA.updateElementData(false, messageA)
      if (outcomeA != DuelOutcome.DEAD_DEAD) {
        this.dialogA.showElement()
      }
    }

    // Update dialog B independently
    if (this.lastDuelOutcomeB != outcomeB) {
      const messageB = duelEndingMessages[outcomeB][Math.floor(Math.random() * duelEndingMessages[outcomeB].length)]
      this.dialogB.updateElementData(false, messageB)
      if (outcomeB != DuelOutcome.DEAD_DEAD) {
        this.dialogB.showElement()
      }
    }

    this.lastDuelOutcomeA = outcomeA
    this.lastDuelOutcomeB = outcomeB
  }

}


export class ProgressDialogMesh {

  private camera: THREE.Camera
  private element: HTMLElement
  private position: THREE.Vector3
  private originalPositionY: number
  
  private isLeft: boolean
  private isYou: boolean

  private shouldBeVisible: boolean = false
  private dialogTitle: string
  private duelistName: string
  private isThinkingBubble: boolean
  public message: string
  private onButtonClick: () => void

  constructor(camera: THREE.PerspectiveCamera, position: THREE.Vector3, isLeft: boolean) {
    this.camera = camera
    this.isLeft = isLeft
    this.position = position
    this.originalPositionY = position.y

    this.dialogTitle = this.isLeft ? 'Challenger' : 'Challenged'
    this.shouldBeVisible = false
  }

  public setElement(element: HTMLElement) {
    this.element = element

    const button = this.element.querySelector('.dialog-button') as HTMLElement
    button.addEventListener('click', (event) => {
      this.onButtonClick()
    })

    this.updateElement()
  }

  public updatePosition(newPosition: number | THREE.Vector3) {
    if (newPosition instanceof THREE.Vector3) {
      this.position = newPosition
      this.originalPositionY = newPosition.y
    } else {
      this.position.x = newPosition
    }
  }

  public setDuelistData(duelistName: string, isYou: boolean) {
    this.duelistName = duelistName
    this.isYou = isYou
    this.shouldBeVisible = true

    this.updateElement()
  }

  public reset() {
    this.duelistName = ''
    this.isYou = false
    this.shouldBeVisible = false
    this.updateElement()
  }

  public updateElementData(isThinkingBubble: boolean, message: string) {
    this.isThinkingBubble = isThinkingBubble
    this.message = message
    
    this.updateElement()
  }

  public updateElementClick(onButtonClick: () => void) {
    this.onButtonClick = onButtonClick
  }

  public update() {
    if (!this.element) return

    const screenPosition = this.position.clone()
    screenPosition.project(this.camera)

    const translateX = screenPosition.x * (sizes.canvasWidth * 0.5)
    const translateY = -screenPosition.y * (sizes.canvasHeight * 0.5)

    const initialCameraZ = -8
    const elementZ = this.position.z

    const initialDistance = Math.abs(initialCameraZ - elementZ)
    const currentDistance = Math.abs(this.camera.position.z - elementZ)
    const zScale = initialDistance / currentDistance

    const screenCenterDistance = Math.abs(this.position.x) / 6
    this.position.y = this.originalPositionY + (screenCenterDistance * 0.5)

    const scale = zScale + screenCenterDistance

    this.element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
  }

  private updateElement() {
    if (!this.element) return

    const bubbleImage = this.isThinkingBubble ? '/images/ui/duel/bubble_thinking.png' : '/images/ui/duel/bubble_speech.png'
    const textColor = this.isYou ? '#77d64d' : '#e34a4a'

    const title = this.element.querySelector('.dialog-title') as HTMLElement
    title.textContent = this.dialogTitle
    title.style.color = textColor
    
    const name = this.element.querySelector('.dialog-duelist') as HTMLElement
    name.textContent = this.duelistName
    name.dataset.contentlength = Math.floor(this.duelistName?.length / 10).toString()
    name.style.color = textColor

    const background = this.element.querySelector('.dialog-background') as HTMLImageElement
    background.style.transform = !this.isLeft ? 'scaleX(-1)' : ''
    background.src = bubbleImage

    const button = this.element.querySelector('.dialog-button') as HTMLElement
    button.textContent = this.message
    button.dataset.contentlength = Math.floor(this.message?.length / 10).toString()
    const message = this.element.querySelector('.dialog-quote') as HTMLElement
    message.textContent = this.message
    message.dataset.contentlength = Math.floor(this.message?.length / 10).toString()
    const spinner = this.element.querySelector('.dialog-spinner') as HTMLElement

    button.offsetWidth;
    message.offsetWidth;
    name.offsetWidth;

    if (this.isYou) {
      if (this.isThinkingBubble) {
        button.style.display = 'block'
        message.style.display = 'none'
        spinner.style.display = 'none'
      } else {
        button.style.display = 'none'
        message.style.display = 'block'
        spinner.style.display = 'none'
      }
    } else {
      if (this.isThinkingBubble) {
        button.style.display = 'none'
        message.style.display = 'block'
        spinner.style.display = 'grid'
      } else {
        button.style.display = 'none'
        message.style.display = 'block'
        spinner.style.display = 'none'
      }
    }
  }

  public showElement() {
    if (!this.element) return

    if (!this.shouldBeVisible) return

    this.element.style.opacity = "1"
    this.element.style.visibility = "visible"
  }

  public hideElement() {
    if (!this.element) return

    this.element.style.opacity = "0"
    this.element.style.visibility = "hidden"
  }
}