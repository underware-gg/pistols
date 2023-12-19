#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Duelist};
    use pistols::tests::utils::utils::{
        setup_world,
        execute_register_duelist,
        get_world_Duelist,
    };

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_duellist() {
        let (world, system, owner, other) = setup_world();

        let name: felt252 = 'DuelistName';
        execute_register_duelist(system, owner, name);

        let duelist: Duelist = get_world_Duelist(world, owner);
        assert(duelist.name == name, 'duelist name');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_challenged() {
        let (world, system, owner, other) = setup_world();
        let player1_name: felt252 = 'Player_ONE';
        let player2_name: felt252 = 'Player_TWO';
        execute_register_duelist(system, owner, player1_name);
        execute_register_duelist(system, other, player2_name);
        let player1: Duelist = get_world_Duelist(world, owner);
        let player2: Duelist = get_world_Duelist(world, other);
        assert(player1.name == player1_name, 'player1_name');
        assert(player2.name == player2_name, 'player2_name');
    }

}
