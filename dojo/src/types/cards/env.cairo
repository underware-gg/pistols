
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
enum EnvCard {
    None,
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

//--------------------
// constants
//

mod ENV_CARDS {
    const NONE: u8 = 0;
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


//--------------------
// traits
//

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
            EnvCard::CommonDamageUp =>          ENV_CARDS::COMMON_DAMAGE_UP,
            EnvCard::CommonDamageDown =>        ENV_CARDS::COMMON_DAMAGE_DOWN,
            EnvCard::CommonChancesUp =>         ENV_CARDS::COMMON_CHANCES_UP,
            EnvCard::CommonChancesDown =>       ENV_CARDS::COMMON_CHANCES_DOWN,
            EnvCard::UncommonDamageUp =>        ENV_CARDS::UNCOMMON_DAMAGE_UP,
            EnvCard::UncommonDamageDown =>      ENV_CARDS::UNCOMMON_DAMAGE_DOWN,
            EnvCard::UncommonChancesUp =>       ENV_CARDS::UNCOMMON_CHANCES_UP,
            EnvCard::UncommonChancesDown =>     ENV_CARDS::UNCOMMON_CHANCES_DOWN,
            EnvCard::SpecialAllShotsHit =>      ENV_CARDS::SPECIAL_ALL_SHOTS_HIT,
            EnvCard::SpecialAllShotsMiss =>     ENV_CARDS::SPECIAL_ALL_SHOTS_MISS,
            EnvCard::SpecialDoubleTactics =>    ENV_CARDS::SPECIAL_DOUBLE_TACTICS,
            EnvCard::SpecialNoTactics =>        ENV_CARDS::SPECIAL_NO_TACTICS,
            EnvCard::None =>                    ENV_CARDS::NONE,
        }
    }
}

impl U8IntoEnvCard of Into<u8, EnvCard> {
    fn into(self: u8) -> EnvCard {
        if self == ENV_CARDS::COMMON_DAMAGE_UP              { EnvCard::CommonDamageUp }
        else if self == ENV_CARDS::COMMON_DAMAGE_DOWN       { EnvCard::CommonDamageDown }
        else if self == ENV_CARDS::COMMON_CHANCES_UP        { EnvCard::CommonChancesUp }
        else if self == ENV_CARDS::COMMON_CHANCES_DOWN      { EnvCard::CommonChancesDown }
        else if self == ENV_CARDS::UNCOMMON_DAMAGE_UP       { EnvCard::UncommonDamageUp }
        else if self == ENV_CARDS::UNCOMMON_DAMAGE_DOWN     { EnvCard::UncommonDamageDown }
        else if self == ENV_CARDS::UNCOMMON_CHANCES_UP      { EnvCard::UncommonChancesUp }
        else if self == ENV_CARDS::UNCOMMON_CHANCES_DOWN    { EnvCard::UncommonChancesDown }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_HIT    { EnvCard::SpecialAllShotsHit }
        else if self == ENV_CARDS::SPECIAL_ALL_SHOTS_MISS   { EnvCard::SpecialAllShotsMiss }
        else if self == ENV_CARDS::SPECIAL_DOUBLE_TACTICS   { EnvCard::SpecialDoubleTactics }
        else if self == ENV_CARDS::SPECIAL_NO_TACTICS       { EnvCard::SpecialNoTactics }
        else                                                { EnvCard::None }
    }
}
