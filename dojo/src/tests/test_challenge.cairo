#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{IActionsDispatcherTrait};
    use pistols::models::challenge::{Round};
    use pistols::models::duelist::{Duelist};
    use pistols::models::table::{tables};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::tests::tester::{tester, tester::{ZERO, OWNER, OTHER, BUMMER, TREASURY, BIG_BOY, LITTLE_BOY, ID}};

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = tables::LORDS;

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_not_your_duelist() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        // BIG_BOY: u256.high + low > id != address
        let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000001>();
        let _duel_id: u128 = tester::execute_create_challenge(system, HIGH, OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    // #[test]
    // #[should_panic(expected:('PISTOLS: Challenged unknown', 'ENTRYPOINT_FAILED'))]
    // fn test_invalid_challenged_unknown() {
    //     let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
    //     // fill u256.high, empty low > no owner > unknown
    //     let HIGH: ContractAddress = starknet::contract_address_const::<0x100000000000000000000000000000000000000>();
    //     let _duel_id: u128 = tester::execute_create_challenge(system, OWNER(), HIGH, MESSAGE_1, TABLE_ID, 0, 0);
    // }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_duelist() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let _duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OWNER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self_address() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let _duel_id: u128 = tester::execute_create_challenge(system, LITTLE_BOY(), LITTLE_BOY(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenged null', 'ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_zero() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let _duel_id: u128 = tester::execute_create_challenge(system, OWNER(), ZERO(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);
        tester::execute_register_duelist(system, OTHER(), OTHER_NAME, 1);
        tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1,TABLE_ID, 0, 0);
        tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_exists_from_challenged() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);
        tester::execute_register_duelist(system, OTHER(), OTHER_NAME, 1);
        tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        tester::execute_create_challenge(system, OTHER(), OWNER(), MESSAGE_1, TABLE_ID, 0, 0);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid expiry', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_expiry() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let expire_seconds: u64 = 60 * 60 - 1;
        let _duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
    }

    #[test]
    fn test_challenge_to_address() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), BIG_BOY(), MESSAGE_1, TABLE_ID, 0, 0);
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
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
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == ZERO(), 'challenger');   // challenged an id, address is empty
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == ID(OTHER()), 'challenged_id');
    }

    #[test]
    fn test_challenge_expire_ok() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        let expire_seconds: u64 = 24 * 60 * 60;
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == ch.timestamp_start + expire_seconds, 'timestamp_end');
    }

    #[test]
    fn test_challenge_address_pact() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);
        assert(system.get_pact(ID(OWNER()), ID(OTHER())) == 0, 'get_pact_0_1');
        assert(system.get_pact(ID(OTHER()), ID(OWNER())) == 0, 'get_pact_0_2');
        assert(system.has_pact(ID(OWNER()), ID(OTHER())) == false, 'has_pact_0_1');
        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == false, 'has_pact_0_2');
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, 0);
        assert(system.get_pact(ID(OWNER()), ID(OTHER())) == duel_id, 'get_pact_1_1');
        assert(system.get_pact(ID(OTHER()), ID(OWNER())) == duel_id, 'get_pact_1_2');
        assert(system.has_pact(ID(OWNER()), ID(OTHER())) == true, 'has_pact_1_1');
        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == true, 'has_pact_1_2');
    }


    //-----------------------------------------
    // REPLY
    //

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid Challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_invalid() {
        let (_world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, OWNER(), duel_id + 1, true);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Wrong Challenge state', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_twice() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(3));
        let new_state: ChallengeState = tester::execute_reply_challenge(system, OTHER(), duel_id, false);
        assert(new_state != ChallengeState::Awaiting, '!awaiting');
        
        tester::execute_reply_challenge(system, OTHER(), duel_id, true);
    }

    #[test]
    fn test_challenge_reply_expired() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);

        let expire_seconds: u64 = timestamp::from_days(1);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);

        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == true, 'has_pact_yes');
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_date(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_challenge(system, OWNER(), duel_id, true);
        assert(new_state == ChallengeState::Expired, 'expired');
        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == false, 'has_pact_no');

        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == new_state.into(), 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start > 0, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your Challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_owner_accept_self() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);

        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, OWNER(), duel_id, true);
    }

    #[test]
    fn test_challenge_owner_cancel() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));

        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == true, 'has_pact_yes');
        let new_state: ChallengeState = tester::execute_reply_challenge(system, OWNER(), duel_id, false);
        assert(new_state == ChallengeState::Withdrawn, 'canceled');
        assert(system.has_pact(ID(OWNER()), ID(OTHER())) == false, 'has_pact_no');

        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == new_state.into(), 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your Challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_impersonator() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);
        tester::execute_register_duelist(system, OTHER(), OTHER_NAME, 2);
        tester::execute_register_duelist(system, BUMMER(), 'impersonator', 3);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);
        let _ch = tester::get_Challenge(world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, BUMMER(), duel_id, false);
    }

    #[test]
    fn test_challenge_other_refuse() {
        let (world, system, _admin, _lords) = tester::setup_world(true, false, false, true, true);
        tester::execute_register_duelist(system, OWNER(), PLAYER_NAME, 1);
        tester::execute_register_duelist(system, OTHER(), OTHER_NAME, 2);

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, TABLE_ID, 0, expire_seconds);

        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == true, 'has_pact_yes');
        let (_block_number, timestamp) = tester::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_challenge(system, OTHER(), duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        assert(system.has_pact(ID(OTHER()), ID(OWNER())) == false, 'has_pact_no');

        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == new_state.into(), 'state');
        assert(ch.round_number == 0, 'round_number');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
    }

    //-----------------------------------------
    // ACCEPT CHALLENGE
    //
    // at test_duel.cairo
    //
}
