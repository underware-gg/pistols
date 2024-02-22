#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, Challenge, Round};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::action::{Action, ACTION};
    use pistols::types::constants::{constants};
    use pistols::systems::utils::{zero_address, make_action_hash, pack_action_slots, unpack_action_slots};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::utils::{utils};


    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;
    const SALT_2_a: u64 = 0x03f8a7e99d723c82;
    const SALT_2_b: u64 = 0x45299a98d9f8ce03;
    
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

    // both full health
    fn _get_actions_round_1_continue() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 1;
        let salt_b: u64 = SALT_1_b + 1;
        let action_a: u8 = 10;
        let action_b: u8 = 10;
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    // got a winner
    fn _get_actions_round_2_resolved() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 2;
        let salt_b: u64 = SALT_1_b;
        let action_a: u8 = ACTION::FAST_BLADE.into();
        let action_b: u8 = ACTION::IDLE.into();
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_2_draw() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 1;
        let salt_b: u64 = SALT_1_b + 1;
        let action_a: u8 = ACTION::FAST_BLADE.into();
        let action_b: u8 = ACTION::FAST_BLADE.into();
        (salt_a, salt_b, action_a, action_b, make_action_hash(salt_a, action_a.into()), make_action_hash(salt_b, action_b.into()))
    }


    //-----------------------------------------
    // Dual Round (steps + blades)
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_blades_round_draw() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);

        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_1_continue();
        let steps_a = action_1_a;
        let steps_b = action_1_b;
        utils::execute_commit_action(system, owner, duel_id, 1, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 1, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 1, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 1, salt_1_b, action_1_b, 0);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::InProgress.into(), '__challenge.state');
        assert(challenge.round_number == 2, '__challenge.round_number');
        assert(round.round_number == 2, '__round.round_number');
        assert(round.state == RoundState::Commit.into(), '__round.state');
        assert(round.shot_a.hash == 0, '__hash_a');
        assert(round.shot_a.salt == 0, '__salt_a');
        assert(round.shot_a.action == 0, '__action_a');
        assert(round.shot_b.hash == 0, '__hash_b');
        assert(round.shot_b.salt == 0, '__salt_b');
        assert(round.shot_b.action == 0, '__action_b');

        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_2_draw();

        utils::execute_commit_action(system, owner, duel_id, 2, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 2, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 2, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 2, salt_1_b, action_1_b, 0);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Draw.into(), '2__challenge.state');
        assert(challenge.round_number == 2, '2__challenge.round_number');
        assert(challenge.timestamp_end > 0, '2__challenge.timestamp_end');
        assert(round.round_number == 2, '2__round.round_number');
        assert(round.state == RoundState::Finished.into(), '2__round.state');
        assert(round.shot_a.hash == hash_1_a, '2__hash_a');
        assert(round.shot_a.salt == salt_1_a, '2__salt_a');
        assert(round.shot_a.action == action_1_a.into(), '2__action_a');
        assert(round.shot_b.hash == hash_1_b, '2__hash_b');
        assert(round.shot_b.salt == salt_1_b, '2__salt_b');
        assert(round.shot_b.action == action_1_b.into(), '2__action_b');

        let duelist_a = utils::get_Duelist(world, owner);
        let duelist_b = utils::get_Duelist(world, other);
        assert(duelist_a.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.total_draws == 1, 'duelist_a.total_draws');
        assert(duelist_b.total_draws == 1, 'duelist_b.total_draws');
        assert(duelist_a.total_wins == 0, 'duelist_a.total_wins');
        assert(duelist_b.total_wins == 0, 'duelist_b.total_wins');
        assert(duelist_a.total_losses == 0, 'duelist_a.total_losses');
        assert(duelist_b.total_losses == 0, 'duelist_b.total_losses');
        assert(duelist_a.total_honour == (steps_a).into(), '__duelist_a.total_honour');
        assert(duelist_b.total_honour == (steps_b).into(), '__duelist_b.total_honour');
        assert(duelist_a.honour == (steps_a * 10).try_into().unwrap(), '__duelist_a.honour');
        assert(duelist_b.honour == (steps_b * 10).try_into().unwrap(), '__duelist_b.honour');

        // Run same challenge to compute totals
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);
        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_1_continue();
        utils::execute_commit_action(system, owner, duel_id, 1, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 1, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 1, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 1, salt_1_b, action_1_b, 0);

        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_2_draw();
        utils::execute_commit_action(system, owner, duel_id, 2, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 2, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 2, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 2, salt_1_b, action_1_b, 0);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
        assert(challenge.state == ChallengeState::Draw.into(), '2__challenge.state');

        let duelist_a = utils::get_Duelist(world, owner);
        let duelist_b = utils::get_Duelist(world, other);
        assert(duelist_a.total_duels == 2, '2_duelist_a.total_duels');
        assert(duelist_b.total_duels == 2, '2_duelist_b.total_duels');
        assert(duelist_a.total_draws == 2, '2_duelist_a.total_draws');
        assert(duelist_b.total_draws == 2, '2_duelist_b.total_draws');
        assert(duelist_a.total_wins == 0, '2_duelist_a.total_wins');
        assert(duelist_b.total_wins == 0, '2_duelist_b.total_wins');
        assert(duelist_a.total_losses == 0, '2_duelist_a.total_losses');
        assert(duelist_b.total_losses == 0, '2_duelist_b.total_losses');
        assert(duelist_a.total_honour == (steps_a * 2).into(), '2__duelist_a.total_honour');
        assert(duelist_b.total_honour == (steps_b * 2).into(), '2__duelist_b.total_honour');
        assert(duelist_a.honour == (steps_a * 10).try_into().unwrap(), '2__duelist_a.honour');
        assert(duelist_b.honour == (steps_b * 10).try_into().unwrap(), '2__duelist_b.honour');
    }


    #[test]
    #[available_gas(1_000_000_000)]
    fn test_blades_round_resolved() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round, duel_id) = _start_new_challenge(world, system, owner, other);

        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_1_continue();
        let steps_a = action_1_a;
        let steps_b = action_1_b;

        utils::execute_commit_action(system, owner, duel_id, 1, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 1, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 1, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 1, salt_1_b, action_1_b, 0);
        let (challenge, mut round) = utils::get_Challenge_Round(world, duel_id);
        // change round 1 results
        round.shot_a.health = constants::SINGLE_DAMAGE;
        round.shot_b.health = constants::SINGLE_DAMAGE;
        set!(world, (round));
// 'round_1'.print();
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::InProgress.into(), '__challenge.state');
        assert(challenge.round_number == 2, '__challenge.round_number');
        assert(round.round_number == 2, '__round.round_number');
        assert(round.state == RoundState::Commit.into(), '__round.state');
        assert(round.shot_a.hash == 0, '__hash_a');
        assert(round.shot_a.salt == 0, '__salt_a');
        assert(round.shot_a.action == 0, '__action_a');
        assert(round.shot_b.hash == 0, '__hash_b');
        assert(round.shot_b.salt == 0, '__salt_b');
        assert(round.shot_b.action == 0, '__action_b');

        let (salt_1_a, salt_1_b, action_1_a, action_1_b, hash_1_a, hash_1_b) = _get_actions_round_2_resolved();

        utils::execute_commit_action(system, owner, duel_id, 2, hash_1_a);
        utils::execute_commit_action(system, other, duel_id, 2, hash_1_b);
        utils::execute_reveal_action(system, owner, duel_id, 2, salt_1_a, action_1_a, 0);
        utils::execute_reveal_action(system, other, duel_id, 2, salt_1_b, action_1_b, 0);
        let (challenge, round) = utils::get_Challenge_Round(world, duel_id);
// 'round_2'.print();
// round.shot_a.health.print();
// round.shot_b.health.print();
// challenge.state.print();
        assert(challenge.state == ChallengeState::Resolved.into(), '2__challenge.state');
        assert(challenge.round_number == 2, '2__challenge.round_number');
        assert(challenge.timestamp_end > 0, '2__challenge.timestamp_end');
        assert(round.round_number == 2, '2__round.round_number');
        assert(round.state == RoundState::Finished.into(), '2__round.state');
        assert(round.shot_a.hash == hash_1_a, '2__hash_a');
        assert(round.shot_a.salt == salt_1_a, '2__salt_a');
        assert(round.shot_a.action == action_1_a.into(), '2__action_a');
        assert(round.shot_b.hash == hash_1_b, '2__hash_b');
        assert(round.shot_b.salt == salt_1_b, '2__salt_b');
        assert(round.shot_b.action == action_1_b.into(), '2__action_b');

        let duelist_a = utils::get_Duelist(world, owner);
        let duelist_b = utils::get_Duelist(world, other);
        assert(duelist_a.total_duels == 1, 'duelist_a.total_duels');
        assert(duelist_b.total_duels == 1, 'duelist_b.total_duels');
        assert(duelist_a.total_draws == 0, 'duelist_a.total_draws');
        assert(duelist_b.total_draws == 0, 'duelist_b.total_draws');
        assert(duelist_a.total_honour == steps_a.into(), 'duelist_a.total_honour');
        assert(duelist_b.total_honour == steps_b.into(), 'duelist_b.total_honour');
        assert(duelist_a.honour == (steps_a * 10).try_into().unwrap(), 'duelist_a.honour');
        assert(duelist_b.honour == (steps_b * 10).try_into().unwrap(), 'duelist_b.honour');

        if (challenge.winner == 1) {
            assert(duelist_a.total_wins == 1, 'a_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 0, 'a_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 0, 'a_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 1, 'a_win_duelist_b.total_losses');
            assert(round.shot_a.damage == 0, 'a_win_damage_a');
            assert(round.shot_a.health > 0, 'a_win_health_a');
            assert(round.shot_b.damage > 0, 'a_win_damage_b');
            assert(round.shot_b.health == 0, 'a_win_health_b');
        } else if (challenge.winner == 2) {
            assert(duelist_a.total_wins == 0, 'b_win_duelist_a.total_wins');
            assert(duelist_b.total_wins == 1, 'b_win_duelist_b.total_wins');
            assert(duelist_a.total_losses == 1, 'b_win_duelist_a.total_losses');
            assert(duelist_b.total_losses == 0, 'b_win_duelist_b.total_losses');
            assert(round.shot_b.damage == 0, 'b_win_damage_b');
            assert(round.shot_b.health > 0, 'b_win_health_b');
            assert(round.shot_a.damage > 0, 'b_win_damage_a');
            assert(round.shot_a.health == 0, 'b_win_health_a');
        } else {
            assert(false, 'bad winner')
        }
    }
}
