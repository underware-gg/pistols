
//------------------------------------------------------
// systems::utils tests
//
#[cfg(test)]
mod tests {
    use pistols::types::action::ActionTrait;
use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::{utils};
    use pistols::models::models::{init, Round, Shot, Duelist, Score, ScoreTrait, Chances};
    use pistols::types::constants::{constants, honour, chances};
    use pistols::types::action::{Action};
    use pistols::utils::string::{String};
    use pistols::tests::tester::{tester};

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

    #[test]
    #[available_gas(100_000_000)]
    fn test_calc_level_trickster() {
        
        assert(utils::calc_level_trickster(10, 100) == 0, 'honour_10');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START-1, 100) == 0, 'ARCH_TRICKSTER_START-1');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START-1, 100) == 0, 'ARCH_TRICKSTER_START-1_00');
        //-------
        assert(utils::calc_level_trickster(honour::TRICKSTER_START, 100) > 0, 'ARCH_TRICKSTER_START');
        assert(utils::calc_level_trickster(honour::TRICKSTER_START, 0) > 0, 'ARCH_TRICKSTER_START_00');
        assert(utils::calc_level_trickster(honour::HALFWAY, 50) >= 50, '50 >= 50');
        assert(utils::calc_level_trickster(honour::HALFWAY, 50) < 60, '50 < 60');
        assert(utils::calc_level_trickster(honour::HALFWAY, 0) == 100, 'zero');
        assert(utils::calc_level_trickster(honour::HALFWAY, honour::VILLAIN_START) == 100, 'villain_100');
        assert(utils::calc_level_trickster(honour::HALFWAY, honour::LEVEL_MAX) == 100, 'lord_100');
        assert(utils::calc_level_trickster(honour::LORD_START-1, 0) > 0, 'ARCH_LORD_START-1');
        //-------
        assert(utils::calc_level_trickster(honour::LORD_START, 100) == 0, 'ARCH_LORD_START');
        assert(utils::calc_level_trickster(honour::LORD_START, 100) == 0, 'ARCH_LORD_START_00');
        assert(utils::calc_level_trickster(100, 100) == 0, 'honour_100');
    }


    //--------------------------------
    // Bonuses
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_calc_crit_bonus() {
        let mut lord: Duelist = _lord(100);
        assert(lord.score.is_lord(), 'is_lord()');
        //
        // levels
        // set!(world,(lord));
        assert(utils::calc_crit_bonus(lord.score) == chances::CRIT_BONUS_LORD, 'level_100');
        lord.score.level_lord = 90;
        assert(utils::calc_crit_bonus(lord.score) < chances::CRIT_BONUS_LORD, 'level_90');
        lord.score.level_lord = 50;
        assert(utils::calc_crit_bonus(lord.score) == chances::CRIT_BONUS_LORD/2, 'level_50');
        lord.score.level_lord = 10;
        assert(utils::calc_crit_bonus(lord.score) > 0, 'level_10');
        lord.score.level_lord = 0;
        assert(utils::calc_crit_bonus(lord.score) == 0, 'level_0');
        //
        // Clamp to total_duels
        lord.score.level_lord = 100;
        lord.score.total_duels = 9;
        assert(utils::calc_crit_bonus(lord.score) < chances::CRIT_BONUS_LORD, 'total_duels_9');
        lord.score.total_duels = 5;
        assert(utils::calc_crit_bonus(lord.score) == chances::CRIT_BONUS_LORD/2, 'total_duels_5');
        lord.score.total_duels = 1;
        assert(utils::calc_crit_bonus(lord.score) > 0, 'total_duels_1');
        lord.score.total_duels = 0;
        assert(utils::calc_crit_bonus(lord.score) == 0, 'total_duels_0');
        //
        // not for villains
        let villain: Duelist = _villain(100);
        assert(villain.score.is_villain(), 'is_villain()');
        assert(utils::calc_crit_bonus(villain.score) == 0, 'no_villain');
        //
        // tricksters get half
        let mut trickster: Duelist = _trickster(100);
        assert(trickster.score.is_trickster(), 'is_trickster()');
        assert(utils::calc_crit_bonus(trickster.score) == chances::CRIT_BONUS_TRICKSTER, 'trickster_level_100');
        trickster.score.level_trickster = 50;
        assert(utils::calc_crit_bonus(trickster.score) == chances::CRIT_BONUS_TRICKSTER/2, 'trickster_level_50');
        trickster.score.level_trickster = 10;
        assert(utils::calc_crit_bonus(trickster.score) > 0, 'trickster_level_10');
        trickster.score.level_trickster = 0;
        assert(utils::calc_crit_bonus(trickster.score) == 0, 'trickster_level_0');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_calc_hit_bonus() {
        //
        // levels
        let mut villain: Duelist = _villain(100);
        assert(utils::calc_hit_bonus(villain.score) == chances::HIT_BONUS_VILLAIN, 'level_100');
        villain.score.level_villain = 90;
        assert(utils::calc_hit_bonus(villain.score) < chances::HIT_BONUS_VILLAIN, 'level_90');
        villain.score.level_villain = 50;
        assert(utils::calc_hit_bonus(villain.score) == chances::HIT_BONUS_VILLAIN/2, 'level_50');
        villain.score.level_villain = 10;
        assert(utils::calc_hit_bonus(villain.score) > 0, 'level_10');
        villain.score.level_villain = 0;
        assert(utils::calc_hit_bonus(villain.score) == 0, 'level_0');
        //
        // Clamp to total_duels
        villain.score.level_villain = 100;
        villain.score.total_duels = 9;
        assert(utils::calc_hit_bonus(villain.score) < chances::HIT_BONUS_VILLAIN, 'total_duels_9');
        villain.score.total_duels = 5;
        assert(utils::calc_hit_bonus(villain.score) == chances::HIT_BONUS_VILLAIN/2, 'total_duels_5');
        villain.score.total_duels = 1;
        assert(utils::calc_hit_bonus(villain.score) > 0, 'total_duels_1');
        villain.score.total_duels = 0;
        assert(utils::calc_hit_bonus(villain.score) == 0, 'total_duels_0');
        //
        // not for lords
        let lord: Duelist = _lord(100);
        assert(utils::calc_hit_bonus(lord.score) == 0, 'no_lords');
        //
        // tricksters get half
        let mut trickster: Duelist = _trickster(100);
        assert(utils::calc_hit_bonus(trickster.score) == chances::HIT_BONUS_TRICKSTER, 'trickster_level_100');
        trickster.score.level_trickster = 50;   
        assert(utils::calc_hit_bonus(trickster.score) == chances::HIT_BONUS_TRICKSTER/2, 'trickster_level_50');
        trickster.score.level_trickster = 10;
        assert(utils::calc_hit_bonus(trickster.score) > 0, 'trickster_level_10');
        trickster.score.level_trickster = 0;
        assert(utils::calc_hit_bonus(trickster.score) == 0, 'trickster_level_0');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_calc_crit_chances() {
        //
        // no bonus
        let mut lord: Duelist = _lord(0);
        let chances_0: u8 = utils::calc_crit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_0 > 0, 'chances_0 > 0');
        //
        // 50% bonus
        lord.score.level_lord = 50;
        let chances_50: u8 = utils::calc_crit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_50 > 0, 'chances_50 > 0');
        assert(chances_50 > chances_0, 'chances_50 > chances_0');
        //
        // 100% bonus
        lord.score.level_lord = 100;
        let chances_100: u8 = utils::calc_crit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_100 > 0, 'chances_100 > 0');
        assert(chances_100 > chances_50, 'chances_100 > chances_50');
        //
        // TRICKSTER: no bonus
        let mut trickster: Duelist = _trickster(0);
        let trickster_0: u8 = utils::calc_crit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_0 > 0, 'trickster_0 > 0');
        assert(trickster_0 == chances_0, 'trickster_0 ==');
        //
        // 50% bonus
        trickster.score.level_trickster = 50;
        let trickster_50: u8 = utils::calc_crit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_50 > 0, 'trickster_50 > 0');
        assert(trickster_50 > trickster_0, 'trickster_50 > trickster_0');
        assert(trickster_50 < chances_50, 'trickster_50 <');
        //
        // 100% bonus
        trickster.score.level_trickster = 100;
        let trickster_100: u8 = utils::calc_crit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_100 > 0, 'trickster_100 > 0');
        assert(trickster_100 > trickster_50, 'trickster_100 > trickster_50');
        assert(trickster_100 < chances_100, 'trickster_100 <');
        //
        // NO BONUS FOR VILLAINS
        let mut villain: Duelist = _villain(100);
        let villain_0: u8 = utils::calc_crit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(villain_0 > 0, 'villain_0 > 0');
        //
        // 50%
        villain.score.level_villain = 50;
        let villain_50: u8 = utils::calc_crit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(villain_0 == villain_50, 'villain_0 == villain_50');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_calc_hit_chances() {
        //
        // no bonus
        let mut villain: Duelist = _villain(0);
        let chances_0: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_0 > 0, 'chances_0 > 0');
        //
        // 50% bonus
        villain.score.level_villain = 50;
        let chances_50: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_50 > 0, 'chances_50 > 0');
        assert(chances_50 > chances_0, 'chances_50 > chances_0');
        //
        // 100% bonus
        villain.score.level_villain = 100;
        let chances_100: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_100 > 0, 'chances_100 > 0');
        assert(chances_100 > chances_50, 'chances_100 > chances_50');
        //
        // TRICKSTER: no bonus
        let mut trickster: Duelist = _trickster(0);
        let trickster_0: u8 = utils::calc_hit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_0 > 0, 'trickster_0 > 0');
        assert(trickster_0 == chances_0, 'trickster_0 ==');
        //
        // 50% bonus
        trickster.score.level_trickster = 50;
        let trickster_50: u8 = utils::calc_hit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_50 > 0, 'trickster_50 > 0');
        assert(trickster_50 > trickster_0, 'trickster_50 > trickster_0');
        assert(trickster_50 < chances_50, 'trickster_50 <');
        //
        // 100% bonus
        trickster.score.level_trickster = 100;
        let trickster_100: u8 = utils::calc_hit_chances(trickster.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(trickster_100 > 0, 'trickster_100 > 0');
        assert(trickster_100 > trickster_50, 'trickster_100 > trickster_50');
        assert(trickster_100 < chances_100, 'trickster_100 <');
        //
        // NO BONUS FOR LORDS
        let mut lord: Duelist = _lord(0);
        let lord_0: u8 = utils::calc_hit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(lord_0 > 0, 'lord_0 > 0');
        //
        // 50%
        lord.score.level_lord = 50;
        let lord_50: u8 = utils::calc_hit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(lord_0 == lord_50, 'lord_0 == lord_50');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_early_late_bonus() {
        let mut lord: Duelist = _lord(100);
        let mut villain: Duelist = _villain(100);
        let mut trickster: Duelist = _trickster(100);
        // lords have a bonus shooting late
        assert(utils::calc_crit_chances(lord.score, lord.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            > utils::calc_crit_chances(lord.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'lord > lord');
        assert(utils::calc_crit_chances(lord.score, villain.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            > utils::calc_crit_chances(lord.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'lord > lord');
        assert(utils::calc_crit_chances(lord.score, trickster.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            > utils::calc_crit_chances(lord.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'lord > trickster');
        // villains have a bonus shooting early
        assert(utils::calc_crit_chances(villain.score, villain.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            < utils::calc_crit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'villain < villain');
        assert(utils::calc_crit_chances(villain.score, lord.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            < utils::calc_crit_chances(villain.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'villain < lord');
        assert(utils::calc_crit_chances(villain.score, trickster.score, Action::Paces4, Action::Paces5, constants::FULL_HEALTH)
            < utils::calc_crit_chances(villain.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH),
            'villain < trickster');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_trickster_hit_penalty() {
        let mut lord: Duelist = _lord(100);
        let mut villain: Duelist = _villain(100);
        let mut trickster: Duelist = _trickster(100);
        // crit chances are higher agains villain
        let chances_l_v: u8 = utils::calc_crit_chances(lord.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        let chances_l_t: u8 = utils::calc_crit_chances(lord.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_l_v > chances_l_t, 'crit >');
        assert(chances_l_v == chances_l_t + chances::TRICKSTER_CRIT_PENALTY, 'TRICKSTER_CRIT_PENALTY');
        // hit chances are higher agains lord
        let chances_v_l: u8 = utils::calc_hit_chances(villain.score, lord.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        let chances_v_t: u8 = utils::calc_hit_chances(villain.score, trickster.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        assert(chances_v_l > chances_v_t, 'hit >');
        assert(chances_v_l == chances_v_t + chances::TRICKSTER_HIT_PENALTY, 'TRICKSTER_HIT_PENALTY');
        // affects lethal_penalty at same amount
        let lethal_chances_v_l: u8 = utils::calc_lethal_chances(villain.score, lord.score, Action::Paces5, Action::Paces5, chances_v_l);
        let lethal_chances_v_t: u8 = utils::calc_lethal_chances(villain.score, trickster.score, Action::Paces5, Action::Paces5, chances_v_t);
        assert(lethal_chances_v_l > lethal_chances_v_t, 'lethal >');
        assert(lethal_chances_v_l < chances_v_l, 'lethsl < hit');
        let diff_v_l: u8 = (chances_v_l - lethal_chances_v_l);
        let diff_v_t: u8 = (chances_v_t - lethal_chances_v_t);
        assert(diff_v_l == diff_v_t, 'diff');
    }

    fn _lethal_chances(attacker: Duelist, defender: Duelist, attack: Action, defense: Action) -> u8 {
        // let hit_chances: u8 = utils::calc_hit_chances(attacker.score, defender.score, attack, defense, constants::FULL_HEALTH);
        let hit_chances: u8 = 50;
        let lethal_chances: u8 = utils::calc_lethal_chances(attacker.score, defender.score, attack, defense, hit_chances);
        (lethal_chances)
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_lord_lethal_chances() {
        let mut lord: Duelist = _lord(100);
        let mut villain: Duelist = _villain(100);
        let mut trickster: Duelist = _trickster(100);
        // lethal must be equal between non-lords
        let lethal_chances_v_v_early: u8 = _lethal_chances(villain, villain, Action::Paces4, Action::Paces5);
        let lethal_chances_v_v_late: u8 = _lethal_chances(villain, villain, Action::Paces5, Action::Paces4);
        let lethal_chances_v_t_early: u8 = _lethal_chances(villain, trickster, Action::Paces4, Action::Paces5);
        let lethal_chances_v_t_late: u8 = _lethal_chances(villain, trickster, Action::Paces5, Action::Paces4);
        let lethal_chances_t_v_early: u8 = _lethal_chances(trickster, villain, Action::Paces4, Action::Paces5);
        let lethal_chances_t_v_late: u8 = _lethal_chances(trickster, villain, Action::Paces5, Action::Paces4);
        let lethal_chances_t_t_early: u8 = _lethal_chances(trickster, trickster, Action::Paces4, Action::Paces5);
        let lethal_chances_t_t_late: u8 = _lethal_chances(trickster, trickster, Action::Paces5, Action::Paces4);
        let lethal_chances_l_l_early: u8 = _lethal_chances(lord, lord, Action::Paces4, Action::Paces5);
        let lethal_chances_l_l_late: u8 = _lethal_chances(lord, lord, Action::Paces5, Action::Paces4);
        let lethal_chances_base = lethal_chances_v_v_early; // any, all are equal
        assert(lethal_chances_base == lethal_chances_v_v_early, 'lethal_chances_v_v_early');
        assert(lethal_chances_base == lethal_chances_v_t_early, 'lethal_chances_v_t_early');
        assert(lethal_chances_base == lethal_chances_t_v_early, 'lethal_chances_t_v_early');
        assert(lethal_chances_base == lethal_chances_t_t_early, 'lethal_chances_t_t_early');
        assert(lethal_chances_base == lethal_chances_l_l_early, 'lethal_chances_l_l_early');
        assert(lethal_chances_base == lethal_chances_v_v_late, 'lethal_chances_v_v_late');
        assert(lethal_chances_base == lethal_chances_v_t_late, 'lethal_chances_v_t_late');
        assert(lethal_chances_base == lethal_chances_t_v_late, 'lethal_chances_t_v_late');
        assert(lethal_chances_base == lethal_chances_t_t_late, 'lethal_chances_t_t_late');
        assert(lethal_chances_base == lethal_chances_l_l_late, 'lethal_chances_l_l_late');
        // lethal must le lower against lords
        let lethal_chances_l_v_early: u8 = _lethal_chances(lord, villain, Action::Paces4, Action::Paces5);
        let lethal_chances_l_v_late: u8 = _lethal_chances(lord, villain, Action::Paces5, Action::Paces4);
        let lethal_chances_l_t_early: u8 = _lethal_chances(lord, trickster, Action::Paces4, Action::Paces5);
        let lethal_chances_l_t_late: u8 = _lethal_chances(lord, trickster, Action::Paces5, Action::Paces4);
        let lethal_chances_v_l_early: u8 = _lethal_chances(villain, lord, Action::Paces4, Action::Paces5);
        let lethal_chances_v_l_late: u8 = _lethal_chances(villain, lord, Action::Paces5, Action::Paces4);
        let lethal_chances_t_l_early: u8 = _lethal_chances(trickster, lord, Action::Paces4, Action::Paces5);
        let lethal_chances_t_l_late: u8 = _lethal_chances(trickster, lord, Action::Paces5, Action::Paces4);
        assert(lethal_chances_base == lethal_chances_l_v_early, 'lethal_chances_l_v_early');
        assert(lethal_chances_base == lethal_chances_l_t_early, 'lethal_chances_l_t_early');
        assert(lethal_chances_base == lethal_chances_v_l_early, 'lethal_chances_v_l_early');
        assert(lethal_chances_base == lethal_chances_t_l_early, 'lethal_chances_t_l_early');
        assert(lethal_chances_base == lethal_chances_l_v_late, 'lethal_chances_l_v_late');
        assert(lethal_chances_base == lethal_chances_l_t_late, 'lethal_chances_l_t_late');
        assert(lethal_chances_base > lethal_chances_v_l_late, 'lethal_chances_v_l_late');
        assert(lethal_chances_base > lethal_chances_t_l_late, 'lethal_chances_t_l_late');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_calc_lethal_hit_sync() {
        //
        // no bonus
        let mut villain: Duelist = _villain(0);
        let hit_chances_0: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        let lethal_chances_0: u8 = utils::calc_lethal_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, hit_chances_0);
        assert(hit_chances_0 > 0, 'hit_0 > 0');
        assert(lethal_chances_0 > 0, 'lethal_0 > 0');
        assert(lethal_chances_0 < hit_chances_0, ' < hit_0');
        //
        // 50% bonus
        villain.score.level_villain = 50;
        let hit_chances_50: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        let lethal_chances_50: u8 = utils::calc_lethal_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, hit_chances_50);
        assert(hit_chances_50 > 0, 'hit_50 > 0');
        assert(hit_chances_50 > hit_chances_0, 'hit_50 > hit_0');
        assert(lethal_chances_50 > 0, 'lethal_50 > 0');
        assert(lethal_chances_50 > lethal_chances_0, 'lethal_50 > lethal_0');
        assert(lethal_chances_50 < hit_chances_50, 'lethal_50 < hit_50');
        let hit_diff: u8 = (hit_chances_50 - hit_chances_0);
        let lethal_diff: u8 = (lethal_chances_50 - lethal_chances_0);
        assert(hit_diff == lethal_diff, 'diff_50');
        //
        // 100% bonus
        villain.score.level_villain = 100;
        let hit_chances_100: u8 = utils::calc_hit_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, constants::FULL_HEALTH);
        let lethal_chances_100: u8 = utils::calc_lethal_chances(villain.score, villain.score, Action::Paces5, Action::Paces5, hit_chances_100);
        assert(hit_chances_100 > 0, 'hit_100 > 0');
        assert(hit_chances_100 > hit_chances_50, 'hit_100 > hit_50');
        assert(lethal_chances_100 > 0, 'lethal_100 > 0');
        assert(lethal_chances_100 > lethal_chances_50, 'lethal_100 > lethal_50');
        assert(lethal_chances_100 < hit_chances_100, 'lethal_100 < hit_100');
        let hit_diff: u8 = (hit_chances_100 - hit_chances_50);
        let lethal_diff: u8 = (lethal_chances_100 - lethal_chances_50);
        assert(hit_diff == lethal_diff, 'diff_100');
    }

}
