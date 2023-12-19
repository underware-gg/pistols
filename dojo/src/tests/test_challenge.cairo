#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Duelist, Round};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::systems::utils::{zero_address};
    use pistols::utils::timestamp::{days_to_timestamp};
    use pistols::tests::utils::{utils};

    const PLAYER_NAME: felt252 = 'Sensei';
    const CHALLENGED_NAME: felt252 = 'Senpai';
    const PASS_CODE_1: felt252 = 'Ohayo';
    const MESSAGE_1: felt252 = 'Challenge yaa for a duuel!!';

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Challenger is not registered','ENTRYPOINT_FAILED'))]
    fn test_invalid_challenger() {
        let (world, system, owner, other) = utils::setup_world();
        let challenged_1 = other;
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged_1, PASS_CODE_1, MESSAGE_1, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Missing challenged address','ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player or pass_code','ENTRYPOINT_FAILED'))]
    fn test_invalid_code() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME);
        let challenged_1 = zero_address();
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged_1, 0, MESSAGE_1, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid expire_seconds','ENTRYPOINT_FAILED'))]
    fn test_invalid_expire() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME);
        let challenged_1 = other;
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged_1, PASS_CODE_1, MESSAGE_1, 100);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_address() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME);

        let challenged = other;
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged, 0, MESSAGE_1, 0);
        assert(duel_id > 0, 'duel_id');

        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.pass_code == 0, 'pass_code');
        assert(ch.duelist_a == owner, 'challenged');
        assert(ch.duelist_b == challenged, 'challenged');
        assert(ch.message == MESSAGE_1, 'message');
        assert(ch.timestamp > 0, 'timestamp');
        assert(ch.timestamp_expire == 0, 'timestamp_expire');
        assert(ch.timestamp_start == 0, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_pass_code() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME);

        let challenged = zero_address();
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged, PASS_CODE_1, MESSAGE_1, 0);
        assert(duel_id > 0, 'duel_id');

        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting, 'state');
        assert(ch.pass_code == PASS_CODE_1, 'pass_code');
        assert(ch.duelist_a == owner, 'challenged');
        assert(ch.duelist_b == challenged, 'challenged');
        assert(ch.message == MESSAGE_1, 'message');
        assert(ch.timestamp > 0, 'timestamp');
        assert(ch.timestamp_expire == 0, 'timestamp_expire');
        assert(ch.timestamp_start == 0, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
    }


    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_expire() {
        let (world, system, owner, other) = utils::setup_world();
        utils::execute_register_duelist(system, owner, PLAYER_NAME);

        let challenged = other;
        let expire_seconds: u64 = 24 * 60 *60 + 1;
        let duel_id: u128 = utils::execute_create_challenge(system, owner, challenged, PASS_CODE_1, MESSAGE_1, expire_seconds);
        assert(duel_id > 0, 'duel_id');

        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.timestamp > 0, 'timestamp');
        assert(ch.timestamp_expire == ch.timestamp + expire_seconds, 'timestamp_expire');
        assert(ch.timestamp_start == 0, 'timestamp_start');
        assert(ch.timestamp_end == 0, 'timestamp_end');
    }


}
