#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{Challenge, ChallengeValue, DuelType, Round},
        duelist::{DuelistAssignment, Archetype},
        matches::{
            QueueId, QueueMode,
            MatchQueue,
            MatchPlayer,
            MATCHMAKER,
        },
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, BotKey},
        timestamp::{TIMESTAMP},
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            IDuelTokenProtectedDispatcherTrait,
            IBotPlayerDispatcherTrait,
            IRngMockDispatcherTrait,
            FLAGS, SEASON_ID_1, ID,
            OWNER, OTHER, BUMMER, SPENDER, TREASURY,
            OWNED_BY_OWNER, OWNED_BY_OTHER,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{MockedValueTrait, PlayerMoves}
    };
    use pistols::tests::test_bot_player::tests::{_get_bot_moves_crit_a};
    use pistols::utils::address::{ContractAddressDisplay};
    use pistols::utils::arrays::{ArrayTestUtilsTrait};

    fn _get_moves_for_winner(sys: @TestSystems, winner: u8, is_bot: bool) -> (PlayerMoves, PlayerMoves) {
        let (mocked, moves_a, moves_b) = if (is_bot) {
            assert_eq!(winner, 1, "BOT CANNOT WIN NOW..");
            _get_bot_moves_crit_a(Archetype::Undefined)
        } else {
            prefabs::get_moves_for_winner(winner)
        };
        (*sys.rng).mock_values(mocked);
        (moves_a, moves_b)
    }
    fn _mock_slot(sys: @TestSystems, slot: u8) {
        (*sys.rng).mock_values([MockedValueTrait::new('queue_slot', slot.into())].span());
    }

    fn _assert_matchmaking_duel_started(sys: @TestSystems,
        duel_id: u128, queue_id: QueueId,
        address_a: ContractAddress, duelist_id_a: u128,
        address_b: ContractAddress, duelist_id_b: u128,
        prefix: ByteArray,
    ) {
        assert_ne!(duel_id, 0, "[{}] duel_id", prefix);
        let (ch, round) = tester::get_Challenge_Round_value(sys, duel_id);
        let is_bot: bool = (ch.address_b == (*sys.bot_player).contract_address);
        assert_eq!(ch.duel_type, if(queue_id==QueueId::Ranked){DuelType::MatchMake}else{DuelType::Unranked}, "[{}] duel_type", prefix);
        assert_eq!(ch.state, ChallengeState::InProgress, "[{}] ch.state", prefix);
        assert_eq!(round.state, RoundState::Commit, "[{}] round.state", prefix);
        assert_eq!(ch.address_a, address_a, "[{}] ch.address_a", prefix);
        assert_eq!(ch.address_b, address_b, "[{}] ch.address_b", prefix);
        assert_eq!(ch.duelist_id_a, duelist_id_a, "[{}] ch.duelist_id_a", prefix);
        if (!is_bot) {
            // player duelist
            assert_eq!(ch.duelist_id_b, duelist_id_b, "[{}] ch.duelist_id_b", prefix);
        } else {
            // bot duelist
            let duelist_profile: DuelistProfile = sys.store.get_duelist(ch.duelist_id_b).duelist_profile;
            assert_eq!(duelist_profile, DuelistProfile::Bot(BotKey::Pro), "[{}] bot_duelist_profile", prefix);
        }
        // pact and assignment set
        tester::assert_pact(sys, duel_id, true, true, prefix.clone());
        let assignment_a: DuelistAssignment = (*sys.store).get_duelist_assignment(ch.duelist_id_a);
        let assignment_b: DuelistAssignment = (*sys.store).get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment_a.queue_id, queue_id, "[{}] assignment_a.queue_id", prefix);
        assert_eq!(assignment_b.queue_id, queue_id, "[{}] assignment_b.queue_id", prefix);
        // MatchPlayer
        let match_player_a: MatchPlayer = sys.store.get_match_player(address_a);
        assert_eq!(match_player_a.duel_id, duel_id, "[{}] match_player_a.duel_id", prefix);
        assert_eq!(match_player_a.duelist_id, duelist_id_a, "[{}] match_player_a.duelist_id", prefix);
        assert_gt!(match_player_a.queue_info.slot, 0, "[{}] match_player_a.queue_info.slot", prefix);
        let match_player_b: MatchPlayer = sys.store.get_match_player(address_b);
        if (!is_bot) {
            assert_eq!(match_player_b.duel_id, duel_id, "[{}] match_player_b.duel_id", prefix);
            assert_eq!(match_player_b.duelist_id, duelist_id_b, "[{}] match_player_b.duelist_id", prefix);
            assert_gt!(match_player_b.queue_info.slot, 0, "[{}] match_player_b.queue_info.slot", prefix);
        } else {
            // bot_player never has a MatchPlayer
            assert_eq!(match_player_b.duel_id, 0, "[{}] match_player_b.duel_id_BOT", prefix);
            assert_eq!(match_player_b.duelist_id, 0, "[{}] match_player_b.duelist_id_BOT", prefix);
            assert_eq!(match_player_b.queue_info.slot, 0, "[{}] match_player_b.queue_info.slot_BOT", prefix);
        }
    }

    fn _assert_match_queue(sys: @TestSystems, queue_id: QueueId, players: Span<ContractAddress>, prefix: ByteArray) {
        let queue: MatchQueue = sys.store.get_match_queue(queue_id);
        ArrayTestUtilsTrait::assert_span_eq(queue.players.span(), players, prefix.clone());
        // get each MatchPlayer
        let mut i: usize = 0;
        while (i < players.len()) {
            let player: MatchPlayer = sys.store.get_match_player(*players[i]);
            assert_gt!(player.queue_info.slot, 0, "[{}]-player[{}].queue_info.slot >", prefix, i);
            assert_lt!(player.queue_info.slot, queue.slot_size+1, "[{}]-player[{}].queue_info.slot <", prefix, i);
            assert_gt!(player.queue_info.timestamp_enter, 0, "[{}]-player[{}].queue_info.timestamp_enter", prefix, i);
            assert_gt!(player.queue_info.timestamp_ping, 0, "[{}]-player[{}].queue_info.timestamp_ping", prefix, i);
            i += 1;
        };
    }

    fn _finish_duel(sys: @TestSystems, duel_id: u128, winner: u8, prefix: ByteArray) {
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let is_bot: bool = (ch.address_b == (*sys.bot_player).contract_address);
        let (moves_a, moves_b) = _get_moves_for_winner(sys, winner, is_bot);
        tester::execute_commit_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.hashed);
        if (!is_bot) { tester::execute_commit_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.hashed); }
        tester::execute_reveal_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.salt, moves_a.moves);
        if (!is_bot) { tester::execute_reveal_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.salt, moves_b.moves); }
        else { (*sys.bot_player).reveal_moves(duel_id); }
        let ch = (*sys.store).get_challenge_value(duel_id);
        assert_eq!(ch.state, if (winner == 0){ChallengeState::Draw}else{ChallengeState::Resolved}, "[{}] challenge.state_ENDED", prefix);
        assert_eq!(ch.winner, winner, "[{}] challenge.winner_ENDED", prefix);
        assert_eq!(ch.season_id, SEASON_ID_1, "[{}] challenge.season_id_ENDED", prefix);
        // pact and assignment unset
        tester::assert_pact(sys, duel_id, false, false, prefix.clone());
        // MatchPlayer
        let match_player_a: MatchPlayer = sys.store.get_match_player(ch.address_a);
        assert_eq!(match_player_a.duel_id, 0, "[{}] match_player_a.duel_id_ENDED", prefix);
        assert_eq!(match_player_a.duelist_id, 0, "[{}] match_player_a.duelist_id_ENDED", prefix);
        assert_eq!(match_player_a.queue_info.slot, 0, "[{}] match_player_a.queue_info.slot_ENDED", prefix);
        let match_player_b: MatchPlayer = sys.store.get_match_player(ch.address_b);
        assert_eq!(match_player_b.duel_id, 0, "[{}] match_player_b.duel_id_ENDED", prefix);
        assert_eq!(match_player_b.duelist_id, 0, "[{}] match_player_b.duelist_id_ENDED", prefix);
        assert_eq!(match_player_b.queue_info.slot, 0, "[{}] match_player_b.queue_info.slot_ENDED", prefix);
    }

    // just make sure rng mocked values are working
    #[test]
    fn test_match_rng_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::DUEL);
        // player 1
        _mock_slot(@sys, 5);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Ranked, QueueMode::Fast);
        assert_eq!(sys.store.get_match_player(OWNER()).queue_info.slot, 5);
        // player 2
        _mock_slot(@sys, 4);
        tester::execute_match_make_me(@sys, OTHER(), ID(OTHER()), QueueId::Ranked, QueueMode::Fast);
        assert_eq!(sys.store.get_match_player(OTHER()).queue_info.slot, 4);
        // player 3
        _mock_slot(@sys, 3);
        tester::execute_match_make_me(@sys, BUMMER(), ID(BUMMER()), QueueId::Ranked, QueueMode::Fast);
        assert_eq!(sys.store.get_match_player(BUMMER()).queue_info.slot, 3);
        // player 2
        _mock_slot(@sys, 2);
        tester::execute_match_make_me(@sys, SPENDER(), ID(SPENDER()), QueueId::Ranked, QueueMode::Fast);
        assert_eq!(sys.store.get_match_player(SPENDER()).queue_info.slot, 2);
        // player 1
        _mock_slot(@sys, 1);
        tester::execute_match_make_me(@sys, TREASURY(), ID(TREASURY()), QueueId::Ranked, QueueMode::Fast);
        assert_eq!(sys.store.get_match_player(TREASURY()).queue_info.slot, 1);
    }


    //------------------------------
    // duel flow
    //

    #[test]
    #[should_panic(expected: ('DUEL: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_create_not_matchmaker() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::DUEL);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::_protected_duels(@sys).match_make(A, ID(A), B, ID(B), QueueId::Ranked, QueueMode::Fast);
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid queue', 'ENTRYPOINT_FAILED'))]
    fn test_create_invalid_queue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Undefined, QueueMode::Fast);
    }
    
    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid mode', 'ENTRYPOINT_FAILED'))]
    fn test_create_invalid_mode() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Ranked, QueueMode::Undefined);
    }
    
    #[test]
    fn test_matchmaker_ranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Ranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, A, ID_A, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is ranked!!!
        tester::assert_ranked_duel_results(@sys, duel_id, "finished");
    }
    
    #[test]
    fn test_matchmaker_unranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, A, ID_A, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_matchmaker_slot_skip_low_slot() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let ID_C: u128 = *tester::execute_claim_starter_pack(@sys, C)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        //
        // matchmake player C > MATCH!
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_C");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, C, ID_C, A, ID_A, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_matchmaker_choose_least_duels() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let ID_C: u128 = *tester::execute_claim_starter_pack(@sys, C)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player B-A
        _mock_slot(@sys, 5);
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, A, ID_A, "match_made_1");
        _finish_duel(@sys, duel_id, 1, "finished_1");
        //
        // matchmake player B-C
        _mock_slot(@sys, 5);
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        _mock_slot(@sys, 3);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [A, C].span(), "match_B");
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 2, "duel_id_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, C, ID_C, "match_made_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_B");
        _finish_duel(@sys, duel_id, 1, "finished_2");
    }

    #[test]
    fn test_matchmaker_no_flipping_slots() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let ID_C: u128 = *tester::execute_claim_starter_pack(@sys, C)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (lower slot)
        _mock_slot(@sys, 3);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        //
        // matchmake player C > NO MATCH (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C");
        //
        // run all again, must have same results
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_A_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_B_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C_again");
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Wrong queue', 'ENTRYPOINT_FAILED'))]
    fn test_matchmaker_wrong_queue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 1);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        // matchmake player A
        tester::execute_match_make_me(@sys, A, ID_A, QueueId::Unranked, QueueMode::Fast);
        // ping wrong queue...
        tester::execute_match_make_me(@sys, A, ID_A, QueueId::Ranked, QueueMode::Fast);
    }


    //--------------------------------
    // timeouts
    //

    #[test]
    fn test_matchmaker_fast_timeout_ping_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Ranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A).queue_info.expired, false, "expired_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        // expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST);
        //
        // matchmake player B > NO MATCH (lower slot)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B).queue_info.expired, false, "expired_B");
        // A was kicked out of queue...
        assert_eq!(sys.store.get_match_player(A).queue_info.expired, true, "expired_A");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_B");
        //
        // matchmake player A > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_matched");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, A, ID_A, B, ID_B, "match_made");
    }


    #[test]
    fn test_matchmaker_fast_slow_switch_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Ranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A).queue_info.queue_mode, QueueMode::Fast, "QueueMode_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (different mode)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B).queue_info.queue_mode, QueueMode::Slow, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        //
        // switched to FAST > match!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_matched");
        assert_eq!(sys.store.get_match_player(B).queue_info.queue_mode, QueueMode::Fast, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, A, ID_A, "match_made");
        // check commit timeouts
        let round: Round = sys.store.get_round(duel_id);
        let timeout_a = round.moves_a.timeout;
        let timeout_b = round.moves_b.timeout;
        assert_eq!(timeout_a, timeout_b, "timeout_a == timeout_b");
        assert_lt!(timeout_a, tester::get_block_timestamp() + TIMESTAMP::ONE_MINUTE * 11, "timeout_time");
    }

    #[test]
    fn test_matchmaker_slow_fast_switch_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Ranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A).queue_info.queue_mode, QueueMode::Slow, "QueueMode_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        // try again... no match yet
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW / 2);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A).queue_info.queue_mode, QueueMode::Slow, "QueueMode_A");
        assert_eq!(sys.store.get_match_player(A).queue_info.expired, false, "expired_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (different mode)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B).queue_info.queue_mode, QueueMode::Fast, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        // can expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST + 1);
        //
        // switched to FAST > match!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_matched");
        assert_eq!(sys.store.get_match_player(B).queue_info.queue_mode, QueueMode::Slow, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, A, ID_A, "match_made");
        // check commit timeouts
        let round: Round = sys.store.get_round(duel_id);
        let timeout_a = round.moves_a.timeout;
        let timeout_b = round.moves_b.timeout;
        assert_eq!(timeout_a, timeout_b, "timeout_a == timeout_b");
        assert_gt!(timeout_a, tester::get_block_timestamp() + TIMESTAMP::ONE_HOUR * 23, "timeout_time");
    }


    //--------------------------------
    // bot_player IMP
    //

    #[test]
    fn test_matchmaker_ping_expire_bot_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // ping once...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST / 2);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "ping_1");
        //
        // ping once...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST / 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "ping_2");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST / 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "ping_match");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_matchmaker_bot_player_multiple_matches() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 3);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST + 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "ping_match");
        _assert_match_queue(@sys, queue_id, [].span(), "matched_A");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
        let ch_1: Challenge = sys.store.get_challenge(duel_id);
        //
        // matchmake player B
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_B");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_B");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST + 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 2, "ping_match");
        _assert_match_queue(@sys, queue_id, [].span(), "matched_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, ID_B, sys.bot_player.contract_address, 0, "match_made");
        let ch_2: Challenge = sys.store.get_challenge(duel_id);
        // different duelist bots
        assert_eq!(ch_1.address_b, ch_2.address_b, "address_b");
        assert_ne!(ch_1.duelist_id_a, ch_2.duelist_id_b, "duelist_id_a");
        //
        // Finish Duel 1...
        _finish_duel(@sys, ch_1.duel_id, 1, "finished_1");
        tester::assert_unranked_duel_results(@sys, ch_1.duel_id, "finished_1");
        // finish Duel 2...
        _finish_duel(@sys, ch_2.duel_id, 1, "finished_2");
        tester::assert_unranked_duel_results(@sys, ch_2.duel_id, "finished_2");
    }


    //--------------------------------
    // Duelists validation
    //

    #[test]
    fn test_matchmaker_duelists_duel_and_match_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        assert_eq!(duel_id, 1, "create_duel");
        // enter matchmaking with different duelists...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 2, "match_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, OWNED_BY_OTHER(), A, OWNED_BY_OWNER(), "match_made");
    }

    #[test]
    fn test_matchmaker_duelists_match_and_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "match_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, B, OWNED_BY_OTHER(), A, OWNED_BY_OWNER(), "match_made");
        // enter a normal duel with different duelists...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "reate_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_matchmaker_duelist_in_a_challenge_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::assert_pact(@sys, duel_id, true, false, "create_duel");
        // enter matchmaking...
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Fast);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_matchmaker_duelist_in_a_challenge_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "create_duel");
        // enter matchmaking...
        let _duel_id: u128 = tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Fast);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_matchmaker_duelist_in_matchmaking_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A");
        assert_eq!(sys.store.get_duelist_assignment(ID(A)).queue_id, queue_id, "assignment.queue_id");
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_matchmaker_duelist_in_matchmaking_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_B");
        assert_eq!(sys.store.get_duelist_assignment(ID(B)).queue_id, queue_id, "assignment.queue_id");
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }
}
