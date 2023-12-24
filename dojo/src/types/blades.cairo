use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum Blades {
    Null,
    Short,
    Long,
    Block,
}

mod ROUND_STATE {
    const NULL: u8 = 0;
    const SHORT: u8 = 1;
    const LONG: u8 = 2;
    const BLOCK: u8 = 6;
}

impl BladesIntoU8 of Into<Blades, u8> {
    fn into(self: Blades) -> u8 {
        match self {
            Blades::Null =>     ROUND_STATE::NULL,
            Blades::Short =>    ROUND_STATE::SHORT,
            Blades::Long =>     ROUND_STATE::LONG,
            Blades::Block =>    ROUND_STATE::BLOCK,
        }
    }
}

impl TryU8IntoBlades of TryInto<u8, Blades> {
    fn try_into(self: u8) -> Option<Blades> {
        if self == ROUND_STATE::NULL        { Option::Some(Blades::Null) }
        else if self == ROUND_STATE::SHORT  { Option::Some(Blades::Short) }
        else if self == ROUND_STATE::LONG   { Option::Some(Blades::Long) }
        else if self == ROUND_STATE::BLOCK  { Option::Some(Blades::Block) }
        else { Option::None }
    }
}

impl BladesIntoFelt252 of Into<Blades, felt252> {
    fn into(self: Blades) -> felt252 {
        match self {
            Blades::Null =>     0,
            Blades::Short =>    'Short',
            Blades::Long =>     'Long',
            Blades::Block =>    'Block',
        }
    }
}

impl TryFelt252IntoBlades of TryInto<felt252, Blades> {
    fn try_into(self: felt252) -> Option<Blades> {
        if self == 0            { Option::Some(Blades::Null) }
        else if self == 'Short' { Option::Some(Blades::Short) }
        else if self == 'Long'  { Option::Some(Blades::Long) }
        else if self == 'Block' { Option::Some(Blades::Block) }
        else { Option::None }
    }
}

impl PrintBlades of PrintTrait<Blades> {
    fn print(self: Blades) {
        let num: felt252 = self.into();
        num.print();
    }
}

