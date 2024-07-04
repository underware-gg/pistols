use starknet::ContractAddress;
use pistols::models::duelist::{Score};

//-------------------------
// Challenge lifecycle
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Challenge {
    #[key]
    duel_id: u128,
    //-------------------------
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    message: felt252,           // message to challenged
    table_id: felt252,
    // progress and results
    state: u8,                  // actually a ChallengeState
    round_number: u8,           // current or final
    winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
} // [f] [f] [f] [152]

// Challenge wager (optional)
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Wager {
    #[key]
    duel_id: u128,
    //------------
    value: u256,
    fee: u256,
}

// Score snapshot
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Snapshot {
    #[key]
    duel_id: u128,
    //-------------------------
    score_a: Score,
    score_b: Score,
}

//
// Each duel round
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round_number: u8,
    //---------------
    state: u8,      // actually a RoundState
    shot_a: Shot,   // duelist_a shot
    shot_b: Shot,   // duelist_b shot
} // (8 + 224 + 224) = 456 bits ~ 2 felts (max 504)

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Introspect)]
struct Shot {
    // player input
    hash: u64,          // hashed action (salt + action)
    salt: u64,          // the player's secret salt
    action: u16,        // the player's chosen action(s) (paces, weapon, ...)
    // shot results
    chance_crit: u8,    // computed chances (1..100) - kill / double damage
    chance_hit: u8,     // computed chances (1..100) - hit / normal damage
    dice_crit: u8,      // dice roll result (1..100) - kill / double damage
    dice_hit: u8,       // dice roll result (1..100) - hit / normal damage
    damage: u8,         // amount of health taken
    block: u8,          // amount of damage blocked
    win: u8,            // wins the round
    wager: u8,          // wins the wager
    // player state
    health: u8,         // final health
    honour: u8,         // honour granted
} // 224 bits


