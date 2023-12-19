#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Duelist, Duel};
    use pistols::tests::utils::utils::{
        setup_world,
        execute_register_duelist,
        get_world_Duelist,
    };

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_duellist() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();

        let name: felt252 = 'DuelistName';
        execute_register_duelist(world, system, name);

        let duelist: Duelist = get_world_Duelist(world, caller);
        assert(duelist.name == name, 'duelist name')
    }

}
