use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum Blades {
    Null,
    Light,
    Heavy,
    Block,
}

mod ROUND_STATE {
    const NULL: u8 = 0;
    const LIGHT: u8 = 1;
    const HEAVY: u8 = 2;
    const BLOCK: u8 = 6;
}

impl BladesIntoU8 of Into<Blades, u8> {
    fn into(self: Blades) -> u8 {
        match self {
            Blades::Null =>     ROUND_STATE::NULL,
            Blades::Light =>    ROUND_STATE::LIGHT,
            Blades::Heavy =>    ROUND_STATE::HEAVY,
            Blades::Block =>    ROUND_STATE::BLOCK,
        }
    }
}

impl TryU8IntoBlades of TryInto<u8, Blades> {
    fn try_into(self: u8) -> Option<Blades> {
        if self == ROUND_STATE::NULL        { Option::Some(Blades::Null) }
        else if self == ROUND_STATE::LIGHT  { Option::Some(Blades::Light) }
        else if self == ROUND_STATE::HEAVY  { Option::Some(Blades::Heavy) }
        else if self == ROUND_STATE::BLOCK  { Option::Some(Blades::Block) }
        else { Option::None }
    }
}

impl BladesIntoFelt252 of Into<Blades, felt252> {
    fn into(self: Blades) -> felt252 {
        match self {
            Blades::Null =>     0,
            Blades::Light =>    'Light',
            Blades::Heavy =>    'Heavy',
            Blades::Block =>    'Block',
        }
    }
}

impl TryFelt252IntoBlades of TryInto<felt252, Blades> {
    fn try_into(self: felt252) -> Option<Blades> {
        if self == 0            { Option::Some(Blades::Null) }
        else if self == 'Light' { Option::Some(Blades::Light) }
        else if self == 'Heavy' { Option::Some(Blades::Heavy) }
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

