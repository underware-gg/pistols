#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::challenge::{Round};
    use pistols::models::duelist::{Duelist};
    use pistols::models::table::{TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST};
    use pistols::types::duel_progress::{DuelProgress};
    use pistols::utils::timestamp::{timestamp};
    use pistols::tests::tester::{tester,
        tester::{
            IGameDispatcher, IGameDispatcherTrait,
            IDuelTokenDispatcher, IDuelTokenDispatcherTrait,
            Systems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
        }
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const PREMISE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = TABLES::LORDS;


    fn _assert_empty_progress(sys: Systems, duel_id: u128) {
        let progress: DuelProgress = sys.game.get_duel_progress(duel_id);
        assert(progress.winner == 0, 'progress.winner');
        assert(progress.steps.len() == 0, 'progress.steps.len()');
    }


    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_not_your_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        // BIG_BOY: u256.high + low > id != address
        let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000001>();
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, HIGH, OTHER(), PREMISE_1, TABLE_ID, 0);
    }

    // #[test]
    // #[should_panic(expected:('DUEL: Challenged unknown', 'ENTRYPOINT_FAILED'))]
    // fn test_invalid_challenged_unknown() {
    //     let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
    //     // fill u256.high, empty low > no owner > unknown
    //     let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000000>();
    //     let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), HIGH, PREMISE_1, TABLE_ID, 0);
    // }

    #[test]
    #[should_panic(expected:('DUEL: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OWNER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_address() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, LITTLE_BOY(), LITTLE_BOY(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenged null', 'ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_zero() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), ZERO(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1,TABLE_ID, 0);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists_from_challenged() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        tester::execute_create_duel(@sys.duels, OTHER(), OWNER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    fn test_challenge_to_address() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), BIG_BOY(), PREMISE_1, TABLE_ID, 0);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == BIG_BOY(), 'challenger');
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(ch.quote == PREMISE_1, 'quote');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_to_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == ZERO(), 'challenger');   // challenged an id, address is empty
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == ID(OTHER()), 'challenged_id');
        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_expire_ok() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let expire_hours: u64 = 24;
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, expire_hours);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == ch.timestamp_start + timestamp::from_hours(expire_hours), 'timestamp_end');
        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_address_pact() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        assert(sys.duels.get_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == 0, 'get_pact_0_1');
        assert(sys.duels.get_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == 0, 'get_pact_0_2');
        assert(sys.duels.has_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == false, 'has_pact_0_1');
        assert(sys.duels.has_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == false, 'has_pact_0_2');
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        assert(sys.duels.get_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == duel_id, 'get_pact_1_1');
        assert(sys.duels.get_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == duel_id, 'get_pact_1_2');
        assert(sys.duels.has_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == true, 'has_pact_1_1');
        assert(sys.duels.has_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == true, 'has_pact_1_2');
    }


    //-----------------------------------------
    // REPLY
    //

    #[test]
    #[should_panic(expected:('DUEL: Invalid challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_invalid() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_duel(@sys.duels, A, duel_id + 1, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenge not Awaiting', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_twice() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(3));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, duel_id, false);
        assert(new_state != ChallengeState::Awaiting, '!awaiting');
        tester::execute_reply_duel(@sys.duels, B, duel_id, true);
    }

    #[test]
    fn test_challenge_reply_expired_id() {
        let sys = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLES::COMMONERS, 24);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);

        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_date(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, duel_id, true);
        assert(new_state == ChallengeState::Expired, 'expired');
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_no');

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start > 0, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_reply_expired_address() {
        let sys = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, A, ID(ID_A), B, PREMISE_1, TABLES::COMMONERS, 24);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(ID_A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false');
        
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_date(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_duel_ID(@sys.duels, B, ID(ID_B), duel_id, false);
        assert(new_state == ChallengeState::Expired, 'expired');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_still');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Reply self', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_owner_accept_self() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);

        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_duel(@sys.duels, A, duel_id, true);
    }

    #[test]
    fn test_challenge_owner_cancel() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));

        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, duel_id, false);
        assert(new_state == ChallengeState::Withdrawn, 'canceled');
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_no');

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_impersonator() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_duel(@sys.duels, BUMMER(), duel_id, false);
    }

    #[test]
    fn test_challenge_other_refuse_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == ZERO(), 'challenged');
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == ID(B), 'challenged_id'); // challenged an address, id is empty
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');

        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_no');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_other_refuse_address() {
        let sys = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, A, ID(ID_A), B, PREMISE_1, TABLES::COMMONERS, 48);

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
// ch.address_a.print();
// ch.address_b.print();
// ch.duelist_id_a.print();
// ch.duelist_id_b.print();
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(ID_A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false');

        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_duel_ID(@sys.duels, B, ID(ID_B), duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_still');

        _assert_empty_progress(sys, duel_id);
    }



    //-----------------------------------------
    // ACCEPT CHALLENGE
    //

    #[test]
    fn test_challenge_accept_to_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        assert(sys.duels.has_pact(TABLE_ID, ID(A), ID(B)) == false, 'has_pact_no_1');
        assert(sys.duels.has_pact(TABLE_ID, ID(B), ID(A)) == false, 'has_pact_no_2');

        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == ZERO(), 'challenger');   // challenged an id, address is empty
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == ID(B), 'challenged_id');

        // reply...
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_yes_1');
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes_2');

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 1, 'round_number');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        assert(ch.address_b == B, 'challenged');   // << UPDATED!!!
        
        let round = tester::get_RoundEntity(sys.world, duel_id, 1);
        assert(round.state == RoundState::Commit, 'round.state');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_accept_to_address() {
        let sys = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, A, ID(ID_A), B, PREMISE_1, TABLES::COMMONERS, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
// ch.address_a.print();
// ch.address_b.print();
// ch.duelist_id_a.print();
// ch.duelist_id_b.print();
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(ID_A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true_1');
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_addr_true_2');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_1');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_B), ID(ID_A)) == false, 'has_pact_id_false_2');
        // reply...
        let new_state: ChallengeState = tester::execute_reply_duel_ID(@sys.duels, B, ID(ID_B), duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(sys.duels.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false_1');
        assert(sys.duels.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_addr_false_2');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == true, 'has_pact_id_true_1');
        assert(sys.duels.has_pact(ch.table_id, ID(ID_B), ID(ID_A)) == true, 'has_pact_id_true_2');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.duelist_id_b == ID(ID_B), 'challenged_id_ok');   // << UPDATED!!!

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER(); // challenge a duelist
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_duel_ID(@sys.duels, B, 0xaaa, duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_player_address() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = LITTLE_BOY(); // challenge a wallet
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        // reply with different TOKEN ID
        // panic!
        let another_boy: ContractAddress = starknet::contract_address_const::<0xaaaa00000000000aa>();
        tester::execute_reply_duel(@sys.duels, another_boy, duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_player_duelist() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER(); // challenge a duelist
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_duel(@sys.duels, BUMMER(), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_reply_has_pact() {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = LITTLE_BOY(); // challenge a wallet
        // fund account
        tester::execute_lords_faucet(@sys.lords, B);
        tester::execute_lords_approve(@sys.lords, B, sys.game.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
        // new challenge
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, duel_id, true);
        // new challenge
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, duel_id, true);
    }

}
