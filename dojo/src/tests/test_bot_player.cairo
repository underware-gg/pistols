#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use pistols::models::{
        challenge::{DuelType},
        duelist::{Duelist},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        duelist_profile::{DuelistProfileTrait, CollectionDescriptor},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            IDuelistTokenDispatcherTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT, SPENDER,
            ID, MESSAGE,
        }
    };

    const TOKEN_ID_1: u128 = 1;

    #[test]
    #[should_panic(expected:('DUEL: Invalid duel type', 'ENTRYPOINT_FAILED'))]
    fn test_duel_type_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        let _duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), bot_address, MESSAGE(), DuelType::Seasonal, 0, 1);
    }

    #[test]
    #[should_panic(expected: ('BANK: insufficient LORDS pool', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_mint_bot_insufficient_lords() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, bot_address, MESSAGE(), DuelType::Practice, 0, 1);
    }

    fn _assert_bot_duelist(sys: @TestSystems, bot_id: u128, prefix: ByteArray) {
        assert_eq!((*sys).duelists.owner_of(bot_id.into()), *sys.bot_player.contract_address, "{}: owner_of(bot_address)", prefix);
        let duelist: Duelist = sys.store.get_duelist(bot_id);
        let collection: CollectionDescriptor = duelist.duelist_profile.collection();
        assert_eq!(collection.folder_name, 'bots', "{}: duelist_profile.folder_name", prefix);
// println!("{}: id[{}], {:?}", prefix, bot_id, duelist.duelist_profile);
    }

    #[test]
    fn test_challenge_create_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        assert_eq!(sys.duelists.total_supply(), 2, "total_supply 2");
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, bot_address, MESSAGE(), DuelType::Practice, 0, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "state");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, bot_address, "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_ne!(ch.duelist_id_b, 0, "challenged_id"); // bot minted a duelist!
        // validate minted bot duelist
        assert_eq!(sys.duelists.total_supply(), 3, "total_supply 3");
        assert_eq!(sys.duelists.balance_of(bot_address), 1, "balance_of(bot_address) 1");
        _assert_bot_duelist(@sys, ch.duelist_id_b, "challenged");
    }

    #[test]
    fn test_mint_bot_duelists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 8);
        // 1
        let duelist_id_1: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let bot_id_1: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, OWNER(), duelist_id_1, bot_address, MESSAGE(), DuelType::Practice, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_1, "bot_1");
        // 2
        let duelist_id_2: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let bot_id_2: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, OTHER(), duelist_id_2, bot_address, MESSAGE(), DuelType::Practice, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_2, "bot_2");
        // 3
        let duelist_id_3: u128 = *tester::execute_claim_starter_pack(@sys, BUMMER())[0];
        let bot_id_3: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, BUMMER(), duelist_id_3, bot_address, MESSAGE(), DuelType::Practice, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_3, "bot_3");
        // 4
        let duelist_id_4: u128 = *tester::execute_claim_starter_pack(@sys, RECIPIENT())[0];
        let bot_id_4: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, RECIPIENT(), duelist_id_4, bot_address, MESSAGE(), DuelType::Practice, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_4, "bot_4");
        // 5
        let duelist_id_5: u128 = *tester::execute_claim_starter_pack(@sys, SPENDER())[0];
        let bot_id_5: u128 = sys.store.get_challenge_value(tester::execute_create_duel_ID(@sys.duels, SPENDER(), duelist_id_5, bot_address, MESSAGE(), DuelType::Practice, 0, 1)).duelist_id_b;
        _assert_bot_duelist(@sys, bot_id_5, "bot_5");
        // minted duelists:
        // bot_1: [3], Bot::Scarecrow(2)
        // bot_2: [6], Bot::Tin Man(1)
        // bot_3: [9], Bot::Tin Man(1)
        // bot_4: [12], Bot::Scarecrow(2)
        // bot_5: [15], Bot::Leon(3)
    }


    // TODO: bot dies, mint new one

}
