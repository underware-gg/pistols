
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use core::traits::TryInto;

    use pistols::models::models::{init, Round, Shot};
    use pistols::types::action::{Action, ActionTrait, ACTION};
    use pistols::types::constants::{constants, chances};
    use pistols::utils::string::{String};
    use pistols::utils::math::{MathU8};

    #[test]
    #[available_gas(1_000_000)]
    fn test_action_to_paces() {
        assert(Action::Idle.into() == 0_u8, 'Action > 0');
        assert(Action::Paces1.into() == 1_u8, 'Action > 1');
        assert(Action::Paces2.into() == 2_u8, 'Action > 2');
        assert(Action::Paces3.into() == 3_u8, 'Action > 3');
        assert(Action::Paces4.into() == 4_u8, 'Action > 4');
        assert(Action::Paces5.into() == 5_u8, 'Action > 5');
        assert(Action::Paces6.into() == 6_u8, 'Action > 6');
        assert(Action::Paces7.into() == 7_u8, 'Action > 7');
        assert(Action::Paces8.into() == 8_u8, 'Action > 8');
        assert(Action::Paces9.into() == 9_u8, 'Action > 9');
        assert(Action::Paces10.into() == 10_u8, 'Action > 10');

        assert(Action::Idle == 0_u8.into(), '0 > Action');
        assert(Action::Paces1 == 1_u8.into(), '1 > Action');
        assert(Action::Paces2 == 2_u8.into(), '2 > Action');
        assert(Action::Paces3 == 3_u8.into(), '3 > Action');
        assert(Action::Paces4 == 4_u8.into(), '4 > Action');
        assert(Action::Paces5 == 5_u8.into(), '5 > Action');
        assert(Action::Paces6 == 6_u8.into(), '6 > Action');
        assert(Action::Paces7 == 7_u8.into(), '7 > Action');
        assert(Action::Paces8 == 8_u8.into(), '8 > Action');
        assert(Action::Paces9 == 9_u8.into(), '9 > Action');
        assert(Action::Paces10 == 10_u8.into(), '10 > Paces');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_action_is_paces() {
        let mut n: u8 = 0;
        loop {
            if (n > 0xf0) {
                break;
            }
            let action: Action = n.into();
            if (action != Action::Idle) {
                // let paces: u8 = action.into();
                // assert(paces == n, 'Action value is pace');
                let is_pace = action.is_paces();
                assert(is_pace == (n >= 1 && n <= 10), 'action.is_paces()');
                if (is_pace) {
                    let paces: u8 = action.as_paces();
                    assert(paces == n, 'action.as_paces()');
                }
            }
            n += 1;
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_action_honour() {
        let mut n: u8 = 0;
        loop {
            if (n > 0xf0) {
                break;
            }
            let action: Action = n.into();
            if (action != Action::Idle) {
                let is_pace: bool = action.is_paces();
                let action_honour: i8 = action.honour();
                if (is_pace) {
                    assert(action_honour > 0, 'action.honour > 0');
                    assert(MathU8::abs(action_honour) == n, 'action.honour == paces');
                } else if (action == Action::Seppuku) {
                    assert(action_honour == 10, 'action.honour == 10');
                } else if (action.is_runner()) {
                    assert(action_honour == 0, 'action.honour == 0');
                } else {
                    assert(action_honour < 0, 'action.honour < 0');
                }
            }
            n += 1;
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_action_mask() {
        let mut n: u8 = 0;
        loop {
            if (n > 0xf0) {
                break;
            }
            let action: Action = n.into();
            if (action != Action::Idle) {
                let is_pace = action.is_paces();
                if (is_pace) {
                    assert(n & ACTION::PACES_MASK == n, 'pace & ACTION::PACES_MASK');
                    assert(n & ACTION::BLADES_MASK == 0, 'pace & ACTION::BLADES_MASK');
                } else {
                    assert(n & ACTION::PACES_MASK == 0, 'blade & ACTION::PACES_MASK');
                    assert(n & ACTION::BLADES_MASK == n, 'blade & ACTION::BLADES_MASK');
                }
            }
            n += 1;
        }
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_action_paces_priority() {
        let mut duelist = init::Duelist();
        let mut a: u8 = 0;
        loop {
            if (a > 10) { break; }
            let action_a: Action = a.into();

            let mut b: u8 = 0;
            loop {
                if (b > 10) { break; }
                let action_b: Action = b.into();
                let priority: i8 = action_a.roll_priority(action_b, duelist, duelist);
                if (a == 0) {
                    assert(priority == 0, 'a_0')
                } else if (b == 0) {
                    assert(priority == 0, 'b_0')
                } else if (a < b) {
                    assert(priority < 0, 'a<b')
                } else if (a > b) {
                    assert(priority > 0, 'a>b')
                } else {
                    assert(priority == 0, 'a==b')
                }
                b += 1;
            };
            a += 1;
        }
    }

    //-----------------------------------
    // Chances
    //

    #[test]
    #[available_gas(100_000_000)]
    fn test_hit_kill_maps() {
        assert(MathU8::map(1, 1, 10, chances::PISTOLS_KILL_AT_STEP_1, chances::PISTOLS_KILL_AT_STEP_10) == chances::PISTOLS_KILL_AT_STEP_1, 'PISTOLS_KILL_AT_STEP_1');
        assert(MathU8::map(10, 1, 10, chances::PISTOLS_KILL_AT_STEP_1, chances::PISTOLS_KILL_AT_STEP_10) == chances::PISTOLS_KILL_AT_STEP_10, 'PISTOLS_KILL_AT_STEP_10');
        let mapped = MathU8::map(5, 1, 10, chances::PISTOLS_KILL_AT_STEP_1, chances::PISTOLS_KILL_AT_STEP_10);
        assert(mapped > chances::PISTOLS_KILL_AT_STEP_1 && mapped < chances::PISTOLS_KILL_AT_STEP_10, 'PISTOLS_HIT_AT_STEP_5');
        assert(MathU8::map(1, 1, 10, chances::PISTOLS_HIT_AT_STEP_1, chances::PISTOLS_HIT_AT_STEP_10) == chances::PISTOLS_HIT_AT_STEP_1, 'PISTOLS_HIT_AT_STEP_1');
        assert(MathU8::map(10, 1, 10, chances::PISTOLS_HIT_AT_STEP_1, chances::PISTOLS_HIT_AT_STEP_10) == chances::PISTOLS_HIT_AT_STEP_10, 'PISTOLS_HIT_AT_STEP_10');
        let mapped = MathU8::map(5, 1, 10, chances::PISTOLS_HIT_AT_STEP_1, chances::PISTOLS_HIT_AT_STEP_10);
        assert(mapped < chances::PISTOLS_HIT_AT_STEP_1 && mapped > chances::PISTOLS_HIT_AT_STEP_10, 'PISTOLS_HIT_AT_STEP_5');
        assert(MathU8::map(1, 1, 10, chances::PISTOLS_LETHAL_AT_STEP_1, chances::PISTOLS_LETHAL_AT_STEP_10) == chances::PISTOLS_LETHAL_AT_STEP_1, 'PISTOLS_LETHAL_AT_STEP_1');
        assert(MathU8::map(10, 1, 10, chances::PISTOLS_LETHAL_AT_STEP_1, chances::PISTOLS_LETHAL_AT_STEP_10) == chances::PISTOLS_LETHAL_AT_STEP_10, 'PISTOLS_LETHAL_AT_STEP_10');
        let mapped = MathU8::map(5, 1, 10, chances::PISTOLS_LETHAL_AT_STEP_1, chances::PISTOLS_LETHAL_AT_STEP_10);
        assert(mapped < chances::PISTOLS_LETHAL_AT_STEP_1 && mapped > chances::PISTOLS_LETHAL_AT_STEP_10, 'PISTOLS_LETHAL_AT_STEP_5');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_action_chances() {
        assert(Action::Idle.crit_chance() == 0, 'Action::Idle.crit_chance');
        assert(Action::Paces1.crit_chance() == chances::PISTOLS_KILL_AT_STEP_1, 'Action::Paces1.crit_chance');
        assert(Action::Paces3.crit_chance() > chances::PISTOLS_KILL_AT_STEP_1, 'Action::Paces3.crit_chance>');
        assert(Action::Paces8.crit_chance() < chances::PISTOLS_KILL_AT_STEP_10, 'Action::Paces8.crit_chance<');
        assert(Action::Paces10.crit_chance() == chances::PISTOLS_KILL_AT_STEP_10, 'Action::Paces10.crit_chance');
        assert(Action::FastBlade.crit_chance() == chances::BLADES_CRIT, 'Action::FastBlade.crit_chance');
        assert(Action::SlowBlade.crit_chance() == chances::BLADES_CRIT, 'Action::FastBlade.crit_chance');
        assert(Action::Block.crit_chance() == chances::BLADES_CRIT, 'Action::FastBlade.crit_chance');

        assert(Action::Idle.hit_chance() == 0, 'Action::Idle.hit_chance');
        assert(Action::Paces1.hit_chance() == chances::PISTOLS_HIT_AT_STEP_1, 'Action::Paces1.hit_chance');
        assert(Action::Paces3.hit_chance() < chances::PISTOLS_HIT_AT_STEP_1, 'Action::Paces3.hit_chance<');
        assert(Action::Paces8.hit_chance() > chances::PISTOLS_HIT_AT_STEP_10, 'Action::Paces8.hit_chance>');
        assert(Action::Paces10.hit_chance() == chances::PISTOLS_HIT_AT_STEP_10, 'Action::Paces10.hit_chance');
        assert(Action::FastBlade.hit_chance() == chances::BLADES_HIT, 'Action::FastBlade.hit_chance');
        assert(Action::SlowBlade.hit_chance() == chances::BLADES_HIT, 'Action::FastBlade.hit_chance');
        assert(Action::Block.hit_chance() == chances::BLADES_HIT, 'Action::FastBlade.hit_chance');

        assert(Action::Idle.lethal_chance() == 0, 'Action::Idle.lethal_chance');
        assert(Action::Paces1.lethal_chance() == chances::PISTOLS_LETHAL_AT_STEP_1, 'Action::Paces1.lethal_chance');
        assert(Action::Paces3.lethal_chance() < chances::PISTOLS_LETHAL_AT_STEP_1, 'Action::Paces3.lethal_chance<');
        assert(Action::Paces8.lethal_chance() > chances::PISTOLS_LETHAL_AT_STEP_10, 'Action::Paces8.lethal_chance>');
        assert(Action::Paces10.lethal_chance() == chances::PISTOLS_LETHAL_AT_STEP_10, 'Action::Paces10.lethal_chance');
        assert(Action::FastBlade.lethal_chance() == 0, '::FastBlade.lethal_chance');
        assert(Action::SlowBlade.lethal_chance() == 0, '::FastBlade.lethal_chance');
        assert(Action::Block.lethal_chance() == 0, '::FastBlade.lethal_chance');
    }


    //-----------------------------------
    // Shot
    //

    #[test]
    #[available_gas(100_000_000)]
    fn test_execute_crit() {
        let mut attack = init::Shot();
        // Paces1
        let mut defend = init::Shot();
        Action::Paces1.execute_crit(ref attack, ref defend);
        assert(defend.damage == constants::FULL_HEALTH, 'Paces1.crit');
        // Paces10
        let mut defend = init::Shot();
        Action::Paces10.execute_crit(ref attack, ref defend);
        assert(defend.damage == constants::FULL_HEALTH, 'Paces10.crit');
        //
        // Blades
        let mut attack = init::Shot();
        let mut defend = init::Shot();
        Action::SlowBlade.execute_crit(ref attack, ref defend);
        assert(defend.damage == constants::FULL_HEALTH, 'SlowBlade');
        let mut defend = init::Shot();
        Action::FastBlade.execute_crit(ref attack, ref defend);
        assert(defend.damage == constants::DOUBLE_DAMAGE, 'FastBlade');
        let mut defend = init::Shot();
        Action::Block.execute_crit(ref attack, ref defend);
        assert(defend.damage == 0, 'Block.damage');
        assert(attack.block == constants::DOUBLE_DAMAGE, 'Block.block');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_execute_hit() {
        let mut attack = init::Shot();
        //
        // Paces1: 80% of 100%
        attack.chance_hit = chances::PISTOLS_HIT_AT_STEP_1;
        attack.dice_hit = chances::PISTOLS_LETHAL_AT_STEP_1;
        let mut defend = init::Shot();
        Action::Paces1.execute_hit(ref attack, ref defend, Action::Paces1.lethal_chance());
        assert(defend.damage == constants::DOUBLE_DAMAGE, 'Paces1.hit_double');
        attack.dice_hit += 1;
        let mut defend = init::Shot();
        Action::Paces1.execute_hit(ref attack, ref defend, Action::Paces1.lethal_chance());
        assert(defend.damage == constants::SINGLE_DAMAGE, 'Paces1.hit_single');
        //
        // Paces10: 10% of 20%
        attack.chance_hit = chances::PISTOLS_HIT_AT_STEP_10;
        attack.dice_hit = chances::PISTOLS_LETHAL_AT_STEP_10;
        let mut defend = init::Shot();
        Action::Paces10.execute_hit(ref attack, ref defend, Action::Paces10.lethal_chance());
        assert(defend.damage == constants::DOUBLE_DAMAGE, 'Paces10.hit_double');
        attack.dice_hit += 1;
        let mut defend = init::Shot();
        Action::Paces10.execute_hit(ref attack, ref defend, Action::Paces10.lethal_chance());
        assert(defend.damage == constants::SINGLE_DAMAGE, 'Paces10.hit_single');
        //
        // Blades
        let mut attack = init::Shot();
        let mut defend = init::Shot();
        Action::SlowBlade.execute_hit(ref attack, ref defend, Action::SlowBlade.lethal_chance());
        assert(defend.damage == constants::DOUBLE_DAMAGE, 'SlowBlade');
        let mut defend = init::Shot();
        Action::FastBlade.execute_hit(ref attack, ref defend, Action::FastBlade.lethal_chance());
        assert(defend.damage == constants::SINGLE_DAMAGE, 'FastBlade');
        let mut defend = init::Shot();
        Action::Block.execute_hit(ref attack, ref defend, Action::Block.lethal_chance());
        assert(defend.damage == 0, 'Block.damage');
        assert(attack.block == constants::SINGLE_DAMAGE, 'Block.block');
    }


}
