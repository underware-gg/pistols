
mod shooter {
    use debug::PrintTrait;
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::actions::{Errors};
    use pistols::libs::utils;
    use pistols::models::challenge::{Challenge, Snapshot, Round, Shot};
    use pistols::models::duelist::{Duelist, Score};
    use pistols::models::table::{TableConfig, TableType};
    use pistols::types::constants::{CONST};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::round::{RoundState};
    use pistols::types::action::{Action, ACTION, ActionTrait};
    use pistols::utils::math::{MathU8, MathU16};

    fn _assert_challenge(world: IWorldDispatcher, caller: ContractAddress, duelist_id: u128, duel_id: u128, round_number: u8) -> (Challenge, u8) {
        let challenge: Challenge = get!(world, duel_id, Challenge);
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
        
        (challenge, duelist_number)
    }


    //-----------------------------------
    // Commit
    //
    fn commit_action(world: IWorldDispatcher, duelist_id: u128, duel_id: u128, round_number: u8, hash: u64) {
        // Assert correct Challenge
        let (_challenge, duelist_number) = _assert_challenge(world, starknet::get_caller_address(), duelist_id, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
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

        set!(world, (round));
    }

    //-----------------------------------
    // Reveal
    //
    fn reveal_action(world: IWorldDispatcher, duelist_id: u128, duel_id: u128, round_number: u8, salt: u64, mut packed: u16) -> Challenge {
        // Assert correct Challenge
        let (mut challenge, duelist_number) = _assert_challenge(world, starknet::get_caller_address(), duelist_id, duel_id, round_number);

        // Assert correct Round
        let mut round: Round = get!(world, (duel_id, round_number), Round);
        assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

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
            assert(round.shot_a.action == 0, Errors::ALREADY_REVEALED);
            assert(round.shot_a.hash == hash, Errors::ACTION_HASH_MISMATCH);
            round.shot_a.salt = salt;
            round.shot_a.action = packed;
        } else if (duelist_number == 2) {
            assert(round.shot_b.action == 0, Errors::ALREADY_REVEALED);
            assert(round.shot_b.hash == hash, Errors::ACTION_HASH_MISMATCH);
            round.shot_b.salt = salt;
            round.shot_b.action = packed;
        }

        // incomplete Round, update only
        if (round.shot_a.salt == 0 || round.shot_b.salt == 0) {
            set!(world, (round));
            return challenge;
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
            if (challenge.state == ChallengeState::InProgress) {
                let mut round3 = Round {
                    duel_id: challenge.duel_id,
                    round_number: challenge.round_number,
                    state: RoundState::Reveal,
                    shot_a: Shot {
                        hash: 0,
                        salt: utils::scramble_salt(round.shot_a.salt),
                        action: slot2_a.into(),
                        chance_crit: 0,
                        chance_hit: 0,
                        chance_lethal: 0,
                        dice_crit: 0,
                        dice_hit: 0,
                        damage: 0,
                        block: 0,
                        health: round.shot_a.health,
                        honour: round.shot_a.honour,
                        win: 0,
                        wager: 0,
                    },
                    shot_b: Shot {
                        hash: 0,
                        salt: utils::scramble_salt(round.shot_b.salt),
                        action: slot2_b.into(),
                        chance_crit: 0,
                        chance_hit: 0,
                        chance_lethal: 0,
                        dice_crit: 0,
                        dice_hit: 0,
                        damage: 0,
                        block: 0,
                        health: round.shot_b.health,
                        honour: round.shot_b.honour,
                        win: 0,
                        wager: 0,
                    },
                };
                process_round(world, ref challenge, ref round3, true);
            }
        }
        
        // update Challenge
        utils::set_challenge(world, challenge);

        (challenge)
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_round(world: IWorldDispatcher, ref challenge: Challenge, ref round: Round, is_last_round: bool) {
        let snapshot: Snapshot = get!(world, challenge.duel_id, Snapshot);
        let table_type: TableType = get!(world, challenge.table_id, TableConfig).table_type;
        
        let action_a: Action = apply_action_honour(ref round.shot_a);
        let action_b: Action = apply_action_honour(ref round.shot_b);
        
        let mut executed: bool = false;
        let priority: i8 = action_a.roll_priority(action_b, snapshot.score_a, snapshot.score_b);
        if (priority < 0) {
            // A strikes first
            executed = strike_async(world, round, snapshot.score_a, snapshot.score_b, ref round.shot_a, ref round.shot_b, table_type);
        } else if (priority > 0) {
            // B strikes first
            executed = strike_async(world, round, snapshot.score_b, snapshot.score_a, ref round.shot_b, ref round.shot_a, table_type);
        } else {
            // A and B strike simultaneously
            executed = strike_sync(world, round, snapshot.score_a, snapshot.score_b, ref round.shot_a, ref round.shot_b, table_type);
        }

        // decide results on health or win flag
        let win_a: bool = (round.shot_a.win != 0);
        let win_b: bool = (round.shot_b.win != 0);
        if (win_a && win_b) {
            end_challenge(ref challenge, ref round, ChallengeState::Draw, 0);
        } else if (win_a) {
            end_challenge(ref challenge, ref round, ChallengeState::Resolved, 1);
        } else if (win_b) {
            end_challenge(ref challenge, ref round, ChallengeState::Resolved, 2);
        } else
        // both players still alive
        if (challenge.round_number == CONST::ROUND_COUNT || is_last_round || executed) {
            // finished moves, and no winner, ends in a draw
            end_challenge(ref challenge, ref round, ChallengeState::Draw, 0);
        } else {
            // next round
            challenge.round_number += 1;
        }

        // Finish round
        round.state = RoundState::Finished;
        set!(world, (round));
    }

    fn apply_action_honour(ref shot: Shot) -> Action {
        let action: Action = shot.action.into();
        let action_honour: i8 = action.honour();
        if (action_honour >= 0) {
            shot.honour = MathU8::abs(action_honour);
        }
        (action)
    }

    fn end_challenge(ref challenge: Challenge, ref round: Round, state: ChallengeState, winner: u8) {
        challenge.state = state;
        challenge.winner = winner;
        challenge.timestamp_end = get_block_timestamp();
    }

    //-------------------------
    // Strikes
    //

    // attacker strikes first, then defender only if not executed
    fn strike_async(world: IWorldDispatcher, round: Round, attacker: Score, defender: Score, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
        let mut executed: bool = strike(world, 'shoot_a', attacker, defender, round, ref attack, ref defense, table_type);
        apply_damage(ref attack, ref defense);
        if (!executed) {
            executed = strike(world, 'shoot_b', defender, attacker, round, ref defense, ref attack, table_type);
            apply_damage(ref defense, ref attack);
        }
        (executed)
    }
    // sync strike, both at the same time
    fn strike_sync(world: IWorldDispatcher, round: Round, attacker: Score, defender: Score, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
        let mut executed_a: bool = strike(world, 'shoot_a', attacker, defender, round, ref attack, ref defense, table_type);
        let mut executed_b: bool = strike(world, 'shoot_b', defender, attacker, round, ref defense, ref attack, table_type);
        apply_damage(ref attack, ref defense);
        apply_damage(ref defense, ref attack);
        (executed_a || executed_b)
    }

    #[inline(always)]
    fn apply_damage(ref attack: Shot, ref defense: Shot) {
        defense.health = MathU8::sub(defense.health, MathU8::sub(defense.damage, defense.block));
        if (defense.health == 0) {
            attack.win = 1;
            attack.wager = 1;
        }
    }

    // executes single attack
    // returns true if ended in execution
    fn strike(world: IWorldDispatcher, seed: felt252, attacker: Score, defender: Score, round: Round, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
        let action: Action = attack.action.into();
        if (action != Action::Idle) {
            let defense_action: Action = defense.action.into();
            // dice 1: crit (execution, double damage, goal)
            attack.chance_crit = utils::calc_crit_chances(attacker, defender, action, defense_action, attack.health, table_type);
            attack.dice_crit = throw_dice(seed, round, 100, attack.chance_crit);
            if (attack.dice_crit <= attack.chance_crit) {
                return (action.execute_crit(ref attack, ref defense));
            } else {
                // dice 2: miss or hit
                attack.chance_hit = utils::calc_hit_chances(attacker, defender, action, defense_action, attack.health, table_type);
                attack.dice_hit = throw_dice(seed * 2, round, 100, attack.chance_hit);
                if (attack.dice_hit <= attack.chance_hit) {
                    attack.chance_lethal = utils::calc_lethal_chances(attacker, defender, action, defense_action, attack.chance_hit);
                    action.execute_hit(ref attack, ref defense, attack.chance_lethal);
                }
            }
        }
        (false)
    }


    //-----------------------------------
    // Randomizer
    //
    fn throw_dice(seed: felt252, round: Round, faces: u128, chances: u8) -> u8 {
        let salt: u64 = utils::make_round_salt(round);
        (utils::throw_dice(seed, salt.into(), faces).try_into().unwrap())
    }
    fn check_dice(seed: felt252, round: Round, faces: u128, chances: u128) -> bool {
        let salt: u64 = utils::make_round_salt(round);
        (utils::check_dice(seed, salt.into(), faces, chances))
    }

}






//------------------------------------------------------
// Unit tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};

    use pistols::libs::shooter::{shooter};
    use pistols::models::challenge::{Shot};
    use pistols::models::init::{init};
    use pistols::types::action::{Action, ACTION};
    use pistols::types::constants::{CONST};
    use pistols::libs::utils;

    #[test]
    fn test_apply_damage() {
        let mut attack = init::Shot();
        let mut defense = init::Shot();
        // damages
        attack.win = 0;
        defense.health = 3;
        defense.damage = 1;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 2, '3-1');
        assert(attack.win == 0, '3-1_win');
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 1, '2-1');
        assert(attack.win == 0, '2-1_win');
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 0, '1-1');
        assert(attack.win == 1, '1-1_win');
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 0, '0-1');
        // overflow
        attack.win = 0;
        defense.health = 1;
        defense.damage = 3;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 0, '1-3');
        assert(attack.win == 1, '1-3_win');
        // blocks
        attack.win = 0;
        defense.health = 1;
        defense.damage = 0;
        defense.block = 1;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 1, '1-0+1');
        assert(attack.win == 0, '1-0+1_win');
        attack.win = 0;
        defense.health = 1;
        defense.damage = 1;
        defense.block = 1;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 1, '1-1+1');
        assert(attack.win == 0, '1-1+1_win');
        attack.win = 0;
        defense.health = 1;
        defense.damage = 2;
        defense.block = 1;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 0, '1-2+1');
        assert(attack.win == 1, '1-2+1_win');
        attack.win = 0;
        defense.health = 2;
        defense.damage = 4;
        defense.block = 1;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 0, '2-4+1');
        assert(attack.win == 1, '2-4+1_win');
        attack.win = 0;
        defense.health = 1;
        defense.damage = 2;
        defense.block = 5;
        shooter::apply_damage(ref attack, ref defense);
        assert(defense.health == 1, '1-2+5');
        assert(attack.win == 0, '1-2+5_win');
    }
}
