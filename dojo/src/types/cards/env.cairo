
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum EnvCard {
    Null,
    // Common
    CommonDamageUp,
    CommonDamageDown,
    CommonChancesUp,
    CommonChancesDown,
    // Uncommon
    UncommonDamageUp,
    UncommonDamageDown,
    UncommonChancesUp,
    UncommonChancesDown,
    // Special
    SpecialAllShotsHit,
    SpecialAllShotsMiss,
    SpecialDoubleTactics,
    SpecialNoTactics,
}

mod ENV {
    const NULL: u8 = 0;
    const COMMON_DAMAGE_UP: u8 = 1;
    const COMMON_DAMAGE_DOWN: u8 = 2;
    const COMMON_CHANCES_UP: u8 = 3;
    const COMMON_CHANCES_DOWN: u8 = 4;
    const UNCOMMON_DAMAGE_UP: u8 = 5;
    const UNCOMMON_DAMAGE_DOWN: u8 = 6;
    const UNCOMMON_CHANCES_UP: u8 = 7;
    const UNCOMMON_CHANCES_DOWN: u8 = 8;
    const SPECIAL_ALL_SHOTS_HIT: u8 = 9;
    const SPECIAL_ALL_SHOTS_MISS: u8 = 10;
    const SPECIAL_DOUBLE_TACTICS: u8 = 11;
    const SPECIAL_NO_TACTICS: u8 = 12;
}


trait EnvCardTrait {
    fn is_cool(self: EnvCard) -> bool;
}

impl EnvCardImpl of EnvCardTrait {
    fn is_cool(self: EnvCard) -> bool {
        match self {
            _ => true,
        }
    }
}


//--------------------
// converters
//

impl EnvCardIntoU8 of Into<EnvCard, u8> {
    fn into(self: EnvCard) -> u8 {
        match self {
            EnvCard::CommonDamageUp =>          ENV::COMMON_DAMAGE_UP,
            EnvCard::CommonDamageDown =>        ENV::COMMON_DAMAGE_DOWN,
            EnvCard::CommonChancesUp =>         ENV::COMMON_CHANCES_UP,
            EnvCard::CommonChancesDown =>       ENV::COMMON_CHANCES_DOWN,
            EnvCard::UncommonDamageUp =>        ENV::UNCOMMON_DAMAGE_UP,
            EnvCard::UncommonDamageDown =>      ENV::UNCOMMON_DAMAGE_DOWN,
            EnvCard::UncommonChancesUp =>       ENV::UNCOMMON_CHANCES_UP,
            EnvCard::UncommonChancesDown =>     ENV::UNCOMMON_CHANCES_DOWN,
            EnvCard::SpecialAllShotsHit =>      ENV::SPECIAL_ALL_SHOTS_HIT,
            EnvCard::SpecialAllShotsMiss =>     ENV::SPECIAL_ALL_SHOTS_MISS,
            EnvCard::SpecialDoubleTactics =>    ENV::SPECIAL_DOUBLE_TACTICS,
            EnvCard::SpecialNoTactics =>        ENV::SPECIAL_NO_TACTICS,
            EnvCard::Null =>                    ENV::NULL,
        }
    }
}

impl U8IntoEnvCard of Into<u8, EnvCard> {
    fn into(self: u8) -> EnvCard {
        if self == ENV::COMMON_DAMAGE_UP            { EnvCard::CommonDamageUp }
        else if self == ENV::COMMON_DAMAGE_DOWN     { EnvCard::CommonDamageDown }
        else if self == ENV::COMMON_CHANCES_UP      { EnvCard::CommonChancesUp }
        else if self == ENV::COMMON_CHANCES_DOWN    { EnvCard::CommonChancesDown }
        else if self == ENV::UNCOMMON_DAMAGE_UP     { EnvCard::UncommonDamageUp }
        else if self == ENV::UNCOMMON_DAMAGE_DOWN   { EnvCard::UncommonDamageDown }
        else if self == ENV::UNCOMMON_CHANCES_UP    { EnvCard::UncommonChancesUp }
        else if self == ENV::UNCOMMON_CHANCES_DOWN  { EnvCard::UncommonChancesDown }
        else if self == ENV::SPECIAL_ALL_SHOTS_HIT  { EnvCard::SpecialAllShotsHit }
        else if self == ENV::SPECIAL_ALL_SHOTS_MISS { EnvCard::SpecialAllShotsMiss }
        else if self == ENV::SPECIAL_DOUBLE_TACTICS { EnvCard::SpecialDoubleTactics }
        else if self == ENV::SPECIAL_NO_TACTICS     { EnvCard::SpecialNoTactics }
        else                                        { EnvCard::Null }
    }
}
