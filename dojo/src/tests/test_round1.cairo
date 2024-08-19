#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::challenge::{Challenge, Wager, Round};
    use pistols::models::duelist::{Duelist, ProfilePicType, Archetype};
    use pistols::models::structs::{SimulateChances};
    use pistols::models::table::{TableConfig, TableTrait, TableManagerTrait, tables};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::constants::{constants, honour};
    use pistols::libs::utils::{make_action_hash};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::tester::{tester,
        tester::{
            flags, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
            FAKE_OWNER_1_1, FAKE_OWNER_2_2,
        }
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = tables::LORDS;
    const WAGER_VALUE: u128 = 100_000_000_000_000_000_000;

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;

    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress, wager_value: u128) -> (Challenge, Round, u128) {
        // tester::execute_update_duelist(system, OWNER(), PLAYER_NAME, ProfilePicType::Duelist, "1");
        // tester::execute_update_duelist(system, OTHER(), OTHER_NAME, ProfilePicType::Duelist, "2");
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, wager_value, 48);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, OTHER(), duel_id, true);
        let ch = tester::get_Challenge(world, duel_id);
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress, 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit, 'round.state');
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
    fn test_challenge_accept_to_duelist() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        assert(system.has_pact(TABLE_ID, ID(A), ID(B)) == false, 'has_pact_no_1');
        assert(system.has_pact(TABLE_ID, ID(B), ID(A)) == false, 'has_pact_no_2');

        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == ZERO(), 'challenger');   // challenged an id, address is empty
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == ID(B), 'challenged_id');

        // reply...
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_challenge(system, B, duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(system.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_yes_1');
        assert(system.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes_2');

        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 1, 'round_number');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        assert(ch.address_b == B, 'challenged');   // << UPDATED!!!
        
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(round.duel_id == duel_id, 'round.duel_id');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Commit, 'round.state');
    }

    #[test]
    fn test_challenge_accept_to_address() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_challenge_ID(system, A, ID(ID_A), B, MESSAGE_1, tables::COMMONERS, 0, 48);
        let ch = tester::get_Challenge(world, duel_id);
// ch.address_a.print();
// ch.address_b.print();
// ch.duelist_id_a.print();
// ch.duelist_id_b.print();
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(ID_A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(system.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true_1');
        assert(system.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_addr_true_2');
        assert(system.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_1');
        assert(system.has_pact(ch.table_id, ID(ID_B), ID(ID_A)) == false, 'has_pact_id_false_2');
        // reply...
        let new_state: ChallengeState = tester::execute_reply_challenge_ID(system, B, ID(ID_B), duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(system.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false_1');
        assert(system.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_addr_false_2');
        assert(system.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == true, 'has_pact_id_true_1');
        assert(system.has_pact(ch.table_id, ID(ID_B), ID(ID_A)) == true, 'has_pact_id_true_2');
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.duelist_id_b == ID(ID_B), 'challenged_id_ok');   // << UPDATED!!!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_duelist() {
        let (_world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER(); // challenge a duelist
        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_challenge_ID(system, B, duel_id, 0xaaa, true);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_player_address() {
        let (_world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = LITTLE_BOY(); // challenge a wallet
        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        // reply with different TOKEN ID
        // panic!
        let another_boy: ContractAddress = starknet::contract_address_const::<0xaaaa00000000000aa>();
        tester::execute_reply_challenge(system, another_boy, duel_id, true);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_player_duelist() {
        let (_world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER(); // challenge a duelist
        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_challenge(system, BUMMER(), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge exists', 'ENTRYPOINT_FAILED'))]
    fn test_reply_has_pact() {
        let (_world, system, _admin, lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = LITTLE_BOY(); // challenge a wallet
        // fund account
        tester::execute_lords_faucet(lords, B);
        tester::execute_lords_approve(lords, B, system.contract_address, 1_000_000 * constants::ETH_TO_WEI.low);
        // new challenge
        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let _new_state: ChallengeState = tester::execute_reply_challenge(system, B, duel_id, true);
        // new challenge
        let duel_id: u128 = tester::execute_create_challenge(system, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let _new_state: ChallengeState = tester::execute_reply_challenge(system, B, duel_id, true);
    }



    //-----------------------------------------
    // Single Round (paces only)
    //

    #[test]
    fn test_resolved() {
        let (world, system, _admin, lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let balance_contract: u128 = lords.balance_of(system.contract_address).low;
        let balance_treasury: u128 = lords.balance_of(TREASURY()).low;
        let balance_a: u128 = lords.balance_of(OWNER()).low;
        let balance_b: u128 = lords.balance_of(OTHER()).low;
        let fee: u128 = system.calc_fee(TABLE_ID, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');
        assert(balance_treasury == 0, 'balance_treasury == 0');

        let (challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        tester::assert_balance(lords, system.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(lords, OWNER(), balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(lords, OTHER(), balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        let chances_a: SimulateChances = system.simulate_chances(ID(OWNER()), challenge.duel_id, challenge.round_number, action_a);
        let chances_b: SimulateChances = system.simulate_chances(ID(OWNER()), challenge.duel_id, challenge.round_number, action_b);
        let _hit_chance_a = chances_a.hit_chances;
        let _hit_chance_b = chances_b.hit_chances;
        let kill_chance_a = chances_a.crit_chances;
        let kill_chance_b = chances_b.crit_chances;

        // 1st commit
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '1__challenge.round_number');
        assert(round.round_number == 1, '1__round.round_number');
        assert(round.state == RoundState::Commit, '1__state');
        assert(round.shot_a.hash == hash_a, '1__hash');

        // 2nd commit > Reveal
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '2__challenge.round_number');
        assert(round.round_number == 1, '2__round.round_number');
        assert(round.state == RoundState::Reveal, '2__state');
        assert(round.shot_a.hash == hash_a, '21__hash');
        assert(round.shot_b.hash == hash_b, '2__hash');

        // 1st reveal
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '3_challenge.round_number');
        assert(round.round_number == 1, '3__round.round_number');
        assert(round.state == RoundState::Reveal, '3__state');
        assert(round.shot_a.hash == hash_a, '3__hash');
        assert(round.shot_a.salt == salt_a, '3__salt');
        assert(round.shot_a.action == action_a.into(), '3__action');

        // 2nd reveal > Finished
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::Resolved, '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished, '4__state');
        assert(round.shot_a.hash == hash_a, '43__hash');
        assert(round.shot_a.salt == salt_a, '43__salt');
        assert(round.shot_a.action == action_a.into(), '43__action');
        assert(round.shot_b.hash == hash_b, '4__hash');
        assert(round.shot_b.salt == salt_b, '4__salt');
        assert(round.shot_b.action == action_b.into(), '4__action');

        let duelist_a = tester::get_Duelist(world, OWNER());
        let duelist_b = tester::get_Duelist(world, OTHER());
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 0, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 0, 'duelist_b.total_draws');
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

        tester::assert_balance(lords, system.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        let balance_treasury = tester::assert_balance(lords, TREASURY(), balance_treasury, 0, fee * 2, 'balance_treasury_2');
        tester::assert_winner_balance(lords, challenge.winner, OWNER(), OTHER(), balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_2');
        let balance_a: u128 = lords.balance_of(OWNER()).low;
        let balance_b: u128 = lords.balance_of(OTHER()).low;

        // Run same challenge to compute totals
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        // invert player order just for fun, expect same results!
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished, '4__state');
        let duelist_a = tester::get_Duelist(world, OWNER());
        let duelist_b = tester::get_Duelist(world, OTHER());
        assert(duelist_a.score.total_duels == 2, '__duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 2, '__duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 0, '__duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 0, '__duelist_b.total_draws');
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

        tester::assert_balance(lords, system.contract_address, balance_contract, 0, 0, 'balance_contract_3');
        tester::assert_balance(lords, TREASURY(), balance_treasury, 0, fee * 2, 'balance_treasury_3');
        tester::assert_winner_balance(lords, challenge.winner, OWNER(), OTHER(), balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_3');

        // Snapshot was created and kept original value
        let snapshot = tester::get_Snapshot(world, duel_id);
        assert(snapshot.score_a.total_duels > 0, 'snap_a.total_duels >');
        assert(snapshot.score_b.total_duels > 0, 'snap_b.total_duels >');
        assert(snapshot.score_a.total_duels < duelist_a.score.total_duels, 'snap_a.total_duels <');
        assert(snapshot.score_b.total_duels < duelist_b.score.total_duels, 'snap_b.total_duels <');
    }

    #[test]
    fn test_resolved_draw() {
        let (world, system, _admin, lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);
        let balance_contract: u128 = lords.balance_of(system.contract_address).low;
        let balance_a: u128 = lords.balance_of(OWNER()).low;
        let balance_b: u128 = lords.balance_of(OTHER()).low;
        let fee: u128 = system.calc_fee(TABLE_ID, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');

        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        tester::assert_balance(lords, system.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(lords, OWNER(), balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(lords, OTHER(), balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
// round.shot_a.chance_crit.print();
// round.shot_b.chance_crit.print();
// round.shot_a.dice_crit.print();
// round.shot_b.dice_crit.print();
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::Draw, 'challenge.state');
        assert(challenge.winner == 0, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished, 'round.state');
        assert(round.shot_a.health == 0, 'round.shot_a.health');
        assert(round.shot_b.health == 0, 'round.shot_b.health');

        let duelist_a = tester::get_Duelist(world, OWNER());
        let duelist_b = tester::get_Duelist(world, OTHER());
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 1, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 1, 'duelist_b.total_draws');
        assert(duelist_a.score.total_wins == 0, 'duelist_a.total_wins');
        assert(duelist_b.score.total_wins == 0, 'duelist_b.total_wins');
        assert(duelist_a.score.total_losses == 0, 'duelist_a.total_losses');
        assert(duelist_b.score.total_losses == 0, 'duelist_b.total_losses');
        assert(duelist_a.score.honour == (action_a * 10).try_into().unwrap(), 'duelist_a.score.honour');
        assert(duelist_b.score.honour == (action_b * 10).try_into().unwrap(), 'duelist_b.score.honour');

        let mut scoreboard_a = tester::get_Scoreboard(world, TABLE_ID, OWNER());
        let mut scoreboard_b = tester::get_Scoreboard(world, TABLE_ID, OTHER());
        assert(duelist_a.score.total_duels == scoreboard_a.score.total_duels, 'scoreboard_a.total_duels');
        assert(duelist_b.score.total_duels == scoreboard_b.score.total_duels, 'scoreboard_b.total_duels');
        assert(duelist_a.score.honour == scoreboard_a.score.honour, 'scoreboard_a.score.honour');
        assert(duelist_b.score.honour == scoreboard_b.score.honour, 'scoreboard_b.score.honour');

        tester::assert_balance(lords, system.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        tester::assert_balance(lords, TREASURY(), 0, 0, fee * 2, 'balance_treasury_2');
        tester::assert_balance(lords, OWNER(), balance_a, fee, 0, 'balance_a_2');
        tester::assert_balance(lords, OTHER(), balance_b, fee, 0, 'balance_b_2');
    }

    #[test]
    fn test_resolved_table_collector() {
        let (world, system, _admin, lords, _minter) = tester::setup_world(flags::ACTIONS | flags::LORDS | flags::APPROVE);

        let mut table: TableConfig = get!(world, (TABLE_ID), TableConfig);
        table.fee_collector_address = BUMMER();
        tester::set_TableConfig(world, system, table);

        let fee: u128 = system.calc_fee(TABLE_ID, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');

        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        tester::assert_balance(lords, system.contract_address, 0, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(lords, table.fee_collector_address, 0, 0, 0, 'balance_colelctor_1');
        tester::assert_balance(lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Draw, 'challenge.state');

        tester::assert_balance(lords, system.contract_address, 0, 0, 0, 'balance_contract_2');
        tester::assert_balance(lords, table.fee_collector_address, 0, 0, fee * 2, 'balance_collector_2');
        tester::assert_balance(lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');
    }

    #[test]
    fn test_dual_crit_to_trickster_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        // A is a trickster, will shoot first
        // let mut duelist_a = tester::get_Duelist(world, OWNER());
        // duelist_a.score.level_trickster = honour::MAX;
        let mut scoreboard_a = tester::get_Scoreboard(world, TABLE_ID, OWNER());
        scoreboard_a.score.level_trickster = honour::MAX;
        tester::set_Scoreboard(world, system, scoreboard_a);
        // duel!
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state');
        assert(challenge.winner == 1, 'challenge.winner');
    }

    #[test]
    fn test_dual_crit_to_trickster_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        // A is a trickster, will shoot first
        // let mut duelist_b = tester::get_Duelist(world, OTHER());
        // duelist_b.score.level_trickster = honour::MAX;
        let mut scoreboard_b = tester::get_Scoreboard(world, TABLE_ID, OTHER());
        scoreboard_b.score.level_trickster = honour::MAX;
        tester::set_Scoreboard(world, system, scoreboard_b);
        // duel!
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state');
        assert(challenge.winner == 2, 'challenge.winner');
    }

    #[test]
    fn test_early_crit() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(9, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state');
        assert(challenge.winner == 1, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished, 'round.state');
        assert(round.shot_a.health == constants::FULL_HEALTH, 'round.shot_a.health');
        assert(round.shot_b.health == 0, 'round.shot_b.health');
    }

    #[test]
    fn test_late_crit() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 9);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state');
        assert(challenge.winner == 2, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Finished, 'round.state');
        assert(round.shot_a.health == 0, 'round.shot_a.health');
        assert(round.shot_b.health == constants::FULL_HEALTH, 'round.shot_b.health');
    }

    #[test]
    fn test_dual_hit() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(3, 3);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress, 'challenge.state');
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
    fn test_dual_hit_penalty_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(3, 2);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress, 'challenge.state');
        let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
        assert(round1.shot_a.chance_hit < test_dual_hit_chance_hit_at_3_paces, 'round1.shot_a.chance_hit');
        assert(round1.shot_b.chance_hit > test_dual_hit_chance_hit_at_3_paces, 'round1.shot_b.chance_hit');
    }

    #[test]
    fn test_dual_hit_penalty_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit(2, 3);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress, 'challenge.state');
        let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
        assert(round1.shot_a.chance_hit > test_dual_hit_chance_hit_at_3_paces, 'round1.shot_a.chance_hit');
        assert(round1.shot_b.chance_hit < test_dual_hit_chance_hit_at_3_paces, 'round1.shot_b.chance_hit');
    }

    // #[test]
    // fn test_dual_hit_find() {
    //     let mut salt: u64 = 0x324ffd23;
    //     loop {
    //         salt.print();
    //         let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
    //         let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
    //         let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_hit_find(3, 3, salt);
    //         tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
    //         tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
    //         tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
    //         tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
    //         let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
    //         let round1: Round = tester::get_Round(world, challenge.duel_id, 1);
    //         if (
    //             challenge.state == ChallengeState::InProgress &&
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
    fn test_clamp_invalid_paces() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash_a: u64 = make_action_hash(0x111, 0);
        let hash_b: u64 = make_action_hash(0x222, 11);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, 0x111, 0, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, 0x222, 11, 0);
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(round.shot_a.action == 10, 'action_0');
        assert(round.shot_b.action == 10, 'action_11');
        assert(round.shot_a.chance_crit > 0, 'shot_a.chance_crit');
        assert(round.shot_b.chance_crit > 0, 'shot_b.chance_crit');
        assert(round.shot_a.dice_crit > 0, 'shot_a.dice_crit');
        assert(round.shot_b.dice_crit > 0, 'shot_b.dice_crit');
    }

    #[test]
    fn test_register_keep_scores() {
        // let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        // let duelist1: Duelist = tester::execute_mint_duelist(system, OWNER(), 'AAA', ProfilePicType::Duelist, '1', Archetype::Undefined);
        // let duelist2: Duelist = tester::execute_mint_duelist(system, OTHER(), 'AAA', ProfilePicType::Duelist, '1', Archetype::Undefined);
        // assert(duelist1.duelist_id == ID(OWNER()), 'invalid duelist_id_1');
        // assert(duelist2.duelist_id == ID(OTHER()), 'invalid duelist_id_2');
        // let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        // let hash_a: u64 = make_action_hash(0x111, 10);
        // let hash_b: u64 = make_action_hash(0x222, 1);
        // tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        // tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        // tester::execute_reveal_action(system, OWNER(), duel_id, 1, 0x111, 10, 0);

        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), WAGER_VALUE);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(9, 10);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state');

        let mut duelist_a_before = tester::get_Duelist_id(world, ID(OWNER()));
        assert(duelist_a_before.score.total_duels > 0, 'total_duels > 0');
        // validate by settign a timestamp
        duelist_a_before.timestamp = 1234;
        set!(world, (duelist_a_before.clone()));
        tester::execute_update_duelist_ID(system, OWNER(), ID(OWNER()), 'dssadsa', ProfilePicType::Duelist, '3');
        let duelist_a_after = tester::get_Duelist_id(world, ID(OWNER()));
        assert(duelist_a_before.duelist_id == duelist_a_after.duelist_id, 'duelist_id');
        assert(duelist_a_before.name != duelist_a_after.name, 'name');
        assert(duelist_a_before.profile_pic_uri != duelist_a_after.profile_pic_uri, 'profile_pic_uri');
        assert(duelist_a_before.timestamp == duelist_a_after.timestamp, 'timestamp');
        assert(duelist_a_before.score.total_duels == duelist_a_after.score.total_duels, 'total_duels');
        assert(duelist_a_before.score.total_wins == duelist_a_after.score.total_wins, 'total_wins');
        assert(duelist_a_before.score.total_losses == duelist_a_after.score.total_losses, 'total_losses');
        assert(duelist_a_before.score.total_draws == duelist_a_after.score.total_draws, 'total_draws');
        assert(duelist_a_before.score.honour == duelist_a_after.score.honour, 'honour');
    }    
    
    //-------------------------------
    // Commit/Revela Fails
    //

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_duelist() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hash: u64 = make_action_hash(0x12121, 0x1);
        tester::execute_commit_action(system, someone_else, duel_id, 1, hash);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_address() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        // try to commmit with another account
        let hash: u64 = make_action_hash(0x12121, 0x1);
        tester::execute_commit_action(system, FAKE_OWNER_1_1(), duel_id, 1, hash);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid round number', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_round_number() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash: u64 = make_action_hash(0x12121, 0x1);
        tester::execute_commit_action(system, OWNER(), duel_id, 2, hash);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (_salt_a, _salt_b, _action_a, _action_b, hash_a, _hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (_salt_a, _salt_b, _action_a, _action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (salt_a, _salt_b, action_a, _action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (_salt_a, salt_b, _action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in commit', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_commit() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (_salt_a, _salt_b, _action_a, _action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_reveal() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (_salt_a, salt_b, _action_a, action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_not_started() {
        let (_world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 48);
        let (_salt_a, _salt_b, _action_a, _action_b, _hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_b);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_commit_challenge_finished_commit() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_finished_reveal() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_action_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, 0x111, 2, 0);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_a() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, 0x1111, 1, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_action_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, 0x222, 2, 0);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Action hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_b() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::APPROVE);
        let (_challenge, _round, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), 0);
        let hash_a: u64 = make_action_hash(0x111, 1);
        let hash_b: u64 = make_action_hash(0x222, 1);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_b);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_a);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, 0x2222, 1, 0);
    }

}
