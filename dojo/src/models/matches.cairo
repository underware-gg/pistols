use starknet::{ContractAddress};


//------------------------
// MatckMaker models
//

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum QueueId {
    Undefined,  // 0
    Main,       // 1
}

//
// a matchmaker queue
#[derive(Drop, Serde)]
#[dojo::model]
pub struct MatchQueue {
    #[key]
    pub queue_id: QueueId,
    //-----------------------
    pub players: Array<ContractAddress>,
    pub slot_size: u8,
}

//
// a player in matchmaker queue
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct MatchPlayer {
    #[key]
    pub player_address: ContractAddress,
    //-----------------------
    pub queue_info: QueueInfo,
    // player assignments
    pub duelist_id: u128,
    pub duel_id: u128,
}

#[derive(Serde, Copy, Drop, IntrospectPacked)]
pub struct QueueInfo {
    pub queue_mode: QueueMode,
    pub slot: u8,
    pub timestamp_enter: u64,
    pub timestamp_ping: u64,
    pub expired: bool,
}

#[derive(Serde, Copy, Drop, PartialEq, IntrospectPacked)]
pub enum QueueMode {
    Undefined,  // 0
    Fast,       // 1
    Slow,       // 2
}

//
// count duels between two players
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MatchCounter {
    #[key]
    pub pair: u128,     // xor'd players_low
    //-----------------------
    pub count: u64,
}


//----------------------------------
// Traits
//
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::utils::misc::{FeltToLossyTrait};
use pistols::types::timestamp::{TIMESTAMP};

#[generate_trait]
pub impl MatchQueueImpl of MatchQueueTrait {
    // assign slot to new player
    fn assign_slot(ref self: MatchQueue, seed: felt252) -> u8 {
        // randomize slot
        if (self.slot_size == 0) {
            self.slot_size = 5; // initialize with 5 slots
        }
        (seed.to_u8_lossy() % self.slot_size)
    }
    #[inline(always)]
    fn append_player(ref self: MatchQueue, player_address: ContractAddress) {
        self.players.append(player_address);
    }
    #[inline(always)]
    fn remove_player(ref self: MatchQueue, player_address: @ContractAddress) {
        self.players.remove(player_address);
    }
}

#[generate_trait]
pub impl MatchPlayerImpl of MatchPlayerTrait {
    fn enter_queue(ref self: MatchPlayer, duelist_id: u128, queue_mode: QueueMode, slot: u8) {
        let timestamp: u64 = starknet::get_block_timestamp();
        self.duelist_id = duelist_id;
        self.duel_id = 0;
        self.queue_info = QueueInfo{
            queue_mode,
            slot,
            timestamp_enter: timestamp,
            timestamp_ping: timestamp,
            expired: false,
        };
    }
    fn enter_duel(ref self: MatchPlayer, duel_id: u128) {
        self.duel_id = duel_id;
        self.queue_info.slot = 0;
    }
}

#[generate_trait]
pub impl QueueInfoImpl of QueueInfoTrait {
    fn has_expired(self: @QueueInfo, current_timestamp: u64) -> bool {
        let elapsed_seconds: u64 = (current_timestamp - *self.timestamp_enter);
        (match self.queue_mode {
            QueueMode::Fast => {(elapsed_seconds > 60)},
            QueueMode::Slow => {(elapsed_seconds > TIMESTAMP::ONE_DAY)},
            QueueMode::Undefined => {(false)},
        })
    }
}


//---------------------------
// Converters
//
impl QueueModeIntoByteArray of core::traits::Into<QueueMode, ByteArray> {
    fn into(self: QueueMode) -> ByteArray {
        match self {
            QueueMode::Undefined    =>  "Undefined",
            QueueMode::Fast         =>  "Fast",
            QueueMode::Slow         =>  "Slow",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
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
    use pistols::utils::misc::{FeltToLossyTrait};
    use super::{
        MatchPlayer,
        QueueInfo, QueueMode,
    };
    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, StoreTrait,
            FLAGS, OWNER, OTHER,
        }
    };

    #[test]
    fn test_get_match_players_info() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
        // create players
        let player_1: MatchPlayer = MatchPlayer {
            player_address: OWNER(),
            queue_info: QueueInfo {
                queue_mode: QueueMode::Slow,
                slot: 11,
                timestamp_enter: 1200,
                timestamp_ping: 1300,
                expired: false,
            },
            duelist_id: 1,
            duel_id: 1,
        };
        let player_2: MatchPlayer = MatchPlayer {
            player_address: OTHER(),
            queue_info: QueueInfo {
                queue_mode: QueueMode::Fast,
                slot: 101,
                timestamp_enter: 5000,
                timestamp_ping: 5100,
                expired: true,
            },
            duelist_id: 2,
            duel_id: 2,
        };
        // store players
        tester::set_MatchPlayer(ref sys.world, @player_1);
        tester::set_MatchPlayer(ref sys.world, @player_2);
        // get players batch
        let players_info: Span<QueueInfo> = sys.store.get_match_players_info([OTHER(), OWNER()].span()).span();
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
