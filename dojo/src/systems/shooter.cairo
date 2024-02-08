
mod shooter {
    use core::option::OptionTrait;
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::{utils};
    use pistols::models::models::{Challenge, Round, Move};
    use pistols::types::constants::{constants};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::round::{RoundState};
    use pistols::types::steps::{Steps};
    use pistols::types::blades::{Blades};
    use pistols::utils::math::{MathU8};

    fn _assert_challenge(world: IWorldDispatcher, caller: ContractAddress, duel_id: u128, round_number: u8) -> (Challenge, felt252) {
        let challenge: Challenge = get!(world, duel_id, Challenge);

        // Assert Duelist is in the challenge
        let duelist: felt252 = if (challenge.duelist_a == caller) { 'a' } else if (challenge.duelist_b == caller) { 'b' } else { 0 };
        assert(duelist == 'a' || duelist == 'b', 'Not your Challenge!');

        // Correct Challenge state
        assert(challenge.state == ChallengeState::InProgress.into(), 'Challenge is not In Progress');
        assert(challenge.round_number == round_number, 'Bad Round number');
        
        (challenge, duelist)
    }

    fn _assert_round_move(round_number: u8, move: u8) {
        if (round_number == 1) {
            let steps: Option<Steps> = move.try_into();
            assert(steps != Option::None, 'Bad step move');
        } else if (round_number == 2) {
            let blade: Option<Blades> = move.try_into();
            assert(blade != Option::None, 'Bad blade move');
        }
    }


    //-----------------------------------
    // Commit
    //
    fn commit_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, hash: felt252) {
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
        if (round.duelist_a.hash != 0 && round.duelist_b.hash != 0) {
            round.state = RoundState::Reveal.into();
        }

        set!(world, (round));
    }

    //-----------------------------------
    // Reveal
    //
    fn reveal_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, salt: u64, move: u8) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (mut challenge, duelist) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Reveal.into(), 'Round not in Reveal');

        // Validate move hash
        let hash: felt252 = utils::make_move_hash(salt, move);

        // validate move
        assert(move > 0, 'Invalid move zero');
        // will panic if invalid move
        _assert_round_move(round_number, move);

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

        // Finishes round if both moves are revealed
        if (round.duelist_a.move > 0 && round.duelist_b.move > 0) {
            finish_round(ref challenge, ref round);
            // update Round first, Challenge may need it
            set!(world, (round));
            // update Challenge
            utils::set_challenge(world, challenge);
        } else {
            // update Round only
            set!(world, (round));
        }
    }

    //-----------------------------------
    // Decide who wins a round
    //
    fn finish_round(ref challenge: Challenge, ref round: Round) {
        // get damage for each player
        if (round.round_number == 1) {
            let (a, b) = pistols_shootout(round);
            round.duelist_a.damage = a;
            round.duelist_b.damage = b;
        } else if (round.round_number == 2) {
            let (a, b) = blades_clash(round);
            round.duelist_a.damage = a;
            round.duelist_b.damage = b;
        }

        // apply damage
        round.duelist_a.health -= MathU8::min(round.duelist_a.damage, round.duelist_a.health);
        round.duelist_b.health -= MathU8::min(round.duelist_b.damage, round.duelist_b.health);

        // decide results
        if (round.duelist_a.health == 0 && round.duelist_b.health == 0) {
            // both dead!
            challenge.state = ChallengeState::Draw.into();
            challenge.timestamp_end = get_block_timestamp();
        } else if (round.duelist_a.health == 0) {
            // A is dead!
            challenge.state = ChallengeState::Resolved.into();
            challenge.winner = 2;
            challenge.timestamp_end = get_block_timestamp();
        } else if (round.duelist_b.health == 0) {
            // B is dead!
            challenge.state = ChallengeState::Resolved.into();
            challenge.winner = 1;
            challenge.timestamp_end = get_block_timestamp();
        } else {
            // both alive!
            if (challenge.round_number == constants::ROUND_COUNT) {
                // end in a Draw
                challenge.state = ChallengeState::Draw.into();
                challenge.timestamp_end = get_block_timestamp();
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
    fn pistols_shootout(round: Round) -> (u8, u8) {
        let mut damage_a: u8 = 0;
        let mut damage_b: u8 = 0;

        let steps_a: u8 = round.duelist_a.move;
        let steps_b: u8 = round.duelist_b.move;

        if (steps_a == steps_b) {
            // both duelists shoot together
            damage_a = shoot_damage('shoot_b', round, steps_b);
            damage_b = shoot_damage('shoot_a', round, steps_a);
        } else if (steps_a < steps_b) {
            // A shoots first
            damage_b = shoot_damage('shoot_a', round, steps_a);
            // if not dead, B can shoot
            if (damage_b < constants::FULL_HEALTH) {
                damage_a = shoot_damage('shoot_b', round, steps_b);
            }
        } else {
            // B shoots first
            damage_a = shoot_damage('shoot_b', round, steps_b);
            // if not dead, A can shoot
            if (damage_a < constants::FULL_HEALTH) {
                damage_b = shoot_damage('shoot_a', round, steps_a);
            }
        }

        (damage_a, damage_b)
    }

    fn shoot_damage(seed: felt252, round: Round, steps: u8) -> u8 {
        // dice 1: did the bullet hit the other player?
        // at step 1: HIT chance is 80%
        // at step 10: HIT chance is 20%
        let percentage: u128 = MathU8::map(steps, 1, 10, constants::CHANCE_HIT_STEP_1, constants::CHANCE_HIT_STEP_10).into();
        let hit: bool = throw_dice(seed, round, percentage, 100);
        if (!hit) {
            return 0;
        }
        // dice 2: if the bullet HIT the other player, what's the damage?
        // at step 1: KILL chance is 10%
        // at step 10: KILL chance is 100%
        let percentage: u128 = MathU8::map(steps, 1, 10, constants::CHANCE_KILL_STEP_1, constants::CHANCE_KILL_STEP_10).into();
        let killed: bool = throw_dice(seed * 2, round, percentage, 100);
        (if (killed) { constants::FULL_HEALTH } else { constants::HALF_HEALTH })
    }


    //-----------------------------------
    // Blades duel
    //
    // Light - hits for half damage, early
    // Heavy - hits for full damge, late
    // Block - blocks light but not heavy, does no damage
    //
    // So...
    // light vs light = both players take 1 damage
    // Heavy vs heavy = both players die
    // Block vs block = nothing
    // Light vs block = nothing
    // Light vs heavy = light hits first, if heavy lord survives, heavy hits second (and kills the other lord)
    // Heavy vs block = blocking lord dies
    //
    fn blades_clash(round: Round) -> (u8, u8) {
        let mut damage_a: u8 = 0;
        let mut damage_b: u8 = 0;

        let blades_a: Blades = round.duelist_a.move.try_into().unwrap();
        let blades_b: Blades = round.duelist_b.move.try_into().unwrap();

        if (blades_a == Blades::Light) {
            if (blades_b == Blades::Light) {
                damage_a = constants::HALF_HEALTH;
                damage_b = constants::HALF_HEALTH;
            } else if (blades_b == Blades::Heavy) {
                damage_b = constants::HALF_HEALTH;
                // if B survives, A is hit
                if (damage_b < round.duelist_b.health) {
                    damage_a = constants::FULL_HEALTH;
                }
            } else if (blades_b == Blades::Block) {
                // Nothing (successful block)
            }
        } else if (blades_a == Blades::Heavy) {
            if (blades_b == Blades::Heavy) {
                damage_a = constants::FULL_HEALTH;
                damage_b = constants::FULL_HEALTH;
            } else if (blades_b == Blades::Light) {
                damage_a = constants::HALF_HEALTH;
                // if A survives, B is hit
                if (damage_a < round.duelist_a.health) {
                    damage_b = constants::FULL_HEALTH;
                }
            } else if (blades_b == Blades::Block) {
                damage_b = constants::FULL_HEALTH;
            }
        } else if (blades_a == Blades::Block) {
            if (blades_b == Blades::Block) {
                // Nothing (successful block)
            } else if (blades_b == Blades::Light) {
                // Nothing (successful block)
            } else if (blades_b == Blades::Heavy) {
                damage_a = constants::FULL_HEALTH;
            }
        }

        (damage_a, damage_b)
    }


    //-----------------------------------
    // Randomizer
    //
    fn throw_dice(seed: felt252, round: Round, limit: u128, faces: u128) -> bool {
        let salt: u64 = (round.duelist_a.salt ^ round.duelist_b.salt);
        (utils::throw_dice(seed, salt.into(), limit, faces))
    }

}
