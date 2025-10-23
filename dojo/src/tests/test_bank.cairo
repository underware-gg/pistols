#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::{
        challenge::{ChallengeValue, DuelType},
        pool::{Pool, PoolType},
        pack::{PackType, PackTypeTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        season::{SeasonConfig},
    };
    use pistols::types::{
        rules::{RewardValues},
        duelist_profile::{DuelistProfile, GenesisKey},
        challenge_state::{ChallengeState},
        constants::{FAME},
    };
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            ILordsMockDispatcherTrait,
            IFoolsCoinDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IFameCoinDispatcherTrait,
            IBankDispatcherTrait,
            ID, OWNER, OWNER2, OTHER, OTHER2, BUMMER, RECIPIENT, TREASURY, REALMS,
            FAUCET_AMOUNT, SEASON_ID_1,
            ETH, WEI,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            PlayerMoves,
        },
    };
    use pistols::systems::rng_mock::{IRngMockDispatcherTrait, MockedValue};
    use pistols::utils::math::{MathU128};

    fn consume_imports() {
        WEI(0);
        ETH(0);
        FAUCET_AMOUNT;
    }

    const TOURNAMENT_ID: u64 = 100;

    pub fn _airdrop_open(sys: @TestSystems, recipient: ContractAddress, duelist_profile: DuelistProfile) -> u128 {
        let pack_id: u128 = tester::execute_pack_airdrop(sys, OWNER(), recipient, PackType::SingleDuelist, Option::Some(duelist_profile));
        let token_ids: Span<u128> = tester::execute_pack_open(sys, recipient, pack_id);
        (*token_ids[0])
    }

    //-----------------------------------------
    // Challenge results
    //


    #[test]
    fn test_bank_resolved_win_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST |  FLAGS::FAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG | FLAGS::MATCHMAKER);
        tester::fund_duelists_pool(@sys, 6);
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, BUMMER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, BUMMER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _execute_bank_resolved(ref sys, OWNER(), OTHER(), 1);
        _execute_bank_draw(ref sys, OWNER(), BUMMER(), 3);
        let order: Span<u128> = [
            ID(OWNER()), // fame 3000 + 250 - 3000 = 250 (DEAD) / score 100 + 10 = 110
            ID(BUMMER()), // fame 3000 - 3000 - 0 (DEAD) / score 20?? > scoring changed
            ID(OTHER()), // fame 3000 - 1000 = 2000 / score 10
        ].span();
        _test_season_collect(@sys, order);
    }

    #[test]
    fn test_bank_resolved_win_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST |  FLAGS::FAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG | FLAGS::MATCHMAKER);
        tester::fund_duelists_pool(@sys, 6);
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, BUMMER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, BUMMER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _execute_bank_resolved(ref sys, OWNER(), OTHER(), 2);
        _execute_bank_draw(ref sys, OTHER(), BUMMER(), 3);
        let order: Span<u128> = [
            ID(OTHER()), // fame 3000 + 250 - 3000 = 250 (DEAD) / score 100 + 10 = 110
            ID(BUMMER()), // fame 3000 - 3000 - 0 (DEAD) / score 20?? > scoring changed
            ID(OWNER()), // fame 3000 - 1000 = 2000 / score 10
            ].span();

        _test_season_collect(@sys, order);
    }

    fn _execute_bank_resolved(ref sys: TestSystems, address_a: ContractAddress, address_b: ContractAddress, winner: u8) {
        let (mocked, moves_a, moves_b): (Span<MockedValue>, PlayerMoves, PlayerMoves) = prefabs::get_moves_for_winner(winner);
        (sys.rng).mock_values(mocked);

        let duelist_id_a: u128 = ID(address_a);
        let duelist_id_b: u128 = ID(address_b);

        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, address_a, address_b, DuelType::Seasonal, 1);
        tester::make_challenge_ranked(ref sys, duel_id);

        // bank has only LORDS
        let mut lords_balance_bank: u128 = (sys.lords).balance_of(sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (sys.lords).balance_of(TREASURY()).low;
        assert_gt!(lords_balance_bank, 0, "RESOLVED_lords_balance_bank");
// println!("lords_balance_bank: {}", WEI(lords_balance_bank));
// println!("fame_supply: {}", WEI(sys.fame.total_supply()));

        // PoolType::FamePeg == bank balance
        let pool_peg_start: Pool = (sys.store).get_pool(PoolType::FamePeg);
        let rate_start: u128 = pool_peg_start.balance_fame / pool_peg_start.balance_lords;
        assert_gt!(pool_peg_start.balance_lords, 0, "RESOLVED_pool_peg.balance_lords > 0");
        assert_lt!(pool_peg_start.balance_lords, lords_balance_bank, "RESOLVED_pool_peg.balance_lords < bank");
        assert_gt!(pool_peg_start.balance_fame, 0, "RESOLVED_pool_peg.balance_fame > 0");
        // PoolType::Season() == zero
        let pool_season: Pool = (sys.store).get_pool(PoolType::Season(SEASON_ID_1));
        assert_eq!(pool_season.balance_lords, 0, "RESOLVED_pool_season.balance_lords");
        assert_eq!(pool_season.balance_fame, 0, "RESOLVED_pool_season.balance_fame");

        let rewards_a: RewardValues = (sys.game).calc_season_reward(SEASON_ID_1, duelist_id_a, challenge.lives_staked);
        let rewards_b: RewardValues = (sys.game).calc_season_reward(SEASON_ID_1, duelist_id_b, challenge.lives_staked);
        assert_ne!(rewards_a.fame_lost, 0, "RESOLVED_rewards_a.fame_lost != 0");
        assert_ne!(rewards_b.fame_lost, 0, "RESOLVED_rewards_b.fame_lost != 0");
        assert_ne!(rewards_a.fame_gained, 0, "RESOLVED_rewards_a.fame_gained != 0");
        assert_ne!(rewards_b.fame_gained, 0, "RESOLVED_rewards_b.fame_gained != 0");
        assert_ne!(rewards_a.fools_gained, 0, "RESOLVED_rewards_a.fools_gained != 0");
        assert_ne!(rewards_b.fools_gained, 0, "RESOLVED_rewards_b.fools_gained != 0");

        let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        let mut fools_balance_a: u128 = (sys.fools).balance_of(address_a).low;
        let mut fools_balance_b: u128 = (sys.fools).balance_of(address_b).low;
        assert_gt!(fame_balance_a, 0, "RESOLVED_fame_balance_a");
        assert_gt!(fame_balance_b, 0, "RESOLVED_fame_balance_b");
        assert_eq!(fools_balance_a, 0, "RESOLVED_fools_balance_a");
        assert_eq!(fools_balance_b, 0, "RESOLVED_fools_balance_b");

        // commit+reveal
        tester::execute_commit_moves(@sys, address_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys, address_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys, address_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys, address_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, _round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(challenge.winner, winner, "RESOLVED_challenge.winner");

        // Duelist A
        if (winner == 1) {
            let fame_gained: u128 = rewards_a.fame_gained;
            let fools_gained: u128 = rewards_a.fools_gained;
            fame_balance_a = tester::assert_fame_tokenbound_balance(@sys, duelist_id_a, fame_balance_a, 0, fame_gained, format!("RESOLVED_fame_balance_a_win [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(@sys, address_a, fools_balance_a, 0, fools_gained, format!("RESOLVED_fools_balance_a_win [{}:{}]", duel_id, duelist_id_a));
        } else {
            let fame_lost: u128 = rewards_a.fame_lost;
            fame_balance_a = tester::assert_fame_tokenbound_balance(@sys, duelist_id_a, fame_balance_a, fame_lost, 0, format!("RESOLVED_fame_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
            fools_balance_a = tester::assert_fools_balance(@sys, address_a, fools_balance_a, 0, 0, format!("RESOLVED_fools_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        }

        // Duelist B
        if (winner == 2) {
            let fame_gained: u128 = rewards_b.fame_gained;
            let fools_gained: u128 = rewards_b.fools_gained;
            fame_balance_b = tester::assert_fame_tokenbound_balance(@sys, duelist_id_b, fame_balance_b, 0, fame_gained, format!("RESOLVED_fame_balance_b_win [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(@sys, address_b, fools_balance_b, 0, fools_gained, format!("RESOLVED_fools_balance_b_win [{}:{}]", duel_id, duelist_id_b));
        } else {
            let fame_lost: u128 = rewards_b.fame_lost;
            fame_balance_b = tester::assert_fame_tokenbound_balance(@sys, duelist_id_b, fame_balance_b, fame_lost, 0, format!("RESOLVED_fame_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
            fools_balance_b = tester::assert_fools_balance(@sys, address_b, fools_balance_b, 0, 0, format!("RESOLVED_fools_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
        }

        // let lords_gained: u128 = MathU128::percentage(lords_balance_bank, 60);
        lords_balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), lords_balance_treasury, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));
        // lords_balance_treasury = tester::assert_lords_balance(@sys, TREASURY(), lords_balance_treasury, 0, lords_gained, format!("RESOLVED_lords_balance_treasury [{}]", duel_id));

        // PoolType::FamePeg decreased
        let pool_peg: Pool = (sys.store).get_pool(PoolType::FamePeg);
        assert_lt!(pool_peg.balance_lords, pool_peg_start.balance_lords, "RESOLVED_pool_peg.balance_lords END");
        assert_lt!(pool_peg.balance_fame, pool_peg_start.balance_fame, "RESOLVED_pool_peg.balance_fame END");

        // peg rates
        let rate: u128 = pool_peg_start.balance_fame / pool_peg_start.balance_lords;
        assert_eq!(rate, rate_start, "RESOLVED_rate_FAME_to_LORDS");

        // FAME >> PoolType::Season()
        let pool_season: Pool = (sys.store).get_pool(PoolType::Season(SEASON_ID_1));
        assert_gt!(pool_season.balance_lords, 0, "RESOLVED_pool_season.balance_lords END");
        assert_eq!(pool_season.balance_fame, 0, "RESOLVED_pool_season.balance_fame END");
    }


    //-----------------------------------------
    // Draw results
    //

    #[test]
    fn test_bank_resolved_draw_alive() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST |  FLAGS::FAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG | FLAGS::MATCHMAKER);
        tester::fund_duelists_pool(@sys, 4);
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _execute_bank_resolved(ref sys, OWNER(), OTHER(), 0);
        let order: Span<u128> = [
            ID(OWNER()), // fame 3000 - 1000 = 2000 / score 10
            ID(OTHER()), // fame 3000 - 1000 = 2000 / score 10
        ].span();
        _test_season_collect(@sys, order);
    }

    #[test]
    fn test_bank_resolved_draw_dead() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST |  FLAGS::FAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG | FLAGS::MATCHMAKER);
// tester::print_pools(@sys, 1, "INIT");
        let amount_sponsored: u128 = tester::fund_duelists_pool(@sys, 4);
        let bank_leftover: u128 = amount_sponsored - tester::purchase_share_peg_pool(@sys, amount_sponsored);
// tester::print_pools(@sys, 1, "FUNDED");
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duella));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duke));
        _airdrop_open(@sys, OTHER(), DuelistProfile::Genesis(GenesisKey::Duella));
// tester::print_pools(@sys, 1, "CLAIMED");
        _execute_bank_draw(ref sys, OWNER(), OTHER(), 3);
        assert!(!sys.duelists.is_alive(ID(OWNER())), "OWNER dead");
        assert!(!sys.duelists.is_alive(ID(OTHER())), "OTHER dead");
// tester::print_pools(@sys, 1, "DRAW_1");
        // transfer remaining duelists
        tester::execute_transfer_duelist(@sys.duelists, OWNER(), OWNER2(), ID(OWNER2()));
        tester::execute_transfer_duelist(@sys.duelists, OTHER(), OTHER2(), ID(OTHER2()));
        _execute_bank_draw(ref sys, OWNER2(), OTHER2(), 3);
        assert!(!sys.duelists.is_alive(ID(OWNER2())), "OWNER2 dead");
        assert!(!sys.duelists.is_alive(ID(OTHER2())), "OTHER2 dead");
// tester::print_pools(@sys, 1, "DRAW_2");
        let order: Span<u128> = [
            ID(OWNER()), // fame 3000 - 3000 = 0 / score 10
            ID(OTHER()), // fame 3000 - 3000 = 0 / score 10
            ID(OWNER2()), // fame 3000 - 3000 = 0 / score 10
            ID(OTHER2()), // fame 3000 - 3000 = 0 / score 10
        ].span();
        _test_season_collect(@sys, order);
tester::print_pools(@sys, 1, "COLLECTED");
        // players have LORDS
        // assert_gt!(sys.lords.balance_of(TREASURY()), 0, "TREASURY LORDS");
        assert_gt!(sys.lords.balance_of(OWNER()), 0, "END OWNER LORDS");
        assert_gt!(sys.lords.balance_of(OTHER()), 0, "END OTHER LORDS");
        assert_gt!(sys.lords.balance_of(OWNER2()), 0, "END OWNER2 LORDS");
        assert_gt!(sys.lords.balance_of(OTHER2()), 0, "END OTHER2 LORDS");
        // pools is zeroed
        let pool_peg: Pool = sys.store.get_pool(PoolType::FamePeg);
        assert_eq!(pool_peg.balance_lords, 0, "END PEGGED LORDS");
        assert_eq!(pool_peg.balance_fame, 0, "PEND EGGED FAME");
        let pool_season: Pool = sys.store.get_pool(PoolType::Season(SEASON_ID_1));
        assert_eq!(pool_season.balance_lords, 0, "END SEASON_ID_1 LORDS");
        assert_eq!(pool_season.balance_fame, 0, "END SEASON_ID_1 FAME");
        // Bank is zeroed
        assert_eq!(sys.lords.balance_of(sys.bank.contract_address), bank_leftover.into(), "END BANK LORDS");
        assert_eq!(sys.fame.balance_of(sys.bank.contract_address), 0, "END BANK FAME");
    }

    fn _execute_bank_draw(ref sys: TestSystems, address_a: ContractAddress, address_b: ContractAddress, lives: u8) {
        let (mocked, moves_a, moves_b): (Span<MockedValue>, PlayerMoves, PlayerMoves) = prefabs::get_moves_dual_crit();
        (sys.rng).mock_values(mocked);

// let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
// let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
// println!("fame_balance_a: {}", WEI(fame_balance_a));
// println!("fame_balance_b: {}", WEI(fame_balance_b));

        let duelist_id_a: u128 = ID(address_a);
        let duelist_id_b: u128 = ID(address_b);

        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, address_a, address_b, DuelType::Seasonal, lives);
        tester::make_challenge_ranked(ref sys, duel_id);

        let mut lords_balance_bank: u128 = (sys.lords).balance_of(sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (sys.lords).balance_of(TREASURY()).low;

        let pool_peg: Pool = (sys.store).get_pool(PoolType::FamePeg);
        let pool_season: Pool = (sys.store).get_pool(PoolType::Season(SEASON_ID_1));

        let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        let mut fools_balance_a: u128 = (sys.fools).balance_of(address_a).low;
        let mut fools_balance_b: u128 = (sys.fools).balance_of(address_b).low;

        let rewards_a: RewardValues = (sys.game).calc_season_reward(SEASON_ID_1, duelist_id_a, challenge.lives_staked);
        let rewards_b: RewardValues = (sys.game).calc_season_reward(SEASON_ID_1, duelist_id_b, challenge.lives_staked);
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
        if (lives == 3) {
            assert_eq!(rewards_a.survived, false, "DEATH_rewards_a.survived");
            assert_eq!(rewards_b.survived, false, "DEATH_rewards_b.survived");
        }

        // commit+reveal
        tester::execute_commit_moves(@sys, address_a, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys, address_b, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys, address_a, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys, address_b, duel_id, moves_b.salt, moves_b.moves);
        let (challenge, _round) = tester::get_Challenge_Round_value(@sys, duel_id);
        assert_eq!(challenge.winner, 0, "DEATH_challenge.winner");

        // both lost all FAME
        fame_balance_a = tester::assert_fame_tokenbound_balance(@sys, duelist_id_a, fame_balance_a, fame_balance_a, 0, format!("DEATH_fame_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        fame_balance_b = tester::assert_fame_tokenbound_balance(@sys, duelist_id_b, fame_balance_b, fame_balance_b, 0, format!("DEATH_fame_balance_b_lost [{}:{}]", duel_id, duelist_id_b));
        // FOOLS not changed
        fools_balance_a = tester::assert_fools_balance(@sys, address_a, fools_balance_a, 0, 0, format!("DEATH_fools_balance_a_lost [{}:{}]", duel_id, duelist_id_a));
        fools_balance_b = tester::assert_fools_balance(@sys, address_b, fools_balance_b, 0, 0, format!("DEATH_fools_balance_b_lost [{}:{}]", duel_id, duelist_id_b));

        // bank LORDS qual
        lords_balance_bank = tester::assert_lords_balance_equal(@sys, sys.bank.contract_address, lords_balance_bank, format!("DEATH_lords_balance_bank [{}]", duel_id));
        // treasury equal
        lords_balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), lords_balance_treasury, format!("DEATH_lords_balance_treasury [{}]", duel_id));

        // PoolType::FamePeg down
        tester::assert_balance_down((sys.store).get_pool(PoolType::FamePeg).balance_lords, pool_peg.balance_lords, format!("DEATH_pool_peg.balance_lords [{}]", duel_id));
        // PoolType::Season() up
        tester::assert_balance_up((sys.store).get_pool(PoolType::Season(SEASON_ID_1)).balance_lords, pool_season.balance_lords, format!("DEATH_pool_season.balance_fame [{}]", duel_id));
    }

    fn _test_season_collect(sys: @TestSystems, order: Span<u128>) {
        // get rid of FAUCET_AMOUNT to start with balance zero
        tester::impersonate(OWNER());
        (*sys.lords).transfer(RECIPIENT(), FAUCET_AMOUNT.into());
        tester::impersonate(OTHER());
        (*sys.lords).transfer(RECIPIENT(), FAUCET_AMOUNT.into());

        // these pools don't change
        let fame_supply: u128 = (*sys.fame).total_supply().low;
        let lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
        let pool_peg_start: Pool = (*sys.store).get_pool(PoolType::FamePeg);

        // only season pool is emptied
        let lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
        let pool_season: Pool = (*sys.store).get_pool(PoolType::Season(SEASON_ID_1));
        assert_gt!(pool_season.balance_lords, 0, "COLLECTED_pool_season.balance_lords BEFORE = 0");
        assert_eq!(pool_season.balance_fame, 0, "COLLECTED_pool_season.balance_fame BEFORE > 0");

        // validate leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), order.len(), "leaderboard_size");
        let mut i: usize = 0;
        while (i < order.len()) {
            let position: LeaderboardPosition = *positions[i];
// println!("leaderboard[{}] = {}", i, position.points);
            assert_eq!(position.duelist_id, *order[i], "leaderboard_position [{}]:[{}]", i, position.duelist_id, );
            let owner: ContractAddress = (*sys.duelists).owner_of(position.duelist_id.into());
            assert_eq!((*sys.lords).balance_of(owner), 0, "leaderboard_balance of [{}]:[{}] == 0", i, position.duelist_id);
            i += 1;
        };

        // collect season
        let season: SeasonConfig = (*sys.store).get_current_season();
        tester::set_block_timestamp(season.period.end);
        tester::execute_collect_season(sys, OWNER());

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

        // pools that do not change
        assert_eq!((*sys.fame).total_supply().low, fame_supply, "COLLECTED_fame_supply");
        tester::assert_lords_balance_equal(sys, TREASURY(), lords_balance_treasury, format!("COLLECTED_lords_balance_treasury"));
        let pool_peg: Pool = (*sys.store).get_pool(PoolType::FamePeg);
        assert_eq!(pool_peg.balance_lords, pool_peg_start.balance_lords, "COLLECTED_pool_peg.balance_lords AFTER");
        assert_eq!(pool_peg.balance_fame, pool_peg_start.balance_fame, "COLLECTED_pool_peg.balance_fame AFTER");

        // bank LORDS down by SUM
        tester::assert_lords_balance(sys, *sys.bank.contract_address, lords_balance_bank, sum_balances, 0, format!("COLLECTED_lords_balance_bank"));

        // PoolType::Season() ZEROEDs
        let pool_season: Pool = (*sys.store).get_pool(PoolType::Season(SEASON_ID_1));
        assert_eq!(pool_season.balance_lords, 0, "COLLECTED_pool_season.balance_lords AFTER = 0");
        assert_eq!(pool_season.balance_fame, 0, "COLLECTED_pool_season.balance_fame AFTER = 0");
    }


    //-----------------------------------------
    // Bank / Peg pools
    //
    #[test]
    fn test_bank_peg_pool() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::ADMIN);

        let bank_address: ContractAddress = sys.bank.contract_address;
        let price_single: u128 = *PackType::SingleDuelist.descriptor().price_lords;
        let price_pack: u128 = *PackType::GenesisDuelists5x.descriptor().price_lords;
        let share_peg_single: u128 = tester::purchase_share_peg_pool(@sys, price_single);
        let share_peg_pack: u128 = tester::purchase_share_peg_pool(@sys, price_pack);
        let share_fees_pack: u128 = tester::purchase_share_fees(@sys, price_pack);
        let share_pack: u128 = tester::purchase_share_pools(@sys, price_pack);
        assert_ne!(price_pack, 0, "prices");
        assert_ne!(price_single, 0, "prices");
        assert_ne!(share_peg_single, 0, "prices");
        assert_ne!(share_peg_pack, 0, "prices");
        assert_ne!(share_pack, 0, "prices");
        assert_lt!(share_peg_single, price_single, "prices");
        assert_lt!(share_peg_pack, price_pack, "prices");
        assert_lt!(share_pack, price_pack, "prices");

        // initial balances
        let mut fame_supply: u128 = sys.fame.total_supply().low;
        let mut balance_treasury: u128 = sys.lords.balance_of(TREASURY()).low;
        let mut balance_realms: u128 = sys.lords.balance_of(REALMS()).low;
        let mut balance_bank: u128 = sys.lords.balance_of(bank_address).low;
        let mut pool_claimable: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let mut pool_purchases: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let mut pool_peg_lords: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        let mut pool_peg_fame: u128 = sys.store.get_pool(PoolType::FamePeg).balance_fame;
        assert_eq!(fame_supply, 0, "INIT");
        assert_eq!(balance_treasury, 0, "INIT");
        assert_eq!(balance_realms, 0, "INIT");
        assert_eq!(balance_bank, 0, "INIT");
        assert_eq!(pool_purchases, 0, "INIT");
        assert_eq!(pool_peg_lords, 0, "INIT");
        assert_eq!(pool_peg_fame, 0, "INIT");

        // starter packs have no value
        tester::execute_claim_starter_pack(@sys, OWNER());
        fame_supply = tester::assert_balance(sys.fame.total_supply().low, fame_supply, 0, FAME::MINT_GRANT_AMOUNT * 2, "fame_supply STARTER");
        balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), balance_treasury, "balance_treasury STARTER");
        balance_realms = tester::assert_lords_balance_equal(@sys, REALMS(), balance_realms, "balance_realms STARTER");
        balance_bank = tester::assert_lords_balance_equal(@sys, bank_address, balance_bank, "balance_bank STARTER");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, 0, 0, "pool_claimable STARTER");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, 0, 0, "pool_purchases STARTER");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, 0, "pool_peg_lords STARTER");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, 0, "pool_peg_fame STARTER");

        // fund PoolType::Claimable
        tester::fund_duelists_pool(@sys, 1);
        fame_supply = tester::assert_balance(sys.fame.total_supply().low, fame_supply, 0, 0, "fame_supply FUND");
        balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), balance_treasury, "balance_treasury FUND");
        balance_realms = tester::assert_lords_balance_equal(@sys, REALMS(), balance_realms, "balance_realms FUND");
        balance_bank = tester::assert_lords_balance(@sys, bank_address, balance_bank, 0, price_single, "balance_bank FUND");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, 0, price_single, "pool_claimable FUND");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, 0, 0, "pool_purchases FUND");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, 0, "pool_peg_lords FUND");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, 0, "pool_peg_fame FUND");

        // airdrop duelists -- transfered to PoolType::FamePeg
        _airdrop_open(@sys, OWNER(), DuelistProfile::Genesis(GenesisKey::Duke));
// tester::print_pools(@sys, 1, "AIRDROPPED");
        fame_supply = tester::assert_balance(sys.fame.total_supply().low, fame_supply, 0, FAME::MINT_GRANT_AMOUNT, "fame_supply CLAIM");
        balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), balance_treasury, "balance_treasury CLAIM");
        balance_realms = tester::assert_lords_balance_equal(@sys, REALMS(), balance_realms, "balance_realms CLAIM");
        balance_bank = tester::assert_lords_balance(@sys, bank_address, balance_bank, 0, 0, "balance_bank CLAIM");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, share_peg_single, 0, "pool_claimable CLAIM");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, 0, 0, "pool_purchases CLAIM");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, share_peg_single, "pool_peg_lords CLAIM");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, FAME::MINT_GRANT_AMOUNT, "pool_peg_fame CLAIM");

        // purchase to PoolType::Purchases
        let pack_id: u128 = tester::execute_pack_purchase(@sys, OWNER(), PackType::GenesisDuelists5x);
// tester::print_pools(@sys, 1, "PURCHASED");
        fame_supply = tester::assert_balance(sys.fame.total_supply().low, fame_supply, 0, 0, "fame_supply PURCHASE");
        balance_treasury = tester::assert_lords_balance_up(@sys, TREASURY(), balance_treasury, "balance_treasury PURCHASE");
        balance_realms = tester::assert_lords_balance_up(@sys, REALMS(), balance_realms, "balance_realms PURCHASE");
        balance_bank = tester::assert_lords_balance(@sys, bank_address, balance_bank, 0, share_pack, "balance_bank PURCHASE");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, 0, share_fees_pack, "pool_claimable PURCHASE");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, 0, share_peg_pack, "pool_purchases PURCHASE");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, 0, "pool_peg_lords PURCHASE");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, 0, "pool_peg_fame PURCHASE");

        // open pack
        tester::execute_pack_open(@sys, OWNER(), pack_id);
// tester::print_pools(@sys, 1, "OPENED");
        fame_supply = tester::assert_balance(sys.fame.total_supply().low, fame_supply, 0, FAME::MINT_GRANT_AMOUNT * 5, "fame_supply OPEN");
        balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), balance_treasury, "balance_treasury OPEN");
        balance_realms = tester::assert_lords_balance_equal(@sys, REALMS(), balance_realms, "balance_realms OPEN");
        balance_bank = tester::assert_lords_balance(@sys, bank_address, balance_bank, 0, 0, "balance_bank OPEN");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, 0, 0, "pool_claimable OPEN");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, share_peg_pack, 0, "pool_purchases OPEN");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, share_peg_pack, "pool_peg_lords OPEN");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, FAME::MINT_GRANT_AMOUNT * 5, "pool_peg_fame OPEN");

        // sponsor
        tester::execute_sponsor_duelists(@sys, OWNER(), price_single);
// tester::print_pools(@sys, 1, "SPONSORED");
        balance_treasury = tester::assert_lords_balance_equal(@sys, TREASURY(), balance_treasury, "balance_treasury SPONSORED");
        balance_realms = tester::assert_lords_balance_equal(@sys, REALMS(), balance_realms, "balance_realms SPONSORED");
        balance_bank = tester::assert_lords_balance(@sys, bank_address, balance_bank, 0, price_single, "balance_bank SPONSORED");
        pool_claimable = tester::assert_balance(sys.store.get_pool(PoolType::Claimable).balance_lords, pool_claimable, 0, price_single, "pool_claimable SPONSORED");
        pool_purchases = tester::assert_balance(sys.store.get_pool(PoolType::Purchases).balance_lords, pool_purchases, 0, 0, "pool_purchases SPONSORED");
        pool_peg_lords = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_lords, pool_peg_lords, 0, 0, "pool_peg_lords SPONSORED");
        pool_peg_fame = tester::assert_balance(sys.store.get_pool(PoolType::FamePeg).balance_fame, pool_peg_fame, 0, 0, "pool_peg_fame SPONSORED");

        // final balances
// tester::print_pools(@sys, 1, "FINAL");
        let fame_supply: u128 = sys.fame.total_supply().low;
        let balance_bank: u128 = sys.lords.balance_of(bank_address).low;
        let pool_claimable: u128 = sys.store.get_pool(PoolType::Claimable).balance_lords;
        let pool_purchases: u128 = sys.store.get_pool(PoolType::Purchases).balance_lords;
        let pool_peg_lords: u128 = sys.store.get_pool(PoolType::FamePeg).balance_lords;
        let pool_peg_fame: u128 = sys.store.get_pool(PoolType::FamePeg).balance_fame;
        let pool_season: u128 = sys.store.get_pool(PoolType::Season(SEASON_ID_1)).balance_lords;
        assert_eq!(fame_supply, (FAME::MINT_GRANT_AMOUNT * 8), "fame_supply END");
        assert_eq!(balance_bank, (price_single + share_pack + price_single), "balance_bank END");
        assert_eq!(pool_claimable, (price_single - share_peg_single + share_fees_pack + price_single), "pool_claimable END");
        assert_eq!(pool_purchases, 0, "pool_purchases END");
        assert_eq!(pool_peg_lords, (share_peg_single + share_peg_pack), "pool_peg_lords END");
        assert_eq!(pool_peg_fame, (FAME::MINT_GRANT_AMOUNT * 6), "pool_peg_fame END");
        assert_eq!(pool_season, 0, "pool_season END");
        // assert_eq!(pool_peg_fame, 0, "pool_peg_fame END");
    }


    //--------------------------------
    // fame peg
    //

    #[test]
    fn test_fame_peg_starter_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MATCHMAKER | FLAGS::ADMIN | FLAGS::MOCK_RNG | FLAGS::GAME | FLAGS::DUELIST);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let ID_A: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let ID_B: u128 = _airdrop_open(@sys, B, DuelistProfile::Genesis(GenesisKey::Duke));
        //
        // remember peg balance
        let pool_peg_start: Pool = sys.store.get_pool(PoolType::FamePeg);
        assert_gt!(pool_peg_start.balance_lords, 0, "pool_peg_lords INIT");
        assert_gt!(pool_peg_start.balance_fame, 0, "pool_peg_fame INIT");
        //
        // duel...
        let duel_id: u128 = tester::execute_create_duel_ID(@sys, A, ID_A, B, "yo", DuelType::Seasonal, 48, 1);
        tester::execute_reply_duel(@sys, B, ID_B, duel_id, true);
        let (mocked, moves_a, moves_b): (Span<MockedValue>, PlayerMoves, PlayerMoves) = prefabs::get_moves_dual_crit();
        (sys.rng).mock_values(mocked);
        tester::execute_commit_moves(@sys, A, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys, B, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys, A, duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys, B, duel_id, moves_b.salt, moves_b.moves);
        let ch: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(ch.state, ChallengeState::Draw);
        //
        // check peg > One life only (B), not A, which is starter pack
        let pool_peg_end: Pool = sys.store.get_pool(PoolType::FamePeg);
        tester::assert_balance_down(pool_peg_end.balance_lords, pool_peg_start.balance_lords, "pool_peg_lords END");
        tester::assert_balance(pool_peg_end.balance_fame, pool_peg_start.balance_fame, FAME::ONE_LIFE, 0, "pool_peg_fame END");
    }

    
    //-----------------------------------------
    // sponsoring
    //
    
    #[test]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_duelists_zero_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        sys.bank.sponsor_duelists(OWNER(), amount);
    }
    #[test]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_duelists_insufficient_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, amount);
        sys.bank.sponsor_duelists(OWNER(), amount + 1);
    }

    #[test]
    fn test_sponsor_season() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);

        // initial balances
        let balance_bank: u128 = sys.lords.balance_of(sys.bank.contract_address).low;
        let pool_type: PoolType = PoolType::Season(SEASON_ID_1);
        let pool: Pool = sys.store.get_pool(pool_type);
        assert_eq!(balance_bank, 0, "balance_bank INIT");
        assert_eq!(pool.balance_lords, 0, "pool INIT lords");
        assert_eq!(pool.balance_fame, 0, "pool INIT fame");

        // sponsor...
        let amount: u128 = 1_000;
        tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, amount);
        sys.bank.sponsor_season(OWNER(), amount);

        // balances
        let pool_sponsored: Pool = sys.store.get_pool(pool_type);
        tester::assert_balance(sys.lords.balance_of(sys.bank.contract_address).low, balance_bank, 0, amount, "balance_bank AFTER");
        tester::assert_balance(pool_sponsored.balance_lords, pool.balance_lords, 0, amount, "pool.balance_lords AFTER");
        tester::assert_balance_equal(pool_sponsored.balance_fame, pool.balance_fame, "pool.balance_fame AFTER");
    }
    #[test]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_season_zero_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        sys.bank.sponsor_season(OWNER(), amount);
    }
    #[test]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_season_insufficient_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, amount);
        sys.bank.sponsor_season(OWNER(), amount + 1);
    }

    #[test]
    #[ignore]
    fn test_sponsor_tournament() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);

        // initial balances
        let balance_bank: u128 = sys.lords.balance_of(sys.bank.contract_address).low;
        let pool_type: PoolType = PoolType::Tournament(TOURNAMENT_ID);
        let pool: Pool = sys.store.get_pool(pool_type);
        assert_eq!(balance_bank, 0, "balance_bank INIT");
        assert_eq!(pool.balance_lords, 0, "pool INIT lords");
        assert_eq!(pool.balance_fame, 0, "pool INIT fame");

        // sponsor...
        let amount: u128 = 1_000;
        tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, amount);
        sys.bank.sponsor_tournament(OWNER(), amount, TOURNAMENT_ID);

        // balances
        let pool_sponsored: Pool = sys.store.get_pool(pool_type);
        tester::assert_balance(sys.lords.balance_of(sys.bank.contract_address).low, balance_bank, 0, amount, "balance_bank AFTER");
        tester::assert_balance(pool_sponsored.balance_lords, pool.balance_lords, 0, amount, "pool.balance_lords AFTER");
        tester::assert_balance_equal(pool_sponsored.balance_fame, pool.balance_fame, "pool.balance_fame AFTER");
    }
    #[test]
    #[ignore]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_tournament_zero_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        sys.bank.sponsor_tournament(OWNER(), amount, TOURNAMENT_ID);
    }
    #[test]
    #[ignore]
    #[should_panic(expected:('IERC20: insufficient allowance', 'ENTRYPOINT_FAILED'))]
    fn test_sponsor_tournament_insufficient_allowance() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::FAME | FLAGS::LORDS);
        let amount: u128 = 1_000;
        tester::execute_lords_approve(@sys.lords, OWNER(), sys.bank.contract_address, amount);
        sys.bank.sponsor_tournament(OWNER(), amount + 1, TOURNAMENT_ID);
    }



    // fn sponsor_duelists(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // fn sponsor_season(ref self: TState, payer: ContractAddress, lords_amount: u128);
    // fn sponsor_tournament(ref self: TState, payer: ContractAddress, lords_amount: u128, tournament_id: u64);

}
