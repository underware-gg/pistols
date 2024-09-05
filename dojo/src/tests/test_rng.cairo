
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};
    use pistols::tests::tester::{tester, tester::{FLAGS}};
    use pistols::libs::utils;

    #[test]
    fn test_rng() {
        let sys = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        let r1 = dice.throw('salt_1', 100);
        let r2 = dice.throw('salt_1', 100);
        let r3 = dice.throw('salt_1', 100);
        let r32 = dice.throw('salt_2', 100);
        assert(r1 != 0, 'rng_1_0');
        assert(r1 != r2, 'rng_1_2');
        assert(r2 != r3, 'rng_2_3');
        assert(r3 != r32, 'rng_3_32');
    }

    #[test]
    fn test_mock_rng() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        sys.rng.set_salts(
            ['salt_1', 'salt_2', 'salt_3'].span(),
            [11, 22, 33].span(),
        );
        let r1 = dice.throw('salt_1', 100);
        let r2 = dice.throw('salt_2', 100);
        let r3 = dice.throw('salt_3', 100);
        assert(r1 == 11, 'rng_1');
        assert(r2 == 22, 'rng_1');
        assert(r3 == 33, 'rng_2');
    }

    #[test]
    fn test_check_dice_average() {
        let sys = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        // lower limit
        let mut counter: u8 = 0;
        let mut index: usize = 0;
        while (index < 100) {
            let (_, win) = dice.decide('salt', 100, 25);
            if (win) {
                counter += 1;
            }
            index += 1;
        };
        assert(counter > 10 && counter < 40, 'dices_25');
        // higher limit
        let mut counter: u8 = 0;
        let mut index: usize = 0;
        while (index < 100) {
            let (_, win) = dice.decide('salt', 100, 75);
            if (win) {
                counter += 1;
            }
            index += 1;
        };
        assert(counter > 60 && counter < 90, 'dices_75');
    }

    #[test]
    fn test_check_dice_edges() {
        let sys = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        let mut index: usize = 0;
        while (index < 20) {
            let (_, win) = dice.decide('salt', 10, 0);
            assert(win == false, 'bottom');
            let (_, win) = dice.decide('salt', 10, 10);
            assert(win == true, 'bottom');
            index += 1;
        };
    }

}
