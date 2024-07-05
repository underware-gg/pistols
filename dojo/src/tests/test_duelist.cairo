#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{IActionsDispatcherTrait};
    use pistols::models::duelist::{Duelist};
    use pistols::types::constants::{constants};
    use pistols::tests::tester::{tester, tester::{ZERO, OWNER, OTHER, BUMMER, TREASURY}};


    #[test]
    fn test_update_duelist() {
        let (world, system, _admin, _lords) = tester::setup_world(true, true, false, true, false);
        let player1_name: felt252 = 'Player_ONE';
        let player2_name: felt252 = 'Player_TWO';
        tester::execute_update_duelist(system, OWNER(), player1_name, 1, "1");
        tester::execute_update_duelist(system, OTHER(), player2_name, 1, "2");
        let player1: Duelist = tester::get_Duelist(world, OWNER());
        let player2: Duelist = tester::get_Duelist(world, OTHER());
        assert(player1.name == player1_name, 'player1_name');
        assert(player2.name == player2_name, 'player2_name');
        assert(player1.profile_pic_type == 1, 'player1_pic_type');
        assert(player2.profile_pic_type == 1, 'player2_pic_type');
        assert(player1.profile_pic_uri == "1", 'player2_pic_uri');
        assert(player2.profile_pic_uri == "2", 'player2_pic_uri');

        assert(player1.timestamp > 0, 'duelist timestamp');
        assert(player1.score.total_duels == 0, 'duelist total_duels');
        assert(player1.score.total_honour == 0, 'duelist total_honour');
        assert(player1.score.honour == 0, 'duelist honour');
    }

}
