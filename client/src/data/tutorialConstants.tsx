import { SceneName } from "./assets";
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

enum DuelTutorialLevel { //Used to group info specific for the dueling tutorials stages
  NONE = 'NONE',
  SIMPLE = 'SIMPLE',
  FULL = 'FULL',
  DUELIST_PACKS = 'DUELIST_PACKS',
}

enum TutorialGroups { //Used to display groups for all tutorials later in the game for players to revisit
  DUEL_UI = 'DUEL_UI', //TODO maybe split into smaller groups?
  DUELISTS = 'DUELISTS',
  CARDS = 'CARDS',
  DUEL_MECHANICS = 'DUEL_MECHANICS',
}

enum TutorialParts { //All game mechanics relevant for the duel //TODO later add more tutorials and groups for the rest of the game
  DUEL_INFO = 'DUEL_INFO',
  PLAYER_INFO = 'PLAYER_INFO',
  DUEL_CONTROLS = 'DUEL_CONTROLS',
  DUEL_NAVIGATION_MENU = 'DUEL_NAVIGATION_MENU',
  PROGRESS_BUBBLES = 'PROGRESS_BUBBLES',
  COMMITING = 'COMMITING',
  REVEALING = 'REVEALING',

  SELECTING_CARDS_SIMPLE = 'SELECTING_CARDS_SIMPLE',
  SELECTING_CARDS = 'SELECTING_CARDS',
  DUEL_CARD_DETAILS = 'DUEL_CARD_DETAILS',
  DUELIST_INFO = 'DUELIST_INFO',
  
  SHOOT_DODGE_CARDS = 'SHOOT_DODGE_CARDS',
  TACTIC_CARDS = 'TACTIC_CARDS',
  BLADE_CARDS = 'BLADE_CARDS',
  ENVIRONMENT_DECK = 'ENVIRONMENT_CARDS',
  
  SHOOTING = 'SHOOTING',
  DODGING = 'DODGING',
  // STEP = 'STEP',
  HIT_CHANCE = 'HIT_CHANCE',
  DAMAGE = 'DAMAGE',
  ENVIRONMENT_CARD_DRAW = 'ENVIRONMENT_CARD_DRAW',
  CARD_REVEAL = 'CARD_REVEAL',
  
  //TODO rethink this?
  // PISTOL_ROUND = 'PISTOL_ROUND',
  // BLADE_ROUND = 'BLADE_ROUND',
  DUEL_CONCLUSION = 'DUEL_CONCLUSION',
  
  
  PACK = 'PACK',
  DUELIST = 'DUELIST',
  DUELIST_ARCHETYPE = 'DUELIST_ARCHETYPE',
  DUELIST_FAME = 'DUELIST_FAME',

  DUEL_SIMPLE_INTRO = 'DUEL_SIMPLE_INTRO',
  DUEL_FULL_INTRO = 'DUEL_FULL_INTRO',
}


const DUEL_TUTORIAL_LIST: Record<DuelTutorialLevel, TutorialParts[]> = {
  [DuelTutorialLevel.NONE]: [],
  [DuelTutorialLevel.SIMPLE]: [
    TutorialParts.DUEL_SIMPLE_INTRO,
    TutorialParts.DUEL_INFO,
    TutorialParts.PLAYER_INFO,
    TutorialParts.DUEL_CONTROLS,
    TutorialParts.DUEL_NAVIGATION_MENU,
    TutorialParts.PROGRESS_BUBBLES,
    TutorialParts.COMMITING,
    TutorialParts.REVEALING,
    TutorialParts.SHOOTING,
    TutorialParts.DODGING,
    TutorialParts.SHOOT_DODGE_CARDS,
    TutorialParts.SELECTING_CARDS_SIMPLE,
  ],
  [DuelTutorialLevel.FULL]: [
    TutorialParts.DUEL_FULL_INTRO,
    TutorialParts.TACTIC_CARDS,
    TutorialParts.BLADE_CARDS,
    TutorialParts.SELECTING_CARDS,
    TutorialParts.ENVIRONMENT_DECK,
    
    // TutorialParts.STEP,
    TutorialParts.ENVIRONMENT_CARD_DRAW,
    TutorialParts.HIT_CHANCE,
    TutorialParts.DAMAGE,
    TutorialParts.CARD_REVEAL,
    
    // TutorialParts.PISTOL_ROUND,
    // TutorialParts.BLADE_ROUND,
    TutorialParts.DUEL_CONCLUSION,
    TutorialParts.DUEL_CARD_DETAILS,
  ],
  [DuelTutorialLevel.DUELIST_PACKS]: [
    TutorialParts.PACK,
    TutorialParts.DUELIST,
    TutorialParts.DUELIST_ARCHETYPE,
    TutorialParts.DUELIST_FAME,
    TutorialParts.DUELIST_INFO, //TODO is this needed?
  ],
}

interface TutorialSlide {
  imagePath: string,
  tutorialDescriptions: string,
}

interface TutorialData {
  tutorialName: string,
  slides: TutorialSlide[],
}

const TUTORIAL_DATA: Record<TutorialParts, TutorialData> = {
  [TutorialParts.DUEL_INFO]: {
    tutorialName: 'Duel Overview',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'At the top center, you can see what sparked this duel - whether it was a matter of honor, a response to an insult, or another personal dispute.\nBelow that, you\'ll find the current context of your duel, such as whether it\'s part of a tournament, the regular season, or just a tutorial match.'
    }]
  },
  [TutorialParts.PLAYER_INFO]: {
    tutorialName: 'Your Status',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'In the top corners, you\'ll find player information - challenger on the left and challenged on the right.\nYour information will be displayed in your respective corner, showing your profile picture, name, and current context points like season standings.\nKeep track of both duelists\' information throughout the match.'
    }]
  },
  [TutorialParts.DUEL_CONTROLS]: {
    tutorialName: 'Duel Controls',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Located in the center-right of the screen are the duel controls that let you manage how the duel plays out.\nControl the duel speed with options from 0.5x to 2x speed.\nUse play/pause to control the duel flow, or press next step while paused to advance manually.\nThe restart button lets you begin the duel again from the start.'
    }]
  },
  [TutorialParts.DUEL_NAVIGATION_MENU]: {
    tutorialName: 'Navigation Menu',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'At the bottom center, you\'ll find three navigation buttons:\nThe tavern button returns you to the bar, the database button shows the duel\'s blockchain data, and the sound button toggles audio.'
    }]
  },
  [TutorialParts.PROGRESS_BUBBLES]: {
    tutorialName: 'Progress Tracker',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Above each duelist, you\'ll see speech bubbles that show the current game actions.\nA thinking bubble means it\'s your turn to take action, like selecting cards - look for the button inside the bubble.\nA speech bubble means you\'re waiting for the other player\'s turn.'
    }]
  },
  [TutorialParts.COMMITING]: {
    tutorialName: 'Committing Actions',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Once you\'ve selected your cards, click the commit button to lock in your choices for the round. After committing, you cannot change your selections until the next round.'
    }]
  },
  [TutorialParts.REVEALING]: {
    tutorialName: 'Reveal Phase',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'After both players commit their cards, they now must reveal their choices. Watch carefully as each action unfolds to see who emerges victorious.'
    }]
  },
  [TutorialParts.SELECTING_CARDS_SIMPLE]: {
    tutorialName: 'Card Selection',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Choose two different steps between 1-10: one for when you will shoot, and one for when you will dodge.\nYou cannot select the same step number for both actions.'
    }]
  },
  [TutorialParts.SELECTING_CARDS]: {
    tutorialName: 'Advanced Card Selection',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Choose four cards for your turn: a shoot step (1-10), a dodge step (1-10), a tactic card, and a blade card.\nMake sure your shoot and dodge steps are different numbers.\nSelect your cards carefully - the right combination can give you a strong advantage.'
    },
    {
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Hover over any card to see its detailed effects and stats.\nBelow the cards, you can see a summary of all buffs and debuffs that will be applied to you and your opponent.'
    }]
  },
  [TutorialParts.DUEL_CARD_DETAILS]: {
    tutorialName: 'Card Details',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Click on any card to access detailed duel information, including all drawn and revealed cards.\nView how each card impacts different stats and see their full details in the card information panel.'
    }]
  },
  [TutorialParts.DUELIST_INFO]: {
    tutorialName: 'Duelist Profile',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'At the bottom corners of the screen, you can find your current duelists\' information.\nTheir portraits and archetypes are displayed, along with their current damage and hit chance.'
    }]
  },
  [TutorialParts.SHOOT_DODGE_CARDS]: {
    tutorialName: 'Basic Cards',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Shoot and dodge cards determine the timing of your actions during the duel round, numbered from steps 1-10.\nChoose different numbers for each - for example, shoot on step 3 and dodge on step 7 to time your attack and defense.\nPlanning these timings carefully is key to your strategy.'
    }]
  },
  [TutorialParts.TACTIC_CARDS]: {
    tutorialName: 'Tactical Cards',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Tactic cards represent a way to buff yourself or debuff your enemy.\nEach card has its own unique effect - study them carefully and choose the right one for your strategy.'
    }]
  },
  [TutorialParts.BLADE_CARDS]: {
    tutorialName: 'Blade Combat',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Blade cards serve two distinct purposes in duels.\nFirst, each blade card can buff your own stats or debuff your opponent\'s stats, affecting damage dealt and hit chance.'
    },
    {
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Second, blade cards resolve ties during pistol rounds through a rock-paper-scissors system:\nPocket Pistol overcomes Behead, Behead defeats Grapple, and Grapple counters Pocket Pistol.\nThe Seppuku blade card is unique - choosing it results in immediate defeat, regardless of other cards played.'
    }]
  },
  [TutorialParts.ENVIRONMENT_DECK]: {
    tutorialName: 'Environment',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'On the bottom right of the screen, you can see the environment deck that shows all available environment cards.\nEnvironment cards come in three types: common, uncommon and special.\nRed cards affect damage, yellow cards modify hit chance, and blue cards have special effects.\nStudy each card carefully to understand their unique impacts on the duel!'
    }]
  },
  [TutorialParts.SHOOTING]: {
    tutorialName: 'Shooting',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Shooting is the main way to defeat your opponent in a duel.\nWhen you play a shoot card, you attempt to hit your opponent with your pistol.\nThe number on your shoot card determines when in the round you will fire.\nA successful shot that isn\'t dodged will deal damage based on your current damage value.'
    }]
  },
  [TutorialParts.DODGING]: {
    tutorialName: 'Dodging',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Dodge cards help you avoid incoming attacks.\nWhen you play a dodge card, it will protect you from any shots fired at the same step number.\nFor example, if you play a dodge card with step 3, you will automatically avoid any shots fired at step 3.'
    }]
  },
  [TutorialParts.HIT_CHANCE]: {
    tutorialName: 'Accuracy',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'A yellow progress circle around your duelist shows your current hit chance.\nHit chance is affected by both player cards and environment effects.\nWhen you shoot, a dice roll determines if you hit your opponent based on your hit chance.'
    }]
  },
  [TutorialParts.DAMAGE]: {
    tutorialName: 'Damage System',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Next to your duelist, a pistol icon displays your current damage potential.\nThe pistol shows three damage bars - you need at least 3 bars to defeat your opponent.\nAny damage less than 3 bars will not be enough for victory.\nWhen your damage exceeds 3 bars, a flame appears above the pistol to indicate extra power.'
    }]
  },
  [TutorialParts.ENVIRONMENT_CARD_DRAW]: {
    tutorialName: 'Environment Draw',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Each time both duelists take a step, a random card is drawn from the environment deck.\nMost environment cards will modify your hit chance or damage values.\nWhen a card is drawn, you can see your stats change in real-time - watch your hit chance circle and damage bars update!'
    }]
  },
  [TutorialParts.CARD_REVEAL]: {
    tutorialName: 'Card Reveal',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'At the start of the duel, your opponent\'s cards remain hidden, adding tension to each round.\nDuring each step, shoot and dodge cards are revealed just before they take effect.\nPay close attention to these reveals to anticipate and react to incoming attacks!'
    }]
  },
  [TutorialParts.DUEL_CONCLUSION]: {
    tutorialName: 'Victory Conditions',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Every duel will reach a conclusion - either one duelist emerges victorious or both duelists perish.\nYou can win by shooting your opponent with enough damage before they shoot you,\nOr by choosing the right card during the blades round.'
    }]
  },
  [TutorialParts.PACK]: {
    tutorialName: 'Card Packs',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Each pack contains 5 random duelists for you to collect.\nPurchase packs with $LORDS to expand your collection.\nThere\'s a chance to obtain rare duelists from packs!'
    }]
  },
  [TutorialParts.DUELIST]: {
    tutorialName: 'Duelists',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Duelists are champions you can summon to fight in your name.\nEach duelist is a NFT that you can collect and trade with other players.\nYou\'ll need at least one duelist to participate in duels, tournaments and seasonal events.\nKeep in mind that each duelist can only fight in one duel at a time, so having multiple duelists allows you to participate in multiple duels simultaneously.'
    }]
  },
  [TutorialParts.DUELIST_ARCHETYPE]: {
    tutorialName: 'Duelist Types',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Duelists fall into three archetypes, indicated by their color: red for villainous, yellow for trickster, and blue for honorable.\nA duelist\'s archetype is determined by their preferred shooting distance in their last 8 duels.\nVillainous duelists prefer close range (steps 1-3), tricksters lean towards mid-range (steps 3-7), and honorable duelists engage at long range (steps 7-10).'
    }]
  },
  [TutorialParts.DUELIST_FAME]: {
    tutorialName: 'Fame System',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Each duelist has their own Fame score - representing both their reputation and life force.\nEvery duel puts a portion of your duelist\'s Fame at risk. Victories increase their Fame, while defeats drain it.'
    },
    {
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Be strategic with your duelist - too many losses will bring them closer to death. Once their Fame falls to low, they\'re gone!\nChoose your battles wisely - but remember, greater risks can lead to greater Fame rewards!'
    }]
  },
  [TutorialParts.DUEL_SIMPLE_INTRO]: {
    tutorialName: 'Basic Duel',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Welcome to your first duel! This is where you will face off against opponents in a test of skill and strategy.\nWe\'ll start with the basic duel information.'
    }]
  },
  [TutorialParts.DUEL_FULL_INTRO]: {
    tutorialName: 'Advanced Duel',
    slides: [{
      imagePath: '/images/tutorial/full_duel.png',
      tutorialDescriptions: 'Ready for a real challenge?\nLet\'s explore the full depth of dueling - tactics, blade combat, and all the intricate strategies that separate the legends from the common folk.\nKeep your wits sharp and your blade sharper. This is where things get interesting!'
    }]
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
  TutorialGroups,
  TutorialParts,
  DuelTutorialLevel
}