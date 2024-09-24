import { BladesCard, DuelistDrawnCard, EnvCard, PacesCard, TacticsCard } from "./generated/constants"
import { cleanObject } from "@/lib/utils/types"


const _get_variant = (variant: any): any => {
  const v = cleanObject(variant)
  return Object.keys(v)[0]
}

export type DuelProgress = {
    winner: number;
    steps: {
      pace: PacesCard;
      card_env: EnvCard;
      dice_env: number;
      card_a: {
        fire: PacesCard;
        dodge: PacesCard;
        blades: BladesCard;
      };
      card_b: {
        fire: PacesCard;
        dodge: PacesCard;
        blades: BladesCard;
      };
      state_a: {
        health: number;
        damage: number;
        chances: number;
        dice_crit: number;
        honour: number;
        wager: number;
        win: number;
      };
      state_b: {
        health: number;
        damage: number;
        chances: number;
        dice_crit: number;
        honour: number;
        wager: number;
        win: number;
      };
    }[];
    hand_a: {
      card_fire: PacesCard;
      card_dodge: PacesCard;
      card_tactics: TacticsCard;
      card_blades: BladesCard;
    };
    hand_b: {
      card_fire: PacesCard;
      card_dodge: PacesCard;
      card_tactics: TacticsCard;
      card_blades: BladesCard;
    };
}

export const convert_duel_progress = (progress: any): DuelProgress | null => {
  if (!progress) return null

  const _drawn_card = (variant: any) => {
    const t = _get_variant(variant)
    return {
      fire: (t == DuelistDrawnCard.Fire ? _get_variant(variant.Fire.variant) as PacesCard : undefined),
      dodge: (t == DuelistDrawnCard.Dodge ? _get_variant(variant.Dodge.variant) as PacesCard : undefined),
      blades: (t == DuelistDrawnCard.Blades ? _get_variant(variant.Blades.variant) as BladesCard : undefined),
    }
  }

  const _steps = (steps: any[]) => {
    return steps.map((step) => ({
      pace: _get_variant(step.pace.variant) as PacesCard,
      card_env: _get_variant(step.card_env.variant) as EnvCard,
      dice_env: step.dice_env,
      card_a: _drawn_card(step.card_a.variant),
      card_b: _drawn_card(step.card_b.variant),
      state_a: step.state_a,
      state_b: step.state_b,
    }))
  }

  const _hand = (hand: any) => {
    return {
      card_fire: _get_variant(hand.card_fire.variant) as PacesCard,
      card_dodge: _get_variant(hand.card_dodge.variant) as PacesCard,
      card_tactics: _get_variant(hand.card_tactics.variant) as TacticsCard,
      card_blades: _get_variant(hand.card_blades.variant) as BladesCard,
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
