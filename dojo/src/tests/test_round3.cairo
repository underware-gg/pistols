#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, Challenge, Round};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::action::{Action, ACTION};
    use pistols::types::constants::{constants};
    use pistols::systems::utils::{zero_address, make_action_hash, pack_action_slots, unpack_action_slots};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::utils::{utils};


    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const WAGER_COIN: u8 = 1;

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;
    const SALT_2_a: u64 = 0x03f8a7e99d723c82;
    const SALT_2_b: u64 = 0x45299a98d9f8ce03;
    
    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress) -> (Challenge, Round, u128) {
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, MESSAGE_1, WAGER_COIN, 0, expire_seconds);
        utils::elapse_timestamp(timestamp::from_days(1));
        utils::execute_reply_challenge(system, other, duel_id, true);
        let ch = utils::get_Challenge(world, duel_id);
        let round: Round = utils::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
        (ch, round, duel_id)
    }

    // both full health
    fn _get_actions_round_1_continue() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 1;
        let salt_b: u64 = SALT_1_b + 1;
        let action_a: u8 = 10;
        let action_b: u8 = 10;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }


    const SALT_DUAL_MISS: u64 = 0xcb34333b;
    const SALT_DUAL_HIT: u64 = 0x3764564;
// const SALT_DUAL_CRIT: u64 = 0xffffff;
    const SALT_HIT_MISS: u64 = 0xffffff; // 3,1
    const SALT_MISS_HIT: u64 = 0x1ff8f8f88f; // 1,3
    const SALT_CRIT_MISS: u64 = 0xdfdfdf; // 3,0
    const SALT_MISS_CRIT: u64 = 0xaaaaa; // 0,3
    const SALT_CRIT_HIT: u64 = 0x1111; // 1,0
const SALT_HIT_CRIT: u64 = 0x1111; // 0,1

    fn _execute_blades(
        world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress,
        health_a: u8, slot1_a: u8, slot2_a: u8,
        health_b: u8, slot1_b: u8, slot2_b: u8,
        blades_salt: u64,
    ) -> (Challenge, Round) {
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        // random 1st round...
        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_1_continue();
        utils::execute_commit_action(system, owner, duel_id, 1, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 1, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 1, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 1, salt_1_b, action_1_b, 0);
        let (challenge, mut round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 2, 'C: needs 2 rounds');
        assert(round.round_number == 2, 'R: needs 2 rounds');
        // change round 1 results
        round.shot_a.health = health_a;
        round.shot_b.health = health_b;
        set!(world, (round));
        // run 2nd round
        let salt_a: u64 = blades_salt;
        let salt_b: u64 = SALT_1_b;
        let hash_a: u64 = make_action_hash(salt_a, pack_action_slots(slot1_a, slot2_a));
        let hash_b: u64 = make_action_hash(salt_b, pack_action_slots(slot1_b, slot2_b));
        utils::execute_commit_action(system, owner, duel_id, 2, hash_a);
        utils::execute_commit_action(system, other, duel_id, 2, hash_b);
        utils::execute_reveal_action(system, owner, duel_id, 2, salt_a, slot1_a, slot2_a);
        utils::execute_reveal_action(system, other, duel_id, 2, salt_b, slot1_b, slot2_b);
        // return results
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
// salt_a.print();
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.winner.print();
// challenge.state.print();
        (challenge, round)
    }

    fn assert_winner(challenge: Challenge, round: Round, winner: u8, round_number: u8) {
        assert(challenge.winner == winner, 'challenge.winner');
        assert(challenge.timestamp_start < challenge.timestamp_end, 'bad timestamps');
        assert(round.state == RoundState::Finished.into(), 'round.state');
        if (round_number > 0) {
            assert(challenge.round_number == round_number, 'bad challenge.round_number');
            assert(round.round_number == round_number, 'bad round.round_number');
        }
        if (winner == 0) {
            assert(challenge.state == ChallengeState::Draw.into(), 'not Draw');
            assert(round.shot_a.win == round.shot_b.win, 'win_draw');
        } else {
            assert(challenge.state == ChallengeState::Resolved.into(), 'not Resolved');
            if (winner == 1) {
                assert(round.shot_a.win > 0, 'win_a_a');
                assert(round.shot_b.win == 0, 'win_a_b');
            } else if (winner == 2) {
                assert(round.shot_a.win == 0, 'win_b_a');
                assert(round.shot_b.win > 0, 'win_b_b');
            } else {
                assert(false, 'Invalid test winner');
            }
        }
    }

    //-----------------------------------------
    // misc tests
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dices() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            SALT_DUAL_MISS,
        );
        assert_winner(challenge, round, 0, 3);
        let round2: Round = utils::get_Round(world, challenge.duel_id, 2);
        let round3: Round = utils::get_Round(world, challenge.duel_id, 3);
        // crit
        assert(round2.shot_a.dice_crit > 0, 'round2.shot_a.dice_crit');
        assert(round3.shot_a.dice_crit > 0, 'round3.shot_a.dice_crit');
        assert(round3.shot_a.dice_crit != round2.shot_a.dice_crit, 'shot_a.dice_crit !=');
        assert(round2.shot_b.dice_crit > 0, 'round2.shot_b.dice_crit');
        assert(round3.shot_b.dice_crit > 0, 'round3.shot_b.dice_crit');
        assert(round3.shot_b.dice_crit != round2.shot_b.dice_crit, 'shot_b.dice_crit !=');
        // hit
        assert(round2.shot_a.dice_hit > 0, 'round2.shot_a.dice_hit');
        assert(round3.shot_a.dice_hit > 0, 'round3.shot_a.dice_hit');
        assert(round3.shot_a.dice_hit != round2.shot_a.dice_hit, 'shot_a.dice_hit !=');
        assert(round2.shot_b.dice_hit > 0, 'round2.shot_b.dice_hit');
        assert(round3.shot_b.dice_hit > 0, 'round3.shot_b.dice_hit');
        assert(round3.shot_b.dice_hit != round2.shot_b.dice_hit, 'shot_b.dice_hit !=');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_idle_actions() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::SINGLE_DAMAGE, ACTION::IDLE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }


    #[test]
    #[available_gas(1_000_000_000)]
    fn test_skip_idle_slot() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::IDLE, ACTION::FAST_BLADE,
            constants::SINGLE_DAMAGE, ACTION::IDLE, ACTION::FAST_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_invalid_actions() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::SINGLE_DAMAGE, ACTION::SLOW_BLADE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }

    //-----------------------------------------
    // Blades Matches
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_slow_draw() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.damage == constants::DOUBLE_DAMAGE, 'bad shot_a.damage');
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.damage == constants::DOUBLE_DAMAGE, 'bad shot_b.damage');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }

    // #[test]
    // #[available_gas(1_000_000_000)]
    // fn test_slow_vs_slow_suicide_pact() {
    //     let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
    //     let (challenge, round) = _execute_blades(
    //         world, system, owner, other,
    //         constants::FULL_HEALTH, ACTION::SLOW_BLADE,
    //         constants::FULL_HEALTH, ACTION::SLOW_BLADE,
    //         SALT_DUAL_CRIT, // NEED THIS!!!!
    //     );
    //     assert_winner(challenge, round, 0, 2);
    //     assert(round.shot_a.damage == constants::FULL_HEALTH, 'bad shot_a.damage');
    //     assert(round.shot_a.health == 0, 'bad health_a');
    //     assert(round.shot_b.damage == constants::FULL_HEALTH, 'bad shot_b.damage');
    //     assert(round.shot_b.health == 0, 'bad health_b');
    // }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_slow_suicide_pact() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::DOUBLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.damage == constants::DOUBLE_DAMAGE, 'bad shot_a.damage');
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.damage == constants::DOUBLE_DAMAGE, 'bad shot_b.damage');
        assert(round.shot_b.health == 0, 'bad health_b');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_fast_draw() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_a
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_b
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.damage == constants::SINGLE_DAMAGE, 'bad shot_a.damage');
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad shot_a.health');
        assert(round.shot_b.damage == constants::SINGLE_DAMAGE, 'bad shot_b.damage');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad shot_b.health');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_fast_hit_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_a
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_b
            SALT_HIT_MISS,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_fast_crit_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_a
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_b
            SALT_CRIT_MISS,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::DOUBLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_fast_hit_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_a
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_b
            SALT_MISS_HIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_fast_crit_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_a
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE, // duelist_b
            SALT_MISS_CRIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.health == constants::DOUBLE_DAMAGE, 'bad health_b');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_block_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::SINGLE_DAMAGE, ACTION::BLOCK, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }
    fn test_block_vs_fast_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::BLOCK, ACTION::IDLE,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }

    //----------------------
    // Fast vs Slow
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_slow_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::SINGLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_slow_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::DOUBLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 2, 3);
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_fast_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::SINGLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::SINGLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.health == 0, 'bad health_a');
        assert(round.shot_b.health == constants::SINGLE_DAMAGE, 'bad health_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_fast_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::DOUBLE_DAMAGE, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::DOUBLE_DAMAGE, ACTION::FAST_BLADE, ACTION::IDLE,
            SALT_MISS_HIT,
        );
        assert_winner(challenge, round, 1, 3);
        assert(round.shot_a.health == constants::SINGLE_DAMAGE, 'bad health_a');
        assert(round.shot_b.health == 0, 'bad health_b');
    }

    //----------------------
    // Slow vs Block
    //
    
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_block_crit_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::BLOCK,
            SALT_CRIT_HIT,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_b.damage == constants::FULL_HEALTH, 'shot_b.damage');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_block_vs_slow_crit_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::BLOCK,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_HIT_CRIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_a.damage == constants::FULL_HEALTH, 'shot_a.damage');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
    }


    //----------------------
    // Block misc
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_block_vs_idle() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::FAST_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 3);
        let round2: Round = utils::get_Round(world, challenge.duel_id, 2);
        assert(round2.shot_a.health == constants::FULL_HEALTH, 'round2.shot_a.health');
        assert(round2.shot_b.health == constants::FULL_HEALTH, 'round2.shot_b.health');
        assert(round2.shot_a.block > 0, 'round2.shot_a.block');
        assert(round2.shot_b.block == 0, 'round2.shot_b.block');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'round.shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'round.shot_b.health');
        assert(round.shot_a.block > 0, 'round.shot_a.block');
        assert(round.shot_b.block == 0, 'round.shot_b.block');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_idle_vs_block() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::FAST_BLADE,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 3);
        let round2: Round = utils::get_Round(world, challenge.duel_id, 2);
        assert(round2.shot_a.health == constants::FULL_HEALTH, 'round2.shot_a.health');
        assert(round2.shot_b.health == constants::FULL_HEALTH, 'round2.shot_b.health');
        assert(round2.shot_a.block == 0, 'round2.shot_a.block');
        assert(round2.shot_b.block > 0, 'round2.shot_b.block');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'round.shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'round.shot_b.health');
        assert(round.shot_a.block == 0, 'round.shot_a.block');
        assert(round.shot_b.block > 0, 'round.shot_b.block');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_block_vs_block() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::BLOCK,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 3);
        let round2: Round = utils::get_Round(world, challenge.duel_id, 2);
        assert(round2.shot_a.health == constants::FULL_HEALTH, 'round2.shot_a.health');
        assert(round2.shot_b.health == constants::FULL_HEALTH, 'round2.shot_b.health');
        assert(round2.shot_a.block > 0, 'round2.shot_a.block');
        assert(round2.shot_b.block > 0, 'round2.shot_b.block');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'round.shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'round.shot_b.health');
        assert(round.shot_a.block > 0, 'round.shot_a.block');
        assert(round.shot_b.block > 0, 'round.shot_b.block');
    }



    //----------------------
    // Flee
    //
    
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_vs_flee() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_win_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            0x12121, // MISS
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::PACES_10.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::FLEE.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_b.chance_crit == 100, 'shot_b.chance_crit');
        assert(round.shot_b.dice_crit == 100, 'shot_b.dice_crit');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_win_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::IDLE,
            0x12121, // MISS
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::FLEE.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::PACES_10.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.chance_crit == 100, 'shot_a.chance_crit');
        assert(round.shot_a.dice_crit == 100, 'shot_a.dice_crit');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_flee_kill_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FAST_BLADE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            SALT_CRIT_HIT, // CRIT_???, chances for Paces are different!
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::PACES_10.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::FLEE.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager == 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_flee_kill_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            SALT_CRIT_HIT, // CRIT_???, chances for Paces are different!
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::PACES_10.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::FLEE.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager == 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_kill_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FAST_BLADE, ACTION::IDLE,
            0xeee, // ???_CRIT, chances for Paces are different!
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::FLEE.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::PACES_10.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager == 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }



    //----------------------
    // Steal
    //
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_vs_flee() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager > round.shot_b.wager, 'wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_vs_steal() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager < round.shot_b.wager, 'wager');
    }
    //
    // face-off
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_vs_steal() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 3);
        assert(round.shot_a.action == ACTION::PACES_1.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::PACES_1.into(), 'shot_b.action');
        assert(round.shot_a.health < constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health < constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager == 0, 'shot_a.wager');
        assert(round.shot_b.wager == 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_win_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            0x12121, // MISS
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::PACES_10.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::STEAL.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_b.chance_crit == 100, 'shot_b.chance_crit');
        assert(round.shot_b.dice_crit == 100, 'shot_b.dice_crit');
        assert(round.shot_a.wager == 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_win_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::BLOCK, ACTION::IDLE,
            0x12121, // MISS
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::STEAL.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::PACES_10.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.chance_crit == 100, 'shot_a.chance_crit');
        assert(round.shot_a.dice_crit == 100, 'shot_a.dice_crit');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager == 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_slow_vs_steal_kill_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            SALT_CRIT_HIT, // CRIT_???, chances for Paces are different!
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::PACES_10.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::STEAL.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager > 0, 'shot_a.wager');
        assert(round.shot_b.wager == 0, 'shot_b.wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_kill_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FAST_BLADE, ACTION::IDLE,
            0xeee, // ???_CRIT, chances for Paces are different!
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::STEAL.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::PACES_10.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager == 0, 'shot_a.wager');
        assert(round.shot_b.wager > 0, 'shot_b.wager');
    }



    //----------------------
    // Seppuku
    //
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_seppuku_vs_seppuku() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.action == ACTION::SEPPUKU.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::SEPPUKU.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager == round.shot_b.wager, 'no_wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_seppuku_vs_slow_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::IDLE, ACTION::SLOW_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::SEPPUKU.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::IDLE.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager < round.shot_b.wager, 'wager_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_seppuku_vs_fast_b() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FAST_BLADE, ACTION::FAST_BLADE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 2, 2);
        assert(round.shot_a.action == ACTION::SEPPUKU.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::IDLE.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager < round.shot_b.wager, 'wager_b');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fast_vs_seppuku_a() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FAST_BLADE, ACTION::FAST_BLADE,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 1, 2);
        assert(round.shot_a.action == ACTION::IDLE.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::SEPPUKU.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager > round.shot_b.wager, 'wager_a');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_seppuku_vs_flee() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.action == ACTION::SEPPUKU.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::FLEE.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager == round.shot_b.wager, 'no_wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_seppuku_vs_steal() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.action == ACTION::SEPPUKU.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::STEAL.into(), 'shot_b.action');
        assert(round.shot_a.health == 0, 'shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'shot_b.health');
        assert(round.shot_a.wager < round.shot_b.wager, 'wager_a');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_flee_vs_seppuku() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::FLEE, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.action == ACTION::FLEE.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::SEPPUKU.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager == round.shot_b.wager, 'no_wager');
    }
    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steal_vs_seppuku_vs() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true, true);
        let (challenge, round) = _execute_blades(
            world, system, owner, other,
            constants::FULL_HEALTH, ACTION::STEAL, ACTION::IDLE,
            constants::FULL_HEALTH, ACTION::SEPPUKU, ACTION::IDLE,
            SALT_DUAL_HIT,
        );
        assert_winner(challenge, round, 0, 2);
        assert(round.shot_a.action == ACTION::STEAL.into(), 'shot_a.action');
        assert(round.shot_b.action == ACTION::SEPPUKU.into(), 'shot_b.action');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'shot_a.health');
        assert(round.shot_b.health == 0, 'shot_b.health');
        assert(round.shot_a.wager > round.shot_b.wager, 'wager_b');
    }


}
