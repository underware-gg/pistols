#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{ChallengeValue, DuelType},
        duelist::{Archetype},
        matches::{
            QueueId, QueueMode,
            MatchQueue,
            MatchPlayer,
        },
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, BotKey},
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            IDuelTokenProtectedDispatcherTrait,
            IBotPlayerDispatcherTrait,
            IRngMockDispatcherTrait,
            OWNER, OTHER, BUMMER, SPENDER, TREASURY,
            FLAGS, ID, SEASON_ID_1,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{MockedValueTrait, PlayerMoves}
    };
    use pistols::tests::test_bot_player::tests::{_get_bot_moves_crit_a};
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
        duel_id: u128, queue_id: QueueId, queue_mode: QueueMode,
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
        tester::assert_pact(sys, duel_id, ch, true, true, prefix.clone());
        // MatchPlayer
        let match_player_a: MatchPlayer = sys.store.get_match_player(address_a);
        assert_eq!(match_player_a.duel_id, duel_id, "[{}] match_player_a.duel_id", prefix);
        assert_eq!(match_player_a.duelist_id, duelist_id_a, "[{}] match_player_a.duelist_id", prefix);
        assert_eq!(match_player_a.queue_info.queue_mode, queue_mode, "[{}] match_player_a.queue_info.queue_mode", prefix);
        assert_gt!(match_player_a.queue_info.slot, 0, "[{}] match_player_a.queue_info.slot", prefix);
        let match_player_b: MatchPlayer = sys.store.get_match_player(address_b);
        if (!is_bot) {
            assert_eq!(match_player_b.duel_id, duel_id, "[{}] match_player_b.duel_id", prefix);
            assert_eq!(match_player_b.duelist_id, duelist_id_b, "[{}] match_player_b.duelist_id", prefix);
            assert_eq!(match_player_b.queue_info.queue_mode, queue_mode, "[{}] match_player_b.queue_info.queue_mode", prefix);
            assert_gt!(match_player_b.queue_info.slot, 0, "[{}] match_player_b.queue_info.slot", prefix);
        } else {
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
    
    #[test]
    fn test_matchmaker_ranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Ranked;
        let queue_mode = QueueMode::Fast;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        assert_eq!(duel_id, 0, "duel_id_A");
        //
        // matchmake player B
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, queue_mode, B, ID_B, A, ID_A, "execute_match_make_me");
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
        let queue_mode = QueueMode::Fast;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        assert_eq!(duel_id, 0, "duel_id_A");
        //
        // matchmake player B
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, queue_mode, B, ID_B, A, ID_A, "execute_match_make_me");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_matchmaker_slot_skip() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let ID_C: u128 = *tester::execute_claim_starter_pack(@sys, C)[0];
        let queue_id = QueueId::Unranked;
        let queue_mode = QueueMode::Fast;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        assert_eq!(duel_id, 0, "duel_id_A");
        //
        // matchmake player B (not match for low slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        assert_eq!(duel_id, 0, "duel_id_B");
        //
        // matchmake player C -- MATCH!
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [B].span(), "match_C");
        assert_eq!(duel_id, 1, "duel_id_C");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, queue_mode, C, ID_C, A, ID_A, "execute_match_make_me");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_matchmaker_ping_expire_imp() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Unranked;
        let queue_mode = QueueMode::Fast;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        assert_eq!(duel_id, 0, "match_A");
        //
        // ping once...
        tester::elapse_block_timestamp(30);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        assert_eq!(duel_id, 0, "ping_1");
        //
        // ping once...
        tester::elapse_block_timestamp(20);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        assert_eq!(duel_id, 0, "ping_2");
        //
        // ping to match...
        tester::elapse_block_timestamp(10);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, queue_mode);
        assert_eq!(duel_id, 1, "ping_match");
        _assert_matchmaking_duel_started(@sys, duel_id, queue_id, queue_mode, A, ID_A, sys.bot_player.contract_address, 0, "execute_match_make_me");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }


    // TEST: fast/slow on ranked/unranked



}
