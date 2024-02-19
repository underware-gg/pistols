use traits::Into;
use debug::PrintTrait;

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum Blades {
    Idle,
    Light,
    Heavy,
    Block,
}

mod BLADES {
    const IDLE: u16 = 0;
    const LIGHT: u16 = 1;
    const HEAVY: u16 = 2;
    const BLOCK: u16 = 3;
}

impl BladesIntoU8 of Into<Blades, u16> {
    fn into(self: Blades) -> u16 {
        match self {
            Blades::Idle =>     BLADES::IDLE,
            Blades::Light =>    BLADES::LIGHT,
            Blades::Heavy =>    BLADES::HEAVY,
            Blades::Block =>    BLADES::BLOCK,
        }
    }
}

impl TryU8IntoBlades of TryInto<u16, Blades> {
    fn try_into(self: u16) -> Option<Blades> {
        if self == BLADES::IDLE         { Option::Some(Blades::Idle) }
        else if self == BLADES::LIGHT   { Option::Some(Blades::Light) }
        else if self == BLADES::HEAVY   { Option::Some(Blades::Heavy) }
        else if self == BLADES::BLOCK   { Option::Some(Blades::Block) }
        else { Option::None }
    }
}

impl BladesIntoFelt252 of Into<Blades, felt252> {
    fn into(self: Blades) -> felt252 {
        match self {
            Blades::Idle =>     'Idle',
            Blades::Light =>    'Light',
            Blades::Heavy =>    'Heavy',
            Blades::Block =>    'Block',
        }
    }
}

impl TryFelt252IntoBlades of TryInto<felt252, Blades> {
    fn try_into(self: felt252) -> Option<Blades> {
        if self == 0            { Option::Some(Blades::Idle) }
        else if self == 'Idle'  { Option::Some(Blades::Idle) }
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

