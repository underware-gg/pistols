pub use pistols::types::profile_type::{ProfileType, ProfileTypeTrait, DuelistProfile, BotProfile};

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
    pub timestamp_registered: u64,  // date registered (seconds since epoch)
    pub timestamp_active: u64,      // last active (seconds since epoch)
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DuelistChallenge {
    #[key]
    pub duelist_id: u128,
    //-----------------------
    pub duel_id: u128,      // current Challenge a Duelist is in
}

// player/duelist scoreboards
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Scoreboard {
    #[key]
    pub holder: felt252,    // duelist_id or player_address
    //------------
    pub score: Score,
}

// Per table scoreboard
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ScoreboardTable {
    #[key]
    pub holder: felt252,    // duelist_id or player_address
    #[key]
    pub table_id: felt252,
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
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::bitwise::{BitwiseU64};
use pistols::utils::math::{MathU64};
use pistols::types::constants::{HONOUR};

#[generate_trait]
pub impl DuelistImpl of DuelistTrait {
    fn enter_challenge(ref self: Store, duelist_id: u128, duel_id: u128) {
        let current_challenge: DuelistChallenge = self.get_duelist_challenge(duelist_id);
        assert(current_challenge.duel_id == 0, DuelErrors::DUELIST_IN_CHALLENGE);
        self.set_duelist_challenge(@DuelistChallenge{
            duelist_id,
            duel_id,
        });
    }
    fn exit_challenge(ref self: Store, duelist_id: u128) {
        self.set_duelist_challenge(@DuelistChallenge{
            duelist_id,
            duel_id: 0,
        });
    }
}


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
pub impl ScoreImpl of ScoreTrait {
    #[inline(always)]
    fn is_villain(self: Score) -> bool {
        (self.total_duels > 0 && self.honour < HONOUR::TRICKSTER_START)
    }
    #[inline(always)]
    fn is_trickster(self: Score) -> bool {
        (self.honour >= HONOUR::TRICKSTER_START && self.honour < HONOUR::LORD_START)
    }
    #[inline(always)]
    fn is_lord(self: Score) -> bool {
        (self.honour >= HONOUR::LORD_START)
    }
    #[inline(always)]
    fn get_archetype(self: Score) -> Archetype {
        if (self.is_lord()) {(Archetype::Honourable)}
        else if (self.is_trickster()) {(Archetype::Trickster)}
        else if (self.is_villain()) {(Archetype::Villainous)}
        else {(Archetype::Undefined)}
    }
    #[inline(always)]
    fn get_honour(self: Score) -> ByteArray {
        (format!("{}.{}", self.honour/10, self.honour%10))
    }

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
        self.honour = (BitwiseU64::sum_bytes(self.honour_history) / core::cmp::min(self.total_duels.into(), 8)).try_into().unwrap();
    }
}

impl ArchetypeIntoByteArray of core::traits::Into<Archetype, ByteArray> {
    fn into(self: Archetype) -> ByteArray {
        match self {
            Archetype::Undefined => "Undefined",
            Archetype::Villainous => "Villainous",
            Archetype::Trickster => "Trickster",
            Archetype::Honourable => "Honourable",
        }
    }
}
