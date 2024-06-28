#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, Challenge, Wager, Round};
    use pistols::models::structs::{SimulateChances};
    use pistols::models::table::{TableConfig, TableTrait, TableManagerTrait, tables};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::constants::{constants};
    use pistols::systems::utils::{ZERO, make_action_hash};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::tester::{tester};

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = tables::LORDS;
    const WAGER_VALUE: u256 = 100_000_000_000_000_000_000;

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;

    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress, wager_value: u256) -> (Challenge, Round, u128) {
        tester::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        tester::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, owner, other, MESSAGE_1, TABLE_ID, wager_value, expire_seconds);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, other, duel_id, true);
        let ch = tester::get_Challenge(world, duel_id);
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
        (ch, round, duel_id)
    }

    fn _get_actions_round_1_resolved() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 2;
        let salt_b: u64 = SALT_1_b;
        let action_a: u8 = 10;
        let action_b: u8 = 6;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_1_dual_crit(action_a: u8, action_b: u8) -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 52;
        let salt_b: u64 = SALT_1_b + 52;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_1_crit_a() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 52;
        let salt_b: u64 = SALT_1_b + 52;
        let action_a: u8 = 9;
        let action_b: u8 = 10;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_1_dual_hit(action_a: u8, action_b: u8) -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = 0x32533f48; // for (3, 3) paces!!
        let salt_b: u64 = SALT_1_b;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_1_dual_hit_find(action_a: u8, action_b: u8, salt_a: u64) -> (u64, u64, u8, u8, u64, u64) {
        let salt_b: u64 = SALT_1_b;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    //-----------------------------------------
    // Accept state
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_accept_state() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        tester::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        tester::execute_register_duelist(system, other, OTHER_NAME, 2);
        assert(system.has_pact(other, owner) == false, 'has_pact_no');

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, owner, other, MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_challenge(system, other, duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(system.has_pact(other, owner) == true, 'has_pact_yes');

        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == new_state.into(), 'state');
        assert(ch.round_number == 1, 'round_number');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(round.duel_id == duel_id, 'round.duel_id');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
    }

    //-----------------------------------------
    // Single Round (paces only)
    //

    #[test]
    #[available_gas(10_000_000_000)]
    fn test_resolved() {
        let (world, system, _admin, _lords, ierc20, owner, other, _bummer, treasury) = tester::setup_world(true, true);
        let balance_contract: u256 = ierc20.balance_of(system.contract_address);
        let balance_treasury: u256 = ierc20.balance_of(treasury);
        let balance_a: u256 = ierc20.balance_of(owner);
        let balance_b: u256 = ierc20.balance_of(other);
        let fee: u256 = system.calc_fee(TABLE_ID, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');
        assert(balance_treasury == 0, 'balance_treasury == 0');

        let (challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        tester::assert_balance(ierc20, system.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(ierc20, owner, balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(ierc20, other, balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(ierc20, treasury, 0, 0, 0, 'balance_treasury_1');

        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        let chances_a: SimulateChances = system.simulate_chances(owner, challenge.duel_id, challenge.round_number, action_a);
        let chances_b: SimulateChances = system.simulate_chances(owner, challenge.duel_id, challenge.round_number, action_b);
        let _hit_chance_a = chances_a.hit_chances;
        let _hit_chance_b = chances_b.hit_chances;
        let kill_chance_a = chances_a.crit_chances;
        let kill_chance_b = chances_b.crit_chances;

        // 1st commit
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '1__challenge.round_number');
        assert(round.round_number == 1, '1__round.round_number');
        assert(round.state == RoundState::Commit.into(), '1__state');
        assert(round.shot_a.hash == hash_a, '1__hash');

        // 2nd commit > Reveal
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '2__challenge.round_number');
        assert(round.round_number == 1, '2__round.round_number');
        assert(round.state == RoundState::Reveal.into(), '2__state');
        assert(round.shot_a.hash == hash_a, '21__hash');
        assert(round.shot_b.hash == hash_b, '2__hash');

        // 1st reveal
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '3_challenge.round_number');
        assert(round.round_number == 1, '3__round.round_number');
        assert(round.state == RoundState::Reveal.into(), '3__state');
        assert(round.shot_a.hash == hash_a, '3__hash');
        assert(round.shot_a.salt == salt_a, '3__salt');
        assert(round.shot_a.action == action_a.into(), '3__action');

        // 2nd reveal > Finished
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::Resolved.into(), '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished.into(), '4__state');
        assert(round.shot_a.hash == hash_a, '43__hash');
        assert(round.shot_a.salt == salt_a, '43__salt');
        assert(round.shot_a.action == action_a.into(), '43__action');
        assert(round.shot_b.hash == hash_b, '4__hash');
        assert(round.shot_b.salt == salt_b, '4__salt');
        assert(round.shot_b.action == action_b.into(), '4__action');

        let duelist_a = tester::get_Duelist(world, owner);
        let duelist_b = tester::get_Duelist(world, other);
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 0, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 0, 'duelist_b.total_draws');
        assert(duelist_a.score.total_honour == action_a.into(), 'duelist_a.total_honour');
        assert(duelist_b.score.total_honour == action_b.into(), 'duelist_b.total_honour');
        assert(duelist_a.score.honour == (action_a * 10).try_into().unwrap(), 'duelist_a.score.honour');
        assert(duelist_b.score.honour == (action_b * 10).try_into().unwrap(), 'duelist_b.score.honour');

        if (challenge.winner == 1) {
            assert(duelist_a.score.total_wins == 1, 'a_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 0, 'a_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 0, 'a_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 1, 'a_win_duelist_b.total_losses');
            assert(round.shot_a.damage < constants::FULL_HEALTH, 'a_win_damage_a');
            assert(round.shot_a.health > 0, 'a_win_health_a');
            assert(round.shot_a.dice_crit > 0 && round.shot_a.dice_crit <= kill_chance_a, 'kill_chance_a');
            assert(round.shot_a.dice_crit <= round.shot_a.chance_crit, 'dice_crit_a <= chance_crit_a');
            assert(round.shot_a.dice_hit == 0 && round.shot_a.dice_hit == 0, 'hit_a');
            assert(round.shot_b.damage == constants::FULL_HEALTH, 'a_win_damage_b');
            assert(round.shot_b.health == 0, 'a_win_health_b');
        } else if (challenge.winner == 2) {
            assert(duelist_a.score.total_wins == 0, 'b_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 1, 'b_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 1, 'b_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 0, 'b_win_duelist_b.total_losses');
            assert(round.shot_b.damage < constants::FULL_HEALTH, 'b_win_damage_b');
            assert(round.shot_b.health > 0, 'b_win_health_b');
            assert(round.shot_b.dice_crit > 0 && round.shot_b.dice_crit <= kill_chance_b, 'kill_chance_b');
            assert(round.shot_b.dice_crit <= round.shot_b.chance_crit, 'dice_crit_b <= chance_crit_b');
            assert(round.shot_b.dice_hit == 0 && round.shot_b.chance_hit == 0, 'hit_b');
            assert(round.shot_a.damage == constants::FULL_HEALTH, 'b_win_damage_a');
            assert(round.shot_a.health == 0, 'b_win_health_a');
        } else {
            assert(false, 'bad winner')
        }

        tester::assert_balance(ierc20, system.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        let balance_treasury = tester::assert_balance(ierc20, treasury, balance_treasury, 0, fee * 2, 'balance_treasury_2');
        tester::assert_winner_balance(ierc20, challenge.winner, owner, other, balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_2');
        let balance_a: u256 = ierc20.balance_of(owner);
        let balance_b: u256 = ierc20.balance_of(other);

        // Run same challenge to compute totals
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        // invert player order just for fun, expect same results!
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished.into(), '4__state');
        let duelist_a = tester::get_Duelist(world, owner);
        let duelist_b = tester::get_Duelist(world, other);
        assert(duelist_a.score.total_duels == 2, '__duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 2, '__duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 0, '__duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 0, '__duelist_b.total_draws');
        assert(duelist_a.score.total_honour == (action_a * 2).into(), '__duelist_a.total_honour');
        assert(duelist_b.score.total_honour == (action_b * 2).into(), '__duelist_b.total_honour');
        assert(duelist_a.score.honour == (action_a * 10).try_into().unwrap(), '__duelist_a.score.honour');
        assert(duelist_b.score.honour == (action_b * 10).try_into().unwrap(), '__duelist_b.score.honour');

        if (challenge.winner == 1) {
            assert(duelist_a.score.total_wins == 2, '__a_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 0, '__a_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 0, '__a_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 2, '__a_win_duelist_b.total_losses');
        } else if (challenge.winner == 2) {
            assert(duelist_a.score.total_wins == 0, '__b_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 2, '__b_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 2, '__b_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 0, '__b_win_duelist_b.total_losses');
        } else {
            assert(false, 'bad winner')
        }

        tester::assert_balance(ierc20, system.contract_address, balance_contract, 0, 0, 'balance_contract_3');
        tester::assert_balance(ierc20, treasury, balance_treasury, 0, fee * 2, 'balance_treasury_3');
        tester::assert_winner_balance(ierc20, challenge.winner, owner, other, balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_3');

        // Snapshot was created and kept original value
        let snapshot = tester::get_Snapshot(world, duel_id);
        assert(snapshot.score_a.total_duels > 0, 'snap_a.total_duels >');
        assert(snapshot.score_b.total_duels > 0, 'snap_b.total_duels >');
        assert(snapshot.score_a.total_duels < duelist_a.score.total_duels, 'snap_a.total_duels <');
        assert(snapshot.score_b.total_duels < duelist_b.score.total_duels, 'snap_b.total_duels <');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_crit() {
        let (world, system, _admin, _lords, ierc20, owner, other, _bummer, treasury) = tester::setup_world(true, true);
        let balance_contract: u256 = ierc20.balance_of(system.contract_address);
        let balance_a: u256 = ierc20.balance_of(owner);
        let balance_b: u256 = ierc20.balance_of(other);
        let fee: u256 = system.calc_fee(TABLE_ID, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');

        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        tester::assert_balance(ierc20, system.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(ierc20, owner, balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(ierc20, other, balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(ierc20, treasury, 0, 0, 0, 'balance_treasury_1');

        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
// round.shot_a.chance_crit.print();
// round.shot_b.chance_crit.print();
// round.shot_a.dice_crit.print();
// round.shot_b.dice_crit.print();
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::Draw.into(), 'challenge.state');
        assert(challenge.winner == 0, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished.into(), 'round.state');
        assert(round.shot_a.health == 0, 'round.shot_a.health');
        assert(round.shot_b.health == 0, 'round.shot_b.health');

        let duelist_a = tester::get_Duelist(world, owner);
        let duelist_b = tester::get_Duelist(world, other);
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 1, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 1, 'duelist_b.total_draws');
        assert(duelist_a.score.total_wins == 0, 'duelist_a.total_wins');
        assert(duelist_b.score.total_wins == 0, 'duelist_b.total_wins');
        assert(duelist_a.score.total_losses == 0, 'duelist_a.total_losses');
        assert(duelist_b.score.total_losses == 0, 'duelist_b.total_losses');
        assert(duelist_a.score.total_honour == action_a.into(), 'duelist_a.total_honour');
        assert(duelist_b.score.total_honour == action_b.into(), 'duelist_b.total_honour');
        assert(duelist_a.score.honour == (action_a * 10).try_into().unwrap(), 'duelist_a.score.honour');
        assert(duelist_b.score.honour == (action_b * 10).try_into().unwrap(), 'duelist_b.score.honour');

        let mut scoreboard_a = tester::get_Scoreboard(world, owner, TABLE_ID);
        let mut scoreboard_b = tester::get_Scoreboard(world, other, TABLE_ID);
        assert(duelist_a.score.total_duels == scoreboard_a.score.total_duels, 'scoreboard_a.total_duels');
        assert(duelist_b.score.total_duels == scoreboard_b.score.total_duels, 'scoreboard_b.total_duels');
        assert(duelist_a.score.total_honour == scoreboard_a.score.total_honour, 'scoreboard_a.total_honour');
        assert(duelist_b.score.total_honour == scoreboard_b.score.total_honour, 'scoreboard_b.total_honour');
        assert(duelist_a.score.honour == scoreboard_a.score.honour, 'scoreboard_a.score.honour');
        assert(duelist_b.score.honour == scoreboard_b.score.honour, 'scoreboard_b.score.honour');

        tester::assert_balance(ierc20, system.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        tester::assert_balance(ierc20, treasury, 0, 0, fee * 2, 'balance_treasury_2');
        tester::assert_balance(ierc20, owner, balance_a, fee, 0, 'balance_a_2');
        tester::assert_balance(ierc20, other, balance_b, fee, 0, 'balance_b_2');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_crit_to_trickster_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        // A is a trickster, will shoot first
        // let mut duelist_a = tester::get_Duelist(world, owner);
        // duelist_a.score.level_trickster = 100;
        let mut scoreboard_a = tester::get_Scoreboard(world, owner, TABLE_ID);
        scoreboard_a.score.level_trickster = 100;
        set!(world,(scoreboard_a));
        // duel!
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), 'challenge.state');
        assert(challenge.winner == 1, 'challenge.winner');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_crit_to_trickster_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        // A is a trickster, will shoot first
        // let mut duelist_b = tester::get_Duelist(world, other);
        // duelist_b.score.level_trickster = 100;
        let mut scoreboard_b = tester::get_Scoreboard(world, other, TABLE_ID);
        scoreboard_b.score.level_trickster = 100;
        set!(world,(scoreboard_b));
        // duel!
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), 'challenge.state');
        assert(challenge.winner == 2, 'challenge.winner');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_early_crit() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(9, 10);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), 'challenge.state');
        assert(challenge.winner == 1, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished.into(), 'round.state');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'round.shot_a.health');
        assert(round.shot_b.health == 0, 'round.shot_b.health');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_late_crit() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 9);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), 'challenge.state');
        assert(challenge.winner == 2, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished.into(), 'round.state');
        assert(round.shot_a.health == 0, 'round.shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'round.shot_b.health');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_hit() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(3, 3);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(round.round_number == 2, 'round2.round_number');
        let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
        assert(round1.shot_a.health < constants::FULL_HEALTH, 'round1.shot_a.health');
        assert(round1.shot_b.health < constants::FULL_HEALTH, 'round1.shot_b.health');
        assert(round1.shot_a.chance_hit > 0, 'round1.chance_hit > 0');
        assert(round1.shot_a.chance_hit == round1.shot_b.chance_hit, 'round1.chance_hit ==');
// save to test_dual_hit_chance_hit_at_3_paces
// round1.shot_a.chance_hit.print();
// round1.shot_b.chance_hit.print();
    }

    const test_dual_hit_chance_hit_at_3_paces: u8 = 0x53;

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_hit_penalty_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(3, 2);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress.into(), 'challenge.state');
        let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
        assert(round1.shot_a.chance_hit < test_dual_hit_chance_hit_at_3_paces, 'round1.shot_a.chance_hit');
        assert(round1.shot_b.chance_hit > test_dual_hit_chance_hit_at_3_paces, 'round1.shot_b.chance_hit');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_dual_hit_penalty_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(2, 3);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress.into(), 'challenge.state');
        let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
        assert(round1.shot_a.chance_hit > test_dual_hit_chance_hit_at_3_paces, 'round1.shot_a.chance_hit');
        assert(round1.shot_b.chance_hit < test_dual_hit_chance_hit_at_3_paces, 'round1.shot_b.chance_hit');
    }

    // #[test]
    // #[available_gas(1_000_000_000_000)]
    // fn test_dual_hit_find() {
    //     let mut salt: u64 = 0x324ffd23;
    //     loop {
    //         salt.print();
    //         let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
    //         let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
    //         let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit_find(3, 3, salt);
    //         tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
    //         tester::execute_commit_action(system, other, duel_id, 1, hash_b);
    //         tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
    //         tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
    //         let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
    //         let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
    //         if (
    //             challenge.state == ChallengeState::InProgress.into() &&
    //             round1.shot_a.health < constants::FULL_HEALTH &&
    //             round1.shot_b.health < constants::FULL_HEALTH
    //         ) {
    //             'FOUND!!!!'.print();
    //             break;
    //         }
    //         salt += 0x34225;
    //     };
    // }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_clamp_invalid_paces() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 0);
        let hash_b: u64 = make_action_hash(0x222, 11);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, 0x111, 0, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, 0x222, 11, 0);
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(round.shot_a.action == 10, 'action_0');
        assert(round.shot_b.action == 10, 'action_11');
        assert(round.shot_a.chance_crit > 0, 'shot_a.chance_crit');
        assert(round.shot_b.chance_crit > 0, 'shot_b.chance_crit');
        assert(round.shot_a.dice_crit > 0, 'shot_a.dice_crit');
        assert(round.shot_b.dice_crit > 0, 'shot_b.dice_crit');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_keep_scores() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 10);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, 0x111, 10, 0);
        let duelist_a_before = tester::get_Duelist(world, owner);
        tester::execute_register_duelist(system, owner, 'dssadsa', 3);
        let duelist_a_after = tester::get_Duelist(world, owner);
        assert(duelist_a_before.address == duelist_a_after.address, 'address');
        assert(duelist_a_before.name != duelist_a_after.name, 'name');
        assert(duelist_a_before.profile_pic != duelist_a_after.profile_pic, 'profile_pic');
        assert(duelist_a_before.timestamp == duelist_a_after.timestamp, 'timestamp');
        assert(duelist_a_before.score.total_duels == duelist_a_after.score.total_duels, 'total_duels');
        assert(duelist_a_before.score.total_wins == duelist_a_after.score.total_wins, 'total_wins');
        assert(duelist_a_before.score.total_losses == duelist_a_after.score.total_losses, 'total_losses');
        assert(duelist_a_before.score.total_draws == duelist_a_after.score.total_draws, 'total_draws');
        assert(duelist_a_before.score.total_honour == duelist_a_after.score.total_honour, 'total_honour');
        assert(duelist_a_before.score.honour == duelist_a_after.score.honour, 'honour');
    }    
    
    //-------------------------------
    // Fails
    //

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Not your Challenge', 'ENTRYPOINT_FAILED'))]
    fn test_wrong_player() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hash: u64 = make_action_hash(0x12121, 0x1);
        tester::execute_commit_action(system, someone_else, duel_id, 1, hash);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Invalid round number', 'ENTRYPOINT_FAILED'))]
    fn test_wrong_round_number() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash: u64 = make_action_hash(0x12121, 0x1);
        tester::execute_commit_action(system, owner, duel_id, 2, hash);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_already_commit_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (_salt_a, _salt_b, _action_a, _action_b, hash_a, _hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_already_commit_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (_salt_a, _salt_b, _action_a, _action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_already_revealed_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (salt_a, _salt_b, action_a, _action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_already_revealed_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (_salt_a, salt_b, _action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Round not in commit', 'ENTRYPOINT_FAILED'))]
    fn test_not_in_commit() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (_salt_a, _salt_b, _action_a, _action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_not_in_reveal() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (_salt_a, salt_b, _action_a, action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Wrong Challenge state', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_not_started() {
        let (_world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        tester::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        tester::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, owner, other, MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let (_salt_a, _salt_b, _action_a, _action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Wrong Challenge state', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_finished_commit() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Wrong Challenge state', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_finished_reveal() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, other, duel_id, 1, hash_b);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_action_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, other, duel_id, 1, hash_a);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_b);
        tester::execute_reveal_action(system, owner, duel_id, 1, 0x111, 2, 0);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_salt_a() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_b);
        tester::execute_commit_action(system, other, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, owner, duel_id, 1, 0x1111, 1, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_action_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_b);
        tester::execute_commit_action(system, other, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, other, duel_id, 1, 0x222, 2, 0);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_salt_b() {
        let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, owner, duel_id, 1, hash_b);
        tester::execute_commit_action(system, other, duel_id, 1, hash_a);
        tester::execute_reveal_action(system, other, duel_id, 1, 0x2222, 1, 0);
    }

}
