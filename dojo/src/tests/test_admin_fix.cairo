#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};

    use pistols::models::{
        // pool::{Pool, PoolTrait, PoolType},
        challenge::{Challenge, DuelType},
        duelist::{DuelistAssignment, DuelistMemorial, CauseOfDeath},
        match_queue::{QueueId},
        pack::{Pack, PackType},
        pool::{Pool, PoolType},
        config::{Config, CONFIG},
    };
    use pistols::types::{
        challenge_state::{ChallengeState},
        premise::{Premise},
        timestamp::{Period},
    };

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IAdminDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IFameCoinDispatcherTrait,
            ILordsMockDispatcherTrait,
            ZERO, OWNER, OTHER, BUMMER,
            TREASURY, REALMS,
            // FAUCET_AMOUNT,
        }
    };
    // use pistols::libs::admin_fix::{AdminFixTrait};

    //-----------------------------------------
    // ADMIN FIX
    //

    #[test]
    #[should_panic(expected: ('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_urgent_update_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OTHER());
        sys.admin.urgent_update();
    }


    //-----------------------------------------
    // veLords migration
    //

    #[test]
    fn test_velords_migrate_pools() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER | FLAGS::DUELIST | FLAGS::FAME | FLAGS::LORDS | FLAGS::LORDS);
        tester::execute_claim_starter_pack(@sys, OWNER()); // minted 1, 2
        tester::execute_claim_starter_pack(@sys, OTHER()); // minted 3, 4
        assert_gt!(sys.fame.total_supply(), 0);
        // get LORDS into bank...
        tester::impersonate(OWNER());
        tester::execute_lords_faucet(@sys.lords, sys.bank.contract_address);
        assert_eq!(sys.lords.balance_of(sys.bank.contract_address), 10_000_000_000_000_000_000_000);
        // mock pools
        tester::impersonate(OWNER());
        tester::set_Config(ref sys.world, @Config {
            key: CONFIG::CONFIG_KEY,
            current_season_id: 12,
            treasury_address: TREASURY(),
            lords_address: sys.lords.contract_address,
            vrf_address: ZERO(),
            realms_address: REALMS(),
            is_paused: false,
        });
        tester::set_Pool(ref sys.world, @Pool {
            pool_id: PoolType::Purchases,
            balance_lords: 10_000_000_000_000_000_000_000,
            balance_fame: 0,
        });
        // migrate...
        tester::impersonate(OWNER());
        sys.admin.velords_migrate_pools();
        assert_eq!(sys.lords.balance_of(TREASURY()), 4_000_000_000_000_000_000_000);
        assert_eq!(sys.lords.balance_of(REALMS()), 2_000_000_000_000_000_000_000);
        assert_eq!(sys.lords.balance_of(sys.bank.contract_address), 4_000_000_000_000_000_000_000);
        let pool_purchases: Pool = sys.store.get_pool(PoolType::Purchases);
        let pool_fame_peg: Pool = sys.store.get_pool(PoolType::FamePeg);
        assert_eq!(pool_purchases.balance_lords, 4_000_000_000_000_000_000_000);
        assert_eq!(pool_purchases.balance_fame, 0);
        assert_eq!(pool_fame_peg.balance_fame, sys.fame.total_supply().low);
    }

    #[test]
    fn test_velords_migrate_packs() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OWNER());
        tester::set_Pack(ref sys.world, @Pack {
            pack_id: 1,
            lords_amount: 100_000_000_000_000_000_000,
            is_open: true,
            pegged_lords_amount: 0,
            pack_type: PackType::StarterPack,
            seed: 0,
            duelist_profile: None,
        });
        tester::set_Pack(ref sys.world, @Pack {
            pack_id: 2,
            lords_amount: 100_000_000_000_000_000_000,
            is_open: false,
            pegged_lords_amount: 0,
            pack_type: PackType::StarterPack,
            seed: 0,
            duelist_profile: None,
        });
        tester::set_Pack(ref sys.world, @Pack {
            pack_id: 3,
            lords_amount: 100_000_000_000_000_000_000,
            is_open: false,
            pegged_lords_amount: 0,
            pack_type: PackType::StarterPack,
            seed: 0,
            duelist_profile: None,
        });
        tester::set_Pack(ref sys.world, @Pack {
            pack_id: 4,
            lords_amount: 200_000_000_000_000_000_000,
            is_open: false,
            pegged_lords_amount: 0,
            pack_type: PackType::StarterPack,
            seed: 0,
            duelist_profile: None,
        });
        // migrate...
        sys.admin.velords_migrate_packs(array![2,3,4]);
        assert_eq!(sys.store.get_pack(1).pegged_lords_amount, 0);
        assert_eq!(sys.store.get_pack(2).pegged_lords_amount, 40_000_000_000_000_000_000);
        assert_eq!(sys.store.get_pack(3).pegged_lords_amount, 40_000_000_000_000_000_000);
        assert_eq!(sys.store.get_pack(4).pegged_lords_amount, 80_000_000_000_000_000_000);
    }

    #[test]
    fn test_velords_migrate_ranked_challenges() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OWNER());
        tester::set_Challenge(ref sys.world, @Challenge {
            duel_id: 1,
            duel_type: DuelType::Seasonal,
            state: ChallengeState::InProgress,
            season_id: 0,
            premise: Premise::Undefined,
            lives_staked: 0,
            address_a: OWNER(),
            address_b: OTHER(),
            duelist_id_a: 1,
            duelist_id_b: 2,
            winner: 0,
            timestamps: Period { start: 0, end: 0 },
        });
        tester::set_Challenge(ref sys.world, @Challenge {
            duel_id: 2,
            duel_type: DuelType::Ranked,
            state: ChallengeState::Draw,
            season_id: 0,
            premise: Premise::Undefined,
            lives_staked: 0,
            address_a: OWNER(),
            address_b: OTHER(),
            duelist_id_a: 1,
            duelist_id_b: 2,
            winner: 0,
            timestamps: Period { start: 0, end: 0 },
        });
        tester::set_Challenge(ref sys.world, @Challenge {
            duel_id: 3,
            duel_type: DuelType::Ranked,
            state: ChallengeState::Awaiting,
            season_id: 0,
            premise: Premise::Undefined,
            lives_staked: 0,
            address_a: OWNER(),
            address_b: OTHER(),
            duelist_id_a: 1,
            duelist_id_b: 2,
            winner: 0,
            timestamps: Period { start: 0, end: 0 },
        });
        tester::set_Challenge(ref sys.world, @Challenge {
            duel_id: 4,
            duel_type: DuelType::Ranked,
            state: ChallengeState::InProgress,
            season_id: 0,
            premise: Premise::Undefined,
            lives_staked: 0,
            address_a: OWNER(),
            address_b: OTHER(),
            duelist_id_a: 1,
            duelist_id_b: 2,
            winner: 0,
            timestamps: Period { start: 0, end: 0 },
        });
        // migrate...
        let season_id: u32 = 13;
        tester::set_current_season(ref sys, season_id);
        sys.admin.velords_migrate_ranked_challenges(array![3,4]);
        assert_eq!(sys.store.get_challenge(1).season_id, 0);
        assert_eq!(sys.store.get_challenge(2).season_id, 0);
        assert_eq!(sys.store.get_challenge(3).season_id, season_id-1);
        assert_eq!(sys.store.get_challenge(4).season_id, season_id-1);
    }

    #[test]
    fn test_velords_migrate_duelists() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER | FLAGS::DUELIST | FLAGS::FAME | FLAGS::LORDS);
        tester::execute_claim_starter_pack(@sys, OWNER()); // minted 1, 2
        tester::execute_claim_starter_pack(@sys, OTHER()); // minted 3, 4
        tester::execute_claim_starter_pack(@sys, BUMMER()); // minted 5, 6
        // mock assignments
        tester::impersonate(OWNER());
        tester::set_DuelistAssignment(ref sys.world, @DuelistAssignment {
            duelist_id: 1,
            duel_id: 0,
            pass_id: 0,
            queue_id: QueueId::Ranked,
            season_id: 0,
        });
        tester::set_DuelistAssignment(ref sys.world, @DuelistAssignment {   
            duelist_id: 2,
            duel_id: 1,
            pass_id: 0,
            queue_id: QueueId::Ranked,
            season_id: 0,
        });
        tester::set_DuelistAssignment(ref sys.world, @DuelistAssignment {
            duelist_id: 3,
            duel_id: 0,
            pass_id: 0,
            queue_id: QueueId::Ranked,
            season_id: 0,
        });
        tester::set_DuelistAssignment(ref sys.world, @DuelistAssignment {
            duelist_id: 4,
            duel_id: 0,
            pass_id: 0,
            queue_id: QueueId::Ranked,
            season_id: 0,
        });
        tester::set_DuelistAssignment(ref sys.world, @DuelistAssignment {
            duelist_id: 5,
            duel_id: 0,
            pass_id: 0,
            queue_id: QueueId::Unranked,
            season_id: 0,
        });
        // sacrifice 1
        tester::impersonate(OWNER());
        sys.duelists.sacrifice(1);
        //
        // migrate...
        let season_id: u32 = 13;
        tester::set_current_season(ref sys, season_id);
        sys.admin.velords_migrate_ranked_duelists(array![1,2,3,4]);
        assert_eq!(sys.store.get_duelist_assignment(1).season_id, season_id-1);
        assert_eq!(sys.store.get_duelist_assignment(2).season_id, season_id-1);
        assert_eq!(sys.store.get_duelist_assignment(3).season_id, season_id-1);
        assert_eq!(sys.store.get_duelist_assignment(4).season_id, season_id-1);
        assert_eq!(sys.store.get_duelist_assignment(5).season_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(6).season_id, 0);
        assert_eq!(sys.store.get_duelist_memorial_value(1).cause_of_death, CauseOfDeath::Sacrifice); // no change
        assert_eq!(sys.store.get_duelist_memorial_value(2).cause_of_death, CauseOfDeath::Ranked); // memorialized
        assert_eq!(sys.store.get_duelist_memorial_value(3).cause_of_death, CauseOfDeath::Ranked); // memorialized
        assert_eq!(sys.store.get_duelist_memorial_value(4).cause_of_death, CauseOfDeath::Ranked); // memorialized
        assert_eq!(sys.store.get_duelist_memorial_value(5).cause_of_death, CauseOfDeath::None); // no change
        assert_eq!(sys.store.get_duelist_memorial_value(6).cause_of_death, CauseOfDeath::None); // no change
    }


    #[test]
    fn test_velords_migrate_ranked_duelists_2() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER | FLAGS::DUELIST | FLAGS::FAME | FLAGS::LORDS);
        //
        // get some FAME into the bank for burning
        tester::execute_claim_starter_pack(@sys, OWNER()); // minted 1, 2
        let fame_supply: u256 = sys.fame.total_supply();
        let fame_balance: u256 = sys.fame.balance_of_token(sys.duelists.contract_address, 1);
        let half_balance: u256 = fame_balance / 2;
        assert_gt!(fame_balance, 0);
        assert_eq!(fame_supply, fame_balance * 2);
        tester::impersonate(sys.duelists.contract_address);
        sys.fame.transfer_from_token(sys.duelists.contract_address, 1, sys.bank.contract_address, half_balance);
        assert_eq!(sys.fame.balance_of_token(sys.duelists.contract_address, 1), half_balance);
        assert_eq!(sys.fame.balance_of(sys.bank.contract_address), half_balance);
        // mock FAME pool
        tester::set_Pool(ref sys.world, @Pool {
            pool_id: PoolType::FamePeg,
            balance_lords: 0,
            balance_fame: fame_supply.low,
        });
        //
        // mock memorials
        tester::impersonate(OWNER());
        tester::set_DuelistMemorial(ref sys.world, @DuelistMemorial {
            duelist_id: 1,
            cause_of_death: CauseOfDeath::Ranked,
            killed_by: 0,
            fame_before_death: 0,
            player_address: OWNER(),
            season_id: 12,
        });
        tester::set_DuelistMemorial(ref sys.world, @DuelistMemorial {
            duelist_id: 2,
            cause_of_death: CauseOfDeath::Ranked,
            killed_by: 0,
            fame_before_death: 0,
            player_address: OWNER(),
            season_id: 13,
        });
        tester::set_DuelistMemorial(ref sys.world, @DuelistMemorial {
            duelist_id: 3,
            cause_of_death: CauseOfDeath::Ranked,
            killed_by: 0,
            fame_before_death: 0,
            player_address: OWNER(),
            season_id: 13,
        });
        //
        // migrate...
        let season_id: u32 = 13;
        tester::set_current_season(ref sys, season_id);
        sys.admin.velords_migrate_ranked_duelists_2(array![2,3]);
        assert_eq!(sys.store.get_duelist_memorial_value(1).season_id, 12);
        assert_eq!(sys.store.get_duelist_memorial_value(2).season_id, 12);
        assert_eq!(sys.store.get_duelist_memorial_value(3).season_id, 12);
        assert_eq!(sys.fame.balance_of(sys.bank.contract_address), 0);
        assert_eq!(sys.fame.total_supply(), fame_supply - half_balance);
        assert_eq!(sys.store.get_pool(PoolType::FamePeg).balance_fame, fame_supply.low - half_balance.low);
    }
}
