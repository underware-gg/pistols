#[cfg(test)]
pub mod tests {
    use starknet::{ContractAddress};

    use pistols::models::{
        challenge::{ChallengeTrait, ChallengeValue, RoundValue, DuelType, MovesTrait},
        duelist::{Totals, TotalsTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        season::{SeasonScoreboard},
        player::{PlayerDuelistStack},
    };
    use pistols::types::{
        cards::hand::{PacesCard, BladesCard, FinalBlow, DeckType},
        challenge_state::{ChallengeState},
        duel_progress::{DuelProgress, DuelStep},
        round_state::{RoundState},
        constants::{CONST},
    };
    use pistols::utils::arrays::{SpanUtilsTrait};
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            IDuelTokenDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            IFoolsCoinDispatcherTrait,
            // IFameCoinDispatcherTrait,
            ID, OWNER, OTHER, BUMMER, FAKE_OWNER_OF_1,
            _assert_is_alive, _assert_is_dead,
            SEASON_ID_1, MESSAGE,
            Trophy,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            PlayerMoves, PlayerMovesTrait,
            SALT_A, SALT_B, ENV_CARD_NEUTRAL, ENV_CARD_CRIT,
        },
    };
    use pistols::systems::rng_mock::{
        IRngMockDispatcherTrait,
        MockedValue, MockedValueTrait,
    };

    const MAX_LIVES: u8 = 3;
    const WIN_1: u8 = 1;
    const WIN_2: u8 = 2;


    //-----------------------------------------
    // Single Round Draw (paces only)
    //

    fn _assert_duel_progress(sys: @TestSystems, duel_id: u128, moves_a: Span<u8>, moves_b: Span<u8>) {
        let challenge: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let round: RoundValue = (*sys.store).get_round_value(duel_id);
        let progress: DuelProgress = (*sys.game).get_duel_progress(duel_id);
        let final_step: DuelStep = *progress.steps[progress.steps.len() - 1];
        assert_eq!(progress.winner, challenge.winner, "winner");
        // hand_a
        assert_eq!(progress.hand_a.card_fire.into(), moves_a.value_or_zero(0), "moves_a_0");
        assert_eq!(progress.hand_a.card_dodge.into(), moves_a.value_or_zero(1), "moves_a_1");
        assert_eq!(progress.hand_a.card_tactics.into(), moves_a.value_or_zero(2), "moves_a_2");
        assert_eq!(progress.hand_a.card_blades.into(), moves_a.value_or_zero(3), "moves_a_3");
        assert_eq!(progress.hand_a.card_fire, round.moves_a.card_1.into(), "hand_a.card_fire");
        assert_eq!(progress.hand_a.card_dodge, round.moves_a.card_2.into(), "hand_a.card_fire");
        assert_eq!(progress.hand_a.card_tactics, round.moves_a.card_3.into(), "hand_a.card_fire");
        assert_eq!(progress.hand_a.card_blades, round.moves_a.card_4.into(), "hand_a.card_fire");
        // hand_b
        assert_eq!(progress.hand_b.card_fire.into(), moves_b.value_or_zero(0), "moves_b_0");
        assert_eq!(progress.hand_b.card_dodge.into(), moves_b.value_or_zero(1), "moves_b_1");
        assert_eq!(progress.hand_b.card_tactics.into(), moves_b.value_or_zero(2), "moves_b_2");
        assert_eq!(progress.hand_b.card_blades.into(), moves_b.value_or_zero(3), "moves_b_3");
        assert_eq!(progress.hand_b.card_fire, round.moves_b.card_1.into(), "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_dodge, round.moves_b.card_2.into(), "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_tactics, round.moves_b.card_3.into(), "hand_b.card_fire");
        assert_eq!(progress.hand_b.card_blades, round.moves_b.card_4.into(), "hand_b.card_fire");
        // state_a
        assert_eq!(final_step.state_a.health, round.state_a.health, "state_final_a.health");
        assert_eq!(final_step.state_a.damage, round.state_a.damage, "state_final_a.damage");
        assert_eq!(final_step.state_a.chances, round.state_a.chances, "state_final_a.chances");
        assert_eq!(final_step.state_a.dice_fire, round.state_a.dice_fire, "state_final_a.dice_fire");
        // state_b
        assert_eq!(final_step.state_b.health, round.state_b.health, "state_final_b.health");
        assert_eq!(final_step.state_b.damage, round.state_b.damage, "state_final_b.damage");
        assert_eq!(final_step.state_b.chances, round.state_b.chances, "state_final_b.chances");
        assert_eq!(final_step.state_b.dice_fire, round.state_b.dice_fire, "state_final_b.dice_fire");
    }

    fn _assert_player_totals(sys: @TestSystems, address: ContractAddress, duelist_totals: @Totals, prefix: ByteArray) {
        let player_totals: Totals = (*sys.store).get_player_totals(address);
        assert_eq!(player_totals.total_duels, *duelist_totals.total_duels, "[{}] player_totals.total_duels", prefix);
        assert_eq!(player_totals.total_wins, *duelist_totals.total_wins, "[{}] player_totals.total_wins", prefix);
        assert_eq!(player_totals.total_losses, *duelist_totals.total_losses, "[{}] player_totals.total_losses", prefix);
        assert_eq!(player_totals.total_draws, *duelist_totals.total_draws, "[{}] player_totals.total_draws", prefix);
        assert_eq!(player_totals.honour, *duelist_totals.honour, "[{}] player_totals.honour", prefix);
    }

    fn _test_resolved_draw(mocked: Span<MockedValue>, moves_a: PlayerMoves, moves_b: PlayerMoves, final_health: u8) -> TestSystems {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.mock_values(mocked);

        tester::fund_duelists_pool(@sys, 2);
        let duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];

        let season_id: u32 = SEASON_ID_1;

        let fame_balance_a_init: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let fame_balance_b_init: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        let fools_balance_a_init: u128 = sys.fools.balance_of(OWNER()).low;
        let fools_balance_b_init: u128 = sys.fools.balance_of(OTHER()).low;
        let timestamp_active_a: u64 = sys.store.get_duelist_timestamps(ID(OWNER())).active;
        let timestamp_active_b: u64 = sys.store.get_duelist_timestamps(ID(OTHER())).active;
        assert_gt!(fame_balance_a_init, 0, "fame_balance_a_init");
        assert_gt!(fame_balance_b_init, 0, "fame_balance_b_init");
        assert_eq!(fools_balance_a_init, 0, "fools_balance_a_init");
        assert_eq!(fools_balance_b_init, 0, "fools_balance_b_init");
        assert_eq!(timestamp_active_a, 0, "timestamp_active_a");
        assert_eq!(timestamp_active_b, 0, "timestamp_active_b");

        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_eq!(sys.store.get_challenge(duel_id).get_deck_type(), DeckType::Classic, "challenge.deck_type");
        tester::assert_pact(@sys, duel_id, challenge, true, true, "started");
        let timestamp_active_a: u64 = sys.store.get_duelist_timestamps(ID(OWNER())).active;
        let timestamp_active_b: u64 = sys.store.get_duelist_timestamps(ID(OTHER())).active;
        assert_gt!(timestamp_active_a, 0, "timestamp_active_a");
        assert_gt!(timestamp_active_b, 0, "timestamp_active_b");

        // duel nft owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of");

        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::drop_dojo_events(@sys);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        tester::assert_pact(@sys, duel_id, challenge, false, false, "ended");
// challenge.winner.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.winner, 0, "challenge.winner");
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "challenge_season_id");
        assert_eq!(round.state, RoundState::Finished, "round.state");
        assert_eq!(round.state_a.health, final_health, "round.moves_a.health");
        assert_eq!(round.state_b.health, final_health, "round.moves_b.health");
        let final_blow: PacesCard = core::cmp::max(*moves_a.moves[0], *moves_b.moves[0]).into();
        assert_eq!(round.final_blow, FinalBlow::Paces(final_blow), "round.final_blow");
        if (final_health == 0) {
            _assert_is_dead(round.state_a, "dead_a");
            _assert_is_dead(round.state_b, "dead_b");
        } else {
            _assert_is_alive(round.state_a, "alive_a");
            _assert_is_alive(round.state_b, "alive_b");
        }

        let totals_a: Totals = sys.store.get_duelist_totals(ID(OWNER()).into());
        let totals_b: Totals = sys.store.get_duelist_totals(ID(OTHER()).into());
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OWNER()).into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OTHER()).into());
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels");
        assert_eq!(totals_a.total_draws, 1, "totals_a.total_draws");
        assert_eq!(totals_b.total_draws, 1, "totals_b.total_draws");
        assert_eq!(totals_a.total_wins, 0, "totals_a.total_wins");
        assert_eq!(totals_b.total_wins, 0, "totals_b.total_wins");
        assert_eq!(totals_a.total_losses, 0, "totals_a.total_losses");
        assert_eq!(totals_b.total_losses, 0, "totals_b.total_losses");
        _assert_player_totals(@sys, OWNER(), @totals_a, "A");
        _assert_player_totals(@sys, OTHER(), @totals_b, "B");

        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "totals_a.honour");
        assert_eq!(round.state_a.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "totals_b.honour");
        assert_eq!(totals_a.honour, round.state_a.honour, "totals_a.honour");
        assert_eq!(totals_b.honour, round.state_b.honour, "totals_b.honour");

        let leaderboard: Leaderboard = sys.store.get_leaderboard(season_id);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 2, "leaderboard_positions.len");
        assert_eq!(*positions[0].duelist_id, ID(OWNER()).into(), "draw_leaderboards[0].pos");
        assert_eq!(*positions[1].duelist_id, ID(OTHER()).into(), "draw_leaderboards[1].pos");
        assert_gt!(*positions[0].points, 0, "draw_leaderboards[0].points");
        assert_gt!(*positions[1].points, 0, "draw_leaderboards[1].points");
        assert_eq!(*positions[0].points, score_a.points, "score_a.points");
        assert_eq!(*positions[1].points, score_b.points, "score_b.points");

        // duel nft still owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of_END");

        let fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        let fools_balance_a: u128 = sys.fools.balance_of(OWNER()).low;
        let fools_balance_b: u128 = sys.fools.balance_of(OTHER()).low;
        assert_lt!(fame_balance_a, fame_balance_a_init, "fame_balance_a_final");
        assert_lt!(fame_balance_b, fame_balance_b_init, "fame_balance_b_final");
        assert_eq!(fools_balance_a, 0, "fools_balance_a_final");
        assert_eq!(fools_balance_b, 0, "fools_balance_b_final");

        _assert_duel_progress(@sys, duel_id, moves_a.moves, moves_b.moves);
        
        (sys)
    }

    #[test]
    fn test_resolved_draw_miss() {
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        let sys: TestSystems = _test_resolved_draw(mocked, moves_a, moves_b, CONST::FULL_HEALTH);
        tester::assert_event_trophy(@sys, Trophy::Blindfold, OTHER());
        // tester::assert_event_trophy(@sys, Trophy::Blindfold, OWNER());
    }

    #[test]
    fn test_resolved_draw_crit() {
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        let sys: TestSystems = _test_resolved_draw(mocked, moves_a, moves_b, 0);
        tester::assert_event_trophy(@sys, Trophy::BloodBath, OTHER());
        // tester::assert_event_trophy(@sys, Trophy::BloodBath, OWNER());
    }

    
    //-----------------------------------------
    // Single Round Resolved (paces only)
    //

    fn _test_resolved_win(mocked: Span<MockedValue>, moves_a: PlayerMoves, moves_b: PlayerMoves, winner: u8) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.mock_values(mocked);

        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];

        let season_id: u32 = SEASON_ID_1;

        let (challenge, round_1, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_eq!(sys.store.get_challenge(duel_id).get_deck_type(), DeckType::Classic, "challenge.deck_type");
        tester::assert_pact(@sys, duel_id, challenge, true, true, "started");

        // duel owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of");

        // assert(round_1.moves_a.seed != 0, 'round_1.moves_a.seed');
        // assert(round_1.moves_b.seed != 0, 'round_1.moves_b.seed');
        // assert(round_1.moves_a.seed != round_1.moves_b.seed, 'round_1.moves_a.seed != moves_b');

        // 1st commit
        assert_gt!(round_1.moves_a.timeout, 0, "1__timeout_commit_a");
        assert_gt!(round_1.moves_b.timeout, 0, "1__timeout_commit_b");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        let (_challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(round.state, RoundState::Commit, "1__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "1__hash");
        assert_eq!(round.moves_a.timeout, 0, "1__timeout_commit_reset_a");

        // 2nd commit > Reveal
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        let (_challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(round.state, RoundState::Reveal, "2__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "21__hash");
        assert_eq!(round.moves_b.hashed, moves_b.hashed, "2__hash");
        // new timeouts...
        assert_gt!(round_1.moves_a.timeout, 0, "2__timeout_reveal_a");
        assert_gt!(round_1.moves_b.timeout, 0, "2__timeout_reveal_b");

        // 1st reveal
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        let (_challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(round.state, RoundState::Reveal, "3__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "3__hash");
        assert_eq!(round.moves_a.salt, moves_a.salt, "3__salt");
        assert_eq!(round.moves_a.card_1, *moves_a.moves[0], "3__card_fire");
        assert_eq!(round.moves_a.card_2, *moves_a.moves[1], "3__card_dodge");
        assert_eq!(round.moves_a.timeout, 0, "3__timeout_reveal_reset_a");

        // 2nd reveal > Finished
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        tester::assert_pact(@sys, duel_id, challenge, false, false, "ended");
// challenge.winner.print();
// // challenge.state.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert_eq!(challenge.state, ChallengeState::Resolved, "4_challenge.state");
        assert_ne!(challenge.winner, 0, "4_challenge.winner");
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "challenge_season_id");
        assert_gt!(challenge.timestamps.end, 0, "4_challenge.timestamps.end");
        assert_eq!(round.state, RoundState::Finished, "4__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "43__hash");
        assert_eq!(round.moves_a.salt, moves_a.salt, "43__salt");
        assert_eq!(round.moves_a.card_1.into(), *moves_a.moves[0], "43__card_fire");
        assert_eq!(round.moves_a.card_2.into(), *moves_a.moves[1], "43__card_dodge");
        assert_eq!(round.moves_b.hashed, moves_b.hashed, "4__hash");
        assert_eq!(round.moves_b.salt, moves_b.salt, "4__salt");
        assert_eq!(round.moves_b.card_1.into(), *moves_b.moves[0], "4__card_fire");
        assert_eq!(round.moves_b.card_2.into(), *moves_b.moves[1], "4__card_dodge");
        assert_eq!(round.moves_a.timeout, 0, "4__timeout_ended_a");
        assert_eq!(round.moves_b.timeout, 0, "4__timeout_ended_b");
        let final_blow: PacesCard = (if(winner == 1){*moves_a.moves[0]}else{*moves_b.moves[0]}.into());
        assert_eq!(round.final_blow, FinalBlow::Paces(final_blow), "round.final_blow");

        let totals_a_1: Totals = sys.store.get_duelist_totals(ID(OWNER()).into());
        let totals_b_1: Totals = sys.store.get_duelist_totals(ID(OTHER()).into());
        assert_eq!(totals_a_1.total_duels, 1, "totals_a_1.total_duels");
        assert_eq!(totals_b_1.total_duels, 1, "totals_b_1.total_duels");
        assert_eq!(totals_a_1.total_draws, 0, "totals_a_1.total_draws");
        assert_eq!(totals_b_1.total_draws, 0, "totals_b_1.total_draws");
        _assert_player_totals(@sys, OWNER(), @totals_a_1, "A_1");
        _assert_player_totals(@sys, OTHER(), @totals_b_1, "B_1");

        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "round.state_a.honour");
        assert_eq!(round.state_b.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "round.state_b.honour");
        assert_eq!(totals_a_1.honour, round.state_a.honour, "totals_a_1.honour");
        assert_eq!(totals_b_1.honour, round.state_b.honour, "totals_b_1.honour");

        let leaderboard_1: Leaderboard = sys.store.get_leaderboard(season_id);
        let positions_1: Span<LeaderboardPosition> = leaderboard_1.get_all_positions();
        assert_eq!(positions_1.len(), 2, "leaderboard_positions.len");
        assert_gt!(*positions_1[0].points, 0, "leaderboard_1[0].points");
        assert_gt!(*positions_1[1].points, 0, "leaderboard_1[1].points");

        let score_a_1: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OWNER()).into());
        let score_b_1: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OTHER()).into());

        assert_eq!(challenge.winner, winner, "winner");
        if (winner == 1) {
            assert_eq!(totals_a_1.total_wins, 1, "a_win_duelist_a.total_wins");
            assert_eq!(totals_b_1.total_wins, 0, "a_win_duelist_b.total_wins");
            assert_eq!(totals_a_1.total_losses, 0, "a_win_duelist_a.total_losses");
            assert_eq!(totals_b_1.total_losses, 1, "a_win_duelist_b.total_losses");
            assert_eq!(round.state_a.damage, CONST::FULL_HEALTH, "a_win_damage_a");
            assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "a_win_health_a");
            assert_eq!(round.state_b.health, 0, "a_win_health_b");
            assert_eq!(*positions_1[0].duelist_id, ID(OWNER()).into(), "a_win_leaderboards[0].pos");
            assert_eq!(*positions_1[1].duelist_id, ID(OTHER()).into(), "a_win_leaderboards[1].pos");
            assert_eq!(*positions_1[0].points, score_a_1.points, "score_a_1.points");
            assert_eq!(*positions_1[1].points, score_b_1.points, "score_b_1.points");
            _assert_is_alive(round.state_a, "alive_a");
            _assert_is_dead(round.state_b, "dead_b");
            assert_eq!(sys.duels.owner_of(duel_id.into()), challenge.address_a, "duels.owner_of_END_1");
        } else if (winner == 2) {
            assert_eq!(totals_a_1.total_wins, 0, "b_win_duelist_a.total_wins");
            assert_eq!(totals_b_1.total_wins, 1, "b_win_duelist_b.total_wins");
            assert_eq!(totals_a_1.total_losses, 1, "b_win_duelist_a.total_losses");
            assert_eq!(totals_b_1.total_losses, 0, "b_win_duelist_b.total_losses");
            assert_eq!(round.state_b.damage, CONST::FULL_HEALTH, "b_win_damage_b");
            assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "b_win_health_b");
            assert_eq!(round.state_a.health, 0, "b_win_health_a");
            assert_eq!(*positions_1[0].duelist_id, ID(OTHER()).into(), "b_win_leaderboards[0].pos");
            assert_eq!(*positions_1[1].duelist_id, ID(OWNER()).into(), "b_win_leaderboards[1].pos");
            assert_eq!(*positions_1[0].points, score_b_1.points, "score_b_1.points");
            assert_eq!(*positions_1[1].points, score_a_1.points, "score_a_1.points");
            _assert_is_alive(round.state_b, "alive_b");
            _assert_is_dead(round.state_a, "dead_a");
            assert_eq!(sys.duels.owner_of(duel_id.into()), challenge.address_b, "duels.owner_of_END_1");
        } else {
            assert!(false, "bad winner");
        }

        //
        // Run same challenge again!!!!
        // (to compute totals and scores)
        //

        let (_challenge, round_2, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::assert_pact(@sys, duel_id, challenge, true, true, "started_2");
        // assert(round_2.moves_a.seed != 0, "round_2.moves_a.seed");
        // assert(round_2.moves_b.seed != 0, "round_2.moves_b.seed");
        // assert(round_2.moves_a.seed != round_2.moves_b.seed, "round_2.moves_a.seed != moves_b");
        // assert(round_2.moves_a.seed != round_1.moves_a.seed, "round_2.moves_a.seed != round_1");
        // assert(round_2.moves_b.seed != round_1.moves_b.seed, "round_2.moves_b.seed != round_1");
        assert_gt!(round_2.moves_a.timeout, 0, "++ timeout_commit_a");
        assert_gt!(round_2.moves_b.timeout, 0, "++ timeout_commit_b");
        // invert player order just for fun, expect same results!
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round.moves_b.timeout, 0, "++ timeout_commit_b_reset");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_gt!(round.moves_a.timeout, 0, "++ timeout_reveal_a");
        assert_gt!(round.moves_b.timeout, 0, "++ timeout_reveal_b");
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let round: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round.moves_b.timeout, 0, "++ timeout_reveal_b_reset");
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::assert_pact(@sys, duel_id, challenge, false, false, "ended_2");
        let (challenge, round) = tester::get_Challenge_Round(@sys, duel_id);
        assert_eq!(challenge.state, ChallengeState::Resolved, "challenge.state ++");
        assert_ne!(challenge.winner, 0, "challenge.winner ++");
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "challenge_season_id ++");
        assert_gt!(challenge.timestamps.end, 0, "challenge.timestamps.end ++");
        assert_eq!(round.state, RoundState::Finished, "state ++");
        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "round.state_a.honour ++");
        assert_eq!(round.state_b.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "round.state_b.honour ++");
        assert_eq!(round.moves_a.timeout, 0, "++ timeout_ended_a");
        assert_eq!(round.moves_b.timeout, 0, "++ timeout_ended_b");

        let totals_a_2: Totals = sys.store.get_duelist_totals(ID(OWNER()).into());
        let totals_b_2: Totals = sys.store.get_duelist_totals(ID(OTHER()).into());
        assert_eq!(totals_a_2.total_duels, 2, "totals_a_2.total_duels ++");
        assert_eq!(totals_b_2.total_duels, 2, "totals_b_2.total_duels ++");
        assert_eq!(totals_a_2.total_draws, 0, "totals_a_2.total_draws ++");
        assert_eq!(totals_b_2.total_draws, 0, "totals_b_2.total_draws ++");
        _assert_player_totals(@sys, OWNER(), @totals_a_2, "A_2");
        _assert_player_totals(@sys, OTHER(), @totals_b_2, "B_2");

        let leaderboard_2: Leaderboard = sys.store.get_leaderboard(season_id);
        let positions_2: Span<LeaderboardPosition> = leaderboard_2.get_all_positions();
        assert_eq!(positions_2.len(), 2, "leaderboard_positions.len() ++");
        assert_gt!(*positions_2[0].points, *positions_1[0].points, "score_2 > score_1");
        assert_gt!(*positions_2[1].points, *positions_1[1].points, "score_2 > score_1");

        let score_a_2: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OWNER()).into());
        let score_b_2: SeasonScoreboard = sys.store.get_scoreboard(season_id, ID(OTHER()).into());

        if (winner == 1) {
            assert_eq!(totals_a_2.total_wins, 2, "a_win_duelist_a.total_wins ++");
            assert_eq!(totals_b_2.total_wins, 0, "a_win_duelist_b.total_wins ++");
            assert_eq!(totals_a_2.total_losses, 0, "a_win_duelist_a.total_losses ++");
            assert_eq!(totals_b_2.total_losses, 2, "a_win_duelist_b.total_losses ++");
            assert_eq!(*positions_2[0].duelist_id, ID(OWNER()).into(), "a_win_leaderboards[0].pos ++");
            assert_eq!(*positions_2[1].duelist_id, ID(OTHER()).into(), "a_win_leaderboards[1].pos ++");
            assert_eq!(*positions_2[0].points, score_a_2.points, "score_a_2.points ++");
            assert_eq!(*positions_2[1].points, score_b_2.points, "score_b_2.points ++");
        } else if (winner == 2) {
            assert_eq!(totals_a_2.total_wins, 0, "b_win_duelist_a.total_wins ++");
            assert_eq!(totals_b_2.total_wins, 2, "b_win_duelist_b.total_wins ++");
            assert_eq!(totals_a_2.total_losses, 2, "b_win_duelist_a.total_losses ++");
            assert_eq!(totals_b_2.total_losses, 0, "b_win_duelist_b.total_losses ++");
            assert_eq!(*positions_2[0].duelist_id, ID(OTHER()).into(), "b_win_leaderboards[0].pos ++");
            assert_eq!(*positions_2[1].duelist_id, ID(OWNER()).into(), "b_win_leaderboards[1].pos ++");
            assert_eq!(*positions_2[0].points, score_b_2.points, "score_b_2.points ++");
            assert_eq!(*positions_2[1].points, score_a_2.points, "score_a_2.points ++");
        } else {
            assert!(false, "bad winner")
        }

        _assert_duel_progress(@sys, duel_id, moves_a.moves, moves_b.moves);
    }

    #[test]
    fn test_resolved_win_a() {
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a();
        _test_resolved_win(mocked, moves_a, moves_b, 1);
    }

    #[test]
    fn test_resolved_win_b() {
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b();
        _test_resolved_win(mocked, moves_a, moves_b, 2);
    }


    //-------------------------------
    // Duelist transfer
    //

    #[test]
    fn test_commit_transferred_duelist_new_owner_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
        // try to commmit with another account
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        sys.duelists.transfer_from(OWNER(), BUMMER(), ID(OWNER()).into());
        tester::execute_commit_moves_ID(@sys.game, BUMMER(), ID(OWNER()).into(), duel_id, moves_a.hashed);
        // no panic
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.address_a, BUMMER(), "challenge.address_a_committed");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
    }

    #[test]
    fn test_commit_transferred_duelist_new_owner_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
        // try to commmit with another account
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        sys.duelists.transfer_from(OTHER(), BUMMER(), ID(OTHER()).into());
        tester::execute_commit_moves_ID(@sys.game, BUMMER(), ID(OTHER()).into(), duel_id, moves_b.hashed);
        // no panic
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, BUMMER(), "challenge.address_b_committed");
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_transferred_duelist_old_owner_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        // try to commmit with another account
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        sys.duelists.transfer_from(OWNER(), BUMMER(), ID(OWNER()).into());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_transferred_duelist_old_owner_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        // try to commmit with another account
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        sys.duelists.transfer_from(OTHER(), BUMMER(), ID(OTHER()).into());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
    }



    //-------------------------------
    // lives staked / death
    //
    pub fn _duel_until_death(sys: @TestSystems, winner: u8, challenge_count: u8, lives_staked: u8) {
        let (mocked, moves_a, moves_b) = if (winner == 1) {prefabs::get_moves_crit_a()} else {prefabs::get_moves_crit_b()};
        (*sys).rng.mock_values(mocked);

        let to_death: bool = (challenge_count * lives_staked == MAX_LIVES);
        let mut duelist_id_a: u128 = 0;
        let mut duelist_id_b: u128 = 0;
        if ((*sys).duelists.total_supply() == 0) {
            tester::fund_duelists_pool(sys, 2);
            duelist_id_a = *tester::execute_claim_starter_pack(sys, OWNER())[0];
            duelist_id_b = *tester::execute_claim_starter_pack(sys, OTHER())[0];
            if (to_death) {
                // println!("testing stack_1...");
                let stack_a_1: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(OWNER(), duelist_id_a);
                let stack_b_1: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(OTHER(), duelist_id_b);
                assert_eq!(stack_a_1.active_duelist_id, duelist_id_a, "stack_a_1.current");
                assert_eq!(stack_b_1.active_duelist_id, duelist_id_b, "stack_b_1.current");
                assert_eq!(stack_a_1.stacked_ids.len(), 1, "stack_a_1.len()");
                assert_eq!(stack_b_1.stacked_ids.len(), 1, "stack_b_1.len()");
            }
        }
        let duelist_id_a: u128 = ID(OWNER());
        let duelist_id_b: u128 = ID(OTHER());
        let winner_id = if (winner == 1) {duelist_id_a} else {duelist_id_b};
        let loser_id  = if (winner == 2) {duelist_id_a} else {duelist_id_b};
        let mut loser_lives: u8 = (*sys).duelists.life_count(loser_id);

        let mut i: u8 = 0;
        while (i < challenge_count) {
            assert_eq!((*sys).duelists.life_count(loser_id), loser_lives, "____life_count(loser_id) [{}]", i);
            let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), DuelType::Seasonal, lives_staked);
            tester::execute_commit_moves(sys.game, OWNER(), duel_id, moves_a.hashed);
            tester::execute_commit_moves(sys.game, OTHER(), duel_id, moves_b.hashed);
            tester::execute_reveal_moves(sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
            tester::execute_reveal_moves(sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
            let challenge: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
            assert_eq!(challenge.winner, winner, "challenge.winner:{}", i);
            loser_lives -= lives_staked;
            i += 1;
        };
        assert!((*sys).duelists.is_alive(winner_id), "duelists.is_alive(winner_id)_END");
        assert!((*sys).duelists.is_alive(loser_id) == (loser_lives > 0), "duelists.is_alive(loser_id)_END");
        assert_eq!((*sys).duelists.life_count(winner_id), MAX_LIVES, "duelists.life_count(winner_id)_END");
        assert_eq!((*sys).duelists.life_count(loser_id), loser_lives, "duelists.life_count(loser_id)_END");

        if (to_death && winner != 1) {
            // println!("testing stack_a_2...");
            let stack_a_2: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(OWNER(), duelist_id_a);
            assert_eq!(stack_a_2.active_duelist_id, 0, "stack_a_2.current");
            assert_eq!(stack_a_2.stacked_ids.len(), 0, "stack_a_2.len()");
        }
        if (to_death && winner != 2) {
            // println!("testing stack_b_2...");
            let stack_b_2: PlayerDuelistStack = sys.store.get_player_duelist_stack_from_id(OTHER(), duelist_id_b);
            assert_eq!(stack_b_2.active_duelist_id, 0, "stack_b_2.current");
            assert_eq!(stack_b_2.stacked_ids.len(), 0, "stack_b_2.len()");
        }
    }

    #[test]
    fn test_duel_until_death_OK_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let challenge_count: u8 = MAX_LIVES;
        _duel_until_death(@sys, WIN_2, challenge_count, 1);
        // no panic!
    }
    #[test]
    fn test_duel_until_death_OK_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let challenge_count: u8 = MAX_LIVES;
        _duel_until_death(@sys, WIN_1, challenge_count, 1);
        // no panic!
    }

    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let challenge_count: u8 = MAX_LIVES + 1;
        _duel_until_death(@sys, WIN_2, challenge_count, 1);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let challenge_count: u8 = MAX_LIVES + 1;
        _duel_until_death(@sys, WIN_1, challenge_count, 1);
    }

    #[test]
    fn test_duel_until_death_1_1_1_OK_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 1);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_1_1_1_dead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 1);
    }

    #[test]
    fn test_duel_until_death_1_1_1_OK_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 1);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_1_1_1_dead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 1);
    }

    #[test]
    fn test_duel_until_death_1_2_OK_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 2);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_1_2_dead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_2, 1, 1);
        _duel_until_death(@sys, WIN_2, 1, 2);
        _duel_until_death(@sys, WIN_2, 1, 1);
    }

    #[test]
    fn test_duel_until_death_1_2_OK_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 2);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_1_2_dead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_1, 1, 1);
        _duel_until_death(@sys, WIN_1, 1, 2);
        _duel_until_death(@sys, WIN_1, 1, 1);
    }

    #[test]
    #[should_panic(expected:('DUELIST: Insufficient lives', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_2_2_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_2, 1, 2);
        _duel_until_death(@sys, WIN_2, 1, 2);
    }
    #[test]
    #[should_panic(expected:('DUELIST: Insufficient lives', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_2_2_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        _duel_until_death(@sys, WIN_1, 1, 2);
        _duel_until_death(@sys, WIN_1, 1, 2);
    }

    #[test]
    #[ignore] // TEMP: disabled dripping
    #[should_panic(expected:('DUELIST: Insufficient lives', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_inactive_alive_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // duel once to create duelists
        _duel_until_death(@sys, WIN_2, 1, 1);
// println!("> balance [{}]: {}", ID(OWNER()), tester::fame_balance_of_token(@sys, ID(OWNER())));
// println!("> balance [{}]: {}", ID(OTHER()), tester::fame_balance_of_token(@sys, ID(OTHER())));
        // drip fame
        tester::make_duelist_inactive(@sys, ID(OWNER()), 800);
// println!("> dripped [{}]: {}", ID(OWNER()), sys.duelists.inactive_fame_dripped(ID(OWNER())));
// println!("> dripped [{}]: {}", ID(OTHER()), sys.duelists.inactive_fame_dripped(ID(OTHER())));
        _duel_until_death(@sys, WIN_2, 1, 2);
    }
    #[test]
    #[ignore] // TEMP: disabled dripping
    #[should_panic(expected:('DUELIST: Insufficient lives', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_inactive_alive_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // duel once to create duelists
        _duel_until_death(@sys, WIN_1, 1, 1);
        // drip fame
        tester::make_duelist_inactive(@sys, ID(OTHER()), 800);
        _duel_until_death(@sys, WIN_1, 1, 2);
    }

    #[test]
    #[ignore] // TEMP: disabled dripping
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_inactive_dead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // duel once to create duelists
        _duel_until_death(@sys, WIN_2, 1, 1);
        // drip fame
        tester::make_duelist_inactive(@sys, ID(OWNER()), 1100);
        _duel_until_death(@sys, WIN_2, 1, 2);
    }
    #[test]
    #[ignore] // TEMP: disabled dripping
    #[should_panic(expected:('DUELIST: Duelist is dead!', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_duel_until_death_inactive_dead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // duel once to create duelists
        _duel_until_death(@sys, WIN_1, 1, 1);
// println!("> balance [{}]: {}", ID(OWNER()), tester::fame_balance_of_token(@sys, ID(OWNER())));
// println!("> balance [{}]: {}", ID(OTHER()), tester::fame_balance_of_token(@sys, ID(OTHER())));
        // drip fame
        tester::make_duelist_inactive(@sys, ID(OTHER()), 1100);
// println!("> dripped [{}]: {}", ID(OWNER()), sys.duelists.inactive_fame_dripped(ID(OWNER())));
// println!("> dripped [{}]: {}", ID(OTHER()), sys.duelists.inactive_fame_dripped(ID(OTHER())));
        _duel_until_death(@sys, WIN_1, 1, 2);
    }

    #[test] // TEMP: disabled dripping
    fn test_duel_dripping_disabled() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // duel once to create duelists
        _duel_until_death(@sys, WIN_1, 1, 1);
        tester::make_duelist_inactive(@sys, ID(OTHER()), 1100);
        _duel_until_death(@sys, WIN_1, 1, 2);
        // no panic!
    }


    //-------------------------------
    // Honour / Archetype
    //

    #[test]
    fn test_duel_honour_a_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        //
        // A wins at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 1, "challenge.winner 1");
        // different archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels 1");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels 1");
        assert_eq!(totals_a.honour, 100, "totals_a.honour 1");
        assert_eq!(totals_b.honour, 10, "totals_b.honour 1");
        assert!(totals_a.is_lord(), "totals_a.is_lord() 1");
        assert!(totals_b.is_villain(), "totals_b.is_villain() 1");
        //
        // B wins at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 2, "challenge.winner 2");
        // same archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 2, "totals_a.total_duels 2");
        assert_eq!(totals_b.total_duels, 2, "totals_b.total_duels 2");
        assert_lt!(totals_a.honour, 100, "totals_a.honour 2");
        assert_gt!(totals_b.honour, 10, "totals_b.honour 2");
        assert!(totals_a.is_trickster(), "totals_a.is_trickster() 2");
        assert!(totals_b.is_trickster(), "totals_b.is_trickster() 2");
    }

    #[test]
    fn test_duel_honour_b_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        //
        // A wins at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_b_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 2, "challenge.winner 1");
        // different archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels 1");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels 1");
        assert_eq!(totals_a.honour, 10, "totals_a.honour 1");
        assert_eq!(totals_b.honour, 100, "totals_b.honour 1");
        assert!(totals_a.is_villain(), "totals_a.is_villain() 1");
        assert!(totals_b.is_lord(), "totals_b.is_lord() 1");
        //
        // B wins at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_crit_a_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 1, "challenge.winner 2");
        // same archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 2, "totals_a.total_duels 2");
        assert_eq!(totals_b.total_duels, 2, "totals_b.total_duels 2");
        assert_gt!(totals_a.honour, 10, "totals_a.honour 2");
        assert_lt!(totals_b.honour, 100, "totals_b.honour 2");
        assert!(totals_a.is_trickster(), "totals_a.is_trickster() 2");
        assert!(totals_b.is_trickster(), "totals_b.is_trickster() 2");
    }

    #[test]
    fn test_duel_honour_zero_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // dual crit at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 0, "challenge.winner 1");
        // same archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels 1");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels 1");
        assert_eq!(totals_a.honour, 100, "totals_a.honour 1");
        assert_eq!(totals_b.honour, 100, "totals_b.honour 1");
        assert!(totals_a.is_lord(), "totals_a.is_lord() 1");
        assert!(totals_b.is_lord(), "totals_b.is_lord() 1");
        // timeout...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, A, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, B, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, A, duel_id, moves_a.salt, moves_a.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_b.timeout + 1);
        // tester::execute_reveal_moves(@sys.game, B, duel_id, moves_b.salt, moves_b.moves);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, A, duel_id);
        _assert_timed_out(@sys, duel_id, 1); // 1 wins
        // timeout duel, do not affect honour!
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 2, "totals_a.total_duels 2");
        assert_eq!(totals_b.total_duels, 2, "totals_b.total_duels 2");
        assert_eq!(totals_a.honour, 100, "totals_a.honour 2");
        assert_eq!(totals_b.honour, 100, "totals_b.honour 2");
        assert!(totals_a.is_lord(), "totals_a.is_lord() 2");
        assert!(totals_b.is_lord(), "totals_b.is_lord() 2");
    }

    #[test]
    fn test_duel_honour_zero_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // dual crit at 10 paces
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit_at_10();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 0, "challenge.winner 1");
        // same archetypes...
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels 1");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels 1");
        assert_eq!(totals_a.honour, 100, "totals_a.honour 1");
        assert_eq!(totals_b.honour, 100, "totals_b.honour 1");
        assert!(totals_a.is_lord(), "totals_a.is_lord() 1");
        assert!(totals_b.is_lord(), "totals_b.is_lord() 1");
        // timeout...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, A, duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, B, duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, B, duel_id, moves_b.salt, moves_b.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        // tester::execute_reveal_moves(@sys.game, A, duel_id, moves_a.salt, moves_a.moves);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, B, duel_id);
        _assert_timed_out(@sys, duel_id, 2); // 1 wins
        // timeout duel, do not affect honour!
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 2, "totals_a.total_duels 2");
        assert_eq!(totals_b.total_duels, 2, "totals_b.total_duels 2");
        assert_eq!(totals_a.honour, 100, "totals_a.honour 2");
        assert_eq!(totals_b.honour, 100, "totals_b.honour 2");
        assert!(totals_a.is_lord(), "totals_a.is_lord() 2");
        assert!(totals_b.is_lord(), "totals_b.is_lord() 2");
    }

    #[test]
    fn test_duel_honour_seppuku() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        tester::fund_duelists_pool(@sys, 2);
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // dual crit at 10 paces
        let moves_a: PlayerMoves = PlayerMovesTrait::new(SALT_A, [1, 2, 0, BladesCard::Seppuku.into()].span());
        let moves_b: PlayerMoves = PlayerMovesTrait::new(SALT_B, [2, 1, 0, BladesCard::Seppuku.into()].span());
        let mocked = [
            MockedValueTrait::new('shoot_a', 99),
            MockedValueTrait::new('shoot_b', 99),
            MockedValueTrait::shuffled('env', [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()),
        ].span();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.winner, 0, "challenge.winner");
        assert_eq!(round.final_blow, FinalBlow::Blades(BladesCard::Seppuku), "round.final_blow"); // ended in blades
        // seppuku is hnourable for both
        let totals_a: Totals = sys.store.get_player_totals(A);
        let totals_b: Totals = sys.store.get_player_totals(B);
        assert_eq!(totals_a.total_duels, 1, "totals_a.total_duels");
        assert_eq!(totals_b.total_duels, 1, "totals_b.total_duels");
        assert_eq!(totals_a.honour, 100, "totals_a.honour");
        assert_eq!(totals_b.honour, 100, "totals_b.honour");
        assert!(totals_a.is_lord(), "totals_a.is_lord()");
        assert!(totals_b.is_lord(), "totals_b.is_lord()");
    }


    //-------------------------------
    // Commit/Reveal Fails
    //

    #[test]
    fn test_commit_before_reply_a_OK() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), MESSAGE(), DuelType::Seasonal, 48, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        // no panic!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Accept challenge first', 'ENTRYPOINT_FAILED'))]
    fn test_commit_before_reply_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), MESSAGE(), DuelType::Seasonal, 48, 1);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 0x1212112);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duel', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hashed: u128 = MovesTrait::make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, someone_else, duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_address() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        // try to commmit with another account
        let hashed: u128 = MovesTrait::make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, FAKE_OWNER_OF_1(), duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let hashed: u128 = MovesTrait::make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, hashed);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let hashed: u128 = MovesTrait::make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in commit', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_commit() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, _moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid salt', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_invalid_salt() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 0x0, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not active', 'ENTRYPOINT_FAILED'))]
    fn test_commit_challenge_finished_commit() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not active', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_finished_reveal() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 0x12121, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 0x12121, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_moves_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, [7, 7].span());
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_move_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, [7, 7].span());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves hash', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_must_go_on_0_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, _moves_b) = prefabs::get_moves_custom([].span(), [1,2].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves hash', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_must_go_on_0_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, _moves_a, moves_b) = prefabs::get_moves_custom([1,2].span(), [].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
    }

    #[test]
    // #[should_panic(expected:('PISTOLS: Invalid moves count', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_must_go_on_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        let (_mocked, moves_a, moves_b) = prefabs::get_moves_custom([1].span(), [1].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // would panic hwre if Errors::INVALID_MOVES_COUNT is active
        // instead duel is finished
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
    }



    //-------------------------------
    // commit/reveal timeouts
    //

    fn _assert_timed_out(sys: @TestSystems, duel_id: u128, winner: u8) {
        let (challenge, round): (ChallengeValue, RoundValue) = tester::get_Challenge_Round(sys, duel_id);
        assert_eq!(challenge.winner, winner, "_assert_timed_out: challenge.winner");
        if (winner == 0) {
            assert_eq!(challenge.state, ChallengeState::Draw, "_assert_timed_out: ChallengeState::Draw");
        } else {
            assert_eq!(challenge.state, ChallengeState::Resolved, "_assert_timed_out: ChallengeState::Resolved");
        }
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "_assert_timed_out: challenge_season_id");
        assert_eq!(round.state, RoundState::Finished, "_assert_timed_out: round.state");
        assert_eq!(round.final_blow, FinalBlow::Forsaken, "_assert_timed_out: round.final_blow");
        tester::assert_pact(sys, duel_id, challenge, false, false, "_assert_timed_out");
    }

    fn _assert_not_timed_out(sys: @TestSystems, duel_id: u128) {
        let (challenge, round): (ChallengeValue, RoundValue) = tester::get_Challenge_Round(sys, duel_id);
        if (round.state == RoundState::Finished) {
            // not forsaken
            assert_ne!(round.final_blow, FinalBlow::Forsaken, "_assert_not_timed_out: round.final_blow");
        } else {
            // still playing...
            assert_eq!(challenge.state, ChallengeState::InProgress, "_assert_not_timed_out: ChallengeState::InProgress");
        }
    }

    #[test]
    fn test_timeout_commit_a_OK() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, round_0, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_gt!(round_0.moves_a.timeout, 0, "round_0.moves_a.timeout");
        assert_eq!(round_0.moves_a.timeout, round_0.moves_b.timeout, "round_0.moves_b.timeout");
        // commit A
        tester::set_block_timestamp(round_0.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_0: can_collect_duel");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        // B timeout extended
        let round_commit_1: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_commit_1.moves_a.timeout, 0, "round_commit_1.moves_a.timeout");
        assert_gt!(round_commit_1.moves_b.timeout, round_0.moves_b.timeout, "round_commit_1.moves_b.timeout");
        // commit B
        tester::set_block_timestamp(round_commit_1.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_commit_1: can_collect_duel");
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        // A timeout extended
        let round_commit_2: RoundValue = sys.store.get_round_value(duel_id);
        assert_gt!(round_commit_2.moves_a.timeout, round_commit_1.moves_b.timeout, "round_commit_2.moves_a.timeout");
        assert_eq!(round_commit_2.moves_a.timeout, round_commit_2.moves_b.timeout, "round_commit_2.moves_b.timeout");
        // reveal A
        tester::set_block_timestamp(round_commit_2.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_commit_2: can_collect_duel");
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // B timeout extended
        let round_reveal_1: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_reveal_1.moves_a.timeout, 0, "round_reveal_1.moves_a.timeout");
        assert_gt!(round_reveal_1.moves_b.timeout, round_commit_2.moves_a.timeout, "round_reveal_1.moves_b.timeout");
        // Reveal B
        tester::set_block_timestamp(round_reveal_1.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_reveal_1: can_collect_duel");
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        // A timeout extended
        let round_reveal_2: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_reveal_2.moves_a.timeout, 0, "round_reveal_2.moves_a.timeout");
        assert_eq!(round_reveal_2.moves_b.timeout, 0, "round_reveal_2.moves_b.timeout");
        // finished
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "challenge_season_id");
    }

    #[test]
    fn test_timeout_commit_2_OK() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, round_0, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert_gt!(round_0.moves_a.timeout, 0, "round_0.moves_a.timeout");
        assert_eq!(round_0.moves_a.timeout, round_0.moves_b.timeout, "round_0.moves_b.timeout");
        // commit B
        tester::set_block_timestamp(round_0.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_0: can_collect_duel");
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        // B timeout extended
        let round_commit_1: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_commit_1.moves_b.timeout, 0, "round_commit_1.moves_b.timeout");
        assert_gt!(round_commit_1.moves_a.timeout, round_0.moves_b.timeout, "round_commit_1.moves_a.timeout");
        // commit B
        tester::set_block_timestamp(round_commit_1.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_commit_1: can_collect_duel");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        // A timeout extended
        let round_commit_2: RoundValue = sys.store.get_round_value(duel_id);
        assert_gt!(round_commit_2.moves_a.timeout, round_commit_1.moves_b.timeout, "round_commit_2.moves_a.timeout");
        assert_eq!(round_commit_2.moves_a.timeout, round_commit_2.moves_b.timeout, "round_commit_2.moves_b.timeout");
        // reveal A
        tester::set_block_timestamp(round_commit_2.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_commit_2: can_collect_duel");
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        // B timeout extended
        let round_reveal_1: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_reveal_1.moves_b.timeout, 0, "round_reveal_1.moves_b.timeout");
        assert_gt!(round_reveal_1.moves_a.timeout, round_commit_2.moves_b.timeout, "round_reveal_1.moves_a.timeout");
        // Reveal B
        tester::set_block_timestamp(round_reveal_1.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "round_reveal_1: can_collect_duel");
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // A timeout extended
        let round_reveal_2: RoundValue = sys.store.get_round_value(duel_id);
        assert_eq!(round_reveal_2.moves_a.timeout, 0, "round_reveal_2.moves_a.timeout");
        assert_eq!(round_reveal_2.moves_b.timeout, 0, "round_reveal_2.moves_b.timeout");
        // finished
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.season_id, sys.store.get_current_season_id(), "challenge_season_id");
    }

    #[test]
    fn test_timeout_commit_collect_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, OWNER(), duel_id);
        _assert_timed_out(@sys, duel_id, 0); // dual timeout
    }

    #[test]
    fn test_timeout_commit_collect_draw_other() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, BUMMER(), duel_id);
        _assert_timed_out(@sys, duel_id, 0); // dual timeout
    }

    #[test]
    fn test_timeout_commit_continue() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_commit_collect_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        // time travel...
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_b.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, OTHER(), duel_id);
        _assert_timed_out(@sys, duel_id, 1); // 1 wins
    }

    #[test]
    fn test_timeout_commit_collect_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 0x1212112);
        // time travel...
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_collect_duel(@sys.game, OWNER(), duel_id);
        _assert_timed_out(@sys, duel_id, 2); // 2 wins
    }

    #[test]
    fn test_timeout_commit_continue_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        // time travel...
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_b.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 0x1212112);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_commit_continue_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 0x1212112);
        // time travel...
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_reveal_collect_draw() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // collect...
        tester::execute_collect_duel(@sys.game, OWNER(), duel_id);
        _assert_timed_out(@sys, duel_id, 0); // dual timeout
    }

    #[test]
    fn test_timeout_reveal_collect_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_b.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // collect...
        tester::execute_collect_duel(@sys.game, OTHER(), duel_id);
        _assert_timed_out(@sys, duel_id, 1); // 1 wins
    }

    #[test]
    fn test_timeout_reveal_collect_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // collect...
        tester::execute_collect_duel(@sys.game, OWNER(), duel_id);
        _assert_timed_out(@sys, duel_id, 2); // 2 wins
    }

    #[test]
    fn test_timeout_reveal_continue_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // reveal...
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_reveal_continue_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // reveal...
        // tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_final_reveal_continue_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_b.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_b.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // reveal...
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        _assert_not_timed_out(@sys, duel_id);
    }

    #[test]
    fn test_timeout_final_reveal_continue_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::MOCK_RNG);
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        // time travel...
        let round: RoundValue = sys.store.get_round_value(duel_id);
        tester::set_block_timestamp(round.moves_a.timeout);
        assert!(!sys.game.can_collect_duel(duel_id), "!can_collect_duel");
        tester::set_block_timestamp(round.moves_a.timeout + 1);
        assert!(sys.game.can_collect_duel(duel_id), "can_collect_duel");
        // reveal...
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        _assert_not_timed_out(@sys, duel_id);
    }


    //-------------------------------
    // score bonuses
    //

    #[test]
    fn test_score_bonus_dodge_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let moves_a: PlayerMoves = PlayerMovesTrait::new(SALT_A, [2, 1, 0, BladesCard::Seppuku.into()].span());
        let moves_b: PlayerMoves = PlayerMovesTrait::new(SALT_B, [1, 3, 0, BladesCard::Seppuku.into()].span());
        sys.rng.mock_values([
                MockedValueTrait::new('shoot_a', 99),
                MockedValueTrait::new('shoot_b', 99),
                MockedValueTrait::shuffled('env', [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()),
            ].span()
        );
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.winner, 0, "challenge.winner");
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OWNER()).into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OTHER()).into());
        // A dodged, scored more points
        assert_gt!(score_a.points, score_b.points, "score_a.points > score_b.points");
    }

    #[test]
    fn test_score_bonus_dodge_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let moves_a: PlayerMoves = PlayerMovesTrait::new(SALT_A, [1, 3, 0, BladesCard::Seppuku.into()].span());
        let moves_b: PlayerMoves = PlayerMovesTrait::new(SALT_B, [2, 1, 0, BladesCard::Seppuku.into()].span());
        sys.rng.mock_values([
                MockedValueTrait::new('shoot_a', 99),
                MockedValueTrait::new('shoot_b', 99),
                MockedValueTrait::shuffled('env', [ENV_CARD_NEUTRAL, ENV_CARD_NEUTRAL].span()),
            ].span()
        );
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.winner, 0, "challenge.winner");
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OWNER()).into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OTHER()).into());
        // B dodged, scored more points
        assert_lt!(score_a.points, score_b.points, "score_a.points < score_b.points");
    }

    #[test]
    fn test_dodge_win_a_TEMP() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let moves_a: PlayerMoves = PlayerMovesTrait::new(SALT_A, [2, 1].span());
        let moves_b: PlayerMoves = PlayerMovesTrait::new(SALT_B, [1, 10].span());
        sys.rng.mock_values([
                MockedValueTrait::new('shoot_a', 1),
                MockedValueTrait::new('shoot_b', 99),
                MockedValueTrait::shuffled('env', [ENV_CARD_CRIT, ENV_CARD_CRIT].span()),
            ].span()
        );
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.winner, 1, "challenge.winner");
        // A dodged and won: ZERO POINTS
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OWNER()).into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OTHER()).into());
        assert_eq!(score_a.points, 0, "score_a.points ZERO");
        assert_gt!(score_b.points, 0, "score_b.points > 0");
    }

    #[test]
    fn test_dodge_win_b_TEMP() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let moves_a: PlayerMoves = PlayerMovesTrait::new(SALT_A, [1, 10].span());
        let moves_b: PlayerMoves = PlayerMovesTrait::new(SALT_B, [2, 1].span());
        sys.rng.mock_values([
                MockedValueTrait::new('shoot_a', 99),
                MockedValueTrait::new('shoot_b', 1),
                MockedValueTrait::shuffled('env', [ENV_CARD_CRIT, ENV_CARD_CRIT].span()),
            ].span()
        );
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, OTHER())[0];
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, OWNER(), OTHER(), DuelType::Seasonal, 1);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let challenge: ChallengeValue = sys.store.get_challenge_value(duel_id);
        assert_eq!(challenge.winner, 2, "challenge.winner");
        // B dodged and won: ZERO POINTS
        let score_a: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OWNER()).into());
        let score_b: SeasonScoreboard = sys.store.get_scoreboard(SEASON_ID_1, ID(OTHER()).into());
        assert_gt!(score_a.points, 0, "score_a.points > 0");
        assert_eq!(score_b.points, 0, "score_b.points ZERO");
    }


    //-------------------------------
    // leaderboard qualification
    //

    #[test]
    fn test_leaderboard_qualify_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // empty leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 0, "positions.len()");
        // create duelists
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::fund_duelists_pool(@sys, 2);
        let duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 2, "positions.len()");
        let pos_1: u128 = *positions[0].duelist_id;
        let pos_2: u128 = *positions[1].duelist_id;
        assert_eq!(pos_1, duelist_id_a, "positions[0]");
        assert_eq!(pos_2, duelist_id_b, "positions[1]");
        //
        // disqualify_a...
        let disqualified_a = tester::execute_admin_disqualify_duelist(@sys.admin, OWNER(), SEASON_ID_1, duelist_id_a, true);
        assert!(disqualified_a, "disqualified_a");
        let lb: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let ps: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(ps.len(), 1, "disqualify_a >> positions.len()");
        assert_eq!(*ps[0].duelist_id, duelist_id_b, "disqualify_a >> positions[0]");
        assert!(sys.store.get_player_is_blocked(A), "disqualify_a >> is_blocked_A");
        assert!(!sys.store.get_player_is_blocked(B), "!is_blocked_B");
        //
        // disqualify_b...
        let disqualified_b = tester::execute_admin_disqualify_duelist(@sys.admin, OWNER(), SEASON_ID_1, duelist_id_b, true);
        assert!(disqualified_b, "disqualified_b");
        let lb: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let ps: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(ps.len(), 0, "disqualify_b >> positions.len()");
        assert!(sys.store.get_player_is_blocked(B), "disqualify_b >> is_blocked_B");
        //
        // re-qualify A...
        let position_a = tester::execute_admin_qualify_duelist(@sys.admin, OWNER(), SEASON_ID_1, duelist_id_a);
        assert_eq!(position_a, 1, "re-qualified_a");
        let lb: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let ps: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(ps.len(), 1, "re-qualify_a >> positions.len()");
        assert_eq!(*ps[0].duelist_id, duelist_id_a, "re-qualify_a >> positions[0]");
        //
        // re-qualify B...
        let position_b = tester::execute_admin_qualify_duelist(@sys.admin, OWNER(), SEASON_ID_1, duelist_id_b);
        assert_eq!(position_b, 2, "re-qualified_b");
        let lb: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let ps: Span<LeaderboardPosition> = lb.get_all_positions();
        assert_eq!(ps.len(), 2, "re-qualify_b >> positions.len()");
        assert_eq!(*ps[0].duelist_id, duelist_id_a, "re-qualify_b >> positions[0]");
        assert_eq!(*ps[1].duelist_id, duelist_id_b, "re-qualify_b >> positions[1]");
    }

    #[test]
    fn test_leaderboard_qualify_team_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // block A
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), A, true, true);
        // create duelists
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 1, "positions.len()");
        assert_eq!(*positions[0].duelist_id, ID(B).into(), "positions[0]");
    }

    #[test]
    fn test_leaderboard_qualify_team_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // block A
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), B, true, true);
        // create duelists
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 1, "positions.len()");
        assert_eq!(*positions[0].duelist_id, ID(A).into(), "positions[0]");
    }

    #[test]
    fn test_leaderboard_qualify_blocked_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // block A
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), A, true);
        // create duelists
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 1, "positions.len()");
        assert_eq!(*positions[0].duelist_id, ID(B).into(), "positions[0]");
    }

    #[test]
    fn test_leaderboard_qualify_blocked_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // block A
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), B, true);
        // create duelists
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 1, "positions.len()");
        assert_eq!(*positions[0].duelist_id, ID(A).into(), "positions[0]");
    }

    #[test]
    fn test_leaderboard_qualify_blocked_a_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        // block A
        let A: ContractAddress = OWNER();
        let B: ContractAddress = OTHER();
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), A, true);
        tester::execute_admin_set_is_blocked(@sys.admin, OWNER(), B, true);
        // create duelists
        tester::fund_duelists_pool(@sys, 2);
        let _duelist_id_a: u128 = *tester::execute_claim_starter_pack(@sys, A)[0];
        let _duelist_id_b: u128 = *tester::execute_claim_starter_pack(@sys, B)[0];
        // just draw...
        let (mocked, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        sys.rng.mock_values(mocked);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(@sys, A, B, DuelType::Seasonal, 1);
        let (challenge, _round) = prefabs::commit_reveal_get(@sys, duel_id, A, B, mocked, moves_a, moves_b);
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        // filled leaderboards
        let leaderboard: Leaderboard = sys.store.get_leaderboard(SEASON_ID_1);
        let positions: Span<LeaderboardPosition> = leaderboard.get_all_positions();
        assert_eq!(positions.len(), 0, "positions.len()");
    }

}
