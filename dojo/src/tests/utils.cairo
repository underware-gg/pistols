#[cfg(test)]
mod utils {
     use starknet::ContractAddress;
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, duelist, Duel, duel};

    fn setup_world() -> (IWorldDispatcher, IActionsDispatcher) {
        let mut models = array![duelist::TEST_CLASS_HASH, duel::TEST_CLASS_HASH];
        let world: IWorldDispatcher = spawn_test_world(models);
        let contract_address = world.deploy_contract('salt', actions::TEST_CLASS_HASH.try_into().unwrap());
        (world, IActionsDispatcher { contract_address })
    }

    fn execute_register_duelist(world: IWorldDispatcher, system: IActionsDispatcher, name: felt252) {
        system.register_duelist(name);
    }

    fn get_world_Duelist(world: IWorldDispatcher, address: ContractAddress) -> Duelist {
        let result: Duelist = get!(world, address, Duelist);
        (result)
    }

    #[test]
    #[available_gas(10_000)]
    fn test_utils() {
        assert(true != false, 'utils');
    }
}