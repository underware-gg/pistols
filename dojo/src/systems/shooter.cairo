
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

    // Validates a move and returns it
    // Pistols: if invalid, clamps between 1 and 10
    // Blades: if invalid, returns Blades::Idle
    fn validated_move(round_number: u8, move: u8) -> u8 {
        if (round_number == 1) {
            return MathU8::clamp(move, 1, 10); // valid or not, clamp in steps
        } else if (round_number == 2) {
            let blade: Option<Blades> = move.try_into();
            if (blade != Option::None) {
                return (move); // valid move
            }
        }
        (0) // invalid move
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_round(world: IWorldDispatcher, ref challenge: Challenge, ref round: Round) {
        // get damage for each player
        if (round.round_number == 1) {
            pistols_shootout(world, challenge, ref round);
        } else {
            blades_clash(world, challenge, ref round);
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
            shoot_apply_damage(world, 'shoot_a', challenge.duelist_a, round, ref round.duelist_a, ref round.duelist_b);
            shoot_apply_damage(world, 'shoot_b', challenge.duelist_b, round, ref round.duelist_b, ref round.duelist_a);
        } else if (steps_a < steps_b) {
            // A shoots first
            shoot_apply_damage(world, 'shoot_a', challenge.duelist_a, round, ref round.duelist_a, ref round.duelist_b);
            // if B not dead, shoot
            if (round.duelist_b.health > 0) {
                shoot_apply_damage(world, 'shoot_b', challenge.duelist_b, round, ref round.duelist_b, ref round.duelist_a);
            }
        } else {
            // B shoots first
            shoot_apply_damage(world, 'shoot_b', challenge.duelist_b, round, ref round.duelist_b, ref round.duelist_a);
            // if A not dead, shoot
            if (round.duelist_a.health > 0) {
                shoot_apply_damage(world, 'shoot_a', challenge.duelist_a, round, ref round.duelist_a, ref round.duelist_b);
            }
        }
    }

    fn shoot_apply_damage(world: IWorldDispatcher, seed: felt252, duelist: ContractAddress, round: Round, ref attack: Move, ref defense: Move) {
        let steps: u8 = attack.move;
        // dice 1: execution!
        attack.dice_crit = throw_dice(seed, round, 100);
        let kill_chance: u8 = utils::get_pistols_kill_chance(world, duelist, steps);
        if (attack.dice_crit <= kill_chance) {
            defense.damage = constants::FULL_HEALTH;
            apply_damage(ref defense);
        } else {
            // dice 2: miss or hit + damage
            // ex: chance 60%: 1..30 = double, 31..60 = single, 61..100 = miss
            attack.dice_hit = throw_dice(seed * 2, round, 100);
            let hit_chance: u8 = utils::get_pistols_hit_chance(world, duelist, steps);
            if (attack.dice_hit <= hit_chance) {
                defense.damage = if (attack.dice_hit <= hit_chance/2) { (constants::DOUBLE_DAMAGE) } else { (constants::SINGLE_DAMAGE) };
                apply_damage(ref defense);
            }
        }
    }

    fn apply_damage(ref move: Move) {
        move.health = MathU8::sub(move.health, MathU8::sub(move.damage, move.block));
    }


    //-----------------------------------
    // Blades duel
    //
    // Heavy - Execute with 3 damage or inclict 2 damage
    // Light - hits 1 damage, early
    // Block - blocks 1 damage
    //
    fn blades_clash(world: IWorldDispatcher, challenge: Challenge, ref round: Round) {

        thow_blades_dices(world, 'clash_a', challenge.duelist_a, round, ref round.duelist_a, ref round.duelist_b);
        thow_blades_dices(world, 'clash_b', challenge.duelist_b, round, ref round.duelist_b, ref round.duelist_a);

        // Execution executes first (Heavy)
        if (round.duelist_a.damage == constants::FULL_HEALTH || round.duelist_b.damage == constants::FULL_HEALTH) {
            if (round.duelist_a.damage == constants::FULL_HEALTH) {
                round.duelist_a.block = 0; // execution overrides block
                apply_damage(ref round.duelist_a);
            }
            if (round.duelist_b.damage == constants::FULL_HEALTH) {
                round.duelist_b.block = 0; // execution overrides block
                apply_damage(ref round.duelist_b);
            }
            return ();
        }

        let blade_a: Blades = round.duelist_a.move.try_into().unwrap();
        let blade_b: Blades = round.duelist_b.move.try_into().unwrap();

        // Light strikes before Heavy
        if (blade_a == Blades::Light && blade_b == Blades::Heavy) {
            light_vs_heavy_apply_damage(ref round.duelist_a, ref round.duelist_b)
        } else if (blade_b == Blades::Light && blade_a == Blades::Heavy) {
            light_vs_heavy_apply_damage(ref round.duelist_b, ref round.duelist_a)
        } else {
            // clash at same time
            apply_damage(ref round.duelist_a);
            apply_damage(ref round.duelist_b);
        }
    }

    fn light_vs_heavy_apply_damage(ref attack: Move, ref defense: Move) {
        // attack!
        apply_damage(ref defense);
        if (defense.health == 0) {
            // defender is dead! no damage to attacker
            attack.damage = 0;
        } else {
            // defender is alive! strike attacker...
            apply_damage(ref attack);
        }
    }

    fn thow_blades_dices(world: IWorldDispatcher, seed: felt252, duelist: ContractAddress, round: Round, ref attack: Move, ref defense: Move) {
        let blade: Blades = attack.move.try_into().unwrap();
        if (blade != Blades::Idle) {
            // dice 1: execution or double damage/block
            attack.dice_crit = throw_dice(seed, round, 100);
            let kill_chance: u8 = utils::get_blades_kill_chance(world, duelist, attack.health, blade);
            if (attack.dice_hit <= kill_chance) {
                if (blade == Blades::Heavy) {
                    defense.damage = constants::FULL_HEALTH;
                } else if (blade == Blades::Light) {
                    defense.damage = constants::DOUBLE_DAMAGE;
                } else if (blade == Blades::Block) {
                    attack.block = constants::DOUBLE_DAMAGE;
                }
            } else {
                // dice 2: miss or normal damage
                attack.dice_hit = throw_dice(seed * 2, round, 100);
                let hit_chance: u8 = utils::get_blades_hit_chance(world, duelist, attack.health, blade);
                if (attack.dice_hit <= hit_chance) {
                    if (blade == Blades::Heavy) {
                        defense.damage = constants::DOUBLE_DAMAGE;
                    } else if (blade == Blades::Light) {
                        defense.damage = constants::SINGLE_DAMAGE;
                    } else if (blade == Blades::Block) {
                        attack.block = constants::SINGLE_DAMAGE;
                    }
                }
            }
        }
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






//------------------------------------------------------
// Unit tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};

    use pistols::systems::shooter::{shooter};
    use pistols::models::models::{Move};
    use pistols::types::blades::{Blades, BLADES};

    #[test]
    #[available_gas(1_000_000)]
    fn test_validated_move() {
        assert(shooter::validated_move(1, 0) == 1, '1_0');
        assert(shooter::validated_move(1, 1) == 1, '1_1');
        assert(shooter::validated_move(1, 10) == 10, '1_10');
        assert(shooter::validated_move(1, 11) == 10, '1_11');
        assert(shooter::validated_move(2, BLADES::IDLE) == BLADES::IDLE, '2_IDLE');
        assert(shooter::validated_move(2, BLADES::HEAVY) == BLADES::HEAVY, '2_HEAVY');
        assert(shooter::validated_move(2, BLADES::LIGHT) == BLADES::LIGHT, '2_LIGHT');
        assert(shooter::validated_move(2, BLADES::BLOCK) == BLADES::BLOCK, '2_BLOCK');
        assert(shooter::validated_move(2, 10) == BLADES::IDLE, '2_10');
        assert(shooter::validated_move(3, BLADES::HEAVY) == BLADES::IDLE, '3_HEAVY');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_apply_damage() {
        let mut move = Move {
            hash: 0,
            salt: 0,
            move: 0,
            dice_crit: 0,
            dice_hit: 0,
            damage: 0,
            block: 0,
            health: 0,
        };
        // damages
        move.health = 3;
        move.damage = 1;
        shooter::apply_damage(ref move);
        assert(move.health == 2, '3-1');
        shooter::apply_damage(ref move);
        assert(move.health == 1, '2-1');
        shooter::apply_damage(ref move);
        assert(move.health == 0, '1-1');
        shooter::apply_damage(ref move);
        assert(move.health == 0, '0-1');
        // overflow
        move.health = 1;
        move.damage = 3;
        shooter::apply_damage(ref move);
        assert(move.health == 0, '1-3');
        // blocks
        move.health = 1;
        move.damage = 0;
        move.block = 1;
        shooter::apply_damage(ref move);
        assert(move.health == 1, '1-0+1');
        move.health = 1;
        move.damage = 1;
        move.block = 1;
        shooter::apply_damage(ref move);
        assert(move.health == 1, '1-1+1');
        move.health = 1;
        move.damage = 2;
        move.block = 1;
        shooter::apply_damage(ref move);
        assert(move.health == 0, '1-2+1');
        move.health = 2;
        move.damage = 4;
        move.block = 1;
        shooter::apply_damage(ref move);
        assert(move.health == 0, '2-4+1');
        move.health = 1;
        move.damage = 2;
        move.block = 5;
        shooter::apply_damage(ref move);
        assert(move.health == 1, '1-2+5');
    }
}
