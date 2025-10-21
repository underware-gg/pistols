#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::{
        pool::{Pool, PoolTrait, PoolType},
        pack::{PackType, PackTypeTrait},
    };

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IPackTokenDispatcherTrait,
            ILordsMockDispatcherTrait,
            IAdminDispatcherTrait,
            OWNER, OTHER,
        }
    };
    use pistols::libs::admin_fix::{AdminFixTrait};

    //-----------------------------------------
    // ADMIN FIX
    //

    #[test]
    fn test_fix_claimable_pool() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::OWNER | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE);

        let bank_address: ContractAddress = sys.bank.contract_address;
        let price_starter: u128 = PackType::StarterPack.descriptor().price_lords;
        let price_pack: u128 = PackType::GenesisDuelists5x.descriptor().price_lords;
        assert_ne!(price_starter, 0, "price_starter");
        assert_ne!(price_pack, 0, "price_pack");

        // initial balances
        let balance_bank_init: u128 = sys.lords.balance_of(bank_address).low;
        let balance_claimable_init: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let balance_purchases_init: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let balance_peg_init: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank_init, 0, "balance_bank INIT");
        assert_eq!(balance_claimable_init, 0, "balance_claimable INIT");
        assert_eq!(balance_purchases_init, 0, "balance_purchases INIT");
        assert_eq!(balance_peg_init, 0, "balance_peg INIT");

        // fund 10 starters...
        tester::fund_duelists_pool(@sys, 35);
        // claim 2 starters...
        tester::execute_claim_starter_pack(@sys, OWNER());
        tester::execute_claim_starter_pack(@sys, OTHER());
        // purchase 7 packs...
        // 3 will be opened...
        let pack_id_1: u128 = tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        let pack_id_2: u128 = tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        let pack_id_3: u128 = tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        // 4 will remain closed...
        tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
        // open 3 packs...
        tester::execute_pack_open(@sys, OWNER(), pack_id_1);
        tester::execute_pack_open(@sys, OWNER(), pack_id_2);
        tester::execute_pack_open(@sys, OWNER(), pack_id_3);

        // desired balances
        let balance_bank_OK: u128 = sys.lords.balance_of(bank_address).low;
        let balance_claimable_OK: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let balance_purchases_OK: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let balance_peg_OK: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank_OK, (10 * price_starter + 7 * price_pack), "balance_bank BASELINE");
        assert_eq!(balance_claimable_OK, (8 * price_starter), "balance_claimable BASELINE");
        assert_eq!(balance_purchases_OK, (4 * price_pack), "balance_purchases BASELINE");
        assert_eq!(balance_peg_OK, (2 * price_starter + 3 * price_pack), "balance_peg BASELINE");

        // what we have in production is everything on PackType::Purchases
        let mut pool_claimable: Pool = sys.store.get_pool(PoolType::Claimable);
        let mut pool_purchases: Pool = sys.store.get_pool(PoolType::Purchases);
        pool_claimable.withdraw_lords(balance_claimable_OK);
        pool_purchases.deposit_lords(balance_claimable_OK);
        sys.store.set_pool(@pool_claimable);
        sys.store.set_pool(@pool_purchases);
        // tester::set_Pool(ref sys.world, @pool_claimable);
        // tester::set_Pool(ref sys.world, @pool_purchases);

        // like this...
        let balance_bank_prod: u128 = sys.lords.balance_of(bank_address).low;
        let balance_claimable_prod: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let balance_purchases_prod: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let balance_peg_prod: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank_prod, balance_bank_OK, "balance_bank PROD");
        assert_eq!(balance_claimable_prod, 0, "balance_claimable PROD");
        assert_eq!(balance_purchases_prod, (balance_claimable_OK + balance_purchases_OK), "balance_purchases PROD");
        assert_eq!(balance_peg_prod, balance_peg_OK, "balance_peg PROD");

        // we'll need the correct packs supply...
        let packs_supply: u128 = sys.pack.total_supply().low;
        assert_eq!(packs_supply, 4, "packs_supply");

        // execute the admin function...
        let amount_transferred: u128 = AdminFixTrait::fix_claimable_pool(ref sys.store);
        assert_eq!(amount_transferred, balance_claimable_OK, "amount_transferred");

        // check final balances
        let balance_bank_fixed: u128 = sys.lords.balance_of(bank_address).low;
        let balance_claimable_fixed: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let balance_purchases_fixed: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let balance_peg_fixed: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank_fixed, balance_bank_OK, "balance_bank FIXED");
        assert_eq!(balance_claimable_fixed, balance_claimable_OK, "balance_claimable FIXED");
        assert_eq!(balance_purchases_fixed, balance_purchases_OK, "balance_purchases FIXED");
        assert_eq!(balance_peg_fixed, balance_peg_OK, "balance_peg FIXED");

        // execute again should have no effect...
        let amount_transferred: u128 = AdminFixTrait::fix_claimable_pool(ref sys.store);
        assert_eq!(amount_transferred, 0, "amount_transferred");

        // check again...
        let balance_bank_still: u128 = sys.lords.balance_of(bank_address).low;
        let balance_claimable_still: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let balance_purchases_still: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let balance_peg_still: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        assert_eq!(balance_bank_still, balance_bank_OK, "balance_bank STILL");
        assert_eq!(balance_claimable_still, balance_claimable_OK, "balance_claimable STILL");
        assert_eq!(balance_purchases_still, balance_purchases_OK, "balance_purchases STILL");
        assert_eq!(balance_peg_still, balance_peg_OK, "balance_peg STILL");
    }

    #[test]
    #[should_panic(expected: ('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_urgent_update_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OTHER());
        sys.admin.urgent_update();
    }
}
