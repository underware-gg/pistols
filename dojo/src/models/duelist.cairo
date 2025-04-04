use starknet::{ContractAddress};
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
    pub timestamps: DuelistTimestamps,
    pub status: DuelistStatus,
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct DuelistTimestamps {
    pub registered: u64,    // seconds since epoch, started
    pub active: u64,        // seconds since epoch, ended
}

#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct DuelistStatus {
    pub total_duels: u16,
    pub total_wins: u16,
    pub total_losses: u16,
    pub total_draws: u16,
    pub honour: u8,         // 0..100
    pub honour_log: u64,    // past 8 duels, each byte holds one duel honour
} // [8 + 4*16 + 64] = 136 bits


#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DuelistAssignment {
    #[key]
    pub duelist_id: u128,
    //-----------------------
    pub duel_id: u128,      // current Challenge a Duelist is in
    pub entry_id: u64,      // current Tournament a Duelist is in
}

// cfrated for dead duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DuelistMemorial {
    #[key]
    pub duelist_id: u128,
    //------------
    pub cause_of_death: CauseOfDeath,
    pub killed_by: u128,
    pub fame_before_death: u128,
    pub player_address: ContractAddress,
    pub season_id: u32,
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum CauseOfDeath {
    None,       // 0
    Duelling,   // 1
    Memorize,   // 2
    Sacrifice,  // 3
    Forsaken,   // 4
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::systems::tokens::tournament_token::tournament_token::{Errors as TournamentErrors};
use pistols::libs::store::{Store, StoreTrait};
use pistols::types::rules::{RewardValues};
use pistols::types::constants::{HONOUR};
use pistols::utils::bitwise::{BitwiseU64};
use pistols::utils::math::{MathU64};

#[generate_trait]
pub impl DuelistImpl of DuelistTrait {
    fn enter_challenge(ref self: Store, duelist_id: u128, duel_id: u128) {
        let mut assignment: DuelistAssignment = self.get_duelist_challenge(duelist_id);
        assert(assignment.duel_id == 0, DuelErrors::DUELIST_IN_CHALLENGE);
        assignment.duel_id = duel_id;
        self.set_duelist_challenge(@assignment);
    }
    fn exit_challenge(ref self: Store, duelist_id: u128) {
        let mut assignment: DuelistAssignment = self.get_duelist_challenge(duelist_id);
        assignment.duel_id = 0;
        self.set_duelist_challenge(@assignment);
    }
    fn enter_tournament(ref self: Store, duelist_id: u128, entry_id: u64) {
        let mut assignment: DuelistAssignment = self.get_duelist_challenge(duelist_id);
        assert(assignment.duel_id.is_zero(), TournamentErrors::DUELIST_IN_CHALLENGE);
        assert(assignment.entry_id.is_zero(), TournamentErrors::DUELIST_IN_TOURNAMENT);
        assignment.entry_id = entry_id;
        self.set_duelist_challenge(@assignment);
    }
    fn exit_tournament(ref self: Store, duelist_id: u128) {
        let mut assignment: DuelistAssignment = self.get_duelist_challenge(duelist_id);
        assignment.entry_id = 0;
        self.set_duelist_challenge(@assignment);
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
pub impl DuelistStatusImpl of DuelistStatusTrait {
    #[inline(always)]
    fn is_villain(self: @DuelistStatus) -> bool {
        (*self.total_duels > 0 && *self.honour < HONOUR::TRICKSTER_START)
    }
    #[inline(always)]
    fn is_trickster(self: @DuelistStatus) -> bool {
        (*self.honour >= HONOUR::TRICKSTER_START && *self.honour < HONOUR::LORD_START)
    }
    #[inline(always)]
    fn is_lord(self: @DuelistStatus) -> bool {
        (*self.honour >= HONOUR::LORD_START)
    }
    #[inline(always)]
    fn get_archetype(self: @DuelistStatus) -> Archetype {
        if (self.is_lord()) {(Archetype::Honourable)}
        else if (self.is_trickster()) {(Archetype::Trickster)}
        else if (self.is_villain()) {(Archetype::Villainous)}
        else {(Archetype::Undefined)}
    }
    #[inline(always)]
    fn get_honour(self: @DuelistStatus) -> ByteArray {
        (format!("{}.{}", *self.honour / 10, *self.honour % 10))
    }

    // update duel totals only
    fn apply_challenge_results(ref status_a: DuelistStatus, ref status_b: DuelistStatus, rewards_a: @RewardValues, rewards_b: @RewardValues, winner: u8) {
        status_a.total_duels += 1;
        status_b.total_duels += 1;
        if (winner == 1) {
            status_a.total_wins += 1;
            status_b.total_losses += 1;
        } else if (winner == 2) {
            status_b.total_wins += 1;
            status_a.total_losses += 1;
        } else {
            status_a.total_draws += 1;
            status_b.total_draws += 1;
        }
    }
    // average honour has an extra decimal, eg: 100 = 10.0
    fn update_honour(ref self: DuelistStatus, duel_honour: u8) {
        let log_pos: usize = ((self.total_duels.into() - 1) % 8) * 8;
        self.honour_log =
            (self.honour_log & ~BitwiseU64::shl(0xff, log_pos)) |
            BitwiseU64::shl(duel_honour.into(), log_pos);
        self.honour = (BitwiseU64::sum_bytes(self.honour_log) / core::cmp::min(self.total_duels.into(), 8)).try_into().unwrap();
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

impl CauseOfDeathIntoByteArray of core::traits::Into<CauseOfDeath, ByteArray> {
    fn into(self: CauseOfDeath) -> ByteArray {
        match self {
            CauseOfDeath::None =>       "None",
            CauseOfDeath::Duelling =>   "Duelling",
            CauseOfDeath::Memorize =>   "Memorize",
            CauseOfDeath::Sacrifice =>  "Sacrifice",
            CauseOfDeath::Forsaken =>   "Forsaken",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl CauseOfDeathDebug of core::fmt::Debug<CauseOfDeath> {
    fn fmt(self: @CauseOfDeath, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
