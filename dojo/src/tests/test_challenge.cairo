#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{WorldStorage};

    use pistols::models::{
        challenge::{Challenge, ChallengeTrait, ChallengeValue},
        player::{Player, PlayerTrait},
        challenge::{Round},
        duelist::{Duelist},
        table::{TABLES},
    };
    use pistols::types::cards::hand::{DeckType, DeckTypeTrait};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST};
    use pistols::types::duel_progress::{DuelProgress};
    use pistols::utils::timestamp::{TimestampTrait};
    use pistols::tests::tester::{tester,
        tester::{
            IGameDispatcher, IGameDispatcherTrait,
            IDuelTokenDispatcher, IDuelTokenDispatcherTrait,
            TestSystems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY, FAKE_OWNER_OF_1, OWNED_BY_OWNER,
        }
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const PREMISE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = TABLES::PRACTICE;


    fn _assert_empty_progress(sys: TestSystems, duel_id: u128) {
        let progress: DuelProgress = sys.game.get_duel_progress(duel_id);
        assert(progress.winner == 0, 'progress.winner');
        assert(progress.steps.len() == 0, 'progress.steps.len()');
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_not_your_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, FAKE_OWNER_OF_1(), OTHER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OWNER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenged null', 'ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_zero() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), ZERO(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_pact_exists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel_ID(@sys.duels, OWNER(), ID(OWNER()), OTHER(), PREMISE_1,TABLE_ID, 0);
        tester::execute_create_duel_ID(@sys.duels, OWNER(), OWNED_BY_OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_pact_exists_from_challenged() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        tester::execute_create_duel(@sys.duels, OTHER(), OWNER(), PREMISE_1, TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_duelist_busy() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1,TABLE_ID, 0);
        tester::execute_create_duel(@sys.duels, OWNER(), BUMMER(), PREMISE_1,TABLE_ID, 0);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_duelist_busy_reply() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1,TABLE_ID, 0);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, BUMMER(), OWNER(), PREMISE_1,TABLE_ID, 0);
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, true);
    }

    #[test]
    fn test_challenge_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == OWNER(), 'challenged');
        assert(ch.address_b == OTHER(), 'challenger');
        assert(ch.duelist_id_a == ID(OWNER()), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        assert(ch.quote == PREMISE_1, 'quote');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        _assert_empty_progress(sys, duel_id);
        // deck type
        assert(tester::get_Challenge(sys.world, duel_id).get_deck_type() == DeckType::Classic, 'challenge.deck_type');
    }

    #[test]
    fn test_challenge_expire_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let expire_hours: u64 = 24;
        let timestamp = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, expire_hours);
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == ch.timestamp_start + TimestampTrait::from_hours(expire_hours), 'timestamp_end');
        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    fn test_challenge_pact() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        assert(sys.duels.get_pact(TABLE_ID, OWNER(), OTHER()) == 0, 'get_pact_0_1');
        assert(sys.duels.get_pact(TABLE_ID, OTHER(), OWNER()) == 0, 'get_pact_0_2');
        assert(sys.duels.has_pact(TABLE_ID, OWNER(), OTHER()) == false, 'has_pact_0_1');
        assert(sys.duels.has_pact(TABLE_ID, OTHER(), OWNER()) == false, 'has_pact_0_2');
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, TABLE_ID, 0);
        assert(sys.duels.get_pact(TABLE_ID, OWNER(), OTHER()) == duel_id, 'get_pact_1_1');
        assert(sys.duels.get_pact(TABLE_ID, OTHER(), OWNER()) == duel_id, 'get_pact_1_2');
        assert(sys.duels.has_pact(TABLE_ID, OWNER(), OTHER()) == true, 'has_pact_1_1');
        assert(sys.duels.has_pact(TABLE_ID, OTHER(), OWNER()) == true, 'has_pact_1_2');
    }


    //-----------------------------------------
    // REPLY
    //

    #[test]
    #[should_panic(expected:('DUEL: Invalid challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        tester::elapse_timestamp(TimestampTrait::from_days(1));
        tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id + 1, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenge not Awaiting', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeValue(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(TimestampTrait::from_days(3));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, false);
        assert(new_state != ChallengeState::Awaiting, '!awaiting');
        tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, true);
    }

    #[test]
    fn test_challenge_reply_expired() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLES::PRACTICE, 24);
        let ch = tester::get_ChallengeValue(sys.world, duel_id);

        tester::assert_pact(sys, duel_id, ch, true, false, "created");
        let (_block_number, timestamp) = tester::elapse_timestamp(TimestampTrait::from_datetime(1, 0, 1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id, true);
        assert(new_state == ChallengeState::Expired, 'expired');
        tester::assert_pact(sys, duel_id, ch, false, false, "replied");

        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start > 0, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Reply self', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_owner_accept_self() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeValue(sys.world, duel_id);

        tester::elapse_timestamp(TimestampTrait::from_days(1));
        tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id, true);
    }

    #[test]
    fn test_challenge_owner_cancel() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        let (_block_number, timestamp) = tester::elapse_timestamp(TimestampTrait::from_days(1));

        tester::assert_pact(sys, duel_id, ch, true, false, "created");
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id, false);
        assert(new_state == ChallengeState::Withdrawn, 'canceled');
        tester::assert_pact(sys, duel_id, ch, false, false, "withdrew");

        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');

        _assert_empty_progress(sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_impersonator() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        let _ch = tester::get_ChallengeValue(sys.world, duel_id);
        let (_block_number, _timestamp) = tester::elapse_timestamp(TimestampTrait::from_days(1));
        tester::execute_reply_duel(@sys.duels, BUMMER(), ID(BUMMER()), duel_id, false);
    }

    #[test]
    fn test_challenge_other_refuse_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLES::PRACTICE, 48);

        let ch = tester::get_ChallengeValue(sys.world, duel_id);
// ch.address_a.print();
// ch.address_b.print();
// ch.duelist_id_a.print();
// ch.duelist_id_b.print();
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        tester::assert_pact(sys, duel_id, ch, true, false, "created");

        let (_block_number, timestamp) = tester::elapse_timestamp(TimestampTrait::from_days(1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, false);
        assert(new_state == ChallengeState::Refused, 'refused');
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.state == new_state, 'state');
        assert(ch.winner == 0, 'winner');
        assert(ch.timestamp_start < timestamp, 'timestamp_start');
        assert(ch.timestamp_end == timestamp, 'timestamp_end');
        tester::assert_pact(sys, duel_id, ch, false, false, "replied");

        _assert_empty_progress(sys, duel_id);
    }



    //-----------------------------------------
    // ACCEPT CHALLENGE
    //

    #[test]
    fn test_challenge_accept_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();

        // players not registered
        let player_a: Player = tester::get_Player(sys.world, A);
        let player_b: Player = tester::get_Player(sys.world, B);
        assert(!player_a.exists(), 'player_a.exists NOT');
        assert(!player_b.exists(), 'player_b.exists NOT');

        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLES::PRACTICE, 48);
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
// ch.address_a.print();
// ch.address_b.print();
// ch.duelist_id_a.print();
// ch.duelist_id_b.print();
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.address_a == A, 'challenger');
        assert(ch.address_b == B, 'challenged');
        assert(ch.duelist_id_a == ID(A), 'challenger_id');
        assert(ch.duelist_id_b == 0, 'challenged_id'); // challenged an address, id is empty
        tester::assert_pact(sys, duel_id, ch, true, false, "created");
        // reply...
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        let ch = tester::get_ChallengeValue(sys.world, duel_id);
        assert(ch.duelist_id_b == ID(B), 'challenged_id_ok');   // << UPDATED!!!
        tester::assert_pact(sys, duel_id, ch, true, true, "replied");

        _assert_empty_progress(sys, duel_id);

        // players registered automatically
        let player_a: Player = tester::get_Player(sys.world, A);
        let player_b: Player = tester::get_Player(sys.world, B);
        assert(player_a.exists(), 'player_a.exists YES');
        assert(player_b.exists(), 'player_b.exists YES');
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_duel(@sys.duels, B, 0xaaa, duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, TABLE_ID, 48);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_duel(@sys.duels, BUMMER(), ID(BUMMER()), duel_id, true);
    }

}
