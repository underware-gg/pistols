enum SceneName {
  Gate = 'Gate',
  Door = 'Door',
  
  Tavern = 'Tavern',
  
  Profile = 'Profile',
  CardPacks = 'CardPacks',
  DuelistBook = 'DuelistBook',
  
  Duelists = 'Duelists',
  Matchmaking = 'Matchmaking',
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
  Testcard = "Testcard",

  duel_ground = "duel_ground",
  duel_ground_normal = "duel_ground_normal",
  duel_water_dudv = "duel_water_dudv",
  duel_water_map = "duel_water_map",
  cliffs = "cliffs",

  bg_entrance_background = "bg_entrance_background",
  bg_entrance_tavern = "bg_entrance_tavern",
  bg_entrance_sign = "bg_entrance_sign",
  bg_entrance_player = "bg_entrance_player",
  bg_entrance_foreground = "bg_entrance_foreground",
  bg_entrance_door_mask = "bg_entrance_door_mask",
  bg_entrance_fog_background = "bg_entrance_fog_background",
  bg_entrance_fog_foreground = "bg_entrance_fog_foreground",

  bg_door_background = "bg_door_background",
  bg_door_door = "bg_door_door",
  bg_door_face = "bg_door_face",
  bg_door_face_blink = "bg_door_face_blink",
  bg_door_face_angry = "bg_door_face_angry",
  bg_door_face_angry_blink = "bg_door_face_angry_blink",

  bg_tavern_bar = "bg_tavern_bar",
  bg_tavern_pistol_mask = "bg_tavern_pistol_mask",
  bg_tavern_bartender = "bg_tavern_bartender",
  bg_tavern_bartender_mask = "bg_tavern_bartender_mask",
  bg_tavern_background = "bg_tavern_background",
  bg_tavern_crypt_mask = "bg_tavern_crypt_mask",
  bg_tavern_trophy_mask = "bg_tavern_trophy_mask",

  bg_duelists_background = "bg_duelists_background",
  bg_duelists_items = "bg_duelists_items",
  bg_duelists_items_mask = "bg_duelists_items_mask",
  bg_duelists_pistol = "bg_duelists_pistol",
  bg_duelists_pistol_mask = "bg_duelists_pistol_mask",
  bg_duelists_matchmaking_ranked = "bg_duelists_matchmaking_ranked",
  bg_duelists_matchmaking_unranked = "bg_duelists_matchmaking_unranked",
  bg_duelists_matchmaking_singleplayer = "bg_duelists_singleplayer",
  bg_duelists_matchmaking_mask = "bg_duelists_matchmaking_mask",
  bg_duelists_mode_button = "bg_duelists_mode_button",
  bg_duelists_mode_button_mask = "bg_duelists_mode_button_mask",
  bg_duelists_tutorial = "bg_duelists_tutorial",
  bg_duelists_tutorial_mask = "bg_duelists_tutorial_mask",

  bg_matchmaking_unranked = "bg_matchmaking_unranked",
  bg_matchmaking_ranked = "bg_matchmaking_ranked",
  bg_matchmaking_bell = "bg_matchmaking_bell",
  bg_matchmaking_bell_mask = "bg_matchmaking_bell_mask",

  bg_duels_background = "bg_duels_background",
  bg_duels_items = "bg_duels_items",
  bg_duels_items_mask = "bg_duels_items_mask",

  bg_graveyard_background = "bg_graveyard_background",
  bg_graveyard_items = "bg_graveyard_items",
  bg_graveyard_items_mask = "bg_graveyard_items_mask",

  bg_entry_background = "bg_entry_background",
  bg_entry_bar = "bg_entry_bar",
  bg_entry_barkeep = "bg_entry_barkeep",
  bg_entry_crowd = "bg_entry_crowd",
  bg_entry_player = "bg_entry_player",

  bg_conflict_background = "bg_conflict_background",
  bg_conflict_bar = "bg_conflict_bar",
  bg_conflict_barkeep = "bg_conflict_barkeep",
  bg_conflict_drunkard = "bg_conflict_drunkard",
  bg_conflict_player = "bg_conflict_player",

  bg_barkeep_background = "bg_barkeep_background",
  bg_barkeep_crowd_back = "bg_barkeep_crowd_back",
  bg_barkeep_crowd_front = "bg_barkeep_crowd_front",
  bg_barkeep_player = "bg_barkeep_player",
  bg_barkeep_table = "bg_barkeep_table",

  bg_demon_background = "bg_demon_background",
  bg_demon_left_hand = "bg_demon_left_hand",
  bg_demon_right_hand = "bg_demon_right_hand",
  bg_demon_victim = "bg_demon_victim",
  bg_demon = "bg_demon",
  bg_demon_left_hand_mask = "bg_demon_left_hand_mask",
  bg_demon_right_hand_mask = "bg_demon_right_hand_mask",

  bg_resurrection_background = "bg_resurrection_background",
  bg_resurrection_barkeep = "bg_resurrection_barkeep",
  bg_resurrection_player = "bg_resurrection_player",
  bg_resurrection_table = "bg_resurrection_table",

  bg_profile_table = "bg_profile_table",
  bg_profile_items = "bg_profile_items",
  bg_profile_player = "bg_profile_player",
  bg_profile_book_mask = "bg_profile_book_mask",
  bg_profile_chest_mask = "bg_profile_chest_mask",
  bg_profile_door_mask = "bg_profile_door_mask",
  bg_profile_background = "bg_profile_background",
  bg_profile_sky = "bg_profile_sky",
  bg_profile_doorman = "bg_profile_doorman",

  bg_duelisbook_table = "bg_duelisbook_table",

  bg_cardpacks_box = "bg_cardpacks_box",

  bg_leaderboards = "bg_leaderboards",
}
type TextureAttributes = {
  path: string
}
const TEXTURES: Record<TextureName, TextureAttributes> = {
  [TextureName.Testcard]: { path: '/textures/testcard.jpg' },
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

  [TextureName.bg_door_background]: { path: '/images/scenes/door/bg_door_background.png' },
  [TextureName.bg_door_door]: { path: '/images/scenes/door/bg_door_door.png' },
  [TextureName.bg_door_face]: { path: '/images/scenes/door/bg_door_face.png' },
  [TextureName.bg_door_face_blink]: { path: '/images/scenes/door/bg_door_face_blink.png' },
  [TextureName.bg_door_face_angry]: { path: '/images/scenes/door/bg_door_face_angry.png' },
  [TextureName.bg_door_face_angry_blink]: { path: '/images/scenes/door/bg_door_face_angry_blink.png' },

  [TextureName.bg_tavern_bar]: { path: '/images/scenes/tavern/bg_tavern_bar.png' },
  [TextureName.bg_tavern_pistol_mask]: { path: '/images/scenes/tavern/bg_tavern_pistol_mask.png' },
  [TextureName.bg_tavern_bartender]: { path: '/images/scenes/tavern/bg_tavern_bartender.png' },
  [TextureName.bg_tavern_bartender_mask]: { path: '/images/scenes/tavern/bg_tavern_bartender_mask.png' },
  [TextureName.bg_tavern_background]: { path: '/images/scenes/tavern/bg_tavern_background.png' },
  [TextureName.bg_tavern_crypt_mask]: { path: '/images/scenes/tavern/bg_tavern_crypt_mask.png' },
  [TextureName.bg_tavern_trophy_mask]: { path: '/images/scenes/tavern/bg_tavern_trophy_mask.png' },

  [TextureName.bg_duelists_background]: { path: '/images/scenes/duelists/bg_duelists_background.png' },
  [TextureName.bg_duelists_items]: { path: '/images/scenes/duelists/bg_duelists_items.png' },
  [TextureName.bg_duelists_items_mask]: { path: '/images/scenes/duelists/bg_duelists_items_mask.png' },
  [TextureName.bg_duelists_pistol]: { path: '/images/scenes/duelists/bg_duelists_pistol.png' },
  [TextureName.bg_duelists_pistol_mask]: { path: '/images/scenes/duelists/bg_duelists_pistol_mask.png' },
  [TextureName.bg_duelists_matchmaking_ranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_ranked.png' },
  [TextureName.bg_duelists_matchmaking_unranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_unranked.png' },
  [TextureName.bg_duelists_matchmaking_singleplayer]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_singleplayer.png' },
  [TextureName.bg_duelists_matchmaking_mask]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_mask.png' },
  [TextureName.bg_duelists_mode_button]: { path: '/images/scenes/duelists/bg_duelists_mode_button.png' },
  [TextureName.bg_duelists_mode_button_mask]: { path: '/images/scenes/duelists/bg_duelists_mode_button_mask.png' },
  [TextureName.bg_duelists_tutorial]: { path: '/images/scenes/duelists/bg_duelists_tutorial.png' },
  [TextureName.bg_duelists_tutorial_mask]: { path: '/images/scenes/duelists/bg_duelists_tutorial_mask.png' },

  [TextureName.bg_matchmaking_unranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_unranked.png' },
  [TextureName.bg_matchmaking_ranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_ranked.png' },
  [TextureName.bg_matchmaking_bell]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell.png' },
  [TextureName.bg_matchmaking_bell_mask]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell_mask.png' },

  [TextureName.bg_duels_background]: { path: '/images/scenes/duels_board/bg_duels_background.png' },
  [TextureName.bg_duels_items]: { path: '/images/scenes/duels_board/bg_duels_items.png' },
  [TextureName.bg_duels_items_mask]: { path: '/images/scenes/duels_board/bg_duels_items_mask.png' },

  [TextureName.bg_graveyard_background]: { path: '/images/scenes/crypt/bg_graveyard_background.jpg' },
  [TextureName.bg_graveyard_items]: { path: '/images/scenes/crypt/bg_graveyard_items.png' },
  [TextureName.bg_graveyard_items_mask]: { path: '/images/scenes/crypt/bg_graveyard_items_mask.png' },

  [TextureName.bg_entry_background]: { path: '/images/scenes/tutorial/entry/bg_entry_background.png' },
  [TextureName.bg_entry_bar]: { path: '/images/scenes/tutorial/entry/bg_entry_bar.png' },
  [TextureName.bg_entry_barkeep]: { path: '/images/scenes/tutorial/entry/bg_entry_barkeep.png' },
  [TextureName.bg_entry_crowd]: { path: '/images/scenes/tutorial/entry/bg_entry_crowd.png' },
  [TextureName.bg_entry_player]: { path: '/images/scenes/tutorial/entry/bg_entry_player.png' },

  [TextureName.bg_conflict_background]: { path: '/images/scenes/tutorial/conflict/bg_conflict_background.png' },
  [TextureName.bg_conflict_bar]: { path: '/images/scenes/tutorial/conflict/bg_conflict_bar.png' },
  [TextureName.bg_conflict_barkeep]: { path: '/images/scenes/tutorial/conflict/bg_conflict_barkeep.png' },
  [TextureName.bg_conflict_drunkard]: { path: '/images/scenes/tutorial/conflict/bg_conflict_drunkard.png' },
  [TextureName.bg_conflict_player]: { path: '/images/scenes/tutorial/conflict/bg_conflict_player.png' },

  [TextureName.bg_barkeep_background]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_background.png' },
  [TextureName.bg_barkeep_crowd_back]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_back.png' },
  [TextureName.bg_barkeep_crowd_front]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_front.png' },
  [TextureName.bg_barkeep_player]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_player.png' },
  [TextureName.bg_barkeep_table]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_table.png' },
  
  [TextureName.bg_demon_background]: { path: '/images/scenes/tutorial/demon/bg_demon_background.png' },
  [TextureName.bg_demon_left_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand.png' },
  [TextureName.bg_demon_right_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand.png' },
  [TextureName.bg_demon_victim]: { path: '/images/scenes/tutorial/demon/bg_demon_victim.png' },
  [TextureName.bg_demon]: { path: '/images/scenes/tutorial/demon/bg_demon.png' },
  [TextureName.bg_demon_left_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand_mask.png' },
  [TextureName.bg_demon_right_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand_mask.png' },
  
  [TextureName.bg_resurrection_background]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_background.png' },
  [TextureName.bg_resurrection_barkeep]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_barkeep.png' },
  [TextureName.bg_resurrection_player]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_player.png' },
  [TextureName.bg_resurrection_table]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_table.png' },

  [TextureName.bg_profile_table]: { path: '/images/scenes/profile/bg_profile_table.png' },
  [TextureName.bg_profile_player]: { path: '/images/scenes/profile/bg_profile_player.png' },
  [TextureName.bg_profile_items]: { path: '/images/scenes/profile/bg_profile_items.png' },
  [TextureName.bg_profile_book_mask]: { path: '/images/scenes/profile/bg_profile_book_mask.png' },
  [TextureName.bg_profile_chest_mask]: { path: '/images/scenes/profile/bg_profile_chest_mask.png' },
  [TextureName.bg_profile_background]: { path: '/images/scenes/profile/bg_profile_background.png' },
  [TextureName.bg_profile_door_mask]: { path: '/images/scenes/profile/bg_profile_door_mask.png' },
  [TextureName.bg_profile_sky]: { path: '/images/scenes/profile/bg_profile_sky.png' },
  [TextureName.bg_profile_doorman]: { path: '/images/scenes/profile/bg_profile_doorman.png' },

  [TextureName.bg_duelisbook_table]: { path: '/images/scenes/profile/duelistbook/bg_duelistbook_table.png' },
  
  [TextureName.bg_cardpacks_box]: { path: '/images/scenes/profile/cardpacks/bg_cardpack_box.png' },

  [TextureName.bg_leaderboards]: { path: '/images/scenes/leaderboards/bg_leaderboards.png' },
}

// Animation System Types
interface TextureState {
  texture: TextureName;
  nextTextures: TextureName[];  // Array of possible next texture names
  minDuration: number;
  maxDuration: number;
  baseDuration: number;  // The center of the normal distribution
  transitionProbabilities?: number[];  // optional weights for next textures
}

interface AnimatedLayer {
  currentState: TextureState;
  nextTexture: TextureName;
  currentDuration: number;
  startTime: number;
}

interface TextureVariant {
  name: string;
  texture: TextureName
}

interface SceneBackgroundObject {
  texture: TextureName,
  variants?: TextureVariant[],
  shiftMultiplier: number,
  renderOrder: number,
  animatedIdle?: number,
  hidden?: boolean,
  opaque?: boolean,
  blurred?: boolean,
  samples?: number,
  animateShift?: {
    enabled: boolean,
    isLeft: boolean,
    speed: number
  },
  states?: TextureState[],
  isAnimated?: boolean,
}

interface SceneData {
  backgrounds: SceneBackgroundObject[],
  items?: SceneObject[],
  scaleAddon?: number
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
      { texture: TextureName.bg_entrance_foreground, shiftMultiplier: 0.012, renderOrder: 5 },
      { texture: TextureName.bg_entrance_fog_foreground, shiftMultiplier: 0.01, renderOrder: 6, opaque: true, animateShift: { enabled: true, isLeft: true, speed: 0.0005 } },
    ],
    items: [
      { name: 'door', color: 'ff0000', description: 'Knock on door', mask: TextureName.bg_entrance_door_mask, renderOrder: 1 },
    ],
    scaleAddon: 0.013
  },
  [SceneName.Door]: { 
    backgrounds: [
      { texture: TextureName.bg_door_background, shiftMultiplier: -0.005, renderOrder: 0 },
      { texture: TextureName.bg_door_face, shiftMultiplier: 0.001, renderOrder: 1, states: [
        { texture: TextureName.bg_door_face, minDuration: 0.5, maxDuration: 5, baseDuration: 3.25, nextTextures: [TextureName.bg_door_face_blink] },
        { texture: TextureName.bg_door_face_blink, minDuration: 0.1, maxDuration: 0.2, baseDuration: 0.15, nextTextures: [TextureName.bg_door_face] },
      ] },
      { texture: TextureName.bg_door_face_angry, shiftMultiplier: 0.001, renderOrder: 2, isAnimated: true, states: [
        { texture: TextureName.bg_door_face_angry, minDuration: 0.5, maxDuration: 5, baseDuration: 3.25, nextTextures: [TextureName.bg_door_face_angry_blink] },
        { texture: TextureName.bg_door_face_angry_blink, minDuration: 0.1, maxDuration: 0.2, baseDuration: 0.15, nextTextures: [TextureName.bg_door_face_angry] },
      ] },
      { texture: TextureName.bg_door_door, shiftMultiplier: 0.005, renderOrder: 3 },
    ] 
  },

  [SceneName.Tavern]: {
    backgrounds: [
      { texture: TextureName.bg_tavern_background, shiftMultiplier: -0.01, renderOrder: 0 },
      { texture: TextureName.bg_tavern_bartender, shiftMultiplier: 0.004, renderOrder: 1 },
      { texture: TextureName.bg_tavern_bar, shiftMultiplier: 0.011, renderOrder: 2 },
    ],
    items: [
      { name: 'pistol', color: 'ff0000', description: 'Leaderboards', mask: TextureName.bg_tavern_trophy_mask, renderOrder: 0 },
      { name: 'shovel', color: 'ffff00', description: 'Past Duels', mask: TextureName.bg_tavern_crypt_mask, renderOrder: 0 },
      { name: 'bartender', color: '00ff00', description: 'Bartender', mask: TextureName.bg_tavern_bartender_mask, renderOrder: 1 },
      { name: 'bottle', color: '0000ff', description: 'Dueling', mask: TextureName.bg_tavern_pistol_mask, renderOrder: 2 },
    ],
    scaleAddon: 0.014
  },

  [SceneName.Profile]: {
    backgrounds: [
      { texture: TextureName.bg_profile_sky, shiftMultiplier: -0.04, renderOrder: 0 },
      { texture: TextureName.bg_profile_background, shiftMultiplier: -0.028, renderOrder: 1 },
      { texture: TextureName.bg_profile_doorman, shiftMultiplier: -0.025, renderOrder: 2 },
      { texture: TextureName.bg_profile_player, shiftMultiplier: -0.002, renderOrder: 3 },
      { texture: TextureName.bg_profile_items, shiftMultiplier: 0.005, renderOrder: 4 },
      { texture: TextureName.bg_profile_table, shiftMultiplier: 0.015, renderOrder: 5 },
    ],
    items: [
      { name: 'door', color: 'ff0000', description: 'Exit tavern', mask: TextureName.bg_profile_door_mask, renderOrder: 1 },
      { name: 'book', color: 'ffff00', description: 'Your Duelists', mask: TextureName.bg_profile_book_mask, renderOrder: 4 },
      { name: 'chest', color: '0000ff', description: 'Card Packs', mask: TextureName.bg_profile_chest_mask, renderOrder: 4 },
    ],
    scaleAddon: 0.02
  },
  [SceneName.CardPacks]: {
    backgrounds: [
      { texture: TextureName.bg_cardpacks_box, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_cardpacks_box, shiftMultiplier: 0, renderOrder: 0 },
    ]
  },
  [SceneName.DuelistBook]: {
    backgrounds: [
      { texture: TextureName.bg_duelisbook_table, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_duelisbook_table, shiftMultiplier: 0, renderOrder: 0 },
    ]
  },

  [SceneName.Duelists]: {
    backgrounds: [
      { texture: TextureName.bg_duelists_background, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_duelists_items, shiftMultiplier: 0, renderOrder: 1 },
      { texture: TextureName.bg_duelists_pistol, shiftMultiplier: 0, renderOrder: 2 },
      { texture: TextureName.bg_duelists_matchmaking_unranked, shiftMultiplier: 0, renderOrder: 3, variants: [
          { name: 'unranked', texture: TextureName.bg_duelists_matchmaking_unranked },
          { name: 'ranked', texture: TextureName.bg_duelists_matchmaking_ranked },
          { name: 'singleplayer', texture: TextureName.bg_duelists_matchmaking_singleplayer },
        ] 
      },
      { texture: TextureName.bg_duelists_tutorial, shiftMultiplier: 0, renderOrder: 3 },
      { texture: TextureName.bg_duelists_mode_button, shiftMultiplier: 0, renderOrder: 4 },
    ],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duelists_items_mask, renderOrder: 1 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duelists_items_mask, renderOrder: 1 },
      { name: 'pistol', color: '0000ff', description: 'Your Duels', mask: TextureName.bg_duelists_pistol_mask, renderOrder: 2 },
      { name: 'matchmaking', color: 'ffff00', description: 'Play!', mask: TextureName.bg_duelists_matchmaking_mask, renderOrder: 3 },
      { name: 'tutorial', color: 'ff00ff', description: 'Tutorial', mask: TextureName.bg_duelists_tutorial_mask, renderOrder: 3 },
      { name: 'mode', color: '00ffff', description: 'Select Mode', mask: TextureName.bg_duelists_mode_button_mask, renderOrder: 4 },
    ]
  },
  [SceneName.Matchmaking]: {
    backgrounds: [
      { texture: TextureName.bg_matchmaking_unranked, shiftMultiplier: 0, renderOrder: 0, variants: [
          { name: 'unranked', texture: TextureName.bg_matchmaking_unranked },
          { name: 'ranked', texture: TextureName.bg_matchmaking_ranked },
        ] 
      },
      { texture: TextureName.bg_matchmaking_bell, shiftMultiplier: 0, renderOrder: 1 },
    ],
    items: [
      { name: 'bell', color: 'ff0000', description: 'Commit Duelists to Matchmaking!', mask: TextureName.bg_matchmaking_bell_mask, renderOrder: 1 },
    ]
  },
  [SceneName.DuelsBoard]: {
    backgrounds: [
      { texture: TextureName.bg_duels_background, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_duels_items, shiftMultiplier: 0, renderOrder: 1 },
    ],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duels_items_mask, renderOrder: 1 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duels_items_mask, renderOrder: 1 },
    ]
  },
  [SceneName.Leaderboards]: {
    backgrounds: [
      { texture: TextureName.bg_leaderboards, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_leaderboards, shiftMultiplier: 0, renderOrder: 0 },
    ]
  },
  [SceneName.Graveyard]: {
    backgrounds: [
      { texture: TextureName.bg_graveyard_background, shiftMultiplier: 0, renderOrder: 0 },
      { texture: TextureName.bg_graveyard_items, shiftMultiplier: 0, renderOrder: 1 },
    ],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_graveyard_items_mask, renderOrder: 1 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_graveyard_items_mask, renderOrder: 1 },
    ]
  },
  [SceneName.Tournament]: { backgrounds: [] },
  [SceneName.IRLTournament]: { backgrounds: [] },
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
    scaleAddon: 0.021
  },
  [SceneName.TutorialScene2]: {
    backgrounds: [
      { texture: TextureName.bg_conflict_background, shiftMultiplier: -0.01, renderOrder: 0 },
      { texture: TextureName.bg_conflict_drunkard, shiftMultiplier: -0.002, renderOrder: 1 },
      { texture: TextureName.bg_conflict_player, shiftMultiplier: 0.002, renderOrder: 2 },
      { texture: TextureName.bg_conflict_bar, shiftMultiplier: 0.01, renderOrder: 3 },
      { texture: TextureName.bg_conflict_barkeep, shiftMultiplier: 0.02, renderOrder: 4 },
    ],
    scaleAddon: 0.021
  },
  [SceneName.TutorialScene3]: { 
    backgrounds: [
      { texture: TextureName.bg_barkeep_background, shiftMultiplier: -0.02, renderOrder: 0 },
      { texture: TextureName.bg_barkeep_crowd_back, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_barkeep_player, shiftMultiplier: 0.003, renderOrder: 2 },
      { texture: TextureName.bg_barkeep_crowd_front, shiftMultiplier: 0.01, renderOrder: 3 },
      { texture: TextureName.bg_barkeep_table, shiftMultiplier: 0.02, renderOrder: 4 },
    ],
    scaleAddon: 0.021
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
    scaleAddon: 0.031
  },
  [SceneName.TutorialScene5]: {
    backgrounds: [
      { texture: TextureName.bg_resurrection_background, shiftMultiplier: -0.02, renderOrder: 0 },
      { texture: TextureName.bg_resurrection_table, shiftMultiplier: -0.01, renderOrder: 1 },
      { texture: TextureName.bg_resurrection_barkeep, shiftMultiplier: -0.005, renderOrder: 2 },
      { texture: TextureName.bg_resurrection_player, shiftMultiplier: 0.005, renderOrder: 3 },
    ],
    scaleAddon: 0.021
  },
  [SceneName.TutorialDuel]: undefined
}

enum CharacterType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  CARD = 'CARD',
  EXPLOSION = 'EXPLOSION',
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
  BURN = 'BURN',
  EXPLODE = 'EXPLODE',
}
interface AnimationAsset {
  path?: string
  frameCount?: number
  frameRate?: number
  isFlipped?: boolean
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
      isFlipped: true,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Female Duelist/Still_Blade',
      frameCount: 8,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Female Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Female Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Female Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Female Duelist/Shoot',
      frameCount: 10,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.DODGE_BACK]: {
      path: '/textures/animations/Female Duelist/Dodge_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.DODGE_FRONT]: {
      path: '/textures/animations/Female Duelist/Dodge_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Injured_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Female Duelist/Shot_Dead_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Female Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Female Duelist/Struck_Injured',
      frameCount: 6,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Female Duelist/Struck_Dead',
      frameCount: 10,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.SEPPUKU]: {
      path: '/textures/animations/Female Duelist/Seppuku',
      frameCount: 19,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.BURN]: {
      path: '',
      frameCount: 0,
      frameRate: 0,
      isFlipped: false,
    },
    [AnimName.EXPLODE]: { 
      path: '',
      frameCount: 0,
      frameRate: 0,
      isFlipped: false,
    },
  },
  MALE: {
    [AnimName.STILL]: {
      path: '/textures/animations/Male Duelist/Still',
      frameCount: 8,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.STILL_BLADE]: {
      path: '/textures/animations/Male Duelist/Still_Blade',
      frameCount: 8,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.STEP_1]: {
      path: '/textures/animations/Male Duelist/Step_1',
      frameCount: 8,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STEP_2]: {
      path: '/textures/animations/Male Duelist/Step_2',
      frameCount: 8,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.TWO_STEPS]: {
      path: '/textures/animations/Male Duelist/Two_Steps',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOOT]: {
      path: '/textures/animations/Male Duelist/Shoot',
      frameCount: 11,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.DODGE_BACK]: {
      path: '/textures/animations/Male Duelist/Dodge_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.DODGE_FRONT]: {
      path: '/textures/animations/Male Duelist/Dodge_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_INJURED_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_INJURED_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Injured_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_DEAD_BACK]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Back',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.SHOT_DEAD_FRONT]: {
      path: '/textures/animations/Male Duelist/Shot_Dead_Front',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_LIGHT]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_HEAVY]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRIKE_BLOCK]: {
      path: '/textures/animations/Male Duelist/Strike',
      frameCount: 13,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRUCK_INJURED]: {
      path: '/textures/animations/Male Duelist/Struck_Injured',
      frameCount: 16,
      frameRate: 8,
      isFlipped: false,
    },
    [AnimName.STRUCK_DEAD]: {
      path: '/textures/animations/Male Duelist/Struck_Dead',
      frameCount: 8,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.SEPPUKU]: {
      path: '/textures/animations/Male Duelist/Seppuku',
      frameCount: 16,
      frameRate: 8,
      isFlipped: true,
    },
    [AnimName.BURN]: {},
    [AnimName.EXPLODE]: {},
  },
  CARD: {
    [AnimName.STILL]: {
      path: '/textures/animations/Card/Idle',
      frameCount: 3,
      frameRate: 8,
    },
    [AnimName.BURN]: {
      path: '/textures/animations/Card/Burn',
      frameCount: 7,
      frameRate: 8,
    },
    [AnimName.EXPLODE]: {},
    [AnimName.STILL_BLADE]: {},
    [AnimName.STEP_1]: {},
    [AnimName.STEP_2]: {},
    [AnimName.TWO_STEPS]: {},
    [AnimName.SHOOT]: {},
    [AnimName.DODGE_BACK]: {},
    [AnimName.DODGE_FRONT]: {},
    [AnimName.STRUCK_INJURED]: {},
    [AnimName.STRUCK_DEAD]: {},
    [AnimName.SEPPUKU]: {},
    [AnimName.STRIKE_LIGHT]: {},
    [AnimName.STRIKE_HEAVY]: {},
    [AnimName.STRIKE_BLOCK]: {},
    [AnimName.SHOT_INJURED_BACK]: {},
    [AnimName.SHOT_INJURED_FRONT]: {},
    [AnimName.SHOT_DEAD_BACK]: {},
    [AnimName.SHOT_DEAD_FRONT]: {},
  },
  EXPLOSION: {
    [AnimName.EXPLODE]: {
      path: '/textures/animations/Explosion/Explode',
      frameCount: 6,
      frameRate: 8,
    },
    [AnimName.STILL]: {},
    [AnimName.BURN]: {},
    [AnimName.STILL_BLADE]: {},
    [AnimName.STEP_1]: {},
    [AnimName.STEP_2]: {},
    [AnimName.TWO_STEPS]: {},
    [AnimName.SHOOT]: {},
    [AnimName.DODGE_BACK]: {},
    [AnimName.DODGE_FRONT]: {},
    [AnimName.STRUCK_INJURED]: {},
    [AnimName.STRUCK_DEAD]: {},
    [AnimName.SEPPUKU]: {},
    [AnimName.STRIKE_LIGHT]: {},
    [AnimName.STRIKE_HEAVY]: {},
    [AnimName.STRIKE_BLOCK]: {},
    [AnimName.SHOT_INJURED_BACK]: {},
    [AnimName.SHOT_INJURED_FRONT]: {},
    [AnimName.SHOT_DEAD_BACK]: {},
    [AnimName.SHOT_DEAD_FRONT]: {},
  }
}


export type {
  TextureAttributes,
  SceneData,
  SceneBackgroundObject,
  AnimatedLayer,
  TextureState,
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