#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::challenge::{ChallengeTrait, ChallengeValue, RoundValue};
    use pistols::models::table::{TABLES};
    use pistols::types::cards::hand::{PacesCard, FinalBlow, DeckType};
    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::duel_progress::{DuelProgress, DuelStep};
    use pistols::types::round_state::{RoundState};
    use pistols::types::constants::{CONST};
    use pistols::libs::game_loop::{make_moves_hash};
    use pistols::utils::arrays::{SpanUtilsTrait};
    use pistols::utils::math::{MathU8};

    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            IGameDispatcherTrait,
            IDuelTokenDispatcherTrait,
            IDuelistTokenDispatcherTrait,
            ID, OWNER, OTHER, BUMMER, FAKE_OWNER_OF_1,
            _assert_is_alive, _assert_is_dead,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            // SALT_A, SALT_B, TABLE_ID, PRIZE_VALUE,
            MESSAGE,
            SaltsValues,
            PlayerMoves,
        },
    };
    use pistols::systems::rng_mock::{IRngMockDispatcherTrait};



    //-----------------------------------------
    // Single Round Draw (paces only)
    //

    fn _assert_duel_progress(sys: TestSystems, duel_id: u128, moves_a: Span<u8>, moves_b: Span<u8>) {
        let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        let round: RoundValue = tester::get_RoundValue(sys.world, duel_id);
        let progress: DuelProgress = sys.game.get_duel_progress(duel_id);
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


    fn _test_resolved_draw(salts: SaltsValues, moves_a: PlayerMoves, moves_b: PlayerMoves, final_health: u8) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];

        let table_id: felt252 = TABLES::PRACTICE;

        let fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        assert_gt!(fame_balance_a, 0, "fame_balance_a_init");
        assert_gt!(fame_balance_b, 0, "fame_balance_b_init");

        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);
        assert_eq!(tester::get_Challenge(sys.world, duel_id).get_deck_type(), DeckType::Classic, "challenge.deck_type");
        tester::assert_pact(sys, duel_id, challenge, true, true, "started");
        // tester::assert_balance(sys.lords, sys.game.contract_address, lords_balance_contract, 0, (lords_fee + PRIZE_VALUE) * 2, 'lords_balance_contract_1');
        // tester::assert_balance(sys.lords, OWNER(), lords_balance_a, lords_fee + PRIZE_VALUE, 0, 'lords_balance_a_1');
        // tester::assert_balance(sys.lords, OTHER(), lords_balance_b, lords_fee + PRIZE_VALUE, 0, 'lords_balance_b_1');
        // tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'lords_balance_treasury_1');

        // duel nft owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of");

        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        tester::assert_pact(sys, duel_id, challenge, false, false, "ended");
// challenge.winner.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert_eq!(challenge.state, ChallengeState::Draw, "challenge.state");
        assert_eq!(challenge.winner, 0, "challenge.winner");
        assert_eq!(round.state, RoundState::Finished, "round.state");
        assert_eq!(round.state_a.health, final_health, "round.moves_a.health");
        assert_eq!(round.state_b.health, final_health, "round.moves_b.health");
        let final_blow: PacesCard = MathU8::max(*moves_a.moves[0], *moves_b.moves[0]).into();
        assert_eq!(round.final_blow, FinalBlow::Paces(final_blow), "round.final_blow");
        if (final_health == 0) {
            _assert_is_dead(round.state_a, "dead_a");
            _assert_is_dead(round.state_b, "dead_b");
        } else {
            _assert_is_alive(round.state_a, "alive_a");
            _assert_is_alive(round.state_b, "alive_b");
        }

        let score_a = tester::get_Scoreboard(sys.world, ID(OWNER()).into());
        let score_b = tester::get_Scoreboard(sys.world, ID(OTHER()).into());
        assert_eq!(score_a.score.total_duels, 1, "score_a.score.total_duels");
        assert_eq!(score_b.score.total_duels, 1, "score_b.score.total_duels");
        assert_eq!(score_a.score.total_draws, 1, "score_a.score.total_draws");
        assert_eq!(score_b.score.total_draws, 1, "score_b.score.total_draws");
        assert_eq!(score_a.score.total_wins, 0, "score_a.score.total_wins");
        assert_eq!(score_b.score.total_wins, 0, "score_b.score.total_wins");
        assert_eq!(score_a.score.total_losses, 0, "score_a.score.total_losses");
        assert_eq!(score_b.score.total_losses, 0, "score_b.score.total_losses");

        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "score_a.score.honour");
        assert_eq!(round.state_a.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "score_b.score.honour");
        assert_eq!(score_a.score.honour, round.state_a.honour, "score_a.score.honour");
        assert_eq!(score_b.score.honour, round.state_b.honour, "score_b.score.honour");

        let mut scoreboard_a = tester::get_ScoreboardTable(sys.world, OWNER().into(), table_id);
        let mut scoreboard_b = tester::get_ScoreboardTable(sys.world, OTHER().into(), table_id);
        assert_eq!(score_a.score.total_duels, scoreboard_a.score.total_duels, "scoreboard_a.score.total_duels");
        assert_eq!(score_b.score.total_duels, scoreboard_b.score.total_duels, "scoreboard_b.score.total_duels");
        assert_eq!(score_a.score.honour, scoreboard_a.score.honour, "scoreboard_a.score.honour");
        assert_eq!(score_b.score.honour, scoreboard_b.score.honour, "scoreboard_b.score.honour");

        // tester::assert_balance(sys.lords, sys.game.contract_address, lords_balance_contract, 0, 0, 'lords_balance_contract_2');
        // tester::assert_balance(sys.lords, TREASURY(), 0, 0, lords_fee * 2, 'lords_balance_treasury_2');
        // tester::assert_balance(sys.lords, OWNER(), lords_balance_a, lords_fee, 0, 'lords_balance_a_2');
        // tester::assert_balance(sys.lords, OTHER(), lords_balance_b, lords_fee, 0, 'lords_balance_b_2');

        // duel nft still owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of_END");

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
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];

        let table_id: felt252 = TABLES::PRACTICE;

        let (challenge, _round_1, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);
        assert_eq!(tester::get_Challenge(sys.world, duel_id).get_deck_type(), DeckType::Classic, "challenge.deck_type");
        // tester::assert_balance(sys.lords, sys.game.contract_address, lords_balance_contract, 0, (lords_fee + PRIZE_VALUE) * 2, 'lords_balance_contract_1');
        // tester::assert_balance(sys.lords, OWNER(), lords_balance_a, lords_fee + PRIZE_VALUE, 0, 'lords_balance_a_1');
        // tester::assert_balance(sys.lords, OTHER(), lords_balance_b, lords_fee + PRIZE_VALUE, 0, 'lords_balance_b_1');
        // tester::assert_balance(sys.lords, TREASURY(), 0, 0, 0, 'lords_balance_treasury_1');
        tester::assert_pact(sys, duel_id, challenge, true, true, "started");

        let fame_reward_a: u128 = sys.duelists.calc_fame_reward(duelist_id_a);
        let fame_reward_b: u128 = sys.duelists.calc_fame_reward(duelist_id_b);
        let mut fame_balance_a: u128 = tester::fame_balance_of_token(@sys, duelist_id_a);
        let mut fame_balance_b: u128 = tester::fame_balance_of_token(@sys, duelist_id_b);
        assert_gt!(fame_balance_a, 0, "fame_balance_a_init");
        assert_gt!(fame_balance_b, 0, "fame_balance_b_init");
        assert_ne!(fame_reward_a, 0, "fame_reward_a != 0");
        assert_ne!(fame_reward_b, 0, "fame_reward_b != 0");

        // duel owned by contract
        assert_eq!(sys.duels.owner_of(duel_id.into()), sys.game.contract_address, "duels.owner_of");

        // assert(round_1.moves_a.seed != 0, 'round_1.moves_a.seed');
        // assert(round_1.moves_b.seed != 0, 'round_1.moves_b.seed');
        // assert(round_1.moves_a.seed != round_1.moves_b.seed, 'round_1.moves_a.seed != moves_b');

        // 1st commit
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        let (_challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert_eq!(round.state, RoundState::Commit, "1__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "1__hash");

        // 2nd commit > Reveal
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        let (_challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert_eq!(round.state, RoundState::Reveal, "2__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "21__hash");
        assert_eq!(round.moves_b.hashed, moves_b.hashed, "2__hash");

        // 1st reveal
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        let (_challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert_eq!(round.state, RoundState::Reveal, "3__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "3__hash");
        assert_eq!(round.moves_a.salt, moves_a.salt, "3__salt");
        assert_eq!(round.moves_a.card_1, *moves_a.moves[0], "3__card_fire");
        assert_eq!(round.moves_a.card_2, *moves_a.moves[1], "3__card_dodge");

        // 2nd reveal > Finished
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        tester::assert_pact(sys, duel_id, challenge, false, false, "ended");
// challenge.winner.print();
// // challenge.state.print();
// round.state_a.health.print();
// round.state_b.health.print();
        assert_eq!(challenge.state, ChallengeState::Resolved, "4_challenge.state");
        assert_ne!(challenge.winner, 0, "4_challenge.winner");
        assert_gt!(challenge.timestamp_end, 0, "4_challenge.timestamp_end");
        assert_eq!(round.state, RoundState::Finished, "4__state");
        assert_eq!(round.moves_a.hashed, moves_a.hashed, "43__hash");
        assert_eq!(round.moves_a.salt, moves_a.salt, "43__salt");
        assert_eq!(round.moves_a.card_1.into(), *moves_a.moves[0], "43__card_fire");
        assert_eq!(round.moves_a.card_2.into(), *moves_a.moves[1], "43__card_dodge");
        assert_eq!(round.moves_b.hashed, moves_b.hashed, "4__hash");
        assert_eq!(round.moves_b.salt, moves_b.salt, "4__salt");
        assert_eq!(round.moves_b.card_1.into(), *moves_b.moves[0], "4__card_fire");
        assert_eq!(round.moves_b.card_2.into(), *moves_b.moves[1], "4__card_dodge");
        let final_blow: PacesCard = (if(winner == 1){*moves_a.moves[0]}else{*moves_b.moves[0]}.into());
        assert_eq!(round.final_blow, FinalBlow::Paces(final_blow), "round.final_blow");

        let score_a = tester::get_Scoreboard(sys.world, ID(OWNER()).into());
        let score_b = tester::get_Scoreboard(sys.world, ID(OTHER()).into());
        assert_eq!(score_a.score.total_duels, 1, "score_a.score.total_duels");
        assert_eq!(score_b.score.total_duels, 1, "score_b.score.total_duels");
        assert_eq!(score_a.score.total_draws, 0, "score_a.score.total_draws");
        assert_eq!(score_b.score.total_draws, 0, "score_b.score.total_draws");

        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "score_a.score.honour");
        assert_eq!(round.state_b.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "score_b.score.honour");
        assert_eq!(score_a.score.honour, round.state_a.honour, "score_a.score.honour");
        assert_eq!(score_b.score.honour, round.state_b.honour, "score_b.score.honour");

        assert_eq!(challenge.winner, winner, "winner");

        if (winner == 1) {
            let reward = fame_reward_b;
// println!("fame_reward_a: {}", fame_reward_a / CONST::ETH_TO_WEI.low);
// println!("fame_reward_b: {}", fame_reward_b / CONST::ETH_TO_WEI.low);
// println!("fame_balance_a: {}", fame_balance_a / CONST::ETH_TO_WEI.low);
// println!("fame_balance_b: {}", fame_balance_b / CONST::ETH_TO_WEI.low);
// println!("fame_balance_a_now: {}", tester::fame_balance_of_token(@sys, duelist_id_a) / CONST::ETH_TO_WEI.low);
// println!("fame_balance_b_now: {}", tester::fame_balance_of_token(@sys, duelist_id_b) / CONST::ETH_TO_WEI.low);
            fame_balance_a = tester::assert_balance_token(@sys, duelist_id_a, fame_balance_a, 0, reward, "a_fame_balance_a_end");
            fame_balance_b = tester::assert_balance_token(@sys, duelist_id_b, fame_balance_b, reward, 0, "a_fame_balance_b_end");
            assert_eq!(score_a.score.total_wins, 1, "a_win_duelist_a.total_wins");
            assert_eq!(score_b.score.total_wins, 0, "a_win_duelist_b.total_wins");
            assert_eq!(score_a.score.total_losses, 0, "a_win_duelist_a.total_losses");
            assert_eq!(score_b.score.total_losses, 1, "a_win_duelist_b.total_losses");
            assert_eq!(round.state_a.damage, CONST::FULL_HEALTH, "a_win_damage_a");
            assert_eq!(round.state_a.health, CONST::FULL_HEALTH, "a_win_health_a");
            assert_eq!(round.state_b.health, 0, "a_win_health_b");
            _assert_is_alive(round.state_a, "alive_a");
            _assert_is_dead(round.state_b, "dead_b");
            assert_eq!(sys.duels.owner_of(duel_id.into()), challenge.address_a, "duels.owner_of_END_1");
        } else if (winner == 2) {
            let reward = fame_reward_a;
            fame_balance_a = tester::assert_balance_token(@sys, duelist_id_a, fame_balance_a, reward, 0, "b_fame_balance_a_end");
            fame_balance_b = tester::assert_balance_token(@sys, duelist_id_b, fame_balance_b, 0, reward, "b_fame_balance_b_end");
            assert_eq!(score_a.score.total_wins, 0, "b_win_duelist_a.total_wins");
            assert_eq!(score_b.score.total_wins, 1, "b_win_duelist_b.total_wins");
            assert_eq!(score_a.score.total_losses, 1, "b_win_duelist_a.total_losses");
            assert_eq!(score_b.score.total_losses, 0, "b_win_duelist_b.total_losses");
            assert_eq!(round.state_b.damage, CONST::FULL_HEALTH, "b_win_damage_b");
            assert_eq!(round.state_b.health, CONST::FULL_HEALTH, "b_win_health_b");
            assert_eq!(round.state_a.health, 0, "b_win_health_a");
            _assert_is_alive(round.state_b, "alive_b");
            _assert_is_dead(round.state_a, "dead_a");
            assert_eq!(sys.duels.owner_of(duel_id.into()), challenge.address_b, "duels.owner_of_END_1");
        } else {
            assert!(false, "bad winner");
        }

        // tester::assert_balance(sys.lords, sys.game.contract_address, lords_balance_contract, 0, 0, "lords_balance_contract_2");
        // let lords_balance_treasury = tester::assert_balance(sys.lords, TREASURY(), lords_balance_treasury, 0, lords_fee * 2, "lords_balance_treasury_2");
        // tester::assert_winner_balance(sys.lords, challenge.winner, OWNER(), OTHER(), lords_balance_a, lords_balance_b, lords_fee, PRIZE_VALUE, "lords_balance_winner_2");
        // let lords_balance_a: u128 = sys.lords.balance_of(OWNER()).low;
        // let lords_balance_b: u128 = sys.lords.balance_of(OTHER()).low;

        //
        // Run same challenge again!!!!
        // (to compute totals and scores)
        //
        let fame_reward_a_2: u128 = sys.duelists.calc_fame_reward(duelist_id_a);
        let fame_reward_b_2: u128 = sys.duelists.calc_fame_reward(duelist_id_b);
        assert_ne!(fame_reward_a_2, 0, "fame_reward_a_2 != 0");
        assert_ne!(fame_reward_b_2, 0, "fame_reward_b_2 != 0");

        let (_challenge, _round_2, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), table_id);
        tester::assert_pact(sys, duel_id, challenge, true, true, "started_2");
        // assert(round_2.moves_a.seed != 0, "round_2.moves_a.seed");
        // assert(round_2.moves_b.seed != 0, "round_2.moves_b.seed");
        // assert(round_2.moves_a.seed != round_2.moves_b.seed, "round_2.moves_a.seed != moves_b");
        // assert(round_2.moves_a.seed != round_1.moves_a.seed, "round_2.moves_a.seed != round_1");
        // assert(round_2.moves_b.seed != round_1.moves_b.seed, "round_2.moves_b.seed != round_1");
        // invert player order just for fun, expect same results!
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::assert_pact(sys, duel_id, challenge, false, false, "ended_2");
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        assert_eq!(challenge.state, ChallengeState::Resolved, "challenge.state ++");
        assert_ne!(challenge.winner, 0, "challenge.winner ++");
        assert_gt!(challenge.timestamp_end, 0, "challenge.timestamp_end ++");
        assert_eq!(round.state, RoundState::Finished, "state ++");
        let score_a = tester::get_Scoreboard(sys.world, ID(OWNER()).into());
        let score_b = tester::get_Scoreboard(sys.world, ID(OTHER()).into());
        assert_eq!(score_a.score.total_duels, 2, "score_a.score.total_duels ++");
        assert_eq!(score_b.score.total_duels, 2, "score_b.score.total_duels ++");
        assert_eq!(score_a.score.total_draws, 0, "score_a.score.total_draws ++");
        assert_eq!(score_b.score.total_draws, 0, "score_b.score.total_draws ++");

        assert_eq!(round.state_a.honour, (*moves_a.moves[0] * 10).try_into().unwrap(), "score_a.score.honour ++");
        assert_eq!(round.state_b.honour, (*moves_b.moves[0] * 10).try_into().unwrap(), "score_b.score.honour ++");

        if (winner == 1) {
            let reward = fame_reward_b_2;
            fame_balance_a = tester::assert_balance_token(@sys, duelist_id_a, fame_balance_a, 0, reward, "a_fame_balance_a_end");
            fame_balance_b = tester::assert_balance_token(@sys, duelist_id_b, fame_balance_b, reward, 0, "a_fame_balance_b_end");
            assert_eq!(score_a.score.total_wins, 2, "a_win_duelist_a.total_wins ++");
            assert_eq!(score_b.score.total_wins, 0, "a_win_duelist_b.total_wins ++");
            assert_eq!(score_a.score.total_losses, 0, "a_win_duelist_a.total_losses ++");
            assert_eq!(score_b.score.total_losses, 2, "a_win_duelist_b.total_losses ++");
        } else if (winner == 2) {
            let reward = fame_reward_a_2;
            fame_balance_a = tester::assert_balance_token(@sys, duelist_id_a, fame_balance_a, reward, 0, "b_fame_balance_a_end");
            fame_balance_b = tester::assert_balance_token(@sys, duelist_id_b, fame_balance_b, 0, reward, "b_fame_balance_b_end");
            assert_eq!(score_a.score.total_wins, 0, "b_win_duelist_a.total_wins ++");
            assert_eq!(score_b.score.total_wins, 2, "b_win_duelist_b.total_wins ++");
            assert_eq!(score_a.score.total_losses, 2, "b_win_duelist_a.total_losses ++");
            assert_eq!(score_b.score.total_losses, 0, "b_win_duelist_b.total_losses ++");
        } else {
            assert!(false, "bad winner")
        }

        // tester::assert_balance(sys.lords, sys.game.contract_address, lords_balance_contract, 0, 0, "lords_balance_contract_3");
        // tester::assert_balance(sys.lords, TREASURY(), lords_balance_treasury, 0, lords_fee * 2, "lords_balance_treasury_3");
        // tester::assert_winner_balance(sys.lords, challenge.winner, OWNER(), OTHER(), lords_balance_a, lords_balance_b, lords_fee, PRIZE_VALUE, "lords_balance_winner_3");

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


    //-------------------------------
    // Duelist transfer
    //

    #[test]
    fn test_commit_transferred_duelist_new_owner_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
        // try to commmit with another account
        let (_salts, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        sys.duelists.transfer_from(OWNER(), BUMMER(), ID(OWNER()).into());
        tester::execute_commit_moves_ID(@sys.game, BUMMER(), ID(OWNER()).into(), duel_id, moves_a.hashed);
        // no panic
        let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        assert_eq!(challenge.address_a, BUMMER(), "challenge.address_a_committed");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
    }

    #[test]
    fn test_commit_transferred_duelist_new_owner_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, OTHER(), "challenge.address_b");
        // try to commmit with another account
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        sys.duelists.transfer_from(OTHER(), BUMMER(), ID(OTHER()).into());
        tester::execute_commit_moves_ID(@sys.game, BUMMER(), ID(OTHER()).into(), duel_id, moves_b.hashed);
        // no panic
        let challenge: ChallengeValue = tester::get_ChallengeValue(sys.world, duel_id);
        assert_eq!(challenge.address_a, OWNER(), "challenge.address_a");
        assert_eq!(challenge.address_b, BUMMER(), "challenge.address_b_committed");
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_transferred_duelist_old_owner_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        // try to commmit with another account
        let (_salts, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        sys.duelists.transfer_from(OWNER(), BUMMER(), ID(OWNER()).into());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_transferred_duelist_old_owner_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        // try to commmit with another account
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        sys.duelists.transfer_from(OTHER(), BUMMER(), ID(OTHER()).into());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
    }

    #[test]
    fn test_duelist_is_dead_a_OK() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_a();
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let _duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];

        // Duel 1
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);

        // Duel 2
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 3
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 4
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // no panic!
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist is dead!', 'ENTRYPOINT_FAILED'))]
    fn test_duelist_is_dead_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_a();
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let _duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];

        // Duel 1
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);

        // Duel 2
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 3
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 4
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 5
        // panic here!
        prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
    }

    #[test]
    #[should_panic(expected:('DUEL: Duelist is dead!', 'ENTRYPOINT_FAILED'))]
    fn test_duelist_is_dead_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_b();
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let _duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];

        // Duel 1
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);

        // Duel 2
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 3
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 4
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 5
        // panic here!
        prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
    }

    #[test]
    #[ignore] // TODO: panic on commit/reveal
    #[should_panic(expected:('DUELIST: Duelist A is dead!', 'ENTRYPOINT_FAILED'))]
    fn test_duelist_is_dead_b_XXX() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::DUEL | FLAGS::DUELIST | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);
        let (salts, moves_a, moves_b) = prefabs::get_moves_crit_b();
        sys.rng.set_mocked_values(salts.salts, salts.values);

        let _duelist_id_a: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OWNER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, OTHER())[0];
        let _duelist_id_b: u128 = *tester::execute_claim_welcome_pack(@sys.pack, BUMMER())[0];

        // Duel 1
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);

        // Duel 2
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 3
        let (_, _, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);

        // Duel 4
        let (_, _, duel_id_4) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_, _, duel_id_5) = prefabs::start_get_new_challenge(sys, OWNER(), BUMMER(), TABLES::PRACTICE);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id_4, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id_4, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id_4, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id_4, moves_a.salt, moves_a.moves);

        // panic here!
        tester::execute_commit_moves(@sys.game, BUMMER(), duel_id_5, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id_5, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, BUMMER(), duel_id_5, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id_5, moves_a.salt, moves_a.moves);
    }


    //-------------------------------
    // Commit/Reveal Fails
    //

    #[test]
    fn test_commit_before_reply_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), MESSAGE, TABLES::PRACTICE, 48);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, 0x1212112);
        // no panic!
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Accept challenge first', 'ENTRYPOINT_FAILED'))]
    fn test_commit_before_reply_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let duel_id: u128 = tester::execute_create_duel(@sys.duels, OWNER(), OTHER(), MESSAGE, TABLES::PRACTICE, 48);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, 0x1212112);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duel', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, someone_else, duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_commit_wrong_player_to_address() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        // try to commmit with another account
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, FAKE_OWNER_OF_1(), duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, hashed);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already committed', 'ENTRYPOINT_FAILED'))]
    fn test_commit_already_commit_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let hashed: u128 = make_moves_hash(0x12121, [1, 1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Already revealed', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_already_revealed_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in commit', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_commit() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, _moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Round not in reveal', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_not_in_revea_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, _moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid salt', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_challenge_invalid_salt() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_b.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_a.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 0x0, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Challenge not active', 'ENTRYPOINT_FAILED'))]
    fn test_commit_challenge_finished_commit() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
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
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
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
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 0x12121, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_salt_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, 0x12121, moves_b.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_moves_a() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, [7, 7].span());
    }
    #[test]
    #[should_panic(expected:('PISTOLS: Moves hash mismatch', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_hash_move_b() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_dual_crit();
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OTHER(), duel_id, moves_b.salt, [7, 7].span());
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves count', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_0() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_custom([1].span(), [1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, moves_a.salt, moves_a.moves);
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid moves count', 'ENTRYPOINT_FAILED'))]
    fn test_reveal_invalid_moves_count_1() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        let (_challenge, _round, duel_id) = prefabs::start_get_new_challenge(sys, OWNER(), OTHER(), TABLES::PRACTICE);
        let (_salts, moves_a, moves_b) = prefabs::get_moves_custom([1,1].span(), [1,1].span());
        tester::execute_commit_moves(@sys.game, OTHER(), duel_id, moves_a.hashed);
        tester::execute_commit_moves(@sys.game, OWNER(), duel_id, moves_b.hashed);
        tester::execute_reveal_moves(@sys.game, OWNER(), duel_id, 0x12121, [].span());
    }


}
