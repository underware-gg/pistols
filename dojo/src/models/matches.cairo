use starknet::{ContractAddress};


//------------------------
// MatckMaker models
//

pub mod MATCHMAKER {
    // queue singleton id
    pub const MAIN_QUEUE_ID: u8 = 1;
    // count duels between two players
    pub const MAIN_QUEUE_SIZE: u32 = 5;
}

// player in matchmaker queue
#[derive(Drop, Serde)]
#[dojo::model]
pub struct MatchQueue {
    #[key]
    pub queue_id: u8,               // MATCHMAKER::MAIN_QUEUE_ID
    //-----------------------
    pub max_size: u32,
    pub players_low: Array<ContractAddress>,
}

// player in matchmaker queue
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MatchPlayer {
    #[key]
    pub player_address: ContractAddress,
    // pub player_low: u128,           // u256(player_address).low
    //-----------------------
    // pub player_address: ContractAddress,
    pub duelist_id: u128,
    pub duel_id: u128,
    pub timestamp: u64,
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

#[generate_trait]
pub impl MatchPlayerImpl of MatchPlayerTrait {
    #[inline(always)]
    fn has_expired(self: @MatchPlayer) -> bool {
        (false)
    }
}
