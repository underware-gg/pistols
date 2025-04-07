enum SceneName {
  Gate = 'Gate',
  Door = 'Door',
  Profile = 'Profile',
  Tavern = 'Tavern',
  Duelists = 'Duelists',
  DuelsBoard = 'Your Duels',
  Leaderboards = 'Leaderboards',
  Graveyard = 'Graveyard',
  Tournament = 'Tournament',
  IRLTournament = 'IRL Tournament',
  Duel = 'Duel',
  Tutorial = 'TutorialStart',
  TutorialScene2 = 'TutorialScene2',
  TutorialScene3 = 'TutorialScene3',
  TutorialScene4 = 'TutorialScene4',
  TutorialScene5 = 'TutorialScene5',
  TutorialDuel = 'TutorialDuel',
}


//----------------------------
// Texture Assets
//
enum TextureName {
  Testcard = 'Testcard',
  bg_door = 'bg_door',
  bg_duelists = 'bg_duelists',
  bg_duelists_mask = 'bg_duelists_mask',
  bg_duels = 'bg_duels',
  bg_duels_mask = 'bg_duels_mask',
  bg_duels_live = 'BG_DUEL',
  bg_graveyard = 'bg_graveyard',
  bg_graveyard_mask = 'bg_graveyard_mask',
  bg_duel = 'bg_duel',
  duel_ground = 'duel_ground',
  duel_ground_normal = 'duel_ground_normal',
  duel_water_dudv = 'duel_water_dudv',
  duel_water_map = 'duel_water_map',
  cliffs = 'cliffs',
  
  bg_entrance_background = 'bg_entrance_background',
  bg_entrance_tavern = 'bg_entrance_tavern',
  bg_entrance_sign = 'bg_entrance_sign',
  bg_entrance_player = 'bg_entrance_player',
  bg_entrance_foreground = 'bg_entrance_foreground',
  bg_entrance_door_mask = 'bg_entrance_door_mask',
  bg_entrance_fog_background = 'bg_entrance_fog_background',
  bg_entrance_fog_foreground = 'bg_entrance_fog_foreground',

  bg_tavern_bar = 'bg_tavern_bar',
  bg_tavern_bar_mask = 'bg_tavern_bar_mask',
  bg_tavern_bartender = 'bg_tavern_bartender',
  bg_tavern_bartender_mask = 'bg_tavern_bartender_mask',
  bg_tavern_background = 'bg_tavern_background',
  bg_tavern_crypt_mask = 'bg_tavern_crypt_mask',
  bg_tavern_trophy_mask = 'bg_tavern_trophy_mask',

  bg_duelists_background = 'bg_duelists_background',
  bg_duelists_background_mask = 'bg_duelists_background_mask',
  bg_duelists_pistol = 'bg_duelists_pistol',
  bg_duelists_pistol_mask = 'bg_duelists_pistol_mask',
  bg_duelists_matchmaking = 'bg_duelists_matchmaking',
  bg_duelists_matchmaking_mask = 'bg_duelists_matchmaking_mask',
  bg_duelists_tutorial = 'bg_duelists_tutorial',
  bg_duelists_tutorial_mask = 'bg_duelists_tutorial_mask',

  bg_entry_background = 'bg_entry_background',
  bg_entry_bar = 'bg_entry_bar',
  bg_entry_barkeep = 'bg_entry_barkeep',
  bg_entry_crowd = 'bg_entry_crowd',
  bg_entry_player = 'bg_entry_player',

  bg_conflict_background = 'bg_conflict_background',
  bg_conflict_bar = 'bg_conflict_bar',
  bg_conflict_barkeep = 'bg_conflict_barkeep',
  bg_conflict_drunkard = 'bg_conflict_drunkard',
  bg_conflict_player = 'bg_conflict_player',

  bg_barkeep_background = 'bg_barkeep_background',
  bg_barkeep_crowd_back = 'bg_barkeep_crowd_back',
  bg_barkeep_crowd_front = 'bg_barkeep_crowd_front',
  bg_barkeep_player = 'bg_barkeep_player',
  bg_barkeep_table = 'bg_barkeep_table',
  
  bg_demon_background = 'bg_demon_background',
  bg_demon_left_hand = 'bg_demon_left_hand',
  bg_demon_right_hand = 'bg_demon_right_hand',
  bg_demon_victim = 'bg_demon_victim',
  bg_demon = 'bg_demon',
  bg_demon_left_hand_mask = 'bg_demon_left_hand_mask',
  bg_demon_right_hand_mask = 'bg_demon_right_hand_mask',
  
  bg_resurrection_background = 'bg_resurrection_background',
  bg_resurrection_barkeep = 'bg_resurrection_barkeep',
  bg_resurrection_player = 'bg_resurrection_player',
  bg_resurrection_table = 'bg_resurrection_table',

  bg_profile_table = 'bg_profile_table',
  bg_profile_items = 'bg_profile_items',
  bg_profile_player = 'bg_profile_player',
  bg_profile_book_mask = 'bg_profile_book_mask',
  bg_profile_chest_mask = 'bg_profile_chest_mask',
  bg_profile_door_mask = 'bg_profile_door_mask',
  bg_profile_background = 'bg_profile_background',

  bg_leaderboards = 'bg_leaderboards',
}
type TextureAttributes = {
  path: string
}
const TEXTURES: Record<TextureName, TextureAttributes> = {
  [TextureName.Testcard]: { path: '/textures/testcard.jpg' },
  [TextureName.bg_door]: { path: '/images/bg_door.jpg' },
  [TextureName.bg_duelists]: { path: '/images/bg_duelists.jpg' },
  [TextureName.bg_duelists_mask]: { path: '/images/bg_duelists_mask.png' },
  [TextureName.bg_duels]: { path: '/images/bg_duels.png' },
  [TextureName.bg_duels_mask]: { path: '/images/bg_duels_mask.png' },
  [TextureName.bg_duels_live]: { path: '/images/bg_duels_live.jpg' },
  [TextureName.bg_graveyard]: { path: '/images/bg_graveyard.jpg' },
  [TextureName.bg_graveyard_mask]: { path: '/images/bg_graveyard_mask.png' },
  [TextureName.bg_duel]: { path: '/images/bg_duel.jpg' },
  [TextureName.duel_ground]: { path: '/textures/ground.ktx2' },
  [TextureName.duel_ground_normal]: { path: '/textures/ground_normalmap.ktx2' },
  [TextureName.duel_water_dudv]: { path: '/textures/waterdudv.jpg' },
  [TextureName.duel_water_map]: { path: '/textures/water_map.ktx2' },
  [TextureName.cliffs]: { path: '/textures/cliffs.png' },

  [TextureName.bg_entrance_background]: { path: '/images/scenes/gate/bg_entrance_background.png' },
  [TextureName.bg_entrance_tavern]: { path: '/images/scenes/gate/bg_entrance_tavern.png' },
  [TextureName.bg_entrance_sign]: { path: '/images/scenes/gate/bg_entrance_sign.png' },
  [TextureName.bg_entrance_player]: { path: '/images/scenes/gate/bg_entrance_player.png' },
  [TextureName.bg_entrance_foreground]: { path: '/images/scenes/gate/bg_entrance_foreground.png' },
  [TextureName.bg_entrance_door_mask]: { path: '/images/scenes/gate/bg_entrance_door_mask.png' },
  [TextureName.bg_entrance_fog_background]: { path: '/images/scenes/gate/bg_entrance_fog_background.png' },
  [TextureName.bg_entrance_fog_foreground]: { path: '/images/scenes/gate/bg_entrance_fog_foreground.png' },
  
  [TextureName.bg_tavern_bar]: { path: '/images/scenes/tavern/bg_tavern_bar.png' },
  [TextureName.bg_tavern_bar_mask]: { path: '/images/scenes/tavern/bg_tavern_bar_mask.png' },
  [TextureName.bg_tavern_bartender]: { path: '/images/scenes/tavern/bg_tavern_bartender.png' },
  [TextureName.bg_tavern_bartender_mask]: { path: '/images/scenes/tavern/bg_tavern_bartender_mask.png' },
  [TextureName.bg_tavern_background]: { path: '/images/scenes/tavern/bg_tavern_background.png' },
  [TextureName.bg_tavern_crypt_mask]: { path: '/images/scenes/tavern/bg_tavern_crypt_mask.png' },
  [TextureName.bg_tavern_trophy_mask]: { path: '/images/scenes/tavern/bg_tavern_trophy_mask.png' },

  [TextureName.bg_duelists_background]: { path: '/images/scenes/duelists/bg_duelists_background.png' },
  [TextureName.bg_duelists_background_mask]: { path: '/images/scenes/duelists/bg_duelists_background_mask.png' },
  [TextureName.bg_duelists_pistol]: { path: '/images/scenes/duelists/bg_duelists_pistol.png' },
  [TextureName.bg_duelists_pistol_mask]: { path: '/images/scenes/duelists/bg_duelists_pistol_mask.png' },
  [TextureName.bg_duelists_matchmaking]: { path: '/images/scenes/duelists/bg_duelists_matchmaking.png' },
  [TextureName.bg_duelists_matchmaking_mask]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_mask.png' },
  [TextureName.bg_duelists_tutorial]: { path: '/images/scenes/duelists/bg_duelists_tutorial.png' },
  [TextureName.bg_duelists_tutorial_mask]: { path: '/images/scenes/duelists/bg_duelists_tutorial_mask.png' },


  [TextureName.bg_entry_background]: { path: '/images/tutorial/background/entry/bg_entry_background.png' },
  [TextureName.bg_entry_bar]: { path: '/images/tutorial/background/entry/bg_entry_bar.png' },
  [TextureName.bg_entry_barkeep]: { path: '/images/tutorial/background/entry/bg_entry_barkeep.png' },
  [TextureName.bg_entry_crowd]: { path: '/images/tutorial/background/entry/bg_entry_crowd.png' },
  [TextureName.bg_entry_player]: { path: '/images/tutorial/background/entry/bg_entry_player.png' },

  [TextureName.bg_conflict_background]: { path: '/images/tutorial/background/conflict/bg_conflict_background.png' },
  [TextureName.bg_conflict_bar]: { path: '/images/tutorial/background/conflict/bg_conflict_bar.png' },
  [TextureName.bg_conflict_barkeep]: { path: '/images/tutorial/background/conflict/bg_conflict_barkeep.png' },
  [TextureName.bg_conflict_drunkard]: { path: '/images/tutorial/background/conflict/bg_conflict_drunkard.png' },
  [TextureName.bg_conflict_player]: { path: '/images/tutorial/background/conflict/bg_conflict_player.png' },

  [TextureName.bg_barkeep_background]: { path: '/images/tutorial/background/barkeep/bg_barkeep_background.png' },
  [TextureName.bg_barkeep_crowd_back]: { path: '/images/tutorial/background/barkeep/bg_barkeep_crowd_back.png' },
  [TextureName.bg_barkeep_crowd_front]: { path: '/images/tutorial/background/barkeep/bg_barkeep_crowd_front.png' },
  [TextureName.bg_barkeep_player]: { path: '/images/tutorial/background/barkeep/bg_barkeep_player.png' },
  [TextureName.bg_barkeep_table]: { path: '/images/tutorial/background/barkeep/bg_barkeep_table.png' },
  
  [TextureName.bg_demon_background]: { path: '/images/tutorial/background/demon/bg_demon_background.png' },
  [TextureName.bg_demon_left_hand]: { path: '/images/tutorial/background/demon/bg_demon_left_hand.png' },
  [TextureName.bg_demon_right_hand]: { path: '/images/tutorial/background/demon/bg_demon_right_hand.png' },
  [TextureName.bg_demon_victim]: { path: '/images/tutorial/background/demon/bg_demon_victim.png' },
  [TextureName.bg_demon]: { path: '/images/tutorial/background/demon/bg_demon.png' },
  [TextureName.bg_demon_left_hand_mask]: { path: '/images/tutorial/background/demon/bg_demon_left_hand_mask.png' },
  [TextureName.bg_demon_right_hand_mask]: { path: '/images/tutorial/background/demon/bg_demon_right_hand_mask.png' },
  
  [TextureName.bg_resurrection_background]: { path: '/images/tutorial/background/resurrection/bg_resurrection_background.png' },
  [TextureName.bg_resurrection_barkeep]: { path: '/images/tutorial/background/resurrection/bg_resurrection_barkeep.png' },
  [TextureName.bg_resurrection_player]: { path: '/images/tutorial/background/resurrection/bg_resurrection_player.png' },
  [TextureName.bg_resurrection_table]: { path: '/images/tutorial/background/resurrection/bg_resurrection_table.png' },

  [TextureName.bg_profile_table]: { path: '/images/scenes/profile/bg_profile_table.png' },
  [TextureName.bg_profile_player]: { path: '/images/scenes/profile/bg_profile_player.png' },
  [TextureName.bg_profile_items]: { path: '/images/scenes/profile/bg_profile_items.png' },
  [TextureName.bg_profile_book_mask]: { path: '/images/scenes/profile/bg_profile_book_mask.png' },
  [TextureName.bg_profile_chest_mask]: { path: '/images/scenes/profile/bg_profile_chest_mask.png' },
  [TextureName.bg_profile_background]: { path: '/images/scenes/profile/bg_profile_background.png' },
  [TextureName.bg_profile_door_mask]: { path: '/images/scenes/profile/bg_profile_door_mask.png' },

  [TextureName.bg_leaderboards]: { path: '/images/scenes/leaderboards/bg_leaderboards.png' },
}

interface SceneData {
  backgrounds: SceneBackgroundObject[],
  items?: SceneObject[],
  scaleAddon?: number
}

interface SceneBackgroundObject {
  texture: TextureName,
  shiftMultiplier: number,
  renderOrder: number,
  animatedIdle?: number,
  hidden?: boolean,
  opaque?: boolean,
  animateShift?: {
    enabled: boolean,
    isLeft: boolean,
    speed: number
  }
}

interface SceneObject {
  name: string,
  color: string,
  description: string,
  mask: TextureName,
  renderOrder: number,
}

const sceneBackgrounds: Record<SceneName, SceneData> = {
  [SceneName.Gate]: {
    backgrounds: [
      { texture: TextureName.bg_entrance_background, shiftMultiplier: -0.008, renderOrder: 0 },
      { texture: TextureName.bg_entrance_tavern, shiftMultiplier: -0.005, renderOrder: 1 },
      { texture: TextureName.bg_entrance_sign, shiftMultiplier: -0.003, renderOrder: 2 },
      { texture: TextureName.bg_entrance_fog_background, shiftMultiplier: 0.0, renderOrder: 3, opaque: true, animateShift: { enabled: true, isLeft: false, speed: 0.0005 } },
      { texture: TextureName.bg_entrance_player, shiftMultiplier: 0.002, renderOrder: 4 },
      { texture: TextureName.bg_entrance_fog_foreground, shiftMultiplier: 0.01, renderOrder: 5, opaque: true, animateShift: { enabled: true, isLeft: true, speed: 0.0005 } },
      { texture: TextureName.bg_entrance_foreground, shiftMultiplier: 0.012, renderOrder: 6 },
    ],
    items: [
      { name: 'door', color: 'ff0000', description: 'Knock on door', mask: TextureName.bg_entrance_door_mask, renderOrder: 1 },
    ],
    scaleAddon: 0.046
  },
  [SceneName.Door]: { backgrounds: [{ texture: TextureName.bg_door, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.Profile]: {
    backgrounds: [
      { texture: TextureName.bg_profile_background, shiftMultiplier: -0.03, renderOrder: 0 },
      { texture: TextureName.bg_profile_player, shiftMultiplier: -0.002, renderOrder: 1 },
      { texture: TextureName.bg_profile_items, shiftMultiplier: 0.005, renderOrder: 2 },
      { texture: TextureName.bg_profile_table, shiftMultiplier: 0.015, renderOrder: 3 },
    ],
    items: [
      { name: 'door', color: 'ff0000', description: 'Exit tavern', mask: TextureName.bg_profile_door_mask, renderOrder: 0 },
      { name: 'book', color: 'ffff00', description: 'Your Duelists', mask: TextureName.bg_profile_book_mask, renderOrder: 2 },
      { name: 'chest', color: '0000ff', description: 'Card Packs', mask: TextureName.bg_profile_chest_mask, renderOrder: 2 },
    ],
    scaleAddon: 0.065
  },
  [SceneName.Tavern]: {
    backgrounds: [
      { texture: TextureName.bg_tavern_background, shiftMultiplier: -0.015, renderOrder: 0 },
      { texture: TextureName.bg_tavern_bartender, shiftMultiplier: 0.005, renderOrder: 1 },
      { texture: TextureName.bg_tavern_bar, shiftMultiplier: 0.01, renderOrder: 2 },
    ],
    items: [
      { name: 'pistol', color: 'ff0000', description: 'Leaderboards', mask: TextureName.bg_tavern_trophy_mask, renderOrder: 0 },
      { name: 'shovel', color: 'ffff00', description: 'Past Duels', mask: TextureName.bg_tavern_crypt_mask, renderOrder: 0 },
      { name: 'bartender', color: '00ff00', description: 'Bartender', mask: TextureName.bg_tavern_bartender_mask, renderOrder: 1 },
      { name: 'bottle', color: '0000ff', description: 'Dueling', mask: TextureName.bg_tavern_bar_mask, renderOrder: 2 },
    ],
    scaleAddon: 0.045
  },
  [SceneName.Duelists]: {
    backgrounds: [
      { texture: TextureName.bg_duelists_background, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_duelists_pistol, shiftMultiplier: 0, renderOrder: 1 },
      { texture: TextureName.bg_duelists_matchmaking, shiftMultiplier: 0, renderOrder: 2 },
      { texture: TextureName.bg_duelists_tutorial, shiftMultiplier: 0, renderOrder: 3 },
    ],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duelists_background_mask, renderOrder: 0 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duelists_background_mask, renderOrder: 0 },
      { name: 'pistol', color: '0000ff', description: 'Your Duels', mask: TextureName.bg_duelists_pistol_mask, renderOrder: 1 },
      { name: 'matchmaking', color: 'ffff00', description: 'Matchmaking', mask: TextureName.bg_duelists_matchmaking_mask, renderOrder: 2 },
      { name: 'tutorial', color: 'ff00ff', description: 'Tutorial', mask: TextureName.bg_duelists_tutorial_mask, renderOrder: 3 },
    ]
  },
  [SceneName.DuelsBoard]: {
    backgrounds: [{ texture: TextureName.bg_duels, shiftMultiplier: 0, renderOrder: 0 }],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duels_mask, renderOrder: 0 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duels_mask, renderOrder: 0 },
    ]
  },
  [SceneName.Leaderboards]: {
    backgrounds: [{ texture: TextureName.bg_leaderboards, shiftMultiplier: 0, renderOrder: 0 }]
  },
  [SceneName.Graveyard]: {
    backgrounds: [{ texture: TextureName.bg_graveyard, shiftMultiplier: 0, renderOrder: 0 }],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_graveyard_mask, renderOrder: 0 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_graveyard_mask, renderOrder: 0 },
    ]
  },
  [SceneName.Tournament]: { backgrounds: [{ texture: TextureName.bg_duels_live, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.IRLTournament]: { backgrounds: [{ texture: TextureName.bg_duels_live, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.Duel]: undefined,
  //Tutorial Scenes
  [SceneName.Tutorial]: {
    backgrounds: [
      { texture: TextureName.bg_entry_background, shiftMultiplier: -0.015, renderOrder: 0 },
      { texture: TextureName.bg_entry_barkeep, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_entry_bar, shiftMultiplier: -0.005, renderOrder: 2 },
      { texture: TextureName.bg_entry_crowd, shiftMultiplier: 0.01, renderOrder: 3 },
      { texture: TextureName.bg_entry_player, shiftMultiplier: 0.02, renderOrder: 4 },
    ],
    scaleAddon: 0.045
  },
  [SceneName.TutorialScene2]: {
    backgrounds: [
      { texture: TextureName.bg_conflict_background, shiftMultiplier: -0.02, renderOrder: 0 },
      { texture: TextureName.bg_conflict_drunkard, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_conflict_player, shiftMultiplier: 0.00, renderOrder: 2 },
      { texture: TextureName.bg_conflict_bar, shiftMultiplier: 0.01, renderOrder: 3 },
      { texture: TextureName.bg_conflict_barkeep, shiftMultiplier: 0.02, renderOrder: 4 },
    ],
    scaleAddon: 0.045
  },
  [SceneName.TutorialScene3]: { 
    backgrounds: [
      { texture: TextureName.bg_barkeep_background, shiftMultiplier: -0.02, renderOrder: 0 },
      { texture: TextureName.bg_barkeep_crowd_back, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_barkeep_player, shiftMultiplier: 0.003, renderOrder: 2 },
      { texture: TextureName.bg_barkeep_crowd_front, shiftMultiplier: 0.01, renderOrder: 3 },
      { texture: TextureName.bg_barkeep_table, shiftMultiplier: 0.02, renderOrder: 4 },
    ],
    scaleAddon: 0.045
  },
  [SceneName.TutorialScene4]: {
    backgrounds: [
      { texture: TextureName.bg_demon_background, shiftMultiplier: 0.03, renderOrder: 0, hidden: true },
      { texture: TextureName.bg_demon_victim, shiftMultiplier: 0.02, renderOrder: 1, hidden: true },
      { texture: TextureName.bg_demon, shiftMultiplier: 0.01, renderOrder: 2 },
      { texture: TextureName.bg_demon_left_hand, shiftMultiplier: -0.01, renderOrder: 3, animatedIdle: 0.01 },
      { texture: TextureName.bg_demon_right_hand, shiftMultiplier: -0.01, renderOrder: 4, animatedIdle: 0.01 },
    ],
    items: [
      { name: 'demon_left', color: 'ff0000', description: 'Drink, forget this happened', mask: TextureName.bg_demon_left_hand_mask, renderOrder: 3 },
      { name: 'demon_right', color: '0000ff', description: 'Take the gun, become my patron', mask: TextureName.bg_demon_right_hand_mask, renderOrder: 4 },
    ],
    scaleAddon: 0.01
  },
  [SceneName.TutorialScene5]: {
    backgrounds: [
      { texture: TextureName.bg_resurrection_background, shiftMultiplier: -0.02, renderOrder: 0 },
      { texture: TextureName.bg_resurrection_table, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_resurrection_barkeep, shiftMultiplier: -0.005, renderOrder: 2 },
      { texture: TextureName.bg_resurrection_player, shiftMultiplier: 0.005, renderOrder: 3 },
    ],
    scaleAddon: 0.045
  },
  [SceneName.TutorialDuel]: undefined
}

enum CharacterType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}
enum AnimName {
  STILL = 'STILL',
  STILL_BLADE = 'STILL_BLADE',
  STEP_1 = 'STEP_1',
  STEP_2 = 'STEP_2',
  TWO_STEPS = 'TWO_STEPS',
  SHOOT = 'SHOOT',
  DODGE_FRONT = 'DODGE_FRONT',
  DODGE_BACK = 'DODGE_BACK',
  SHOT_INJURED_BACK = 'SHOT_INJURED_BACK',
  SHOT_INJURED_FRONT = 'SHOT_INJURED_FRONT',
  SHOT_DEAD_BACK = 'SHOT_DEAD_BACK',
  SHOT_DEAD_FRONT = 'SHOT_DEAD_FRONT',
  STRIKE_LIGHT = 'STRIKE_LIGHT',
  STRIKE_HEAVY = 'STRIKE_HEAVY',
  STRIKE_BLOCK = 'STRIKE_BLOCK',
  STRUCK_INJURED = 'STRUCK_INJURED',
  STRUCK_DEAD = 'STRUCK_DEAD',
  SEPPUKU = 'SEPPUKU',
}
interface AnimationAsset {
  path: string
  frameCount: number
  frameRate: number
}
type Spritesheets = {
  [key in CharacterType]: Animations
}
type Animations = {
  [key in AnimName]: AnimationAsset
}
const SPRITESHEETS: Spritesheets = {
  FEMALE: {
    [AnimName.STILL]: {
      path: '/textures/animations/Female Duelist/Still',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Female Duelist/Still_Blade',
      frameCount: 1,
      frameRate: 8,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Female Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Female Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Female Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Female Duelist/Shoot',
      frameCount: 10,
      frameRate: 8,
    },
    [AnimName.DODGE_BACK]: {
      path: '/textures/animations/Female Duelist/Dodge_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.DODGE_FRONT]: {
      path: '/textures/animations/Female Duelist/Dodge_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Female Duelist/Struck_Injured',
      frameCount: 6,
      frameRate: 8,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Female Duelist/Struck_Dead',
      frameCount: 6,
      frameRate: 8,
    },
    [AnimName.SEPPUKU]: {
      path: '/textures/animations/Female Duelist/Seppuku',
      frameCount: 19,
      frameRate: 8,
    },
  },
  MALE: {
    [AnimName.STILL]: {
      path: '/textures/animations/Male Duelist/Still',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Male Duelist/Still_Blade',
      frameCount: 1,
      frameRate: 8,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Male Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Male Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Male Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Male Duelist/Shoot',
      frameCount: 11,
      frameRate: 8,
    },
    [AnimName.DODGE_BACK]: {
      path: '/textures/animations/Male Duelist/Dodge_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.DODGE_FRONT]: {
      path: '/textures/animations/Male Duelist/Dodge_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Back',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Front',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Male Duelist/Struck_Injured',
      frameCount: 16,
      frameRate: 8,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Male Duelist/Struck_Dead',
      frameCount: 12,
      frameRate: 8,
    },
    [AnimName.SEPPUKU]: {
      path: '/textures/animations/Male Duelist/Seppuku',
      frameCount: 16,
      frameRate: 8,
    },
  },
}


export type {
  TextureAttributes,
  SceneData,
  SceneBackgroundObject,
  SceneObject,
}

export {
  SceneName,
  TextureName,
  CharacterType,
  AnimName,
  TEXTURES,
  SPRITESHEETS,
  sceneBackgrounds,
}