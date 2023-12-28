use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum Steps {
    Null,
    One,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
}

impl StepsIntoU8 of Into<Steps, u8> {
    fn into(self: Steps) -> u8 {
        match self {
            Steps::Null =>  0,
            Steps::One =>   1,
            Steps::Two =>   2,
            Steps::Three => 3,
            Steps::Four =>  4,
            Steps::Five =>  5,
            Steps::Six =>   6,
            Steps::Seven => 7,
            Steps::Eight => 8,
            Steps::Nine =>  9,
            Steps::Ten =>   10,
        }
    }
}

impl TryU8IntoSteps of TryInto<u8, Steps> {
    fn try_into(self: u8) -> Option<Steps> {
        if self == 0        { Option::Some(Steps::Null) }
        else if self == 1   { Option::Some(Steps::One) }
        else if self == 2   { Option::Some(Steps::Two) }
        else if self == 3   { Option::Some(Steps::Three) }
        else if self == 4   { Option::Some(Steps::Four) }
        else if self == 5   { Option::Some(Steps::Five) }
        else if self == 6   { Option::Some(Steps::Six) }
        else if self == 7   { Option::Some(Steps::Seven) }
        else if self == 8   { Option::Some(Steps::Eight) }
        else if self == 9   { Option::Some(Steps::Nine) }
        else if self == 10  { Option::Some(Steps::Ten) }
        else { Option::None }
    }
}

impl PrintSteps of PrintTrait<Steps> {
    fn print(self: Steps) {
        let num: u8 = self.into();
        num.print();
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod tests {
    use core::option::OptionTrait;
    use core::traits::TryInto;
    use debug::PrintTrait;
    use core::traits::Into;

    use pistols::types::steps::{Steps};
    use pistols::tests::utils::{utils};

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_steps() {
        assert(0_u8 == Steps::Null.into(), 'Steps > 0');
        assert(1_u8 == Steps::One.into(), 'Steps > 1');
        assert(2_u8 == Steps::Two.into(), 'Steps > 2');
        assert(3_u8 == Steps::Three.into(), 'Steps > 3');
        assert(4_u8 == Steps::Four.into(), 'Steps > 4');
        assert(5_u8 == Steps::Five.into(), 'Steps > 5');
        assert(6_u8 == Steps::Six.into(), 'Steps > 6');
        assert(7_u8 == Steps::Seven.into(), 'Steps > 7');
        assert(8_u8 == Steps::Eight.into(), 'Steps > 8');
        assert(9_u8 == Steps::Nine.into(), 'Steps > 9');
        assert(10_u8 == Steps::Ten.into(), 'Steps > 10');

        assert(Steps::Null == 0_u8.try_into().unwrap(), '0 > Steps');
        assert(Steps::One == 1_u8.try_into().unwrap(), '1 > Steps');
        assert(Steps::Two == 2_u8.try_into().unwrap(), '2 > Steps');
        assert(Steps::Three == 3_u8.try_into().unwrap(), '3 > Steps');
        assert(Steps::Four == 4_u8.try_into().unwrap(), '4 > Steps');
        assert(Steps::Five == 5_u8.try_into().unwrap(), '5 > Steps');
        assert(Steps::Six == 6_u8.try_into().unwrap(), '6 > Steps');
        assert(Steps::Seven == 7_u8.try_into().unwrap(), '7 > Steps');
        assert(Steps::Eight == 8_u8.try_into().unwrap(), '8 > Steps');
        assert(Steps::Nine == 9_u8.try_into().unwrap(), '9 > Steps');
        assert(Steps::Ten == 10_u8.try_into().unwrap(), '10 > Steps');
    }
}
