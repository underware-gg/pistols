#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    // use core::num::traits::Zero;
    use pistols::models::{
        challenge::{ChallengeValue, DuelType, DuelTypeTrait, ChallengeTrait},
        duelist::{Duelist, Archetype, DuelistAssignment},
        player::{PlayerDuelistStack},
        season::{SeasonScoreboard},
    };
    use pistols::types::{
        cards::deck::{Deck},
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, DuelistProfileTrait, CollectionDescriptor, BotKey},
        rules::{Rules},
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
            IFoolsCoinDispatcherTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT, SPENDER,
            ZERO, ID, MESSAGE, SEASON_ID_1,
        }
    };
    use pistols::tests::prefabs::{prefabs, prefabs::{PlayerMoves}};

    const TOKEN_ID_1: u128 = 1;

    const MOCKED_VILLAIN: felt252 = 3;
    const MOCKED_TRICKSTER: felt252 = 1;
    const MOCKED_LORD: felt252 = 2;

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
            assert_eq!((*sys).duelists.owner_of(bot_id.into()), bot_address, "{}: owner_of(bot_address)", prefix);
        }
        let duelist: Duelist = sys.store.get_duelist(bot_id);
        let collection: CollectionDescriptor = duelist.duelist_profile.collection();
        assert_eq!(collection.folder_name, 'bots', "{}: duelist_profile.folder_name", prefix);
        match expected_profile {
            Option::Some(key) => {
                assert_eq!(duelist.duelist_profile, DuelistProfile::Bot(key), "{}: duelist_profile", prefix);
            },
            Option::None => {}
        }
        // check stack
        let stack: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(bot_address, bot_id);
// println!("{}: id[{}], {:?} stacked:{}", prefix, bot_id, duelist.duelist_profile, stack.stacked_ids.len());
        assert_eq!(stack.stacked_ids.len(), stack_len, "stack.len()");
    }

    #[test]
    #[should_panic(expected: ('BANK: insufficient LORDS pool', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_mint_bot_insufficient_lords() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
    }
    
    #[test]
    fn test_mint_bot_duelists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 8);
        // 1
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_VILLAIN)].span());
        let duelist_id_1: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let bot_id_1: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, OWNER(), duelist_id_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_1, "bot_1", Option::Some(BotKey::TinMan), 1);
        // 2
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_TRICKSTER)].span());
        let duelist_id_2: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let bot_id_2: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, OTHER(), duelist_id_2, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_2, "bot_2", Option::Some(BotKey::Scarecrow), 1);
        // 3
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_LORD)].span());
        let duelist_id_3: u128 = *tester::execute_claim_starter_pack(@sys, BUMMER())[0];
        let bot_id_3: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, BUMMER(), duelist_id_3, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_3, "bot_3", Option::Some(BotKey::Leon), 1);
        // 4
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_VILLAIN)].span());
        let duelist_id_4: u128 = *tester::execute_claim_starter_pack(@sys, RECIPIENT())[0];
        let bot_id_4: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, RECIPIENT(), duelist_id_4, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "bot_4", Option::Some(BotKey::TinMan), 2);
        // 5
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_TRICKSTER)].span());
        let duelist_id_5: u128 = *tester::execute_claim_starter_pack(@sys, SPENDER())[0];
        let bot_id_5: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys, SPENDER(), duelist_id_5, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_5, "bot_5", Option::Some(BotKey::Scarecrow), 2);
        // minted duelists:
        // bot_1: [3], Bot::Scarecrow(2)
        // bot_2: [6], Bot::Tin Man(1)
        // bot_3: [9], Bot::Tin Man(1)
        // bot_4: [12], Bot::Scarecrow(2)
        // bot_5: [15], Bot::Leon(3)
    }


    //------------------------------
    // duel flow
    //

    #[test]
    fn test_bot_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 1);
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
        // Unranked, player has no points, no fools, no score
        let rules: Rules = ch.duel_type.get_rules(@sys.store);
        assert_eq!(rules, Rules::Unranked, "rules");
        assert_eq!(sys.fools.balance_of(OWNER()), 0, "fools balance");
        assert_eq!(sys.fools.balance_of(bot_address), 0, "fools balance");
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, TOKEN_ID_1.into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, bot_duelist_id.into());
        assert_eq!(score_a.points, 0, "score_a.points");
        assert_eq!(score_b.points, 0, "score_a.points");
    }

    #[test]
    fn test_bot_restore_reveal_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 1);
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
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
        tester::impersonate(OTHER());
        _protected(@sys).reply_duel(duel_id);
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_commit_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
        tester::impersonate(OTHER());
        _protected(@sys).commit_moves(duel_id);
    }



    //------------------------------
    // duel results
    //

    fn _get_bot_moves_crit_a(archetype: Archetype) -> (Span<MockedValue>, PlayerMoves, PlayerMoves) {
        let (prefabs_mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
        let mut mocked: Array<MockedValue> = array![];
        mocked.extend_from_span(prefabs_mocked);
        // select archetype
        match archetype {
            Archetype::Trickster => mocked.append(MockedValueTrait::new('archetype', MOCKED_TRICKSTER)),
            Archetype::Villainous => mocked.append(MockedValueTrait::new('archetype', MOCKED_VILLAIN)),
            Archetype::Honourable => mocked.append(MockedValueTrait::new('archetype', MOCKED_LORD)),
            _ => {}
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
    
    fn _duel_bot_loses(sys: @TestSystems, challenger: ContractAddress, duelist_id: u128, prefix: ByteArray) -> ChallengeValue {
        let (mocked, moves_a, _moves_b) = _get_bot_moves_crit_a(Archetype::Trickster);
        (*sys.rng).mock_values(mocked);
        // challenge
        let duel_id: u128 = tester::execute_create_duel_ID(sys, challenger, duelist_id, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
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
        tester::fund_duelists_pool(@sys, 8);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let bot_id_1: u128 = _duel_bot_loses(@sys, OWNER(), TOKEN_ID_1, "duel_1").duelist_id_b;
        assert_eq!(sys.duelists.life_count(bot_id_1), 2, "life_count after duel 1");
        assert!(sys.duelists.is_alive(bot_id_1), "alive after duel 1");
        _assert_bot_duelist(@sys, bot_id_1, "duel_1", Option::Some(BotKey::Scarecrow), 1);
        let bot_id_2: u128 = _duel_bot_loses(@sys, OWNER(), TOKEN_ID_1, "duel_2").duelist_id_b;
        assert_eq!(bot_id_2, bot_id_1, "same duelist");
        assert_eq!(sys.duelists.life_count(bot_id_2), 1, "life_count after duel 2");
        assert!(sys.duelists.is_alive(bot_id_2), "alive after duel 2");
        _assert_bot_duelist(@sys, bot_id_2, "duel_2", Option::Some(BotKey::Scarecrow), 1);
        // bot is still owned by contract
        assert_eq!(sys.duelists.owner_of(bot_id_2.into()), bot_address, "owner_of(bot_id) > contract");
        let bot_id_3: u128 = _duel_bot_loses(@sys, OWNER(), TOKEN_ID_1, "duel_3").duelist_id_b;
        assert_eq!(bot_id_3, bot_id_1, "same duelist");
        assert_eq!(sys.duelists.life_count(bot_id_3), 0, "life_count after duel 3");
        assert!(!sys.duelists.is_alive(bot_id_3), "dead after duel 3");
        _assert_bot_duelist(@sys, bot_id_3, "duel_3", Option::Some(BotKey::Scarecrow), 0);
        // bot was transferred to player
        assert_eq!(sys.duelists.owner_of(bot_id_3.into()), OWNER(), "owner_of(bot_id) > player");
        // new duelist...
        let bot_id_4: u128 = _duel_bot_loses(@sys, OWNER(), TOKEN_ID_1, "duel_4").duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "duel_4", Option::Some(BotKey::Scarecrow), 1);
        assert_ne!(bot_id_4, bot_id_1, "new duelist minted");
        assert_eq!(sys.duelists.life_count(bot_id_4), 2, "NEW life_count after duel 1");
        assert_eq!(sys.duelists.is_alive(bot_id_4), true, "NEW alive after duel 4");
    }

}
