
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
    use pistols::types::blades::{Blades, BLADES};
    use pistols::utils::math::{MathU8};

    fn _assert_challenge(world: IWorldDispatcher, caller: ContractAddress, duel_id: u128, round_number: u8) -> (Challenge, u8) {
        let challenge: Challenge = get!(world, duel_id, Challenge);

        // Assert Duelist is in the challenge
        let duelist_number: u8 = if (challenge.duelist_a == caller) { 1 } else if (challenge.duelist_b == caller) { 2 } else { 0 };
        assert(duelist_number == 1 || duelist_number == 2, 'Not your Challenge!');

        // Correct Challenge state
        assert(challenge.state == ChallengeState::InProgress.into(), 'Challenge is not In Progress');
        assert(challenge.round_number == round_number, 'Bad Round number');
        
        (challenge, duelist_number)
    }


    //-----------------------------------
    // Commit
    //
    fn commit_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, hash: felt252) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (challenge, duelist_number) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Commit.into(), 'Round not in Commit');

        // Validate move hash

        // Store hash
        if (duelist_number == 1) {
            assert(round.duelist_a.hash == 0, 'Already committed');
            round.duelist_a.hash = hash;
        } else if (duelist_number == 2) {
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
    fn reveal_move(world: IWorldDispatcher, duel_id: u128, round_number: u8, salt: u64, mut move: u8) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (mut challenge, duelist_number) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Reveal.into(), 'Round not in Reveal');

        // Validate move hash
        let hash: felt252 = utils::make_move_hash(salt, move);

        // validate move
        // if invalid, set as 0 (idle, will skip round)
        move = validated_move(round_number, move);

        // Store move
        if (duelist_number == 1) {
            assert(round.duelist_a.move == 0, 'Already revealed');
            assert(round.duelist_a.hash == hash, 'Move does not match commitment');
            round.duelist_a.salt = salt;
            round.duelist_a.move = move;
        } else if (duelist_number == 2) {
            assert(round.duelist_b.move == 0, 'Already revealed');
            assert(round.duelist_b.hash == hash, 'Move does not match commitment');
            round.duelist_b.salt = salt;
            round.duelist_b.move = move;
        }

        // Finishes round if both moves are revealed
        if (round.duelist_a.salt > 0 && round.duelist_b.salt > 0) {
            process_round(world, ref challenge, ref round);
            // update Round first, Challenge may need it
            set!(world, (round));
            // update Challenge
            utils::set_challenge(world, challenge);
        } else {
            // update Round only
            set!(world, (round));
        }
    }

    fn validated_move(round_number: u8, move: u8) -> u8 {
        if (round_number == 1) {
            return MathU8::clamp(move, 1, 10);
        } else if (round_number == 2) {
            let blade: Option<Blades> = move.try_into();
            if (blade == Option::None) {
                return (BLADES::IDLE);
            }
        }
        (move)
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_round(world: IWorldDispatcher, ref challenge: Challenge, ref round: Round) {
        // get damage for each player
        if (round.round_number == 1) {
            pistols_shootout(world, challenge, ref round);
        } else {
            let (damage_a, damage_b) = blades_clash(round);
            round.duelist_a.damage = damage_a;
            round.duelist_b.damage = damage_b;
            // apply damage
            // TODO: move to blades_clash()
            apply_damage(ref round.duelist_a);
            apply_damage(ref round.duelist_b);
        }

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
    fn pistols_shootout(world: IWorldDispatcher, challenge: Challenge, ref round: Round) {
        let steps_a: u8 = round.duelist_a.move;
        let steps_b: u8 = round.duelist_b.move;

        if (steps_a == steps_b) {
            // both shoot together
            shoot_apply_damage(world, 'shoot_a', round, challenge.duelist_a, ref round.duelist_a, ref round.duelist_b);
            shoot_apply_damage(world, 'shoot_b', round, challenge.duelist_b, ref round.duelist_b, ref round.duelist_a);
        } else if (steps_a < steps_b) {
            // A shoots first
            shoot_apply_damage(world, 'shoot_a', round, challenge.duelist_a, ref round.duelist_a, ref round.duelist_b);
            // if B not dead, shoot
            if (round.duelist_b.health > 0) {
                shoot_apply_damage(world, 'shoot_b', round, challenge.duelist_b, ref round.duelist_b, ref round.duelist_a);
            }
        } else {
            // B shoots first
            shoot_apply_damage(world, 'shoot_b', round, challenge.duelist_b, ref round.duelist_b, ref round.duelist_a);
            // if A not dead, shoot
            if (round.duelist_a.health > 0) {
                shoot_apply_damage(world, 'shoot_a', round, challenge.duelist_a, ref round.duelist_a, ref round.duelist_b);
            }
        }
    }

    fn shoot_apply_damage(world: IWorldDispatcher, seed: felt252, round: Round, duelist: ContractAddress, ref attacker: Move, ref defender: Move) {
        let steps: u8 = attacker.move;
        // dice 1: did the bullet hit the other player?
        // at step 1: HIT chance is 80%
        // at step 10: HIT chance is 20%
        attacker.dice1 = throw_dice(seed, round, 100);
        let chances: u8 = utils::get_pistols_hit_chance(world, duelist, steps);
        if (attacker.dice1 <= chances) {
            // dice 2: if the bullet HIT the other player, what's the damage?
            // at step 1: KILL chance is 10%
            // at step 10: KILL chance is 100%
            attacker.dice2 = throw_dice(seed * 2, round, 100);
            let chances: u8 = utils::get_pistols_kill_chance(world, duelist, steps);
            if (attacker.dice2 <= chances) {
                defender.damage = constants::FULL_HEALTH;
            } else {
                defender.damage = constants::SINGLE_DAMAGE;
            }
            apply_damage(ref defender);
        }
    }

    fn apply_damage(ref move: Move) {
        move.health = MathU8::sub(move.health, MathU8::sub(move.damage, move.block));
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
                damage_a = constants::SINGLE_DAMAGE;
                damage_b = constants::SINGLE_DAMAGE;
            } else if (blades_b == Blades::Heavy) {
                damage_b = constants::SINGLE_DAMAGE;
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
                damage_a = constants::SINGLE_DAMAGE;
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
    fn throw_dice(seed: felt252, round: Round, faces: u128) -> u8 {
        let salt: u64 = utils::make_round_salt(round);
        (utils::throw_dice(seed, salt.into(), faces).try_into().unwrap())
    }
    fn check_dice(seed: felt252, round: Round, faces: u128, limit: u128) -> bool {
        let salt: u64 = utils::make_round_salt(round);
        (utils::check_dice(seed, salt.into(), faces, limit))
    }

}
