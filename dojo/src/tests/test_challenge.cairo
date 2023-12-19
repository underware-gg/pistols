#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Duelist, Duel};
    use pistols::utils::timestamp::{days_to_timestamp};
    use pistols::tests::utils::utils::{
        setup_world,
        execute_register_duelist,
        execute_create_challenge,
        get_world_Challenge,
    };

    const PLAYER_NAME: felt252 = 'Sensei';
    const PASS_CODE_1: felt252 = 'Ohayo';
    const MESSAGE_1: felt252 = 'Challenge yaa for a duuel!!';

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Challenger is not registered','ENTRYPOINT_FAILED'))]
    fn test_invalid_challenger() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        let challenged_1 = starknet::contract_address_const::<0x111>();
        let duel_id: u128 = execute_create_challenge(world, system, challenged_1, PASS_CODE_1, MESSAGE_1, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Missing challenged address','ENTRYPOINT_FAILED'))]
    // #[should_panic(expected:('Challenge a player or pass_code','ENTRYPOINT_FAILED'))]
    fn test_invalid_code() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        execute_register_duelist(world, system, PLAYER_NAME);
        let challenged_1 = starknet::contract_address_const::<0x0>();
        let duel_id: u128 = execute_create_challenge(world, system, challenged_1, 0, MESSAGE_1, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Invalid expire_seconds','ENTRYPOINT_FAILED'))]
    fn test_invalid_expire() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        execute_register_duelist(world, system, PLAYER_NAME);
        let challenged_1 = starknet::contract_address_const::<0x111>();
        let duel_id: u128 = execute_create_challenge(world, system, challenged_1, PASS_CODE_1, MESSAGE_1, 100);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_address() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        execute_register_duelist(world, system, PLAYER_NAME);

        let challenged: ContractAddress = starknet::contract_address_const::<0x111>();
        let duel_id: u128 = execute_create_challenge(world, system, challenged, 0, MESSAGE_1, 0);
        assert(duel_id > 0, 'duel_id');

        let ch = get_world_Challenge(world, duel_id);
        assert(ch.pass_code == 0, 'pass_code');
        assert(ch.duelist_a == caller, 'challenged');
        assert(ch.duelist_b == challenged, 'challenged');
        assert(ch.message == MESSAGE_1, 'message');
        // assert(ch.timestamp > 0, 'timestamp');
        assert(ch.timestamp_expire == 0, 'timestamp_expire');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_pass_code() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        execute_register_duelist(world, system, PLAYER_NAME);

        let challenged: ContractAddress = starknet::contract_address_const::<0x0>();
        let duel_id: u128 = execute_create_challenge(world, system, challenged, PASS_CODE_1, MESSAGE_1, 0);
        assert(duel_id > 0, 'duel_id');

        let ch = get_world_Challenge(world, duel_id);
        assert(ch.pass_code == PASS_CODE_1, 'pass_code');
        assert(ch.duelist_a == caller, 'challenged');
        assert(ch.duelist_b == challenged, 'challenged');
        assert(ch.message == MESSAGE_1, 'message');
        // assert(ch.timestamp > 0, 'timestamp');
        assert(ch.timestamp_expire == 0, 'timestamp_expire');
    }


    #[test]
    #[available_gas(1_000_000_000)]
    fn test_challenge_expire() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();
        execute_register_duelist(world, system, PLAYER_NAME);

        let challenged: ContractAddress = starknet::contract_address_const::<0x111>();
        let expire_seconds: u64 = 24 * 60 *60 + 1;
        let duel_id: u128 = execute_create_challenge(world, system, challenged, PASS_CODE_1, MESSAGE_1, expire_seconds);
        assert(duel_id > 0, 'duel_id');

        let ch = get_world_Challenge(world, duel_id);
        assert(ch.timestamp_expire == ch.timestamp + expire_seconds, 'timestamp_expire');
    }


}
