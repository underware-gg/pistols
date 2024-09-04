
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum TacticsCard {
    Null,
    //
    Insult,
    CoinToss,
    Vengeful,
    ThickCoat,
    Reversal,
    Bananas,
}

mod TACTICS {
    const NULL: u8 = 0;
    const INSULT: u8 = 1;
    const COIN_TOSS: u8 = 2;
    const VENGEFUL: u8 = 3;
    const THICK_COAT: u8 = 4;
    const REVERSAL: u8 = 5;
    const BANANAS: u8 = 6;
}

trait TacticsCardTrait {
    fn is_cool(self: TacticsCard) -> bool;
}

impl TacticsCardImpl of TacticsCardTrait {
    fn is_cool(self: TacticsCard) -> bool {
        match self {
            _ => true,
        }
    }
}


//--------------------
// converters
//

impl TacticsCardIntoU8 of Into<TacticsCard, u8> {
    fn into(self: TacticsCard) -> u8 {
        match self {
            TacticsCard::Insult =>      TACTICS::INSULT,
            TacticsCard::CoinToss =>    TACTICS::COIN_TOSS,
            TacticsCard::Vengeful =>    TACTICS::VENGEFUL,
            TacticsCard::ThickCoat =>   TACTICS::THICK_COAT,
            TacticsCard::Reversal =>    TACTICS::REVERSAL,
            TacticsCard::Bananas =>     TACTICS::BANANAS,
            _ =>                        TACTICS::NULL,
        }
    }
}
impl U8IntoTacticsCard of Into<u8, TacticsCard> {
    fn into(self: u8) -> TacticsCard {
        if self == TACTICS::INSULT          { TacticsCard::Insult }
        else if self == TACTICS::COIN_TOSS  { TacticsCard::CoinToss }
        else if self == TACTICS::VENGEFUL   { TacticsCard::Vengeful }
        else if self == TACTICS::THICK_COAT { TacticsCard::ThickCoat }
        else if self == TACTICS::REVERSAL   { TacticsCard::Reversal }
        else if self == TACTICS::BANANAS    { TacticsCard::Bananas }
        else                                { TacticsCard::Null }
    }
}

