
mod shooter {
    use debug::PrintTrait;
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::actions::{Errors};
    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::libs::utils;
    use pistols::models::challenge::{Challenge, Round, RoundTrait, RoundEntity, Shot, ShotTrait, PlayerState};
    use pistols::models::duelist::{Duelist, Score};
    use pistols::models::table::{TableConfig, TableConfigEntity, TableType};
    use pistols::types::constants::{CONST};
    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::round_state::{RoundState};
    use pistols::types::cards::hand::{PlayerHand, PlayerHandTrait, PacesCard, PacesCardTrait, EnvCard, EnvCardTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelPace};
    use pistols::types::misc::{Boolean};
    use pistols::utils::math::{MathU8, MathU16};
    use pistols::libs::store::{Store, StoreTrait};

    fn _assert_challenge(store: Store, caller: ContractAddress, duelist_id: u128, duel_id: u128, round_number: u8) -> (Challenge, u8) {
        let challenge: Challenge = store.get_challenge(duel_id);
        // Assert Duelist is in the challenge
        let duelist_number: u8 =
            if (challenge.duelist_id_a == duelist_id) { 1 }
            else if (challenge.duelist_id_b == duelist_id) { 2 }
            else { 0 };
        assert(duelist_number != 0, Errors::NOT_YOUR_DUELIST);

        let duelist_address: ContractAddress =
            if (duelist_number == 1) { challenge.address_a }
            else { challenge.address_b };
        assert(caller == duelist_address, Errors::NOT_YOUR_CHALLENGE);

        // Correct Challenge state
        assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
        assert(challenge.round_number == round_number, Errors::INVALID_ROUND_NUMBER);
        assert(round_number <= CONST::ROUND_COUNT, Errors::INVALID_ROUND_NUMBER);
        
        (challenge, duelist_number)
    }


    //-----------------------------------
    // Commit
    //
    fn commit_moves(store: Store, duelist_id: u128, duel_id: u128, round_number: u8, hash: u128) {
        // Assert correct Challenge
        let (_challenge, duelist_number) = _assert_challenge(store, starknet::get_caller_address(), duelist_id, duel_id, round_number);

        // Assert correct Round
        let mut round: RoundEntity = store.get_round_entity(duel_id, round_number);
        assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

        // Validate action hash

        // Store hash
        if (duelist_number == 1) {
            assert(round.shot_a.hash == 0, Errors::ALREADY_COMMITTED);
            round.shot_a.hash = hash;
        } else if (duelist_number == 2) {
            assert(round.shot_b.hash == 0, Errors::ALREADY_COMMITTED);
            round.shot_b.hash = hash;
        }

        // Finished commit
        if (round.shot_a.hash != 0 && round.shot_b.hash != 0) {
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
        assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

        // Validate salt
        // TODO: verify salt as a signature
        assert(salt != 0, Errors::INVALID_SALT);

        // Validate action hash
        assert(moves.len() >= 2 && moves.len() <= 4, Errors::INVALID_MOVES_COUNT);
        let hash: u128 = utils::make_moves_hash(salt, moves);

        // since the hash was validated
        // we should not validate the actual moves
        // all we can do is skip if they are invalid

        // Validate moves hash
        if (duelist_number == 1) {
            assert(round.shot_a.card_1 == 0, Errors::ALREADY_REVEALED);
            assert(round.shot_a.hash == hash, Errors::MOVES_HASH_MISMATCH);
            round.shot_a.initialize(salt, moves);
        } else if (duelist_number == 2) {
            assert(round.shot_b.card_1 == 0, Errors::ALREADY_REVEALED);
            assert(round.shot_b.hash == hash, Errors::MOVES_HASH_MISMATCH);
            round.shot_b.initialize(salt, moves);
        }

        // incomplete Round, update only
        if (round.shot_a.salt == 0 || round.shot_b.salt == 0) {
            store.set_round(@round);
            return challenge;
        }

        // Process round when both actions are revealed
        let progress: DuelProgress = game_loop(store, challenge, round);

        if (progress.winner == 0) {
            end_challenge(ref challenge, ChallengeState::Draw, 0);
        } else {
            end_challenge(ref challenge, ChallengeState::Resolved, progress.winner);
        }

        // update Round
        let final_pace: DuelPace = *progress.paces[progress.paces.len() - 1];
        round.shot_a.state_final = final_pace.state_a;
        round.shot_b.state_final = final_pace.state_b;
        round.shot_a.win = if (final_pace.state_b.health == 0) {1} else {0};
        round.shot_b.win = if (final_pace.state_a.health == 0) {1} else {0};
        round.state = RoundState::Finished;
        store.set_round(@round);

        // update Challenge
        utils::set_challenge(store, challenge);

        (challenge)
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn game_loop(store: Store, challenge: Challenge, round: Round) -> DuelProgress {
        // let _table_type: TableType = store.get_table_config_entity(challenge.table_id).table_type;
        
        let seed: felt252 = round.make_seed();
        let mut dice: Dice = DiceTrait::new(@store.world, seed);

        let hand_a: PlayerHand = round.shot_a.as_hand();
        let hand_b: PlayerHand = round.shot_b.as_hand();

        let mut env_state_a: PlayerState = round.shot_a.state_start;
        let mut env_state_b: PlayerState = round.shot_b.state_start;





        // TODO: apply tactics card
        // TODO: apply blades cards
        // card_tactics.apply(self.shot_a);
        // card_tactics.apply(self.shot_b);


        let mut duel_paces: Array<DuelPace> = array![];
        let mut win_a: Boolean = Boolean::Undefined;
        let mut win_b: Boolean = Boolean::Undefined;

        //
        // Pistols round
        //
        let mut pace_number: u8 = 1;
        while (pace_number <= 10) {
            let pace: PacesCard = pace_number.into();
            // println!("Pace [{}] A:{} B:{}", pace_number, self.shot_a.card_paces.as_felt(), self.shot_b.card_paces.as_felt());

            let card_env: EnvCard = EnvCard::None;
            let mut dice_env: u8 = 0;

            // TODO: draw env cards
            // TODO: apply env card to shots
            // update shot.state_final.chances
            // update shot.state_final.damage

            let mut state_a: PlayerState = env_state_a;
            let mut state_b: PlayerState = env_state_b;

            //
            // Shoot!
            // will chance state_a and state_b
            if (hand_a.card_paces == pace) {
                win_a = shoot(hand_a.card_paces, hand_b.card_dodge, ref state_a, ref state_b, ref dice, 'shoot_a');
            }
            if (hand_b.card_paces == pace) {
                win_b = shoot(hand_b.card_paces, hand_a.card_dodge, ref state_b, ref state_a, ref dice, 'shoot_b');
            }

            // save step
            duel_paces.append(DuelPace {
                pace,
                card_env,
                dice_env,
                card_a: hand_a.draw_card(pace),
                card_b: hand_b.draw_card(pace),
                state_a,
                state_b,
            });

            // break if there's a winner
            if (win_a == Boolean::True || win_b == Boolean::True) {
                break;
            }
            // both dices rolled, no winner, go to blades
            if (win_a != Boolean::Undefined && win_b != Boolean::Undefined) {
                break;
            }

            pace_number += 1;
        };
 

        //
        // Blades Round
        //
        if (win_a != Boolean::True && win_b != Boolean::True) {

            //
            //TODO: duel blades
            //

        }

        let winner: u8 =
            if (win_a == Boolean::True && win_b != Boolean::True) {1}
            else if (win_b == Boolean::True && win_a != Boolean::True) {2}
            else {0};

        (DuelProgress {
            // results
            paces: duel_paces.span(),
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

    //-------------------------
    // Strikes
    //

    // returns true if executed
    fn shoot(paces_shoot: PacesCard, paces_dodge: PacesCard, ref state_self: PlayerState, ref state_other: PlayerState, ref dice: Dice, salt: felt252) -> Boolean {
        if (paces_shoot == paces_dodge) {
            state_self.chances = 0;
        }
        let (dice, hit) = dice.decide(salt, 100, state_self.chances);
        state_self.dice_crit = dice;
        if (hit) {
            state_other.health = MathU8::sub(state_other.health, state_self.damage);
        }
// println!("dice {} / {} d/h: {} / {}", state_self.dice_crit, state_self.chances, state_self.damage, state_other.health);
        if (state_other.health == 0) {
            (Boolean::True)
        } else {
            (Boolean::False)
        }
    }

}

