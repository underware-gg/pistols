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
    use pistols::types::constants::{constants};
    use pistols::systems::utils::{zero_address};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
    use pistols::tests::utils::{utils};


    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const PASS_CODE_1: felt252 = 'Ohayo';
    const MESSAGE_1: felt252 = 'Challenge yaa for a duuel!!';

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;
    const SALT_2_a: u64 = 0x03f8a7e99d723c82;
    const SALT_2_b: u64 = 0x45299a98d9f8ce03;
    
    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress) -> (Challenge, Round) {
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, PASS_CODE_1, MESSAGE_1, expire_seconds);
        utils::elapse_timestamp(timestamp::from_days(1));
        utils::execute_reply_challenge(system, other, duel_id, true);
        let ch = utils::get_Challenge(world, duel_id);
        let round: Round = utils::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress.into(), 'in_progress');
        assert(round.state == RoundState::Commit.into(), 'in_progress');
        (ch, round)
    }

    //-----------------------------------------
    // ACCEPT CHALLENGE
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_accept_state() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 2);
        assert(utils::execute_has_pact(system, other, owner) == false, 'has_pact_no');

        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, PASS_CODE_1, MESSAGE_1, expire_seconds);
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

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_other_accept() {
        let (world, system, owner, other) = utils::setup_world();
        let (challenge, round) = _start_new_challenge(world, system, owner, other);


    }







    // TODO...
    // - test invalid moves
    // - test totals
    // - test honor







    //-----------------------------------------
    // Probabilities
    //

    #[test]
    #[available_gas(100_000_000)]
    fn test_hit_kill_maps() {
        assert(MathU8::map(1, 1, 10, constants::CHANCE_HIT_STEP_1, constants::CHANCE_HIT_STEP_10) == constants::CHANCE_HIT_STEP_1, 'CHANCE_HIT_STEP_1');
        assert(MathU8::map(10, 1, 10, constants::CHANCE_HIT_STEP_1, constants::CHANCE_HIT_STEP_10) == constants::CHANCE_HIT_STEP_10, 'CHANCE_HIT_STEP_10');
        assert(MathU8::map(1, 1, 10, constants::CHANCE_KILL_STEP_1, constants::CHANCE_KILL_STEP_10) == constants::CHANCE_KILL_STEP_1, 'CHANCE_KILL_STEP_1');
        assert(MathU8::map(10, 1, 10, constants::CHANCE_KILL_STEP_1, constants::CHANCE_KILL_STEP_10) == constants::CHANCE_KILL_STEP_10, 'CHANCE_KILL_STEP_10');
    }
}
