
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::libs::utils;
    use pistols::models::challenge::{Round, Shot};
    use pistols::models::duelist::{Duelist, Score, ScoreTrait};
    use pistols::models::table::{TableType};
    use pistols::models::init::{init};
    use pistols::types::constants::{CONST, HONOUR, CHANCES};
    use pistols::utils::short_string::{ShortString};
    use pistols::tests::tester::{tester, tester::{FLAGS, ZERO, OWNER, OTHER, BUMMER, TREASURY}};

    fn _lord(level: u8) -> Duelist {
        let mut duelist: Duelist = init::Duelist();
        duelist.score.level_lord = level;
        duelist.score.total_duels = 10;
        (duelist)
    }
    fn _villain(level: u8) -> Duelist {
        let mut duelist: Duelist = init::Duelist();
        duelist.score.level_villain = level;
        duelist.score.total_duels = 10;
        (duelist)
    }
    fn _trickster(level: u8) -> Duelist {
        let mut duelist: Duelist = init::Duelist();
        duelist.score.level_trickster = level;
        duelist.score.total_duels = 10;
        (duelist)
    }

    //--------------------------------
    // Archetype levels
    //

    #[test]
    fn test_calc_level_villain() {
        assert(utils::calc_level_villain(0) == HONOUR::LEVEL_MAX, 'honour_0');
        assert(utils::calc_level_villain(HONOUR::VILLAIN_START) == HONOUR::LEVEL_MAX, 'ARCH_VILLAIN_START');
        assert(utils::calc_level_villain(HONOUR::VILLAIN_START+1) < HONOUR::LEVEL_MAX, 'ARCH_VILLAIN_START+1');
        assert(utils::calc_level_villain(HONOUR::TRICKSTER_START-2) > HONOUR::LEVEL_MIN, 'ARCH_TRICKSTER_START-2');
        assert(utils::calc_level_villain(HONOUR::TRICKSTER_START-1) == HONOUR::LEVEL_MIN, 'ARCH_TRICKSTER_START-1');
        assert(utils::calc_level_villain(HONOUR::TRICKSTER_START) == 0, 'ARCH_TRICKSTER_START');
        assert(utils::calc_level_villain(100) == 0, 'honour_100');
    }

    #[test]
    fn test_calc_level_lord() {
        assert(utils::calc_level_lord(0) == 0, 'honour_0');
        assert(utils::calc_level_lord(HONOUR::LORD_START-1) == 0, 'ARCH_LORD_START-1');
        assert(utils::calc_level_lord(HONOUR::LORD_START) == HONOUR::LEVEL_MIN, 'ARCH_LORD_START');
        assert(utils::calc_level_lord(HONOUR::LORD_START+1) > HONOUR::LEVEL_MIN, 'ARCH_LORD_START+1');
        assert(utils::calc_level_lord(HONOUR::MAX-1) < HONOUR::LEVEL_MAX, 'HONOUR::MAX-1');
        assert(utils::calc_level_lord(HONOUR::MAX) == HONOUR::LEVEL_MAX, 'HONOUR::MAX');
    }

    fn _in_range(v: u8, min: u8, max: u8) -> bool {
        (v >= min && v <= max)
    }
    fn _inside_range(v: u8, min: u8, max: u8) -> bool {
        (v > min && v < max)
    }

    #[test]
    fn test_calc_level_trickster() {
        
        assert(utils::calc_level_trickster(10, 100) == 0, 'honour_10');
        assert(utils::calc_level_trickster(HONOUR::TRICKSTER_START-1, 100) == 0, 'ARCH_TRICKSTER_START-1');
        assert(utils::calc_level_trickster(HONOUR::TRICKSTER_START-1, 100) == 0, 'ARCH_TRICKSTER_START-1_00');
        //-------
        assert(utils::calc_level_trickster(HONOUR::TRICKSTER_START, 100) > 0, 'ARCH_TRICKSTER_START');
        assert(utils::calc_level_trickster(HONOUR::TRICKSTER_START, 0) > 0, 'ARCH_TRICKSTER_START_00');
        assert(utils::calc_level_trickster(HONOUR::HALFWAY, 50) >= 50, '50 >= 50');
        assert(utils::calc_level_trickster(HONOUR::HALFWAY, 50) < 60, '50 < 60');
        assert(utils::calc_level_trickster(HONOUR::HALFWAY, 0) == 100, 'zero');
        assert(utils::calc_level_trickster(HONOUR::HALFWAY, HONOUR::VILLAIN_START) == 100, 'villain_100');
        assert(utils::calc_level_trickster(HONOUR::HALFWAY, HONOUR::LEVEL_MAX) == 100, 'lord_100');
        assert(utils::calc_level_trickster(HONOUR::LORD_START-1, 0) > 0, 'ARCH_LORD_START-1');
        //-------
        assert(utils::calc_level_trickster(HONOUR::LORD_START, 100) == 0, 'ARCH_LORD_START');
        assert(utils::calc_level_trickster(HONOUR::LORD_START, 100) == 0, 'ARCH_LORD_START_00');
        assert(utils::calc_level_trickster(100, 100) == 0, 'honour_100');
    }


}
