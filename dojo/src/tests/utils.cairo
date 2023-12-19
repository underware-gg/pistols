#[cfg(test)]
mod utils {
    use starknet::ContractAddress;
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{
        Duelist, duelist,
        Challenge, challenge,
        Round, round,
    };

    fn setup_world() -> (IWorldDispatcher, IActionsDispatcher) {
        let mut models = array![duelist::TEST_CLASS_HASH, challenge::TEST_CLASS_HASH, round::TEST_CLASS_HASH];
        let world: IWorldDispatcher = spawn_test_world(models);
        let contract_address = world.deploy_contract('salt', actions::TEST_CLASS_HASH.try_into().unwrap());
        (world, IActionsDispatcher { contract_address })
    }

    fn execute_register_duelist(world: IWorldDispatcher, system: IActionsDispatcher, name: felt252) {
        system.register_duelist(name);
    }

    fn execute_register_challenged(world: IWorldDispatcher, system: IActionsDispatcher, name: felt252, challenged_address: ContractAddress) {
        let last_executor = world.executor();
        world.set_executor(challenged_address);
        system.register_duelist(name);
        world.set_executor(last_executor);
    }

    fn execute_create_challenge(world: IWorldDispatcher, system: IActionsDispatcher,
        challenged: ContractAddress,
        pass_code: felt252,
        message: felt252,
        expire_seconds: u64
    ) -> u128 {
        let duel_id: u128 = system.create_challenge(challenged, pass_code, message, expire_seconds);
        (duel_id)
    }

    fn get_world_Duelist(world: IWorldDispatcher, address: ContractAddress) -> Duelist {
        let result: Duelist = get!(world, address, Duelist);
        (result)
    }

    fn get_world_Challenge(world: IWorldDispatcher, duel_id: u128) -> Challenge {
        let result: Challenge = get!(world, duel_id, Challenge);
        (result)
    }

    #[test]
    #[available_gas(10_000)]
    fn test_utils() {
        assert(true != false, 'utils');
    }
}