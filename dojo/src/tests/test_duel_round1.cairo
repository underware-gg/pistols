#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::option::OptionTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, Challenge, Round};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::blades::{Blades, BLADES};
    use pistols::types::constants::{constants};
    use pistols::systems::utils::{zero_address, make_move_hash};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::utils::{utils};

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;
    
    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress) -> (Challenge, Round, u128) {
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, MESSAGE_1, expire_seconds);
        utils::elapse_timestamp(timestamp::from_days(1));
        utils::execute_reply_challenge(system, other, duel_id, true);
        let ch = utils::get_Challenge(world, duel_id);
        let round: Round = utils::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
        (ch, round, duel_id)
    }

    fn _get_moves_round_1_resolved() -> (u64, u64, u8, u8, felt252, felt252) {
        let salt_a: u64 = SALT_1_a;
        let salt_b: u64 = SALT_1_b;
        let move_a: u8 = 5;
        let move_b: u8 = 6;
        (salt_a, salt_b, move_a, move_b, make_move_hash(salt_a, move_a), make_move_hash(salt_b, move_b))
    }

    fn _get_moves_round_1_draw() -> (u64, u64, u8, u8, felt252, felt252) {
        let salt_a: u64 = SALT_1_a + 8;
        let salt_b: u64 = SALT_1_b + 8;
        let move_a: u8 = 5;
        let move_b: u8 = 5;
        (salt_a, salt_b, move_a, move_b, make_move_hash(salt_a, move_a), make_move_hash(salt_b, move_b))
    }

    //-----------------------------------------
    // Accept state
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_accept_state() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        assert(utils::execute_has_pact(system, other, owner) == false, 'has_pact_no');

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, MESSAGE_1, expire_seconds);
        let ch = utils::get_Challenge(world, duel_id);
        let (block_number, timestamp) = utils::elapse_timestamp(timestamp::from_days(1));
        let new_state: ChallengeState = utils::execute_reply_challenge(system, other, duel_id, true);
        assert(new_state == ChallengeState::InProgress, 'in_progress');
        assert(utils::execute_has_pact(system, other, owner) == true, 'has_pact_yes');

        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == new_state.into(), 'state');
        assert(ch.round_number == 1, 'round_number');
        assert(ch.timestamp_start == timestamp, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
        
        let round: Round = utils::get_Round(world, duel_id, 1);
        assert(round.duel_id == duel_id, 'round.duel_id');
        assert(round.round_number == 1, 'round.round_number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
    }

    //-----------------------------------------
    // Single Round (steps only)
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_single_round_resolved() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();

        let hit_chance_a = utils::get_pistols_hit_chance(system, owner, move_a);
        let hit_chance_b = utils::get_pistols_hit_chance(system, owner, move_b);
        let kill_chance_a = utils::get_pistols_kill_chance(system, owner, move_a);
        let kill_chance_b = utils::get_pistols_kill_chance(system, owner, move_b);

        // 1st commit
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '1__challenge.round_number');
        assert(round.round_number == 1, '1__round.round_number');
        assert(round.state == RoundState::Commit.into(), '1__state');
        assert(round.duelist_a.hash == hash_a, '1__hash');

        // 2nd commit > Reveal
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '2__challenge.round_number');
        assert(round.round_number == 1, '2__round.round_number');
        assert(round.state == RoundState::Reveal.into(), '2__state');
        assert(round.duelist_a.hash == hash_a, '21__hash');
        assert(round.duelist_b.hash == hash_b, '2__hash');

        // 1st reveal
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.round_number == 1, '3_challenge.round_number');
        assert(round.round_number == 1, '3__round.round_number');
        assert(round.state == RoundState::Reveal.into(), '3__state');
        assert(round.duelist_a.hash == hash_a, '3__hash');
        assert(round.duelist_a.salt == salt_a, '3__salt');
        assert(round.duelist_a.move == move_a, '3__move');

        // 2nd reveal > Finished
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished.into(), '4__state');
        assert(round.duelist_a.hash == hash_a, '43__hash');
        assert(round.duelist_a.salt == salt_a, '43__salt');
        assert(round.duelist_a.move == move_a, '43__move');
        assert(round.duelist_b.hash == hash_b, '4__hash');
        assert(round.duelist_b.salt == salt_b, '4__salt');
        assert(round.duelist_b.move == move_b, '4__move');

        let duelist_a = utils::get_Duelist(world, owner);
        let duelist_b = utils::get_Duelist(world, other);
        assert(duelist_a.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.total_draws == 0, 'duelist_a.total_draws');
        assert(duelist_b.total_draws == 0, 'duelist_b.total_draws');
        assert(duelist_a.total_honour == move_a.into(), 'duelist_a.total_honour');
        assert(duelist_b.total_honour == move_b.into(), 'duelist_b.total_honour');
        assert(duelist_a.honour == (move_a * 10).into(), 'duelist_a.honour');
        assert(duelist_b.honour == (move_b * 10).into(), 'duelist_b.honour');

        if (challenge.winner == 1) {
            assert(duelist_a.total_wins == 1, 'a_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 0, 'a_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 0, 'a_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 1, 'a_win_duelist_b.total_losses');
            assert(round.duelist_a.damage < constants::FULL_HEALTH, 'a_win_damage_a');
            assert(round.duelist_a.health > 0, 'a_win_health_a');
            assert(round.duelist_a.dice1 > 0 && round.duelist_a.dice1 <= hit_chance_a, 'hit_chance_a');
            assert(round.duelist_a.dice2 > 0 && round.duelist_a.dice2 <= kill_chance_a, 'kill_chance_a');
            assert(round.duelist_b.damage == constants::FULL_HEALTH, 'a_win_damage_b');
            assert(round.duelist_b.health == 0, 'a_win_health_b');
        } else if (challenge.winner == 2) {
            assert(duelist_a.total_wins == 0, 'b_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 1, 'b_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 1, 'b_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 0, 'b_win_duelist_b.total_losses');
            assert(round.duelist_b.damage < constants::FULL_HEALTH, 'b_win_damage_b');
            assert(round.duelist_b.health > 0, 'b_win_health_b');
            assert(round.duelist_b.dice1 > 0 && round.duelist_b.dice1 <= hit_chance_b, 'hit_chance_b');
            assert(round.duelist_b.dice2 > 0 && round.duelist_b.dice2 <= kill_chance_b, 'kill_chance_b');
            assert(round.duelist_a.damage == constants::FULL_HEALTH, 'b_win_damage_a');
            assert(round.duelist_a.health == 0, 'b_win_health_a');
        } else {
            assert(false, 'bad winner')
        }

        // Run same challenge to compute totals
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        // invert player order just for fun, expect same results!
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Resolved.into(), '4_challenge.state');
        assert(challenge.winner != 0, '4_challenge.winner');
        assert(challenge.round_number == 1, '4_challenge.round_number');
        assert(challenge.timestamp_end > 0, '4_challenge.timestamp_end');
        assert(round.round_number == 1, '4__round.round_number');
        assert(round.state == RoundState::Finished.into(), '4__state');
        let duelist_a = utils::get_Duelist(world, owner);
        let duelist_b = utils::get_Duelist(world, other);
        assert(duelist_a.total_duels == 2, '__duelist_a.total_duels');
        assert(duelist_b.total_duels == 2, '__duelist_b.total_duels');
        assert(duelist_a.total_draws == 0, '__duelist_a.total_draws');
        assert(duelist_b.total_draws == 0, '__duelist_b.total_draws');
        assert(duelist_a.total_honour == (move_a * 2).into(), '__duelist_a.total_honour');
        assert(duelist_b.total_honour == (move_b * 2).into(), '__duelist_b.total_honour');
        assert(duelist_a.honour == (move_a * 10).into(), '__duelist_a.honour');
        assert(duelist_b.honour == (move_b * 10).into(), '__duelist_b.honour');

        if (challenge.winner == 1) {
            assert(duelist_a.total_wins == 2, '__a_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 0, '__a_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 0, '__a_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 2, '__a_win_duelist_b.total_losses');
        } else if (challenge.winner == 2) {
            assert(duelist_a.total_wins == 0, '__b_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 2, '__b_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 2, '__b_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 0, '__b_win_duelist_b.total_losses');
        } else {
            assert(false, 'bad winner')
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not your Challenge!','ENTRYPOINT_FAILED'))]
    fn test_wrong_player() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        // try to commmit with another account
        let someone_else: ContractAddress = starknet::contract_address_const::<0x999>();
        let hash: felt252 = make_move_hash(0x12121, 0x1);
        utils::execute_commit_move(system, someone_else, duel_id, 1, hash);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Bad Round number','ENTRYPOINT_FAILED'))]
    fn test_wrong_round_number() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash: felt252 = make_move_hash(0x12121, 0x1);
        utils::execute_commit_move(system, owner, duel_id, 2, hash);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already committed','ENTRYPOINT_FAILED'))]
    fn test_already_commit_a() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already committed','ENTRYPOINT_FAILED'))]
    fn test_already_commit_b() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already revealed','ENTRYPOINT_FAILED'))]
    fn test_already_revealed_a() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Already revealed','ENTRYPOINT_FAILED'))]
    fn test_already_revealed_b() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Round not in Commit','ENTRYPOINT_FAILED'))]
    fn test_not_in_commit() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Round not in Reveal','ENTRYPOINT_FAILED'))]
    fn test_not_in_reveal() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Challenge is not In Progress','ENTRYPOINT_FAILED'))]
    fn test_challenge_not_started() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, MESSAGE_1, expire_seconds);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Challenge is not In Progress','ENTRYPOINT_FAILED'))]
    fn test_challenge_finished_commit() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Challenge is not In Progress','ENTRYPOINT_FAILED'))]
    fn test_challenge_finished_reveal() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_a, salt_b, move_a, move_b, hash_a, hash_b) = _get_moves_round_1_resolved();
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, other, duel_id, 1, salt_b, move_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
        utils::execute_reveal_move(system, owner, duel_id, 1, salt_a, move_a);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Move does not match commitment','ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_move_a() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 1);
        let hash_b: felt252 = make_move_hash(0x222, 1);
        utils::execute_commit_move(system, other, duel_id, 1, hash_a);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, 0x111, 2);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Move does not match commitment','ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_salt_a() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 1);
        let hash_b: felt252 = make_move_hash(0x222, 1);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_b);
        utils::execute_commit_move(system, other, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, owner, duel_id, 1, 0x1111, 1);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Move does not match commitment','ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_move_b() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 1);
        let hash_b: felt252 = make_move_hash(0x222, 1);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_b);
        utils::execute_commit_move(system, other, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, other, duel_id, 1, 0x222, 2);
    }
    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Move does not match commitment','ENTRYPOINT_FAILED'))]
    fn test_invalid_hash_salt_b() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 1);
        let hash_b: felt252 = make_move_hash(0x222, 1);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_b);
        utils::execute_commit_move(system, other, duel_id, 1, hash_a);
        utils::execute_reveal_move(system, other, duel_id, 1, 0x2222, 1);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_clamp_steps() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 0);
        let hash_b: felt252 = make_move_hash(0x222, 11);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, 0x111, 0);
        utils::execute_reveal_move(system, other, duel_id, 1, 0x222, 11);
        let round: Round = utils::get_Round(world, duel_id, 1);
        assert(round.duelist_a.move == 1, 'move_0');
        assert(round.duelist_b.move == 10, 'move_11');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_keep_scores() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let hash_a: felt252 = make_move_hash(0x111, 10);
        let hash_b: felt252 = make_move_hash(0x222, 1);
        utils::execute_commit_move(system, owner, duel_id, 1, hash_a);
        utils::execute_commit_move(system, other, duel_id, 1, hash_b);
        utils::execute_reveal_move(system, owner, duel_id, 1, 0x111, 10);
        let duelist_a_before = utils::get_Duelist(world, owner);
        utils::execute_register_duelist(system, owner, 'dssadsa', 3);
        let duelist_a_after = utils::get_Duelist(world, owner);
        assert(duelist_a_before.address == duelist_a_after.address, 'address');
        assert(duelist_a_before.name != duelist_a_after.name, 'name');
        assert(duelist_a_before.profile_pic != duelist_a_after.profile_pic, 'profile_pic');
        assert(duelist_a_before.timestamp == duelist_a_after.timestamp, 'timestamp');
        assert(duelist_a_before.total_duels == duelist_a_after.total_duels, 'total_duels');
        assert(duelist_a_before.total_wins == duelist_a_after.total_wins, 'total_wins');
        assert(duelist_a_before.total_losses == duelist_a_after.total_losses, 'total_losses');
        assert(duelist_a_before.total_draws == duelist_a_after.total_draws, 'total_draws');
        assert(duelist_a_before.total_honour == duelist_a_after.total_honour, 'total_honour');
        assert(duelist_a_before.honour == duelist_a_after.honour, 'honour');
    }
}
