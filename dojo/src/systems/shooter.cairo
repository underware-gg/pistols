
mod shooter {
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::{utils};
    use pistols::models::models::{Challenge, Round, Shot};
    use pistols::types::constants::{constants};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::round::{RoundState};
    use pistols::types::action::{Action, ACTION, ActionTrait};
    use pistols::utils::math::{MathU8, MathU16};

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
    fn commit_action(world: IWorldDispatcher, duel_id: u128, round_number: u8, hash: u64) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (challenge, duelist_number) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Commit.into(), 'Round not in Commit');

        // Validate action hash

        // Store hash
        if (duelist_number == 1) {
            assert(round.shot_a.hash == 0, 'Already committed');
            round.shot_a.hash = hash;
        } else if (duelist_number == 2) {
            assert(round.shot_b.hash == 0, 'Already committed');
            round.shot_b.hash = hash;
        }

        // Finished commit
        if (round.shot_a.hash != 0 && round.shot_b.hash != 0) {
            round.state = RoundState::Reveal.into();
        }

        set!(world, (round));
    }

    //-----------------------------------
    // Reveal
    //
    fn reveal_action(world: IWorldDispatcher, duel_id: u128, round_number: u8, salt: u64, mut packed: u16) {
        let caller: ContractAddress = starknet::get_caller_address();

        // Assert correct Challenge
        let (mut challenge, duelist_number) = _assert_challenge(world, caller, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Reveal.into(), 'Round not in Reveal');

        // Validate action hash
        let hash: u64 = utils::make_action_hash(salt, packed);

        // validate action
        // if invalid, set as 0 (idle, will skip round)
        packed = validated_action(round_number, packed);

        // Store action
        if (duelist_number == 1) {
            assert(round.shot_a.action == 0, 'Already revealed');
            assert(round.shot_a.hash == hash, 'Action does not match hash');
            round.shot_a.salt = salt;
            round.shot_a.action = packed;
        } else if (duelist_number == 2) {
            assert(round.shot_b.action == 0, 'Already revealed');
            assert(round.shot_b.hash == hash, 'Action does not match hash');
            round.shot_b.salt = salt;
            round.shot_b.action = packed;
        }

        // Finishes round if both actions are revealed
        if (round.shot_a.salt > 0 && round.shot_b.salt > 0) {
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

    // Validates a action and returns it
    fn validated_action(round_number: u8, packed: u16) -> u16 {
        // too expensive?
        // if (utils::validate_packed_actions(round_number, packed)) {
        //     (packed)
        // } else {
        //     (ACTION::IDLE.into()) // invalid
        // }
        if (round_number <= constants::ROUND_COUNT) {
            let action: Action = packed.into();
            if (round_number == 1) {
                if (action.is_paces()) { return (packed); }
            } else {
                if (action.is_blades()) { return (packed); }
            }
        }
        (ACTION::IDLE.into()) // invalid
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_round(world: IWorldDispatcher, ref challenge: Challenge, ref round: Round) {
        let action_a: Action = apply_action_honour(ref round.shot_a);
        let action_b: Action = apply_action_honour(ref round.shot_b);
        
        let priority: i8 = action_a.roll_priority(action_b);
        if (priority < 0) {
            // A attacks first
            attack_sync(world, challenge.duelist_a, challenge.duelist_b, round, ref round.shot_a, ref round.shot_b, false);
        } else if (priority > 0) {
            // B attacks first
            attack_sync(world, challenge.duelist_b, challenge.duelist_a, round, ref round.shot_b, ref round.shot_a, false);
        } else {
            // same time
            attack_sync(world, challenge.duelist_a, challenge.duelist_b, round, ref round.shot_a, ref round.shot_b, true);
        }

        // decide results
        if (round.shot_a.health == 0 && round.shot_b.health == 0) {
            // both dead!
            end_challenge(ref challenge, ChallengeState::Draw, 0);
        } else if (round.shot_a.health == 0) {
            // A is dead!
            end_challenge(ref challenge, ChallengeState::Resolved, 2);
        } else if (round.shot_b.health == 0) {
            // B is dead!
            end_challenge(ref challenge, ChallengeState::Resolved, 1);
        } else {
            // both alive!
            if (challenge.round_number == constants::ROUND_COUNT) {
                // end in a Draw
                end_challenge(ref challenge, ChallengeState::Draw, 0);
            } else {
                // next round
                challenge.round_number += 1;
            }
        }

        // Finish round
        round.state = RoundState::Finished.into();
    }

    fn apply_action_honour(ref shot: Shot) -> Action {
        let action: Action = shot.action.into();
        let honour: u8 = action.honour();
        if (honour > 0) {
            shot.honour = honour;
        }
        (action)
    }

    fn end_challenge(ref challenge: Challenge, state: ChallengeState, winner: u8) {
        challenge.state = state.into();
        challenge.winner = winner;
        challenge.timestamp_end = get_block_timestamp();
    }

    //-------------------------
    // Attacks
    //

    // execute attacks in sync or async
    fn attack_sync(world: IWorldDispatcher, attacker: ContractAddress, defender: ContractAddress, round: Round, ref attack: Shot, ref defense: Shot, sync: bool) {
        // attack first, if survives defense can attack
        let executed: bool = attack(world, 'shoot_a', attacker, round, ref attack, ref defense);
        if (sync || !executed) {
            let executed: bool = attack(world, 'shoot_b', defender, round, ref defense, ref attack);
            if (executed) {
                attack.block = 0; // execution cancels any block
            }
        }
        apply_damage(ref defense);
        apply_damage(ref attack);
    }

    fn apply_damage(ref shot: Shot) {
        shot.health = MathU8::sub(shot.health, MathU8::sub(shot.damage, shot.block));
    }

    // executes single attack
    // returns true if ended in execution
    fn attack(world: IWorldDispatcher, seed: felt252, attacker: ContractAddress, round: Round, ref attack: Shot, ref defense: Shot) -> bool {
        let action: Action = attack.action.into();
        if (action == Action::Idle) {
            return (false);
        }
        // dice 1: crit (execution, double damage, goal)
        attack.chance_crit = utils::get_duelist_crit_chance(world, attacker, action, attack.health);
        attack.dice_crit = throw_dice(seed, round, 100);
        if (attack.dice_crit <= attack.chance_crit) {
            return (action.execute_crit(ref attack, ref defense));
        } else {
            // dice 2: miss or hit
            attack.chance_hit = utils::get_duelist_hit_chance(world, attacker, action, attack.health);
            attack.dice_hit = throw_dice(seed * 2, round, 100);
            if (attack.dice_hit <= attack.chance_hit) {
                action.execute_hit(ref attack, ref defense);
            }
        }
        (false)
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
    use pistols::models::models::{init, Shot};
    use pistols::types::action::{Action, ACTION};
    use pistols::types::constants::{constants};
    use pistols::systems::{utils};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_validated_action() {
        assert(shooter::validated_action(1, 0) == 0, '1_0');
        assert(shooter::validated_action(1, 1) == 1, '1_1');
        assert(shooter::validated_action(1, 10) == 10, '1_10');
        assert(shooter::validated_action(1, 11) == 0, '1_11');
        let mut round: u8 = 2;
        loop {
            // invalids
            assert(shooter::validated_action(round, ACTION::IDLE.into()) == ACTION::IDLE.into(), '2_IDLE');
            assert(shooter::validated_action(round, 10) == ACTION::IDLE.into(), '2_10');
            // valids
            if (round <= constants::ROUND_COUNT) {
                assert(shooter::validated_action(round, ACTION::SLOW_BLADE.into()) == ACTION::SLOW_BLADE.into(), '2_HEAVY');
                assert(shooter::validated_action(round, ACTION::FAST_BLADE.into()) == ACTION::FAST_BLADE.into(), '2_LIGHT');
                assert(shooter::validated_action(round, ACTION::BLOCK.into()) == ACTION::BLOCK.into(), '2_BLOCK');
            } else {
                assert(shooter::validated_action(round, ACTION::SLOW_BLADE.into()) == ACTION::IDLE.into(), '2_HEAVY+IDLE');
                assert(shooter::validated_action(round, ACTION::FAST_BLADE.into()) == ACTION::IDLE.into(), '2_LIGHT+IDLE');
                assert(shooter::validated_action(round, ACTION::BLOCK.into()) == ACTION::IDLE.into(), '2_BLOCK+IDLE');
            }
            if(round > constants::ROUND_COUNT) { break; }
            round += 1;
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_validate_validated_action() {
        let mut round_number: u8 = 1;
        loop {
            if (round_number > constants::ROUND_COUNT) { break; }
            //---
            let valid_actions = utils::get_valid_packed_actions(round_number);
            let mut len: usize = valid_actions.len();
            let mut n: usize = 0;
            loop {
                if (n == len) { break; }
                let action: u16 = *valid_actions.at(n);
                assert(shooter::validated_action(round_number, action) == action, '_validated?');
                n += 1;
            };
            //---
            round_number += 1;
        };
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_apply_damage() {
        let mut shot = init::Shot();
        // damages
        shot.health = 3;
        shot.damage = 1;
        shooter::apply_damage(ref shot);
        assert(shot.health == 2, '3-1');
        shooter::apply_damage(ref shot);
        assert(shot.health == 1, '2-1');
        shooter::apply_damage(ref shot);
        assert(shot.health == 0, '1-1');
        shooter::apply_damage(ref shot);
        assert(shot.health == 0, '0-1');
        // overflow
        shot.health = 1;
        shot.damage = 3;
        shooter::apply_damage(ref shot);
        assert(shot.health == 0, '1-3');
        // blocks
        shot.health = 1;
        shot.damage = 0;
        shot.block = 1;
        shooter::apply_damage(ref shot);
        assert(shot.health == 1, '1-0+1');
        shot.health = 1;
        shot.damage = 1;
        shot.block = 1;
        shooter::apply_damage(ref shot);
        assert(shot.health == 1, '1-1+1');
        shot.health = 1;
        shot.damage = 2;
        shot.block = 1;
        shooter::apply_damage(ref shot);
        assert(shot.health == 0, '1-2+1');
        shot.health = 2;
        shot.damage = 4;
        shot.block = 1;
        shooter::apply_damage(ref shot);
        assert(shot.health == 0, '2-4+1');
        shot.health = 1;
        shot.damage = 2;
        shot.block = 5;
        shooter::apply_damage(ref shot);
        assert(shot.health == 1, '1-2+5');
    }
}
