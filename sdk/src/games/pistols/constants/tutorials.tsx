
enum DuelTutorialLevel { //Used to group info specific for the dueling tutorials stages
  NONE = 'NONE',
  SIMPLE = 'BASIC TUTORIAL',
  FULL = 'ADVANCED TUTORIAL',
  DUELIST_PACKS = 'DUELISTS & PACKS',
}

enum TutorialParts { //All game mechanics relevant for the duel //TODO later add more tutorials and groups for the rest of the game
  DUEL_INFO = 'DUEL_INFO',
  PLAYER_INFO = 'PLAYER_INFO',
  DUEL_CONTROLS = 'DUEL_CONTROLS',
  DUEL_NAVIGATION_MENU = 'DUEL_NAVIGATION_MENU',
  PROGRESS_BUBBLES = 'PROGRESS_BUBBLES',
  COMMITING = 'COMMITING',
  REVEALING = 'REVEALING',

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
    TutorialParts.SHOOT_DODGE_CARDS,
    TutorialParts.SHOOTING,
    TutorialParts.DODGING,
    TutorialParts.COMMITING,
    TutorialParts.REVEALING,
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
      imagePath: '/images/tutorial/overlay/duel_simple_duel_info_frame_01.png',
      tutorialDescriptions: 'At the top center, you can see what sparked this duel - whether it was a matter of honor, a response to an insult, or another personal dispute.\nBelow that, you\'ll find the current context of your duel, such as whether it\'s part of a tournament, the regular season, or just a tutorial match.'
    }]
  },
  [TutorialParts.PLAYER_INFO]: {
    tutorialName: 'Your Status',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_player_info_frame_01.png',
      tutorialDescriptions: 'In the top corners, you\'ll find player information - challenger on the left and challenged on the right.\nYour information will be displayed in your respective corner, showing your profile picture, name, and current context points like season standings.\nKeep track of both duelists\' information throughout the match.'
    }]
  },
  [TutorialParts.DUEL_CONTROLS]: {
    tutorialName: 'Duel Controls',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_duel_controls_frame_01.png',
      tutorialDescriptions: 'Located in the center-right of the screen are the duel controls that let you manage how the duel plays out.\nControl the duel speed with options from 0.5x to 2x speed.\nUse play/pause to control the duel flow, or press next step while paused to advance manually.\nThe restart button lets you begin the duel again from the start.'
    }]
  },
  [TutorialParts.DUEL_NAVIGATION_MENU]: {
    tutorialName: 'Navigation Menu',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_duel_navigation_frame_01.png',
      tutorialDescriptions: 'At the bottom center, you\'ll find three navigation buttons:\nThe tavern button returns you to the bar, the database button shows the duel\'s blockchain data, and the sound button toggles audio.'
    }]
  },
  [TutorialParts.PROGRESS_BUBBLES]: {
    tutorialName: 'Progress Tracker',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_progress_bubbles_frame_01.png',
      tutorialDescriptions: 'Above each duelist, you\'ll see speech bubbles that show the current game actions.\nA thinking bubble means it\'s your turn to take action, like selecting cards - look for the button inside the bubble.\nA speech bubble means you\'re waiting for the other player\'s turn.'
    }]
  },
  [TutorialParts.COMMITING]: {
    tutorialName: 'Committing Actions',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_commiting_frame_01.png',
      tutorialDescriptions: 'Once you\'ve selected your cards, click the commit button to lock in your choices for the round. After committing, you cannot change your selections until the next round.'
    }]
  },
  [TutorialParts.REVEALING]: {
    tutorialName: 'Reveal Phase',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_revealing_frame_01.png',
      tutorialDescriptions: 'After both players commit their cards, they now must reveal their choices. Watch carefully as each action unfolds to see who emerges victorious.'
    }]
  },
  [TutorialParts.SELECTING_CARDS]: {
    tutorialName: 'Advanced Card Selection',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_selecting_cards_frame_01.png',
      tutorialDescriptions: 'Choose four cards for your turn: a shoot step (1-10), a dodge step (1-10), a tactic card, and a blade card.\nMake sure your shoot and dodge steps are different numbers.\nSelect your cards carefully - the right combination can give you a strong advantage.'
    },
    {
      imagePath: '/images/tutorial/overlay/duel_full_selecting_cards_frame_02.png',
      tutorialDescriptions: 'Hover over any card to see its detailed effects and stats.\nBelow the cards, you can see a summary of all buffs and debuffs that will be applied to you and your opponent.'
    }]
  },
  [TutorialParts.DUEL_CARD_DETAILS]: {
    tutorialName: 'Card Details',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_duel_card_details_frame_01.gif',
      tutorialDescriptions: 'Click on any card to access detailed duel information, including all drawn and revealed cards.\nView how each card impacts different stats and see their full details in the card information panel.'
    }]
  },
  [TutorialParts.DUELIST_INFO]: {
    tutorialName: 'Duelist Profile',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_shooting_frame_01.png',
      tutorialDescriptions: 'At the bottom corners of the screen, you can find your current duelists\' information.\nTheir portraits and archetypes are displayed, along with their current damage and hit chance.'
    }]
  },
  [TutorialParts.SHOOT_DODGE_CARDS]: {
    tutorialName: 'Basic Cards',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_shoot_dodge_cards_frame_01.png',
      tutorialDescriptions: 'Shoot and dodge cards determine the timing of your actions during the duel round, numbered from steps 1-10.\nChoose different numbers for each - for example, shoot on step 3 and dodge on step 7 to time your attack and defense.\nPlanning these timings carefully is key to your strategy.'
    }]
  },
  [TutorialParts.TACTIC_CARDS]: {
    tutorialName: 'Tactical Cards',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_tactic_cards_frame_01.png',
      tutorialDescriptions: 'Tactic cards represent a way to buff yourself or debuff your enemy.\nEach card has its own unique effect - study them carefully and choose the right one for your strategy.'
    }]
  },
  [TutorialParts.BLADE_CARDS]: {
    tutorialName: 'Blade Combat',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_blade_cards_frame_01.png',
      tutorialDescriptions: 'Blade cards serve two distinct purposes in duels.\nFirst, each blade card can buff your own stats or debuff your opponent\'s stats, affecting damage dealt and hit chance.'
    },
    {
      imagePath: '/images/tutorial/overlay/duel_full_blade_cards_frame_02.png',
      tutorialDescriptions: 'Second, blade cards resolve ties during pistol rounds through a rock-paper-scissors system:\nPocket Pistol overcomes Behead, Behead defeats Grapple, and Grapple counters Pocket Pistol.\nThe Seppuku blade card is unique - choosing it results in immediate defeat, regardless of other cards played.'
    }]
  },
  [TutorialParts.ENVIRONMENT_DECK]: {
    tutorialName: 'Environment',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_environment_card_deck_frame_01.png',
      tutorialDescriptions: 'On the bottom right of the screen, you can see the environment deck that shows all available environment cards.\nEnvironment cards come in three types: common, uncommon and special.\nRed cards affect damage, yellow cards modify hit chance, and blue cards have special effects.\nStudy each card carefully to understand their unique impacts on the duel!'
    }]
  },
  [TutorialParts.SHOOTING]: {
    tutorialName: 'Shooting',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_shooting_frame_01.png',
      tutorialDescriptions: 'Shooting is the main way to defeat your opponent in a duel.\nWhen you play a shoot card, you attempt to hit your opponent with your pistol.\nThe number on your shoot card determines when in the round you will fire.\nA successful shot that isn\'t dodged will deal damage based on your current damage value.'
    }]
  },
  [TutorialParts.DODGING]: {
    tutorialName: 'Dodging',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_dodging_frame_01.png',
      tutorialDescriptions: 'Dodge cards help you avoid incoming attacks.\nWhen you play a dodge card, it will protect you from any shots fired at the same step number.\nFor example, if you play a dodge card with step 3, you will automatically avoid any shots fired at step 3.'
    }]
  },
  [TutorialParts.HIT_CHANCE]: {
    tutorialName: 'Accuracy',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_hit_chance_frame_01.png',
      tutorialDescriptions: 'A yellow progress circle around your duelist shows your current hit chance.\nHit chance is affected by both player cards and environment effects.\nWhen you shoot, a dice roll determines if you hit your opponent based on your hit chance.'
    }]
  },
  [TutorialParts.DAMAGE]: {
    tutorialName: 'Damage System',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_damage_frame_01.png',
      tutorialDescriptions: 'Next to your duelist, a pistol icon displays your current damage potential.\nThe pistol shows three damage bars - you need at least 3 bars to defeat your opponent.\nAny damage less than 3 bars will not be enough for victory.\nWhen your damage exceeds 3 bars, a flame appears above the pistol to indicate extra power.'
    }]
  },
  [TutorialParts.ENVIRONMENT_CARD_DRAW]: {
    tutorialName: 'Environment Draw',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_environment_card_draw_frame_01.gif',
      tutorialDescriptions: 'Each time both duelists take a step, a random card is drawn from the environment deck.\nMost environment cards will modify your hit chance or damage values.\nWhen a card is drawn, you can see your stats change in real-time - watch your hit chance circle and damage bars update!'
    }]
  },
  [TutorialParts.CARD_REVEAL]: {
    tutorialName: 'Card Reveal',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_card_reveal_frame_01.gif',
      tutorialDescriptions: 'At the start of the duel, your opponent\'s cards remain hidden, adding tension to each round.\nDuring each step, shoot and dodge cards are revealed just before they take effect.\nPay close attention to these reveals to anticipate and react to incoming attacks!'
    }]
  },
  [TutorialParts.DUEL_CONCLUSION]: {
    tutorialName: 'Victory Conditions',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_duel_conclusion_frame_01.png',
      tutorialDescriptions: 'Every duel will reach a conclusion - either one duelist emerges victorious or both duelists perish.\nYou can win by shooting your opponent with enough damage before they shoot you,\nOr by choosing the right card during the blades round.'
    }]
  },
  [TutorialParts.PACK]: {
    tutorialName: 'Card Packs',
    slides: [{
      imagePath: '/images/tutorial/overlay/duelist_tutorial_card_pack_frame_01.png',
      tutorialDescriptions: 'Card packs come in different varieties - every new player gets a free starter pack containing 2 duelists!\nYou can purchase additional packs for $LORDS, with each bought pack containing 5 random duelists to expand your roster.'
    },
    {
      imagePath: '/images/tutorial/overlay/duelist_tutorial_card_pack_frame_02.gif',
      tutorialDescriptions: 'Once you own a card pack, click on the wax seal to open it and reveal your new duelists!\nThe seal will break with satisfying crack to show your freshly acquired champions - check their archetypes and stats immediately!'
    }]
  },
  [TutorialParts.DUELIST]: {
    tutorialName: 'Duelists',
    slides: [{
      imagePath: '/images/tutorial/overlay/duelist_tutorial_duelist_frame_01.png',
      tutorialDescriptions: 'Duelists are champions you can summon to fight in your name.\nEach duelist is a NFT that you can collect and trade with other players.\nYou\'ll need at least one duelist to participate in duels, tournaments and seasonal events.\nKeep in mind that each duelist can only fight in one duel at a time, so having multiple duelists allows you to participate in multiple duels simultaneously.'
    }]
  },
  [TutorialParts.DUELIST_ARCHETYPE]: {
    tutorialName: 'Duelist Types',
    slides: [{
      imagePath: '/images/tutorial/overlay/duelist_tutorial_duelist_archetype_frame_01.png',
      tutorialDescriptions: 'Duelists fall into three archetypes, indicated by their color: red for villainous, yellow for trickster, and blue for honorable.\nA duelist\'s archetype is determined by their preferred shooting distance in their last 8 duels.\nVillainous duelists prefer close range (steps 1-3), tricksters lean towards mid-range (steps 3-7), and honorable duelists engage at long range (steps 7-10).'
    }]
  },
  [TutorialParts.DUELIST_FAME]: {
    tutorialName: 'Fame System',
    slides: [{
      imagePath: '/images/tutorial/overlay/duelist_tutorial_duelist_fame_frame_01.png',
      tutorialDescriptions: 'Each duelist has their own Fame score - representing both their reputation and life force.\nEvery duel puts a portion of your duelist\'s Fame at risk. Victories increase their Fame, while defeats drain it.'
    },
    {
      imagePath: '/images/tutorial/overlay/duelist_tutorial_duelist_fame_frame_02.png',
      tutorialDescriptions: 'Be strategic with your duelist - too many losses will bring them closer to death. Once their Fame falls to low, they\'re gone!\nChoose your battles wisely - but remember, greater risks can lead to greater Fame rewards!'
    }]
  },
  [TutorialParts.DUEL_SIMPLE_INTRO]: {
    tutorialName: 'Basic Duel',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_simple_intro_frame_01.png',
      tutorialDescriptions: 'Welcome to your first duel! This is where you will face off against opponents in a test of skill and strategy.\nWe\'ll start with the basic duel information.'
    }]
  },
  [TutorialParts.DUEL_FULL_INTRO]: {
    tutorialName: 'Advanced Duel',
    slides: [{
      imagePath: '/images/tutorial/overlay/duel_full_intro_frame_01.png',
      tutorialDescriptions: 'Ready for a real challenge?\nLet\'s explore the full depth of dueling - tactics, blade combat, and all the intricate strategies that separate the legends from the common folk.\nKeep your wits sharp and your blade sharper. This is where things get interesting!'
    }]
  }
}


export type {
  TutorialData,
  TutorialSlide,
}

export {
  TUTORIAL_DATA,
  DUEL_TUTORIAL_LIST,
  TutorialParts,
  DuelTutorialLevel
}