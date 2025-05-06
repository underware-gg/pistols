import * as constants from '../generated/constants'

enum CardColor {
  WHITE = 'white',
  RED = '#e34a4a',
  YELLOW = '#f1d242',
  BLUE = '#4d9ad6',
  BROWN = '#27110b',
  ORANGE = '#ffa500',
  PURPLE = '#c64dc6'
}

interface CardData {
  path: string,
  cardFrontPath: string,
  color: CardColor,
  title: string,
  rarity: constants.Rarity,
  description: string,
  descriptionDark?: string,
  titleShort?: string,
  cardAmount?: number
}

function getTextSpan(color: CardColor, text: string) {
  return `<span style="color:${color}; font-size:1.3em; font-weight:bold; -webkit-text-stroke: 0.03em #27110b;">${text}</span>`
}

const EnvironmentCardsTextures: Record<constants.EnvCard, CardData> = {
  [constants.EnvCard.None]: {
    path: '/textures/cards/illustrations/Blade_Miss.png',
    cardFrontPath: '/textures/cards/card_front_white.png',
    color: CardColor.WHITE,
    title: 'No Tactics',
    rarity: constants.Rarity.Common,
    description: 'NONE',
    cardAmount: 0
  },
  [constants.EnvCard.DamageUp]: {
    path: '/textures/cards/illustrations/Pistol_Shot.png',
    cardFrontPath: '/textures/cards/card_front_red.png',
    color: CardColor.RED,
    title: 'Damage Up',
    rarity: constants.Rarity.Common,
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}`,
    cardAmount: 7
  },
  [constants.EnvCard.DamageDown]: {
    path: '/textures/cards/illustrations/Pistol_Closeup.png',
    cardFrontPath: '/textures/cards/card_front_red.png',
    color: CardColor.RED,
    title: 'Damage Down',
    rarity: constants.Rarity.Common,
    description: `Decrease your damage by ${getTextSpan(CardColor.RED, '-1')}`,
    cardAmount: 5
  },
  [constants.EnvCard.ChancesUp]: {
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png',
    cardFrontPath: '/textures/cards/card_front_yellow.png',
    color: CardColor.YELLOW,
    title: 'Hit Chance Up',
    rarity: constants.Rarity.Common,
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+10%')}`,
    cardAmount: 7
  },
  [constants.EnvCard.ChancesDown]: {
    path: '/textures/cards/illustrations/Face_Closeup.png',
    cardFrontPath: '/textures/cards/card_front_yellow.png',
    color: CardColor.YELLOW,
    title: 'Hit Chance Down',
    rarity: constants.Rarity.Common,
    description: `Decrease your hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}`,
    cardAmount: 5
  },
  [constants.EnvCard.DoubleDamageUp]: {
    path: '/textures/cards/illustrations/Pistol_Shot.png',
    cardFrontPath: '/textures/cards/card_front_red.png',
    color: CardColor.RED,
    title: 'Double Damage Up',
    rarity: constants.Rarity.Uncommon,
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+2')}`,
    cardAmount: 3
  },
  [constants.EnvCard.DoubleChancesUp]: {
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png',
    cardFrontPath: '/textures/cards/card_front_yellow.png',
    color: CardColor.YELLOW,
    title: 'Double Hit Chance Up',
    rarity: constants.Rarity.Uncommon,
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}`,
    cardAmount: 3
  },
  [constants.EnvCard.SpecialAllShotsHit]: {
    path: '/textures/cards/illustrations/Duelist_Shooting.png',
    cardFrontPath: '/textures/cards/card_front_blue.png',
    color: CardColor.BLUE,
    title: 'All Hit',
    rarity: constants.Rarity.Special,
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'KILL')} the opponent`,
    cardAmount: 1
  },
  [constants.EnvCard.SpecialAllShotsMiss]: {
    path: '/textures/cards/illustrations/Duelist_Desperate.png',
    cardFrontPath: '/textures/cards/card_front_blue.png',
    color: CardColor.BLUE,
    title: 'All Miss',
    rarity: constants.Rarity.Special,
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'MISS')} the opponent`,
    cardAmount: 1
  },
  [constants.EnvCard.SpecialDoubleTactics]: {
    path: '/textures/cards/illustrations/Successful_Block.png',
    cardFrontPath: '/textures/cards/card_front_blue.png',
    color: CardColor.BLUE,
    title: 'Double Tactics',
    rarity: constants.Rarity.Special,
    description: `Doubles the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`,
    cardAmount: 1
  },
  [constants.EnvCard.SpecialNoTactics]: {
    path: '/textures/cards/illustrations/Glancing_Hit.png',
    cardFrontPath: '/textures/cards/card_front_blue.png',
    color: CardColor.BLUE,
    title: 'No Tactics',
    rarity: constants.Rarity.Special,
    description: `Removes the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`,
    cardAmount: 1
  }
}

const FireCardsTextures: Record<constants.PacesCard, CardData> = {
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

const DodgeCardsTextures: Record<constants.PacesCard, CardData> = {
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

const TacticsCardsTextures: Record<constants.TacticsCard, CardData> = {
  [constants.TacticsCard.None]: {
    path: '/textures/cards/illustrations/Second_Reaction.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'No Tactics',
    rarity: constants.Rarity.Special,
    description: 'NONE'
  },
  [constants.TacticsCard.Insult]: {
    path: '/textures/cards/illustrations/Insult.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Insult',
    rarity: constants.Rarity.None,
    description: `Increase your opponents damage by ${getTextSpan(CardColor.RED, '+1')} and decrease your opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}`
  },
  [constants.TacticsCard.CoinToss]: {
    path: '/textures/cards/illustrations/Coin_Flip.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Coin Flip',
    rarity: constants.Rarity.None,
    description: 'First special card doesn\'t affect you'
  },
  [constants.TacticsCard.Vengeful]: {
    path: '/textures/cards/illustrations/Vengeful.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Vengeful',
    rarity: constants.Rarity.None,
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}`
  },
  [constants.TacticsCard.ThickCoat]: {
    path: '/textures/cards/illustrations/Thick_Coat.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Thick coat',
    rarity: constants.Rarity.None,
    description: `Reduce opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  },
  [constants.TacticsCard.Reversal]: {
    path: '/textures/cards/illustrations/Reversal.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Reversal',
    rarity: constants.Rarity.None,
    description: 'Next negative environment card, excluding specials, is turned into a positive for all players'
  },
  [constants.TacticsCard.Bananas]: {
    path: '/textures/cards/illustrations/Bananas.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Bananas',
    rarity: constants.Rarity.None,
    description: `Both players get a ${getTextSpan(CardColor.YELLOW, '-10%')} hit chance decrease`
  }
}

const BladesCardsTextures: Record<constants.BladesCard, CardData> = {
  [constants.BladesCard.None]: {
    path: '/textures/cards/illustrations/Decapitation.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Behead',
    rarity: constants.Rarity.None,
    description: `NONE`
  },
  [constants.BladesCard.Seppuku]: {
    path: '/textures/cards/illustrations/Seppuku.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Sepuku',
    rarity: constants.Rarity.None,
    description: `Increase your damage by ${getTextSpan(CardColor.RED, '+1')} and your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}`
  },
  [constants.BladesCard.PocketPistol]: {
    path: '/textures/cards/illustrations/Pocket_Pistol.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Pocket Pistol',
    rarity: constants.Rarity.None,
    description: `Decrease opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}`
  },
  [constants.BladesCard.Behead]: {
    path: '/textures/cards/illustrations/Behead.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Behead',
    rarity: constants.Rarity.None,
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}`
  },
  [constants.BladesCard.Grapple]: {
    path: '/textures/cards/illustrations/Grapple.png',
    cardFrontPath: '/textures/cards/card_front_brown.png',
    color: CardColor.WHITE,
    title: 'Grapple',
    rarity: constants.Rarity.None,
    description: `Decrease opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  }
}

export type { CardData };
export { CardColor, EnvironmentCardsTextures, FireCardsTextures, DodgeCardsTextures, TacticsCardsTextures, BladesCardsTextures }