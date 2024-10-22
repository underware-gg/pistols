
mod shooter {
    // use debug::PrintTrait;
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::game::game::{Errors as ActionErrors};
    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::libs::utils;
    use pistols::models::challenge::{Challenge, Round, RoundTrait, RoundEntity, Moves, MovesTrait, DuelistState, DuelistStateTrait};
    use pistols::models::duelist::{Duelist, Score};
    use pistols::models::table::{TableConfig, TableConfigEntity, TableType};
    use pistols::types::constants::{CONST};
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
    use pistols::utils::math::{MathU8, MathU16};
    use pistols::libs::store::{Store, StoreTrait};

    fn _assert_challenge(store: Store, caller: ContractAddress, duelist_id: u128, duel_id: u128, round_number: u8) -> (Challenge, u8) {
        let challenge: Challenge = store.get_challenge(duel_id);
        // Assert Duelist is in the challenge
        let duelist_number: u8 =
            if (challenge.duelist_id_a == duelist_id) { 1 }
            else if (challenge.duelist_id_b == duelist_id) { 2 }
            else { 0 };
        assert(duelist_number != 0, ActionErrors::NOT_YOUR_DUELIST);

        let duelist_address: ContractAddress =
            if (duelist_number == 1) { challenge.address_a }
            else { challenge.address_b };
        assert(caller == duelist_address, ActionErrors::NOT_YOUR_CHALLENGE);

        // Correct Challenge state
        assert(challenge.state == ChallengeState::InProgress, ActionErrors::CHALLENGE_NOT_IN_PROGRESS);
        assert(challenge.round_number == round_number, ActionErrors::INVALID_ROUND_NUMBER);
        assert(round_number <= CONST::ROUND_COUNT, ActionErrors::INVALID_ROUND_NUMBER);
        
        (challenge, duelist_number)
    }


    //-----------------------------------
    // Commit
    //
    fn commit_moves(store: Store, duelist_id: u128, duel_id: u128, round_number: u8, hashed: u128) {
        // Assert correct Challenge
        let (_challenge, duelist_number) = _assert_challenge(store, starknet::get_caller_address(), duelist_id, duel_id, round_number);

        // Assert correct Round
        let mut round: RoundEntity = store.get_round_entity(duel_id, round_number);
        assert(round.state == RoundState::Commit, ActionErrors::ROUND_NOT_IN_COMMIT);

        // Validate action hash

        // Store hash
        if (duelist_number == 1) {
            assert(round.moves_a.hashed == 0, ActionErrors::ALREADY_COMMITTED);
            round.moves_a.hashed = hashed;
        } else if (duelist_number == 2) {
            assert(round.moves_b.hashed == 0, ActionErrors::ALREADY_COMMITTED);
            round.moves_b.hashed = hashed;
        }

        // Finished commit
        if (round.moves_a.hashed != 0 && round.moves_b.hashed != 0) {
            round.state = RoundState::Reveal;
        }

        store.set_round_entity(@round);
    }

    //-----------------------------------
    // Reveal
    //
    fn reveal_moves(store: Store, duelist_id: u128, duel_id: u128, round_number: u8, salt: felt252, moves: Span<u8>) -> Challenge {
        // Assert correct Challenge
        let (mut challenge, duelist_number) = _assert_challenge(store, starknet::get_caller_address(), duelist_id, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = store.get_round( duel_id, round_number);
        assert(round.state == RoundState::Reveal, ActionErrors::ROUND_NOT_IN_REVEAL);

        // Validate salt
        // TODO: verify salt as a signature
        assert(salt != 0, ActionErrors::INVALID_SALT);

        // Validate action hash
        assert(moves.len() >= 2 && moves.len() <= 4, ActionErrors::INVALID_MOVES_COUNT);
        let hashed: u128 = utils::make_moves_hash(salt, moves);

        // since the hash was validated
        // we should not validate the actual moves
        // all we can do is skip if they are invalid

        // Validate moves hash
        if (duelist_number == 1) {
            assert(round.moves_a.card_1 == 0, ActionErrors::ALREADY_REVEALED);
            assert(round.moves_a.hashed == hashed, ActionErrors::MOVES_HASH_MISMATCH);
            round.moves_a.initialize(salt, moves);
        } else if (duelist_number == 2) {
            assert(round.moves_b.card_1 == 0, ActionErrors::ALREADY_REVEALED);
            assert(round.moves_b.hashed == hashed, ActionErrors::MOVES_HASH_MISMATCH);
            round.moves_b.initialize(salt, moves);
        }

        // incomplete Round, update only
        if (round.moves_a.salt == 0 || round.moves_b.salt == 0) {
            store.set_round(@round);
            return challenge;
        }

        // Process round when both actions are revealed
        let table: TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let progress: DuelProgress = game_loop(store.world, table.deck_type, ref round);
        store.set_round(@round);

        if (progress.winner == 0) {
            end_challenge(ref challenge, ChallengeState::Draw, 0);
        } else {
            end_challenge(ref challenge, ChallengeState::Resolved, progress.winner);
        }

        // update Challenge
        utils::set_challenge(store, challenge);

        (challenge)
    }


    //---------------------------------------
    // Decide who wins a round, or go to next
    //

    // testable loop
    fn game_loop(world: IWorldDispatcher, deck_type: DeckType, ref round: Round) -> DuelProgress {
        // let _table_type: TableType = store.get_table_config_entity(challenge.table_id).table_type;

        let env_deck: Span<EnvCard> = EnvCardTrait::get_full_deck().span();

        let mut dice: Dice = DiceTrait::new(@world, round.make_seed(), env_deck.len());
        
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
        // apply cards
        //
        hand_a.card_tactics.apply_points(ref state_a, ref state_b, 1, EnvCard::None);
        hand_b.card_tactics.apply_points(ref state_b, ref state_a, 1, EnvCard::None);
        hand_a.card_blades.apply_points(ref state_a, ref state_b);
        hand_b.card_blades.apply_points(ref state_b, ref state_a);


        //------------------------------------------------------
        // Pistols round
        //

        let mut dice_fire_a: u8 = 0;
        let mut dice_fire_b: u8 = 0;

        let mut step_number: u8 = 1;
        while (step_number <= 10) {
            let pace: PacesCard = step_number.into();
            round.final_blow = DuelistDrawnCard::Fire(pace);
            // println!("Pace [{}] A:{} B:{}", step_number, self.moves_a.card_fire.as_felt(), self.moves_b.card_fire.as_felt());

            // draw env card
            let (card_env, dice_env): (EnvCard, u8) = draw_env_card(env_deck, pace, ref dice);

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
            if (dice_fire_a > 0 && dice_fire_b > 0) { break; }
            
            step_number += 1;
        };
 

        //------------------------------------------------------
        // Blades Round
        //
        if (state_a.health > 0 &&
            state_b.health > 0 &&
            (hand_a.card_blades != BladesCard::None || hand_b.card_blades != BladesCard::None)
        ) {
            blades(hand_a.card_blades, hand_b.card_blades, ref state_a, ref state_b);
            let card_a = DuelistDrawnCard::Blades(hand_a.card_blades);
            let card_b = DuelistDrawnCard::Blades(hand_b.card_blades);
            steps.append(DuelStep {
                pace: PacesCard::None,
                card_env: EnvCard::None,
                dice_env: 0,
                specials_a: Default::default(),
                specials_b: Default::default(),
                card_a,
                card_b,
                state_a,
                state_b,
            });
            round.final_blow =
                if (card_a == DuelistDrawnCard::Blades(BladesCard::Seppuku)) {card_a}
                else if (card_b == DuelistDrawnCard::Blades(BladesCard::Seppuku)) {card_b}
                else if (state_a.health > 0) {card_a}
                else {card_b};
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
            if (round.state_a.health > 0 && round.state_b.health == 0) {1}
            else if (round.state_a.health == 0 && round.state_b.health > 0) {2}
            else {0};
        
        (DuelProgress {
            // results
            steps: steps.span(),
            winner,
            hand_a,
            hand_b,
        })
    }

    fn end_challenge(ref challenge: Challenge, state: ChallengeState, winner: u8) {
        challenge.state = state;
        challenge.winner = winner;
        challenge.timestamp_end = get_block_timestamp();
    }


    fn draw_env_card(env_deck: Span<EnvCard>, pace: PacesCard, ref dice: Dice) -> (EnvCard, u8) {
        let salt: felt252 = pace.env_salt();
        let dice: u8 = dice.shuffle_draw(salt);
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
        if (state_a.health > 0 && state_b.health > 0) {
            let (died_a, died_b): (bool, bool) = blades_a.clash(blades_b);
            if (died_a) {
                state_a.health = 0;
            }
            if (died_b) {
                state_b.health = 0;
            }
        }
    }
}

