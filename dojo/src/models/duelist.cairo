use starknet::ContractAddress;
use pistols::types::profile_type::{ProfileType, ProfileTypeTrait, DuelistProfile, BotProfile};

//---------------------
// Duelist
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Duelist {
    #[key]
    pub duelist_id: u128,   // erc721 token_id
    //-----------------------
    pub profile_type: ProfileType,
    pub timestamp: u64,         // date registered (seconds since epoch)
    pub score: Score,
}

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pact {
    #[key]
    pub table_id: felt252,
    #[key]
    pub pair: u128,     // xor'd duelists as u256(address).low
    //------------
    pub duel_id: u128,  // current Challenge, or 0x0
}

//
// Duelist scores per Table
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Scoreboard {
    #[key]
    pub table_id: felt252,
    #[key]
    pub duelist_id: u128,
    //------------
    pub score: Score,
}

#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct Score {
    pub honour: u8,             // 0..100
    pub total_duels: u16,
    pub total_wins: u16,
    pub total_losses: u16,
    pub total_draws: u16,
    pub honour_history: u64,    // past 8 duels, each byte holds one duel honour
}



//----------------------------------
// Traits
//
use pistols::types::constants::{HONOUR};
use pistols::utils::bitwise::{BitwiseU64};
use pistols::utils::math::{MathU64};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Archetype {
    Undefined,  // 0
    Villainous, // 1
    Trickster,  // 2
    Honourable, // 3
}
impl ArchetypeDefault of Default<Archetype> {
    fn default() -> Archetype {(Archetype::Undefined)}
}

#[generate_trait]
impl ScoreTraitImpl of ScoreTrait {
    #[inline(always)]
    fn is_villain(self: Score) -> bool { (self.total_duels > 0 && self.honour < HONOUR::TRICKSTER_START) }
    #[inline(always)]
    fn is_trickster(self: Score) -> bool { (self.honour >= HONOUR::TRICKSTER_START && self.honour < HONOUR::LORD_START) }
    #[inline(always)]
    fn is_lord(self: Score) -> bool { (self.honour >= HONOUR::LORD_START) }
    #[inline(always)]
    fn get_archetype(self: Score) -> Archetype {
        if (self.is_lord()) {(Archetype::Honourable)}
        else if (self.is_trickster()) {(Archetype::Trickster)}
        else if (self.is_villain()) {(Archetype::Villainous)}
        else {(Archetype::Undefined)}
    }
    #[inline(always)]
    fn format_honour(value: u8) -> ByteArray { (format!("{}.{}", value/10, value%10)) }

    // update duel totals only
    fn update_totals(ref score_a: Score, ref score_b: Score, winner: u8) {
        score_a.total_duels += 1;
        score_b.total_duels += 1;
        if (winner == 1) {
            score_a.total_wins += 1;
            score_b.total_losses += 1;
        } else if (winner == 2) {
            score_a.total_losses += 1;
            score_b.total_wins += 1;
        } else {
            score_a.total_draws += 1;
            score_b.total_draws += 1;
        }
    }
    // average honour has an extra decimal, eg: 100 = 10.0
    fn update_honour(ref self: Score, duel_honour: u8) {
        let history_pos: usize = ((self.total_duels.into() - 1) % 8) * 8;
        self.honour_history =
            (self.honour_history & ~BitwiseU64::shl(0xff, history_pos)) |
            BitwiseU64::shl(duel_honour.into(), history_pos);
        self.honour = (BitwiseU64::sum_bytes(self.honour_history) / MathU64::min(self.total_duels.into(), 8)).try_into().unwrap();
    }
}

impl ArchetypeIntoByteArray of Into<Archetype, ByteArray> {
    fn into(self: Archetype) -> ByteArray {
        match self {
            Archetype::Undefined => "Undefined",
            Archetype::Villainous => "Villainous",
            Archetype::Trickster => "Trickster",
            Archetype::Honourable => "Honourable",
        }
    }
}
