use pistols::models::challenge::{PlayerState};
use pistols::utils::math::{MathU8};

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum TacticsCard {
    None,
    //
    Insult,
    CoinToss,
    Vengeful,
    ThickCoat,
    Reversal,
    Bananas,
}

mod TACTICS {
    const NONE: u8 = 0;
    const INSULT: u8 = 1;
    const COIN_TOSS: u8 = 2;
    const VENGEFUL: u8 = 3;
    const THICK_COAT: u8 = 4;
    const REVERSAL: u8 = 5;
    const BANANAS: u8 = 6;
}


trait TacticsCardTrait {
    fn apply(self: TacticsCard, ref state_self: PlayerState, ref state_other: PlayerState);
}

impl TacticsCardImpl of TacticsCardTrait {
    fn apply(self: TacticsCard, ref state_self: PlayerState, ref state_other: PlayerState) {
        match self {
            TacticsCard::Insult => {
                // state_other.chances -= 10;
                state_other.chances.subi(10);
                state_other.damage += 1;
            },
            TacticsCard::CoinToss => {},
            TacticsCard::Vengeful => {
                state_self.damage += 1;
            },
            TacticsCard::ThickCoat => {
                state_other.damage.subi(1);
            },
            TacticsCard::Reversal => {},
            TacticsCard::Bananas => {
                state_self.chances.subi(10);
                state_other.chances.subi(10);
            },
            TacticsCard::None => {},
        };
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
            _ =>                        TACTICS::NONE,
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
        else                                { TacticsCard::None }
    }
}

