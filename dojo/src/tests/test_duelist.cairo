#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::models::{Duelist};
    use pistols::types::constants::{constants};
    use pistols::tests::utils::{utils};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_ChallengeTable() {
        let (world, system, owner, other) = utils::setup_world();

        let name: felt252 = 'DuelistName';
        utils::execute_register_duelist(system, owner, name, 1);

        let duelist: Duelist = utils::get_Duelist(world, owner);
        assert(duelist.name == name, 'duelist name');
        assert(duelist.profile_pic == 1, 'duelist name');
        assert(duelist.timestamp > 0, 'duelist name');
        assert(duelist.honor == constants::FULL_HONOR, 'duelist name');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_register_challenged() {
        let (world, system, owner, other) = utils::setup_world();
        let player1_name: felt252 = 'Player_ONE';
        let player2_name: felt252 = 'Player_TWO';
        utils::execute_register_duelist(system, owner, player1_name, 1);
        utils::execute_register_duelist(system, other, player2_name, 2);
        let player1: Duelist = utils::get_Duelist(world, owner);
        let player2: Duelist = utils::get_Duelist(world, other);
        assert(player1.name == player1_name, 'player1_name');
        assert(player2.name == player2_name, 'player2_name');
        assert(player1.profile_pic == 1, 'player1_pic');
        assert(player2.profile_pic == 2, 'player2_pic');
    }

}
