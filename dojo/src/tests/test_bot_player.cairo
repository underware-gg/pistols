#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use pistols::models::{
        challenge::{DuelType, ChallengeTrait},
        duelist::{Duelist},
    };
    use pistols::types::{
        cards::deck::{Deck},
        challenge_state::{ChallengeState},
        round_state::{RoundState},
        duelist_profile::{DuelistProfile, DuelistProfileTrait, CollectionDescriptor, BotKey},
    };
    use pistols::libs::moves_hash::{MovesHashTrait};
    use pistols::systems::rng_mock::{
        IRngMockDispatcherTrait,
        MockedValue, MockedValueTrait,
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            IDuelistTokenDispatcherTrait,
            IBotPlayerDispatcherTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT, SPENDER,
            ZERO, ID, MESSAGE,
        }
    };
    use pistols::tests::prefabs::{prefabs};

    const TOKEN_ID_1: u128 = 1;

    const MOCKED_VILLAIN: felt252 = 3;
    const MOCKED_TRICKSTER: felt252 = 1;
    const MOCKED_LORD: felt252 = 2;

    //
    // bot profiles
    //

    fn _assert_bot_duelist(sys: @TestSystems, bot_id: u128, prefix: ByteArray, expected_profile: Option<BotKey>) {
        assert_eq!((*sys).duelists.owner_of(bot_id.into()), *sys.bot_player.contract_address, "{}: owner_of(bot_address)", prefix);
        let duelist: Duelist = sys.store.get_duelist(bot_id);
        let collection: CollectionDescriptor = duelist.duelist_profile.collection();
        assert_eq!(collection.folder_name, 'bots', "{}: duelist_profile.folder_name", prefix);
// println!("{}: id[{}], {:?}", prefix, bot_id, duelist.duelist_profile);
        match expected_profile {
            Option::Some(key) => {
                assert_eq!(duelist.duelist_profile, DuelistProfile::Bot(key), "{}: duelist_profile", prefix);
            },
            Option::None => {}
        }
    }

    #[test]
    #[should_panic(expected: ('BANK: insufficient LORDS pool', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_mint_bot_insufficient_lords() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
    }
    
    #[test]
    fn test_mint_bot_duelists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 8);
        // 1
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_VILLAIN)].span());
        let duelist_id_1: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let bot_id_1: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, OWNER(), duelist_id_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_1, "bot_1", Option::Some(BotKey::TinMan));
        // 2
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_TRICKSTER)].span());
        let duelist_id_2: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let bot_id_2: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, OTHER(), duelist_id_2, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_2, "bot_2", Option::Some(BotKey::Scarecrow));
        // 3
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_LORD)].span());
        let duelist_id_3: u128 = *tester::execute_claim_starter_pack(@sys, BUMMER())[0];
        let bot_id_3: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, BUMMER(), duelist_id_3, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_3, "bot_3", Option::Some(BotKey::Leon));
        // 4
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_VILLAIN)].span());
        let duelist_id_4: u128 = *tester::execute_claim_starter_pack(@sys, RECIPIENT())[0];
        let bot_id_4: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, RECIPIENT(), duelist_id_4, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "bot_4", Option::Some(BotKey::TinMan));
        // 5
        sys.rng.mock_values([MockedValueTrait::new('archetype', MOCKED_TRICKSTER)].span());
        let duelist_id_5: u128 = *tester::execute_claim_starter_pack(@sys, SPENDER())[0];
        let bot_id_5: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, SPENDER(), duelist_id_5, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_5, "bot_5", Option::Some(BotKey::Scarecrow));
        // minted duelists:
        // bot_1: [3], Bot::Scarecrow(2)
        // bot_2: [6], Bot::Tin Man(1)
        // bot_3: [9], Bot::Tin Man(1)
        // bot_4: [12], Bot::Scarecrow(2)
        // bot_5: [15], Bot::Leon(3)
    }


    //
    // duelling
    //

    #[test]
    fn test_bot_duel_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 1);
        let (ch, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_CREATE");
        assert_eq!(round.state, RoundState::Commit, "round.state_CREATE");
        assert_eq!(ch.duel_type, DuelType::BotPlayer, "duel_type");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, bot_address, "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_ne!(ch.duelist_id_b, 0, "challenged_id"); // bot minted a duelist!
        // validate minted bot duelist
        let bot_duelist_id: u128 = ch.duelist_id_b;
        assert_eq!(sys.duelists.total_supply(), 3, "total_supply 3");
        assert_eq!(sys.duelists.balance_of(bot_address), 1, "balance_of(bot_address) 1");
        _assert_bot_duelist(@sys, bot_duelist_id, "challenged", Option::None);
        //
        // player commits, bot commits
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        let (ch, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "challenge.state_COMMIT");
        assert_eq!(round.state, RoundState::Reveal, "round.state_COMMIT");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "round.moves_a.hashed");
        assert_gt!(round.moves_b.hashed, 0, "round.moves_b.hashed");
        //
        // call bot reveal
        tester::execute_reveal_moves_ID(@sys.game, OWNER(), TOKEN_ID_1, duel_id, moves_a.salt, moves_a.moves);
        sys.bot_player.reveal_moves( duel_id);
        let (ch, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_ne!(ch.state, ChallengeState::InProgress, "challenge.state_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
    }

    #[test]
    fn test_bot_restore_reveal_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let any_address: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, any_address, MESSAGE(), DuelType::BotPlayer, 0, 1);
        // player commits, bot commits
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_miss();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        //
        // restore and reveal...
        let ch = sys.store.get_challenge(duel_id);
        let round = sys.store.get_round(duel_id);
        let deck: Deck = ch.get_deck();
        let bot_salt: felt252 = sys.bot_player.make_salt(duel_id);
        let bot_moves: Span<u8> = MovesHashTrait::restore(bot_salt, round.moves_b.hashed, deck);
        tester::execute_reveal_moves_ID(@sys.game, OWNER(), TOKEN_ID_1, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves_ID(@sys.game, bot_address, ch.duelist_id_b, duel_id, bot_salt, bot_moves);
        let (ch, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_ne!(ch.state, ChallengeState::InProgress, "challenge.state_REVEAL");
        assert_eq!(round.state, RoundState::Finished, "round.state_REVEAL");
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_reply_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
        tester::impersonate(OTHER());
        sys.bot_player.reply_duel(duel_id);
    }

    #[test]
    #[should_panic(expected: ('BOT_PLAYER: Invalid caller', 'ENTRYPOINT_FAILED'))]
    fn test_bot_commit_invalid_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, ZERO(), MESSAGE(), DuelType::BotPlayer, 0, 1);
        tester::impersonate(OTHER());
        sys.bot_player.commit_moves(duel_id);
    }


    // TODO: bot dies, mint new one


}
