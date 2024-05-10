
//------------------------------------------------------
// systems::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::systems::{utils};
    use pistols::models::models::{init, Round, Shot, Duelist};
    use pistols::types::constants::{constants, honour, chances};
    use pistols::utils::string::{String};

    #[test]
    #[available_gas(100_000_000)]
    fn test_calc_level_villain() {
        assert(utils::calc_level_villain(0) == honour::LEVEL_MAX, 'honour_0');
        assert(utils::calc_level_villain(honour::VILLAIN_START) == honour::LEVEL_MAX, 'ARCH_VILLAIN_START');
        assert(utils::calc_level_villain(honour::VILLAIN_START+1) < honour::LEVEL_MAX, 'ARCH_VILLAIN_START+1');
        assert(utils::calc_level_villain(honour::TRICKSTER_START-2) > honour::LEVEL_MIN, 'ARCH_TRICKSTER_START-2');
        assert(utils::calc_level_villain(honour::TRICKSTER_START-1) == honour::LEVEL_MIN, 'ARCH_TRICKSTER_START-1');
        assert(utils::calc_level_villain(honour::TRICKSTER_START) == 0, 'ARCH_TRICKSTER_START');
        assert(utils::calc_level_villain(100) == 0, 'honour_100');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_calc_level_lord() {
        assert(utils::calc_level_lord(0) == 0, 'honour_0');
        assert(utils::calc_level_lord(honour::LORD_START-1) == 0, 'ARCH_LORD_START-1');
        assert(utils::calc_level_lord(honour::LORD_START) == honour::LEVEL_MIN, 'ARCH_LORD_START');
        assert(utils::calc_level_lord(honour::LORD_START+1) > honour::LEVEL_MIN, 'ARCH_LORD_START+1');
        assert(utils::calc_level_lord(honour::MAX-1) < honour::LEVEL_MAX, 'honour::MAX-1');
        assert(utils::calc_level_lord(honour::MAX) == honour::LEVEL_MAX, 'honour::MAX');
    }

    fn _in_range(v: u8, min: u8, max: u8) -> bool {
        (v >= min && v <= max)
    }
    fn _inside_range(v: u8, min: u8, max: u8) -> bool {
        (v > min && v < max)
    }

    fn _assert_trickstry(honour: u8, duel_honour: u8, min: u8, max: u8, prefix: felt252) {
        let level_trickster: u8 = utils::calc_level_trickster(honour, duel_honour);
        assert(level_trickster >= min, String::concat(prefix, '_min'));
        assert(level_trickster <= max, String::concat(prefix, '_max'));
        // assert(level_trickster > 30, String::concat(prefix, '_30'));
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_calc_level_trickster() {
        
        assert(utils::calc_level_trickster(10, 100) == 0, 'honour_10');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START-1, 100) == 0, 'ARCH_TRICKSTER_START-1');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START-1, 0) == 0, 'ARCH_TRICKSTER_START-1_00');
        //-------
        assert(utils::calc_level_trickster(honour::TRICKSTER_START, 100) > 0, 'ARCH_TRICKSTER_START');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START, 0) > 0, 'ARCH_TRICKSTER_START_00');

        // let t: u8 = honour::TRICKSTER_START;

        // _assert_trickstry(100, 100, 0, 50, 50, 't_001');
        // _assert_trickstry(100, 100, 100, 100, 100, 't_002');
        // _assert_trickstry(100, 100, 80, 50, 50, 't_003');

        // _assert_trickstry(70, 50, 70, 70, 70, 't_004');
        // _assert_trickstry(30, 50, 70, 70, 70, 't_005');

        assert(utils::calc_level_trickster(honour::LORD_START-1, 100) > 0, 'ARCH_LORD_START-1');
        assert(utils::calc_level_trickster(honour::LORD_START-1-1, 0) > 0, 'ARCH_LORD_START-1_00');
        //-------
        assert(utils::calc_level_trickster(honour::LORD_START, 100) == 0, 'ARCH_LORD_START');
        assert(utils::calc_level_trickster(honour::LORD_START, 0) == 0, 'ARCH_LORD_START_00');
        assert(utils::calc_level_trickster(100, 100) == 0, 'honour_100');
    }



    //
    // Pistol Bonus
    //

    // #[test]
    // #[available_gas(1_000_000_000)]
    // fn test_pistols_bonus() {
    //     let (world, system, _admin, _lords, _ierc20, owner, _other, _bummer, _treasury) = utils::setup_world(true, true);
    //     let name: felt252 = 'DuelistName';
    //     utils::execute_register_duelist(system, owner, name, 1);
    //     let mut duelist: Duelist = utils::get_Duelist(world, owner);
    //     // no bonus at start
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 0, 'bonus_0');
    //     //
    //     // No bonus
    //     duelist.honour = 90;
    //     duelist.total_duels = 100;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 0, 'bonus_0');
    //     // bonus 5
    //     duelist.honour = 95;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 5, 'bonus_5');
    //     // bonus 10
    //     duelist.honour = 100;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 10, 'bonus_10');
    //     // bonus 11
    //     // duelist.honour = 101;
    //     // set!(world,(duelist));
    //     // let bonus: u8 = system.calc_hit_bonus(owner);
    //     // assert(bonus == 10, 'bonus_11');
    //     //
    //     // 1 duel cap
    //     duelist.honour = 100;
    //     duelist.total_duels = 1;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 1, 'bonus_cap_1');
    //     // 5 duel cap
    //     duelist.total_duels = 5;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 5, 'bonus_cap_5');
    //     // 10 duel cap
    //     duelist.total_duels = 10;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 10, 'bonus_cap_10');
    //     // 20 duel cap
    //     duelist.total_duels = 20;
    //     set!(world,(duelist));
    //     let bonus: u8 = system.calc_hit_bonus(owner);
    //     assert(bonus == 10, 'bonus_cap_20');
    // }

}
