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
        execute_register_challenged,
        get_world_Duelist,
    };

    fn challenged_address() -> ContractAddress {
        (starknet::contract_address_const::<0x111>())
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_duellist() {
        let (world, system) = setup_world();
        let caller = starknet::get_caller_address();

        let name: felt252 = 'DuelistName';
        execute_register_duelist(world, system, name);

        let duelist: Duelist = get_world_Duelist(world, caller);
        assert(duelist.name == name, 'duelist name');
    }

//     #[test]
//     #[available_gas(1_000_000_000)]
//     fn test_register_challenged() {
//         let (world, system) = setup_world();
//         let caller = starknet::get_caller_address();

//         let player1_name: felt252 = 'Player_ONE';
//         let player2_name: felt252 = 'Player_TWO';
//         execute_register_duelist(world, system, player1_name);
//         execute_register_challenged(world, system, player2_name, challenged_address());
//         let player1: Duelist = get_world_Duelist(world, caller);
//         let player2: Duelist = get_world_Duelist(world, challenged_address());
// // challenged.name.print();
// // let duelist: Duelist = get_world_Duelist(world, caller);
// // duelist.name.print();
//         assert(player1.name == player1_name, 'player1_name');
//         assert(player2.name == player2_name, 'player2_name');
//     }

}
