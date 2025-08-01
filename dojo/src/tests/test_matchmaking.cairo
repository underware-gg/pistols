#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{DuelType},
        duelist::{DuelistAssignment},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        round_state::{RoundState},
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            IDuelTokenDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IRngMockDispatcherTrait,
            OWNER, OTHER, BUMMER, SPENDER,
            FLAGS, ID, SEASON_ID_1,
        }
    };
    use pistols::tests::prefabs::{prefabs};


    fn _assert_matchmaking_duel(sys: @TestSystems,
        duel_id: u128,
        address_a: ContractAddress, duelist_id_a: u128,
        address_b: ContractAddress, duelist_id_b: u128,
        prefix: ByteArray,
    ) {
        let (ch, round) = tester::get_Challenge_Round_value(sys, duel_id);
        assert_eq!(ch.duel_type, DuelType::MatchMake, "[{}] duel_type", prefix);
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
    

    //------------------------------
    // duel flow
    //

    #[test]
    fn test_matchmaking_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::MOCK_RNG);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::fund_duelists_pool(@sys, 2);
        let duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        assert_eq!(sys.duelists.total_supply(), 4, "total_supply");
        let duel_id: u128 = tester::execute_match_make(@sys, OWNER(), A, duelist_id_a, B, duelist_id_b);
        _assert_matchmaking_duel(@sys, duel_id, A, duelist_id_a, B, duelist_id_b, "execute_match_make");
        //
        // duel to the end...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves_ID(@sys, A, duelist_id_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves_ID(@sys, B, duelist_id_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves_ID(@sys, A, duelist_id_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(@sys, B, duelist_id_b, duel_id, moves_b.salt, moves_b.moves);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_ne!(ch.state, ChallengeState::InProgress, "challenge.state_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
        assert_eq!(ch.season_id, SEASON_ID_1, "season_id");
        // pact and assignment unset
        assert!(!sys.duels.has_pact(DuelType::MatchMake, A, B), "has_pact_no");
        let assignment_a: DuelistAssignment = sys.store.get_duelist_assignment(duelist_id_a);
        let assignment_b: DuelistAssignment = sys.store.get_duelist_assignment(duelist_id_b);
        assert_eq!(assignment_a.duel_id, 0, "assignment_a.0");
        assert_eq!(assignment_b.duel_id, 0, "assignment_b.0");
        // is ranked!!!
        tester::assert_ranked_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_create_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::execute_match_make(@sys, OTHER(), A, ID(A), B, ID(B));
    }

    #[test]
    fn test_create_is_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = SPENDER();
        let B: ContractAddress = BUMMER();
        // set as asdmin
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, true);
        let duel_id: u128 = tester::execute_match_make(@sys, OTHER(), A, ID(A), B, ID(B));
        _assert_matchmaking_duel(@sys, duel_id, A, ID(A), B, ID(B), "execute_match_make");
    }

    #[test]
    #[should_panic(expected: ('DUEL: Invalid self challenge', 'ENTRYPOINT_FAILED'))]
    fn test_create_same_player() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = OTHER();
        tester::execute_match_make(@sys, OWNER(), A, ID(A), B, ID(B));
    }

    #[test]
    #[should_panic(expected: ('DUELIST: Invalid duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_null_duelist_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::execute_match_make(@sys, OWNER(), A,0, B, ID(B));
    }

    #[test]
    #[should_panic(expected: ('DUELIST: Invalid duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_null_duelist_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::execute_match_make(@sys, OWNER(), A, ID(A), B, 0);
    }
    #[test]
    #[should_panic(expected: ('DUELIST: Not your duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_not_owner_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::execute_match_make(@sys, OWNER(), A, ID(OWNER()), B, ID(B));
    }

    #[test]
    #[should_panic(expected: ('DUELIST: Not your duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_not_owner_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let A: ContractAddress = OTHER();
        let B: ContractAddress = BUMMER();
        tester::execute_match_make(@sys, OWNER(), A, ID(A), B, ID(OWNER()));
    }

}
