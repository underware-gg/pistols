#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::actions::{IActionsDispatcherTrait};
    use pistols::models::duelist::{Duelist, Archetype};
    use pistols::types::constants::{constants};
    use pistols::tests::tester::{tester, tester::{flags, ZERO, OWNER, OTHER, BUMMER, TREASURY}};


    #[test]
    fn test_mint_duelist() {
        let (world, system, _admin, _lords) = tester::setup_world(flags::SYSTEM | flags::ADMIN | 0 | flags::INITIALIZE | 0);
        let player1_name: felt252 = 'Player_ONE';
        let player2_name: felt252 = 'Player_TWO';
        tester::execute_mint_duelist(system, OWNER(), player1_name, 1, '1', Archetype::Undefined);
        tester::execute_mint_duelist(system, OTHER(), player2_name, 2, 'https://wtf.com/wtf.gif', Archetype::Undefined);
        let player1: Duelist = tester::get_Duelist(world, OWNER());
        let player2: Duelist = tester::get_Duelist(world, OTHER());
        assert(player1.name == player1_name, 'player1_name');
        assert(player2.name == player2_name, 'player2_name');
        assert(player1.profile_pic_type == 1, 'player1_pic_type');
        assert(player2.profile_pic_type == 2, 'player2_pic_type');
        assert(player1.profile_pic_uri == "1", 'player1_pic_uri_1');
        assert(player2.profile_pic_uri == "https://wtf.com/wtf.gif", 'player2_pic_uri');
        assert(player1.timestamp > 0, 'duelist timestamp_1');
        assert(player2.timestamp > 0, 'duelist timestamp_2');
        assert(player1.score.total_duels == 0, 'duelist total_duels');
        assert(player1.score.total_honour == 0, 'duelist total_honour');
        assert(player1.score.honour == 0, 'duelist honour');
        assert(player1.score.level_villain == 0, 'level_villain');
        assert(player1.score.level_trickster == 0, 'level_trickster');
        assert(player1.score.level_lord == 0, 'level_lord');
    }

    #[test]
    fn test_mint_duelist_archetype() {
        let (world, system, _admin, _lords) = tester::setup_world(flags::SYSTEM | flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_mint_duelist(system, OWNER(), 'AAA', 1, '1', Archetype::Villainous);
        let duelist: Duelist = tester::get_Duelist(world, OWNER());
        assert(duelist.score.level_villain == 100, 'V_level_villain');
        assert(duelist.score.level_trickster == 0, 'V_level_trickster');
        assert(duelist.score.level_lord == 0, 'V_level_lord');
        tester::execute_mint_duelist(system, OTHER(), 'BBB', 1, '1', Archetype::Trickster);
        let duelist: Duelist = tester::get_Duelist(world, OWNER());
        assert(duelist.score.level_villain == 0, 'T_level_villain');
        assert(duelist.score.level_trickster == 100, 'T_level_trickster');
        assert(duelist.score.level_lord == 0, 'T_level_lord');
        tester::execute_mint_duelist(system, BUMMER(), 'CCC', 1, '1', Archetype::Honourable);
        let duelist: Duelist = tester::get_Duelist(world, OWNER());
        assert(duelist.score.level_villain == 0, 'H_level_villain');
        assert(duelist.score.level_trickster == 0, 'H_level_trickster');
        assert(duelist.score.level_lord == 100, 'H_level_lord');
    }


    #[test]
    fn test_update_duelist() {
        let (world, system, _admin, _lords) = tester::setup_world(flags::SYSTEM | flags::ADMIN | 0 | flags::INITIALIZE | 0);
        let player1_name: felt252 = 'Player_ONE';
        let player2_name: felt252 = 'Player_TWO';
        tester::execute_mint_duelist(system, OWNER(), player1_name, 1, '1', Archetype::Undefined);
        tester::execute_mint_duelist(system, OTHER(), player2_name, 2, '2', Archetype::Undefined);
        tester::execute_update_duelist(system, OWNER(), 'P1', 1, '11');
        tester::execute_update_duelist(system, OTHER(), 'P2', 2, '22');
        let player1: Duelist = tester::get_Duelist(world, OWNER());
        let player2: Duelist = tester::get_Duelist(world, OTHER());
        assert(player1.name == player1_name, 'P1');
        assert(player2.name == player2_name, 'P2');
        assert(player1.profile_pic_uri == "11", 'player2_pic_uri');
        assert(player2.profile_pic_uri == "22", 'player2_pic_uri');
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Invalid duelist', 'ENTRYPOINT_FAILED'))]
    fn test_update_invalid_duelist() {
        let (_world, system, _admin, _lords) = tester::setup_world(flags::SYSTEM | flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_update_duelist(system, OTHER(), 'P1', 1, '11');
    }

    #[test]
    #[should_panic(expected:('PISTOLS: Not your duelist', 'ENTRYPOINT_FAILED'))]
    fn test_update_duelist_not_owner() {
        let (_world, system, _admin, _lords) = tester::setup_world(flags::SYSTEM | flags::ADMIN | 0 | flags::INITIALIZE | 0);
        tester::execute_mint_duelist(system, OWNER(), 'AAA', 1, '1', Archetype::Undefined);
        tester::execute_update_duelist(system, OTHER(), 'P1', 1, '11');
    }

}
