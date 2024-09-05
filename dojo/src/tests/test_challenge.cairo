#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{IActionsDispatcherTrait};
    use pistols::models::challenge::{Round};
    use pistols::models::duelist::{Duelist};
    use pistols::models::table::{TABLES};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::constants::{CONST};
    use pistols::utils::timestamp::{timestamp};
    use pistols::tests::tester::{tester,
        tester::{
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
        }
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = TABLES::LORDS;

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_not_your_duelist() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        // BIG_BOY: u256.high + low > id != address
        let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000001>();
        let _duel_id: u128 = tester::execute_create_challenge(@sys.actions, HIGH, OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    // #[test]
    // #[should_panic(expected:('PISTOLS: Challenged unknown', 'ENTRYPOINT_FAILED'))]
    // fn test_invalid_challenged_unknown() {
    //     let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
    //     // fill u256.high, empty low > no owner > unknown
    //     let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000000>();
    //     let _duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), HIGH, MESSAGE_1, TABLE_ID, 0, 0);
    // }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_duelist() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), OWNER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_address() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_challenge(@sys.actions, LITTLE_BOY(), LITTLE_BOY(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged null', 'ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_zero() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), ZERO(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1,TABLE_ID, 0, 0);
        tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists_from_challenged() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        tester::execute_create_challenge(@sys.actions, OTHER(), OWNER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    fn test_challenge_to_address() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), BIG_BOY(), MESSAGE_1, TABLE_ID, 0, 0);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == BIG_BOY(), 'challenger');
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(ch.message == MESSAGE_1, 'message');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
    }

    #[test]
    fn test_challenge_to_duelist() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == ZERO(), 'challenger');   // challenged an id, address is empty
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == ID(OTHER()), 'challenged_id');
    }

    #[test]
    fn test_challenge_expire_ok() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let expire_hours: u64 = 24;
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_hours);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == ch.timestamp_start + timestamp::from_hours(expire_hours), 'timestamp_end');
    }

    #[test]
    fn test_challenge_address_pact() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        assert(sys.actions.get_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == 0, 'get_pact_0_1');
        assert(sys.actions.get_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == 0, 'get_pact_0_2');
        assert(sys.actions.has_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == false, 'has_pact_0_1');
        assert(sys.actions.has_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == false, 'has_pact_0_2');
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        assert(sys.actions.get_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == duel_id, 'get_pact_1_1');
        assert(sys.actions.get_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == duel_id, 'get_pact_1_2');
        assert(sys.actions.has_pact(TABLE_ID, ID(OWNER()), ID(OTHER())) == true, 'has_pact_1_1');
        assert(sys.actions.has_pact(TABLE_ID, ID(OTHER()), ID(OWNER())) == true, 'has_pact_1_2');
    }


    //-----------------------------------------
    // REPLY
    //

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_invalid() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(@sys.actions, A, duel_id + 1, true);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Awaiting', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_twice() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(3));
        let new_state: ChallengeState = tester::execute_reply_challenge(@sys.actions, B, duel_id, false);
        assert(new_state != ChallengeState::Awaiting, '!awaiting');
        tester::execute_reply_challenge(@sys.actions, B, duel_id, true);
    }

    #[test]
    fn test_challenge_reply_expired_id() {
        let sys = tester::setup_world(FLAGS::ACTIONS);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLES::COMMONERS, 0, 24);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);

        assert(sys.actions.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_date(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_challenge(@sys.actions, A, duel_id, true);
        assert(new_state == ChallengeState::Expired, 'expired');
        assert(sys.actions.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_no');

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start > 0, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
    }

    #[test]
    fn test_challenge_reply_expired_address() {
        let sys = tester::setup_world(FLAGS::ACTIONS);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_challenge_ID(@sys.actions, A, ID(ID_A), B, MESSAGE_1, TABLES::COMMONERS, 0, 24);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(ID_A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(sys.actions.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true');
        assert(sys.actions.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false');
        
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_date(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_challenge_ID(@sys.actions, B, ID(ID_B), duel_id, false);
        assert(new_state == ChallengeState::Expired, 'expired');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.actions.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false');
        assert(sys.actions.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_still');

    }

    #[test]
    #[should_panic(expected:('PISTOLS: Reply self', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_owner_accept_self() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);

        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(@sys.actions, A, duel_id, true);
    }

    #[test]
    fn test_challenge_owner_cancel() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));

        assert(sys.actions.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');
        let new_state: ChallengeState = tester::execute_reply_challenge(@sys.actions, A, duel_id, false);
        assert(new_state == ChallengeState::Withdrawn, 'canceled');
        assert(sys.actions.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_no');

        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_impersonator() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let _ch = tester::get_ChallengeEntity(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(@sys.actions, BUMMER(), duel_id, false);
    }

    #[test]
    fn test_challenge_other_refuse_duelist() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, A, B, MESSAGE_1, TABLE_ID, 0, 48);
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == ZERO(), 'challenged');
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == ID(B), 'challenged_id'); // challenged an address, id is empty
        assert(sys.actions.has_pact(ch.table_id, ID(B), ID(A)) == true, 'has_pact_yes');

        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_challenge(@sys.actions, B, duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.actions.has_pact(ch.table_id, ID(B), ID(A)) == false, 'has_pact_no');
    }

    #[test]
    fn test_challenge_other_refuse_address() {
        let sys = tester::setup_world(FLAGS::ACTIONS);
        let A: ContractAddress = LITTLE_BOY();
        let B: ContractAddress = LITTLE_GIRL();
        let ID_A: ContractAddress = OWNED_BY_LITTLE_BOY();
        let ID_B: ContractAddress = OWNED_BY_LITTLE_GIRL();
        let duel_id: u128 = tester::execute_create_challenge_ID(@sys.actions, A, ID(ID_A), B, MESSAGE_1, TABLES::COMMONERS, 0, 48);

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
        assert(sys.actions.has_pact(ch.table_id, ID(A), ID(B)) == true, 'has_pact_addr_true');
        assert(sys.actions.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false');

        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_challenge_ID(@sys.actions, B, ID(ID_B), duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        let ch = tester::get_ChallengeEntity(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        assert(sys.actions.has_pact(ch.table_id, ID(A), ID(B)) == false, 'has_pact_addr_false');
        assert(sys.actions.has_pact(ch.table_id, ID(ID_A), ID(ID_B)) == false, 'has_pact_id_false_still');
    }

    //-----------------------------------------
    // ACCEPT CHALLENGE
    //
    // at test_duel.cairo
    //
}
