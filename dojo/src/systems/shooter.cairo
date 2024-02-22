
mod shooter {
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::{utils};
    use pistols::models::models::{init, Challenge, Round, Shot};
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

        // validate stored actions
        if (!utils::validate_packed_actions(round_number, packed)) {
            // since the hash is validated, we cant throw an error and go back
            packed = if (round_number == 1) {
                // do 10 paces
                (ACTION::PACES_10.into())
            } else {
                // set as Idle, player will stand still and hopefully die
                (ACTION::IDLE.into())
            }
        }

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

        // incomplete Round, update only
        if (round.shot_a.salt == 0 || round.shot_b.salt == 0) {
            set!(world, (round));
            return;
        }

        // Process round when both actions are revealed
        if (round_number == 1) {
            process_round(world, ref challenge, ref round, false);
        } else {
            // split packed action slots
            let (slot1_a, slot1_b, slot2_a, slot2_b): (u8, u8, u8, u8) = utils::unpack_round_slots(round);
            round.shot_a.action = slot1_a.into();
            round.shot_b.action = slot1_b.into();
            let is_last_round: bool = (slot2_a == 0 && slot2_b == 0);
            process_round(world, ref challenge, ref round, is_last_round);
            // open Round 3 if not over
            if (challenge.state == ChallengeState::InProgress.into()) {
                // TODO: move this to init::
                let mut round3 = Round {
                    duel_id: challenge.duel_id,
                    round_number: challenge.round_number,
                    state: RoundState::Reveal.into(),
                    shot_a: Shot {
                        hash: 0,
                        salt: (round.shot_a.salt ^round.shot_a.hash),
                        action: slot2_a.into(),
                        chance_crit: 0,
                        chance_hit: 0,
                        dice_crit: 0,
                        dice_hit: 0,
                        damage: 0,
                        block: 0,
                        health: round.shot_a.health,
                        honour: round.shot_a.honour,
                    },
                    shot_b: Shot {
                        hash: 0,
                        salt: (round.shot_b.salt ^round.shot_b.hash),
                        action: slot2_b.into(),
                        chance_crit: 0,
                        chance_hit: 0,
                        dice_crit: 0,
                        dice_hit: 0,
                        damage: 0,
                        block: 0,
                        health: round.shot_b.health,
                        honour: round.shot_b.honour,
                    },
                };
                process_round(world, ref challenge, ref round, true);
            }
        }
        
        // update Challenge
        utils::set_challenge(world, challenge);
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_round(world: IWorldDispatcher, ref challenge: Challenge, ref round: Round, is_last_round: bool) {
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
            if (challenge.round_number == constants::ROUND_COUNT || is_last_round) {
                // end in a Draw
                end_challenge(ref challenge, ChallengeState::Draw, 0);
            } else {
                // next round
                challenge.round_number += 1;
            }
        }

        // Finish round
        round.state = RoundState::Finished.into();
        set!(world, (round));
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
