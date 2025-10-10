#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{Challenge, ChallengeValue, DuelType, Round},
        duelist::{DuelistAssignment, Archetype},
        match_queue::{
            QueueId, QueueMode, QueueNextDuelist,
            MatchQueue, MatchQueueTrait,
            MatchPlayer,
            MATCHMAKER,
        },
        pack::{PackType},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, GenesisKey, BotKey},
        timestamp::{TIMESTAMP},
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait, DnsTrait,
            IMatchMakerDispatcherTrait,
            IDuelTokenProtectedDispatcherTrait,
            IBotPlayerDispatcherTrait,
            IRngMockDispatcherTrait,
            ILordsMockDispatcherTrait,
            FLAGS, SEASON_ID_1, ID, ZERO, CONST,
            OWNER, OTHER, BUMMER, SPENDER, TREASURY,
            OWNED_BY_OWNER, OWNED_BY_OTHER,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{MockedValueTrait, PlayerMoves}
    };
    use pistols::tests::test_bot_player::tests::{_get_bot_moves_crit_a};
    use pistols::tests::token::test_pack_token::{_airdrop_open};
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

    fn _assert_match_created(sys: @TestSystems,
        queue_id: QueueId,
        queue_mode: QueueMode,
        address_a: ContractAddress, duelist_id_a: u128,
        prefix: ByteArray,
    ) -> u128 {
        let player_a: MatchPlayer = sys.store.get_match_player(address_a, queue_id);
        let duel_id: u128 = if (queue_mode == QueueMode::Fast) {
            // FAST done have a duel
            assert_eq!(player_a.duel_id, 0, "created:[{}] duel_id_ZERO!", prefix);
            (0)
        } else if (queue_mode == QueueMode::Slow) {
            // SLOW must have a duel
            assert_gt!(player_a.duel_id, 0, "created:[{}] player_a.duel_id", prefix);
            assert_eq!(player_a.duelist_id, duelist_id_a, "created:[{}] player_a.duelist_id", prefix);
            assert_gt!(player_a.queue_info.slot, 0, "created:[{}] player_a.queue_info.slot", prefix);
            assert_gt!(player_a.queue_info.timestamp_enter, 0, "created:[{}] player_a.queue_info.timestamp_enter", prefix);
            assert_gt!(player_a.queue_info.timestamp_ping, 0, "created:[{}] player_a.queue_info.timestamp_ping", prefix);
            assert!(player_a.queue_info.has_minted_duel, "created:[{}] player_a.queue_info.has_minted_duel", prefix);
            let (ch, round) = tester::get_Challenge_Round_value(sys, player_a.duel_id);
            assert_eq!(ch.duel_type, if(queue_id==QueueId::Ranked){DuelType::Ranked}else{DuelType::Unranked}, "created:[{}] duel_type", prefix);
            assert_eq!(ch.state, ChallengeState::Awaiting, "created:[{}] ch.state", prefix);
            assert_eq!(round.state, RoundState::Commit, "created:[{}] round.state", prefix);
            assert_eq!(ch.address_a, address_a, "created:[{}] ch.address_a", prefix);
            assert_eq!(ch.duelist_id_a, duelist_id_a, "created:[{}] ch.duelist_id_a", prefix);
            (player_a.duel_id)
        } else {
            assert!(false, "created:[{}] invalid QueueMode", prefix);
            (0)
        };
        // pact and assignment set
        let assignment_a: DuelistAssignment = (*sys.store).get_duelist_assignment(duelist_id_a);
        assert_eq!(assignment_a.queue_id, queue_id, "created:[{}] assignment_a.queue_id", prefix);
        assert_eq!(assignment_a.duel_id, duel_id, "created:[{}] assignment_a.duel_id", prefix);
        // return the created duel_id
        (duel_id)
    }

    fn _assert_match_started(sys: @TestSystems,
        queue_id: QueueId,
        duel_id: u128,
        address_a: ContractAddress, duelist_id_a: u128,
        address_b: ContractAddress, duelist_id_b: u128,
        prefix: ByteArray,
    ) {
        assert_ne!(duel_id, 0, "started:[{}] duel_id", prefix);
        let (ch, round) = tester::get_Challenge_Round_value(sys, duel_id);
        let is_bot: bool = (ch.address_b == (*sys.bot_player).contract_address);
        assert_eq!(ch.duel_type, if(queue_id==QueueId::Ranked){DuelType::Ranked}else{DuelType::Unranked}, "started:[{}] duel_type", prefix);
        assert_eq!(ch.state, ChallengeState::InProgress, "started:[{}] ch.state", prefix);
        assert_eq!(round.state, RoundState::Commit, "started:[{}] round.state", prefix);
        assert_eq!(ch.address_a, address_a, "started:[{}] ch.address_a", prefix);
        assert_eq!(ch.address_b, address_b, "started:[{}] ch.address_b", prefix);
        assert_eq!(ch.duelist_id_a, duelist_id_a, "started:[{}] ch.duelist_id_a", prefix);
        if (!is_bot) {
            // player duelist
            assert_eq!(ch.duelist_id_b, duelist_id_b, "started:[{}] ch.duelist_id_b", prefix);
        } else {
            // bot duelist
            let duelist_profile: DuelistProfile = sys.store.get_duelist(ch.duelist_id_b).duelist_profile;
            assert_eq!(duelist_profile, DuelistProfile::Bot(BotKey::Pro), "started:[{}] bot_duelist_profile", prefix);
        }
        // pact and assignment set
        tester::assert_pact_queue(sys, duel_id, true, true, queue_id, prefix.clone());
        // MatchPlayer was cleared...
        let player_a: MatchPlayer = sys.store.get_match_player(address_a, queue_id);
        assert_eq!(player_a.duel_id, 0, "started:[{}] player_a.duel_id", prefix);
        assert_eq!(player_a.duelist_id, 0, "started:[{}] player_a.duelist_id", prefix);
        assert_eq!(player_a.queue_info.slot, 0, "started:[{}] player_a.queue_info.slot", prefix);
        let player_b: MatchPlayer = sys.store.get_match_player(address_b, queue_id);
        assert_eq!(player_b.duel_id, 0, "started:[{}] player_b.duel_id_BOT", prefix);
        assert_eq!(player_b.duelist_id, 0, "started:[{}] player_b.duelist_id_BOT", prefix);
        assert_eq!(player_b.queue_info.slot, 0, "started:[{}] player_b.queue_info.slot_BOT", prefix);
    }

    fn _assert_match_queue(sys: @TestSystems, queue_id: QueueId, players: Span<ContractAddress>, prefix: ByteArray) {
        let queue: MatchQueue = sys.store.get_match_queue(queue_id);
        ArrayTestUtilsTrait::assert_span_eq(queue.players.span(), players, prefix.clone());
        // get each MatchPlayer
        let mut i: usize = 0;
        while (i < players.len()) {
            let player: MatchPlayer = sys.store.get_match_player(*players[i], queue_id);
            assert_gt!(player.queue_info.slot, 0, "[{}]-player[{}].queue_info.slot >", prefix, i);
            assert_lt!(player.queue_info.slot, queue.slot_size+1, "[{}]-player[{}].queue_info.slot <", prefix, i);
            assert_gt!(player.queue_info.timestamp_enter, 0, "[{}]-player[{}].queue_info.timestamp_enter", prefix, i);
            // assert_gt!(player.queue_info.timestamp_ping, 0, "[{}]-player[{}].queue_info.timestamp_ping", prefix, i);
            i += 1;
        };
    }

    fn _finish_duel(sys: @TestSystems, duel_id: u128, winner: u8, queue_id: QueueId, prefix: ByteArray) {
        assert_gt!(duel_id, 0, "finish:[{}] duel_id", prefix);
        // pact must be set
        tester::assert_pact_queue(sys, duel_id, true, true, queue_id, format!("finish:[{}]_pact_set", prefix));
        // MatchPlayer was already cleared...
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let player_a: MatchPlayer = sys.store.get_match_player(ch.address_a, queue_id);
        assert_eq!(player_a.duel_id, 0, "finish:[{}] player_a.duel_id_ENDED", prefix);
        assert_eq!(player_a.duelist_id, 0, "finish:[{}] player_a.duelist_id_ENDED", prefix);
        assert_eq!(player_a.queue_info.slot, 0, "finish:[{}] player_a.queue_info.slot_ENDED", prefix);
        let player_b: MatchPlayer = sys.store.get_match_player(ch.address_b, queue_id);
        assert_eq!(player_b.duel_id, 0, "finish:[{}] player_b.duel_id_ENDED", prefix);
        assert_eq!(player_b.duelist_id, 0, "finish:[{}] player_b.duelist_id_ENDED", prefix);
        assert_eq!(player_b.queue_info.slot, 0, "finish:[{}] player_b.queue_info.slot_ENDED", prefix);
        // finish duel...
        let is_bot: bool = (ch.address_b == (*sys.bot_player).contract_address);
        let (moves_a, moves_b) = _get_moves_for_winner(sys, winner, is_bot);
        tester::execute_commit_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.hashed);
        if (!is_bot) {
            tester::execute_commit_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.hashed);
        }
        tester::execute_reveal_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.salt, moves_a.moves);
        if (!is_bot) {
            tester::execute_reveal_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.salt, moves_b.moves);
        } else {
            (*sys.bot_player).reveal_moves(duel_id);
        }
        let ch = (*sys.store).get_challenge_value(duel_id);
        assert_eq!(ch.state, if (winner == 0){ChallengeState::Draw}else{ChallengeState::Resolved}, "finish:[{}] challenge.state_ENDED", prefix);
        assert_eq!(ch.winner, winner, "finish:[{}] challenge.winner_ENDED", prefix);
        assert_eq!(ch.season_id, SEASON_ID_1, "finish:[{}] challenge.season_id_ENDED", prefix);
        // pact and assignment unset
        tester::assert_pact_queue(sys, duel_id, false, false, if(queue_id==QueueId::Ranked){queue_id}else{QueueId::Undefined}, format!("finish:[{}]_pact_unset", prefix));
    }

    const LORDS_PRICE: u128 = (100 * CONST::ETH_TO_WEI.low);

    fn _setup_ranked_lords(sys: @TestSystems, players: Span<ContractAddress>, approve_amount: u128) {
        // set LORDS as token fee
        tester::impersonate(OWNER());
        (*sys.matchmaker).set_queue_entry_token(QueueId::Ranked, *sys.lords.contract_address, LORDS_PRICE);
        // faucet to players
        let mut i: usize = 0;
        while (i < players.len()) {
            let address: ContractAddress = *players[i];
            tester::execute_lords_faucet(sys.lords, address);
            if (approve_amount > 0) {
                tester::execute_lords_approve(sys.lords, address, *sys.matchmaker.contract_address, LORDS_PRICE * approve_amount);
            }
            i += 1;
        };
    }


    //------------------------------
    // setup/admin
    //

    #[test]
    fn test_matchmaker_init() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        let queue_unranked: MatchQueue = sys.store.get_match_queue(QueueId::Unranked);
        assert_eq!(queue_unranked.slot_size, MATCHMAKER::INITIAL_SLOT_SIZE, "QueueId::Unranked.slot_size");
        assert_eq!(queue_unranked.entry_token_address, ZERO(), "QueueId::Unranked.entry_token_address");
        assert_eq!(queue_unranked.entry_token_amount, 0, "QueueId::Unranked.entry_token_amount");
        assert!(!queue_unranked.requires_enlistment(), "QueueId::Unranked.requires_enlistment()");
        let queue_ranked: MatchQueue = sys.store.get_match_queue(QueueId::Ranked);
        assert_eq!(queue_ranked.slot_size, MATCHMAKER::INITIAL_SLOT_SIZE, "QueueId::Ranked.slot_size");
        assert_eq!(queue_ranked.entry_token_address, sys.store.world.fools_coin_address(), "QueueId::Ranked.entry_token_address");
        assert_gt!(queue_ranked.entry_token_amount, 0, "QueueId::Ranked.entry_token_amount");
        assert!(queue_ranked.requires_enlistment(), "QueueId::Ranked.requires_enlistment()");
        // test fee getter
        let (token_address, token_amount) = sys.matchmaker.get_entry_fee(QueueId::Unranked);
        assert_eq!(token_address, queue_unranked.entry_token_address, "QueueId::Unranked.entry_token_address_GETTER");
        assert_eq!(token_amount, queue_unranked.entry_token_amount, "QueueId::Unranked.entry_token_amount_GETTER");
        let (token_address, token_amount) = sys.matchmaker.get_entry_fee(QueueId::Ranked);
        assert_eq!(token_address, queue_ranked.entry_token_address, "QueueId::Ranked.entry_token_address_GETTER");
        assert_eq!(token_amount, queue_ranked.entry_token_amount, "QueueId::Ranked.entry_token_amount_GETTER");
        // admin functions
        tester::impersonate(OWNER());
        sys.matchmaker.set_queue_size(QueueId::Unranked, 11);
        sys.matchmaker.set_queue_size(QueueId::Ranked, 22);
        sys.matchmaker.set_queue_entry_token(QueueId::Unranked, TREASURY(), 100);
        sys.matchmaker.set_queue_entry_token(QueueId::Ranked, ZERO(), 0);
        // validate
        let queue_unranked: MatchQueue = sys.store.get_match_queue(QueueId::Unranked);
        assert_eq!(queue_unranked.slot_size, 11, "QueueId::Unranked.slot_size_EDITED");
        assert_eq!(queue_unranked.entry_token_address, TREASURY(), "QueueId::Unranked.entry_token_address_EDITED");
        assert_eq!(queue_unranked.entry_token_amount, 100, "QueueId::Unranked.entry_token_amount_EDITED");
        let queue_ranked: MatchQueue = sys.store.get_match_queue(QueueId::Ranked);
        assert_eq!(queue_ranked.slot_size, 22, "QueueId::Ranked.slot_size_EDITED");
        assert_eq!(queue_ranked.entry_token_address, ZERO(), "QueueId::Ranked.entry_token_address_EDITED");
        assert_eq!(queue_ranked.entry_token_amount, 0, "QueueId::Ranked.entry_token_amount_EDITED");
        // test fee getter
        let (token_address, token_amount) = sys.matchmaker.get_entry_fee(QueueId::Unranked);
        assert_eq!(token_address, queue_unranked.entry_token_address, "QueueId::Unranked.entry_token_address_GETTER_EDITED");
        assert_eq!(token_amount, queue_unranked.entry_token_amount, "QueueId::Unranked.entry_token_amount_GETTER_EDITED");
        let (token_address, token_amount) = sys.matchmaker.get_entry_fee(QueueId::Ranked);
        assert_eq!(token_address, queue_ranked.entry_token_address, "QueueId::Ranked.entry_token_address_GETTER_EDITED");
        assert_eq!(token_amount, queue_ranked.entry_token_amount, "QueueId::Ranked.entry_token_amount_GETTER_EDITED");
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Invalid queue', 'ENTRYPOINT_FAILED'))]
    fn test_admin_set_entry_token_invalid_queue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OWNER());
        sys.matchmaker.set_queue_entry_token(QueueId::Undefined, TREASURY(), 100);
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Invalid queue', 'ENTRYPOINT_FAILED'))]
    fn test_admin_set_queue_size_invalid_queue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OWNER());
        sys.matchmaker.set_queue_size(QueueId::Undefined, 11);
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Invalid size', 'ENTRYPOINT_FAILED'))]
    fn test_admin_set_queue_size_invalid_size() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OWNER());
        sys.matchmaker.set_queue_size(QueueId::Unranked, 0);
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_admin_set_queue_size_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OTHER());
        sys.matchmaker.set_queue_size(QueueId::Unranked, 11);
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_admin_set_entry_token_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OTHER());
        sys.matchmaker.set_queue_entry_token(QueueId::Unranked, TREASURY(), 100);
    }

    #[test]
    #[should_panic(expected:('MATCHMAKER: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_admin_clear_queue_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MATCHMAKER | FLAGS::ADMIN);
        tester::impersonate(OTHER());
        sys.matchmaker.clear_queue(QueueId::Unranked);
    }

    // just make sure rng mocked values are working
    #[test]
    fn test_match_rng_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::DUEL);
        let queue_id = QueueId::Unranked;
        // player 1
        _mock_slot(@sys, 5);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), queue_id, QueueMode::Slow);
        assert_eq!(sys.store.get_match_player(OWNER(), queue_id).queue_info.slot, 5);
        // player 2
        _mock_slot(@sys, 4);
        tester::execute_match_make_me(@sys, OTHER(), ID(OTHER()), queue_id, QueueMode::Slow);
        assert_eq!(sys.store.get_match_player(OTHER(), queue_id).queue_info.slot, 4);
        // player 3 -- will match 4 and not set a slot
        _mock_slot(@sys, 3);
        tester::execute_match_make_me(@sys, BUMMER(), ID(BUMMER()), queue_id, QueueMode::Slow);
        assert_eq!(sys.store.get_match_player(BUMMER(), queue_id).queue_info.slot, 0);
        // player 4
        _mock_slot(@sys, 1);
        tester::execute_match_make_me(@sys, SPENDER(), ID(SPENDER()), queue_id, QueueMode::Slow);
        assert_eq!(sys.store.get_match_player(SPENDER(), queue_id).queue_info.slot, 1);
    }


    //------------------------------
    // Unranked
    //

    #[test]
    #[should_panic(expected: ('DUEL: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_protected_create_match_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::DUEL);
        let A: ContractAddress = OTHER();
        tester::_protected_duels(@sys).create_match(A, ID(A), QueueId::Unranked);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_protected_start_match_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::DUEL);
        let A: ContractAddress = OTHER();
        tester::_protected_duels(@sys).start_match(120, A, ID(A), QueueId::Unranked, QueueMode::Slow);
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid queue', 'ENTRYPOINT_FAILED'))]
    fn test_match_make_me_invalid_queue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Undefined, QueueMode::Slow);
    }
    
    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid queue', 'ENTRYPOINT_FAILED'))]
    fn test_match_make_me_unranked_fast() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Unranked, QueueMode::Fast);
    }
    
    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid mode', 'ENTRYPOINT_FAILED'))]
    fn test_match_make_me_invalid_mode() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER);
        tester::execute_match_make_me(@sys, OWNER(), ID(OWNER()), QueueId::Unranked, QueueMode::Undefined);
    }
    
    #[test]
    #[should_panic(expected: ('MATCHMAKER: Not enlisted', 'ENTRYPOINT_FAILED'))]
    fn test_enlistment_not_enlisted() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Ranked;
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
    }
    
    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_enlistment_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Not required', 'ENTRYPOINT_FAILED'))]
    fn test_enlistment_not_required() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Unranked;
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }
    
    #[test]
    fn test_unranked_slow_ok() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "unranked_results");
    }

    #[test]
    fn test_unranked_slow_pre_commit_ok() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        let duel_id: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created");
        assert_gt!(duel_id, 0, "duel_id_A");
        //
        // commit...
        let (moves_a, moves_b) = _get_moves_for_winner(@sys, 1, false);
        tester::execute_commit_moves_ID(@sys, A, ID_A, duel_id, moves_a.hashed);        
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made");
        //
        // finish...
        tester::execute_commit_moves_ID(@sys, B, ID_B, duel_id, moves_b.hashed);
        tester::execute_reveal_moves_ID(@sys, A, ID_A, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(@sys, B, ID_B, duel_id, moves_b.salt, moves_b.moves);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Resolved);
        assert_eq!(ch.winner, 1);
        assert_eq!(ch.season_id, SEASON_ID_1);
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "unranked_results");
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A");
        //
        // matchmake player B > NO MATCH (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID_B, "match_created_B");
        //
        // matchmake player C > MATCH!
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_C");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, C, ID_C, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "unranked_results");
    }

    #[test]
    fn test_matchmaker_skip_has_pact() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A_1: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B_1: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let ID_A_2: u128 = ID_A_1 + 1;
        let ID_B_2: u128 = ID_B_1 + 1;
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A_1");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_B_1");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B_1");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B_1, "match_made");
        //
        // matchmake player A again
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        //
        // matchmake player B < NO MATCH (has pact)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B_2");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B_2");
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
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A_1");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made_1");
        _finish_duel(@sys, duel_id, 1, queue_id, "finished_1");
        //
        // matchmake player B-C
        _mock_slot(@sys, 5);
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _mock_slot(@sys, 3);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_C");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, C, ID_C, "match_created_C");
        _assert_match_queue(@sys, queue_id, [A, C].span(), "match_C_2");
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 3, "duel_id_B");
        _assert_match_started(@sys, queue_id, duel_id, C, ID_C, B, ID_B, "match_made_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_B_2");
        _finish_duel(@sys, duel_id, 1, queue_id, "finished_2");
    }

    #[test]
    fn test_fast_no_flipping_slots() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (lower slot)
        _mock_slot(@sys, 3);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        //
        // matchmake player C > NO MATCH (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C");
        //
        // run all again, must have same results
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_A_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_B_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C_again");
    }

    #[test]
    fn test_slow_no_flipping_slots() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A");
        //
        // matchmake player B > NO MATCH (lower slot)
        _mock_slot(@sys, 3);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID_B, "match_created_B");
        //
        // matchmake player C > NO MATCH (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_C");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, C, ID_C, "match_created_C");
        //
        // run all again, must have same results
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_A_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_B_again");
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [A, B, C].span(), "match_C_again");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Invalid duel type', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_reply_duel() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        let duel_id: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created");
        assert_eq!(duel_id, 1, "duel_id_match");
        //
        // B cant reply directly
        tester::execute_reply_duel(@sys, B, ID_B, duel_id, true);
    }


    //------------------------------
    // Ranked
    //

    #[test]
    fn test_ranked_slow_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        let balance_lords_a: u128 = sys.lords.balance_of(A).low;
        let balance_lords_b: u128 = sys.lords.balance_of(B).low;
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, 0, "balance_lords_MM_1");
        // enter and pay fees
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        assert_eq!(sys.lords.balance_of(A).low, balance_lords_a - LORDS_PRICE, "balance_lords_a");
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, LORDS_PRICE, "balance_lords_MM_2");
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        assert_eq!(sys.lords.balance_of(B).low, balance_lords_b - LORDS_PRICE, "balance_lords_b");
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, LORDS_PRICE * 2, "balance_lords_MM_3");
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // is ranked!!!
        tester::assert_ranked_duel_results(@sys, duel_id, "ranked_results");
    }
    
    #[test]
    fn test_ranked_fast_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        let balance_lords_a: u128 = sys.lords.balance_of(A).low;
        let balance_lords_b: u128 = sys.lords.balance_of(B).low;
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, 0, "balance_lords_MM_1");
        // enter and pay fees
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        assert_eq!(sys.lords.balance_of(A).low, balance_lords_a - LORDS_PRICE, "balance_lords_a");
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, LORDS_PRICE, "balance_lords_MM_2");
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        assert_eq!(sys.lords.balance_of(B).low, balance_lords_b - LORDS_PRICE, "balance_lords_b");
        assert_eq!(sys.lords.balance_of(sys.matchmaker.contract_address).low, LORDS_PRICE * 2, "balance_lords_MM_3");
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, A, ID_A, "match_created_A");
        //
        // matchmake player B > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // is ranked!!!
        tester::assert_ranked_duel_results(@sys, duel_id, "ranked_results");
    }
    
    #[test]
    #[should_panic(expected: ('MATCHMAKER: Ineligible duelist', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_ineligible_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 1);
        // enter the starter duelist an panic
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }

    #[test]
    #[should_panic(expected: ('IERC20: insufficient balance', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_no_balance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop");
        let queue_id = QueueId::Ranked;
        // try to pay... (no FOOLS)
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }
    
    #[test]
    #[should_panic(expected: ('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_zero_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop");
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 0);
        // try to pay...
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }
    
    #[test]
    #[should_panic(expected: ('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_no_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop");
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 0);
        tester::execute_lords_approve(@sys.lords, A, sys.matchmaker.contract_address, LORDS_PRICE - 1);
        // try to pay...
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
    }


    //--------------------------------
    // timeouts
    //

    #[test]
    fn test_ranked_slow_timeout_ping_match_bot_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.expired, false, "expired_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A");
        // expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW);
        //
        // matchmake player B > NO MATCH (player A expired)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B, queue_id).queue_info.expired, false, "expired_B");
        // player A was kicked out of queue...
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.expired, true, "expired_A");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_B");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID_B, "match_created_B");
        //
        // matchmake player A again > match an imp!
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "duel_id_matched");
        _assert_match_queue(@sys, queue_id, [B].span(), "matched");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
    }


    #[test]
    fn test_ranked_fast_timeout_ping_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.expired, false, "expired_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, A, ID_A, "match_created_A");
        // expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST);
        //
        // matchmake player B > NO MATCH (player A expired)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B, queue_id).queue_info.expired, false, "expired_B");
        // player A was kicked out of queue...
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.expired, true, "expired_A");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_B");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, B, ID_B, "match_created_B");
        //
        // matchmake player A again > MATCH!
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_matched");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_match_started(@sys, queue_id, duel_id, B, ID_B, A, ID_A, "match_made");
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid mode', 'ENTRYPOINT_FAILED'))]
    fn test_fast_to_slow_nope() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.queue_mode, QueueMode::Slow, "QueueMode_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        // try again, just for fun... no match yet
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW / 2);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.queue_mode, QueueMode::Slow, "QueueMode_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.expired, false, "expired_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // matchmake player B > NO MATCH (different mode)
        let _duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B, queue_id).queue_info.queue_mode, QueueMode::Fast, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        // can expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW + 1);
        //
        // switched to FAST > NOPE!!!
        tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
    }
    
    #[test]
    fn test_slow_to_fast_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.queue_mode, QueueMode::Fast, "QueueMode_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, A, ID_A, "match_created_A");
        //
        // matchmake player B > NO MATCH (different mode)
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B");
        assert_eq!(sys.store.get_match_player(B, queue_id).queue_info.queue_mode, QueueMode::Slow, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        let duel_id_B: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID_B, "match_created_B");
        //
        // switched to FAST > match! uses SLOW duel
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 1, "duel_id_matched");
        // matched and cleared...
        assert_eq!(sys.store.get_match_player(B, queue_id).queue_info.queue_mode, QueueMode::Undefined, "QueueMode_B");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_match_started(@sys, queue_id, duel_id_B, B, ID_B, A, ID_A, "match_made");
        // check commit timeouts
        let round: Round = sys.store.get_round(duel_id);
        let timeout_a = round.moves_a.timeout;
        let timeout_b = round.moves_b.timeout;
        assert_eq!(timeout_a, timeout_b, "timeout_a == timeout_b");
        assert_lt!(timeout_a, tester::get_block_timestamp() + TIMESTAMP::ONE_MINUTE * 11, "timeout_time");
    }

    #[test]
    fn test_slow_to_fast_queue_expire_bot_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        //
        // matchmake player A: SLOW
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A_slow");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_slow");
        let duel_id_1: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A_slow");
        //
        // matchmake player A: switch to FAST
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A_fast");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_fast");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.queue_mode, QueueMode::Fast, "QueueMode_fast");
        //
        // expire...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_FAST);
        //
        // matchmake player A again > match an imp!
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, duel_id_1, "duel_id_matched");
        _assert_match_queue(@sys, queue_id, [].span(), "matched");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
    }
    
    #[test]
    fn test_slow_to_fast_queue_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A: SLOW
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A_slow");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_slow");
        let duel_id_1: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A_slow");
        //
        // matchmake player A: switch to FAST
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A_fast");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_fast");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.queue_mode, QueueMode::Fast, "QueueMode_fast");
        //
        // matchmake player B: FAST > MATCH
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, duel_id_1, "duel_id_B_fast");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B_fast");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, B, ID_B, "match_made_B_fast");
    }
    
    #[test]
    fn test_slow_to_fast_have_duels_no_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 3);
        let ID_A: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID_A, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // matchmake player A: SLOW
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_A_slow");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_slow");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A_slow");
        //
        // matchmake player B: SLOW > no match (lower slot)
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "duel_id_B_slow");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B_slow");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID_B, "match_created_B_slow");
        //
        // matchmake player B: switch to FAST
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A_fast");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B_fast");
        //
        // matchmake player A: switch to FAST > no match (have minted duels)
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "duel_id_A_fast");
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B_fast");
    }

    #[test]
    fn test_ranked_and_unranked_a_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Jameson)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_C: u128 = _airdrop_open(@sys, C, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_C");
        // setup lords
        _setup_ranked_lords(@sys, [A, B, C].span(), 1);
        // enter and pay fees
        let queue_id = QueueId::Ranked;
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // enter Ranked
        _mock_slot(@sys, 5);
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Fast);
        assert_eq!(duel_id_1, 0, "duel_id_1_A");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, A, ID_A_1, "match_created_A");
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id_1, 1, "duel_id_1_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id_1, A, ID_A_1, B, ID_B, "match_made_1");
        //
        // enter Unranked
        let queue_id = QueueId::Unranked;
        _mock_slot(@sys, 5);
        let duel_id_2: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_2, 0, "duel_id_2_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_2, "match_created_A_2");
        let duel_id_2: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_2, 2, "duel_id_2_C");
        _assert_match_queue(@sys, queue_id, [].span(), "match_C");
        _assert_match_started(@sys, queue_id, duel_id_2, A, ID_A_2, C, ID_C, "match_made_2");
        //
        // finish duels...
        _finish_duel(@sys, duel_id_1, 1, QueueId::Ranked, "finished_1");
        tester::assert_ranked_duel_results(@sys, duel_id_1, "ranked_results_1");
        _finish_duel(@sys, duel_id_2, 1, QueueId::Unranked, "finished_2");
        tester::assert_unranked_duel_results(@sys, duel_id_2, "ranked_results_1");
    }
    
    #[test]
    fn test_ranked_and_unranked_b_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Jameson)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_C: u128 = _airdrop_open(@sys, C, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_C");
        // setup lords
        _setup_ranked_lords(@sys, [A, B, C].span(), 1);
        // enter and pay fees
        let queue_id = QueueId::Ranked;
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        //
        // enter Ranked
        _mock_slot(@sys, 5);
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id_1, 0, "duel_id_1_A");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, B, ID_B, "match_created_B");
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Fast);
        assert_eq!(duel_id_1, 1, "duel_id_1_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id_1, B, ID_B, A, ID_A_1, "match_made_1");
        //
        // enter Unranked
        let queue_id = QueueId::Unranked;
        _mock_slot(@sys, 5);
        let duel_id_2: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_2, 0, "duel_id_2_C");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, C, ID_C, "match_created_C");
        let duel_id_2: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_2, 2, "duel_id_2_A");
        _assert_match_queue(@sys, queue_id, [].span(), "match_C");
        _assert_match_started(@sys, queue_id, duel_id_2, C, ID_C, A, ID_A_2, "match_made_2");
        //
        // finish duels...
        _finish_duel(@sys, duel_id_1, 1, QueueId::Ranked, "finished_1");
        tester::assert_ranked_duel_results(@sys, duel_id_1, "ranked_results_1");
        _finish_duel(@sys, duel_id_2, 1, QueueId::Unranked, "finished_2");
        tester::assert_unranked_duel_results(@sys, duel_id_2, "ranked_results_1");
    }
    
    //--------------------------------
    // bot_player IMP
    //

    #[test]
    fn test_unranked_expire_bot_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A, "match_created_A");
        //
        // ping once...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW / 2);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "ping_1");
        //
        // ping again...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW / 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "ping_2");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW / 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "ping_match");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
        //
        // duel...
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // is unranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "unranked_results");
    }

    #[test]
    fn test_unranked_expire_bot_player_skip_has_pact() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let ID_A_1: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_A_2: u128 = ID_A_1 + 1;
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        let duel_id_1: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A_1");
        // timeout + ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, duel_id_1, "ping_match_1");
        _assert_match_queue(@sys, queue_id, [].span(), "match_A_2");
        _assert_match_started(@sys, queue_id, duel_id_1, A, ID_A_1, sys.bot_player.contract_address, 0, "match_made_1");
        //
        // matchmake player A again...
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        let duel_id_2: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_2, "match_created_A_2");
        // timeout + ping to match a bot... must skip because has a pact
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "ping_match_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        //
        // finish first duel...
        // _finish_duel(@sys, duel_id_1, 1, queue_id, "finished_1");
        let (moves_a, _moves_b) = _get_moves_for_winner(@sys, 1, true);
        tester::execute_commit_moves_ID(@sys, A, ID_A_1, duel_id_1, moves_a.hashed);
        tester::execute_reveal_moves_ID(@sys, A, ID_A_1, duel_id_1, moves_a.salt, moves_a.moves);
        sys.bot_player.reveal_moves(duel_id_1);
        let ch = sys.store.get_challenge_value(duel_id_1);
        assert_eq!(ch.winner, 1, "finished_1_winner");
        //
        // ping again and match!
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, duel_id_2, "ping_match_final");
        _assert_match_queue(@sys, queue_id, [].span(), "match_A_2");
        _assert_match_started(@sys, queue_id, duel_id_2, A, ID_A_2, sys.bot_player.contract_address, 0, "match_made_final");
        // finish second duel...
        _finish_duel(@sys, duel_id_2, 1, queue_id, "finished_2");
    }

    #[test]
    fn test_unranked_bot_player_multiple_matches() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 3);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        let queue_id = QueueId::Unranked;
        //
        // matchmake player A
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW + 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "ping_match");
        _assert_match_queue(@sys, queue_id, [].span(), "matched_A");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A, sys.bot_player.contract_address, 0, "match_made");
        let ch_1: Challenge = sys.store.get_challenge(duel_id);
        //
        // matchmake player B
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_B");
        _assert_match_queue(@sys, queue_id, [B].span(), "match_B");
        //
        // ping to match a bot...
        tester::elapse_block_timestamp(MATCHMAKER::QUEUE_TIMEOUT_SLOW + 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 2, "ping_match");
        _assert_match_queue(@sys, queue_id, [].span(), "matched_B");
        _assert_match_started(@sys, queue_id, duel_id, B, ID_B, sys.bot_player.contract_address, 0, "match_made");
        let ch_2: Challenge = sys.store.get_challenge(duel_id);
        // different duelist bots
        assert_eq!(ch_1.address_b, ch_2.address_b, "address_b");
        assert_ne!(ch_1.duelist_id_a, ch_2.duelist_id_b, "duelist_id_a");
        //
        // Finish Duel 1...
        _finish_duel(@sys, ch_1.duel_id, 1, queue_id, "finished_1");
        tester::assert_unranked_duel_results(@sys, ch_1.duel_id, "finished_1");
        // finish Duel 2...
        _finish_duel(@sys, ch_2.duel_id, 1, queue_id, "finished_2");
        tester::assert_unranked_duel_results(@sys, ch_2.duel_id, "finished_2");
    }


    //--------------------------------
    // Duelists validation (Unranked)
    //

    #[test]
    fn test_unranked_duelist_stack() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_2");
        let ID_B_1: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_B_2: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Unranked;
        //
        // enter with duelist 2, select duelist 1
        _mock_slot(@sys, 5);
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_1, 0, "duel_id_1_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A_2");
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, B, ID_B_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_1, 1, "duel_id_1_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id_1, A, ID_A_1, B, ID_B_1, "match_made_1");
    }
    
    #[test]
    fn test_ranked_duelist_stack() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_2");
        let ID_B_1: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_B_2: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        //
        // enlist duelist 2, select duelist 1
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        let enlisted_duelist_a: u128 = tester::execute_enlist_duelist(@sys, A, ID_A_2, queue_id);
        let enlisted_duelist_b: u128 = tester::execute_enlist_duelist(@sys, B, ID_B_2, queue_id);
        assert_eq!(enlisted_duelist_a, ID_A_1, "enlisted_duelist_a");
        assert_eq!(enlisted_duelist_b, ID_B_1, "enlisted_duelist_b");
        //
        // enter with duelist 2, using duelist 1
        _mock_slot(@sys, 5);
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_1, 0, "duel_id_1_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A_2");
        let duel_id_1: u128 = tester::execute_match_make_me(@sys, B, ID_B_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id_1, 1, "duel_id_1_B");
        _assert_match_queue(@sys, queue_id, [].span(), "match_B");
        _assert_match_started(@sys, queue_id, duel_id_1, A, ID_A_1, B, ID_B_1, "match_made_1");
    }
    
    #[test]
    fn test_unranked_duelists_duel_and_match_ok() {
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
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, OWNED_BY_OWNER(), "match_created_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 2, "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, OWNED_BY_OWNER(), B, OWNED_BY_OTHER(), "match_made");
    }

    #[test]
    fn test_unranked_duelists_match_and_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, OWNED_BY_OWNER(), "match_created_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, OWNED_BY_OWNER(), B, OWNED_BY_OTHER(), "match_made");
        // enter a normal duel with different duelists...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }

    #[test]
    fn test_unranked_duelist_duel_after_match_a_b_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Slow);
        _assert_match_started(@sys, queue_id, duel_id, A, ID(A), B, ID(B), "match_made");
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // enter a normal duel should be possible...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "replied");
    }

    #[test]
    fn test_unranked_duelist_duel_after_match_b_a_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let _duel_id: u128 = tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Slow);
        _assert_match_started(@sys, queue_id, duel_id, A, ID(A), B, ID(B), "match_made");
        _finish_duel(@sys, duel_id, 1, queue_id, "finished");
        // enter a normal duel should be possible...
        let duel_id: u128 = tester::execute_create_duel(@sys, B, A, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, A, ID(A), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "replied");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_duelist_in_a_challenge_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::assert_pact(@sys, duel_id, true, false, "create_duel");
        // enter matchmaking...
        tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_duelist_in_a_challenge_b() {
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
        tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Slow);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_fast_duelist_in_matchmaking_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID(A), "match_created");
        // enter a normal duel... panic!
        tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_fast_duelist_in_matchmaking_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID(B), "match_created");
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_slow_duelist_in_matchmaking_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID(A), "match_created");
        // enter a normal duel... panic!
        tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_unranked_slow_duelist_in_matchmaking_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Unranked;
        tester::execute_match_make_me(@sys, B, ID(B), queue_id, QueueMode::Slow);
        _assert_match_created(@sys, queue_id, QueueMode::Slow, B, ID(B), "match_created");
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }



    //--------------------------------
    // Duelists validation (Ranked)
    //

    #[test]
    fn test_ranked_duelists_duel_and_match_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "replied");
        assert_eq!(duel_id, 1, "create_duel");
        // enter matchmaking with different duelists...
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, OWNED_BY_OWNER(), queue_id);
        tester::execute_enlist_duelist(@sys, B, OWNED_BY_OTHER(), queue_id);
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, OWNED_BY_OWNER(), "match_created_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 2, "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, OWNED_BY_OWNER(), B, OWNED_BY_OTHER(), "match_made");
    }

    #[test]
    fn test_ranked_duelists_match_and_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, OWNED_BY_OWNER(), queue_id);
        tester::execute_enlist_duelist(@sys, B, OWNED_BY_OTHER(), queue_id);
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, OWNED_BY_OWNER(), "match_created_A");
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, OWNED_BY_OTHER(), queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "match_B");
        _assert_match_started(@sys, queue_id, duel_id, A, OWNED_BY_OWNER(), B, OWNED_BY_OTHER(), "match_made");
        // enter a normal duel with different duelists...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 2, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "replied");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_duelist_in_a_challenge_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::assert_pact(@sys, duel_id, true, false, "create_duel");
        // enter matchmaking...
        tester::execute_enlist_duelist(@sys, A, ID(A), queue_id);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_duelist_in_a_challenge_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        tester::assert_pact(@sys, duel_id, true, true, "create_duel");
        // enter matchmaking...
        tester::execute_enlist_duelist(@sys, B, ID(B), queue_id);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_duelist_in_matchmaking_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, A, ID(A), queue_id);
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_duelist_in_matchmaking_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A, B].span(), 1);
        tester::execute_enlist_duelist(@sys, B, ID(B), queue_id);
        // enter a normal duel...
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, "", DuelType::Seasonal, 48, 1);
        assert_eq!(duel_id, 1, "create_duel");
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
    }



    //--------------------------------
    // Duelists stacking (Ranked+Slow)
    //

    fn _assert_next_duelists(sys: @TestSystems, queue_id: QueueId, address: ContractAddress, duelist_id: u128, next_duelists: Span<u128>, prefix: ByteArray) {
        let player: MatchPlayer = sys.store.get_match_player(address, queue_id);
        assert_eq!(player.duelist_id, duelist_id, "next:[{}] duelist_id", prefix);
        assert_eq!(player.next_duelists.len(), next_duelists.len(), "next:[{}] next_duelists", prefix);
        if (duelist_id > 0) {
            assert_gt!(player.queue_info.slot, 0, "next:[{}] slot_ok", prefix);
        } else {
            assert_eq!(player.queue_info.slot, 0, "next:[{}] slot_zero", prefix);
        }
        let mut i: usize = 0;
        while (i < next_duelists.len()) {
            let expected_duelist_id: u128 = *next_duelists[i];
            let next_duelist: QueueNextDuelist = *player.next_duelists[i];
            assert_eq!(next_duelist.duelist_id, expected_duelist_id, "next:[{}][{}] next_duelist.duelist_id", prefix, i);
            assert_gt!(next_duelist.slot, 0, "next:[{}][{}] next_duelist.slot", prefix, i);
            i += 1;
        };
    }

    #[test]
    fn test_unranked_next_duelists_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        let ID_A_1: u128 = ID(A);
        let ID_A_2: u128 = OWNED_BY_OWNER();
        let ID_B: u128 = ID(B);
        let ID_C: u128 = ID(C);
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        //
        // stack a duelist...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        // stack again, must not change...
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2_again");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2_again");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2_again");
        //
        // matchmake B
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_NEXT");
        _assert_next_duelists(@sys, queue_id, A, ID_A_2, [].span(), "next_A_NEXT");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 5);
        //
        // matchmake C
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 2, "match_C");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A_2, C, ID_C, "match_made_C");
        // A  is out of the queue...
        _assert_match_queue(@sys, queue_id, [].span(), "match_A_END");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "next_A_END");
    }

    #[test]
    fn test_ranked_next_duelists_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 4);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Misty)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_C: u128 = _airdrop_open(@sys, C, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_C");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B, C].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, A, ID_A_2, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        tester::execute_enlist_duelist(@sys, C, ID_C, queue_id);
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        //
        // stack a duelist...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
        //
        // matchmake B > unstack next duelist
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 1, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue, new duelist/slot in
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_NEXT");
        _assert_next_duelists(@sys, queue_id, A, ID_A_2, [].span(), "next_A_NEXT");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 5);
        //
        // matchmake C
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 2, "match_C");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A_2, C, ID_C, "match_made_C");
        // A  is out of the queue...
        _assert_match_queue(@sys, queue_id, [].span(), "match_A_END");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "next_A_END");
    }

    #[test]
    fn test_ranked_next_duelists_ping_mint_match() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let C: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 4);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Misty)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let ID_C: u128 = _airdrop_open(@sys, C, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_C");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B, C].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, A, ID_A_2, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        tester::execute_enlist_duelist(@sys, C, ID_C, queue_id);
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        let duel_id_1: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A_1");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        //
        // stack a duelist...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
        //
        // matchmake B > unstack next duelist
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, duel_id_1, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue, new duelist/slot in
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_NEXT");
        _assert_next_duelists(@sys, queue_id, A, ID_A_2, [].span(), "next_A_NEXT");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 5);
        //
        // ping A: mint a duelist...
        assert!(!sys.store.get_match_player(A, queue_id).queue_info.has_minted_duel, "!has_minted_duel");
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2+mint");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2+mint");
        _assert_next_duelists(@sys, queue_id, A, ID_A_2, [].span(), "match_A_2+mint");
        assert!(sys.store.get_match_player(A, queue_id).queue_info.has_minted_duel, "has_minted_duel");
        let duel_id_2: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_2, "match_created_A_2");
        //
        // matchmake C > match A
        let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, duel_id_2, "match_C");
        _assert_match_started(@sys, queue_id, duel_id, A, ID_A_2, C, ID_C, "match_made_C");
        // A  is out of the queue...
        _assert_match_queue(@sys, queue_id, [].span(), "match_A_END");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "next_A_END");
    }


//     #[test]
//     fn test_ranked_next_duelists_enqueue_ping_match() {
//         let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
//         let A: ContractAddress = OWNER();
//         let B: ContractAddress = OTHER();
//         let C: ContractAddress = BUMMER();
//         tester::fund_duelists_pool(@sys, 4);
//         let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
//         let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Misty)), "airdrop_A_2");
//         let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
//         let ID_C: u128 = _airdrop_open(@sys, C, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_C");
//         let queue_id = QueueId::Ranked;
//         // setup lords
//         _setup_ranked_lords(@sys, [A, B, C].span(), 2);
//         tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
//         tester::execute_enlist_duelist(@sys, A, ID_A_2, queue_id);
//         tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
//         tester::execute_enlist_duelist(@sys, C, ID_C, queue_id);
//         // enter matchmaking...
//         _mock_slot(@sys, 4);
//         let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
//         assert_eq!(duel_id, 0, "match_A_1");
//         let duel_id_1: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A_1");
//         _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
//         _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
//         assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
//         //
//         // stack a duelist...
//         _mock_slot(@sys, 5);
//         let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
//         assert_eq!(duel_id, 0, "match_A_2");
//         _assert_match_queue(@sys, queue_id, [A].span(), "match_queue_A");
//         _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
//         //
//         // matchmake B > unstack next duelist
//         let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
//         assert_eq!(duel_id, duel_id_1, "match_B");
//         // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
//         // A still in queue, new duelist/slot in
//         _assert_match_queue(@sys, queue_id, [A].span(), "match_A_NEXT");
//         _assert_next_duelists(@sys, queue_id, A, ID_A_2, [].span(), "next_A_NEXT");
//         assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 5);
//         //
//         // matchmake C > no match yet
//         _mock_slot(@sys, 1);
//         let duel_id: u128 = tester::execute_match_make_me(@sys, C, ID_C, queue_id, QueueMode::Slow);
//         assert_eq!(duel_id, 0, "match_C");
//         let duel_id_2: u128 = _assert_match_created(@sys, queue_id, QueueMode::Slow, C, ID_C, "match_created_C");
//         _assert_match_queue(@sys, queue_id, [A, C].span(), "match_queue_C");
//         //
//         // ping A > match C
//         assert!(!sys.store.get_match_player(A, queue_id).queue_info.has_minted_duel, "!has_minted_duel");
//         assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.timestamp_ping, 0, "!timestamp_ping");
//         let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
//         assert_eq!(duel_id, duel_id_2, "match_A_2+mint");
//         _assert_match_started(@sys, queue_id, duel_id, C, ID_C, A, ID_A_2, "match_made_C");
//         // A  is out of the queue...
//         _assert_match_queue(@sys, queue_id, [].span(), "match_A_END");
//         _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "next_A_END");
//     }

    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_next_duelists_invalid_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        tester::fund_duelists_pool(@sys, 2);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_2");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, A, ID_A_2, queue_id);
        // enter matchmaking...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        // stack the same duelist profile... panic!
        tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid mode', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_next_duelists_slow_fast_nok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID(A), queue_id);
        tester::execute_enlist_duelist(@sys, A, OWNED_BY_OWNER(), queue_id);
        // enter matchmaking...
        tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Slow);
        // adding another duelist to Fast will panic
        tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Fast);
    }

    #[test]
    #[should_panic(expected: ('MATCHMAKER: Invalid mode', 'ENTRYPOINT_FAILED'))]
    fn test_ranked_next_duelists_fast_fast_nok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME);
        let A: ContractAddress = OWNER();
        let queue_id = QueueId::Ranked;
        _setup_ranked_lords(@sys, [A].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID(A), queue_id);
        tester::execute_enlist_duelist(@sys, A, OWNED_BY_OWNER(), queue_id);
        // enter matchmaking...
        tester::execute_match_make_me(@sys, A, ID(A), queue_id, QueueMode::Fast);
        // adding another duelist to Fast will panic
        tester::execute_match_make_me(@sys, A, OWNED_BY_OWNER(), queue_id, QueueMode::Fast);
    }


    //--------------------------------
    // clear queue
    //

    #[test]
    fn test_unranked_slow_clear_queue_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 4);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Misty)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        //
        // stack a duelist...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
        //
        // matchmake B > no match
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue, new duelist/slot in
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "match_B_next_A");
        _assert_next_duelists(@sys, queue_id, B, ID_B, [].span(), "match_B_next_B");
        //
        // assignments
        let assignment_a_1: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_1);
        assert_eq!(assignment_a_1.queue_id, queue_id, "assignment_a_1.queue_id");
        assert_gt!(assignment_a_1.duel_id, 0, "assignment_a_1.duel_id");
        let assignment_a_2: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_2);
        assert_eq!(assignment_a_2.queue_id, queue_id, "assignment_a_2.queue_id");
        assert_eq!(assignment_a_2.duel_id, 0, "assignment_a_2.duel_id");
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(ID_B);
        assert_eq!(assignment_b.queue_id, queue_id, "assignment_b.queue_id");
        assert_gt!(assignment_b.duel_id, 0, "assignment_b.duel_id");
        //
        // clear queue...
        tester::impersonate(OWNER());
        sys.matchmaker.clear_queue(queue_id);
        // check queues...
        _assert_match_queue(@sys, queue_id, [].span(), "cleared_queue");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "cleared_queue_next_A");
        _assert_next_duelists(@sys, queue_id, B, 0, [].span(), "cleared_queue_next_B");
        //
        // assignments
        tester::assert_pact_queue(@sys, assignment_a_1.duel_id, true, true, queue_id, "assignment_a_1");
        let assignment_a_2: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_2);
        assert_eq!(assignment_a_2.queue_id, QueueId::Undefined, "assignment_a_2.queue_id");
        assert_eq!(assignment_a_2.duel_id, 0, "assignment_a_2.duel_id");
        tester::assert_pact_queue(@sys, assignment_b.duel_id, true, true, queue_id, "assignment_b");
    }

    #[test]
    fn test_unranked_slow_clear_player_queue_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 4);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_A_2: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Misty)), "airdrop_A_2");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Unranked;
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_created(@sys, queue_id, QueueMode::Slow, A, ID_A_1, "match_created_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        //
        // stack a duelist...
        _mock_slot(@sys, 5);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_2, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_A_2");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_2");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "next_A_2");
        //
        // matchmake B > no match
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Slow);
        assert_eq!(duel_id, 0, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue, new duelist/slot in
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [ID_A_2].span(), "match_B_next_A");
        _assert_next_duelists(@sys, queue_id, B, ID_B, [].span(), "match_B_next_B");
        //
        // assignments
        let assignment_a_1: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_1);
        assert_eq!(assignment_a_1.queue_id, queue_id, "assignment_a_1.queue_id");
        assert_gt!(assignment_a_1.duel_id, 0, "assignment_a_1.duel_id");
        let assignment_a_2: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_2);
        assert_eq!(assignment_a_2.queue_id, queue_id, "assignment_a_2.queue_id");
        assert_eq!(assignment_a_2.duel_id, 0, "assignment_a_2.duel_id");
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(ID_B);
        assert_eq!(assignment_b.queue_id, queue_id, "assignment_b.queue_id");
        assert_gt!(assignment_b.duel_id, 0, "assignment_b.duel_id");
        //
        // clear A...
        tester::impersonate(OWNER());
        sys.matchmaker.clear_player_queue(queue_id, A);
        // check queues...
        _assert_match_queue(@sys, queue_id, [B].span(), "cleared_player_queue_A");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "cleared_player_A_queue_next_A");
        _assert_next_duelists(@sys, queue_id, B, ID_B, [].span(), "cleared_player_A_queue_next_B");
        //
        // clear B...
        tester::impersonate(OWNER());
        sys.matchmaker.clear_player_queue(queue_id, B);
        // check queues...
        _assert_match_queue(@sys, queue_id, [].span(), "cleared_player_B_queue");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "cleared_player_B_queue_next_A");
        _assert_next_duelists(@sys, queue_id, B, 0, [].span(), "cleared_player_B_queue_next_B");
    }

    #[test]
    fn test_ranked_fast_clear_queue_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 4);
        let ID_A_1: u128 = _airdrop_open(@sys, A, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_A_1");
        let ID_B: u128 = _airdrop_open(@sys, B, PackType::SingleDuelist, Option::Some(DuelistProfile::Genesis(GenesisKey::Duke)), "airdrop_B");
        let queue_id = QueueId::Ranked;
        // setup lords
        _setup_ranked_lords(@sys, [A, B].span(), 2);
        tester::execute_enlist_duelist(@sys, A, ID_A_1, queue_id);
        tester::execute_enlist_duelist(@sys, B, ID_B, queue_id);
        // enter matchmaking...
        _mock_slot(@sys, 4);
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, ID_A_1, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_A_1");
        _assert_match_created(@sys, queue_id, QueueMode::Fast, A, ID_A_1, "match_created_A");
        _assert_match_queue(@sys, queue_id, [A].span(), "match_A_1");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "next_A_1");
        assert_eq!(sys.store.get_match_player(A, queue_id).queue_info.slot, 4);
        //
        // matchmake B > no match
        _mock_slot(@sys, 1);
        let duel_id: u128 = tester::execute_match_make_me(@sys, B, ID_B, queue_id, QueueMode::Fast);
        assert_eq!(duel_id, 0, "match_B");
        // _assert_match_started(@sys, queue_id, duel_id, A, ID_A_1, B, ID_B, "match_made_B"); // will fail as duelist_id is still set
        // A still in queue, new duelist/slot in
        _assert_match_queue(@sys, queue_id, [A, B].span(), "match_B");
        _assert_next_duelists(@sys, queue_id, A, ID_A_1, [].span(), "match_B_next_A");
        _assert_next_duelists(@sys, queue_id, B, ID_B, [].span(), "match_B_next_B");
        //
        // assignments
        let assignment_a_1: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_1);
        assert_eq!(assignment_a_1.queue_id, queue_id, "assignment_a_1.queue_id");
        assert_eq!(assignment_a_1.duel_id, 0, "assignment_a_1.duel_id");
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(ID_B);
        assert_eq!(assignment_b.queue_id, queue_id, "assignment_b.queue_id");
        assert_eq!(assignment_b.duel_id, 0, "assignment_b.duel_id");
        //
        // clear queue...
        tester::impersonate(OWNER());
        sys.matchmaker.clear_queue(queue_id);
        // check queues...
        _assert_match_queue(@sys, queue_id, [].span(), "cleared_queue");
        _assert_next_duelists(@sys, queue_id, A, 0, [].span(), "cleared_queue_next_A");
        _assert_next_duelists(@sys, queue_id, B, 0, [].span(), "cleared_queue_next_B");
        //
        // assignments
        let assignment_a_1: DuelistAssignment = sys.store.get_duelist_assignment(ID_A_1);
        assert_eq!(assignment_a_1.queue_id, queue_id, "assignment_a_1.queue_id");
        assert_eq!(assignment_a_1.duel_id, 0, "assignment_a_1.duel_id");
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(ID_B);
        assert_eq!(assignment_b.queue_id, queue_id, "assignment_b.queue_id");
        assert_eq!(assignment_b.duel_id, 0, "assignment_b.duel_id");
    }
}
