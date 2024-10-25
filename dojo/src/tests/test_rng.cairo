
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

    #[test]
    fn test_rng() {
        let sys = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212, 34);
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
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212, 34);
        sys.rng.mock_values(
            ['dice_1', 'dice_2', 'dice_3', 'shuffle_1', 'shuffle_2', 'shuffle_3'].span(),
            [1, 22, 34, 1, 22, 34].span(),
        );
        let d1 = dice.throw('dice_1', 100);
        let d2 = dice.throw('dice_2', 100);
        let d3 = dice.throw('dice_3', 100);
        assert(d1 == 1, 'dice_1');
        assert(d2 == 22, 'dice_2');
        assert(d3 == 34, 'dice_3');
        let s1 = dice.shuffle_draw('shuffle_1');
        let s2 = dice.shuffle_draw('shuffle_2');
        let s3 = dice.shuffle_draw('shuffle_3');
        assert(s1 == 1, 'shuffle_1');
        assert(s2 == 22, 'shuffle_2');
        assert(s3 == 34, 'shuffle_3');
    }

    #[test]
    fn test_check_dice_average() {
        let sys = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212, 34);
        // lower limit
        let mut counter: u8 = 0;
        let mut index: usize = 0;
        while (index < 100) {
            let (_, win) = dice.throw_decide('salt', 100, 25);
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
            let (_, win) = dice.throw_decide('salt', 100, 75);
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
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212, 34);
        let mut index: usize = 0;
        while (index < 20) {
            let (_, win) = dice.throw_decide('salt', 10, 0);
            assert(win == false, 'bottom');
            let (_, win) = dice.throw_decide('salt', 10, 10);
            assert(win == true, 'bottom');
            index += 1;
        };
    }

}
