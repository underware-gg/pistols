enum SceneName {
  Gate = 'Gate',
  Door = 'Door',
  Profile = 'Profile',
  Tavern = 'Tavern',
  Duelists = 'Duelists',
  DuelsBoard = 'Your Duels',
  Graveyard = 'Graveyard',
  Tournament = 'Tournament',
  IRLTournament = 'IRL Tournament',
  Duel = 'Duel',
  Tutorial = 'TutorialStart',
  TutorialScene2 = 'TutorialScene2',
  TutorialScene3 = 'TutorialScene3',
  TutorialScene4 = 'TutorialScene4',
  TutorialScene5 = 'TutorialScene5',
}


//----------------------------
// Texture Assets
//
enum TextureName {
  Testcard = 'Testcard',
  bg_gate = 'bg_gate',
  bg_door = 'bg_door',
  bg_gate_mask = 'bg_gate_mask',
  bg_profile = 'bg_profile',
  bg_tavern = 'bg_tavern',
  bg_tavern_mask = 'bg_tavern_mask',
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
  bg_tavern_bar_test = 'bg_tavern_bar_test',
  bg_tavern_bar_test_mask = 'bg_tavern_bar_test_mask',
  bg_tavern_bartender_test = 'bg_tavern_bartender_test',
  bg_tavern_bartender_test_mask = 'bg_tavern_bartender_test_mask',
  bg_tavern_door_test = 'bg_tavern_door_test',
  bg_tavern_door_test_mask = 'bg_tavern_door_test_mask',
  bg_tavern_test = 'bg_tavern_test',
  bg_tavern_test_mask = 'bg_tavern_test_mask',
  bg_tutorial_1 = 'bg_tutorial_1',
  bg_tutorial_2 = 'bg_tutorial_2',
  bg_tutorial_3 = 'bg_tutorial_3',
  bg_tutorial_4 = 'bg_tutorial_4',
  bg_tutorial_5 = 'bg_tutorial_5',
}
type TextureAttributes = {
  path: string
}
const TEXTURES: Record<TextureName, TextureAttributes> = {
  [TextureName.Testcard]: { path: '/textures/testcard.jpg' },
  [TextureName.bg_gate]: { path: '/images/bg_gate.jpg' },
  [TextureName.bg_door]: { path: '/images/bg_door.jpg' },
  [TextureName.bg_gate_mask]: { path: '/images/bg_gate_mask.png' },
  [TextureName.bg_profile]: { path: '/images/bg_profile.jpg' },
  [TextureName.bg_tavern]: { path: '/images/bg_tavern.jpg' },
  [TextureName.bg_tavern_mask]: { path: '/images/bg_tavern_mask.png' },
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
  [TextureName.bg_tavern_bar_test]: { path: '/images/bg_tavern_bar_test.png' },
  [TextureName.bg_tavern_bar_test_mask]: { path: '/images/bg_tavern_bar_test_mask.png' },
  [TextureName.bg_tavern_bartender_test]: { path: '/images/bg_tavern_bartender_test.png' },
  [TextureName.bg_tavern_bartender_test_mask]: { path: '/images/bg_tavern_bartender_test_mask.png' },
  [TextureName.bg_tavern_door_test]: { path: '/images/bg_tavern_door_test.png' },
  [TextureName.bg_tavern_door_test_mask]: { path: '/images/bg_tavern_door_test_mask.png' },
  [TextureName.bg_tavern_test]: { path: '/images/bg_tavern_test.png' },
  [TextureName.bg_tavern_test_mask]: { path: '/images/bg_tavern_test_mask.png' },
  [TextureName.bg_tutorial_1]: { path: '/images/bg_tutorial_1.png' },
  [TextureName.bg_tutorial_2]: { path: '/images/bg_tutorial_2.png' },
  [TextureName.bg_tutorial_3]: { path: '/images/bg_tutorial_3.png' },
  [TextureName.bg_tutorial_4]: { path: '/images/bg_tutorial_4.png' },
  [TextureName.bg_tutorial_5]: { path: '/images/bg_tutorial_5.png' },
}

interface SceneData {
  backgrounds: SceneBackgroundObject[],
  items?: SceneObject[]
}

interface SceneBackgroundObject {
  texture: TextureName,
  shiftMultiplier: number,
  renderOrder: number
}

interface SceneObject {
  name: string,
  color: string,
  description: string,
  mask: TextureName,
  renderOrder: number
}

const sceneBackgrounds: Record<SceneName, SceneData> = {
  [SceneName.Gate]: { 
    backgrounds: [{ texture: TextureName.bg_gate, shiftMultiplier: 0, renderOrder: 0 }],
    items: [
      { name: 'door', color: 'ff0000', description: 'Knock on door', mask: TextureName.bg_gate_mask, renderOrder: 0 },
      { name: 'duel', color: 'ffff00', description: 'Show duel tutorial', mask: TextureName.bg_gate_mask, renderOrder: 0 },
      { name: 'sign', color: '00ff00', description: 'See more', mask: TextureName.bg_gate_mask, renderOrder: 0 },
    ]
  },
  [SceneName.Door]: { backgrounds: [{ texture: TextureName.bg_door, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.Profile]: { backgrounds: [{ texture: TextureName.bg_profile, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.Tavern]: { 
    backgrounds: [
      // { texture: TextureName.bg_tavern_bar_test, shiftMultiplier: -0.02, renderOrder: 0 },
      // { texture: TextureName.bg_tavern_bartender_test, shiftMultiplier: -0.01, renderOrder: 1 },
      // { texture: TextureName.bg_tavern_test, shiftMultiplier: 0.01, renderOrder: 2 },
      // { texture: TextureName.bg_tavern_door_test, shiftMultiplier: 0.02, renderOrder: 3 },
      { texture: TextureName.bg_tavern, shiftMultiplier: -0.001, renderOrder: 0 },
    ],
    items: [
      // { name: 'bottle', color: '0000ff', description: 'All Duelists', mask: TextureName.bg_tavern_bar_test_mask, renderOrder: 0 },
      // { name: 'bartender', color: 'ff0000', description: 'Bartender', mask: TextureName.bg_tavern_bartender_test_mask, renderOrder: 1 },
      // { name: 'pistol', color: '00ff00', description: 'Your Duels', mask: TextureName.bg_tavern_test_mask, renderOrder: 2 },
      // { name: 'shovel', color: 'ff00ff', description: 'Past Duels', mask: TextureName.bg_tavern_door_test_mask, renderOrder: 3 }
      { name: 'bottle', color: '0000ff', description: 'All Duelists', mask: TextureName.bg_tavern_mask, renderOrder: 0 },
      { name: 'bartender', color: 'ff0000', description: 'Bartender', mask: TextureName.bg_tavern_mask, renderOrder: 0 },
      { name: 'pistol', color: '00ff00', description: 'Your Duels', mask: TextureName.bg_tavern_mask, renderOrder: 0 },
      { name: 'shovel', color: 'ff00ff', description: 'Past Duels', mask: TextureName.bg_tavern_mask, renderOrder: 0 }
    ]
  },
  [SceneName.Duelists]: { 
    backgrounds: [{ texture: TextureName.bg_duelists, shiftMultiplier: 0, renderOrder: 0 }],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duelists_mask, renderOrder: 0 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duelists_mask, renderOrder: 0 },
    ]
   },
  [SceneName.DuelsBoard]: { 
    backgrounds: [{ texture: TextureName.bg_duels, shiftMultiplier: 0, renderOrder: 0 }],
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page', mask: TextureName.bg_duels_mask, renderOrder: 0 },
      { name: 'right arrow', color: 'ff0000', description: 'Next Page', mask: TextureName.bg_duels_mask, renderOrder: 0 },
    ]
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
  [SceneName.Duel]: { backgrounds: [{ texture: TextureName.bg_duel, shiftMultiplier: 0, renderOrder: 0 }] },
  //Tutorial Scenes
  [SceneName.Tutorial]: { backgrounds: [{ texture: TextureName.bg_tutorial_1, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.TutorialScene2]: { backgrounds: [{ texture: TextureName.bg_tutorial_2, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.TutorialScene3]: { backgrounds: [{ texture: TextureName.bg_tutorial_3, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.TutorialScene4]: { backgrounds: [{ texture: TextureName.bg_tutorial_4, shiftMultiplier: 0, renderOrder: 0 }] },
  [SceneName.TutorialScene5]: { backgrounds: [{ texture: TextureName.bg_tutorial_5, shiftMultiplier: 0, renderOrder: 0 }] }
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
      frameCount: 13,
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