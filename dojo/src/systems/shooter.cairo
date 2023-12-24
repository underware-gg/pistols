
mod shooter {
    use core::option::OptionTrait;
use core::traits::TryInto;
use starknet::{ContractAddress};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::{utils};
    use pistols::models::models::{Challenge, Round, Move};
    use pistols::types::constants::{constants};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::round::{RoundState};
    use pistols::types::steps::{Steps};
    use pistols::types::blades::{Blades};
    use pistols::utils::math::{MathU8};

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    fn _assert_challenge(world: IWorldDispatcher, caller: ContractAddress, duel_id: u128, round_number: u8) -> (Challenge, felt252) {
        let challenge: Challenge = get!(world, duel_id, Challenge);

        // Assert Duelist is in the challenge
        let duelist: felt252 = if (challenge.duelist_a == caller) { 'a' } else if (challenge.duelist_b == caller) { 'b' } else { 0 };
        assert(duelist == 'a' || duelist == 'b', 'Not your Challenge!');

        // Correct Challenge state
        assert(challenge.state == ChallengeState::InProgress.into(), 'Challenge is not In Progress');
        assert(challenge.round_number == round_number, 'Wrong Round number');
        
        (challenge, duelist)
    }

    fn _make_move_hash(salt: u64, move: u8) -> u64 {
        (pedersen(salt.into(), move.into()).try_into().unwrap())
    }

    fn commit_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, hash: u64) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (challenge, duelist) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Commit.into(), 'Round not in Commit');

        // Validate move hash

        // Store hash
        if (duelist == 'a') {
            assert(round.duelist_a.hash == 0, 'Already committed');
            round.duelist_a.hash = hash;
        } else if (duelist == 'b') {
            assert(round.duelist_b.hash == 0, 'Already committed');
            round.duelist_b.hash = hash;
        }

        // Finished commit
        if (round.duelist_a.hash > 0 && round.duelist_b.hash > 0) {
            round.state = RoundState::Reveal.into();
        }

        set!(world, (round));
    }

    fn reveal_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, salt: u64, move: u8) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (mut challenge, duelist) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Reveal.into(), 'Round not in Reveal');

        // Validate move hash
        let hash: u64 = _make_move_hash(salt, move);

        // validate move
        assert(move > 0, 'Invalid move zero');
        // will panic if invalid move
        validate_round_move(round_number, move);

        // Store move
        if (duelist == 'a') {
            assert(round.duelist_a.move == 0, 'Already revealed');
            assert(round.duelist_a.hash == hash, 'Move does not match commitment');
            round.duelist_a.salt = salt;
            round.duelist_a.move = move;
        } else if (duelist == 'b') {
            assert(round.duelist_b.move == 0, 'Already revealed');
            assert(round.duelist_b.hash == hash, 'Move does not match commitment');
            round.duelist_b.salt = salt;
            round.duelist_b.move = move;
        }

        // Finished round
        if (round.duelist_a.move > 0 && round.duelist_b.move > 0) {
            finish_round(ref challenge, ref round);
        }

        set!(world, (challenge, round));

        utils::set_challenge(world, challenge);
    }

    //-----------------------------------
    // Validate if single move is valid
    //
    fn validate_round_move(round_number: u8, move: u8) {
        if (round_number == 1) {
            let step_count: Steps = move.try_into().unwrap();
        } else if (round_number == 2) {
            let blade: Blades = move.try_into().unwrap();
        }
    }

    //-----------------------------------
    // Decide who wins a round
    //
    fn finish_round(ref challenge: Challenge, ref round: Round) {
        let mut winner = utils::zero_address();

        // get hit for each player
        if (round.round_number == 1) {
            let (a, b) = pistols_shootout(ref round);
            round.duelist_a.hit = a;
            round.duelist_b.hit = b;
        } else if (round.round_number == 2) {
            let (a, b) = blades_clash(ref round);
            round.duelist_a.hit = a;
            round.duelist_b.hit = b;
        }

        // apply hit
        round.duelist_a.health -= MathU8::min(round.duelist_a.hit, round.duelist_a.health);
        round.duelist_b.health -= MathU8::min(round.duelist_b.hit, round.duelist_b.health);

        // decide results
        if (round.duelist_a.health == 0 && round.duelist_b.health == 0) {
            // both dead!
            challenge.state = ChallengeState::Draw.into();
        } else if (round.duelist_a.health == 0) {
            // A is dead!
            challenge.state = ChallengeState::Resolved.into();
            challenge.winner = challenge.duelist_b;
        } else if (round.duelist_b.health == 0) {
            // B is dead!
            challenge.state = ChallengeState::Resolved.into();
            challenge.winner = challenge.duelist_a;
        } else {
            // both alive!
            if (challenge.round_number == constants::ROUND_COUNT) {
                // end in a Draw
                challenge.state = ChallengeState::Draw.into();
            } else {
                // next round
                challenge.round_number += 1;
            }
        }

        // Finish round
        round.state = RoundState::Finished.into();
    }

    //-----------------------------------
    // Pistols duel
    //
    fn pistols_shootout(ref round: Round) -> (u8, u8) {

        (0, 0)
    }

    //-----------------------------------
    // Blades duel
    //
    fn blades_clash(ref round: Round) -> (u8, u8) {

        (0, 0)
    }

}
