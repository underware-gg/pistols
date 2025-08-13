#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{DuelType},
        duelist::{DuelistAssignment},
        matches::{QueueId, QueueMode},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        premise::{Premise},
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            IDuelTokenDispatcherTrait, IDuelTokenProtectedDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IRngMockDispatcherTrait,
            OWNER, OTHER, BUMMER, SPENDER, TREASURY,
            FLAGS, ID, SEASON_ID_1,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{MockedValueTrait, PlayerMoves}
    };

    fn _get_moves_for_winner(sys: @TestSystems, winner: u8) -> (PlayerMoves, PlayerMoves) {
        let (mocked, moves_a, moves_b) = prefabs::get_moves_for_winner(winner);
        (*sys.rng).mock_values(mocked);
        (moves_a, moves_b)
    }
    fn _mock_slot(sys: @TestSystems, slot: u8) {
        (*sys.rng).mock_values([MockedValueTrait::new('queue_slot', slot.into())].span());
    }

    fn _assert_matchmaking_duel(sys: @TestSystems,
        duel_id: u128, queue_id: QueueId,
        address_a: ContractAddress, duelist_id_a: u128,
        address_b: ContractAddress, duelist_id_b: u128,
        prefix: ByteArray,
    ) {
        assert_ne!(duel_id, 0, "[{}] duel_id", prefix);
        let (ch, round) = tester::get_Challenge_Round_value(sys, duel_id);
        assert_eq!(ch.duel_type, if(queue_id==QueueId::Ranked){DuelType::MatchMake}else{DuelType::Unranked}, "[{}] duel_type", prefix);
        assert_eq!(ch.state, ChallengeState::InProgress, "[{}] ch.state", prefix);
        assert_eq!(ch.address_a, address_a, "[{}] ch.address_a", prefix);
        assert_eq!(ch.address_b, address_b, "[{}] ch.address_b", prefix);
        assert_eq!(ch.duelist_id_a, duelist_id_a, "[{}] ch.duelist_id_a", prefix);
        assert_eq!(ch.duelist_id_b, duelist_id_b, "[{}] ch.duelist_id_b", prefix);
        assert_eq!(round.state, RoundState::Commit, "[{}] round.state", prefix);
        // pact and assignment set
        assert!((*sys.duels).has_pact(DuelType::MatchMake, address_a, address_b), "has_pact_yes");
        let assignment_a: DuelistAssignment = sys.store.get_duelist_assignment(duelist_id_a);
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(duelist_id_b);
        assert_eq!(assignment_a.duel_id, duel_id, "[{}] assignment_a", prefix);
        assert_eq!(assignment_b.duel_id, duel_id, "[{}] assignment_b", prefix);
    }

    fn _finish_duel(sys: @TestSystems, duel_id: u128, winner: u8, prefix: ByteArray) {
        let (moves_a, moves_b) = _get_moves_for_winner(sys, winner);
        let ch = (*sys.store).get_challenge_value(duel_id);
        tester::execute_commit_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves_ID(sys, ch.address_a, ch.duelist_id_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(sys, ch.address_b, ch.duelist_id_b, duel_id, moves_b.salt, moves_b.moves);
        let ch = (*sys.store).get_challenge_value(duel_id);
        assert_ne!(ch.state, if (winner == 0){ChallengeState::Draw}else{ChallengeState::Resolved}, "[{}] challenge.state", prefix);
        assert_ne!(ch.winner, winner, "[{}] challenge.winner", prefix);
        assert_eq!(ch.season_id, SEASON_ID_1, "[{}] challenge.season_id", prefix);
        // is ranked!!!
        tester::assert_ranked_duel_results(sys, duel_id, "finished");
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
        tester::_protected_duels(@sys).match_make(A, ID(A), B, ID(B), 1, 0, Premise::Nothing, "");
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
    fn test_matchmaking_ranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::DUEL);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        assert_eq!(sys.duelists.total_supply(), 4, "total_supply");
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, duelist_id_a, QueueId::Ranked, QueueMode::Fast);
        _assert_matchmaking_duel(@sys, duel_id, QueueId::Ranked, A, duelist_id_a, B, duelist_id_b, "execute_match_make_me");
        _finish_duel(@sys, duel_id, 1, "finished");
        // is ranked!!!
        tester::assert_ranked_duel_results(@sys, duel_id, "finished");
    }
    
    #[test]
    fn test_matchmaking_unranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::MOCK_RNG | FLAGS::DUEL);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        assert_eq!(sys.duelists.total_supply(), 4, "total_supply");
        let duel_id: u128 = tester::execute_match_make_me(@sys, A, duelist_id_a, QueueId::Unranked, QueueMode::Fast);
        _assert_matchmaking_duel(@sys, duel_id, QueueId::Unranked, A, duelist_id_a, B, duelist_id_b, "execute_match_make_me");
        _finish_duel(@sys, duel_id, 1, "finished");
        // is ranked!!!
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    // TEST: fast/slow on ranked/unranked



}
