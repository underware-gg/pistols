use dojo::world::{WorldStorage};
use pistols::interfaces::dns::{
    DnsTrait,
    IGameLoopDispatcher, IGameLoopDispatcherTrait,
};
use pistols::systems::game::game::{Errors as GameErrors};
use pistols::systems::rng::{RngWrap, Dice, DiceTrait, Shuffle, ShuffleTrait};
use pistols::models::{
    challenge::{Round, RoundTrait, DuelistState, DuelistStateTrait, MovesTrait},
};
use pistols::types::{
    round_state::{RoundState},
    duel_progress::{
        DuelProgress, DuelStep,
        SpecialsDrawn, SpecialsDrawnTrait,
    },
};
use pistols::types::cards::hand::{
    Deck, DeckTrait,
    DuelistHand, DuelistHandTrait,
    PacesCard,
    TacticsCardTrait,
    BladesCard, BladesCardTrait,
    EnvCard, EnvCardTrait,
    DuelistDrawnCard,
    FinalBlow,
};
use pistols::utils::math::{MathU8, MathU16};

//---------------------------------------
// Decide who wins a round, or go to next
//

#[generate_trait]
pub impl GameLoopContractImpl of GameLoopContractTrait {
    
    // call execute from game_loop contract
    fn execute(world: @WorldStorage, wrapped: @RngWrap, deck: @Deck, ref round: Round) -> DuelProgress {
        let game_loop_dispatcher: IGameLoopDispatcher = world.game_loop_dispatcher();
        let (result_progress, result_round) = game_loop_dispatcher.execute_game_loop(*wrapped, *deck, round);
        round = result_round;
        (result_progress)
    }
}

#[generate_trait]
pub impl GameLoopImpl of GameLoopTrait {

    // testable loop
    fn execute(wrapped: @RngWrap, deck: @Deck, ref round: Round) -> DuelProgress {

        let env_deck: Span<EnvCard> = EnvCardTrait::get_full_deck();

        let seed: felt252 = round.make_seed();
        let mut dice: Dice = DiceTrait::new(wrapped, seed);
        let mut shuffle: Shuffle = ShuffleTrait::new(wrapped, seed, env_deck.len().try_into().unwrap(), 'env');
        
        let mut hand_a: DuelistHand = round.moves_a.as_hand();
        let mut hand_b: DuelistHand = round.moves_b.as_hand();
        (*deck).validate_hand(ref hand_a);
        (*deck).validate_hand(ref hand_b);

        let mut specials_a: SpecialsDrawn = SpecialsDrawnTrait::initialize(@hand_a.card_tactics, @hand_b.card_tactics);
        let mut specials_b: SpecialsDrawn = SpecialsDrawnTrait::initialize(@hand_b.card_tactics, @hand_a.card_tactics);

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
            round.final_blow = FinalBlow::Paces(pace);
            // println!("Pace [{}] A:{} B:{}, shuffle:{}", step_number, round.moves_a.card_1, round.moves_b.card_1, shuffle.seed);

            // draw env card
            let (card_env, dice_env): (EnvCard, u8) = Self::_draw_env_card(@env_deck, @pace, ref shuffle);
            // println!("Env card/dice {}:{}", card_env, dice_env);

            // apply env card points to both duelists
            if (dice_fire_a == 0) {
                card_env.apply_points(ref specials_a, ref state_a, ref state_b);
            }
            if (dice_fire_b == 0) {
                card_env.apply_points(ref specials_b, ref state_b, ref state_a);
            }

            // Fire!
            if (hand_a.card_fire == pace) {
                Self::_fire(@hand_a.card_fire, @hand_b.card_dodge, ref state_a, ref state_b, ref dice, 'shoot_a');
                dice_fire_a = state_a.dice_fire;
            }
            if (hand_b.card_fire == pace) {
                Self::_fire(@hand_b.card_fire, @hand_a.card_dodge, ref state_b, ref state_a, ref dice, 'shoot_b');
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
        if (state_a.health != 0 && state_b.health != 0 &&
            (hand_a.card_blades != BladesCard::None || hand_b.card_blades != BladesCard::None)
        ) {
            Self::_blades(@hand_a.card_blades, @hand_b.card_blades, ref state_a, ref state_b);
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
                if (hand_a.card_blades == BladesCard::Seppuku) { FinalBlow::Blades(BladesCard::Seppuku) }
                else if (hand_b.card_blades == BladesCard::Seppuku) { FinalBlow::Blades(BladesCard::Seppuku) }
                else if (state_a.health != 0) { FinalBlow::Blades(hand_a.card_blades) }
                else { FinalBlow::Blades(hand_b.card_blades) };
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

    //
    // private methods
    //

    fn _draw_env_card(env_deck: @Span<EnvCard>, pace: @PacesCard, ref shuffle: Shuffle) -> (EnvCard, u8) {
        let dice: u8 = shuffle.draw_next();
        assert(dice > 0, GameErrors::BAD_SHUFFLE_SEED);
        let env_card: EnvCard = *(*env_deck)[(dice - 1).into()];
        (env_card, dice)
    }

    fn _fire(paces_shoot: @PacesCard, paces_dodge: @PacesCard, ref state_self: DuelistState, ref state_other: DuelistState, ref dice: Dice, salt: felt252) {
        let (dice, hit) = dice.throw_decide(salt, 100, state_self.chances);
        state_self.dice_fire = dice;
        if (hit && paces_shoot != paces_dodge) {
            state_other.health = MathU8::sub(state_other.health, state_self.damage);
        }
    }

    fn _blades(blades_a: @BladesCard, blades_b: @BladesCard, ref state_a: DuelistState, ref state_b: DuelistState) {
        // Rock-Paper-Scissors
        let (died_a, died_b): (bool, bool) = blades_a.clash(blades_b);
        if (died_a) {
            state_a.health = 0;
        }
        if (died_b) {
            state_b.health = 0;
        }
        // apply honour modifier
        blades_a.apply_honour(ref state_a);
        blades_b.apply_honour(ref state_b);
    }
}
