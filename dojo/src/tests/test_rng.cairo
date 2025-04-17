//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use pistols::systems::rng_mock::{
        // IRngMockDispatcherTrait,
        ShufflerTrait, RngWrapTrait,
        MockedValue, MockedValueTrait,
    };
    use pistols::systems::rng::{
        Dice, DiceTrait,
        Shuffle, ShuffleTrait,
    };
    use pistols::tests::tester::{
        tester,
        tester::{
            TestSystems, FLAGS,
            IRngMockDispatcherTrait,
        }
    };
    use pistols::libs::seeder::{make_seed};

    #[test]
    fn test_dice_throw() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212);
        let r1 = dice.throw('salt_1', 100);
        let r2 = dice.throw('salt_1', 100);
        let r3 = dice.throw('salt_1', 100);
        let r32 = dice.throw('salt_2', 100);
        assert_ne!(r1, 0, "rng_1_0");
        assert_ne!(r1, r2, "rng_1_2");
        assert_ne!(r2, r3, "rng_2_3");
        assert_ne!(r3, r32, "rng_3_32");
    }

    #[test]
    fn test_dice_average() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212);
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
        assert!(counter > 10 && counter < 40, "dices_25");
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
        assert!(counter > 60 && counter < 90, "dices_75");
    }

    #[test]
    fn test_dice_edges() {
        let mut sys: TestSystems = tester::setup_world(0);
        let mut dice: Dice = DiceTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212);
        let mut index: usize = 0;
        while (index < 20) {
            let (_, win) = dice.throw_decide('salt', 10, 0);
            assert_eq!(win, false, "bottom");
            let (_, win) = dice.throw_decide('salt', 10, 10);
            assert_eq!(win, true, "bottom");
            index += 1;
        };
    }

    #[test]
    fn test_shuffle_draw_next() {
        let size: usize = ShufflerTrait::MAX.into();
        let mut sys: TestSystems = tester::setup_world(0);
        let seed: felt252 = make_seed(sys.rng.contract_address, 1);
        let mut shuffle: Shuffle = ShuffleTrait::new(RngWrapTrait::new(sys.rng.contract_address), seed, size.try_into().unwrap(), 'salt');

        let mut last_seed: felt252 = 0;
        let mut last_card: u8 = 255;
        let mut sum_values: usize = 0;
        let mut sum_indices: usize = 0;

        let mut n: usize = 1;
        while (n <= size) {
            let value: u8 = shuffle.draw_next();
// println!("shuffle({}) > {} of {}", n, value, ShufflerTrait::MAX);
            assert_le!(value.into(), size, "::MAX");
            assert_ne!(last_seed, shuffle.seed, "shuffle_seed");
            assert_ne!(last_card, shuffle.last_card, "last_card");
            assert_ne!(last_card, value, "value");
            last_seed = shuffle.seed;
            last_card = shuffle.last_card;
            sum_values += value.into();
            sum_indices += n;
            n += 1;
        };
        assert_eq!(sum_values, sum_indices, "sum_values");
    }

    //-------------------------------
    // mock
    //

    #[test]
    fn test_rng_mock_dice_wrapped() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::new('dice_1', 1),
            MockedValueTrait::new('dice_2', 22),
            MockedValueTrait::new('dice_3', 34),
        ].span();
        let mut dice: Dice = DiceTrait::new(RngWrapTrait::wrap(sys.rng.contract_address, Option::Some(mocked)), 0x1212121212);
        let d1 = dice.throw('dice_1', 100);
        let d2 = dice.throw('dice_2', 100);
        let d3 = dice.throw('dice_3', 100);
        assert_eq!(d1, 1, "dice_1");
        assert_eq!(d2, 22, "dice_2");
        assert_eq!(d3, 34, "dice_3");
    }

    #[test]
    fn test_rng_mock_dice_mocked() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::new('dice_1', 1),
            MockedValueTrait::new('dice_2', 22),
            MockedValueTrait::new('dice_3', 34),
        ].span();
        sys.rng.mock_values(mocked);
        let mut dice: Dice = DiceTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212);
        let d1 = dice.throw('dice_1', 100);
        let d2 = dice.throw('dice_2', 100);
        let d3 = dice.throw('dice_3', 100);
        assert_eq!(d1, 1, "dice_1");
        assert_eq!(d2, 22, "dice_2");
        assert_eq!(d3, 34, "dice_3");
    }

    #[test]
    fn test_rng_mock_shuffle_wrapped() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::shuffled('shuffle', [1, 22, 34].span()),
        ].span();
        let mut shuffle: Shuffle = ShuffleTrait::new(RngWrapTrait::wrap(sys.rng.contract_address, Option::Some(mocked)), 0x1212121212, 34, 'shuffle');
        let s1 = shuffle.draw_next();
        let s2 = shuffle.draw_next();
        let s3 = shuffle.draw_next();
        assert_eq!(s1, 1, "shuffle_1");
        assert_eq!(s2, 22, "shuffle_2");
        assert_eq!(s3, 34, "shuffle_3");
    }

    #[test]
    fn test_rng_mock_shuffle_mocked() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::shuffled('shuffle', [1, 22, 34].span()),
        ].span();
        sys.rng.mock_values(mocked);
        let mut shuffle: Shuffle = ShuffleTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212, 34, 'shuffle');
        let s1 = shuffle.draw_next();
        let s2 = shuffle.draw_next();
        let s3 = shuffle.draw_next();
        assert_eq!(s1, 1, "shuffle_1");
        assert_eq!(s2, 22, "shuffle_2");
        assert_eq!(s3, 34, "shuffle_3");
    }

    fn _test_rng_mock_shuffle(values: Span<felt252>, size: u8) {
        let mut sys: TestSystems = tester::setup_world(FLAGS::MOCK_RNG);
        let mocked: Span<MockedValue> = [
            MockedValueTrait::shuffled('shuffle', values),
        ].span();
        sys.rng.mock_values(mocked);
        let mut shuffle: Shuffle = ShuffleTrait::new(RngWrapTrait::new(sys.rng.contract_address), 0x1212121212, size, 'shuffle');
        let mut i: usize = 0;
        while (i < size.into()) {
            let v: u8 = (*values[i]).try_into().unwrap();
            let next: u8 = shuffle.draw_next();
            assert_eq!(next, v, "next[{}]: {}", i, v);
            i += 1;
        };
    }

    #[test]
    fn test_rng_mock_shuffle_ascending() {
        _test_rng_mock_shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].span(), 10);
    }

    #[test]
    fn test_rng_mock_shuffle_descending() {
        _test_rng_mock_shuffle([10, 9, 8, 7, 6, 5, 4, 3, 2, 1].span(), 10);
    }

    #[test]
    fn test_rng_mock_shuffle_alternating() {
        _test_rng_mock_shuffle([2, 1, 4, 3, 6, 5, 8, 7, 10, 9].span(), 10);
    }

    #[test]
    fn test_rng_mock_shuffle_loop() {
        _test_rng_mock_shuffle([1, 3, 5, 7, 9, 10, 8, 6, 4, 2].span(), 10);
    }
}
