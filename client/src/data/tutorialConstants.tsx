import {
  type TutorialData,
  type TutorialSlide,
  TUTORIAL_DATA,
  DUEL_TUTORIAL_LIST,
  TutorialParts,
  DuelTutorialLevel
} from '@underware/pistols-sdk/pistols/constants'
import { SceneName } from "./assetsTypes";
import { AudioName } from "./audioAssets";

const ANIMATION_TIME_PER_LETTER = 20
const DELAY_BETWEEN_TEXTS = 3000
const DELAY_BETWEEN_SPEECH = 1000

interface TutorialScene {
  texts: TutorialText[],
  sfxSounds?: AudioName[],
}

interface TutorialSfx {
  sound: AudioName,
  delay?: number,
}

interface TutorialText {
  text: string,
  characterName: string
  voice?: AudioName,
  textSfxSounds?: TutorialSfx[],
}

const tutorialScenes = [
  SceneName.Tutorial,
  SceneName.TutorialScene2,
  SceneName.TutorialScene3,
  SceneName.TutorialScene4,
  SceneName.TutorialScene5,
] as const

type TutorialScenes = typeof tutorialScenes[number];

const TUTORIAL_SCENE_DATA: Record<TutorialScenes, TutorialScene> = {
  [SceneName.Tutorial]: {
    texts: [
      {
        text: 'The Fool & Flintlock Tavern buzzes with noise—clinking glasses, hearty laughter, and murmured conversations. It reeks of sweat, spilled ale, and trouble.',
        characterName: 'Narrator'
      },
      {
        text: 'As you push through the crowd, eyes turn toward you, some curious, others hostile.',
        characterName: 'Narrator'
      },
      {
        text: 'The bartender stands behind the counter, his gaze heavy with judgment as he polishes a chipped glass.',
        characterName: 'Narrator'
      },
      {
        text: 'You stride to the bar, sliding onto a stool with practiced ease.',
        characterName: 'Narrator'
      },
      {
        text: 'Well, look what the tide dragged in.',
        characterName: 'Patron 1'
      }
    ]
  },
  [SceneName.TutorialScene2]: {
    texts: [
      {
        text: 'A few drinks in, the room grows rowdier. A drunkard patron stumbles your way, ale sloshing over his hand and onto the floor.',
        characterName: 'Narrator'
      },
      {
        text: 'HEY YOU! hic I CHAlleNGE YOU TO a DUel you SCUM!!',
        characterName: 'Drunkard Patron'
      },
      {
        text: 'The tavern falls silent, all eyes on you. The tension thickens as the challenge hangs in the air.',
        characterName: 'Narrator'
      },
      {
        text: 'You smirk, turning slowly to face the fool. This was bound to happen.',
        characterName: 'Narrator'
      },
      {
        text: "You're not even worth the effort, but fine, I'll humor you.",
        characterName: 'Player'
      },
      {
        text: 'The patrons shift closer, forming a loose circle. Bets are whispered, and excitement brews as you take center stage.',
        characterName: 'Narrator'
      }
    ]
  },
  [SceneName.TutorialScene3]: {
    texts: [
      {
        text: 'The crowd erupts in cheers and groans as you return to the bar, victorious and cocky.',
        characterName: 'Narrator'
      },
      {
        text: 'Haha! Have you seen that?! NOBODY can beat me!',
        characterName: 'Player'
      },
      {
        text: 'You slap a coin on the counter, demanding another drink, basking in the attention.',
        characterName: 'Narrator'
      },
      {
        text: 'But not all eyes are impressed. The bartender slams his glass down with a sharp crack, silencing the room.',
        characterName: 'Narrator'
      },
      {
        text: 'Calm yourself or get out!',
        characterName: 'Bartender'
      },
      {
        text: 'Or what??',
        characterName: 'Player'
      },
      {
        text: "Let me show you what a real duel looks like. And let's spice things up a bit!",
        characterName: 'Bartender'
      }
    ]
  },
  [SceneName.TutorialScene4]: {
    texts: [
      {
        text: "Is it really your time?",
        characterName: "???",
      },
      {
        text: "Safety is tempting, isn't it? But safety is also weakness.",
        characterName: "Demon",
      },
      {
        text: "Yes... Take my hand, and I will shape you into something greater.",
        characterName: "Demon", 
      }
    ]
  },
  [SceneName.TutorialScene5]: {
    texts: [
      {
        text: "You wake up at the tavern table, confused at what happened",
        characterName: "Narrator"
      },
      {
        text: "Ah, you're finally awake, welcome back to the world of the living.",
        characterName: "Bartender"
      },
      {
        text: "You looking confused...",
        characterName: "Narrator"
      },
      {
        text: "No need to thank me. But careful next time, I don't clean up all my patrons.",
        characterName: "Bartender"
      },
      {
        text: "...thank you. I guess dueling is not for me.",
        characterName: "Player"
      },
      {
        text: "I think you should try your hand at it again, but instead of wagering your life, how about wagering some $LORDS and summoning duelists in your sted!",
        characterName: "Bartender"
      },
      {
        text: "The bartender slides a pack of duelists on the table to you.",
        characterName: "Narrator"
      },
    ]
  }
}


export type {
  TutorialScene,
  TutorialText,
  TutorialSfx,
  TutorialData,
  TutorialSlide,
}

export {
  ANIMATION_TIME_PER_LETTER,
  DELAY_BETWEEN_TEXTS,
  DELAY_BETWEEN_SPEECH,
  TUTORIAL_SCENE_DATA,
  TUTORIAL_DATA,
  DUEL_TUTORIAL_LIST,
  tutorialScenes,
  TutorialParts,
  DuelTutorialLevel
}