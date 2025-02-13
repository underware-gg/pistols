import { cleanObject } from 'src/utils/misc/types'
import * as constants from 'src/games/pistols/generated/constants'

const _get_variant = (variant: any): any => {
  const v = cleanObject(variant)
  return Object.keys(v)[0]
}

type DuelistDrawnCard = {
  fire: constants.PacesCard;
  dodge: constants.PacesCard;
  blades: constants.BladesCard;
}
type DuelState = {
  health: number;
  damage: number;
  chances: number;
  dice_crit: number;
  honour: number;
  win: number;
}
type DuelSpecials = {
  coin_toss: number;
  reversal: number;
  shots_modifier: constants.EnvCard;
  tactics_modifier: constants.EnvCard;
}
type DuelHand = {
  card_fire: constants.PacesCard;
  card_dodge: constants.PacesCard;
  card_tactics: constants.TacticsCard;
  card_blades: constants.BladesCard;
}

export type DuelProgress = {
  winner: number;
  steps: {
    pace: constants.PacesCard;
    card_env: constants.EnvCard;
    dice_env: number;
    card_a: DuelistDrawnCard
    card_b: DuelistDrawnCard
    state_a: DuelState
    state_b: DuelState
    specials_a: DuelSpecials
    specials_b: DuelSpecials
  }[];
  hand_a: DuelHand
  hand_b: DuelHand
}

export const convert_duel_progress = (progress: any): DuelProgress | null => {
  if (!progress) return null

  const _drawn_card = (variant: any) => {
    const t = _get_variant(variant)
    return {
      fire: (t == constants.DuelistDrawnCard.Fire ? _get_variant(variant.Fire.variant) as constants.PacesCard : undefined),
      dodge: (t == constants.DuelistDrawnCard.Dodge ? _get_variant(variant.Dodge.variant) as constants.PacesCard : undefined),
      blades: (t == constants.DuelistDrawnCard.Blades ? _get_variant(variant.Blades.variant) as constants.BladesCard : undefined),
    }
  }

  const _specials = (specials: any) => {
    return {
      coin_toss: specials.coin_toss,
      reversal: specials.reversal,
      shots_modifier: _get_variant(specials.shots_modifier.variant) as constants.EnvCard,
      tactics_modifier: _get_variant(specials.tactics_modifier.variant) as constants.EnvCard,
    }
  }

  const _steps = (steps: any[]) => {
    return steps.map((step) => ({
      pace: _get_variant(step.pace.variant) as constants.PacesCard,
      card_env: _get_variant(step.card_env.variant) as constants.EnvCard,
      dice_env: step.dice_env,
      card_a: _drawn_card(step.card_a.variant),
      card_b: _drawn_card(step.card_b.variant),
      state_a: step.state_a,
      state_b: step.state_b,
      specials_a: _specials(step.specials_a),
      specials_b: _specials(step.specials_b),
    }))
  }

  const _hand = (hand: any) => {
    return {
      card_fire: _get_variant(hand.card_fire.variant) as constants.PacesCard,
      card_dodge: _get_variant(hand.card_dodge.variant) as constants.PacesCard,
      card_tactics: _get_variant(hand.card_tactics.variant) as constants.TacticsCard,
      card_blades: _get_variant(hand.card_blades.variant) as constants.BladesCard,
    }
  }

  return {
    winner: progress.winner,
    steps: _steps(progress.steps),
    hand_a: _hand(progress.hand_a),
    hand_b: _hand(progress.hand_b),
  }
}

// pace: PacesCard,
// card_env: EnvCard,
// dice_env: u8,
// card_a: DuelistDrawnCard,
// card_b: DuelistDrawnCard,
// state_a: DuelistState,  // Duelist A current state
// state_b: DuelistState,  // Duelist A current state
