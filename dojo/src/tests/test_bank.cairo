#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};

    use pistols::models::{
        pool::{Pool, PoolType},
        table::{FeeValues},
    };
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            IDuelistTokenDispatcherTrait,
            // IFameCoinDispatcherTrait,
            IFoolsCoinDispatcherTrait,
            ILordsMockDispatcherTrait,
            IBankDispatcherTrait,
            OWNER, OTHER, TREASURY, BUMMER,
            SEASON_1_TABLE,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SaltsValues,
            PlayerMoves,
        },
    };
    use pistols::systems::rng_mock::{IRngMockDispatcherTrait};
    use pistols::utils::math::{MathU128};
    // use pistols::types::constants::{CONST};

    fn _fund_bank_pool(sys: @TestSystems) {
        // fund someone
        tester::execute_lords_faucet(sys.lords, BUMMER());
        let balance: u256 = (*sys.lords).balance_of(BUMMER());
        tester::execute_lords_approve(sys.lords, BUMMER(), *sys.bank.contract_address, balance.low);
        // move to pool
        tester::impersonate(*sys.duelists.contract_address);
        (*sys.bank).charge_purchase(BUMMER(), balance);
        // let balance: u256 = (*sys.lords).balance_of(*sys.bank.contract_address);
        // println!("charged! {}", balance);
        tester::impersonate(OWNER());
    }

    //-----------------------------------------
    // Challenge results
    //
    fn _test_bank_challenge(sys: TestSystems, duelist_id_a: u128, duelist_id_b: u128, winner: u8) {
        let (salts, moves_a, moves_b): (SaltsValues, PlayerMoves, PlayerMoves) = 
            if (winner == 1) {prefabs::get_moves_crit_a()}
            else if (winner == 2) {prefabs::get_moves_crit_b()}
            else  {prefabs::get_moves_dual_miss()};
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let table_id: felt252 = SEASON_1_TABLE();
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);

        let mut fame_balance_bank: u128 = sys.lords.balance_of(sys.fame.contract_address).low;
        let mut lords_balance_bank: u128 = sys.lords.balance_of(sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = sys.lords.balance_of(TREASURY()).low;
        assert_eq!(fame_balance_bank, 0, "fame_balance_bank");
        assert_ne!(lords_balance_bank, 0, "lords_balance_bank");
        assert_eq!(lords_balance_treasury, 0, "lords_balance_treasury");
// println!("lords_balance_bank: {}", lords_balance_bank/CONST::ETH_TO_WEI.low);
// println!("fame_supply: {}", sys.fame.total_supply()/CONST::ETH_TO_WEI);

        let pool_bank: Pool = tester::get_Pool(sys.world, PoolType::Bank);
        assert_eq!(pool_bank.balance_lords, lords_balance_bank, "pool_bank.balance_lords");
        assert_eq!(pool_bank.balance_fame, 0, "pool_bank.balance_fame");
        let pool_season: Pool = tester::get_Pool(sys.world, PoolType::Season(table_id));
        assert_eq!(pool_season.balance_lords, 0, "pool_season.balance_lords");
        assert_eq!(pool_season.balance_fame, 0, "pool_season.balance_fame");

        let reward_a: FeeValues = sys.duelists.calc_season_reward(duelist_id_a);
        let reward_b: FeeValues = sys.duelists.calc_season_reward(duelist_id_b);
        assert_ne!(reward_a.fame_lost, 0, "reward_a.fame_lost != 0");
        assert_ne!(reward_b.fame_lost, 0, "reward_b.fame_lost != 0");
        assert_ne!(reward_a.fame_gained, 0, "reward_a.fame_gained != 0");
        assert_ne!(reward_b.fame_gained, 0, "reward_b.fame_gained != 0");
        assert_ne!(reward_a.fools_gained, 0, "reward_a.fools_gained != 0");
        assert_ne!(reward_b.fools_gained, 0, "reward_b.fools_gained != 0");

        let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        let mut fools_balance_a: u128 = sys.fools.balance_of(OWNER()).low;
        let mut fools_balance_b: u128 = sys.fools.balance_of(OTHER()).low;
        assert_gt!(fame_balance_a, 0, "fame_balance_a");
        assert_gt!(fame_balance_b, 0, "fame_balance_b");
        assert_eq!(fools_balance_a, 0, "fools_balance_a");
        assert_eq!(fools_balance_b, 0, "fools_balance_b");

        // commit+reveal
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let (challenge, _round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert_eq!(challenge.winner, winner, "challenge.winner");

        // Duelist A
        if (winner == 1) {
            let fame_gained = reward_a.fame_gained;
            let fools_gained = reward_a.fools_gained;
            fame_balance_a = tester::assert_fame_token_balance(@sys, duelist_id_a, fame_balance_a, 0, fame_gained, format!("fame_balance_a_win [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(@sys, OWNER(), fools_balance_a, 0, fools_gained, format!("fools_balance_a_win [{}:{}]", duel_id, duelist_id_a));
        } else {
            let fame_lost = reward_a.fame_lost;
            fame_balance_a = tester::assert_fame_token_balance(@sys, duelist_id_a, fame_balance_a, fame_lost, 0, format!("fame_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(@sys, OWNER(), fools_balance_a, 0, 0, format!("fools_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        }

        // Duelist B
        if (winner == 2) {
            let fame_gained = reward_b.fame_gained;
            let fools_gained = reward_b.fools_gained;
            fame_balance_b = tester::assert_fame_token_balance(@sys, duelist_id_b, fame_balance_b, 0, fame_gained, format!("fame_balance_b_win [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(@sys, OTHER(), fools_balance_b, 0, fools_gained, format!("fools_balance_b_win [{}:{}]", duel_id, duelist_id_b));
        } else {
            let fame_lost = reward_b.fame_lost;
            fame_balance_b = tester::assert_fame_token_balance(@sys, duelist_id_b, fame_balance_b, fame_lost, 0, format!("fame_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(@sys, OTHER(), fools_balance_b, 0, 0, format!("fools_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
        }

        // let lords_gained: u128 = MathU128::percentage(lords_balance_bank, 60);
        // lords_balance_treasury = tester::assert_lords_balance(sys.lords, TREASURY(), lords_balance_treasury, 0, lords_gained, format!("lords_balance_treasury [{}]", duel_id));
        lords_balance_treasury = tester::assert_lords_balance_increased(sys.lords, TREASURY(), lords_balance_treasury, format!("lords_balance_treasury [{}]", duel_id));
        fame_balance_bank = tester::assert_fame_balance_increased(sys.fame, sys.bank.contract_address, fame_balance_bank, format!("fame_balance_bank [{}]", duel_id));

        // bank lords decreased
        let pool_bank: Pool = tester::get_Pool(sys.world, PoolType::Bank);
        assert_eq!(pool_bank.balance_lords, lords_balance_bank - lords_balance_treasury, "pool_bank.balance_lords END");
        assert_eq!(pool_bank.balance_fame, 0, "pool_bank.balance_fame END");

        // fame went to season pool
        let pool_season: Pool = tester::get_Pool(sys.world, PoolType::Season(table_id));
        assert_eq!(pool_season.balance_lords, 0, "pool_season.balance_lords END");
        assert_eq!(pool_season.balance_fame, fame_balance_bank, "pool_season.balance_fame END");
    }

    #[test]
    fn test_bank_resolved_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];
        _fund_bank_pool(@sys);
        _test_bank_challenge(sys, duelist_id_a, duelist_id_b, 0);
    }

    #[test]
    fn test_bank_resolved_win_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];
        _fund_bank_pool(@sys);
        _test_bank_challenge(sys, duelist_id_a, duelist_id_b, 1);
    }

    #[test]
    fn test_bank_resolved_win_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];
        _fund_bank_pool(@sys);
        _test_bank_challenge(sys, duelist_id_a, duelist_id_b, 2);
    }


}
