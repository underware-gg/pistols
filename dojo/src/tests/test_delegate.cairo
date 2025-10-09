#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use pistols::models::{
        challenge::{DuelType},
        player::{PlayerDelegationTrait},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            ID, OWNER, OTHER, DELEGATEE, MESSAGE,
        }
    };
    use pistols::systems::rng_mock::{
        IRngMockDispatcherTrait,
        // MockedValue, MockedValueTrait,
    };
    use pistols::tests::prefabs::{prefabs};

    const EXPIRE_MINUTES: u64 = (24 * 60);

    fn _assert_duel(sys: @TestSystems, duel_id: u128, state: ChallengeState, address_a: ContractAddress, address_b: ContractAddress, prefix: ByteArray) {
        let ch = (*sys.store).get_challenge_value(duel_id);
        assert_eq!(ch.state, state, "[{}]state", prefix);
        assert_eq!(ch.address_a, address_a, "[{}]challenger did not change", prefix);
        assert_eq!(ch.address_b, address_b, "[{}]challenged did not change", prefix);
    }

    #[test]
    fn test_challenge_reply_delegated_b_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // not delegated yet
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, A, A), "trait: A>A");
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, B, B), "trait: B>B");
        assert!(!PlayerDelegationTrait::can_play_game(@sys.store, A, B), "trait: A>B");
        assert!(!PlayerDelegationTrait::can_play_game(@sys.store, B, A), "trait: B>A");
        assert!(!PlayerDelegationTrait::can_play_game(@sys.store, B, DELEGATEE()), "trait: not delegated yet");
        assert!(!sys.store.get_player_delegation_can_play_game(B, DELEGATEE()), "store: not delegated yet");
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        assert!(sys.store.get_player_delegation_can_play_game(B, DELEGATEE()), "store: is delegated now");
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, B, DELEGATEE()), "trait: is delegated now");
        // delegated, should not panic...
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, true);
        _assert_duel(@sys, duel_id, ChallengeState::InProgress, A, B, "reply");
        //
        // commit/reveal
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves(@sys, A, duel_id, moves_a.hashed);
        tester::execute_commit_moves_ID(@sys, DELEGATEE(), ID(B), duel_id, moves_b.hashed);
        _assert_duel(@sys, duel_id, ChallengeState::InProgress, A, B, "reply");
        tester::execute_reveal_moves(@sys, A, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(@sys, DELEGATEE(), ID(B), duel_id, moves_b.salt, moves_b.moves);
        _assert_duel(@sys, duel_id, ChallengeState::Draw, A, B, "draw");
        //
        // remove delegation...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), false);
        assert!(!sys.store.get_player_delegation_can_play_game(B, DELEGATEE()), "store: not delegated anymore");
        assert!(!PlayerDelegationTrait::can_play_game(@sys.store, B, DELEGATEE()), "trait: not delegated anymore");
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, B, B), "trait: B>B still OK!");
    }

    #[test]
    fn test_challenge_reply_delegated_b_first_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, true);
        // commit/reveal
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves_ID(@sys, DELEGATEE(), ID(B), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys, A, duel_id, moves_a.hashed);
        _assert_duel(@sys, duel_id, ChallengeState::InProgress, A, B, "reply");
        tester::execute_reveal_moves_ID(@sys, DELEGATEE(), ID(B), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys, A, duel_id, moves_a.salt, moves_a.moves);
        _assert_duel(@sys, duel_id, ChallengeState::Draw, A, B, "draw");
    }

    #[test]
    fn test_challenge_reply_delegated_a_first_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        // delegate...
        tester::execute_delegate_game_actions(@sys, A, DELEGATEE(), true);
        assert!(sys.store.get_player_delegation_can_play_game(A, DELEGATEE()), "store: is delegated now");
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, A, DELEGATEE()), "trait: is delegated now");
        // commit/reveal
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves_ID(@sys, DELEGATEE(), ID(A), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys, B, duel_id, moves_b.hashed);
        _assert_duel(@sys, duel_id, ChallengeState::InProgress, A, B, "reply");
        tester::execute_reveal_moves_ID(@sys, DELEGATEE(), ID(A), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys, B, duel_id, moves_b.salt, moves_b.moves);
        _assert_duel(@sys, duel_id, ChallengeState::Draw, A, B, "draw");
    }

    #[test]
    fn test_challenge_reply_delegated_a_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        // delegate...
        tester::execute_delegate_game_actions(@sys, A, DELEGATEE(), true);
        assert!(sys.store.get_player_delegation_can_play_game(A, DELEGATEE()), "store: is delegated now");
        assert!(PlayerDelegationTrait::can_play_game(@sys.store, A, DELEGATEE()), "trait: is delegated now");
        // commit/reveal
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves(@sys, B, duel_id, moves_b.hashed);
        tester::execute_commit_moves_ID(@sys, DELEGATEE(), ID(A), duel_id, moves_a.hashed);
        _assert_duel(@sys, duel_id, ChallengeState::InProgress, A, B, "reply");
        tester::execute_reveal_moves(@sys, B, duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves_ID(@sys, DELEGATEE(), ID(A), duel_id, moves_a.salt, moves_a.moves);
        _assert_duel(@sys, duel_id, ChallengeState::Draw, A, B, "draw");
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_undelegate() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, true);
        // remove delegation...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), false);
        assert!(!sys.store.get_player_delegation_can_play_game(B, DELEGATEE()), "store: not delegated anymore");
        assert!(!PlayerDelegationTrait::can_play_game(@sys.store, B, DELEGATEE()), "trait: not delegated anymore");
        // commit/reveal
        let (mocked, _moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves_ID(@sys, DELEGATEE(), ID(B), duel_id, moves_b.hashed);
    }

    #[test]
    fn test_challenge_refuse_delegated_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate and refuse
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, false);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Refused, "state");
        assert_eq!(ch.address_a, A, "challenger did not change");
        assert_eq!(ch.address_b, B, "challenged did not change");
    }

    //
    // delegate and reply to other player
    //

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_delegated_wrong_player_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, A, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUELIST: Not your duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_delegated_wrong_player_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(A), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_delegated_wrong_duelist_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, A, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(B), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUELIST: Not your duelist', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_reply_delegated_wrong_duelist_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, DELEGATEE(), true);
        tester::execute_reply_duel(@sys, DELEGATEE(), ID(A), duel_id, true);
    }

    #[test]
    #[should_panic(expected:('DUEL: Reply self', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_delegated_reply_b_to_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, A, true);
        // A cannot reply as B
        tester::execute_reply_duel(@sys, A, ID(B), duel_id, true);
    }

    //
    // delegate and play as other player
    //

    #[test]
    #[should_panic(expected:('PISTOLS: Cross delegation', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_delegated_commit_b_to_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        // delegate...
        tester::execute_delegate_game_actions(@sys, B, A, true);
        // A cannot commit as B!
        tester::execute_commit_moves_ID(@sys, A, ID(B), duel_id, 1234);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Cross delegation', 'ENTRYPOINT_FAILED'))]
    fn test_challenge_delegated_commit_a_to_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let duel_id: u128 = tester::execute_create_duel(@sys, A, B, MESSAGE(), DuelType::Seasonal, EXPIRE_MINUTES, 1);
        tester::execute_reply_duel(@sys, B, ID(B), duel_id, true);
        // delegate...
        tester::execute_delegate_game_actions(@sys, A, B, true);
        // A cannot commit as B!
        tester::execute_commit_moves_ID(@sys, B, ID(A), duel_id, 1234);
    }

    // #[test]
    // #[should_panic(expected:('DUEL: xxx', 'ENTRYPOINT_FAILED'))]
    // fn test_challenge_delegated_reveal_b_to_a() {
    //     // reveal is premissionless!
    // }

    // #[test]
    // #[should_panic(expected:('DUEL: xxx', 'ENTRYPOINT_FAILED'))]
    // fn test_challenge_delegated_reveal_a_to_b() {
    //     // reveal is premissionless!
    // }

}
