#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::game::{game, IGameDispatcher, IGameDispatcherTrait};
    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, RoundEntity};
    use pistols::models::duelist::{Duelist, DuelistEntity, DuelistEntityStore, ProfilePicType, Archetype};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelStep};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::utils::arrays::{SpanUtilsTrait};
    use pistols::utils::math::{MathU8};
    use pistols::libs::utils::{make_moves_hash};

    use pistols::systems::tokens::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::tester::{tester,
        tester::{
            Systems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
            FAKE_OWNER_1_1, FAKE_OWNER_2_2,
            _assert_is_alive, _assert_is_dead,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SALT_A, SALT_B, TABLE_ID, MESSAGE, WAGER_VALUE,
            SaltsValues, SaltsValuesTrait,
            PlayerMoves, PlayerMovesTrait,
        },
    };
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};



    //-----------------------------------------
    // Single Round Draw (paces only)
    //

    fn _assert_duel_progress(sys: Systems, duel_id: u128, moves_a: Span<u8>, moves_b: Span<u8>) {
        let challenge: ChallengeEntity = tester::get_ChallengeEntity(sys.world, duel_id);
        let round: RoundEntity = tester::get_RoundEntity(sys.world, duel_id, 1);
        let progress: DuelProgress = sys.game.get_duel_progress(duel_id);
        let final_step: DuelStep = *progress.steps[progress.steps.len() - 1];
        assert(progress.winner == challenge.winner, 'winner');
        // hand_a
        assert(progress.hand_a.card_fire.into() == moves_a.value_or_zero(0), 'moves_a_0');
        assert(progress.hand_a.card_dodge.into() == moves_a.value_or_zero(1), 'moves_a_1');
        assert(progress.hand_a.card_tactics.into() == moves_a.value_or_zero(2), 'moves_a_2');
        assert(progress.hand_a.card_blades.into() == moves_a.value_or_zero(3), 'moves_a_3');
        assert(progress.hand_a.card_fire == round.moves_a.card_1.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_dodge == round.moves_a.card_2.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_tactics == round.moves_a.card_3.into(), 'hand_a.card_fire');
        assert(progress.hand_a.card_blades == round.moves_a.card_4.into(), 'hand_a.card_fire');
        // hand_b
        assert(progress.hand_b.card_fire.into() == moves_b.value_or_zero(0), 'moves_b_0');
        assert(progress.hand_b.card_dodge.into() == moves_b.value_or_zero(1), 'moves_b_1');
        assert(progress.hand_b.card_tactics.into() == moves_b.value_or_zero(2), 'moves_b_2');
        assert(progress.hand_b.card_blades.into() == moves_b.value_or_zero(3), 'moves_b_3');
        assert(progress.hand_b.card_fire == round.moves_b.card_1.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_dodge == round.moves_b.card_2.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_tactics == round.moves_b.card_3.into(), 'hand_b.card_fire');
        assert(progress.hand_b.card_blades == round.moves_b.card_4.into(), 'hand_b.card_fire');
        // state_a
        assert(final_step.state_a.health == round.state_a.health, 'state_final_a.health');
        assert(final_step.state_a.damage == round.state_a.damage, 'state_final_a.damage');
        assert(final_step.state_a.chances == round.state_a.chances, 'state_final_a.chances');
        assert(final_step.state_a.dice_fire == round.state_a.dice_fire, 'state_final_a.dice_fire');
        // state_b
        assert(final_step.state_b.health == round.state_b.health, 'state_final_b.health');
        assert(final_step.state_b.damage == round.state_b.damage, 'state_final_b.damage');
        assert(final_step.state_b.chances == round.state_b.chances, 'state_final_b.chances');
        assert(final_step.state_b.dice_fire == round.state_b.dice_fire, 'state_final_b.dice_fire');
    }


    fn _test_resolved_draw(salts: SaltsValues, moves_a: PlayerMoves, moves_b: PlayerMoves, final_health: u8) {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.mock_values(salts.salts, salts.values);

        let table_id: felt252 = TABLES::LORDS;
        let balance_contract: u128 = sys.lords.balance_of(sys.game.contract_address).low;
        let balance_a: u128 = sys.lords.balance_of(OWNER()).low;
        let balance_b: u128 = sys.lords.balance_of(OTHER()).low;
        let fee: u128 = sys.game.calc_fee(table_id, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');

        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);
        tester::assert_balance(sys.lords, sys.game.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(sys.lords, OWNER(), balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(sys.lords, OTHER(), balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
// challenge.winner.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert(challenge.state == ChallengeState::Draw, 'challenge.state');
        assert(challenge.winner == 0, 'challenge.winner');
        assert(challenge.round_number == 1, 'challenge.round_number');
        assert(round.state == RoundState::Finished, 'round.state');
        assert(round.final_step == MathU8::max(*moves_a.moves[0], *moves_b.moves[0]), 'round.final_step');
        assert(round.state_a.health == final_health, 'round.moves_a.health');
        assert(round.state_b.health == final_health, 'round.moves_b.health');
        if (final_health == 0) {
            _assert_is_dead(round.state_a, 'dead_a');
            _assert_is_dead(round.state_b, 'dead_b');
        } else {
            _assert_is_alive(round.state_a, 'alive_a');
            _assert_is_alive(round.state_b, 'alive_b');
        }

        let duelist_a = tester::get_DuelistEntity(sys.world, OWNER());
        let duelist_b = tester::get_DuelistEntity(sys.world, OTHER());
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 1, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 1, 'duelist_b.total_draws');
        assert(duelist_a.score.total_wins == 0, 'duelist_a.total_wins');
        assert(duelist_b.score.total_wins == 0, 'duelist_b.total_wins');
        assert(duelist_a.score.total_losses == 0, 'duelist_a.total_losses');
        assert(duelist_b.score.total_losses == 0, 'duelist_b.total_losses');

        assert(round.state_a.honour == (*moves_a.moves[0] * 10).try_into().unwrap(), 'duelist_a.score.honour');
        assert(round.state_a.honour == (*moves_b.moves[0] * 10).try_into().unwrap(), 'duelist_b.score.honour');
        assert(duelist_a.score.honour == round.state_a.honour, 'duelist_a.score.honour');
        assert(duelist_b.score.honour == round.state_b.honour, 'duelist_b.score.honour');

        let mut scoreboard_a = tester::get_Scoreboard(sys.world, table_id, OWNER());
        let mut scoreboard_b = tester::get_Scoreboard(sys.world, table_id, OTHER());
        assert(duelist_a.score.total_duels == scoreboard_a.score.total_duels, 'scoreboard_a.total_duels');
        assert(duelist_b.score.total_duels == scoreboard_b.score.total_duels, 'scoreboard_b.total_duels');
        assert(duelist_a.score.honour == scoreboard_a.score.honour, 'scoreboard_a.score.honour');
        assert(duelist_b.score.honour == scoreboard_b.score.honour, 'scoreboard_b.score.honour');

        tester::assert_balance(sys.lords, sys.game.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        tester::assert_balance(sys.lords, TREASURY(), 0, 0, fee * 2, 'balance_treasury_2');
        tester::assert_balance(sys.lords, OWNER(), balance_a, fee, 0, 'balance_a_2');
        tester::assert_balance(sys.lords, OTHER(), balance_b, fee, 0, 'balance_b_2');

        _assert_duel_progress(sys, duel_id, moves_a.moves, moves_b.moves);
    }

    #[test]
    fn test_resolved_draw_miss() {
        let (salts, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        _test_resolved_draw(salts, moves_a, moves_b, CONST::FULL_HEALTH);
    }

    #[test]
    fn test_resolved_draw_crit() {
        let (salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
// (*salts.salts[0]).print();
// (*salts.salts[1]).print();
// (*salts.values[0]).print();
// (*salts.values[1]).print();
// (*moves_a.moves[0]).print();
// (*moves_a.moves[1]).print();
// (*moves_b.moves[0]).print();
// (*moves_b.moves[1]).print();
        _test_resolved_draw(salts, moves_a, moves_b, 0);
    }

    
    //-----------------------------------------
    // Single Round Resolved (paces only)
    //

    fn _test_resolved_win(salts: SaltsValues, moves_a: PlayerMoves, moves_b: PlayerMoves, winner: u8) {
        let sys = tester::setup_world(FLAGS::GAME | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.mock_values(salts.salts, salts.values);

        let table_id: felt252 = TABLES::LORDS;
        let balance_contract: u128 = sys.lords.balance_of(sys.game.contract_address).low;
        let balance_treasury: u128 = sys.lords.balance_of(TREASURY()).low;
        let balance_a: u128 = sys.lords.balance_of(OWNER()).low;
        let balance_b: u128 = sys.lords.balance_of(OTHER()).low;
        let fee: u128 = sys.game.calc_fee(table_id, WAGER_VALUE);
        assert(fee > 0, 'fee > 0');
        assert(balance_treasury == 0, 'balance_treasury == 0');

        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);
        tester::assert_balance(sys.lords, sys.game.contract_address, balance_contract, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
        tester::assert_balance(sys.lords, OWNER(), balance_a, fee + WAGER_VALUE, 0, 'balance_a_1');
        tester::assert_balance(sys.lords, OTHER(), balance_b, fee + WAGER_VALUE, 0, 'balance_b_1');
        tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

        // 1st commit
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert(challenge.round_number == 1, '1__challenge.round_number');
        assert(round.state == RoundState::Commit, '1__state');
        assert(round.moves_a.hashed == moves_a.hashed, '1__hash');

        // 2nd commit > Reveal
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert(challenge.round_number == 1, '2__challenge.round_number');
        assert(round.state == RoundState::Reveal, '2__state');
        assert(round.moves_a.hashed == moves_a.hashed, '21__hash');
        assert(round.moves_b.hashed == moves_b.hashed, '2__hash');

        // 1st reveal
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert(challenge.round_number == 1, '3_challenge.round_number');
        assert(round.state == RoundState::Reveal, '3__state');
        assert(round.moves_a.hashed == moves_a.hashed, '3__hash');
        assert(round.moves_a.salt == moves_a.salt, '3__salt');
        assert(round.moves_a.card_1 == *moves_a.moves[0], '3__card_fire');
        assert(round.moves_a.card_2 == *moves_a.moves[1], '3__card_dodge');

        // 2nd reveal > Finished
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
// challenge.winner.print();
// // challenge.state.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert(challenge.state == ChallengeState::Resolved, '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.state == RoundState::Finished, '4__state');
        assert(round.final_step == MathU8::min(*moves_a.moves[0], *moves_b.moves[0]), 'round.final_step');
        assert(round.moves_a.hashed == moves_a.hashed, '43__hash');
        assert(round.moves_a.salt == moves_a.salt, '43__salt');
        assert(round.moves_a.card_1.into() == *moves_a.moves[0], '43__card_fire');
        assert(round.moves_a.card_2.into() == *moves_a.moves[1], '43__card_dodge');
        assert(round.moves_b.hashed == moves_b.hashed, '4__hash');
        assert(round.moves_b.salt == moves_b.salt, '4__salt');
        assert(round.moves_b.card_1.into() == *moves_b.moves[0], '4__card_fire');
        assert(round.moves_b.card_2.into() == *moves_b.moves[1], '4__card_dodge');

        let duelist_a = tester::get_DuelistEntity(sys.world, OWNER());
        let duelist_b = tester::get_DuelistEntity(sys.world, OTHER());
        assert(duelist_a.score.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.score.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.score.total_draws == 0, 'duelist_a.total_draws');
        assert(duelist_b.score.total_draws == 0, 'duelist_b.total_draws');

        assert(round.state_a.honour == (*moves_a.moves[0] * 10).try_into().unwrap(), 'duelist_a.score.honour');
        assert(round.state_b.honour == (*moves_b.moves[0] * 10).try_into().unwrap(), 'duelist_b.score.honour');
        assert(duelist_a.score.honour == round.state_a.honour, 'duelist_a.score.honour');
        assert(duelist_b.score.honour == round.state_b.honour, 'duelist_b.score.honour');

        assert(challenge.winner == winner, 'winner');
        if (winner == 1) {
            assert(duelist_a.score.total_wins == 1, 'a_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 0, 'a_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 0, 'a_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 1, 'a_win_duelist_b.total_losses');
            assert(round.state_a.damage == CONST::FULL_HEALTH, 'a_win_damage_a');
            assert(round.state_a.health == CONST::FULL_HEALTH, 'a_win_health_a');
            assert(round.state_b.health == 0, 'a_win_health_b');
            _assert_is_alive(round.state_a, 'alive_a');
            _assert_is_dead(round.state_b, 'dead_b');
        } else if (winner == 2) {
            assert(duelist_a.score.total_wins == 0, 'b_win_duelist_a.total_wins');
            assert(duelist_b.score.total_wins == 1, 'b_win_duelist_b.total_wins');
            assert(duelist_a.score.total_losses == 1, 'b_win_duelist_a.total_losses');
            assert(duelist_b.score.total_losses == 0, 'b_win_duelist_b.total_losses');
            assert(round.state_b.damage == CONST::FULL_HEALTH, 'b_win_damage_b');
            assert(round.state_b.health == CONST::FULL_HEALTH, 'b_win_health_b');
            assert(round.state_a.health == 0, 'b_win_health_a');
            _assert_is_alive(round.state_b, 'alive_b');
            _assert_is_dead(round.state_a, 'dead_a');
        } else {
            assert(false, 'bad winner')
        }

        tester::assert_balance(sys.lords, sys.game.contract_address, balance_contract, 0, 0, 'balance_contract_2');
        let balance_treasury = tester::assert_balance(sys.lords, TREASURY(), balance_treasury, 0, fee * 2, 'balance_treasury_2');
        tester::assert_winner_balance(sys.lords, challenge.winner, OWNER(), OTHER(), balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_2');
        let balance_a: u128 = sys.lords.balance_of(OWNER()).low;
        let balance_b: u128 = sys.lords.balance_of(OTHER()).low;

        //
        // Run same challenge again!!!!
        // (to compute totals and scores)
        //
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::LORDS);
        // invert player order just for fun, expect same results!
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert(challenge.state == ChallengeState::Resolved, 'challenge.state ++');
        assert(challenge.winner != 0, 'challenge.winner ++');
        assert(challenge.round_number == 1, 'challenge.round_number ++');
        assert(challenge.timestamp_end > 0, 'challenge.timestamp_end ++');
        assert(round.state == RoundState::Finished, 'state ++');
        let duelist_a = tester::get_DuelistEntity(sys.world, OWNER());
        let duelist_b = tester::get_DuelistEntity(sys.world, OTHER());
        assert(duelist_a.score.total_duels == 2, 'duelist_a.total_duels ++');
        assert(duelist_b.score.total_duels == 2, 'duelist_b.total_duels ++');
        assert(duelist_a.score.total_draws == 0, 'duelist_a.total_draws ++');
        assert(duelist_b.score.total_draws == 0, 'duelist_b.total_draws ++');

        assert(round.state_a.honour == (*moves_a.moves[0] * 10).try_into().unwrap(), 'duelist_a.score.honour ++');
        assert(round.state_b.honour == (*moves_b.moves[0] * 10).try_into().unwrap(), 'duelist_b.score.honour ++');

        if (winner == 1) {
            assert(duelist_a.score.total_wins == 2, 'a_win_duelist_a.total_wins ++');
            assert(duelist_b.score.total_wins == 0, 'a_win_duelist_b.total_wins ++');
            assert(duelist_a.score.total_losses == 0, 'a_win_duelist_a.total_losses ++');
            assert(duelist_b.score.total_losses == 2, 'a_win_duelist_b.total_losses ++');
        } else if (winner == 2) {
            assert(duelist_a.score.total_wins == 0, 'b_win_duelist_a.total_wins ++');
            assert(duelist_b.score.total_wins == 2, 'b_win_duelist_b.total_wins ++');
            assert(duelist_a.score.total_losses == 2, 'b_win_duelist_a.total_losses ++');
            assert(duelist_b.score.total_losses == 0, 'b_win_duelist_b.total_losses ++');
        } else {
            assert(false, 'bad winner')
        }

        tester::assert_balance(sys.lords, sys.game.contract_address, balance_contract, 0, 0, 'balance_contract_3');
        tester::assert_balance(sys.lords, TREASURY(), balance_treasury, 0, fee * 2, 'balance_treasury_3');
        tester::assert_winner_balance(sys.lords, challenge.winner, OWNER(), OTHER(), balance_a, balance_b, fee, WAGER_VALUE, 'balance_winner_3');

        _assert_duel_progress(sys, duel_id, moves_a.moves, moves_b.moves);
    }

    #[test]
    fn test_resolved_win_a() {
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_a();
        _test_resolved_win(salts, moves_a, moves_b, 1);
    }

    #[test]
    fn test_resolved_win_b() {
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_b();
        _test_resolved_win(salts, moves_a, moves_b, 2);
    }


    //----------------
    // Tables features
    //

    // #[test]
    // fn test_resolved_table_collector() {
    //     let sys = tester::setup_world(FLAGS::GAME | FLAGS::ADMIN | FLAGS::LORDS | FLAGS::APPROVE);

    //     let mut table: TableConfig = tester::get_Table(sys.world, TABLE_ID);
    //     table.fee_collector_address = BUMMER();
    //     tester::set_TableConfig(@sys.world, table);

    //     let fee: u128 = sys.game.calc_fee(TABLE_ID, WAGER_VALUE);
    //     assert(fee > 0, 'fee > 0');

    //     let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
    //     tester::assert_balance(sys.lords, sys.game.contract_address, 0, 0, (fee + WAGER_VALUE) * 2, 'balance_contract_1');
    //     tester::assert_balance(sys.lords, table.fee_collector_address, 0, 0, 0, 'balance_colelctor_1');
    //     tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');

    //     let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_game_round_1_dual_crit(10, 10);
    //     tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, hash_a);
    //     tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, hash_b);
    //     tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, salt_a, action_a, 0);
    //     tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, salt_b, action_b, 0);
    //     let (challenge, _round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
    //     assert(challenge.state == ChallengeState::Draw, 'challenge.state');

    //     tester::assert_balance(sys.lords, sys.game.contract_address, 0, 0, 0, 'balance_contract_2');
    //     tester::assert_balance(sys.lords, table.fee_collector_address, 0, 0, fee * 2, 'balance_collector_2');
    //     tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'balance_treasury_1');
    // }

    // #[test]
    // fn test_register_keep_scores() {
    //     // let sys = tester::setup_world(FLAGS::GAME);
    //     // let duelist1: Duelist = tester::execute_create_duelist(@sys.duelists, OWNER(), 'AAA', ProfilePicType::Duelist, '1');
    //     // let duelist2: Duelist = tester::execute_create_duelist(@sys.duelists, OTHER(), 'AAA', ProfilePicType::Duelist, '1');
    //     // assert(duelist1.duelist_id == ID(OWNER()), 'invalid duelist_id_1');
    //     // assert(duelist2.duelist_id == ID(OTHER()), 'invalid duelist_id_2');
    //     // let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys.world, game, OWNER(), OTHER(), 0);
    //     // let hash_a: u64 = make_moves_hash(0x111, 10);
    //     // let hash_b: u64 = make_moves_hash(0x222, 1);
    //     // tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, hash_a);
    //     // tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, hash_b);
    //     // tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, 0x111, 10, 0);

    //     let sys = tester::setup_world(FLAGS::GAME);
    //     let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
    //     let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_game_round_1_dual_crit(9, 10);
    //     tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, hash_a);
    //     tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, hash_b);
    //     tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, salt_a, action_a, 0);
    //     tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, salt_b, action_b, 0);
    //     let (challenge, _round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
    //     assert(challenge.state == ChallengeState::Resolved, 'challenge.state');

    //     let mut duelist_a_before = tester::get_DuelistEntity_id(sys.world, ID(OWNER()));
    //     assert(duelist_a_before.score.total_duels > 0, 'total_duels > 0');
    //     // validate by settign a timestamp
    //     duelist_a_before.timestamp = 1234;
    //     duelist_a_before.update(sys.world); // TODO: impersonate some contract
    //     tester::execute_update_duelist_ID(@sys.duelists, OWNER(), ID(OWNER()), 'dssadsa', ProfilePicType::Duelist, '3');
    //     let duelist_a_after = tester::get_DuelistEntity_id(sys.world, ID(OWNER()));
    //     assert(duelist_a_before.name != duelist_a_after.name, 'name');
    //     assert(duelist_a_before.profile_pic_uri != duelist_a_after.profile_pic_uri, 'profile_pic_uri');
    //     assert(duelist_a_before.timestamp == duelist_a_after.timestamp, 'timestamp');
    //     assert(duelist_a_before.score.total_duels == duelist_a_after.score.total_duels, 'total_duels');
    //     assert(duelist_a_before.score.total_wins == duelist_a_after.score.total_wins, 'total_wins');
    //     assert(duelist_a_before.score.total_losses == duelist_a_after.score.total_losses, 'total_losses');
    //     assert(duelist_a_before.score.total_draws == duelist_a_after.score.total_draws, 'total_draws');
    //     assert(duelist_a_before.score.honour == duelist_a_after.score.honour, 'honour');
    // }    
    




    //-------------------------------
    // Commit/Reveal Fails
    //

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_duelist() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, someone_else, duel_id, 1, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your challenge', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_address() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        // try to commmit with another account
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, FAKE_OWNER_1_1(), duel_id, 1, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid round number', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_round_number() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 2, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_a() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, hashed);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_b() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_a() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_b() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in commit', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_commit() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_a() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_b() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, _moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_not_started() {
        let sys = tester::setup_world(FLAGS::GAME);
        let duel_id: u128 = tester::execute_create_challenge(@sys.game, OWNER(), OTHER(), MESSAGE, TABLES::COMMONERS, 0, 48);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, 0x1212112);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid salt', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_invalid_salt() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, 0x0, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_commit_challenge_finished_commit() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not Progress', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_finished_reveal() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_a() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, 0x12121, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_b() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, 0x12121, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_moves_a() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, [7, 7].span());
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_move_b() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 1, moves_b.salt, [7, 7].span());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves count', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_0() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_custom([1].span(), [1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves count', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_1() {
        let sys = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::COMMONERS);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_custom([1,1].span(), [1,1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 1, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 1, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 1, 0x12121, [].span());
    }


}
