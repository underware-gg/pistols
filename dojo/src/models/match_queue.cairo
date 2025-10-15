use starknet::{ContractAddress};

// constants
pub mod MATCHMAKER {
    use pistols::types::timestamp::{TIMESTAMP};
    pub const INITIAL_SLOT_SIZE: u8 = 5;
    pub const QUEUE_TIMEOUT_FAST: u64 = (TIMESTAMP::ONE_MINUTE);
    pub const QUEUE_TIMEOUT_SLOW: u64 = (TIMESTAMP::ONE_DAY);
    pub const COMMIT_TIMEOUT_FAST: u64 = (TIMESTAMP::ONE_MINUTE * 10);
    pub const COMMIT_TIMEOUT_SLOW: u64 = (TIMESTAMP::ONE_DAY);
}


//------------------------
// MatckMaker models
//

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum QueueId {
    Undefined,  // 0
    Unranked,   // 1
    Ranked,     // 2
}

//
// a matchmaker queue
#[derive(Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct MatchQueue {
    #[key]
    pub queue_id: QueueId,
    //-----------------------
    pub players: Array<ContractAddress>,
    pub slot_size: u8,
    pub entry_token_address: ContractAddress,
    pub entry_token_amount: u128,
}

//
// a player in matchmaker queue
#[derive(Drop, Serde, Introspect)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct MatchPlayer {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub queue_id: QueueId,
    //-----------------------
    pub queue_info: QueueInfo,
    // player assignments
    pub duelist_id: u128,
    pub duel_id: u128,
    pub next_duelists: Array<QueueNextDuelist>,
}

#[derive(Serde, Copy, Drop, IntrospectPacked)]
pub struct QueueNextDuelist {
    pub duelist_id: u128,
    pub slot: u8,
}

#[derive(Serde, Copy, Drop, IntrospectPacked, Default)]
pub struct QueueInfo {
    pub queue_mode: QueueMode,
    pub slot: u8,
    pub timestamp_enter: u64,
    pub timestamp_ping: u64,
    pub expired: bool,          // expired and out of the queue
    pub has_minted_duel: bool,  // has minted a duel
}

#[derive(Serde, Copy, Drop, PartialEq, IntrospectPacked)]
pub enum QueueMode {
    Undefined,  // 0
    Fast,       // 1
    Slow,       // 2
}
impl QueueModeDefault of Default<QueueMode> {
    fn default() -> QueueMode {(QueueMode::Undefined)}
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::challenge::{DuelType};
use pistols::systems::rng::{RngWrap, RngWrapTrait, Dice, DiceTrait};
use pistols::interfaces::dns::{DnsTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::address::{ZERO};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::utils::misc::{FeltToLossy};
use pistols::types::constants::{CONST};
use pistols::types::premise::{Premise};

#[generate_trait]
pub impl QueueIdImpl of QueueIdTrait {
    fn get_lives_staked(self: @QueueId) -> u8 {
        match self {
            QueueId::Undefined => 0,
            QueueId::Ranked => 1,
            QueueId::Unranked => 1,
        }
    }
    fn get_premise(self: @QueueId) -> Premise {
        match self {
            QueueId::Undefined => Premise::Undefined,
            QueueId::Ranked => Premise::Honour,
            QueueId::Unranked => Premise::Honour,
        }
    }
    fn permanent_enlistment(self: @QueueId) -> bool {
        match self {
            QueueId::Undefined => false,
            QueueId::Ranked => true,
            QueueId::Unranked => false,
        }
    }
}

#[generate_trait]
pub impl QueueModeImpl of QueueModeTrait {
    fn get_commit_timeout(self: @QueueMode) -> u64 {
        match self {
            QueueMode::Fast => (MATCHMAKER::COMMIT_TIMEOUT_FAST),
            QueueMode::Slow |
            QueueMode::Undefined => (MATCHMAKER::COMMIT_TIMEOUT_SLOW),
        }
    }
}

#[generate_trait]
pub impl MatchQueueImpl of MatchQueueTrait {
    fn initialize(ref store: Store) {
        store.set_match_queue(@MatchQueue {
            queue_id: QueueId::Unranked,
            slot_size: MATCHMAKER::INITIAL_SLOT_SIZE,
            players: array![],
            entry_token_address: ZERO(),
            entry_token_amount: 0,
        });
        store.set_match_queue(@MatchQueue {
            queue_id: QueueId::Ranked,
            slot_size: MATCHMAKER::INITIAL_SLOT_SIZE,
            players: array![],
            entry_token_address: store.world.fools_coin_address(),
            entry_token_amount: (5 * CONST::ETH_TO_WEI.low),
        });
    }
    // assign slot to new player
    fn assign_slot(self: @MatchQueue, store: @Store, seed: felt252) -> u8 {
        let wrapped: @RngWrap = RngWrapTrait::new(store.world.rng_address());
        let mut dice: Dice = DiceTrait::new(wrapped, seed);
        (dice.throw('queue_slot', *self.slot_size))
    }
    #[inline(always)]
    fn player_position(self: @MatchQueue, player_address: @ContractAddress) -> Option<usize> {
        self.players.position(player_address)
    }
    #[inline(always)]
    fn is_player_in_queue(self: @MatchQueue, player_address: @ContractAddress) -> bool {
        (self.player_position(player_address).is_some())
    }
    #[inline(always)]
    fn append_player(ref self: MatchQueue, player_address: @ContractAddress) {
        self.players.append(*player_address);
    }
    #[inline(always)]
    fn remove_player(ref self: MatchQueue, player_address: @ContractAddress) {
        self.players = self.players.remove(player_address);
    }
    #[inline(always)]
    fn resolve_player(ref self: MatchQueue, player_address: @ContractAddress, stay_in_queue: bool) {
        let is_player_in_queue: bool = self.is_player_in_queue(player_address);
        if (!stay_in_queue && is_player_in_queue) {
            self.remove_player(player_address);
        } else if (stay_in_queue && !is_player_in_queue) {
            self.append_player(player_address);
        }
    }
}

#[generate_trait]
pub impl MatchPlayerImpl of MatchPlayerTrait {
    fn enter_queue(ref self: MatchPlayer,
        queue_mode: QueueMode,
        duelist_id: u128,
        duel_id: u128,
        slot: u8,
    ) {
        self = MatchPlayer {
            player_address: self.player_address,
            queue_id: self.queue_id,
            queue_info: QueueInfo {
                queue_mode,
                slot,
                timestamp_enter: starknet::get_block_timestamp(),
                timestamp_ping: 0,
                expired: false,
                has_minted_duel: duel_id.is_non_zero(),
            },
            duelist_id,
            duel_id,
            next_duelists: self.next_duelists.clone(),
        };
    }
    // stack a duelist to get in queue as soon as the current is matched
    fn stack_duelist(ref self: MatchPlayer,
        duelist_id: u128,
        slot: u8,
    ) {
        self.next_duelists.append(QueueNextDuelist {
            duelist_id,
            slot,
        });
    }
    fn is_duelist_stacked(self: @MatchPlayer,
        duelist_id: u128,
    ) -> bool {
        for next_duelist in self.next_duelists {
            if (*next_duelist.duelist_id == duelist_id) {
                return true;
            }
        }
        (false)
    }
    // unstack a duelist to re-enter queue, or clear this player
    // return true if a duelist was unstacked and player re-entered queue
    fn unstack_duelist_or_clear(ref self: MatchPlayer) -> bool {
        (match self.next_duelists.pop_front() {
            Option::Some(next_duelist) => {
                self.enter_queue(
                    QueueMode::Slow,
                    next_duelist.duelist_id,
                    0,
                    next_duelist.slot,
                );
                // still in queue
                (true)
            },
            Option::None => {
                // clear player queue
                self = MatchPlayer {
                    player_address: self.player_address,
                    queue_id: self.queue_id,
                    queue_info: Default::default(),
                    duelist_id: 0,
                    duel_id: 0,
                    next_duelists: array![],
                };
                // left queue
                (false)
            },
        })
    }
}

#[generate_trait]
pub impl QueueInfoImpl of QueueInfoTrait {
    fn has_expired(self: @QueueInfo, current_timestamp: u64) -> bool {
        let elapsed_seconds: u64 = (current_timestamp - *self.timestamp_enter);
        (match self.queue_mode {
            QueueMode::Fast => {(elapsed_seconds > MATCHMAKER::QUEUE_TIMEOUT_FAST)},
            QueueMode::Slow => {(elapsed_seconds > MATCHMAKER::QUEUE_TIMEOUT_SLOW)},
            QueueMode::Undefined => {(false)},
        })
    }
}


//---------------------------
// Converters
//
impl QueueIdIntoDuelType of core::traits::Into<QueueId, DuelType> {
    fn into(self: QueueId) -> DuelType {
        match self {
            QueueId::Undefined      =>  DuelType::Undefined,
            QueueId::Ranked         =>  DuelType::Ranked,
            QueueId::Unranked       =>  DuelType::Unranked,
        }
    }
}
impl DuelTypeIntoQueueId of core::traits::Into<DuelType, QueueId> {
    fn into(self: DuelType) -> QueueId {
        match self {
            DuelType::Ranked         =>  QueueId::Ranked,
            DuelType::Unranked       =>  QueueId::Unranked,
            _ => QueueId::Unranked,
        }
    }
}


//
// Print/debug
//
impl QueueIdIntoByteArray of core::traits::Into<QueueId, ByteArray> {
    fn into(self: QueueId) -> ByteArray {
        match self {
            QueueId::Undefined      =>  "Undefined",
            QueueId::Ranked         =>  "Ranked",
            QueueId::Unranked       =>  "Unranked",
        }
    }
}
impl QueueModeIntoByteArray of core::traits::Into<QueueMode, ByteArray> {
    fn into(self: QueueMode) -> ByteArray {
        match self {
            QueueMode::Undefined    =>  "Undefined",
            QueueMode::Fast         =>  "Fast",
            QueueMode::Slow         =>  "Slow",
        }
    }
}
pub impl QueueIdDisplay of core::fmt::Display<QueueId> {
    fn fmt(self: @QueueId, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
#[cfg(test)]
pub impl QueueIdDebug of core::fmt::Debug<QueueId> {
    fn fmt(self: @QueueId, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl QueueModeDisplay of core::fmt::Display<QueueMode> {
    fn fmt(self: @QueueMode, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
#[cfg(test)]
pub impl QueueModeDebug of core::fmt::Debug<QueueMode> {
    fn fmt(self: @QueueMode, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = (*self).into();
        f.buffer.append(@result);
        Result::Ok(())
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{
        MatchPlayer, QueueInfo,
        QueueId, QueueMode,
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            FLAGS, OWNER, OTHER,
        }
    };

    #[test]
    fn test_get_match_players_info_batch() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        // create players
        let queue_id = QueueId::Ranked;
        let player_1: MatchPlayer = MatchPlayer {
            player_address: OWNER(),
            queue_id,
            queue_info: QueueInfo {
                queue_mode: QueueMode::Slow,
                slot: 11,
                timestamp_enter: 1200,
                timestamp_ping: 1300,
                expired: false,
                has_minted_duel: false,
            },
            duelist_id: 1,
            duel_id: 1,
            next_duelists: array![],
        };
        let player_2: MatchPlayer = MatchPlayer {
            player_address: OTHER(),
            queue_id,
            queue_info: QueueInfo {
                queue_mode: QueueMode::Fast,
                slot: 101,
                timestamp_enter: 5000,
                timestamp_ping: 5100,
                expired: true,
                has_minted_duel: false,
            },
            duelist_id: 2,
            duel_id: 2,
            next_duelists: array![],
        };
        // store players
        tester::set_MatchPlayer(ref sys.world, @player_1);
        tester::set_MatchPlayer(ref sys.world, @player_2);
        // get players batch
        let players_info: Span<QueueInfo> = sys.store.get_match_players_info_batch([
            (OTHER(), queue_id),
            (OWNER(), queue_id),
        ].span()).span();
        // validate stored info
        assert_eq!(*players_info[0].queue_mode, player_2.queue_info.queue_mode, "player_2.queue_mode");
        assert_eq!(*players_info[0].slot, player_2.queue_info.slot, "player_2.slot");
        assert_eq!(*players_info[0].timestamp_enter, player_2.queue_info.timestamp_enter, "player_2.timestamp_enter");
        assert_eq!(*players_info[0].timestamp_ping, player_2.queue_info.timestamp_ping, "player_2.timestamp_ping");
        assert_eq!(*players_info[0].expired, player_2.queue_info.expired, "player_2.expired");
        assert_eq!(*players_info[1].queue_mode, player_1.queue_info.queue_mode, "player_1.queue_mode");
        assert_eq!(*players_info[1].slot, player_1.queue_info.slot, "player_1.slot");
        assert_eq!(*players_info[1].timestamp_enter, player_1.queue_info.timestamp_enter, "player_1.timestamp_enter");
        assert_eq!(*players_info[1].timestamp_ping, player_1.queue_info.timestamp_ping, "player_1.timestamp_ping");
        assert_eq!(*players_info[1].expired, player_1.queue_info.expired, "player_1.expired");
    }

}
