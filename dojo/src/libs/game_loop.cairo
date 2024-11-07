// use debug::PrintTrait;
use core::traits::TryInto;
use starknet::{ContractAddress, get_block_timestamp};
use dojo::world::{WorldStorage};

use pistols::systems::rng::{Dice, DiceTrait, Shuffle, ShuffleTrait};
use pistols::models::{
    challenge::{Round, RoundTrait, DuelistState, DuelistStateTrait, Moves, MovesTrait},
    duelist::{Duelist, Score},
};
use pistols::types::challenge_state::{ChallengeState};
use pistols::types::round_state::{RoundState};
use pistols::types::duel_progress::{
    DuelProgress, DuelStep,
    SpecialsDrawn, SpecialsDrawnTrait,
};
use pistols::types::cards::hand::{
    DuelistHand, DuelistHandTrait, DeckType,
    PacesCard, PacesCardTrait,
    TacticsCard, TacticsCardTrait,
    BladesCard, BladesCardTrait,
    EnvCard, EnvCardTrait,
    DuelistDrawnCard,
};
use pistols::types::constants::{CONST};
use pistols::utils::math::{MathU8, MathU16};
use pistols::utils::bitwise::{BitwiseU32, BitwiseU128};
use pistols::utils::hash::{hash_values, felt_to_u128};
use pistols::libs::store::{Store, StoreTrait};


// a moves hash is composed of a hash of each move
// * salt is hashed with each move
// * only a 32-bit part of each has is used
// move 1: 0x00000000000000000000000011111111
// move 2: 0x00000000000000002222222200000000
// move 3: 0x00000000333333330000000000000000
// move 4: 0x44444444000000000000000000000000
// * finally composed into a single u128
// hash  : 0x44444444333333332222222211111111
fn make_moves_hash(salt: felt252, moves: Span<u8>) -> u128 {
    let mut result: u128 = 0;
    let mut index: usize = 0;
    while (index < moves.len()) {
        let move: felt252 = (*moves.at(index)).into();
        if (move != 0) {
            let mask: u128 = BitwiseU128::shl(BitwiseU32::max().into(), index * 32);
            let hash: u128 = felt_to_u128(hash_values([salt, move].span()));
            result = result | (hash & mask);
        }
        index += 1;
    };
    (result)
}


//---------------------------------------
// Decide who wins a round, or go to next
//

// testable loop
fn game_loop(world: @WorldStorage, deck_type: DeckType, ref round: Round) -> DuelProgress {
    // let _table_type: TableType = store.get_table_config_value(challenge.table_id).table_type;

    let env_deck: Span<EnvCard> = EnvCardTrait::get_full_deck().span();

    let mut dice: Dice = DiceTrait::new(world, round.make_seed());
    let mut shuffle: Shuffle = ShuffleTrait::new(world, round.make_seed(), env_deck.len().try_into().unwrap(), 'env');
    
    let mut hand_a: DuelistHand = round.moves_a.as_hand();
    let mut hand_b: DuelistHand = round.moves_b.as_hand();
    hand_a.validate(deck_type);
    hand_b.validate(deck_type);

    let mut specials_a: SpecialsDrawn = SpecialsDrawnTrait::initialize(hand_a.card_tactics, hand_b.card_tactics);
    let mut specials_b: SpecialsDrawn = SpecialsDrawnTrait::initialize(hand_b.card_tactics, hand_a.card_tactics);

    round.state_a.initialize(hand_a);
    round.state_b.initialize(hand_b);
    let mut state_a: DuelistState = round.state_a;
    let mut state_b: DuelistState = round.state_b;

    //------------------------------------------------------
    // apply cards
    //
    hand_a.card_tactics.apply_points(ref state_a, ref state_b, 1, EnvCard::None);
    hand_b.card_tactics.apply_points(ref state_b, ref state_a, 1, EnvCard::None);
    hand_a.card_blades.apply_points(ref state_a, ref state_b);
    hand_b.card_blades.apply_points(ref state_b, ref state_a);

    
    //------------------------------------------------------
    // Steps
    //
    // save step 0 (initial state)
    let mut steps: Array<DuelStep> = array![];
    steps.append(DuelStep {
        pace: PacesCard::None,
        card_env: EnvCard::None,
        dice_env: 0,
        specials_a,
        specials_b,
        card_a: DuelistDrawnCard::None,
        card_b: DuelistDrawnCard::None,
        state_a,
        state_b,
    });


    //------------------------------------------------------
    // Pistols round
    //

    let mut dice_fire_a: u8 = 0;
    let mut dice_fire_b: u8 = 0;

    let mut step_number: u8 = 1;
    while (step_number <= 10) {
        let pace: PacesCard = step_number.into();
        round.final_blow = pace.variant_name();
        // println!("Pace [{}] A:{} B:{}", step_number, self.moves_a.card_fire.as_felt(), self.moves_b.card_fire.as_felt());

        // draw env card
        let (card_env, dice_env): (EnvCard, u8) = draw_env_card(env_deck, pace, ref shuffle);

        // apply env card points to both duelists
        card_env.apply_points(ref specials_a, ref state_a, ref state_b);
        card_env.apply_points(ref specials_b, ref state_b, ref state_a);

        // Fire!
        if (hand_a.card_fire == pace) {
            fire(hand_a.card_fire, hand_b.card_dodge, ref state_a, ref state_b, ref dice, 'shoot_a');
            dice_fire_a = state_a.dice_fire;
        }
        if (hand_b.card_fire == pace) {
            fire(hand_b.card_fire, hand_a.card_dodge, ref state_b, ref state_a, ref dice, 'shoot_b');
            dice_fire_b = state_b.dice_fire;
        }

        // save step 1-10
        steps.append(DuelStep {
            pace,
            card_env,
            dice_env,
            specials_a,
            specials_b,
            card_a: hand_a.draw_card(pace),
            card_b: hand_b.draw_card(pace),
            state_a,
            state_b,
        });

        // reset dices
        state_a.dice_fire = 0;
        state_b.dice_fire = 0;

        // break if there's a winner
        if (state_a.health == 0 || state_b.health == 0) { break; }
        // both dices rolled, no winner, go to blades
        if (dice_fire_a != 0 && dice_fire_b != 0) { break; }
        
        step_number += 1;
    };


    //------------------------------------------------------
    // Blades Round
    //
    if (state_a.health != 0 &&
        state_b.health != 0 &&
        (hand_a.card_blades != BladesCard::None || hand_b.card_blades != BladesCard::None)
    ) {
        blades(hand_a.card_blades, hand_b.card_blades, ref state_a, ref state_b);
        steps.append(DuelStep {
            pace: PacesCard::None,
            card_env: EnvCard::None,
            dice_env: 0,
            specials_a: Default::default(),
            specials_b: Default::default(),
            card_a: DuelistDrawnCard::Blades(hand_a.card_blades),
            card_b: DuelistDrawnCard::Blades(hand_b.card_blades),
            state_a,
            state_b,
        });
        round.final_blow =
            if (hand_a.card_blades == BladesCard::Seppuku) {hand_a.card_blades.variant_name()}
            else if (hand_b.card_blades == BladesCard::Seppuku) {hand_b.card_blades.variant_name()}
            else if (state_a.health != 0) {hand_a.card_blades.variant_name()}
            else {hand_b.card_blades.variant_name()};
    }

    // update round model
    round.state_a = state_a;
    round.state_b = state_b;
    round.state_a.dice_fire = dice_fire_a;
    round.state_b.dice_fire = dice_fire_b;
    round.state = RoundState::Finished;

    //------------------------------------------------------
    // returns the full duel progress, ready for animation
    //

    let winner: u8 =
        if (round.state_a.health != 0 && round.state_b.health == 0) {1}
        else if (round.state_a.health == 0 && round.state_b.health != 0) {2}
        else {0};
    
    (DuelProgress {
        // results
        steps: steps.span(),
        winner,
        hand_a,
        hand_b,
    })
}


fn draw_env_card(env_deck: Span<EnvCard>, pace: PacesCard, ref shuffle: Shuffle) -> (EnvCard, u8) {
    let dice: u8 = shuffle.draw_next();
    let env_card: EnvCard = *env_deck[(dice - 1).into()];
    (env_card, dice)
}

fn fire(paces_shoot: PacesCard, paces_dodge: PacesCard, ref state_self: DuelistState, ref state_other: DuelistState, ref dice: Dice, salt: felt252) {
    let (dice, hit) = dice.throw_decide(salt, 100, state_self.chances);
    state_self.dice_fire = dice;
    if (hit && paces_shoot != paces_dodge) {
        state_other.health = MathU8::sub(state_other.health, state_self.damage);
    }
}

fn blades(blades_a: BladesCard, blades_b: BladesCard, ref state_a: DuelistState, ref state_b: DuelistState) {
    // Rock-Paper-Scissors
    if (state_a.health != 0 && state_b.health != 0) {
        let (died_a, died_b): (bool, bool) = blades_a.clash(blades_b);
        if (died_a) {
            state_a.health = 0;
        }
        if (died_b) {
            state_b.health = 0;
        }
    }
}
