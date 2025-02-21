#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::{
        pool::{Pool, PoolType},
        pack::{Pack, PackType, PackTypeTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        season::{SeasonConfig},
    };
    use pistols::types::rules::{RewardValues};
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            ILordsMockDispatcherTrait,
            IFoolsCoinDispatcherTrait,
            IPackTokenDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IFameCoinDispatcherTrait,
            // IBankDispatcherTrait,
            ID, OWNER, OTHER, BUMMER, RECIPIENT, TREASURY,
            SEASON_1_TABLE,
            FAUCET_AMOUNT, ETH, WEI,
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

    fn consume_imports() {
        WEI(0);
        ETH(0);
        FAUCET_AMOUNT;
    }

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

        let mut fame_balance_bank: u128 = (*sys.fame).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
        assert_eq!(fame_balance_bank, 0, "RESOLVED_fame_balance_bank");
        assert_ne!(lords_balance_bank, 0, "RESOLVED_lords_balance_bank");
        assert_eq!(lords_balance_treasury, 0, "RESOLVED_lords_balance_treasury");
// println!("lords_balance_bank: {}", WEI(lords_balance_bank));
// println!("fame_supply: {}", WEI(sys.fame.total_supply()));

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

        let rewards_a: RewardValues = (*sys.game).calc_season_reward(duelist_id_a, challenge.lives_staked, table_id);
        let rewards_b: RewardValues = (*sys.game).calc_season_reward(duelist_id_b, challenge.lives_staked, table_id);
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
        fame_balance_bank = tester::assert_fame_balance_up(*sys.fame, *sys.bank.contract_address, fame_balance_bank, format!("RESOLVED_fame_balance_bank [{}]", duel_id));
        lords_balance_treasury = tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));
        // lords_balance_treasury = tester::assert_lords_balance(sys.lords, TREASURY(), lords_balance_treasury, 0, lords_gained, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));

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

    fn _test_bank_draw(sys: @TestSystems, address_a: ContractAddress, address_b: ContractAddress, lives: u8) {
        let (salts, moves_a, moves_b): (SaltsValues, PlayerMoves, PlayerMoves) = prefabs::get_moves_dual_crit();
        (*sys.rng).set_mocked_values(salts.salts, salts.values);

// let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
// let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
// println!("fame_balance_a: {}", WEI(fame_balance_a));
// println!("fame_balance_b: {}", WEI(fame_balance_b));

        let duelist_id_a: u128 = ID(address_a);
        let duelist_id_b: u128 = ID(address_b);

        let table_id: felt252 = SEASON_1_TABLE();
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, address_a, address_b, table_id, lives);

        let mut fame_balance_bank: u128 = (*sys.fame).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
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

        let rewards_a: RewardValues = (*sys.game).calc_season_reward(duelist_id_a, challenge.lives_staked, table_id);
        let rewards_b: RewardValues = (*sys.game).calc_season_reward(duelist_id_b, challenge.lives_staked, table_id);
// println!("challenge.lives_staked: {}", challenge.lives_staked);
// println!("fame_balance_a: {}", WEI(fame_balance_a));
// println!("rewards_a.fame_lost: {}", WEI(rewards_a.fame_lost));
// println!("rewards_a.fame_gained: {}", WEI(rewards_a.fame_gained));
// println!("rewards_a.fools_gained: {}", WEI(rewards_a.fools_gained));
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
        fame_balance_bank = tester::assert_fame_balance_up(*sys.fame, *sys.bank.contract_address, fame_balance_bank, format!("DEATH_fame_balance_bank [{}]", duel_id));
        // bank LORDS down
        lords_balance_bank = tester::assert_lords_balance_down(*sys.lords, *sys.bank.contract_address, lords_balance_bank, format!("DEATH_lords_balance_bank [{}]", duel_id));
        // treasury up
        lords_balance_treasury = tester::assert_lords_balance_up(*sys.lords, TREASURY(), lords_balance_treasury, format!("DEATH_lords_balance_treasury [{}]", duel_id));

        // PoolType::FamePeg down
        tester::assert_balance_down(tester::get_Pool(*sys.world, PoolType::FamePeg).balance_lords, pool_peg.balance_lords, format!("DEATH_pool_peg.balance_lords [{}]", duel_id));
        // PoolType::Season() up
        tester::assert_balance_up(tester::get_Pool(*sys.world, PoolType::Season(table_id)).balance_fame, pool_season.balance_fame, format!("DEATH_pool_season.balance_fame [{}]", duel_id));
        // PoolType::SacredFlame up
        tester::assert_balance_up(tester::get_Pool(*sys.world, PoolType::SacredFlame).balance_fame, pool_flame.balance_fame, format!("DEATH_pool_flame.balance_fame [{}]", duel_id));
    }

    fn _test_season_collect(sys: @TestSystems, order: Span<u128>, dead_duelist: u128) {
        // get rid of FAUCET_AMOUNT to start with balance zero
        tester::impersonate(OWNER());
        (*sys.lords).transfer(RECIPIENT(), FAUCET_AMOUNT.into());
        tester::impersonate(OTHER());
        (*sys.lords).transfer(RECIPIENT(), FAUCET_AMOUNT.into());

        // validate leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_1_TABLE());
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), order.len(), "leaderboard_size");
        let mut i: usize = 0;
        while (i < order.len()) {
            let position: LeaderboardPosition = *positions[i];
            assert_eq!(position.duelist_id, *order[i], "leaderboard_position [{}]:[{}]", i, position.duelist_id);
            let owner: ContractAddress = (*sys.duelists).owner_of(position.duelist_id.into());
            assert_eq!((*sys.lords).balance_of(owner), 0, "leaderboard_balance of [{}]:[{}] == 0", i, position.duelist_id);
            i += 1;
        };

        let mut fame_supply: u128 = (*sys.fame).total_supply().low;
        let mut fame_balance_bank: u128 = (*sys.fame).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
// println!("fame_balance_bank:{}", ETH(fame_balance_bank));
// println!("lords_balance_bank:{}", ETH(lords_balance_bank));
// println!("lords_balance_treasury:{}", ETH(lords_balance_treasury));

        let pool_peg: Pool = tester::get_Pool(*sys.world, PoolType::FamePeg);
println!("pool_peg.balance_lords {} / {}", ETH(pool_peg.balance_lords), pool_peg.balance_lords);

        // FAME >> PoolType::Season()
        let pool_season: Pool = tester::get_Pool(*sys.world, PoolType::Season(SEASON_1_TABLE()));
        assert_eq!(pool_season.balance_lords, 0, "COLLECTED_pool_season.balance_lords BEFORE = 0");
        assert_ne!(pool_season.balance_fame, 0, "COLLECTED_pool_season.balance_fame BEFORE > 0");

        // collect season
        let season: SeasonConfig = tester::get_current_Season(*sys.world);
        tester::set_block_timestamp(season.timestamp_end);
        tester::execute_collect(sys.game, OWNER());

        // duelists got some LORDS
        let mut last_balance: u128 = 0xffffffffffffffffffffffffffffffff;
        let mut sum_balances: u128 = 0;
        let mut i: usize = 0;
        while (i < order.len()) {
            let position: LeaderboardPosition = *positions[i];
            let owner: ContractAddress = (*sys.duelists).owner_of(position.duelist_id.into());
            let balance: u128 = (*sys.lords).balance_of(owner).low;
// println!("balance of [{}]:[{}] = [{}]", i, position.duelist_id, WEI(balance));
            assert_gt!(balance, 0, "leaderboard_balance of [{}]:[{}] > 0", i, position.duelist_id);
            assert_lt!(balance, last_balance, "leaderboard_balance of [{}]:[{}] < last_balance", i, position.duelist_id);
            last_balance = balance;
            sum_balances += balance;
            i += 1;
        };
// println!("sum_balances {} / {}", ETH(sum_balances), sum_balances);

        // supply FAME down (burned)
        fame_supply = tester::assert_balance_down((*sys.fame).total_supply().low, fame_supply, format!("COLLECTED_fame_supply"));
        // bank FAME down
        fame_balance_bank = tester::assert_fame_balance_down(*sys.fame, *sys.bank.contract_address, fame_balance_bank, format!("COLLECTED_fame_balance_bank"));
        // bank LORDS down by SUM
        lords_balance_bank = tester::assert_lords_balance(*sys.lords, *sys.bank.contract_address, lords_balance_bank, sum_balances, 0, format!("COLLECTED_lords_balance_bank"));
        // treasury same
        lords_balance_treasury = tester::assert_lords_balance_equal(*sys.lords, TREASURY(), lords_balance_treasury, format!("COLLECTED_lords_balance_treasury"));
// println!("+ fame_balance_bank:{}", ETH(fame_balance_bank));
// println!("+ lords_balance_bank:{}", ETH(lords_balance_bank));
// println!("+ lords_balance_treasury:{}", ETH(lords_balance_treasury));

        // PoolType::FamePeg decreased by SUM
        let _pool_peg_lords: u128 = tester::assert_balance(tester::get_Pool(*sys.world, PoolType::FamePeg).balance_lords, pool_peg.balance_lords, sum_balances, 0, format!("COLLECTED_pool_peg_lords"));
// println!("+ pool_peg.balance_lords {} / {}", ETH(pool_peg_lords), pool_peg_lords);

        // PoolType::Season() ZEROEDs
        let pool_season: Pool = tester::get_Pool(*sys.world, PoolType::Season(SEASON_1_TABLE()));
        assert_eq!(pool_season.balance_lords, 0, "COLLECTED_pool_season.balance_lords AFTER = 0");
        assert_eq!(pool_season.balance_fame, 0, "COLLECTED_pool_season.balance_fame AFTER = 0");

        // PoolType::SacredFlame increased if DEAD
        let has_deads: bool = (order.len() > 2);
        let pool_flame: Pool = tester::get_Pool(*sys.world, PoolType::SacredFlame);
        assert_eq!(pool_flame.balance_lords, 0, "COLLECTED_pool_flame.balance_lords = 0");
        if (has_deads) {
            assert_ne!(pool_flame.balance_fame, 0, "COLLECTED_pool_flame.balance_fame_DEADS > 0");
        } else {
            assert_eq!(pool_flame.balance_fame, 0, "COLLECTED_pool_flame.balance_fame_ALIVES = 0");
        }

    }


    #[test]
    fn test_bank_resolved_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 0);
        let order: Span<u128> = [
            ID(OWNER()), // fame 3000 - 1000 = 2000 / score 10
            ID(OTHER()), // fame 2000 - 1000 = 2000 / score 10
        ].span();
        _test_season_collect(@sys, order, 0);
    }

    #[test]
    fn test_bank_resolved_win_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 3);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        tester::execute_claim_welcome_pack(@sys.pack, BUMMER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 1);
        _test_bank_draw(@sys, OWNER(), BUMMER(), 3);
        let order: Span<u128> = [
            ID(OWNER()), // fame 3000 + 250 - 3000 = 250 (DEAD) / score 100 + 10 = 110
            ID(OTHER()), // fame 3000 - 1000 = 2000 / score 10
            ID(BUMMER()), // fame 3000 - 3000 - 0 (DEAD) / score 10
        ].span();
        _test_season_collect(@sys, order, ID(OWNER()));
    }

    #[test]
    fn test_bank_resolved_win_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 3);
        tester::execute_claim_welcome_pack(@sys.pack, OWNER());
        tester::execute_claim_welcome_pack(@sys.pack, OTHER());
        tester::execute_claim_welcome_pack(@sys.pack, BUMMER());
        _test_bank_resolved(@sys, OWNER(), OTHER(), 2);
        _test_bank_draw(@sys, OTHER(), BUMMER(), 3);
        let order: Span<u128> = [
            ID(OTHER()), // fame 3000 + 250 - 3000 = 250 (DEAD) / score 100 + 10 = 110
            ID(OWNER()), // fame 3000 - 1000 = 2000 / score 10
            ID(BUMMER()), // fame 3000 - 3000 - 0 (DEAD) / score 10
            ].span();
        _test_season_collect(@sys, order, ID(OTHER()));
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
        tester::fund_duelists_pool(@sys, 1);
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
