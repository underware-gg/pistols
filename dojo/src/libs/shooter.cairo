
mod shooter {
    use debug::PrintTrait;
    use core::traits::TryInto;
    use starknet::{ContractAddress, get_block_timestamp};
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::actions::{Errors};
    use pistols::libs::utils;
    use pistols::models::challenge::{Challenge, Snapshot, SnapshotEntity, Round, RoundEntity, Shot, ShotTrait, PlayerHand};
    use pistols::models::duelist::{Duelist, Score};
    use pistols::models::table::{TableConfig, TableConfigEntity, TableType};
    use pistols::types::constants::{CONST};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::round::{RoundState};
    use pistols::types::action::{Action, ACTION, ActionTrait};
    use pistols::utils::math::{MathU8, MathU16};
    use pistols::utils::arrays::{SpanTrait};
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
            assert(round.shot_a.hash == hash, Errors::ACTION_HASH_MISMATCH);
            round.shot_a.salt = salt;
            round.shot_a.card_1 = *moves[0];
            round.shot_a.card_2 = *moves[1];
            round.shot_a.card_3 = moves.value_or_zero(2);
            round.shot_a.card_4 = moves.value_or_zero(3);
        } else if (duelist_number == 2) {
            assert(round.shot_b.card_1 == 0, Errors::ALREADY_REVEALED);
            assert(round.shot_b.hash == hash, Errors::ACTION_HASH_MISMATCH);
            round.shot_b.salt = salt;
            round.shot_b.card_1 = *moves[0];
            round.shot_b.card_2 = *moves[1];
            round.shot_b.card_3 = moves.value_or_zero(2);
            round.shot_b.card_4 = moves.value_or_zero(3);
        }

        // incomplete Round, update only
        if (round.shot_a.salt == 0 || round.shot_b.salt == 0) {
            store.set_round(@round);
            return challenge;
        }

        // Process round when both actions are revealed
        process_game(store, ref challenge, ref round);
        
        // update Challenge
        utils::set_challenge(store, challenge);

        (challenge)
    }

    //---------------------------------------
    // Decide who wins a round, or go to next
    //
    fn process_game(store: Store, ref challenge: Challenge, ref round: Round) {
        let _snapshot: SnapshotEntity = store.get_snapshot_entity(challenge.duel_id);
        let _table_type: TableType = store.get_table_config_entity(challenge.table_id).table_type;
        
        let hand_a: PlayerHand = round.shot_a.as_hand();
        let hand_b: PlayerHand = round.shot_b.as_hand();

        round.shot_a.apply_honour(hand_a.action_1);
        round.shot_b.apply_honour(hand_b.action_1);

        //
        // TODO
        //

        // let mut executed: bool = false;
        // let priority: i8 = action_a.roll_priority(action_b, snapshot.score_a, snapshot.score_b);
        // if (priority < 0) {
        //     // A strikes first
        //     executed = strike_async(store, round, snapshot.score_a, snapshot.score_b, ref round.shot_a, ref round.shot_b, table_type);
        // } else if (priority > 0) {
        //     // B strikes first
        //     executed = strike_async(store, round, snapshot.score_b, snapshot.score_a, ref round.shot_b, ref round.shot_a, table_type);
        // } else {
        //     // A and B strike simultaneously
        //     executed = strike_sync(store, round, snapshot.score_a, snapshot.score_b, ref round.shot_a, ref round.shot_b, table_type);
        // }

        // decide results on health or win flag
        let win_a: bool = (round.shot_a.win != 0);
        let win_b: bool = (round.shot_b.win != 0);
        if (win_a && win_b) {
            end_challenge(ref challenge, ref round, ChallengeState::Draw, 0);
        } else if (win_a) {
            end_challenge(ref challenge, ref round, ChallengeState::Resolved, 1);
        } else if (win_b) {
            end_challenge(ref challenge, ref round, ChallengeState::Resolved, 2);
        } else {
            // both players still alive, its a draw
            end_challenge(ref challenge, ref round, ChallengeState::Draw, 0);
        }

        // Finish round
        round.state = RoundState::Finished;
        store.set_round(@round);
    }

    fn end_challenge(ref challenge: Challenge, ref round: Round, state: ChallengeState, winner: u8) {
        challenge.state = state;
        challenge.winner = winner;
        challenge.timestamp_end = get_block_timestamp();
    }

    //-------------------------
    // Strikes
    //

    // // attacker strikes first, then defender only if not executed
    // fn strike_async(store: Store, round: Round, attacker: Score, defender: Score, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
    //     let mut executed: bool = strike(store, 'shoot_a', attacker, defender, round, ref attack, ref defense, table_type);
    //     apply_damage(ref attack, ref defense);
    //     if (!executed) {
    //         executed = strike(store, 'shoot_b', defender, attacker, round, ref defense, ref attack, table_type);
    //         apply_damage(ref defense, ref attack);
    //     }
    //     (executed)
    // }
    // // sync strike, both at the same time
    // fn strike_sync(store: Store, round: Round, attacker: Score, defender: Score, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
    //     let mut executed_a: bool = strike(store, 'shoot_a', attacker, defender, round, ref attack, ref defense, table_type);
    //     let mut executed_b: bool = strike(store, 'shoot_b', defender, attacker, round, ref defense, ref attack, table_type);
    //     apply_damage(ref attack, ref defense);
    //     apply_damage(ref defense, ref attack);
    //     (executed_a || executed_b)
    // }

    #[inline(always)]
    fn apply_damage(ref attack: Shot, ref defense: Shot) {
        defense.health = MathU8::sub(defense.health, MathU8::sub(defense.damage, defense.block));
        if (defense.health == 0) {
            attack.win = 1;
            attack.wager = 1;
        }
    }

    // // executes single attack
    // // returns true if ended in execution
    // fn strike(store: Store, seed: felt252, attacker: Score, defender: Score, round: Round, ref attack: Shot, ref defense: Shot, table_type: TableType) -> bool {
    //     let action: Action = attack.action.into();
    //     if (action != Action::Idle) {
    //         let defense_action: Action = defense.action.into();
    //         // dice 1: crit (execution, double damage, goal)
    //         attack.chance_crit = utils::calc_crit_chances(attacker, defender, action, defense_action, attack.health, table_type);
    //         attack.dice_crit = throw_dice(seed, round, 100, attack.chance_crit);
    //         if (attack.dice_crit <= attack.chance_crit) {
    //             return (action.execute_crit(ref attack, ref defense));
    //         } else {
    //             // dice 2: miss or hit
    //             attack.chance_hit = utils::calc_hit_chances(attacker, defender, action, defense_action, attack.health, table_type);
    //             attack.dice_hit = throw_dice(seed * 2, round, 100, attack.chance_hit);
    //             if (attack.dice_hit <= attack.chance_hit) {
    //                 attack.chance_lethal = utils::calc_lethal_chances(attacker, defender, action, defense_action, attack.chance_hit);
    //                 action.execute_hit(ref attack, ref defense, attack.chance_lethal);
    //             }
    //         }
    //     }
    //     (false)
    // }


    //-----------------------------------
    // Randomizer
    //
    fn throw_dice(seed: felt252, round: Round, faces: u128, chances: u8) -> u8 {
        let salt: felt252 = utils::make_round_salt(round);
        (utils::throw_dice(seed, salt, faces).try_into().unwrap())
    }
    fn check_dice(seed: felt252, round: Round, faces: u128, chances: u128) -> bool {
        let salt: felt252 = utils::make_round_salt(round);
        (utils::check_dice(seed, salt, faces, chances))
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
