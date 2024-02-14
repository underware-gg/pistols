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
        assert(duelist.profile_pic == 1, 'duelist profile_pic');
        assert(duelist.timestamp > 0, 'duelist timestamp');
        assert(duelist.total_duels == 0, 'duelist total_duels');
        assert(duelist.total_honour == 0, 'duelist total_honour');
        assert(duelist.honour == 0, 'duelist honour');
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

    //
    // Pistol Bonus
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_pistols_bonus() {
        let (world, system, owner, other) = utils::setup_world();
        let name: felt252 = 'DuelistName';
        utils::execute_register_duelist(system, owner, name, 1);
        let mut duelist: Duelist = utils::get_Duelist(world, owner);
        // no bonus at start
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 0, 'bonus_0');
        //
        // No bonus
        duelist.honour = 90;
        duelist.total_duels = 100;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 0, 'bonus_0');
        // bonus 5
        duelist.honour = 95;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 5, 'bonus_5');
        // bonus 10
        duelist.honour = 100;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 10, 'bonus_10');
        // bonus 11
        // duelist.honour = 101;
        // set!(world,(duelist));
        // let bonus: u8 = utils::get_pistols_bonus(system, owner);
        // assert(bonus == 10, 'bonus_11');
        //
        // 1 duel cap
        duelist.honour = 100;
        duelist.total_duels = 1;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 1, 'bonus_cap_1');
        // 5 duel cap
        duelist.total_duels = 5;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 5, 'bonus_cap_5');
        // 10 duel cap
        duelist.total_duels = 10;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 10, 'bonus_cap_10');
        // 20 duel cap
        duelist.total_duels = 20;
        set!(world,(duelist));
        let bonus: u8 = utils::get_pistols_bonus(system, owner);
        assert(bonus == 10, 'bonus_cap_20');
    }

}
