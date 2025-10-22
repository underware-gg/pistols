#[cfg(test)]
pub mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{ChallengeValue, DuelType, ChallengeTrait},
        duelist::{Duelist, Archetype, DuelistAssignment},
        player::{PlayerDuelistStack},
        pool::{Pool, PoolType},
        match_queue::{QueueId},
    };
    use pistols::types::{
        cards::deck::{Deck},
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, DuelistProfileTrait, CollectionDescriptor, BotKey},
    };
    use pistols::libs::{
        moves_hash::{MovesHashTrait},
        bot::{BotPlayerMovesTrait},
    };
    use pistols::utils::arrays::{ArrayUtilsTrait};
    use pistols::systems::rng_mock::{
        IRngMockDispatcherTrait,
        MockedValue, MockedValueTrait,
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            IDuelTokenDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IBotPlayerDispatcherTrait,
            IBotPlayerProtectedDispatcher,
            IBotPlayerProtectedDispatcherTrait,
            ILordsMockDispatcherTrait,
            IFameCoinDispatcherTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT, SPENDER, STACKER, TREASURY,
            ZERO, ID, MESSAGE, SEASON_ID_1,
        }
    };
    use pistols::tests::prefabs::{prefabs, prefabs::{PlayerMoves}};

    const TOKEN_ID_1: u128 = 1;

    const MOCKED_VILLAIN: felt252 = 4;      // mod(profile_keys_count) = zero
    const MOCKED_TRICKSTER: felt252 = 1;
    const MOCKED_LORD: felt252 = 2;
    const MOCKED_PRO: felt252 = 3;

    pub fn _protected(sys: @TestSystems) -> IBotPlayerProtectedDispatcher {
        (IBotPlayerProtectedDispatcher{contract_address: (*sys.bot_player).contract_address})
    }

    //
    // bot profiles
    //

    fn _assert_bot_duelist(sys: @TestSystems, bot_id: u128, prefix: ByteArray, expected_profile: Option<BotKey>, stack_len: usize) {
        let bot_address: ContractAddress = *sys.bot_player.contract_address;
        if (stack_len > 0) {
            // dead duelists are transferred to player
            assert_eq!((*sys).duelists.owner_of(bot_id.into()), bot_address, "_assert_bot_duelist[{}]: owner_of(bot_address)", prefix);
        }
        let duelist: Duelist = sys.store.get_duelist(bot_id);
        let collection: CollectionDescriptor = duelist.duelist_profile.collection();
        assert_eq!(collection.folder_name, 'bots', "_assert_bot_duelist[{}]: duelist_profile.folder_name", prefix);
        if let Option::Some(key) = expected_profile {
            assert_eq!(duelist.duelist_profile, DuelistProfile::Bot(key), "_assert_bot_duelist[{}]: duelist_profile", prefix);
        }
        // check stack
        let stack: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(bot_address, bot_id);
// println!("{}: id[{}], {:?} stacked:{}", prefix, bot_id, duelist.duelist_profile, stack.stacked_ids.len());
        assert_eq!(stack.stacked_ids.len(), stack_len, "_assert_bot_duelist[{}]: stack.len()", prefix);
    }

    fn _assert_mint_pools_after_mint(sys: @TestSystems, peg_before: Pool, claimable_before: Pool, fame_supply_before: u256, prefix: ByteArray) -> (Pool, Pool, u256) {
        let pool_peg_after: Pool = sys.store.get_pool(PoolType::FamePeg);
        let pool_claimable_after: Pool = sys.store.get_pool(PoolType::Claimable);
        let fame_supply_after: u256 = (*sys.fame).total_supply();
        // bots do not peg!
        assert_eq!(pool_peg_after.balance_lords, peg_before.balance_lords, "[{}] pool_peg_after", prefix);
        assert_eq!(pool_claimable_after.balance_lords, claimable_before.balance_lords, "[{}] pool_claimable_after", prefix);
        // fame supply increases
        assert_gt!(fame_supply_after, fame_supply_before, "[{}] fame_supply_after", prefix);
        (pool_peg_after, pool_claimable_after, fame_supply_after)
    }
    
    #[test]
    fn test_mint_bot_duelists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        // mint players
        tester::fund_duelists_pool(@sys, 6);
        let duelist_id_1: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let duelist_id_2: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let duelist_id_3: u128 = *tester::execute_claim_starter_pack(@sys, BUMMER())[0];
        let duelist_id_4: u128 = *tester::execute_claim_starter_pack(@sys, RECIPIENT())[0];
        let duelist_id_5: u128 = *tester::execute_claim_starter_pack(@sys, SPENDER())[0];
        let duelist_id_6: u128 = *tester::execute_claim_starter_pack(@sys, STACKER())[0];
        // store initial pool balances
        let pool_peg_init: Pool = sys.store.get_pool(PoolType::FamePeg);
        let claimable_init: Pool = sys.store.get_pool(PoolType::Claimable);
        let fame_supply_init: u256 = sys.fame.total_supply();
        // 1
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_VILLAIN)].span());
        let bot_id_1: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, OWNER(), duelist_id_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_1, "bot_1", Option::Some(BotKey::TinMan), 1);
        let (pool_peg_1, claimable_1, fame_supply_1): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_init, claimable_init, fame_supply_init, "pools_1");
        // 2
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_TRICKSTER)].span());
        let bot_id_2: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, OTHER(), duelist_id_2, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_2, "bot_2", Option::Some(BotKey::Scarecrow), 1);
        let (pool_peg_2, claimable_2, fame_supply_2): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_1, claimable_1, fame_supply_1, "pools_2");
        // 3
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_LORD)].span());
        let bot_id_3: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, BUMMER(), duelist_id_3, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_3, "bot_3", Option::Some(BotKey::Leon), 1);
        let (pool_peg_3, claimable_3, fame_supply_3): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_2, claimable_2, fame_supply_2, "pools_3");
        // 4
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_VILLAIN)].span());
        let bot_id_4: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, RECIPIENT(), duelist_id_4, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "bot_4", Option::Some(BotKey::TinMan), 2);
        let (pool_peg_4, claimable_4, fame_supply_4): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_3, claimable_3, fame_supply_3, "pools_4");
        // 5
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_TRICKSTER)].span());
        let bot_id_5: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, SPENDER(), duelist_id_5, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_5, "bot_5", Option::Some(BotKey::Scarecrow), 2);
        let (pool_peg_5, claimable_5, fame_supply_5): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_4, claimable_4, fame_supply_4, "pools_5");
        // 6
        sys.rng.mock_values([MockedValueTrait::new('bot_archetype', MOCKED_PRO)].span());
        let bot_id_6: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, STACKER(), duelist_id_6, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_6, "bot_6", Option::Some(BotKey::Pro), 1);
        let (_pool_peg_6, _claimable_6, _fame_supply_6): (Pool, Pool, u256) = _assert_mint_pools_after_mint(@sys, pool_peg_5, claimable_5, fame_supply_5, "pools_6");
    }


    //------------------------------
    // duel flow
    //

    #[test]
    fn test_bot_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 0);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_CREATE");
        assert_eq!(round.state, RoundState::Commit, "round.state_CREATE");
        assert_eq!(ch.duel_type, DuelType::BotPlayer, "duel_type");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, bot_address, "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_ne!(ch.duelist_id_b, 0, "challenged_id"); // bot minted a duelist!
        // pact and assignment set
        assert!(sys.duels.has_pact(DuelType::BotPlayer, OWNER(), bot_address), "has_pact_yes");
        let assignment: DuelistAssignment = sys.store.get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment.duel_id, duel_id, "duelist_assignment.duel_id");
        // validate minted bot duelist
        let bot_duelist_id: u128 = ch.duelist_id_b;
        assert_eq!(sys.duelists.total_supply(), 3, "total_supply 3");
        assert_eq!(sys.duelists.balance_of(bot_address), 1, "balance_of(bot_address) 1");
        _assert_bot_duelist(@sys, bot_duelist_id, "challenged", Option::None, 1);
        //
        // player commits, bot commits
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        tester::execute_commit_moves(@sys, OWNER(), duel_id, moves_a.hashed);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_COMMIT");
        assert_eq!(round.state, RoundState::Reveal, "round.state_COMMIT");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "round.moves_a.hashed");
        assert_gt!(round.moves_b.hashed, 0, "round.moves_b.hashed");
        //
        // call bot reveal
        tester::execute_reveal_moves_ID(@sys, OWNER(), TOKEN_ID_1, duel_id, moves_a.salt, moves_a.moves);
        sys.bot_player.reveal_moves(duel_id);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_ne!(ch.state, ChallengeState::InProgress, "challenge.state_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
        assert_eq!(ch.season_id, SEASON_ID_1, "season_id");
        // pact and assignment unset
        assert!(!sys.duels.has_pact(DuelType::BotPlayer, OWNER(), bot_address), "has_pact_no");
        let assignment: DuelistAssignment = sys.store.get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment.duel_id, 0, "duelist_assignment.0");
        // PRACTICE, player has no score, no fools, no fame
        tester::assert_practice_duel_results(@sys, duel_id, "finished");
    }

    #[test]
    fn test_bot_restore_reveal_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 0);
        // player commits, bot commits
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        tester::execute_commit_moves(@sys, OWNER(), duel_id, moves_a.hashed);
        //
        // restore and reveal...
        let ch = sys.store.get_challenge(duel_id);
        let round = sys.store.get_round(duel_id);
        let deck: Deck = ch.get_deck();
        let bot_salt: felt252 = sys.bot_player.make_salt(duel_id);
        let bot_moves: Span<u8> = MovesHashTrait::restore(bot_salt, round.moves_b.hashed, deck);
        tester::execute_reveal_moves_ID(@sys, OWNER(), TOKEN_ID_1, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(@sys, bot_address, ch.duelist_id_b, duel_id, bot_salt, bot_moves);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_ne!(ch.state, ChallengeState::InProgress, "challenge.state_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_reply_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0);
        tester::impersonate(OTHER());
        _protected(@sys).reply_duel(duel_id);
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_commit_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 0);
        tester::impersonate(OTHER());
        _protected(@sys).commit_moves(duel_id);
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_summon_bot_duelist_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::impersonate(OTHER());
        _protected(@sys).summon_bot_duelist(DuelistProfile::Bot(BotKey::Pro), QueueId::Ranked);
    }

    #[test]
    #[should_panic(expected: ('DUEL: Invalid stake', 'ENTRYPOINT_FAILED'))]
    fn test_bot_invalid_stake_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
    }
    
    #[test]
    #[should_panic(expected: ('DUEL: Invalid stake', 'ENTRYPOINT_FAILED'))]
    fn test_bot_invalid_stake_3() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 3);
    }



    //------------------------------
    // duel results (Seasonal/Unranked)
    //

    pub fn _get_bot_moves_crit_a(archetype: Archetype) -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let (prefabs_mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
        let mut mocked: Array<MockedValue> = array![];
        mocked.extend_from_span(prefabs_mocked);
        // select archetype
        match archetype {
            Archetype::Trickster => mocked.append(MockedValueTrait::new('bot_archetype', MOCKED_TRICKSTER)),
            Archetype::Villainous => mocked.append(MockedValueTrait::new('bot_archetype', MOCKED_VILLAIN)),
            Archetype::Honourable => mocked.append(MockedValueTrait::new('bot_archetype', MOCKED_LORD)),
            Archetype::Undefined => mocked.append(MockedValueTrait::new('bot_archetype', MOCKED_PRO)),
        };
        // mock moves_b to bot
        let mut i: usize = 0;
        while (i < moves_b.moves.len()) {
            let salt: felt252 = 
                if (i == 0) {'bot_fire'}
                else if (i == 1) {'bot_dodge'}
                else if (i == 2) {'bot_tactics'}
                else if (i == 3) {'bot_blades'}
                else {0};
            let weights: Span<u8> = 
                if (i == 0) {BotPlayerMovesTrait::_get_weights_fire(@archetype)}
                else if (i == 1) {BotPlayerMovesTrait::_get_weights_dodge(@archetype)}
                else if (i == 2) {BotPlayerMovesTrait::_get_weights_tactics(@archetype)}
                else if (i == 3) {BotPlayerMovesTrait::_get_weights_blades(@archetype)}
                else {([].span())};
            // sum weights up to the move...
            let move: u8 = *moves_b.moves[i];
            let mut weight: u8 = 0;
            let mut m: u8 = 1;
            while (m <= move) {
                weight += *weights[(m-1).into()];
                m += 1;
            };
            // mock...
            mocked.append(MockedValueTrait::new(salt, weight.into()));
            i += 1;
        };
        (mocked.span(), moves_a, moves_b)
    }
    
    fn _create_duel_bot_crit_a(sys: @TestSystems, challenger: ContractAddress, duelist_id: u128, lives_staked: u8) -> (u128, PlayerMoves) {
        let (mocked, moves_a, _moves_b) = _get_bot_moves_crit_a(Archetype::Undefined);
        (*sys.rng).mock_values(mocked);
        // challenge
        let bot_address: ContractAddress = (*sys.bot_player).contract_address;
        let duel_id: u128 = tester::execute_create_duel_ID(sys, challenger, duelist_id, bot_address, MESSAGE(), DuelType::Seasonal, 0, lives_staked);
        (duel_id, moves_a)
    }

    fn _duel_bot_crit_a(sys: @TestSystems, challenger: ContractAddress, duelist_id: u128, lives_staked: u8, prefix: ByteArray) -> ChallengeValue {
        let (duel_id, moves_a) = _create_duel_bot_crit_a(sys, challenger, duelist_id, lives_staked);
        // commits
        tester::execute_commit_moves(sys, challenger, duel_id, moves_a.hashed);
        // reveals
        tester::execute_reveal_moves_ID(sys,challenger, duelist_id, duel_id, moves_a.salt, moves_a.moves);
        (*sys.bot_player).reveal_moves(duel_id);
        let (ch, _round) = tester::get_Challenge_Round_value(sys, duel_id);
        assert_eq!(ch.state, ChallengeState::Resolved, "[{}] challenge.state_REVEAL", prefix);
        assert_eq!(ch.winner, 1, "[{}] challenge.winner", prefix);
        (ch)
    }

    #[test]
    fn test_bot_to_death() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 6);
        tester::execute_claim_starter_pack(@sys, OWNER());
        // store initial pool balances
        let fame_supply_init: u256 = sys.fame.total_supply();
        let treasury_init: u128 = sys.lords.balance_of(TREASURY()).low;
        let pool_peg_init: Pool = sys.store.get_pool(PoolType::FamePeg);
        //
        // duel 1
        let bot_id_1: u128 = _duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1, "duel_1").duelist_id_b;
        assert_eq!(sys.duelists.life_count(bot_id_1), 2, "life_count after duel 1");
        assert!(sys.duelists.is_alive(bot_id_1), "alive after duel 1");
        _assert_bot_duelist(@sys, bot_id_1, "duel_1", Option::Some(BotKey::Pro), 1);
        // minted bot has FAME but do not increase pool_peg
        let fame_supply_minted: u256 = sys.fame.total_supply();
        let pool_peg_minted: Pool = sys.store.get_pool(PoolType::FamePeg);
        assert_eq!(pool_peg_minted.balance_lords, pool_peg_init.balance_lords, "pool_peg_minted");
        assert_gt!(fame_supply_minted, fame_supply_init, "fame_supply_minted");
        //
        // duel 2
        let bot_id_2: u128 = _duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1, "duel_2").duelist_id_b;
        assert_eq!(bot_id_2, bot_id_1, "same duelist");
        assert_eq!(sys.duelists.life_count(bot_id_2), 1, "life_count after duel 2");
        assert!(sys.duelists.is_alive(bot_id_2), "alive after duel 2");
        _assert_bot_duelist(@sys, bot_id_2, "duel_2", Option::Some(BotKey::Pro), 1);
        // bot is still owned by contract
        assert_eq!(sys.duelists.owner_of(bot_id_2.into()), bot_address, "owner_of(bot_id) > contract");
        //
        // duel 3
        let bot_id_3: u128 = _duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1, "duel_3").duelist_id_b;
        assert_eq!(bot_id_3, bot_id_1, "same duelist");
        assert_eq!(sys.duelists.life_count(bot_id_3), 0, "life_count after duel 3");
        assert!(!sys.duelists.is_alive(bot_id_3), "dead after duel 3");
        _assert_bot_duelist(@sys, bot_id_3, "duel_3", Option::Some(BotKey::Pro), 0);
        // bot was transferred to player
        assert_eq!(sys.duelists.owner_of(bot_id_3.into()), OWNER(), "owner_of(bot_id) > player");
        // pools and balances moves
        let fame_supply_dead: u256 = sys.fame.total_supply();
        let treasury_dead: u128 = sys.lords.balance_of(TREASURY()).low;
        let pool_peg_dead: Pool = sys.store.get_pool(PoolType::FamePeg);
        assert_lt!(fame_supply_dead, fame_supply_minted, "fame_supply_dead");
        assert_eq!(pool_peg_dead.balance_lords, pool_peg_init.balance_lords, "pool_peg_dead");
        assert_eq!(treasury_dead, treasury_init, "treasury_dead");
        //
        // new duelist...
        let bot_id_4: u128 = _duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1, "duel_4").duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "duel_4", Option::Some(BotKey::Pro), 1);
        assert_ne!(bot_id_4, bot_id_1, "new duelist minted");
        assert_eq!(sys.duelists.life_count(bot_id_4), 2, "NEW life_count after duel 1");
        assert_eq!(sys.duelists.is_alive(bot_id_4), true, "NEW alive after duel 4");
    }



    //------------------------------
    // ranked duels
    //

    #[test]
    fn test_bot_ranked_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        // A wins, Bot loses
        let (mocked, moves_a, _moves_b) = _get_bot_moves_crit_a(Archetype::Undefined);
        sys.rng.mock_values(mocked);
        //
        // create Seasonal duel
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, bot_address, MESSAGE(), DuelType::Seasonal, 0, 1);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_CREATE");
        assert_eq!(round.state, RoundState::Commit, "round.state_CREATE");
        assert_eq!(ch.duel_type, DuelType::Seasonal, "duel_type");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, bot_address, "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_ne!(ch.duelist_id_b, 0, "challenged_id"); // bot minted a duelist!
        // pact and assignment set
        assert!(sys.duels.has_pact(DuelType::Seasonal, OWNER(), bot_address), "has_pact_yes");
        let assignment: DuelistAssignment = sys.store.get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment.duel_id, duel_id, "duelist_assignment.duel_id");
        // validate minted bot duelist
        let bot_duelist_id: u128 = ch.duelist_id_b;
        assert_eq!(sys.duelists.total_supply(), 3, "total_supply 3");
        assert_eq!(sys.duelists.balance_of(bot_address), 1, "balance_of(bot_address) 1");
        _assert_bot_duelist(@sys, bot_duelist_id, "challenged", Option::Some(BotKey::Pro), 1);
        //
        // player commits, bot commits
        tester::execute_commit_moves(@sys, OWNER(), duel_id, moves_a.hashed);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_COMMIT");
        assert_eq!(round.state, RoundState::Reveal, "round.state_COMMIT");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "round.moves_a.hashed");
        assert_gt!(round.moves_b.hashed, 0, "round.moves_b.hashed");
        //
        // call bot reveal
        tester::execute_reveal_moves_ID(@sys, OWNER(), TOKEN_ID_1, duel_id, moves_a.salt, moves_a.moves);
        sys.bot_player.reveal_moves(duel_id);
        let (ch, round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::Resolved, "challenge.state_REVEAL");
        assert_eq!(ch.winner, 1, "challenge.winner_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
        assert_eq!(ch.season_id, SEASON_ID_1, "season_id");
        // pact and assignment unset
        assert!(!sys.duels.has_pact(DuelType::Seasonal, OWNER(), bot_address), "has_pact_no");
        let assignment: DuelistAssignment = sys.store.get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment.duel_id, 0, "duelist_assignment.0");
        // RANKED, player has score and fools
        tester::assert_unranked_duel_results(@sys, duel_id, "finished");
    }

    fn _duel_bot_ranked_crit_a(sys: @TestSystems, challenger: ContractAddress, duelist_id: u128, lives_staked: u8, prefix: ByteArray) -> ChallengeValue {
        let (mocked, moves_a, _moves_b) = _get_bot_moves_crit_a(Archetype::Undefined);
        (*sys.rng).mock_values(mocked);
        //
        // create Seasonal duel
        let bot_address: ContractAddress = (*sys.bot_player).contract_address;
        let duel_id: u128 = tester::execute_create_duel_ID(sys, challenger, duelist_id, bot_address, MESSAGE(), DuelType::Seasonal, 0, lives_staked);
        // player commits, bot commits
        tester::execute_commit_moves(sys, challenger, duel_id, moves_a.hashed);
        // call bot reveal
        tester::execute_reveal_moves_ID(sys, challenger, duelist_id, duel_id, moves_a.salt, moves_a.moves);
        (*sys.bot_player).reveal_moves(duel_id);
        let (ch, _round) = tester::get_Challenge_Round_value(sys, duel_id);
        assert_eq!(ch.state, ChallengeState::Resolved, "challenge.state_REVEAL");
        assert_eq!(ch.winner, 1, "challenge.winner_REVEAL");
        tester::assert_unranked_duel_results(sys, duel_id, "finished");
        (ch)
    }

    #[test]
    fn test_bot_ranked_stake_3() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 6);
        tester::execute_claim_starter_pack(@sys, OWNER());
        //
        // A wins, Bot loses
        let ch_1 = _duel_bot_ranked_crit_a(@sys, OWNER(), TOKEN_ID_1, 3, "duel_1");
        //
        // bot duelist transferred to player
        assert_eq!(sys.duelists.life_count(ch_1.duelist_id_b), 0, "life_count after duel 3");
        assert!(!sys.duelists.is_alive(ch_1.duelist_id_b), "dead after duel 3");
        _assert_bot_duelist(@sys, ch_1.duelist_id_b, "duel_1", Option::Some(BotKey::Pro), 0);
        // bot was transferred to player
        assert_eq!(sys.duelists.owner_of(ch_1.duelist_id_b.into()), OWNER(), "owner_of(bot_id) > player");
        //
        // new duel, new bot duelist...
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, bot_address, MESSAGE(), DuelType::Seasonal, 0, 1);
        let (ch_2, _round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_ne!(ch_1.duelist_id_b, ch_2.duelist_id_b, "new duelist");
        _assert_bot_duelist(@sys, ch_2.duelist_id_b, "duel_2", Option::Some(BotKey::Pro), 1);
    }

    #[test]
    #[ignore] // player needs more lives
    #[should_panic(expected: ('BOT_PLAYER: Invalid stake', 'ENTRYPOINT_FAILED'))]
    fn test_bot_ranked_stake_4() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_create_duel_ID(@sys, OWNER(), ID(OWNER()), bot_address, MESSAGE(), DuelType::Seasonal, 0, 4);
    }



    //------------------------------
    // bot duelist stack
    //

    #[test]
    fn test_bot_skip_busy_bot_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        // let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_claim_starter_pack(@sys, OTHER());
        //
        // create Duel against bot_1
        let (duel_id_1, moves_a_1) = _create_duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1);
        let bot_id_1: u128 = sys.store.get_challenge(duel_id_1).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_1, "duel_1", Option::Some(BotKey::Pro), 1);
        //
        // create Duel against bot_2
        let (duel_id_2, _moves_a_2) = _create_duel_bot_crit_a(@sys, OTHER(), ID(OTHER()), 1);
        let bot_id_2: u128 = sys.store.get_challenge(duel_id_2).duelist_id_b;
        assert_ne!(bot_id_2, bot_id_1, "different duelist as 1");
        _assert_bot_duelist(@sys, bot_id_2, "duel_2", Option::Some(BotKey::Pro), 2);
        //
        // finish duel 1
        tester::execute_commit_moves(@sys, OWNER(), duel_id_1, moves_a_1.hashed);
        tester::execute_reveal_moves_ID(@sys, OWNER(), TOKEN_ID_1, duel_id_1, moves_a_1.salt, moves_a_1.moves);
        sys.bot_player.reveal_moves(duel_id_1);
        //
        // new duel, against bot_1 (bot_2 is busy)
        let (duel_id_3, _moves_a_3) = _create_duel_bot_crit_a(@sys, OWNER(), TOKEN_ID_1, 1);
        let bot_id_3: u128 = sys.store.get_challenge(duel_id_3).duelist_id_b;
        assert_eq!(bot_id_3, bot_id_1, "same duelist as 1");
        _assert_bot_duelist(@sys, bot_id_3, "duel_3", Option::Some(BotKey::Pro), 2);
    }

    #[test]
    fn test_bot_skip_unhealthy_bot_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 4);
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_claim_starter_pack(@sys, OTHER());
        //
        // A wins, Bot loses > 1 lives
        let ch_1 = _duel_bot_ranked_crit_a(@sys, OWNER(), ID(OWNER()), 2, "duel_1");
        let bot_id_1: u128 = ch_1.duelist_id_b;
        // bot duelist is not dead, but has few lives
        assert_eq!(sys.duelists.life_count(bot_id_1), 1, "life_count after duel 3");
        _assert_bot_duelist(@sys, bot_id_1, "duel_1", Option::Some(BotKey::Pro), 1);
        //
        // new duel, stake 3, need to mint new bot duelist...
        let duel_id_2: u128 = tester::execute_create_duel_ID(@sys, OWNER(), ID(OWNER()), bot_address, MESSAGE(), DuelType::Seasonal, 0, 3);
        let (ch_2, _round) = tester::get_Challenge_Round_value(@sys, duel_id_2);
        let bot_id_2: u128 = ch_2.duelist_id_b;
        assert_ne!(bot_id_2, bot_id_1, "new duelist 2_1");
        _assert_bot_duelist(@sys, bot_id_2, "duel_2", Option::Some(BotKey::Pro), 2);
        //
        // new duel, stake 2, need to mint new bot duelist...
        let duel_id_3: u128 = tester::execute_create_duel_ID(@sys, OTHER(), ID(OTHER()), bot_address, MESSAGE(), DuelType::Seasonal, 0, 2);
        let (ch_3, _round) = tester::get_Challenge_Round_value(@sys, duel_id_3);
        let bot_id_3: u128 = ch_3.duelist_id_b;
        assert_ne!(bot_id_3, bot_id_1, "new duelist 3_1");
        assert_ne!(bot_id_3, bot_id_2, "new duelist 3_2");
        _assert_bot_duelist(@sys, bot_id_3, "duel_3", Option::Some(BotKey::Pro), 3);
        //
        // finish Duel 2
        let (mocked, moves_a, _moves_b) = _get_bot_moves_crit_a(Archetype::Undefined);
        sys.rng.mock_values(mocked);
        tester::execute_commit_moves(@sys, OWNER(), duel_id_2, moves_a.hashed);
        tester::execute_reveal_moves_ID(@sys, OWNER(), TOKEN_ID_1, duel_id_2, moves_a.salt, moves_a.moves);
        sys.bot_player.reveal_moves(duel_id_2);
        let (ch_2, _round) = tester::get_Challenge_Round_value(@sys, duel_id_2);
        assert_eq!(ch_2.state, ChallengeState::Resolved, "ch_2.state_REVEAL");
        assert_eq!(ch_2.winner, 1, "ch_2.winner_REVEAL");
        // stack decreased...
        _assert_bot_duelist(@sys, bot_id_3, "duel_3", Option::Some(BotKey::Pro), 2);
        // stack shifted...
        let stack: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(bot_address, bot_id_1);
// println!("{}: id[{}], {:?} stacked:{}", prefix, bot_id, duelist.duelist_profile, stack.stacked_ids.len());
        assert_eq!(*stack.stacked_ids[0], bot_id_1, "stack.stacked_ids[0]");
        assert_eq!(*stack.stacked_ids[1], bot_id_3, "stack.stacked_ids[1]");
    }

}
