#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use pistols::models::{
        challenge::{DuelType},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
    };
    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            ID, OWNER,
            MESSAGE,
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

    #[test]
    fn test_challenge_create_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUELIST | FLAGS::BOT_PLAYER);
        let bot_address: ContractAddress = sys.bot_player.contract_address;
        tester::fund_duelists_pool(@sys, 1);
        tester::execute_claim_starter_pack(@sys, OWNER());
        let duel_id: u128 = tester::execute_create_duel_ID(@sys.duels, OWNER(), TOKEN_ID_1, bot_address, MESSAGE(), DuelType::Practice, 0, 1);
        let ch = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::InProgress, "state");
        assert_eq!(ch.address_a, OWNER(), "challenged");
        assert_eq!(ch.address_b, bot_address, "challenger");
        assert_eq!(ch.duelist_id_a, ID(OWNER()), "challenger_id");
        assert_ne!(ch.duelist_id_b, 0, "challenged_id"); // bot minted a duelist!

        // TODO: validate BOT DUELIST
    }


    // TODO: bot dies, mint new one

}
