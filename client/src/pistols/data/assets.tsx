import * as THREE from 'three'
import { SceneName } from '@/pistols/hooks/PistolsContext'
import { constants } from '@underware_gg/pistols-sdk/pistols'


//----------------------------
// Texture Assets
//
export enum TextureName {
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
}
export type TextureAttributes = {
  path: string
  alpha?: boolean
}
const TEXTURES: Record<TextureName, TextureAttributes> = {
  [TextureName.Testcard]: { path: '/textures/testcard.jpg' },
  [TextureName.bg_gate]: { path: '/images/bg_gate.jpg' },
  [TextureName.bg_door]: { path: '/images/bg_door.jpg' },
  [TextureName.bg_gate_mask]: { path: '/images/bg_gate_mask.png' },
  [TextureName.bg_profile]: { path: '/images/bg_profile.jpg' },
  [TextureName.bg_tavern]: { path: '/images/bg_tavern.jpg' },
  [TextureName.bg_tavern_mask]: { path: '/images/bg_tavern_mask.png', alpha: true },
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
}



export enum CardColor {
  WHITE = 'white',
  RED = '#e34a4a',
  YELLOW = '#f1d242',
  BLUE = '#4d9ad6',
  BROWN  = '#27110b'
}

export interface CardData {
  path: string,
  cardFrontPath: string,
  color: CardColor,
  title: string,
  rarity: constants.Rarity,
  description: string,
  descriptionDark?: string,
  titleShort?: string,
}

function getTextSpan(color: CardColor, text: string) {
  return `<span style="color:${color}; font-size:1.3em; font-weight:bold; -webkit-text-stroke: 0.03em #27110b;">${text}</span>`
}

export const EnvironmentCardsTextures: Record<constants.EnvCard, CardData> = {
  [constants.EnvCard.None]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_white.png', 
    color: CardColor.WHITE, 
    title: 'No Tactics', 
    rarity: constants.Rarity.Common, 
    description: 'NONE' 
  },
  [constants.EnvCard.DamageUp]: { 
    path: '/textures/cards/illustrations/Pistol_Shot.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Damage Up', 
    rarity: constants.Rarity.Common, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}` 
  },
  [constants.EnvCard.DamageDown]: { 
    path: '/textures/cards/illustrations/Pistol_Closeup.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Damage Down', 
    rarity: constants.Rarity.Common, 
    description: `Decrease your damage by ${getTextSpan(CardColor.RED, '-1')}` 
  },
  [constants.EnvCard.ChancesUp]: { 
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Hit Chance Up', 
    rarity: constants.Rarity.Common, 
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+10%')}` 
  },
  [constants.EnvCard.ChancesDown]: { 
    path: '/textures/cards/illustrations/Face_Closeup.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Hit Chance Down', 
    rarity: constants.Rarity.Common, 
    description: `Decrease your hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}` 
  },
  [constants.EnvCard.DoubleDamageUp]: { 
    path: '/textures/cards/illustrations/Pistol_Shot.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Double Damage Up', 
    rarity: constants.Rarity.Uncommon, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+2')}` 
  },
  [constants.EnvCard.DoubleChancesUp]: { 
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Double Hit Chance Up', 
    rarity: constants.Rarity.Uncommon, 
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}` 
  },
  [constants.EnvCard.SpecialAllShotsHit]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'All Hit', 
    rarity: constants.Rarity.Special, 
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'KILL')} the opponent` 
  },
  [constants.EnvCard.SpecialAllShotsMiss]: { 
    path: '/textures/cards/illustrations/Duelist_Desperate.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'All Miss', 
    rarity: constants.Rarity.Special, 
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'MISS')} the opponent` 
  },
  [constants.EnvCard.SpecialDoubleTactics]: { 
    path: '/textures/cards/illustrations/Successful_Block.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'Double Tactics', 
    rarity: constants.Rarity.Special, 
    description: `Doubles the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`
  },
  [constants.EnvCard.SpecialNoTactics]: { 
    path: '/textures/cards/illustrations/Glancing_Hit.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'No Tactics', 
    rarity: constants.Rarity.Special, 
    description: `Removes the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`
  }
}

export const FireCardsTextures: Record<constants.PacesCard, CardData> = {
  [constants.PacesCard.None]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at x', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, 'x')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, 'x')}`, 
    titleShort: 'x'
  },
  [constants.PacesCard.Paces1]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 1', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '1')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '1')}`, 
    titleShort: '1'
  },
  [constants.PacesCard.Paces2]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 2', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '2')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '2')}`, 
    titleShort: '2'
  },
  [constants.PacesCard.Paces3]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 3', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '3')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '3')}`, 
    titleShort: '3'
  },
  [constants.PacesCard.Paces4]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 4', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '4')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '4')}`, 
    titleShort: '4'
  },
  [constants.PacesCard.Paces5]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 5', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '5')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '5')}`, 
    titleShort: '5'
  },
  [constants.PacesCard.Paces6]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 6', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '6')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '6')}`, 
    titleShort: '6'
  },
  [constants.PacesCard.Paces7]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 7', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '7')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '7')}`, 
    titleShort: '7'
  },
  [constants.PacesCard.Paces8]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 8', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '8')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '8')}`, 
    titleShort: '8'
  },
  [constants.PacesCard.Paces9]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 9', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '9')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '9')}`, 
    titleShort: '9'
  },
  [constants.PacesCard.Paces10]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 10', 
    rarity: constants.Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '10')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '10')}`, 
    titleShort: '10'
  },
}

export const DodgeCardsTextures: Record<constants.PacesCard, CardData> = {
  [constants.PacesCard.None]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at x', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, 'x')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, 'x')}`, 
    titleShort: 'x'
  },
  [constants.PacesCard.Paces1]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 1', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '1')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '1')}`, 
    titleShort: '1'
  },
  [constants.PacesCard.Paces2]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 2', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '2')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '2')}`, 
    titleShort: '2'
  },
  [constants.PacesCard.Paces3]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 3', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '3')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '3')}`, 
    titleShort: '3'
  },
  [constants.PacesCard.Paces4]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 4', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '4')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '4')}`, 
    titleShort: '4'
  },
  [constants.PacesCard.Paces5]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 5', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '5')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '5')}`, 
    titleShort: '5'
  },
  [constants.PacesCard.Paces6]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 6', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '6')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '6')}`, 
    titleShort: '6'
  },
  [constants.PacesCard.Paces7]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 7', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '7')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '7')}`, 
    titleShort: '7'
  },
  [constants.PacesCard.Paces8]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 8', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '8')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '8')}`, 
    titleShort: '8'
  },
  [constants.PacesCard.Paces9]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 9', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '9')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '9')}`, 
    titleShort: '9'
  },
  [constants.PacesCard.Paces10]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 10', 
    rarity: constants.Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '10')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '10')}`, 
    titleShort: '10'
  },
}

export const TacticsCardsTextures: Record<constants.TacticsCard, CardData> = {
  [constants.TacticsCard.None]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'No Tactics', 
    rarity: constants.Rarity.Special, 
    description: 'NONE' 
  },
  [constants.TacticsCard.Insult]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Insult', 
    rarity: constants.Rarity.None, 
    description: `Increase your opponents damage by ${getTextSpan(CardColor.RED, '+1')} and decrease your opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}` 
  },
  [constants.TacticsCard.CoinToss]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Coin Flip', 
    rarity: constants.Rarity.None, 
    description: 'First special card doesn\'t affect you' 
  },
  [constants.TacticsCard.Vengeful]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Vengeful', 
    rarity: constants.Rarity.None, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}`
  },
  [constants.TacticsCard.ThickCoat]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Thick coat', 
    rarity: constants.Rarity.None, 
    description: `Reduce opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  },
  [constants.TacticsCard.Reversal]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Reversal', 
    rarity: constants.Rarity.None, 
    description: 'Next negative environment card, excluding specials, is turned into a positive for all players' 
  },
  [constants.TacticsCard.Bananas]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Bananas', 
    rarity: constants.Rarity.None, 
    description: `Both players get a ${getTextSpan(CardColor.YELLOW, '-10%')} hit chance decrease`
  }
}

export const BladesCardsTextures: Record<constants.BladesCard, CardData> = {
  [constants.BladesCard.None]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Behead', 
    rarity: constants.Rarity.None, 
    description: `NONE` 
  },
  [constants.BladesCard.Seppuku]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Sepuku', 
    rarity: constants.Rarity.None, 
    description: `Increase your damage by ${getTextSpan(CardColor.RED, '+1')} and your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}` 
  },
  [constants.BladesCard.PocketPistol]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Pocket Pistol', 
    rarity: constants.Rarity.None, 
    description: `Decrease opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}`
  },
  [constants.BladesCard.Behead]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Behead', 
    rarity: constants.Rarity.None, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}` 
  },
  [constants.BladesCard.Grapple]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Grapple', 
    rarity: constants.Rarity.None, 
    description: `Decrease opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  }
}

export interface SceneData {
  background: TextureName,
  mask?: TextureName,
  items?: SceneObject[]
}

export interface SceneObject {
  name: string,
  color: string,
  description: string,
}

export const sceneBackgrounds: Record<SceneName, SceneData> = {
  [SceneName.Gate]: { 
    background: TextureName.bg_gate,
    mask: TextureName.bg_gate_mask,
    items: [
      { name: 'door', color: 'ff0000', description: 'Knock on door' },        // red
      { name: 'duel', color: 'ffff00', description: 'Show duel tutorial' },   // yellow
      { name: 'sign', color: '00ff00', description: 'See more' },             // green
    ]
  },
  [SceneName.Door]: { background: TextureName.bg_door },
  [SceneName.Profile]: { background: TextureName.bg_profile },
  [SceneName.Tavern]: { 
    background: TextureName.bg_tavern,
    mask: TextureName.bg_tavern_mask,
    items: [
      { name: 'bartender', color: 'ff0000', description: 'Bartender' },   // red
      { name: 'bottle', color: '00ff00', description: 'All Duelists' },   // green
      { name: 'pistol', color: '0000ff', description: 'Your Duels' },     // blue
      { name: 'shovel', color: 'ff00ff', description: 'Past Duels' }      // magenta
    ]
  },
  [SceneName.Duelists]: { 
    background: TextureName.bg_duelists,
    mask: TextureName.bg_duelists_mask,
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page' },  // red
      { name: 'right arrow', color: 'ff0000', description: 'Next Page' },     // green
    ]
   },
  [SceneName.Duels]: { 
    background: TextureName.bg_duels,
    mask: TextureName.bg_duels_mask,
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page' },  // red
      { name: 'right arrow', color: 'ff0000', description: 'Next Page' },     // green
    ]
   },
  [SceneName.Graveyard]: { 
    background: TextureName.bg_graveyard,
    mask: TextureName.bg_graveyard_mask,
    items: [
      { name: 'left arrow', color: '00ff00', description: 'Previous Page' },  // red
      { name: 'right arrow', color: 'ff0000', description: 'Next Page' },     // green
    ]
   },
  [SceneName.Tournament]: { background: TextureName.bg_duels_live },
  [SceneName.IRLTournament]: { background: TextureName.bg_duels_live },
  [SceneName.Duel]: { background: TextureName.bg_duel },
}

enum CharacterType {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
}
export enum AnimName {
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

//----------------------------
// Profile Picture to animation model
//
const ProfileModels: Record<number, CharacterType> = {
  [0]: CharacterType.MALE,
  [1]: CharacterType.MALE,
  [2]: CharacterType.FEMALE,
  [3]: CharacterType.MALE,
  [4]: CharacterType.MALE,
  [5]: CharacterType.MALE,
  [6]: CharacterType.MALE,
  [7]: CharacterType.MALE,
  [8]: CharacterType.MALE,
  [9]: CharacterType.MALE,
  [10]: CharacterType.MALE,
  [11]: CharacterType.FEMALE,
  [12]: CharacterType.MALE,
  [13]: CharacterType.MALE,
  [14]: CharacterType.MALE,
  [15]: CharacterType.MALE,
  [16]: CharacterType.FEMALE,
  [17]: CharacterType.MALE,
  [18]: CharacterType.FEMALE,
  [19]: CharacterType.FEMALE,
  [20]: CharacterType.MALE,
  [21]: CharacterType.MALE,
}


//----------------------------
// Audio Assets
//
enum AudioName {
  MUSIC_MENUS = 'MUSIC_MENUS',
  MUSIC_INGAME = 'MUSIC_INGAME',
  SHOOT = 'SHOOT',
  BODY_FALL = 'BODY_FALL',
  GRUNT_FEMALE = 'GRUNT_FEMALE',
  GRUNT_MALE = 'GRUNT_MALE',
  STRIKE_LIGHT = 'STRIKE_LIGHT',
  STRIKE_HEAVY = 'STRIKE_HEAVY',
  STRIKE_BLOCK = 'STRIKE_BLOCK',
}

interface AudioAsset {
  path: string
  loop?: boolean
  volume?: number
  disabled?: boolean
  delaySeconds?: number   // we can delay playback to match animation frame
  // loader
  object?: any
  loaded?: boolean
}
type AudioAssets = {
  [key in AudioName]: AudioAsset
}


let AUDIO_ASSETS: AudioAssets = {
  MUSIC_MENUS: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
  },
  MUSIC_INGAME: {
    path: '/audio/biodecay-song6.mp3',
    volume: 0.5,
    loop: true,
    disabled: true,
  },
  SHOOT: {
    path: '/audio/sfx/pistol-shot.mp3',
    loop: false,
    delaySeconds: 1,
  },
  BODY_FALL: {
    path: '/audio/sfx/body-fall.mp3',
    loop: false,
    delaySeconds: 0.4,
  },
  GRUNT_FEMALE: {
    path: '/audio/sfx/grunt-female.mp3',
    loop: false,
    delaySeconds: 0.6,
  },
  GRUNT_MALE: {
    path: '/audio/sfx/grunt-man.mp3',
    loop: false,
    delaySeconds: 0.6,
  },
  STRIKE_LIGHT: {
    path: '/audio/sfx/strike-light.mp3',
    loop: false,
    delaySeconds: 0.8,
  },
  STRIKE_HEAVY: {
    path: '/audio/sfx/strike-heavy.mp3',
    loop: false,
    delaySeconds: 0.85,
  },
  STRIKE_BLOCK: {
    path: '/audio/sfx/strike-block.mp3',
    loop: false,
    delaySeconds: 0.9,
  },
}



//----------------------------
// Loaders
//
// Generic loader
const _loader = async (ASSETS: any, onLoading: Function) => {
  return new Promise<void>((resolve, reject) => {
    let assetsToLoad = Object.keys(ASSETS).length
    Object.keys(ASSETS).forEach((name) => {
      onLoading(name, (object: any) => {
        ASSETS[name].object = object
        if (--assetsToLoad == 0) {
          resolve()
        }
      })
    })
  })
}

//-----------------
// Audios
//
const _loadAudios = async (listener: THREE.AudioListener) => {
  const loader = new THREE.AudioLoader()
  return _loader(AUDIO_ASSETS, (name: string, resolve: Function) => {
    const asset = AUDIO_ASSETS[name]
    if (asset.disabled) {
      resolve(null)
      return
    }
    try {
      loader.load(asset.path, function (buffer) {
        // load asset...
        let audio = null
        // console.log(`CACHED AUDIO [${name}]:`, buffer)
        if (buffer) {
          audio = new THREE.Audio(listener).setBuffer(buffer)
          audio.setLoop(asset.loop ?? false)
          audio.setVolume(asset.volume ?? 1.0)
          audio.autoplay = false
        }
        resolve(audio)
      })
    } catch (e) {
      console.error(`CACHED AUDIO [${name}] FAILED!`, e)
    }
  })
}



//----------------------------
// Main Asset Loader
//

//
// Audios need to be loaded after user interaction
// call this from some button
let _audioAssetsLoaded: boolean
const loadAudioAssets = async () => {
  if (_audioAssetsLoaded === undefined) {
    _audioAssetsLoaded = false
    const listener = new THREE.AudioListener()
    await _loadAudios(listener)
    console.log(`--- CACHED AUDIOS! 👍`)
    _audioAssetsLoaded = true
  }
  return _audioAssetsLoaded
}
const isAudioAssetsLoaded = () => {
  return _audioAssetsLoaded
}


export {
  CharacterType,
  TEXTURES,
  SPRITESHEETS,
  ProfileModels,
  loadAudioAssets,
  isAudioAssetsLoaded,
  AudioName,
  AUDIO_ASSETS,
}
