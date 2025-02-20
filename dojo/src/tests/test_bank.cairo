#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::{
        pool::{Pool, PoolType},
        pack::{Pack, PackType, PackTypeTrait},
    };
    use pistols::types::rules::{RewardValues};
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            IDuelistTokenDispatcherTrait,
            // IFameCoinDispatcherTrait,
            IFoolsCoinDispatcherTrait,
            ILordsMockDispatcherTrait,
            IPackTokenDispatcherTrait,
            // IBankDispatcherTrait,
            ID, OWNER, OTHER, BUMMER, TREASURY,
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
    use pistols::types::constants::{CONST};

    const _wei: u128 = CONST::ETH_TO_WEI.low;

    //-----------------------------------------
    // Challenge results
    //
    fn _test_bank_resolved(sys: @TestSystems, address_a: ContractAddress, address_b: ContractAddress, winner: u8) {
        let (salts, moves_a, moves_b): (SaltsValues, PlayerMoves, PlayerMoves) = 
            if (winner == 1) {prefabs::get_moves_crit_a()}
            else if (winner == 2) {prefabs::get_moves_crit_b()}
            else  {prefabs::get_moves_dual_miss()};
        (*sys.rng).set_mocked_values(salts.salts, salts.values);

        let duelist_id_a: u128 = ID(address_a);
        let duelist_id_b: u128 = ID(address_b);

        let table_id: felt252 = SEASON_1_TABLE();
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, address_a, address_b, table_id, 1);

        let mut fame_balance_bank: u128 = (*sys.lords).balance_of((*sys.fame).contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of((*sys.bank).contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
        assert_eq!(fame_balance_bank, 0, "RESOLVED_fame_balance_bank");
        assert_ne!(lords_balance_bank, 0, "RESOLVED_lords_balance_bank");
        assert_eq!(lords_balance_treasury, 0, "RESOLVED_lords_balance_treasury");
// println!("lords_balance_bank: {}", lords_balance_bank/CONST::ETH_TO_WEI.low);
// println!("fame_supply: {}", sys.fame.total_supply()/CONST::ETH_TO_WEI);

        // PoolType::FamePeg == bank balance
        let pool_peg: Pool = tester::get_Pool(*sys.world, PoolType::FamePeg);
        assert_eq!(pool_peg.balance_lords, lords_balance_bank, "RESOLVED_pool_peg.balance_lords");
        assert_eq!(pool_peg.balance_fame, 0, "RESOLVED_pool_peg.balance_fame");
        // PoolType::Season() == zero
        let pool_season: Pool = tester::get_Pool(*sys.world, PoolType::Season(table_id));
        assert_eq!(pool_season.balance_lords, 0, "RESOLVED_pool_season.balance_lords");
        assert_eq!(pool_season.balance_fame, 0, "RESOLVED_pool_season.balance_fame");
        // PoolType::SacredFlame == zero
        let pool_flame: Pool = tester::get_Pool(*sys.world, PoolType::SacredFlame);
        assert_eq!(pool_flame.balance_lords, 0, "RESOLVED_pool_flame.balance_lords");
        assert_eq!(pool_flame.balance_fame, 0, "RESOLVED_pool_flame.balance_fame");

        let rewards_a: RewardValues = (*sys.duelists).calc_season_reward(duelist_id_a, challenge.lives_staked, table_id);
        let rewards_b: RewardValues = (*sys.duelists).calc_season_reward(duelist_id_b, challenge.lives_staked, table_id);
        assert_ne!(rewards_a.fame_lost, 0, "RESOLVED_rewards_a.fame_lost != 0");
        assert_ne!(rewards_b.fame_lost, 0, "RESOLVED_rewards_b.fame_lost != 0");
        assert_ne!(rewards_a.fame_gained, 0, "RESOLVED_rewards_a.fame_gained != 0");
        assert_ne!(rewards_b.fame_gained, 0, "RESOLVED_rewards_b.fame_gained != 0");
        assert_ne!(rewards_a.fools_gained, 0, "RESOLVED_rewards_a.fools_gained != 0");
        assert_ne!(rewards_b.fools_gained, 0, "RESOLVED_rewards_b.fools_gained != 0");

        let mut fame_balance_a: u128 = tester::fame_balance_of_token(sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(sys, duelist_id_b);
        let mut fools_balance_a: u128 = (*sys.fools).balance_of(address_a).low;
        let mut fools_balance_b: u128 = (*sys.fools).balance_of(address_b).low;
        assert_gt!(fame_balance_a, 0, "RESOLVED_fame_balance_a");
        assert_gt!(fame_balance_b, 0, "RESOLVED_fame_balance_b");
        assert_eq!(fools_balance_a, 0, "RESOLVED_fools_balance_a");
        assert_eq!(fools_balance_b, 0, "RESOLVED_fools_balance_b");

        // commit+reveal
        tester::execute_commit_moves(sys.game, address_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(sys.game, address_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(sys.game, address_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(sys.game, address_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, _round) = tester::get_Challenge_Round_Entity(*sys.world, duel_id);
        assert_eq!(challenge.winner, winner, "RESOLVED_challenge.winner");

        // Duelist A
        if (winner == 1) {
            let fame_gained = rewards_a.fame_gained;
            let fools_gained = rewards_a.fools_gained;
            fame_balance_a = tester::assert_fame_token_balance(sys, duelist_id_a, fame_balance_a, 0, fame_gained, format!("RESOLVED_fame_balance_a_win [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(sys, address_a, fools_balance_a, 0, fools_gained, format!("RESOLVED_fools_balance_a_win [{}:{}]", duel_id, duelist_id_a));
        } else {
            let fame_lost = rewards_a.fame_lost;
            fame_balance_a = tester::assert_fame_token_balance(sys, duelist_id_a, fame_balance_a, fame_lost, 0, format!("RESOLVED_fame_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(sys, address_a, fools_balance_a, 0, 0, format!("RESOLVED_fools_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        }

        // Duelist B
        if (winner == 2) {
            let fame_gained = rewards_b.fame_gained;
            let fools_gained = rewards_b.fools_gained;
            fame_balance_b = tester::assert_fame_token_balance(sys, duelist_id_b, fame_balance_b, 0, fame_gained, format!("RESOLVED_fame_balance_b_win [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(sys, address_b, fools_balance_b, 0, fools_gained, format!("RESOLVED_fools_balance_b_win [{}:{}]", duel_id, duelist_id_b));
        } else {
            let fame_lost = rewards_b.fame_lost;
            fame_balance_b = tester::assert_fame_token_balance(sys, duelist_id_b, fame_balance_b, fame_lost, 0, format!("RESOLVED_fame_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(sys, address_b, fools_balance_b, 0, 0, format!("RESOLVED_fools_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
        }

        // let lords_gained: u128 = MathU128::percentage(lords_balance_bank, 60);
        // lords_balance_treasury = tester::assert_lords_balance(sys.lords, TREASURY(), lords_balance_treasury, 0, lords_gained, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));
        lords_balance_treasury = tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));
        fame_balance_bank = tester::assert_fame_balance_up(*sys.fame, (*sys.bank).contract_address, fame_balance_bank, format!("RESOLVED_fame_balance_bank [{}]", duel_id));

        // PoolType::FamePeg decreased
        let pool_peg: Pool = tester::get_Pool(*sys.world, PoolType::FamePeg);
        assert_eq!(pool_peg.balance_lords, lords_balance_bank - lords_balance_treasury, "RESOLVED_pool_peg.balance_lords END");
        assert_eq!(pool_peg.balance_fame, 0, "RESOLVED_pool_peg.balance_fame END");

        // FAME >> PoolType::Season()
        let pool_season: Pool = tester::get_Pool(*sys.world, PoolType::Season(table_id));
        assert_eq!(pool_season.balance_lords, 0, "RESOLVED_pool_season.balance_lords END");
        assert_eq!(pool_season.balance_fame, fame_balance_bank, "RESOLVED_pool_season.balance_fame END");

        // PoolType::SacredFlame == zero (still)
        let pool_flame: Pool = tester::get_Pool(*sys.world, PoolType::SacredFlame);
        assert_eq!(pool_flame.balance_lords, 0, "RESOLVED_pool_flame.balance_lords");
        assert_eq!(pool_flame.balance_fame, 0, "RESOLVED_pool_flame.balance_fame");
    }

    fn _test_bank_until_death(sys: @TestSystems, address_a: ContractAddress, address_b: ContractAddress) {
        let (salts, moves_a, moves_b): (SaltsValues, PlayerMoves, PlayerMoves) = prefabs::get_moves_dual_crit();
        (*sys.rng).set_mocked_values(salts.salts, salts.values);

// let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
// let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
// println!("fame_balance_a: {}", fame_balance_a/CONST::ETH_TO_WEI.low);
// println!("fame_balance_b: {}", fame_balance_b/CONST::ETH_TO_WEI.low);

        let duelist_id_a: u128 = ID(address_a);
        let duelist_id_b: u128 = ID(address_b);

        let table_id: felt252 = SEASON_1_TABLE();
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, address_a, address_b, table_id, 3);

        let mut fame_balance_bank: u128 = (*sys.lords).balance_of((*sys.fame).contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of((*sys.bank).contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;

        let pool_peg: Pool = tester::get_Pool(*sys.world, PoolType::FamePeg);
        let pool_season: Pool = tester::get_Pool(*sys.world, PoolType::Season(table_id));
        let pool_flame: Pool = tester::get_Pool(*sys.world, PoolType::SacredFlame);
        assert_eq!(pool_flame.balance_lords, 0, "DEATH_pool_flame.balance_lords");
        assert_eq!(pool_flame.balance_fame, 0, "DEATH_pool_flame.balance_fame");

        let mut fame_balance_a: u128 = tester::fame_balance_of_token(sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(sys, duelist_id_b);
        let mut fools_balance_a: u128 = (*sys.fools).balance_of(address_a).low;
        let mut fools_balance_b: u128 = (*sys.fools).balance_of(address_b).low;

        let rewards_a: RewardValues = (*sys.duelists).calc_season_reward(duelist_id_a, challenge.lives_staked, table_id);
        let rewards_b: RewardValues = (*sys.duelists).calc_season_reward(duelist_id_b, challenge.lives_staked, table_id);
// println!("challenge.lives_staked: {}", challenge.lives_staked);
// println!("fame_balance_a: {}", fame_balance_a/CONST::ETH_TO_WEI.low);
// println!("rewards_a.fame_lost: {}", rewards_a.fame_lost/CONST::ETH_TO_WEI.low);
// println!("rewards_a.fame_gained: {}", rewards_a.fame_gained/CONST::ETH_TO_WEI.low);
// println!("rewards_a.fools_gained: {}", rewards_a.fools_gained/CONST::ETH_TO_WEI.low);
        assert_ne!(rewards_a.fame_lost, 0, "DEATH_rewards_a.fame_lost != 0");
        assert_ne!(rewards_b.fame_lost, 0, "DEATH_rewards_b.fame_lost != 0");
        assert_ne!(rewards_a.fame_gained, 0, "DEATH_rewards_a.fame_gained != 0");
        assert_ne!(rewards_b.fame_gained, 0, "DEATH_rewards_b.fame_gained != 0");
        assert_ne!(rewards_a.fools_gained, 0, "DEATH_rewards_a.fools_gained != 0");
        assert_ne!(rewards_b.fools_gained, 0, "DEATH_rewards_b.fools_gained != 0");
        assert_eq!(rewards_a.fame_lost, rewards_b.fame_lost, "DEATH_rewards_a.fame_lost == rewards_b.fame_lost"); // lose same amount

        // commit+reveal
        tester::execute_commit_moves(sys.game, address_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(sys.game, address_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(sys.game, address_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(sys.game, address_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, _round) = tester::get_Challenge_Round_Entity(*sys.world, duel_id);
        assert_eq!(challenge.winner, 0, "DEATH_challenge.winner");

        // both lost all FAME
        fame_balance_a = tester::assert_fame_token_balance(sys, duelist_id_a, fame_balance_a, fame_balance_a, 0, format!("DEATH_fame_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        fame_balance_b = tester::assert_fame_token_balance(sys, duelist_id_b, fame_balance_b, fame_balance_b, 0, format!("DEATH_fame_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
        // FOOLS not changed
        fools_balance_a = tester::assert_fools_balance(sys, address_a, fools_balance_a, 0, 0, format!("DEATH_fools_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        fools_balance_b = tester::assert_fools_balance(sys, address_b, fools_balance_b, 0, 0, format!("DEATH_fools_balance_b_lost [{}:{}]", duel_id, duelist_id_b));

        // bank FAME up
        fame_balance_bank = tester::assert_fame_balance_up(*sys.fame, (*sys.bank).contract_address, fame_balance_bank, format!("DEATH_fame_balance_bank [{}]", duel_id));
        // bank LORDS down
        lords_balance_bank = tester::assert_lords_balance_down(*sys.lords, (*sys.bank).contract_address, lords_balance_bank, format!("DEATH_lords_balance_bank [{}]", duel_id));
        // treasury up
        lords_balance_treasury = tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, format!("DEATH_lords_balance_treasury [{}]", duel_id));

        // PoolType::FamePeg down
        tester::assert_balance_down(tester::get_Pool(*sys.world, PoolType::FamePeg).balance_lords, pool_peg.balance_lords, format!("DEATH_pool_peg.balance_lords [{}]", duel_id));
        // PoolType::Season() up
        tester::assert_balance_up(tester::get_Pool(*sys.world, PoolType::Season(table_id)).balance_fame, pool_season.balance_fame, format!("DEATH_pool_season.balance_fame [{}]", duel_id));
        // PoolType::SacredFlame up
        tester::assert_balance_up(tester::get_Pool(*sys.world, PoolType::SacredFlame).balance_fame, pool_flame.balance_fame, format!("DEATH_pool_flame.balance_fame [{}]", duel_id));
    }


    #[test]
    fn test_bank_resolved_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys.lords, @sys.bank, 2);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 0);
    }

    #[test]
    fn test_bank_resolved_win_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys.lords, @sys.bank, 3);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        tester::execute_claim_welcome_pack(@sys.pack, BUMMER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 1);
        _test_bank_until_death(@sys, OWNER(), BUMMER());
    }

    #[test]
    fn test_bank_resolved_win_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys.lords, @sys.bank, 3);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        tester::execute_claim_welcome_pack(@sys.pack, BUMMER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 2);
        _test_bank_until_death(@sys, BUMMER(), OTHER());
    }


    //-----------------------------------------
    // Bank / Peg pools
    //
    #[test]
    fn test_bank_peg_pool() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE);

        let bank_address: ContractAddress = sys.bank.contract_address;
        let price_welcome: u128 = PackType::WelcomePack.description().lords_price;
        let price_pack: u128 = PackType::Duelists5x.description().lords_price;
        assert_ne!(price_welcome, 0, "price_welcome");
        assert_ne!(price_pack, 0, "price_pack");

        // initial balances
        let mut balance_bank: u128 = sys.lords.balance_of(bank_address).low;
        let mut pool_bank: u128 = tester::get_Pool(sys.world, PoolType::Purchases).balance_lords;
        let mut pool_peg: u128 = tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank, 0, "balance_bank INIT");
        assert_eq!(pool_bank, 0, "pool_bank INIT");
        assert_eq!(pool_peg, 0, "pool_peg INIT");

        // fund PoolType::Purchases
        tester::fund_duelists_pool(@sys.lords, @sys.bank, 1);
        balance_bank = tester::assert_lords_balance(sys.lords, bank_address, balance_bank, 0, price_welcome, "balance_bank FUND");
        pool_bank = tester::assert_balance(tester::get_Pool(sys.world, PoolType::Purchases).balance_lords, pool_bank, 0, price_welcome, "pool_bank FUND");
        pool_peg = tester::assert_balance(tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords, pool_peg, 0, 0, "pool_peg FUND");

        // claim duelists -- transfered to PoolType::FamePeg
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        balance_bank = tester::assert_lords_balance(sys.lords, bank_address, balance_bank, 0, 0, "balance_bank CLAIM");
        pool_bank = tester::assert_balance(tester::get_Pool(sys.world, PoolType::Purchases).balance_lords, pool_bank, price_welcome, 0, "pool_bank CLAIM");
        pool_peg = tester::assert_balance(tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords, pool_peg, 0, price_welcome, "pool_peg CLAIM");

        // purchase to PoolType::Purchases
        let pack: Pack = sys.pack.purchase(PackType::Duelists5x);
        balance_bank = tester::assert_lords_balance(sys.lords, bank_address, balance_bank, 0, price_pack, "balance_bank PURCHASE");
        pool_bank = tester::assert_balance(tester::get_Pool(sys.world, PoolType::Purchases).balance_lords, pool_bank, 0, price_pack, "pool_bank PURCHASE");
        pool_peg = tester::assert_balance(tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords, pool_peg, 0, 0, "pool_peg PURCHASE");

        // open pack
        sys.pack.open(pack.pack_id);
        balance_bank = tester::assert_lords_balance(sys.lords, bank_address, balance_bank, 0, 0, "balance_bank PURCHASE");
        pool_bank = tester::assert_balance(tester::get_Pool(sys.world, PoolType::Purchases).balance_lords, pool_bank, price_pack, 0, "pool_bank PURCHASE");
        pool_peg = tester::assert_balance(tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords, pool_peg, 0, price_pack, "pool_peg PURCHASE");

        // final balances
        let mut balance_bank: u128 = sys.lords.balance_of(bank_address).low;
        let mut pool_bank: u128 = tester::get_Pool(sys.world, PoolType::Purchases).balance_lords;
        let mut pool_peg: u128 = tester::get_Pool(sys.world, PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank, (price_welcome + price_pack), "balance_bank END");
        assert_eq!(pool_bank, 0, "pool_bank END");
        assert_eq!(pool_peg, (price_welcome + price_pack), "pool_peg END");
    }

}
