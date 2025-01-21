
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::systems::rng_mock::{IRngMockDispatcher, IRngMockDispatcherTrait, mock_shuffle_values};
    use pistols::systems::rng::{Dice, DiceTrait, Shuffle, ShuffleTrait};
    use pistols::types::shuffler::{ShufflerTrait};
    use pistols::tests::tester::{tester, tester::{TestSystems, FLAGS}};

    #[test]
    fn test_dice_throw() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(sys.rng.contract_address, 0x1212121212);
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
    fn test_dice_average() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(sys.rng.contract_address, 0x1212121212);
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
    fn test_dice_edges() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(sys.rng.contract_address, 0x1212121212);
        let mut index: usize = 0;
        while (index < 20) {
            let (_, win) = dice.throw_decide('salt', 10, 0);
            assert(win == false, 'bottom');
            let (_, win) = dice.throw_decide('salt', 10, 10);
            assert(win == true, 'bottom');
            index += 1;
        };
    }

    #[test]
    fn test_shuffle_draw_next() {
        let size: usize = ShufflerTrait::MAX.into();
        let mut sys: TestSystems = tester::setup_world(0);
        let mut shuffle: Shuffle = ShuffleTrait::new(sys.rng.contract_address, 0x1212121212, size.try_into().unwrap(), 'salt');

        let mut last_seed: felt252 = 0;
        let mut last_card: u8 = 255;

        let mut n: usize = 1;
        while (n <= size) {
            let value = shuffle.draw_next();
// println!("shuffle {}:{}", n, s);
// shuffle.seed.print();
            assert(last_seed != shuffle.seed, 'shuffle_seed');
            assert(last_card != shuffle.last_card, 'last_card');
            assert(last_card != value, 'value');
            last_seed = shuffle.seed;
            last_card = shuffle.last_card;
            n += 1;
        };
    }

    //-------------------------------
    // mock
    //

    #[test]
    fn test_rng_mock_dice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        sys.rng.mock_values(
            ['dice_1', 'dice_2', 'dice_3'].span(),
            [1, 22, 34].span(),
        );
        let mut dice: Dice = DiceTrait::new(sys.rng.contract_address, 0x1212121212);
        let d1 = dice.throw('dice_1', 100);
        let d2 = dice.throw('dice_2', 100);
        let d3 = dice.throw('dice_3', 100);
        assert(d1 == 1, 'dice_1');
        assert(d2 == 22, 'dice_2');
        assert(d3 == 34, 'dice_3');
    }

    #[test]
    fn test_rng_mock_shuffle() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        sys.rng.mock_values(
            ['shuffle'].span(),
            [mock_shuffle_values([1, 22, 34].span())].span(),
        );
        let mut shuffle: Shuffle = ShuffleTrait::new(sys.rng.contract_address, 0x1212121212, 34, 'shuffle');
        let s1 = shuffle.draw_next();
        let s2 = shuffle.draw_next();
        let s3 = shuffle.draw_next();
        // println!("shuffle {} {} {}", s1, s2, s3);
        assert(s1 == 1, 'shuffle_1');
        assert(s2 == 22, 'shuffle_2');
        assert(s3 == 34, 'shuffle_3');
    }

}
