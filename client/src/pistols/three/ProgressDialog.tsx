import * as THREE from 'three'
import TWEEN, { update } from '@tweenjs/tween.js'
import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js' 
import { DuelStage } from '../hooks/useDuel'
import { sizes } from './game'

const FADE_ANIMATION_DURATION = 500

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
  BOTH_ALIVE,
  ALIVE_INJURED,
  ALIVE_DEAD,
  INJURED_ALIVE,
  BOTH_INJURED,
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
      "Choose you filthy wrench!",
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
      "Move, filthy wrench!",
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
      "Move along, wrench!",
      "Pick up the pace!",
      "Don't stall, dog!",
      "Quit waitin', choose!",
      "Get on with it, wrench!",
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
      "Quit waitin', wrench!",
      "Don't dawdle, bastard!",
      "Reveal, you coward!",
      "Hurry up, scum!",
      "Time's up, show it!",
      "Move along, wrench!",
      "Get to it, bastard!",
      "Come on, scum!",
      "Reveal, ya coward!",
      "Quit delayin', dog!",
      "Make yer move, scum!",
      "Show us, bastard!",
      "Move it, wrench!",
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
      "Choose you filthy wrench!",
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
      "Move, filthy wrench!",
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
      "Move along, wrench!",
      "Pick up the pace!",
      "Don't stall, dog!",
      "Quit waitin', choose!",
      "Get on with it, wrench!",
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
      "Quit waitin', wrench!",
      "Don't dawdle, bastard!",
      "Reveal, you coward!",
      "Hurry up, scum!",
      "Time's up, show it!",
      "Move along, wrench!",
      "Get to it, bastard!",
      "Come on, scum!",
      "Reveal, ya coward!",
      "Quit delayin', dog!",
      "Make yer move, scum!",
      "Show us, bastard!",
      "Move it, wrench!",
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
  [DuelOutcome.BOTH_ALIVE]: [
    // Impressed
    "Aye, yer quick, scum.",
    "Yer better than ya look.",
    "Good fight, filthy dog.",
    "Respect, ye mangy mutt.",
    "Ye've got some skill, cunt.",
    "Not bad, yer scum.",
    "Fair play, ye bastard.",
    "Yer tough, filthy swine.",
    "Well done, ye lowlife.",
    "Nice move, ye dog.",

    // Respect
    "Ye fight with honor, dog.",
    "Got some respect for ya.",
    "Ye earned my respect, cunt.",
    "I'll see ya 'round, scum.",
    "Not bad, filthy wrench.",
    "Ye got my respect, dog.",
    "Respect, ye filthy swine.",
    "Ye've got guts, bastard.",
    "A true fight, ye cunt.",
    "I respect that, ye dog.",

    // Get you next time
    "Next time, ye'll die, scum.",
    "I'll get ya next time, cunt.",
    "Yer luck'll run out, swine.",
    "Next time, ye filthy dog.",
    "I'll end ya next time, scum.",
    "Ye'll not be so lucky, cunt.",
    "I'll be waitin', bastard.",
    "Next time, ye filthy wrench.",
    "Yer time'll come, dog.",
    "I'll finish ya next time, swine."
  ],
  [DuelOutcome.ALIVE_INJURED]: [
    // Cocky
    "Ha! Still standin', cunt.",
    "I'm still here, scum.",
    "Yer aim's shit, bastard.",
    "I'm better than ya, wrench.",
    "Still breathin', ye dog.",
    "Ye can't kill me, cunt.",
    "That all ye got, swine?",
    "Pathetic, ye lowlife.",
    "I'm unbreakable, scum.",
    "Ye missed, ye cunt.",

    // Angry I couldn't finish you
    "Should've ended ya, scum.",
    "Damn, yer tough, dog.",
    "Should be dead, bastard.",
    "Next time, ye die, cunt.",
    "Cursed luck, ye dog.",
    "Almost had ya, wrench.",
    "Next shot's fatal, swine.",
    "Ye slippery cunt.",
    "Won't miss next time, scum.",
    "Damn ye, filthy dog.",

    // Ego that I'm better
    "I'm better, ye scum.",
    "Ye'll never beat me, cunt.",
    "I'm the best, bastard.",
    "Ye can't best me, swine.",
    "Still standin', dog.",
    "I'm superior, wrench.",
    "Ye ain't nothin', cunt.",
    "I'm unbeatable, swine.",
    "Ye'll always lose, scum.",
    "I'm the champ, ye dog."
  ],
  [DuelOutcome.ALIVE_DEAD]: [
    // Proud
    "Got what ye deserved, cunt.",
    "Down ye go, scum.",
    "Dead like a dog, bastard.",
    "Victory's mine, wrench.",
    "Rest in hell, ye swine.",
    "I'm the victor, ye dog.",
    "Dead as dirt, cunt.",
    "Proud o' this kill, scum.",
    "Gotcha, ye filthy bastard.",
    "Yer end's come, wrench.",

    // Got what you deserved scum
    "Deserved it, ye scum.",
    "Justice served, cunt.",
    "Rot in hell, swine.",
    "Got what ye earned, dog.",
    "Death suits ya, wrench.",
    "Fate's cruel, bastard.",
    "Deserved every bit, scum.",
    "Yer fate's sealed, cunt.",
    "Justice done, ye dog.",
    "Earned yer death, swine."
  ],
  [DuelOutcome.INJURED_ALIVE]: [
    // Angry
    "Damn ye, dog!",
    "I'll gut ya, cunt!",
    "Ye mangy scum!",
    "Fuck ye, bastard!",
    "Curse ye, swine!",
    "I'll end ye, wrench!",
    "Yer luck'll end, cunt!",
    "Damn yer hide, scum!",
    "I'll see ye dead, dog!",
    "Ye filthy bastard!",

    // Lucky
    "Lucky shot, cunt.",
    "Yer luck saved ya, scum.",
    "Damn yer luck, dog.",
    "Lucky bastard, ye wrench.",
    "Yer luck's cursed, swine.",
    "Ye lucked out, ye cunt.",
    "Luck's on yer side, scum.",
    "Next time, no luck, dog.",
    "Damn lucky shot, wrench.",
    "Yer luck'll run dry, cunt.",

    // Fuck that was close
    "Close one, scum.",
    "Damn near got me, cunt.",
    "Too close, ye dog.",
    "Fuck, that was near, wrench.",
    "Almost dead, ye swine.",
    "Close call, ye cunt.",
    "Damn near ended me, scum.",
    "Too damn close, dog.",
    "Near miss, ye filthy wrench.",
    "Barely made it, cunt."
  ],
  [DuelOutcome.BOTH_INJURED]: [
    // Angry
    "Fuck ye, scum!",
    "Damn ya, cunt!",
    "Curse ya, dog!",
    "I'll get ya, bastard!",
    "Damn yer hide, wrench!",
    "I'll end ya, swine!",
    "Curse yer name, cunt!",
    "Damn ye, filthy dog!",
    "Fuckin' bastard!",
    "Damn ye, wrench!",

    // Lucky
    "Both cursed lucky.",
    "Luck's on us, cunt.",
    "Both too lucky, scum.",
    "Damn luck, dog.",
    "Luck's cruel, bastard.",
    "Both lucky, wrench.",
    "Cursed luck, swine.",
    "Luck saved us, cunt.",
    "Both damn lucky, scum.",
    "Lucky bastards, dog.",

    // I had you
    "I had ye, cunt!",
    "Ye were mine, scum!",
    "Damn near had ya, dog!",
    "Ye were dead, bastard!",
    "I had ya, wrench!",
    "So close, ye swine!",
    "Ye were mine, cunt!",
    "Had ya, filthy dog!",
    "Damn near got ya, wrench!",
    "Ye were done, swine!",

    // You cunt how could you
    "Ye cunt, how dare ya!",
    "Fuckin' cunt, scum!",
    "How could ye, dog!",
    "Ye filthy cunt, bastard!",
    "Damn ya, cunt wrench!",
    "How dare ya, ye swine!",
    "Cursed cunt, scum!",
    "How could ye, filthy dog!",
    "Damn cunt, ye wrench!",
    "Ye filthy cunt, swine!"
  ],
  [DuelOutcome.INJURED_DEAD]: [
    // Angry but won
    "Ye died, damn ya!",
    "Won, but damn ye!",
    "Fuck ya, scum!",
    "Cursed win, cunt!",
    "Won, but damn ya, dog!",
    "Damn ya, wrench!",
    "Won, but fuck ya, swine!",
    "Cursed win, scum!",
    "Damn ya, filthy cunt!",
    "Won, but damn ya, dog!",

    // Close one
    "Close call, cunt.",
    "Too close, scum.",
    "Barely won, dog.",
    "Close one, wrench.",
    "Damn near lost, swine.",
    "Too close, ye cunt.",
    "Near miss, scum.",
    "Barely made it, dog.",
    "Close win, wrench.",
    "Too damn close, cunt.",

    // Proud
    "Proud win, cunt.",
    "Won, ye scum.",
    "Victory's mine, dog.",
    "Proud o' this, wrench.",
    "Won the duel, swine.",
    "Proud victor, cunt.",
    "I won, ye scum.",
    "Victory's sweet, dog.",
    "Proud o' this win, wrench.",
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
    // const originalElement = document.getElementById('player-bubble') as HTMLElement
    // const elementLeft = originalElement.cloneNode(true) as HTMLElement
    // const elementRight = originalElement.cloneNode(true) as HTMLElement

    // const hiddenContainer = document.getElementById('hidden-container')
    // hiddenContainer.appendChild(elementLeft)
    // hiddenContainer.appendChild(elementRight)

    // setTimeout(() => {
    //   console.log(elementLeft.getBoundingClientRect())
    //   console.log(elementRight.getBoundingClientRect())

    //   this.dialogA.setElement(elementLeft)
    //   this.dialogB.setElement(elementRight)

    //   hiddenContainer.removeChild(elementLeft)
    //   hiddenContainer.removeChild(elementRight)

    //   // scene.add(this.dialogA)
    //   // scene.add(this.dialogB)
    // }, 50)

    this.dialogA = new ProgressDialogMesh(camera, duelistAPosition, true)
    this.dialogB = new ProgressDialogMesh(camera, duelistBPosition, false)
  }

  public setData(duelistAName: string, duelistBName: string, isYouA: boolean, isYouB: boolean) {
    this.isDialogAYou = isYouA

    this.dialogA.setDuelistData(duelistAName, isYouA)
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

  public hideDialogs() {
    this.dialogA.hideElement()
    this.dialogB.hideElement()
  }

  public updateDialogPositions(positionA: THREE.Vector3, positionB: THREE.Vector3) {
    this.dialogA.updatePosition(positionA)
    this.dialogB.updatePosition(positionB)
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

    if (!this.lastDuelStageA || !this.lastDuelStageB) return

    const { stateA, stateB } = this.findCurrentDuelStates(this.lastDuelStageA, this.lastDuelStageB)

    const dialogAProps = dialogOptions[stateA]
    if (this.lastDuelStateA != stateA) {

      const messageA = this.isDialogAYou
        ? dialogAProps.messages[Math.floor(Math.random() * dialogAProps.messages.length)] 
        : dialogAProps.isThinkingBubble
        ? dialogAProps.opponentText 
        : dialogAProps.messages[Math.floor(Math.random() * dialogAProps.messages.length)]

      this.dialogA.updateElementData(dialogAProps.isThinkingBubble, messageA)
    }

    const dialogBProps = dialogOptions[stateB]
    if (this.lastDuelStateB != stateB) {

      const messageB = !this.isDialogAYou
        ? dialogBProps.messages[Math.floor(Math.random() * dialogBProps.messages.length)] 
        : dialogBProps.isThinkingBubble
        ? dialogBProps.opponentText 
        : dialogBProps.messages[Math.floor(Math.random() * dialogBProps.messages.length)]

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
    else if (stageA[DuelStage.Round2Commit] == false) stateA = DuelState.CHOOSING_ACTIONS
    else if (stageA[DuelStage.Round2Reveal] == false) stateA = DuelState.REVEALING_ACTIONS
    else stateA = DuelState.ACTIONS_REVEALED

    if (stageB[DuelStage.Round1Commit] == false) stateB = DuelState.CHOOSING_STEPS
    else if (stageB[DuelStage.Round1Reveal] == false) stateB = DuelState.REVEALING_STEPS
    else if (stageB[DuelStage.Round2Commit] == false) stateB = DuelState.CHOOSING_ACTIONS
    else if (stageB[DuelStage.Round2Reveal] == false) stateB = DuelState.REVEALING_ACTIONS
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
    let outcomeA: DuelOutcome
    let outcomeB: DuelOutcome

    if (healthA > 0 && healthB > 0) {
      if (healthA == 3 && healthB == 3) {
        outcomeA = DuelOutcome.BOTH_ALIVE
        outcomeB = DuelOutcome.BOTH_ALIVE
      } else if (healthA == 3 && healthB < 3) {
        outcomeA = DuelOutcome.ALIVE_INJURED
        outcomeB = DuelOutcome.INJURED_ALIVE
      } else if (healthA < 3 && healthB == 3) {
        outcomeA = DuelOutcome.INJURED_ALIVE
        outcomeB = DuelOutcome.ALIVE_INJURED
      } else {
        outcomeA = DuelOutcome.BOTH_INJURED
        outcomeB = DuelOutcome.BOTH_INJURED
      }
    } else if (healthA > 0 && healthB == 0) {
      if (healthA == 3) {
        outcomeA = DuelOutcome.ALIVE_DEAD
      } else {
        outcomeA = DuelOutcome.INJURED_DEAD
      }
      outcomeB = DuelOutcome.DEAD_DEAD
    } else if (healthA == 0 && healthB > 0) {
      outcomeA = DuelOutcome.DEAD_DEAD
      if (healthB == 3) {
        outcomeB = DuelOutcome.ALIVE_DEAD
      } else {
        outcomeB = DuelOutcome.INJURED_DEAD
      }
    } else {
      outcomeA = DuelOutcome.DEAD_DEAD
      outcomeB = DuelOutcome.DEAD_DEAD
    }

    const messageA = duelEndingMessages[outcomeA][Math.floor(Math.random() * duelEndingMessages[outcomeA].length)]
    const messageB = duelEndingMessages[outcomeB][Math.floor(Math.random() * duelEndingMessages[outcomeB].length)]

    if (this.lastDuelOutcomeA != outcomeA) {
      this.dialogA.updateElementData(false, messageA)
    }
    if (this.lastDuelOutcomeB != outcomeB) {
      this.dialogB.updateElementData(false, messageB)
    }

    if (outcomeA != DuelOutcome.DEAD_DEAD) {
      this.dialogA.showElement()
    }
    if (outcomeB != DuelOutcome.DEAD_DEAD) {
      this.dialogB.showElement()
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

  private dialogTitle: string
  private duelistName: string
  private isThinkingBubble: boolean
  private message: string
  private onButtonClick: () => void

  constructor(camera: THREE.PerspectiveCamera, position: THREE.Vector3, isLeft: boolean) {
    this.camera = camera
    this.isLeft = isLeft
    this.position = position
    this.originalPositionY = position.y

    this.dialogTitle = this.isLeft ? 'Challenger' : 'Challenged'
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

    const bubbleImage = this.isThinkingBubble ? '/images/ui/bubble_thinking.png' : '/images/ui/bubble_speech.png'
    const textColor = this.isYou ? 'green' : 'red'

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
    const message = this.element.querySelector('.dialog-message') as HTMLElement
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

    this.element.style.opacity = "1"
    this.element.style.visibility = "visible"
  }

  public hideElement() {
    if (!this.element) return

    this.element.style.opacity = "0"
    this.element.style.visibility = "hidden"
  }
}