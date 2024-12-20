import { BladesCard, EnvCard, PacesCard, Rarity, TacticsCard } from '@/games/pistols/generated/constants'

enum CardColor {
  WHITE = 'white',
  RED = '#e34a4a',
  YELLOW = '#f1d242',
  BLUE = '#4d9ad6',
  BROWN  = '#27110b'
}

interface CardData {
  path: string,
  cardFrontPath: string,
  color: CardColor,
  title: string,
  rarity: Rarity,
  description: string,
  descriptionDark?: string,
  titleShort?: string,
}

function getTextSpan(color: CardColor, text: string) {
  return `<span style="color:${color}; font-size:1.3em; font-weight:bold; -webkit-text-stroke: 0.03em #27110b;">${text}</span>`
}

const EnvironmentCardsTextures: Record<EnvCard, CardData> = {
  [EnvCard.None]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_white.png', 
    color: CardColor.WHITE, 
    title: 'No Tactics', 
    rarity: Rarity.Common, 
    description: 'NONE' 
  },
  [EnvCard.DamageUp]: { 
    path: '/textures/cards/illustrations/Pistol_Shot.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Damage Up', 
    rarity: Rarity.Common, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}` 
  },
  [EnvCard.DamageDown]: { 
    path: '/textures/cards/illustrations/Pistol_Closeup.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Damage Down', 
    rarity: Rarity.Common, 
    description: `Decrease your damage by ${getTextSpan(CardColor.RED, '-1')}` 
  },
  [EnvCard.ChancesUp]: { 
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Hit Chance Up', 
    rarity: Rarity.Common, 
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+10%')}` 
  },
  [EnvCard.ChancesDown]: { 
    path: '/textures/cards/illustrations/Face_Closeup.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Hit Chance Down', 
    rarity: Rarity.Common, 
    description: `Decrease your hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}` 
  },
  [EnvCard.DoubleDamageUp]: { 
    path: '/textures/cards/illustrations/Pistol_Shot.png', 
    cardFrontPath: '/textures/cards/card_front_red.png', 
    color: CardColor.RED, 
    title: 'Double Damage Up', 
    rarity: Rarity.Uncommon, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+2')}` 
  },
  [EnvCard.DoubleChancesUp]: { 
    path: '/textures/cards/illustrations/Face_Closeup_Smirk.png', 
    cardFrontPath: '/textures/cards/card_front_yellow.png', 
    color: CardColor.YELLOW, 
    title: 'Double Hit Chance Up', 
    rarity: Rarity.Uncommon, 
    description: `Increases your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}` 
  },
  [EnvCard.SpecialAllShotsHit]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'All Hit', 
    rarity: Rarity.Special, 
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'KILL')} the opponent` 
  },
  [EnvCard.SpecialAllShotsMiss]: { 
    path: '/textures/cards/illustrations/Duelist_Desperate.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'All Miss', 
    rarity: Rarity.Special, 
    description: `Every shot taken from this point forward will ${getTextSpan(CardColor.BLUE, 'MISS')} the opponent` 
  },
  [EnvCard.SpecialDoubleTactics]: { 
    path: '/textures/cards/illustrations/Successful_Block.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'Double Tactics', 
    rarity: Rarity.Special, 
    description: `Doubles the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`
  },
  [EnvCard.SpecialNoTactics]: { 
    path: '/textures/cards/illustrations/Glancing_Hit.png', 
    cardFrontPath: '/textures/cards/card_front_blue.png', 
    color: CardColor.BLUE, 
    title: 'No Tactics', 
    rarity: Rarity.Special, 
    description: `Removes the effect of your ${getTextSpan(CardColor.BLUE, 'TACTICS')} card`
  }
}

const FireCardsTextures: Record<PacesCard, CardData> = {
  [PacesCard.None]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at x', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, 'x')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, 'x')}`, 
    titleShort: 'x'
  },
  [PacesCard.Paces1]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 1', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '1')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '1')}`, 
    titleShort: '1'
  },
  [PacesCard.Paces2]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 2', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '2')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '2')}`, 
    titleShort: '2'
  },
  [PacesCard.Paces3]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 3', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '3')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '3')}`, 
    titleShort: '3'
  },
  [PacesCard.Paces4]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 4', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '4')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '4')}`, 
    titleShort: '4'
  },
  [PacesCard.Paces5]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 5', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '5')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '5')}`, 
    titleShort: '5'
  },
  [PacesCard.Paces6]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 6', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '6')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '6')}`, 
    titleShort: '6'
  },
  [PacesCard.Paces7]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 7', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '7')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '7')}`, 
    titleShort: '7'
  },
  [PacesCard.Paces8]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 8', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '8')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '8')}`, 
    titleShort: '8'
  },
  [PacesCard.Paces9]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 9', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '9')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '9')}`, 
    titleShort: '9'
  },
  [PacesCard.Paces10]: { 
    path: '/textures/cards/illustrations/Duelist_Shooting.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Fire at 10', 
    rarity: Rarity.None, 
    description: `You take your shot at step number ${getTextSpan(CardColor.BROWN, '10')}`, 
    descriptionDark: `You take your shot at step number ${getTextSpan(CardColor.WHITE, '10')}`, 
    titleShort: '10'
  },
}

const DodgeCardsTextures: Record<PacesCard, CardData> = {
  [PacesCard.None]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at x', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, 'x')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, 'x')}`, 
    titleShort: 'x'
  },
  [PacesCard.Paces1]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 1', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '1')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '1')}`, 
    titleShort: '1'
  },
  [PacesCard.Paces2]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 2', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '2')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '2')}`, 
    titleShort: '2'
  },
  [PacesCard.Paces3]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 3', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '3')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '3')}`, 
    titleShort: '3'
  },
  [PacesCard.Paces4]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 4', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '4')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '4')}`, 
    titleShort: '4'
  },
  [PacesCard.Paces5]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 5', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '5')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '5')}`, 
    titleShort: '5'
  },
  [PacesCard.Paces6]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 6', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '6')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '6')}`, 
    titleShort: '6'
  },
  [PacesCard.Paces7]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 7', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '7')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '7')}`, 
    titleShort: '7'
  },
  [PacesCard.Paces8]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 8', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '8')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '8')}`, 
    titleShort: '8'
  },
  [PacesCard.Paces9]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 9', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '9')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '9')}`, 
    titleShort: '9'
  },
  [PacesCard.Paces10]: { 
    path: '/textures/cards/illustrations/Blade_Miss.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Dodge at 10', 
    rarity: Rarity.None, 
    description: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.BROWN, '10')}`, 
    descriptionDark: `You try to dodge the opponents bullet at step number ${getTextSpan(CardColor.WHITE, '10')}`, 
    titleShort: '10'
  },
}

const TacticsCardsTextures: Record<TacticsCard, CardData> = {
  [TacticsCard.None]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'No Tactics', 
    rarity: Rarity.Special, 
    description: 'NONE' 
  },
  [TacticsCard.Insult]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Insult', 
    rarity: Rarity.None, 
    description: `Increase your opponents damage by ${getTextSpan(CardColor.RED, '+1')} and decrease your opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}` 
  },
  [TacticsCard.CoinToss]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Coin Flip', 
    rarity: Rarity.None, 
    description: 'First special card doesn\'t affect you' 
  },
  [TacticsCard.Vengeful]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Vengeful', 
    rarity: Rarity.None, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}`
  },
  [TacticsCard.ThickCoat]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Thick coat', 
    rarity: Rarity.None, 
    description: `Reduce opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  },
  [TacticsCard.Reversal]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Reversal', 
    rarity: Rarity.None, 
    description: 'Next negative environment card, excluding specials, is turned into a positive for all players' 
  },
  [TacticsCard.Bananas]: { 
    path: '/textures/cards/illustrations/Second_Reaction.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Bananas', 
    rarity: Rarity.None, 
    description: `Both players get a ${getTextSpan(CardColor.YELLOW, '-10%')} hit chance decrease`
  }
}

const BladesCardsTextures: Record<BladesCard, CardData> = {
  [BladesCard.None]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Behead', 
    rarity: Rarity.None, 
    description: `NONE` 
  },
  [BladesCard.Seppuku]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Sepuku', 
    rarity: Rarity.None, 
    description: `Increase your damage by ${getTextSpan(CardColor.RED, '+1')} and your hit chance by ${getTextSpan(CardColor.YELLOW, '+20%')}` 
  },
  [BladesCard.PocketPistol]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Pocket Pistol', 
    rarity: Rarity.None, 
    description: `Decrease opponents hit chance by ${getTextSpan(CardColor.YELLOW, '-10%')}`
  },
  [BladesCard.Behead]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Behead', 
    rarity: Rarity.None, 
    description: `Increases your damage by ${getTextSpan(CardColor.RED, '+1')}` 
  },
  [BladesCard.Grapple]: { 
    path: '/textures/cards/illustrations/Decapitation.png', 
    cardFrontPath: '/textures/cards/card_front_brown.png', 
    color: CardColor.WHITE, 
    title: 'Grapple', 
    rarity: Rarity.None, 
    description: `Decrease opponents damage by ${getTextSpan(CardColor.RED, '-1')}`
  }
}

export type { CardColor, CardData };
export { EnvironmentCardsTextures, FireCardsTextures, DodgeCardsTextures, TacticsCardsTextures, BladesCardsTextures }