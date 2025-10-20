use starknet::{ContractAddress};
use pistols::models::match_queue::{QueueId, QueueIdTrait};
pub use pistols::types::duelist_profile::{DuelistProfile, DuelistProfileTrait, GenesisKey, BotKey};

//---------------------
// Duelist
//
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Duelist {
    #[key]
    pub duelist_id: u128,   // erc721 token_id
    //-----------------------
    pub duelist_profile: DuelistProfile,
    pub timestamps: DuelistTimestamps,
    pub totals: Totals,
    pub released_fame: bool,    // this Duelist's FAME is not pegged to LORDS (Free/Bot/Enlisted)
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct DuelistTimestamps {
    pub registered: u64,    // seconds since epoch, started
    pub active: u64,        // seconds since epoch, ended
}

#[derive(Copy, Drop, Serde, Default, IntrospectPacked)]
pub struct Totals {
    pub total_duels: u16,
    pub total_wins: u16,
    pub total_losses: u16,
    pub total_draws: u16,
    pub honour: u8,         // 0..100
    pub honour_log: u64,    // past 8 duels, each byte holds one duel honour
} // [8 + 4*16 + 64] = 136 bits


#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct DuelistAssignment {
    #[key]
    pub duelist_id: u128,
    //-----------------------
    pub duel_id: u128,      // current Challenge a Duelist is in
    pub pass_id: u64,       // current Tournament a Duelist is in
    pub queue_id: QueueId,  // current Match Queue a Duelist is in
    pub season_id: u32,     // current Ranked season
}

// created for dead duelists
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
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
    Forsaken,   // 4 (deprecated)
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
// use pistols::systems::tokens::tournament_token::tournament_token::{Errors as TournamentErrors};
use pistols::types::rules::{RewardValues};
use pistols::types::constants::{HONOUR};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::bitwise::{BitwiseU64};
use pistols::utils::bytemap::{BytemapU64};
use pistols::utils::math::{MathU64};

#[generate_trait]
pub impl DuelistImpl of DuelistTrait {
    fn is_activated(self: @Duelist) -> bool {
        (*self.timestamps.active != 0)
    }
}

#[generate_trait]
pub impl DuelistAssignmentImpl of DuelistAssignmentTrait {
    // must enlist before entering a matchmaking queue
    fn enlist_matchmaking(ref self: Store, duelist_id: u128, queue_id: QueueId) {
        let mut assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
        assignment.assert_is_available_for(Option::None);
        assignment.queue_id = queue_id; // this is permanent for Ranked
        if (queue_id.permanent_enlistment()) {
            assignment.season_id = self.get_current_season_id(); // this is permanent for Ranked
        }
        self.set_duelist_assignment(@assignment);
    }
    fn is_enlisted_matchmaking(self: @Store, duelist_id: u128, queue_id: QueueId) -> bool {
        (self.get_duelist_assigned_queue_id(duelist_id) == queue_id)
    }
    fn assign_challenge(ref self: Store, duelist_id: u128, duel_id: u128, queue_id: Option<QueueId>) {
        let mut assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
        assignment.assert_is_available_for(queue_id);
        assignment.duel_id = duel_id;
        assignment.queue_id = queue_id.unwrap_or(QueueId::Undefined);
        self.set_duelist_assignment(@assignment);
    }
    fn unassign_challenge(ref self: Store, duelist_id: u128) {
        if (duelist_id.is_non_zero()) {
            let mut assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
            assignment.duel_id = 0;
            assignment.pass_id = 0;
            // clear queue if not enlisted (paid ranked)
            if (!assignment.queue_id.permanent_enlistment()) {
                assignment.queue_id = QueueId::Undefined;
            }
            self.set_duelist_assignment(@assignment);
        }
    }
    // fn enter_tournament(ref self: Store, duelist_id: u128, pass_id: u64) {
    //     let mut assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
    //     assert(assignment.duel_id.is_zero(), TournamentErrors::DUELIST_IN_CHALLENGE);
    //     assert(assignment.pass_id.is_zero(), TournamentErrors::DUELIST_IN_TOURNAMENT);
    //     assignment.pass_id = pass_id;
    //     self.set_duelist_challenge(@assignment);
    // }
    fn exit_tournament(ref self: Store, duelist_id: u128) {
        let mut assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
        assignment.pass_id = 0;
        self.set_duelist_assignment(@assignment);
    }
    fn assert_is_available_for(self: @DuelistAssignment, queue_id: Option<QueueId>) {
        // must not be in another challenge
        assert(self.duel_id.is_zero(), DuelErrors::DUELIST_IN_CHALLENGE);
        // must be the same queue or not in a queue
        let expected_queue_id: QueueId = queue_id.unwrap_or(QueueId::Undefined);
        assert(*self.queue_id == expected_queue_id,
            if (expected_queue_id == QueueId::Undefined)
                {DuelErrors::DUELIST_MATCHMAKING}
                else {DuelErrors::DUELIST_WRONG_QUEUE}
        );
    }
    fn is_available_for(self: @Store, duelist_id: u128, queue_id: Option<QueueId>) -> bool {
        let assignment: DuelistAssignment = self.get_duelist_assignment(duelist_id);
        (
            // must not be in another challenge
            assignment.duel_id.is_zero() && 
            // must be on a permanentqueue (or none)
            assignment.queue_id == Self::_expected_queue_for(queue_id)
        )
    }
    fn _expected_queue_for(queue_id: Option<QueueId>) -> QueueId {
        (match queue_id {
            Option::None => {(QueueId::Undefined)},
            Option::Some(queue_id) => {
                if (queue_id.permanent_enlistment()) {(queue_id)}
                else {(QueueId::Undefined)}
            },
        })
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
pub impl TotalsImpl of TotalsTrait {
    #[inline(always)]
    fn is_villain(self: @Totals) -> bool {
        (*self.total_duels > 0 && *self.honour < HONOUR::TRICKSTER_START)
    }
    #[inline(always)]
    fn is_trickster(self: @Totals) -> bool {
        (*self.honour >= HONOUR::TRICKSTER_START && *self.honour < HONOUR::LORD_START)
    }
    #[inline(always)]
    fn is_lord(self: @Totals) -> bool {
        (*self.honour >= HONOUR::LORD_START)
    }
    #[inline(always)]
    fn get_archetype(self: @Totals) -> Archetype {
        if (self.is_lord()) {(Archetype::Honourable)}
        else if (self.is_trickster()) {(Archetype::Trickster)}
        else if (self.is_villain()) {(Archetype::Villainous)}
        else {(Archetype::Undefined)}
    }
    #[inline(always)]
    fn get_honour(self: @Totals) -> ByteArray {
        (format!("{}.{}", *self.honour / 10, *self.honour % 10))
    }

    // update duel totals only
    fn apply_challenge_results(ref totals_a: Totals, ref totals_b: Totals, rewards_a: @RewardValues, rewards_b: @RewardValues, winner: u8) {
        totals_a.total_duels += 1;
        totals_b.total_duels += 1;
        if (winner == 1) {
            totals_a.total_wins += 1;
            totals_b.total_losses += 1;
        } else if (winner == 2) {
            totals_b.total_wins += 1;
            totals_a.total_losses += 1;
        } else {
            totals_a.total_draws += 1;
            totals_b.total_draws += 1;
        }
    }
    // average honour has an extra decimal, eg: 100 = 10.0
    fn update_honour(ref self: Totals, duel_honour: u8) {
        let log_pos: usize = ((self.total_duels.into() - 1) % 8) * 8;
        self.honour_log =
            (self.honour_log & ~BitwiseU64::shl(0xff, log_pos)) |
            BitwiseU64::shl(duel_honour.into(), log_pos);
        // sum honour non-zero honour values
        // let mut sum_count: u64 = core::cmp::min(self.total_duels.into(), 8);
        // let sum: u64 = BytemapU64::sum_bytes(self.honour_log);
        let mut log: u64 = self.honour_log;
        let mut sum_count: u64 = 0;
        let mut sum: u64 = 0;
        while (log != 0) {
            let h: u64 = (log & 0xff);
            if (h != 0) {
                sum += h;
                sum_count += 1;
            }
            log /= 0x100;
        };
        self.honour = if (sum_count != 0) {
            (sum / sum_count).try_into().unwrap()
        } else {
            (0)
        };
    }
}

#[generate_trait]
pub impl CauseOfDeathImpl of CauseOfDeathTrait {
    #[inline(always)]
    fn retains_fame(self: @CauseOfDeath) -> bool {
        match self {
            CauseOfDeath::None =>       false,
            CauseOfDeath::Duelling =>   false,
            CauseOfDeath::Memorize =>   true,
            CauseOfDeath::Sacrifice =>  false,
            CauseOfDeath::Forsaken =>   true,
        }
    }
}


//------------------------------------------------------
// converters
//
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



//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use super::{
        Totals, TotalsTrait,
        DuelistAssignmentTrait,
    };
    use pistols::models::match_queue::{QueueId, QueueIdTrait, MatchQueueTrait};
    use pistols::tests::tester::{tester, tester::{StoreTrait, FLAGS}};

    #[test]
    fn test_totals_honour_archetype() {
        // lord...
        let mut totals: Totals = Default::default();
        totals.total_duels += 1;
        totals.update_honour(100);
        totals.total_duels += 1;
        totals.update_honour(60);
        assert!(totals.is_lord(), "is_lord()");
        totals.total_duels += 1;
        totals.update_honour(10);
        assert!(totals.is_trickster(), "is_lord() > is_trickster()");
        // trickster...
        let mut totals: Totals = Default::default();
        totals.total_duels += 1;
        totals.update_honour(10);
        totals.total_duels += 1;
        totals.update_honour(100);
        assert!(totals.is_trickster(), "is_trickster()");
        totals.total_duels += 1;
        totals.update_honour(100);
        assert!(totals.is_lord(), "is_trickster() > is_lord()");
        // villain...
        let mut totals: Totals = Default::default();
        totals.total_duels += 1;
        totals.update_honour(10);
        totals.total_duels += 1;
        totals.update_honour(40);
        assert!(totals.is_villain(), "is_villain()");
        totals.total_duels += 1;
        totals.update_honour(100);
        assert!(totals.is_trickster(), "is_villain() > is_trickster()");
        totals.total_duels += 1;
        totals.update_honour(100);
        totals.total_duels += 1;
        totals.update_honour(100);
        assert!(totals.is_lord(), "is_villain() > is_lord()");
    }

    #[test]
    fn test_totals_honour_archetype_zero() {
        // lord...
        let mut totals: Totals = Default::default();
        totals.total_duels += 1;
        totals.update_honour(100);
        totals.total_duels += 1;
        totals.update_honour(60);
        assert!(totals.is_lord(), "is_lord()");
        totals.total_duels += 1;
        totals.update_honour(0);
        totals.total_duels += 1;
        totals.update_honour(0);
        totals.total_duels += 1;
        totals.update_honour(0);
        assert!(totals.is_lord(), "is_lord() > zero");
        totals.total_duels += 1;
        totals.update_honour(90);
        assert!(totals.is_lord(), "is_lord() > still");
    }

    #[test]
    fn test_totals_honour_log() {
        let mut totals: Totals = Default::default();
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        while (n <= 8) {
            totals.total_duels += 1;
            totals.update_honour(n);
            sum += n;
            assert_eq!(totals.honour, (sum / n), "sum_8__{}", n);
            n += 1;
        };
        assert_eq!(totals.honour_log, 0x0807060504030201, "{:x} != 0x0807060504030201", totals.honour_log);
        // loop totals
        while (n <= 16) {
            totals.total_duels += 1;
            totals.update_honour(n);
            sum -= n - 8;
            sum += n;
            assert_eq!(totals.honour, (sum / 8), "sum_16__{}", n);
            n += 1;
        };
        assert_eq!(totals.honour_log, 0x100f0e0d0c0b0a09, "{:x} != 0x100f0e0d0c0b0a09", totals.honour_log);
        // new loop
        totals.total_duels += 1;
        totals.update_honour(n);
        assert_eq!(totals.honour_log, 0x100f0e0d0c0b0a11, "{:x} != 0x100f0e0d0c0b0a11", totals.honour_log);
    }

    #[test]
    fn test_totals_honour_log_including_zeros() {
        let mut totals: Totals = Default::default();
        let mut count: u8 = 0;
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        while (n <= 8) {
            totals.total_duels += 1;
            let h: u8 = if (n % 2 == 1) {n} else {0};
            totals.update_honour(h);
            if (h != 0) {
                sum += h;
                count += 1;
            }
            assert_eq!(totals.honour, (sum / count), "sum_8__[{}] sum: {}, count: {} log: {:x}", n, sum, count, totals.honour_log);
           n += 1;
        };
        assert_eq!(totals.honour_log, 0x0007000500030001, "{:x} != 0x0007000500030001", totals.honour_log);
        // loop totals
        while (n <= 16) {
            totals.total_duels += 1;
            let h: u8 = if (n % 2 == 0) {n} else {0};
            totals.update_honour(h);
            if (h != 0) {
                sum += n;
                count += 1;
            } else {
                sum -= n - 8;
                count -= 1;
            }
            assert_eq!(totals.honour, (sum / count), "sum_16__[{}] sum: {}, count: {} log: {:x}", n, sum, count, totals.honour_log);
            n += 1;
        };
        assert_eq!(totals.honour_log, 0x10000e000c000a00, "{:x} != 0x10000e000c000a00", totals.honour_log);
    }

    const DUELIST_ID: u128 = 222;

    #[test]
    fn test_assignment_assign_challenge() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::None);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 1);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Undefined);
        sys.store.unassign_challenge(DUELIST_ID);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Undefined);
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::None);
    }
    #[test]
    #[should_panic(expected: ('DUEL: Duelist in a challenge',))]
    fn test_assignment_assign_challenge_twice() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::None);
        sys.store.assign_challenge(DUELIST_ID, 2, Option::None);
    }
    #[test]
    fn test_assignment_enlist_matchmaking_ranked() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        MatchQueueTrait::initialize(ref sys.store);
        assert!(QueueId::Ranked.permanent_enlistment(), "permanent_enlistment()");
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::None);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Ranked);
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::Some(QueueId::Ranked));
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Ranked);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::Some(QueueId::Ranked));
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 1);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Ranked);
        sys.store.unassign_challenge(DUELIST_ID);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Ranked);
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::Some(QueueId::Ranked));
    }
    #[test]
    fn test_assignment_enlist_matchmaking_unranked() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        MatchQueueTrait::initialize(ref sys.store);
        assert!(!QueueId::Unranked.permanent_enlistment(), "permanent_enlistment()");
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::None);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Unranked);
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::Some(QueueId::Unranked));
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Unranked);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::Some(QueueId::Unranked));
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 1);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Unranked);
        sys.store.unassign_challenge(DUELIST_ID);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).duel_id, 0);
        assert_eq!(sys.store.get_duelist_assignment(DUELIST_ID).queue_id, QueueId::Undefined);
        // available again...
        sys.store.get_duelist_assignment(DUELIST_ID).assert_is_available_for(Option::None);
    }
    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking',))]
    fn test_assignment_enlist_matchmaking_twice() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Ranked);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Ranked);
    }
    #[test]
    #[should_panic(expected: ('DUEL: Wrong queue',))]
    fn test_assignment_assign_challenge_wrong_queue() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Ranked);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::Some(QueueId::Unranked));
    }
    #[test]
    #[should_panic(expected: ('DUEL: Duelist matchmaking',))]
    fn test_assignment_assign_challenge_in_matchmaking() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.enlist_matchmaking(DUELIST_ID, QueueId::Ranked);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::None);
    }
    #[test]
    #[should_panic(expected: ('DUEL: Wrong queue',))]
    fn test_assignment_assign_challenge_not_in_queue() {
        let mut sys: tester::TestSystems = tester::setup_world(FLAGS::OWNER);
        sys.store.assign_challenge(DUELIST_ID, 1, Option::Some(QueueId::Ranked));
    }
}
