#[cfg(test)]
mod tests {
    use pistols::models::{
        challenge::{ChallengeTrait, DuelType},
        player::{Player, PlayerTrait},
    };
    use pistols::types::{
        cards::hand::{DeckType},
        challenge_state::{ChallengeState},
        duel_progress::{DuelProgress},
        timestamp::{TimestampTrait, TIMESTAMP},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            IDuelTokenDispatcherTrait,
            ID, ZERO, OWNER, OTHER, BUMMER, FAKE_OWNER_OF_1, OWNED_BY_OWNER,
        }
    };

    const PREMISE_1: felt252 = 'For honour!!!';


    fn _assert_empty_progress(sys: @TestSystems, duel_id: u128) {
        let progress: DuelProgress = (*sys.game).get_duel_progress(duel_id);
        assert_eq!(progress.winner, 0, "progress.winner");
        assert_eq!(progress.steps.len(), 0, "progress.steps.len()");
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_not_your_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, FAKE_OWNER_OF_1(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenged self', 'ENTRYPOINT_FAILED'))]
    fn test_invalid_challenged_self() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OWNER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Invalid duelist', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_invalid_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel_ID(@sys.duels, OWNER(), 0, OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_pact_exists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel_ID(@sys.duels, OWNER(), ID(OWNER()), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_create_duel_ID(@sys.duels, OWNER(), OWNED_BY_OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Pact exists', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_pact_exists_from_challenged() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_create_duel(@sys.duels, OTHER(), OWNER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_pact_over_duel_type() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Practice, 0, 1);
        // do not work because they are already in a duel
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_duelist_busy() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_create_duel(@sys.duels, OWNER(), BUMMER(), PREMISE_1, DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_duelist_busy_reply() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, BUMMER(), OWNER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OWNER(), ID(OWNER()), duel_id, true);
    }

    #[test]
    fn test_challenge_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let timestamp: u64 = tester::get_block_timestamp();
        let game_timestamp = sys.game.get_timestamp();
        assert_gt!(timestamp, 0, "timestamp > 0");
        assert_eq!(timestamp, game_timestamp, "game_timestamp");
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Awaiting, "state");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, OTHER(), "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_eq!(ch.duelist_id_b, 0, "challenged_id"); // challenged an address, id is empty
        assert_eq!(ch.quote, PREMISE_1, "quote");
        assert_eq!(ch.lives_staked, 1, "lives_staked");
        assert_eq!(ch.season_id, 0, "season_id_ZERO");
        assert_eq!(ch.timestamps.start, timestamp, "timestamps.start");
        assert_eq!(ch.timestamps.end, timestamp + TIMESTAMP::ONE_DAY, "timestamps.end");
        _assert_empty_progress(@sys, duel_id);
        let game_timestamp = sys.game.get_timestamp();
        assert_gt!(game_timestamp, ch.timestamps.start, "game_timestamp > timestamps.start");
        // deck type
        assert_eq!(sys.store.get_challenge(duel_id).get_deck_type(), DeckType::Classic, "challenge.deck_type");
        // token_uri
        assert_ne!(sys.duels.token_uri(duel_id.into()), "", "duels.token_uri()");
    }

    #[test]
    fn test_challenge_stake_0() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 0);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.lives_staked, 1, "lives_staked");
    }

    #[test]
    fn test_challenge_stake_2() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 2);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.lives_staked, 2, "lives_staked");
    }

    #[test]
    fn test_challenge_expire_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let expire_hours: u64 = 24;
        let timestamp: u64 = tester::get_block_timestamp();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.timestamps.start, timestamp, "timestamps.start");
        assert_eq!(ch.timestamps.end, ch.timestamps.start + TimestampTrait::from_hours(expire_hours), "timestamps.end");
        _assert_empty_progress(@sys, duel_id);
    }

    #[test]
    fn test_challenge_pact() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_type: DuelType = DuelType::Seasonal;
        assert_eq!(sys.duels.get_pact(duel_type, OWNER(), OTHER()), 0, "get_pact_0_1");
        assert_eq!(sys.duels.get_pact(duel_type, OTHER(), OWNER()), 0, "get_pact_0_2");
        assert!(!sys.duels.has_pact(duel_type, OWNER(), OTHER()), "has_pact_0_1");
        assert!(!sys.duels.has_pact(duel_type, OTHER(), OWNER()), "has_pact_0_2");
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, duel_type, 0, 1);
        assert_eq!(sys.duels.get_pact(duel_type, OWNER(), OTHER()), duel_id, "get_pact_1_1");
        assert_eq!(sys.duels.get_pact(duel_type, OTHER(), OWNER()), duel_id, "get_pact_1_2");
        assert!(sys.duels.has_pact(duel_type, OWNER(), OTHER()), "has_pact_1_1");
        assert!(sys.duels.has_pact(duel_type, OTHER(), OWNER()), "has_pact_1_2");
        // not affecting other types...
        let another_type: DuelType = DuelType::Practice;
        assert!(!sys.duels.has_pact(another_type, OWNER(), OTHER()), "has_pact_0_1");
        assert!(!sys.duels.has_pact(another_type, OTHER(), OWNER()), "has_pact_0_2");
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
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours - 1));
        tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id + 1, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Challenge not Awaiting', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        // let _ch = sys.store.get_challenge_value(duel_id);
        let (_block_number, _timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours + 1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, false);
        assert_ne!(new_state, ChallengeState::Awaiting, "!awaiting");
        tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, true);
    }

    #[test]
    fn test_challenge_reply_expired() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 24;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);

        tester::assert_pact(@sys, duel_id, ch, true, false, "created");
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let (_block_number, timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours));
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id, true);
        assert_eq!(new_state, ChallengeState::Expired, "expired");
        tester::assert_pact(@sys, duel_id, ch, false, false, "replied");

        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, new_state, "state");
        assert_eq!(ch.winner, 0, "winner");
        assert_eq!(ch.season_id, sys.store.get_current_season_id(), "season_id");
        assert_gt!(ch.timestamps.start, 0, "timestamps.start");
        assert_eq!(ch.timestamps.end, timestamp, "timestamps.end");

        _assert_empty_progress(@sys, duel_id);
    }

    #[test]
    fn test_challenge_collect_expired() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 24;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);

        tester::assert_pact(@sys, duel_id, ch, true, false, "created");
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let (_block_number, timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours));
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");

        tester::execute_collect_duel(@sys.game, A, duel_id);
        tester::assert_pact(@sys, duel_id, ch, false, false, "collected");

        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Expired, "i");
        assert_eq!(ch.winner, 0, "winner");
        assert_eq!(ch.season_id, sys.store.get_current_season_id(), "season_id");
        assert_gt!(ch.timestamps.start, 0, "timestamps.start");
        assert_eq!(ch.timestamps.end, timestamp, "timestamps.end");

        _assert_empty_progress(@sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge is active', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_collect_expired_in_progress() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 24;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);

        tester::assert_pact(@sys, duel_id, ch, true, false, "created");
        let (_block_number, _timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours) - 1);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");

        tester::execute_collect_duel(@sys.game, A, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Reply self', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_owner_accept_self() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);
        // let _ch: ChallengeValue = sys.store.get_challenge_value(duel_id);

        tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours - 1));
        tester::execute_reply_duel(@sys.duels, A, ID(A), duel_id, true);
    }

    #[test]
    fn test_challenge_owner_withdraw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        let (_block_number, timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours - 1));

        tester::assert_pact(@sys, duel_id, ch, true, false, "created");
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, A, 0, duel_id, false);
        assert_eq!(new_state, ChallengeState::Withdrawn, "canceled");
        tester::assert_pact(@sys, duel_id, ch, false, false, "withdrew");

        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, new_state, "state");
        assert_eq!(ch.winner, 0, "winner");
        assert_eq!(ch.season_id, sys.store.get_current_season_id(), "season_id");
        assert_lt!(ch.timestamps.start, timestamp, "timestamps.start");
        assert_eq!(ch.timestamps.end, timestamp, "timestamps.end");

        _assert_empty_progress(@sys, duel_id);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_impersonator() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        // let _ch = sys.store.get_challenge_value(duel_id);
        let (_block_number, _timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours - 1));
        tester::execute_reply_duel(@sys.duels, BUMMER(), ID(BUMMER()), duel_id, false);
    }

    #[test]
    fn test_challenge_other_refuse_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);

        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Awaiting, "state");
        assert_eq!(ch.address_a, A, "challenger");
        assert_eq!(ch.address_b, B, "challenged");
        assert_eq!(ch.duelist_id_a, ID(A), "challenger_id");
        assert_eq!(ch.duelist_id_b, 0, "challenged_id"); // challenged an address, id is empty
        tester::assert_pact(@sys, duel_id, ch, true, false, "created");

        let (_block_number, timestamp) = tester::elapse_block_timestamp(TimestampTrait::from_hours(expire_hours - 1));
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, false);
        assert_eq!(new_state, ChallengeState::Refused, "refused");
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, new_state, "state");
        assert_eq!(ch.winner, 0, "winner");
        assert_eq!(ch.season_id, sys.store.get_current_season_id(), "season_id");
        assert_lt!(ch.timestamps.start, timestamp, "timestamps.start");
        assert_eq!(ch.timestamps.end, timestamp, "timestamps.end");
        tester::assert_pact(@sys, duel_id, ch, false, false, "replied");

        _assert_empty_progress(@sys, duel_id);
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
        let player_a: Player = sys.store.get_player(A);
        let player_b: Player = sys.store.get_player(B);
        assert!(!player_a.exists(), "player_a.exists NOT");
        assert!(!player_b.exists(), "player_b.exists NOT");

        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Practice, expire_hours, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Awaiting, "state");
        assert_eq!(ch.address_a, A, "challenger");
        assert_eq!(ch.address_b, B, "challenged");
        assert_eq!(ch.duelist_id_a, ID(A), "challenger_id");
        assert_eq!(ch.duelist_id_b, 0, "challenged_id"); // challenged an address, id is empty
        assert_eq!(ch.season_id, 0, "season_id_ZERO");
        tester::assert_pact(@sys, duel_id, ch, true, false, "created");
        // reply...
        let new_state: ChallengeState = tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, true);
        assert_eq!(new_state, ChallengeState::InProgress, "in_progress");
        assert_eq!(ch.season_id, 0, "season_id_STILL_ZERO");
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.duelist_id_b, ID(B), "challenged_id_ok");   // << UPDATED!!!
        tester::assert_pact(@sys, duel_id, ch, true, true, "replied");

        _assert_empty_progress(@sys, duel_id);

        // players registered automatically
        let player_a: Player = sys.store.get_player(A);
        let player_b: Player = sys.store.get_player(B);
        assert!(player_a.exists(), "player_a.exists YES");
        assert!(player_b.exists(), "player_b.exists YES");

        // token_uri
        assert_ne!(sys.duels.token_uri(duel_id.into()), "", "duels.token_uri()");
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_reply_wrong_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
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
        let expire_hours: u64 = 48;
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, B, PREMISE_1, DuelType::Seasonal, expire_hours, 1);
        // reply with different TOKEN ID
        // panic!
        tester::execute_reply_duel(@sys.duels, BUMMER(), ID(BUMMER()), duel_id, true);
    }


    //-----------------------------------------
    // open challenges (matchmaking)
    //

    #[test]
    fn test_open_challenge_OK() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A = OWNER();
        let B = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, A, ZERO(), PREMISE_1, DuelType::Seasonal, 0, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Awaiting, "state");
        assert_eq!(ch.address_a, A, "challenger");
        assert_eq!(ch.duelist_id_a, ID(A), "challenger_id");
        assert_eq!(ch.address_b, ZERO(), "challenged_ZERO");
        assert_eq!(ch.duelist_id_b, 0, "challenged_id_ZERO");
        tester::execute_reply_duel(@sys.duels, B, ID(B), duel_id, true);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "state");
        assert_eq!(ch.address_b, B, "challenged");
        assert_eq!(ch.duelist_id_b, ID(B), "challenged_id");
        assert_eq!(ch.season_id, 0, "season_id_ZERO");
        tester::assert_pact(@sys, duel_id, ch, true, true, "replied");
        // token_uri
        assert_ne!(sys.duels.token_uri(duel_id.into()), "", "duels.token_uri()");
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_open_challenge_cant_refuse() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), ZERO(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), ID(OTHER()), duel_id, false);
    }

    #[test]
    #[should_panic(expected:('DUEL: Invalid duelist', 'ENTRYPOINT_FAILED'))]
    fn test_open_challenge_invalid_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), ZERO(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), 0, duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_open_challenge_pact_exists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        let duel_id: u128  = tester::execute_create_duel(@sys.duels, OWNER(), ZERO(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), ID(OTHER()), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_open_challenge_duelist_busy() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), ID(OTHER()), duel_id, true);
        let duel_id: u128  = tester::execute_create_duel(@sys.duels, BUMMER(), ZERO(), PREMISE_1, DuelType::Seasonal, 0, 1);
        tester::execute_reply_duel(@sys.duels, OTHER(), ID(OTHER()), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Invalid duel type', 'ENTRYPOINT_FAILED'))]
    fn test_tutorial_on_production() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), PREMISE_1, DuelType::Tutorial, 0, 1);
    }

}
