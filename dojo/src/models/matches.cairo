use starknet::{ContractAddress};


//------------------------
// MatckMaker models
//

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum QueueId {
    Undefined,  // 0
    Main,       // 1
}

// player in matchmaker queue
#[derive(Drop, Serde)]
#[dojo::model]
pub struct MatchQueue {
    #[key]
    pub queue_id: QueueId,
    //-----------------------
    pub players: Array<ContractAddress>,
    pub slot_size: u8,
}

// player in matchmaker queue
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
    pub block_enter: u64,
    pub block_ping: u64,
}

#[derive(Serde, Copy, Drop, PartialEq, IntrospectPacked)]
pub enum QueueMode {
    Undefined,  // 0
    Fast,       // 1
    Slow,       // 2
}


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
pub impl QueueInfoImpl of QueueInfoTrait {
    fn has_expired(self: @QueueInfo, current_block: u64) -> bool {
        let elapsed_blocks: u64 = (current_block - *self.block_ping);
        (match self.queue_mode {
            QueueMode::Fast => {(elapsed_blocks > 10)},
            QueueMode::Slow => {(elapsed_blocks > 100)},
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
                block_enter: 12,
                block_ping: 13,
            },
            duelist_id: 1,
            duel_id: 1,
        };
        let player_2: MatchPlayer = MatchPlayer {
            player_address: OTHER(),
            queue_info: QueueInfo {
                queue_mode: QueueMode::Fast,
                slot: 101,
                block_enter: 102,
                block_ping: 103,
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
        assert_eq!(*players_info[0].block_enter, player_2.queue_info.block_enter, "player_2.block_enter");
        assert_eq!(*players_info[0].block_ping, player_2.queue_info.block_ping, "player_2.block_ping");
        assert_eq!(*players_info[1].queue_mode, player_1.queue_info.queue_mode, "player_1.queue_mode");
        assert_eq!(*players_info[1].slot, player_1.queue_info.slot, "player_1.slot");
        assert_eq!(*players_info[1].block_enter, player_1.queue_info.block_enter, "player_1.block_enter");
        assert_eq!(*players_info[1].block_ping, player_1.queue_info.block_ping, "player_1.block_ping");
    }
}
