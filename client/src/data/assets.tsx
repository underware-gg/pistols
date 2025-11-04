import { SceneName, TextureAttributes, TextureName, UIImagesName, GroupName, SceneData, AnimName, Spritesheets, AssetKey } from "./assetsTypes";


const SCENE_PRIORITIES: Record<SceneName, GroupName[]> = {
  [SceneName.Gate]: [GroupName.Entrance, GroupName.Door, GroupName.Tavern, GroupName.TavernUI],
  [SceneName.Door]: [GroupName.Door, GroupName.Entrance, GroupName.Tavern, GroupName.TavernUI],
  [SceneName.Tavern]: [GroupName.Tavern, GroupName.TavernUI, GroupName.Profile, GroupName.Graveyard, GroupName.Duelists, GroupName.Leaderboards, GroupName.LeaderboardsUI],
  [SceneName.Profile]: [GroupName.Profile, GroupName.CardPacks, GroupName.CardPackUI, GroupName.DuelistBook, GroupName.DuelistImages, GroupName.CardUI, GroupName.TavernUI],
  [SceneName.CardPacks]: [GroupName.CardPacks, GroupName.CardPackUI, GroupName.Profile, GroupName.DuelistBook, GroupName.DuelistImages, GroupName.CardUI, GroupName.TavernUI],
  [SceneName.DuelistBook]: [GroupName.DuelistBook, GroupName.DuelistImages, GroupName.CardUI, GroupName.Profile, GroupName.CardPacks, GroupName.CardPackUI, GroupName.TavernUI],
  [SceneName.Duelists]: [GroupName.Duelists, GroupName.TavernUI, GroupName.DuelsBoard, GroupName.Profile, GroupName.Matchmaking],
  [SceneName.Matchmaking]: [GroupName.Matchmaking, GroupName.TavernUI, GroupName.DuelsBoard, GroupName.Profile, GroupName.Duelists, GroupName.CardUI],
  [SceneName.DuelsBoard]: [GroupName.DuelsBoard, GroupName.TavernUI, GroupName.Duelists, GroupName.Profile, GroupName.Graveyard],
  [SceneName.Leaderboards]: [GroupName.Leaderboards, GroupName.LeaderboardsUI, GroupName.TavernUI, GroupName.Profile],
  [SceneName.Graveyard]: [GroupName.Graveyard, GroupName.TavernUI, GroupName.Profile, GroupName.DuelsBoard],
  [SceneName.Tournament]: [],
  [SceneName.IRLTournament]: [],
  [SceneName.Invite]: [],
  [SceneName.Duel]: [GroupName.Duel, GroupName.DuelUI, GroupName.CardUI, GroupName.Animations],
  [SceneName.Tutorial]: [GroupName.Tutorial, GroupName.TutorialOverlay, GroupName.DuelUI],
  [SceneName.TutorialScene2]: [GroupName.Tutorial, GroupName.TutorialOverlay, GroupName.DuelUI],
  [SceneName.TutorialScene3]: [GroupName.Tutorial, GroupName.TutorialOverlay, GroupName.DuelUI],
  [SceneName.TutorialScene4]: [GroupName.Tutorial, GroupName.TutorialOverlay, GroupName.DuelUI],
  [SceneName.TutorialScene5]: [GroupName.Tutorial, GroupName.TutorialOverlay, GroupName.DuelUI],
  [SceneName.TutorialDuel]: [GroupName.Duel, GroupName.DuelUI, GroupName.CardUI, GroupName.Animations],
}

const TEXTURES: Record<AssetKey, TextureAttributes> = {
  [TextureName.duel_ground]: { path: '/textures/ground.ktx2', groups: [GroupName.Duel], version: 1 },
  [TextureName.duel_ground_normal]: { path: '/textures/ground_normalmap.ktx2', groups: [GroupName.Duel], version: 1 },
  [TextureName.duel_water_dudv]: { path: '/textures/waterdudv.jpg', groups: [GroupName.Duel], version: 1 },
  [TextureName.duel_water_map]: { path: '/textures/water_map.ktx2', groups: [GroupName.Duel], version: 1 },
  [TextureName.cliffs]: { path: '/textures/cliffs.png', groups: [GroupName.Duel], version: 1 },

  [TextureName.bg_entrance_background]: { path: '/images/scenes/gate/bg_entrance_background.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_tavern]: { path: '/images/scenes/gate/bg_entrance_tavern.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_sign]: { path: '/images/scenes/gate/bg_entrance_sign.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_player]: { path: '/images/scenes/gate/bg_entrance_player.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_foreground]: { path: '/images/scenes/gate/bg_entrance_foreground.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_door_mask]: { path: '/images/scenes/gate/bg_entrance_door_mask.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_fog_background]: { path: '/images/scenes/gate/bg_entrance_fog_background.png', groups: [GroupName.Entrance], version: 1 },
  [TextureName.bg_entrance_fog_foreground]: { path: '/images/scenes/gate/bg_entrance_fog_foreground.png', groups: [GroupName.Entrance], version: 1 },

  [TextureName.bg_door_background]: { path: '/images/scenes/door/bg_door_background.png', groups: [GroupName.Door], version: 1 },
  [TextureName.bg_door_door]: { path: '/images/scenes/door/bg_door_door.png', groups: [GroupName.Door], version: 1 },
  [TextureName.bg_door_face]: { path: '/images/scenes/door/bg_door_face.png', groups: [GroupName.Door], version: 1 },
  [TextureName.bg_door_face_blink]: { path: '/images/scenes/door/bg_door_face_blink.png', groups: [GroupName.Door], version: 1 },
  [TextureName.bg_door_face_angry]: { path: '/images/scenes/door/bg_door_face_angry.png', groups: [GroupName.Door], version: 1 },
  [TextureName.bg_door_face_angry_blink]: { path: '/images/scenes/door/bg_door_face_angry_blink.png', groups: [GroupName.Door], version: 1 },

  [TextureName.bg_tavern_bar]: { path: '/images/scenes/tavern/bg_tavern_bar.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_pistol_mask]: { path: '/images/scenes/tavern/bg_tavern_pistol_mask.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_bartender]: { path: '/images/scenes/tavern/bg_tavern_bartender.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_bartender_mask]: { path: '/images/scenes/tavern/bg_tavern_bartender_mask.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_background]: { path: '/images/scenes/tavern/bg_tavern_background.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_crypt_mask]: { path: '/images/scenes/tavern/bg_tavern_crypt_mask.png', groups: [GroupName.Tavern], version: 1 },
  [TextureName.bg_tavern_trophy_mask]: { path: '/images/scenes/tavern/bg_tavern_trophy_mask.png', groups: [GroupName.Tavern], version: 1 },

  [TextureName.bg_duelists_background]: { path: '/images/scenes/duelists/bg_duelists_background.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_items]: { path: '/images/scenes/duelists/bg_duelists_items.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_items_mask]: { path: '/images/scenes/duelists/bg_duelists_items_mask.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_pistol]: { path: '/images/scenes/duelists/bg_duelists_pistol.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_pistol_mask]: { path: '/images/scenes/duelists/bg_duelists_pistol_mask.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_matchmaking_ranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_ranked.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_matchmaking_unranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_unranked.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_matchmaking_singleplayer]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_singleplayer.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_matchmaking_mask]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_mask.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_mode_button]: { path: '/images/scenes/duelists/bg_duelists_mode_button.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_mode_button_mask]: { path: '/images/scenes/duelists/bg_duelists_mode_button_mask.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_tutorial]: { path: '/images/scenes/duelists/bg_duelists_tutorial.png', groups: [GroupName.Duelists], version: 1 },
  [TextureName.bg_duelists_tutorial_mask]: { path: '/images/scenes/duelists/bg_duelists_tutorial_mask.png', groups: [GroupName.Duelists], version: 1 },

  [TextureName.bg_matchmaking_unranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_unranked.png', groups: [GroupName.Matchmaking], version: 1 },
  [TextureName.bg_matchmaking_ranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_ranked.png', groups: [GroupName.Matchmaking], version: 1 },
  [TextureName.bg_matchmaking_bell]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell.png', groups: [GroupName.Matchmaking], version: 1 },
  [TextureName.bg_matchmaking_bell_mask]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell_mask.png', groups: [GroupName.Matchmaking], version: 1 },

  [TextureName.bg_duels_background]: { path: '/images/scenes/duels_board/bg_duels_background.png', groups: [GroupName.DuelsBoard], version: 1 },
  [TextureName.bg_duels_items]: { path: '/images/scenes/duels_board/bg_duels_items.png', groups: [GroupName.DuelsBoard], version: 1 },
  [TextureName.bg_duels_items_mask]: { path: '/images/scenes/duels_board/bg_duels_items_mask.png', groups: [GroupName.DuelsBoard], version: 1 },
  [TextureName.bg_duels_lighting]: { path: '/images/scenes/duels_board/bg_duels_lighting.png', groups: [GroupName.DuelsBoard], version: 1 },

  [TextureName.bg_graveyard_background]: { path: '/images/scenes/crypt/bg_graveyard_background.jpg', groups: [GroupName.Graveyard], version: 1 },
  [TextureName.bg_graveyard_items]: { path: '/images/scenes/crypt/bg_graveyard_items.png', groups: [GroupName.Graveyard], version: 1 },
  [TextureName.bg_graveyard_items_mask]: { path: '/images/scenes/crypt/bg_graveyard_items_mask.png', groups: [GroupName.Graveyard], version: 1 },

  [TextureName.bg_entry_background]: { path: '/images/scenes/tutorial/entry/bg_entry_background.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_entry_bar]: { path: '/images/scenes/tutorial/entry/bg_entry_bar.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_entry_barkeep]: { path: '/images/scenes/tutorial/entry/bg_entry_barkeep.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_entry_crowd]: { path: '/images/scenes/tutorial/entry/bg_entry_crowd.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_entry_player]: { path: '/images/scenes/tutorial/entry/bg_entry_player.png', groups: [GroupName.Tutorial], version: 1 },

  [TextureName.bg_conflict_background]: { path: '/images/scenes/tutorial/conflict/bg_conflict_background.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_conflict_bar]: { path: '/images/scenes/tutorial/conflict/bg_conflict_bar.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_conflict_barkeep]: { path: '/images/scenes/tutorial/conflict/bg_conflict_barkeep.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_conflict_drunkard]: { path: '/images/scenes/tutorial/conflict/bg_conflict_drunkard.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_conflict_player]: { path: '/images/scenes/tutorial/conflict/bg_conflict_player.png', groups: [GroupName.Tutorial], version: 1 },

  [TextureName.bg_barkeep_background]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_background.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_barkeep_crowd_back]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_back.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_barkeep_crowd_front]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_front.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_barkeep_player]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_player.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_barkeep_table]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_table.png', groups: [GroupName.Tutorial], version: 1 },

  [TextureName.bg_demon_background]: { path: '/images/scenes/tutorial/demon/bg_demon_background.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon_left_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon_right_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon_victim]: { path: '/images/scenes/tutorial/demon/bg_demon_victim.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon]: { path: '/images/scenes/tutorial/demon/bg_demon.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon_left_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand_mask.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_demon_right_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand_mask.png', groups: [GroupName.Tutorial], version: 1 },

  [TextureName.bg_resurrection_background]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_background.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_resurrection_barkeep]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_barkeep.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_resurrection_player]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_player.png', groups: [GroupName.Tutorial], version: 1 },
  [TextureName.bg_resurrection_table]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_table.png', groups: [GroupName.Tutorial], version: 1 },

  [TextureName.bg_profile_table]: { path: '/images/scenes/profile/bg_profile_table.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_player]: { path: '/images/scenes/profile/bg_profile_player.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_items]: { path: '/images/scenes/profile/bg_profile_items.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_book_mask]: { path: '/images/scenes/profile/bg_profile_book_mask.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_chest_mask]: { path: '/images/scenes/profile/bg_profile_chest_mask.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_background]: { path: '/images/scenes/profile/bg_profile_background.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_door_mask]: { path: '/images/scenes/profile/bg_profile_door_mask.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_sky]: { path: '/images/scenes/profile/bg_profile_sky.png', groups: [GroupName.Profile], version: 1 },
  [TextureName.bg_profile_doorman]: { path: '/images/scenes/profile/bg_profile_doorman.png', groups: [GroupName.Profile], version: 1 },

  [TextureName.bg_duelisbook_table]: { path: '/images/scenes/profile/duelistbook/bg_duelistbook_table.png', groups: [GroupName.DuelistBook], version: 1 },

  [TextureName.bg_cardpacks_box]: { path: '/images/scenes/profile/cardpacks/bg_cardpack_box.png', groups: [GroupName.CardPacks], version: 1 },
  [TextureName.bg_cardpacks_front_box]: { path: '/images/scenes/profile/cardpacks/bg_cardpack_front_box.png', groups: [GroupName.CardPacks], version: 1 },

  [TextureName.bg_leaderboards]: { path: '/images/scenes/leaderboards/bg_leaderboards.png', groups: [GroupName.Leaderboards], version: 1 },

  // [TextureName.bg_entrance_background]: { path: '/images/scenes/gate/bg_entrance_background.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_tavern]: { path: '/images/scenes/gate/bg_entrance_tavern.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_sign]: { path: '/images/scenes/gate/bg_entrance_sign.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_player]: { path: '/images/scenes/gate/bg_entrance_player.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_foreground]: { path: '/images/scenes/gate/bg_entrance_foreground.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_door_mask]: { path: '/images/scenes/gate/bg_entrance_door_mask.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_fog_background]: { path: '/images/scenes/gate/bg_entrance_fog_background.ktx2', groups: [GroupName.Entrance], version: 1 },
  // [TextureName.bg_entrance_fog_foreground]: { path: '/images/scenes/gate/bg_entrance_fog_foreground.ktx2', groups: [GroupName.Entrance], version: 1 },

  // [TextureName.bg_door_background]: { path: '/images/scenes/door/bg_door_background.ktx2', groups: [GroupName.Door], version: 1 },
  // [TextureName.bg_door_door]: { path: '/images/scenes/door/bg_door_door.ktx2', groups: [GroupName.Door], version: 1 },
  // [TextureName.bg_door_face]: { path: '/images/scenes/door/bg_door_face.ktx2', groups: [GroupName.Door], version: 1 },
  // [TextureName.bg_door_face_blink]: { path: '/images/scenes/door/bg_door_face_blink.ktx2', groups: [GroupName.Door], version: 1 },
  // [TextureName.bg_door_face_angry]: { path: '/images/scenes/door/bg_door_face_angry.ktx2', groups: [GroupName.Door], version: 1 },
  // [TextureName.bg_door_face_angry_blink]: { path: '/images/scenes/door/bg_door_face_angry_blink.ktx2', groups: [GroupName.Door], version: 1 },

  // [TextureName.bg_tavern_bar]: { path: '/images/scenes/tavern/bg_tavern_bar.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_pistol_mask]: { path: '/images/scenes/tavern/bg_tavern_pistol_mask.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_bartender]: { path: '/images/scenes/tavern/bg_tavern_bartender.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_bartender_mask]: { path: '/images/scenes/tavern/bg_tavern_bartender_mask.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_background]: { path: '/images/scenes/tavern/bg_tavern_background.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_crypt_mask]: { path: '/images/scenes/tavern/bg_tavern_crypt_mask.ktx2', groups: [GroupName.Tavern], version: 1 },
  // [TextureName.bg_tavern_trophy_mask]: { path: '/images/scenes/tavern/bg_tavern_trophy_mask.ktx2', groups: [GroupName.Tavern], version: 1 },

  // [TextureName.bg_duelists_background]: { path: '/images/scenes/duelists/bg_duelists_background.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_items]: { path: '/images/scenes/duelists/bg_duelists_items.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_items_mask]: { path: '/images/scenes/duelists/bg_duelists_items_mask.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_pistol]: { path: '/images/scenes/duelists/bg_duelists_pistol.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_pistol_mask]: { path: '/images/scenes/duelists/bg_duelists_pistol_mask.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_matchmaking_ranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_ranked.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_matchmaking_unranked]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_unranked.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_matchmaking_singleplayer]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_singleplayer.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_matchmaking_mask]: { path: '/images/scenes/duelists/bg_duelists_matchmaking_mask.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_mode_button]: { path: '/images/scenes/duelists/bg_duelists_mode_button.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_mode_button_mask]: { path: '/images/scenes/duelists/bg_duelists_mode_button_mask.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_tutorial]: { path: '/images/scenes/duelists/bg_duelists_tutorial.ktx2', groups: [GroupName.Duelists], version: 1 },
  // [TextureName.bg_duelists_tutorial_mask]: { path: '/images/scenes/duelists/bg_duelists_tutorial_mask.ktx2', groups: [GroupName.Duelists], version: 1 },

  // [TextureName.bg_matchmaking_unranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_unranked.ktx2', groups: [GroupName.Matchmaking], version: 1 },
  // [TextureName.bg_matchmaking_ranked]: { path: '/images/scenes/matchmaking/bg_matchmaking_ranked.ktx2', groups: [GroupName.Matchmaking], version: 1 },
  // [TextureName.bg_matchmaking_bell]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell.ktx2', groups: [GroupName.Matchmaking], version: 1 },
  // [TextureName.bg_matchmaking_bell_mask]: { path: '/images/scenes/matchmaking/bg_matchmaking_bell_mask.ktx2', groups: [GroupName.Matchmaking], version: 1 },

  // [TextureName.bg_duels_background]: { path: '/images/scenes/duels_board/bg_duels_background.ktx2', groups: [GroupName.DuelsBoard], version: 1 },
  // [TextureName.bg_duels_items]: { path: '/images/scenes/duels_board/bg_duels_items.ktx2', groups: [GroupName.DuelsBoard], version: 1 },
  // [TextureName.bg_duels_items_mask]: { path: '/images/scenes/duels_board/bg_duels_items_mask.ktx2', groups: [GroupName.DuelsBoard], version: 1 },
  // [TextureName.bg_duels_lighting]: { path: '/images/scenes/duels_board/bg_duels_lighting.png', groups: [GroupName.DuelsBoard], version: 1 },

  // [TextureName.bg_graveyard_background]: { path: '/images/scenes/crypt/bg_graveyard_background.jpg', groups: [GroupName.Graveyard], version: 1 },
  // [TextureName.bg_graveyard_items]: { path: '/images/scenes/crypt/bg_graveyard_items.ktx2', groups: [GroupName.Graveyard], version: 1 },
  // [TextureName.bg_graveyard_items_mask]: { path: '/images/scenes/crypt/bg_graveyard_items_mask.ktx2', groups: [GroupName.Graveyard], version: 1 },

  // [TextureName.bg_entry_background]: { path: '/images/scenes/tutorial/entry/bg_entry_background.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_entry_bar]: { path: '/images/scenes/tutorial/entry/bg_entry_bar.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_entry_barkeep]: { path: '/images/scenes/tutorial/entry/bg_entry_barkeep.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_entry_crowd]: { path: '/images/scenes/tutorial/entry/bg_entry_crowd.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_entry_player]: { path: '/images/scenes/tutorial/entry/bg_entry_player.ktx2', groups: [GroupName.Tutorial], version: 1 },

  // [TextureName.bg_conflict_background]: { path: '/images/scenes/tutorial/conflict/bg_conflict_background.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_conflict_bar]: { path: '/images/scenes/tutorial/conflict/bg_conflict_bar.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_conflict_barkeep]: { path: '/images/scenes/tutorial/conflict/bg_conflict_barkeep.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_conflict_drunkard]: { path: '/images/scenes/tutorial/conflict/bg_conflict_drunkard.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_conflict_player]: { path: '/images/scenes/tutorial/conflict/bg_conflict_player.ktx2', groups: [GroupName.Tutorial], version: 1 },

  // [TextureName.bg_barkeep_background]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_background.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_barkeep_crowd_back]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_back.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_barkeep_crowd_front]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_crowd_front.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_barkeep_player]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_player.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_barkeep_table]: { path: '/images/scenes/tutorial/barkeep/bg_barkeep_table.ktx2', groups: [GroupName.Tutorial], version: 1 },

  // [TextureName.bg_demon_background]: { path: '/images/scenes/tutorial/demon/bg_demon_background.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon_left_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon_right_hand]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon_victim]: { path: '/images/scenes/tutorial/demon/bg_demon_victim.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon]: { path: '/images/scenes/tutorial/demon/bg_demon.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon_left_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_left_hand_mask.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_demon_right_hand_mask]: { path: '/images/scenes/tutorial/demon/bg_demon_right_hand_mask.ktx2', groups: [GroupName.Tutorial], version: 1 },

  // [TextureName.bg_resurrection_background]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_background.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_resurrection_barkeep]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_barkeep.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_resurrection_player]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_player.ktx2', groups: [GroupName.Tutorial], version: 1 },
  // [TextureName.bg_resurrection_table]: { path: '/images/scenes/tutorial/resurrection/bg_resurrection_table.ktx2', groups: [GroupName.Tutorial], version: 1 },

  // [TextureName.bg_profile_table]: { path: '/images/scenes/profile/bg_profile_table.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_player]: { path: '/images/scenes/profile/bg_profile_player.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_items]: { path: '/images/scenes/profile/bg_profile_items.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_book_mask]: { path: '/images/scenes/profile/bg_profile_book_mask.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_chest_mask]: { path: '/images/scenes/profile/bg_profile_chest_mask.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_background]: { path: '/images/scenes/profile/bg_profile_background.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_door_mask]: { path: '/images/scenes/profile/bg_profile_door_mask.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_sky]: { path: '/images/scenes/profile/bg_profile_sky.ktx2', groups: [GroupName.Profile], version: 1 },
  // [TextureName.bg_profile_doorman]: { path: '/images/scenes/profile/bg_profile_doorman.ktx2', groups: [GroupName.Profile], version: 1 },

  // [TextureName.bg_duelisbook_table]: { path: '/images/scenes/profile/duelistbook/bg_duelistbook_table.ktx2', groups: [GroupName.DuelistBook], version: 1 },

  // [TextureName.bg_cardpacks_box]: { path: '/images/scenes/profile/cardpacks/bg_cardpack_box.ktx2', groups: [GroupName.CardPacks], version: 1 },
  // [TextureName.bg_cardpacks_front_box]: { path: '/images/scenes/profile/cardpacks/bg_cardpack_front_box.png', groups: [GroupName.CardPacks], version: 1 },

  // [TextureName.bg_leaderboards]: { path: '/images/scenes/leaderboards/bg_leaderboards.ktx2', groups: [GroupName.Leaderboards], version: 1 },

  // Tutorial Overlay Images
  [UIImagesName.tutorial_duelist_frame_01]: { path: '/images/tutorial/overlay/duelist_tutorial_duelist_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.tutorial_duelist_fame_frame_02]: { path: '/images/tutorial/overlay/duelist_tutorial_duelist_fame_frame_02.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.tutorial_duelist_fame_frame_01]: { path: '/images/tutorial/overlay/duelist_tutorial_duelist_fame_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.tutorial_duelist_archetype_frame_01]: { path: '/images/tutorial/overlay/duelist_tutorial_duelist_archetype_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.tutorial_card_pack_frame_02]: { path: '/images/tutorial/overlay/duelist_tutorial_card_pack_frame_02.gif', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.tutorial_card_pack_frame_01]: { path: '/images/tutorial/overlay/duelist_tutorial_card_pack_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_shooting_frame_01]: { path: '/images/tutorial/overlay/duel_simple_shooting_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_shoot_dodge_cards_frame_01]: { path: '/images/tutorial/overlay/duel_simple_shoot_dodge_cards_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_revealing_frame_01]: { path: '/images/tutorial/overlay/duel_simple_revealing_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_progress_bubbles_frame_01]: { path: '/images/tutorial/overlay/duel_simple_progress_bubbles_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_player_info_frame_01]: { path: '/images/tutorial/overlay/duel_simple_player_info_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_intro_frame_01]: { path: '/images/tutorial/overlay/duel_simple_intro_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_duel_navigation_frame_01]: { path: '/images/tutorial/overlay/duel_simple_duel_navigation_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_duel_info_frame_01]: { path: '/images/tutorial/overlay/duel_simple_duel_info_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_duel_controls_frame_01]: { path: '/images/tutorial/overlay/duel_simple_duel_controls_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_dodging_frame_01]: { path: '/images/tutorial/overlay/duel_simple_dodging_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_simple_commiting_frame_01]: { path: '/images/tutorial/overlay/duel_simple_commiting_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_tactic_cards_frame_01]: { path: '/images/tutorial/overlay/duel_full_tactic_cards_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_selecting_cards_frame_02]: { path: '/images/tutorial/overlay/duel_full_selecting_cards_frame_02.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_selecting_cards_frame_01]: { path: '/images/tutorial/overlay/duel_full_selecting_cards_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_intro_frame_01]: { path: '/images/tutorial/overlay/duel_full_intro_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_hit_chance_frame_01]: { path: '/images/tutorial/overlay/duel_full_hit_chance_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_environment_card_deck_frame_01]: { path: '/images/tutorial/overlay/duel_full_environment_card_deck_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_duel_conclusion_frame_01]: { path: '/images/tutorial/overlay/duel_full_duel_conclusion_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_damage_frame_01]: { path: '/images/tutorial/overlay/duel_full_damage_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_blade_cards_frame_02]: { path: '/images/tutorial/overlay/duel_full_blade_cards_frame_02.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_blade_cards_frame_01]: { path: '/images/tutorial/overlay/duel_full_blade_cards_frame_01.png', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_environment_card_draw_frame_01]: { path: '/images/tutorial/overlay/duel_full_environment_card_draw_frame_01.gif', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_duel_card_details_frame_01]: { path: '/images/tutorial/overlay/duel_full_duel_card_details_frame_01.gif', groups: [GroupName.TutorialOverlay], version: 1 },
  [UIImagesName.duel_full_card_reveal_frame_01]: { path: '/images/tutorial/overlay/duel_full_card_reveal_frame_01.gif', groups: [GroupName.TutorialOverlay], version: 1 },

  // UI General Images
  [UIImagesName.notification_exclamation]: { path: '/images/ui/notification_exclamation.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.notification_bartender_head]: { path: '/images/ui/notification_bartender_head.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.black_stamp_cork]: { path: '/images/ui/stamps/black_stamp_cork.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.card_souls]: { path: '/images/ui/card_souls.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.pistol]: { path: '/images/ui/pistol.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_throw]: { path: '/images/ui/hand_throw.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_sweep]: { path: '/images/ui/hand_sweep.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_card_single_bottom_closed]: { path: '/images/ui/hand_card_single_bottom_closed.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_card_single_bottom_open]: { path: '/images/ui/hand_card_single_bottom_open.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_card_single_top]: { path: '/images/ui/hand_card_single_top.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.duel_paper]: { path: '/images/ui/duel_paper.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_card_multiple_bottom]: { path: '/images/ui/hand_card_multiple_bottom.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.hand_card_multiple_top]: { path: '/images/ui/hand_card_multiple_top.png', groups: [GroupName.General], version: 1 },

  // UI Icons
  [UIImagesName.icon_back_arrow]: { path: '/icons/icon_back_arrow.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_close]: { path: '/icons/icon_close.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_copy]: { path: '/icons/icon_copy.svg', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_home]: { path: '/icons/icon_home.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_left_arrow]: { path: '/icons/icon_left-arrow.svg', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_spacebar]: { path: '/icons/icon_spacebar.svg', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_volume_off]: { path: '/icons/icon_volume-off.svg', groups: [GroupName.General], version: 1 },
  [UIImagesName.icon_volume_on]: { path: '/icons/icon_volume-on.svg', groups: [GroupName.General], version: 1 },

  // UI Stamps Images
  [UIImagesName.gold_stamp_cork]: { path: '/images/ui/stamps/gold_stamp_cork.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.silver_stamp_cork]: { path: '/images/ui/stamps/silver_stamp_cork.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.lead_stamp_cork]: { path: '/images/ui/stamps/lead_stamp_cork.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.team_stamp_cork]: { path: '/images/ui/stamps/team_stamp_cork.png', groups: [GroupName.General], version: 1 },

  // UI Rings Images
  [UIImagesName.ring_gold]: { path: '/images/ui/rings/GoldRing.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.ring_silver]: { path: '/images/ui/rings/SilverRing.png', groups: [GroupName.General], version: 1 },
  [UIImagesName.ring_lead]: { path: '/images/ui/rings/LeadRing.png', groups: [GroupName.General], version: 1 },

  // UI Card Rank Images
  [UIImagesName.card_rank]: { path: '/images/ui/card_rank.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_rank_1]: { path: '/images/ui/card_rank_1.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_rank_2]: { path: '/images/ui/card_rank_2.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_rank_3]: { path: '/images/ui/card_rank_3.png', groups: [GroupName.CardUI], version: 1 },

  // UI CardPack Images
  [UIImagesName.seal]: { path: '/images/ui/seal.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack]: { path: '/images/ui/card_pack.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_outter]: { path: '/images/ui/card_pack_outter.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_seal]: { path: '/images/ui/card_pack_seal.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_seal_background]: { path: '/images/ui/card_pack_seal_background.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_inner]: { path: '/images/ui/card_pack_inner.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_flap_inner]: { path: '/images/ui/card_pack_flap_inner.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_flap_outter]: { path: '/images/ui/card_pack_flap_outter.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_edge]: { path: '/images/ui/card_pack_edge.png', groups: [GroupName.CardPackUI], version: 1 },
  [UIImagesName.card_pack_flap_background]: { path: '/images/ui/card_pack_flap_background.png', groups: [GroupName.CardPackUI], version: 1 },

  // UI Tavern Images
  [UIImagesName.tavern_bg_menu_item_button]: { path: '/images/ui/tavern/bg_menu_item_button.png', groups: [GroupName.TavernUI], version: 1 },
  [UIImagesName.tavern_wooden_corners]: { path: '/images/ui/tavern/wooden_corners.png', groups: [GroupName.TavernUI], version: 1 },
  [UIImagesName.tavern_curtain]: { path: '/images/ui/tavern/curtain.png', groups: [GroupName.TavernUI], version: 1 },
  [UIImagesName.tavern_banner]: { path: '/images/ui/tavern/banner.png', groups: [GroupName.TavernUI], version: 1 },
  [UIImagesName.tavern_bubble_door]: { path: '/images/ui/tavern/bubble_door.png', groups: [GroupName.TavernUI], version: 1 },

  // UI Leaderboards Images
  [UIImagesName.leaderboards_seasons_board]: { path: '/images/ui/leaderboards/seasons_board.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_silver]: { path: '/images/ui/leaderboards/podium_silver.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_silver_dead]: { path: '/images/ui/leaderboards/podium_silver_dead.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_gold_dead]: { path: '/images/ui/leaderboards/podium_gold_dead.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_number_1]: { path: '/images/ui/leaderboards/podium_number_1.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_number_2]: { path: '/images/ui/leaderboards/podium_number_2.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_number_3]: { path: '/images/ui/leaderboards/podium_number_3.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_gold]: { path: '/images/ui/leaderboards/podium_gold.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_bronze_dead]: { path: '/images/ui/leaderboards/podium_bronze_dead.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_duelist_background_mine]: { path: '/images/ui/leaderboards/duelist_background_mine.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_duelist_background_mine_dead]: { path: '/images/ui/leaderboards/duelist_background_mine_dead.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_podium_bronze]: { path: '/images/ui/leaderboards/podium_bronze.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_button_background_page]: { path: '/images/ui/leaderboards/button_background_page.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_button_background_selected]: { path: '/images/ui/leaderboards/button_background_selected.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_duelist_background]: { path: '/images/ui/leaderboards/duelist_background.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_duelist_background_dead]: { path: '/images/ui/leaderboards/duelist_background_dead.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_button_background_all]: { path: '/images/ui/leaderboards/button_background_all.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_button_background_number]: { path: '/images/ui/leaderboards/button_background_number.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_sign]: { path: '/images/scenes/leaderboards/bg_leaderboards_sign.png', groups: [GroupName.LeaderboardsUI], version: 1 },
  [UIImagesName.leaderboards_sign_forbidden]: { path: '/images/scenes/leaderboards/bg_leaderboards_sign_forbidden.png', groups: [GroupName.LeaderboardsUI], version: 1 },

  // UI Modes Images
  [UIImagesName.modes_bg_ranked]: { path: '/images/ui/modes/bg_ranked.png', groups: [GroupName.Duelists], version: 1 },
  [UIImagesName.modes_bg_singleplayer]: { path: '/images/ui/modes/bg_singleplayer.png', groups: [GroupName.Duelists], version: 1 },
  [UIImagesName.modes_bg_unranked]: { path: '/images/ui/modes/bg_unranked.png', groups: [GroupName.Duelists], version: 1 },
  [UIImagesName.modes_queue_frame_fast]: { path: '/images/ui/modes/queue_frame_fast.png', groups: [GroupName.Duelists], version: 1 },
  [UIImagesName.modes_queue_frame_slow]: { path: '/images/ui/modes/queue_frame_slow.png', groups: [GroupName.Duelists], version: 1 },
  [UIImagesName.modes_settings_board]: { path: '/images/ui/modes/settings_board.png', groups: [GroupName.Duelists], version: 1 },

  // UI Duel Images
  [UIImagesName.duel_wager_bag]: { path: '/images/ui/duel/wager_bag.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_wager_main]: { path: '/images/ui/duel/wager_main.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_player_profile]: { path: '/images/ui/duel/player_profile.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_player_profile_stamp]: { path: '/images/ui/duel/player_profile_stamp.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_side_nav]: { path: '/images/ui/duel/side_nav.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_duelist_profile]: { path: '/images/ui/duel/duelist_profile.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_bottom_nav]: { path: '/images/ui/duel/bottom_nav.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_bubble_speech]: { path: '/images/ui/duel/bubble_speech.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_bubble_speech_me]: { path: '/images/ui/duel/bubble_speech_me.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_bubble_thinking]: { path: '/images/ui/duel/bubble_thinking.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_bubble_thinking_me]: { path: '/images/ui/duel/bubble_thinking_me.png', groups: [GroupName.DuelUI], version: 1 },

  // UI Duel Health Images
  [UIImagesName.duel_health_3]: { path: '/images/ui/duel/health/health_3.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_health_0]: { path: '/images/ui/duel/health/health_0.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_health_1]: { path: '/images/ui/duel/health/health_1.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_health_2]: { path: '/images/ui/duel/health/health_2.png', groups: [GroupName.DuelUI], version: 1 },

  // UI Duel Gun Images
  [UIImagesName.duel_gun_main]: { path: '/images/ui/duel/gun/gun_main.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_gun_damage_1]: { path: '/images/ui/duel/gun/gun_damage_1.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_gun_damage_2]: { path: '/images/ui/duel/gun/gun_damage_2.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_gun_damage_3]: { path: '/images/ui/duel/gun/gun_damage_3.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_gun_damage_4]: { path: '/images/ui/duel/gun/gun_damage_4.png', groups: [GroupName.DuelUI], version: 1 },

  // UI Duel Card Details Images
  [UIImagesName.duel_card_details_box_right]: { path: '/images/ui/duel/card_details/box_right.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_card_details_button_exit]: { path: '/images/ui/duel/card_details/button_exit.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_card_details_cards_separator]: { path: '/images/ui/duel/card_details/cards_separator.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_card_details_environment_card_placeholder]: { path: '/images/ui/duel/card_details/environment_card_placeholder.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_card_details_profile_border]: { path: '/images/ui/duel/card_details/profile_border.png', groups: [GroupName.DuelUI], version: 1 },
  [UIImagesName.duel_card_details_box_left]: { path: '/images/ui/duel/card_details/box_left.png', groups: [GroupName.DuelUI], version: 1 },

  // Profile Genesis Images
  [UIImagesName.profile_genesis_00]: { path: '/profiles/genesis/00.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_01]: { path: '/profiles/genesis/01.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_02]: { path: '/profiles/genesis/02.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_03]: { path: '/profiles/genesis/03.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_04]: { path: '/profiles/genesis/04.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_05]: { path: '/profiles/genesis/05.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_06]: { path: '/profiles/genesis/06.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_07]: { path: '/profiles/genesis/07.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_08]: { path: '/profiles/genesis/08.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_09]: { path: '/profiles/genesis/09.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_10]: { path: '/profiles/genesis/10.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_11]: { path: '/profiles/genesis/11.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_12]: { path: '/profiles/genesis/12.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_13]: { path: '/profiles/genesis/13.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_14]: { path: '/profiles/genesis/14.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_15]: { path: '/profiles/genesis/15.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_16]: { path: '/profiles/genesis/16.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_17]: { path: '/profiles/genesis/17.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_18]: { path: '/profiles/genesis/18.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_19]: { path: '/profiles/genesis/19.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_20]: { path: '/profiles/genesis/20.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_21]: { path: '/profiles/genesis/21.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_22]: { path: '/profiles/genesis/22.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_23]: { path: '/profiles/genesis/23.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_24]: { path: '/profiles/genesis/24.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_25]: { path: '/profiles/genesis/25.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_26]: { path: '/profiles/genesis/26.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_27]: { path: '/profiles/genesis/27.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_28]: { path: '/profiles/genesis/28.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_29]: { path: '/profiles/genesis/29.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_30]: { path: '/profiles/genesis/30.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_31]: { path: '/profiles/genesis/31.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_32]: { path: '/profiles/genesis/32.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_33]: { path: '/profiles/genesis/33.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_34]: { path: '/profiles/genesis/34.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_35]: { path: '/profiles/genesis/35.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_36]: { path: '/profiles/genesis/36.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_37]: { path: '/profiles/genesis/37.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_38]: { path: '/profiles/genesis/38.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_39]: { path: '/profiles/genesis/39.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_40]: { path: '/profiles/genesis/40.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_41]: { path: '/profiles/genesis/41.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_42]: { path: '/profiles/genesis/42.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_43]: { path: '/profiles/genesis/43.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_44]: { path: '/profiles/genesis/44.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_45]: { path: '/profiles/genesis/45.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_46]: { path: '/profiles/genesis/46.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_47]: { path: '/profiles/genesis/47.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_48]: { path: '/profiles/genesis/48.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_49]: { path: '/profiles/genesis/49.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_50]: { path: '/profiles/genesis/50.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_51]: { path: '/profiles/genesis/51.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_52]: { path: '/profiles/genesis/52.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_53]: { path: '/profiles/genesis/53.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_54]: { path: '/profiles/genesis/54.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_55]: { path: '/profiles/genesis/55.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_56]: { path: '/profiles/genesis/56.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_57]: { path: '/profiles/genesis/57.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_58]: { path: '/profiles/genesis/58.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_59]: { path: '/profiles/genesis/59.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_60]: { path: '/profiles/genesis/60.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_61]: { path: '/profiles/genesis/61.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_62]: { path: '/profiles/genesis/62.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_63]: { path: '/profiles/genesis/63.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_64]: { path: '/profiles/genesis/64.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_65]: { path: '/profiles/genesis/65.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_66]: { path: '/profiles/genesis/66.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_67]: { path: '/profiles/genesis/67.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_68]: { path: '/profiles/genesis/68.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_genesis_69]: { path: '/profiles/genesis/69.jpg', groups: [GroupName.DuelistImages], version: 1 },

  // Profile Bots Images
  [UIImagesName.profile_bots_00]: { path: '/profiles/bots/00.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_bots_01]: { path: '/profiles/bots/01.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_bots_02]: { path: '/profiles/bots/02.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_bots_03]: { path: '/profiles/bots/03.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_bots_04]: { path: '/profiles/bots/04.jpg', groups: [GroupName.DuelistImages], version: 1 },

  // Profile Characters Images
  [UIImagesName.profile_characters_00]: { path: '/profiles/characters/00.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_characters_01]: { path: '/profiles/characters/01.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_characters_02]: { path: '/profiles/characters/02.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_characters_03]: { path: '/profiles/characters/03.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_characters_04]: { path: '/profiles/characters/04.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_characters_05]: { path: '/profiles/characters/05.jpg', groups: [GroupName.DuelistImages], version: 1 },

  // Profile Legends Images
  [UIImagesName.profile_legends_00]: { path: '/profiles/legends/00.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_legends_01]: { path: '/profiles/legends/01.jpg', groups: [GroupName.DuelistImages], version: 1 },
  [UIImagesName.profile_legends_02]: { path: '/profiles/legends/02.jpg', groups: [GroupName.DuelistImages], version: 1 },

  // Profile Undefined Images
  [UIImagesName.profile_undefined_00]: { path: '/profiles/undefined/00.jpg', groups: [GroupName.DuelistImages], version: 1 },

  // Cards Images
  [UIImagesName.card_front_blue]: { path: '/textures/cards/card_front_blue.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_red]: { path: '/textures/cards/card_front_red.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_back]: { path: '/textures/cards/card_back.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_wide_brown]: { path: '/textures/cards/card_wide_brown.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_shoot]: { path: '/textures/cards/card_front_shoot.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_yellow]: { path: '/textures/cards/card_front_yellow.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_face_grim]: { path: '/textures/cards/card_front_face_grim.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_brown]: { path: '/textures/cards/card_front_brown.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_front_face]: { path: '/textures/cards/card_front_face.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_circular_villainous]: { path: '/textures/cards/card_circular_villainous.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_disabled]: { path: '/textures/cards/card_disabled.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_circular_trickster]: { path: '/textures/cards/card_circular_trickster.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_circular_neutral]: { path: '/textures/cards/card_circular_neutral.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_circular_honourable]: { path: '/textures/cards/card_circular_honourable.png', groups: [GroupName.CardUI], version: 1 },

  // Card Illustrations
  [UIImagesName.card_illustration_vengeful]: { path: '/textures/cards/illustrations/Vengeful.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_thick_coat]: { path: '/textures/cards/illustrations/Thick_Coat.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_seppuku]: { path: '/textures/cards/illustrations/Seppuku.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_run_away]: { path: '/textures/cards/illustrations/Run_Away.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_reversal]: { path: '/textures/cards/illustrations/Reversal.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_pocket_pistol]: { path: '/textures/cards/illustrations/Pocket_Pistol.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_insult]: { path: '/textures/cards/illustrations/Insult.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_grapple]: { path: '/textures/cards/illustrations/Grapple.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_coin_flip]: { path: '/textures/cards/illustrations/Coin_Flip.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_behead]: { path: '/textures/cards/illustrations/Behead.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_bananas]: { path: '/textures/cards/illustrations/Bananas.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_second_reaction]: { path: '/textures/cards/illustrations/Second_Reaction.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_successful_block]: { path: '/textures/cards/illustrations/Successful_Block.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_pistol_shot]: { path: '/textures/cards/illustrations/Pistol_Shot.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_glancing_hit]: { path: '/textures/cards/illustrations/Glancing_Hit.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_pistol_closeup]: { path: '/textures/cards/illustrations/Pistol_Closeup.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_failed_block]: { path: '/textures/cards/illustrations/Failed_Block.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_face_closeup_smirk]: { path: '/textures/cards/illustrations/Face_Closeup_Smirk.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_duelist_shooting]: { path: '/textures/cards/illustrations/Duelist_Shooting.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_face_closeup]: { path: '/textures/cards/illustrations/Face_Closeup.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_duelist_desperate]: { path: '/textures/cards/illustrations/Duelist_Desperate.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_decapitation]: { path: '/textures/cards/illustrations/Decapitation.png', groups: [GroupName.CardUI], version: 1 },
  [UIImagesName.card_illustration_blade_miss]: { path: '/textures/cards/illustrations/Blade_Miss.png', groups: [GroupName.CardUI], version: 1 },
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
  [SceneName.Invite]: {
    backgrounds: [
      { texture: TextureName.bg_tavern_background, shiftMultiplier: -0.01, renderOrder: 0 },
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
      { name: 'bell', color: 'ff0000', description: 'Enlist, Commit or Retry duelist for matchmaking!', mask: TextureName.bg_matchmaking_bell_mask, renderOrder: 1 },
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

export {
  SCENE_PRIORITIES,
  TEXTURES,
  SPRITESHEETS,
  sceneBackgrounds,
}