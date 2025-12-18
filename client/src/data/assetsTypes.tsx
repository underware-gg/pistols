//----------------------------
// Scene Information
//

enum SceneName {
  Gate = "Gate",
  Door = "Door",

  Tavern = "Tavern",

  Profile = "Profile",
  CardPacks = "CardPacks",
  DuelistBook = "DuelistBook",
  Invite = "Invite",

  Duelists = "Duelists",
  Matchmaking = "Matchmaking",
  DuelsBoard = "Your Duels",
  Leaderboards = "Leaderboards",
  Graveyard = "Graveyard",
  Backrooms = "Backrooms",
  QuizRoomList = "QuizRoomList",
  QuizRoom = "QuizRoom",

  Tournament = "Tournament",
  IRLTournament = "IRL Tournament",
  Duel = "Duel",

  Tutorial = "TutorialStart",
  TutorialScene2 = "TutorialScene2",
  TutorialScene3 = "TutorialScene3",
  TutorialScene4 = "TutorialScene4",
  TutorialScene5 = "TutorialScene5",
  TutorialDuel = "TutorialDuel",
}


//----------------------------
// Texture Assets
//

enum TextureName {
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
  bg_duels_lighting = "bg_duels_lighting",

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
  bg_cardpacks_front_box = "bg_cardpacks_front_box",

  bg_leaderboards = "bg_leaderboards",
  
  bg_quizroom = "bg_quizroom",
  bg_quizroom_cumberlord = "bg_quizroom_cumberlord",
  bg_quizroom_cumberlord_mask = "bg_quizroom_cumberlord_mask",
  bg_quiz_entry = "bg_quiz_entry",
  
  bg_back_room = "bg_back_room",
  bg_back_room_crypt_mask = "bg_back_room_crypt_mask",
  bg_back_room_quiz_door_mask = "bg_back_room_quiz_door_mask",
}

enum UIImagesName {
  // Tutorial Overlay Images
  tutorial_duelist_frame_01 = 'tutorial_duelist_frame_01',
  tutorial_duelist_fame_frame_02 = 'tutorial_duelist_fame_frame_02',
  tutorial_duelist_fame_frame_01 = 'tutorial_duelist_fame_frame_01',
  tutorial_duelist_archetype_frame_01 = 'tutorial_duelist_archetype_frame_01',
  tutorial_card_pack_frame_02 = 'tutorial_card_pack_frame_02',
  tutorial_card_pack_frame_01 = 'tutorial_card_pack_frame_01',
  duel_simple_shooting_frame_01 = 'duel_simple_shooting_frame_01',
  duel_simple_shoot_dodge_cards_frame_01 = 'duel_simple_shoot_dodge_cards_frame_01',
  duel_simple_revealing_frame_01 = 'duel_simple_revealing_frame_01',
  duel_simple_progress_bubbles_frame_01 = 'duel_simple_progress_bubbles_frame_01',
  duel_simple_player_info_frame_01 = 'duel_simple_player_info_frame_01',
  duel_simple_intro_frame_01 = 'duel_simple_intro_frame_01',
  duel_simple_duel_navigation_frame_01 = 'duel_simple_duel_navigation_frame_01',
  duel_simple_duel_info_frame_01 = 'duel_simple_duel_info_frame_01',
  duel_simple_duel_controls_frame_01 = 'duel_simple_duel_controls_frame_01',
  duel_simple_dodging_frame_01 = 'duel_simple_dodging_frame_01',
  duel_simple_commiting_frame_01 = 'duel_simple_commiting_frame_01',
  duel_full_tactic_cards_frame_01 = 'duel_full_tactic_cards_frame_01',
  duel_full_selecting_cards_frame_02 = 'duel_full_selecting_cards_frame_02',
  duel_full_selecting_cards_frame_01 = 'duel_full_selecting_cards_frame_01',
  duel_full_intro_frame_01 = 'duel_full_intro_frame_01',
  duel_full_hit_chance_frame_01 = 'duel_full_hit_chance_frame_01',
  duel_full_environment_card_deck_frame_01 = 'duel_full_environment_card_deck_frame_01',
  duel_full_duel_conclusion_frame_01 = 'duel_full_duel_conclusion_frame_01',
  duel_full_damage_frame_01 = 'duel_full_damage_frame_01',
  duel_full_blade_cards_frame_02 = 'duel_full_blade_cards_frame_02',
  duel_full_blade_cards_frame_01 = 'duel_full_blade_cards_frame_01',
  duel_full_environment_card_draw_frame_01 = 'duel_full_environment_card_draw_frame_01',
  duel_full_duel_card_details_frame_01 = 'duel_full_duel_card_details_frame_01',
  duel_full_card_reveal_frame_01 = 'duel_full_card_reveal_frame_01',

  // UI General Images
  notification_exclamation = 'notification_exclamation',
  notification_bartender_head = 'notification_bartender_head',
  black_stamp_cork = 'black_stamp_cork',
  card_souls = 'card_souls',
  card_pack = 'card_pack',
  pistol = 'pistol',
  hand_throw = 'hand_throw',
  hand_sweep = 'hand_sweep',
  seal = 'seal',
  hand_card_single_bottom_closed = 'hand_card_single_bottom_closed',
  hand_card_single_bottom_open = 'hand_card_single_bottom_open',
  hand_card_single_top = 'hand_card_single_top',
  duel_paper = 'duel_paper',
  hand_card_multiple_bottom = 'hand_card_multiple_bottom',
  hand_card_multiple_top = 'hand_card_multiple_top',
  card_pack_outter = 'card_pack_outter',
  card_pack_seal = 'card_pack_seal',
  card_pack_seal_background = 'card_pack_seal_background',
  card_pack_inner = 'card_pack_inner',
  card_pack_flap_inner = 'card_pack_flap_inner',
  card_pack_flap_outter = 'card_pack_flap_outter',
  card_pack_edge = 'card_pack_edge',
  card_pack_flap_background = 'card_pack_flap_background',

  // UI Icons
  icon_back_arrow = 'icon_back_arrow',
  icon_close = 'icon_close',
  icon_copy = 'icon_copy',
  icon_home = 'icon_home',
  icon_left_arrow = 'icon_left_arrow',
  icon_spacebar = 'icon_spacebar',
  icon_volume_off = 'icon_volume_off',
  icon_volume_on = 'icon_volume_on',

  // UI Stamps Images
  gold_stamp_cork = 'gold_stamp_cork',
  silver_stamp_cork = 'silver_stamp_cork',
  lead_stamp_cork = 'lead_stamp_cork',
  team_stamp_cork = 'team_stamp_cork',

  // UI Rings Images
  ring_gold = 'ring_gold',
  ring_silver = 'ring_silver',
  ring_lead = 'ring_lead',

  // UI Card Rank Images
  card_rank = 'card_rank',
  card_rank_1 = 'card_rank_1',
  card_rank_2 = 'card_rank_2',
  card_rank_3 = 'card_rank_3',

  // UI Tavern Images
  tavern_bg_menu_item_button = 'tavern_bg_menu_item_button',
  tavern_wooden_corners = 'tavern_wooden_corners',
  tavern_curtain = 'tavern_curtain',
  tavern_banner = 'tavern_banner',
  tavern_bubble_door = 'tavern_bubble_door',

  // UI Leaderboards Images
  leaderboards_seasons_board = 'leaderboards_seasons_board',
  leaderboards_podium_silver = 'leaderboards_podium_silver',
  leaderboards_podium_silver_dead = 'leaderboards_podium_silver_dead',
  leaderboards_podium_gold_dead = 'leaderboards_podium_gold_dead',
  leaderboards_podium_number_1 = 'leaderboards_podium_number_1',
  leaderboards_podium_number_2 = 'leaderboards_podium_number_2',
  leaderboards_podium_number_3 = 'leaderboards_podium_number_3',
  leaderboards_podium_gold = 'leaderboards_podium_gold',
  leaderboards_podium_bronze_dead = 'leaderboards_podium_bronze_dead',
  leaderboards_duelist_background_mine = 'leaderboards_duelist_background_mine',
  leaderboards_duelist_background_mine_dead = 'leaderboards_duelist_background_mine_dead',
  leaderboards_podium_bronze = 'leaderboards_podium_bronze',
  leaderboards_button_background_page = 'leaderboards_button_background_page',
  leaderboards_button_background_selected = 'leaderboards_button_background_selected',
  leaderboards_duelist_background = 'leaderboards_duelist_background',
  leaderboards_duelist_background_dead = 'leaderboards_duelist_background_dead',
  leaderboards_button_background_all = 'leaderboards_button_background_all',
  leaderboards_button_background_number = 'leaderboards_button_background_number',
  leaderboards_sign = 'leaderboards_sign',
  leaderboards_sign_forbidden = 'leaderboards_sign_forbidden',

  // UI Modes Images
  modes_bg_ranked = 'modes_bg_ranked',
  modes_bg_singleplayer = 'modes_bg_singleplayer',
  modes_bg_unranked = 'modes_bg_unranked',
  modes_queue_frame_fast = 'modes_queue_frame_fast',
  modes_queue_frame_slow = 'modes_queue_frame_slow',
  modes_settings_board = 'modes_settings_board',

  // UI Duel Images
  duel_wager_bag = 'duel_wager_bag',
  duel_wager_main = 'duel_wager_main',
  duel_player_profile = 'duel_player_profile',
  duel_player_profile_stamp = 'duel_player_profile_stamp',
  duel_side_nav = 'duel_side_nav',
  duel_duelist_profile = 'duel_duelist_profile',
  duel_bottom_nav = 'duel_bottom_nav',
  duel_bubble_speech = 'duel_bubble_speech',
  duel_bubble_speech_me = 'duel_bubble_speech_me',
  duel_bubble_thinking = 'duel_bubble_thinking',
  duel_bubble_thinking_me = 'duel_bubble_thinking_me',

  // UI Duel Health Images
  duel_health_3 = 'duel_health_3',
  duel_health_0 = 'duel_health_0',
  duel_health_1 = 'duel_health_1',
  duel_health_2 = 'duel_health_2',

  // UI Duel Gun Images
  duel_gun_main = 'duel_gun_main',
  duel_gun_damage_1 = 'duel_gun_damage_1',
  duel_gun_damage_2 = 'duel_gun_damage_2',
  duel_gun_damage_3 = 'duel_gun_damage_3',
  duel_gun_damage_4 = 'duel_gun_damage_4',

  // UI Duel Card Details Images
  duel_card_details_box_right = 'duel_card_details_box_right',
  duel_card_details_button_exit = 'duel_card_details_button_exit',
  duel_card_details_cards_separator = 'duel_card_details_cards_separator',
  duel_card_details_environment_card_placeholder = 'duel_card_details_environment_card_placeholder',
  duel_card_details_profile_border = 'duel_card_details_profile_border',
  duel_card_details_box_left = 'duel_card_details_box_left',

  // Cards Images
  card_front_blue = 'card_front_blue',
  card_front_red = 'card_front_red',
  card_back = 'card_back',
  card_wide_brown = 'card_wide_brown',
  card_front_shoot = 'card_front_shoot',
  card_front_yellow = 'card_front_yellow',
  card_front_face_grim = 'card_front_face_grim',
  card_front_brown = 'card_front_brown',
  card_front_face = 'card_front_face',
  card_circular_villainous = 'card_circular_villainous',
  card_disabled = 'card_disabled',
  card_circular_trickster = 'card_circular_trickster',
  card_circular_neutral = 'card_circular_neutral',
  card_circular_honourable = 'card_circular_honourable',

  // Card Illustrations
  card_illustration_vengeful = 'card_illustration_vengeful',
  card_illustration_thick_coat = 'card_illustration_thick_coat',
  card_illustration_seppuku = 'card_illustration_seppuku',
  card_illustration_run_away = 'card_illustration_run_away',
  card_illustration_reversal = 'card_illustration_reversal',
  card_illustration_pocket_pistol = 'card_illustration_pocket_pistol',
  card_illustration_insult = 'card_illustration_insult',
  card_illustration_grapple = 'card_illustration_grapple',
  card_illustration_coin_flip = 'card_illustration_coin_flip',
  card_illustration_behead = 'card_illustration_behead',
  card_illustration_bananas = 'card_illustration_bananas',
  card_illustration_second_reaction = 'card_illustration_second_reaction',
  card_illustration_successful_block = 'card_illustration_successful_block',
  card_illustration_pistol_shot = 'card_illustration_pistol_shot',
  card_illustration_glancing_hit = 'card_illustration_glancing_hit',
  card_illustration_pistol_closeup = 'card_illustration_pistol_closeup',
  card_illustration_failed_block = 'card_illustration_failed_block',
  card_illustration_face_closeup_smirk = 'card_illustration_face_closeup_smirk',
  card_illustration_duelist_shooting = 'card_illustration_duelist_shooting',
  card_illustration_face_closeup = 'card_illustration_face_closeup',
  card_illustration_duelist_desperate = 'card_illustration_duelist_desperate',
  card_illustration_decapitation = 'card_illustration_decapitation',
  card_illustration_blade_miss = 'card_illustration_blade_miss'
}

type TextureAttributes = {
  path: string;
  groups: GroupName[];
  version: number;
};

type AssetKey = TextureName | UIImagesName


//----------------------------
// Texture Groups Information
//

enum GroupName {
  //SceneName groups
  Entrance,
  Door,
  Tavern,
  Duelists,
  Matchmaking,
  DuelsBoard,
  Graveyard,
  Backrooms,
  Leaderboards,
  Quiz,
  Profile,
  CardPacks,
  DuelistBook,
  Tutorial,

  Duel,
  Animations,

  // UI Groups
  TutorialOverlay,
  DuelUI,
  TavernUI,
  LeaderboardsUI,
  CardUI,
  CardPackUI, 
  General,

  DuelistImages,
}


//----------------------------
// Animation System Types
//

interface TextureState {
  texture: TextureName;
  nextTextures: TextureName[]; // Array of possible next texture names
  minDuration: number;
  maxDuration: number;
  baseDuration: number; // The center of the normal distribution
  transitionProbabilities?: number[]; // optional weights for next textures
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
  texture: TextureName;
  variants?: TextureVariant[];
  shiftMultiplier: number;
  renderOrder: number;
  animatedIdle?: number;
  hidden?: boolean;
  opaque?: boolean;
  blurred?: boolean;
  samples?: number;
  animateShift?: {
    enabled: boolean;
    isLeft: boolean;
    speed: number;
  };
  states?: TextureState[];
  isAnimated?: boolean;
}

interface SceneData {
  backgrounds: SceneBackgroundObject[];
  items?: SceneObject[];
  scaleAddon?: number;
}

interface SceneObject {
  name: string;
  color: string;
  description: string;
  mask: TextureName;
  renderOrder: number;
}

enum CharacterType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  CARD = 'CARD',
  EXPLOSION = 'EXPLOSION'
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
  EXPLODE = 'EXPLODE'
}

interface AnimationAsset {
  path?: string;
  frameCount?: number;
  frameRate?: number;
  isFlipped?: boolean;
}

//----------------------------
// UI Image Collection Types
//

enum ProfileCollectionType {
  Genesis = 'Genesis',
  Bots = 'Bots',
  Characters = 'Characters',
  Legends = 'Legends',
  Pirates = 'Pirates',
  Undefined = 'Undefined',
}

interface ProfileCollectionAsset {
  path: string;
  totalCount: number;
  groups: GroupName[];
  version: number;
}

type Spritesheets = {
  [key in CharacterType]: Animations;
};

type Animations = {
  [key in AnimName]: AnimationAsset;
};


//----------------------------
// Exports
//

export {
  SceneName,
  TextureName,
  UIImagesName,
  GroupName,
  CharacterType,
  AnimName,
  ProfileCollectionType,
};

export type {
  TextureAttributes,
  AssetKey,
  TextureState,
  AnimatedLayer,
  SceneBackgroundObject,
  SceneData,
  SceneObject,
  AnimationAsset,
  Spritesheets,
  Animations,
  ProfileCollectionAsset,
};
