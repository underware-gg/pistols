use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

//
// Players need to register as a Duelist to play
#[derive(Model, Copy, Drop, Serde)]
struct Duelist {
    #[key]
    address: ContractAddress,
    name: felt252,
    profile_pic: u8,
    total_duels: u16,
    total_wins: u16,
    total_losses: u16,
    total_draws: u16,
    total_honour: u32,  // sum of al duels Honour
    honour: u8,         // +1 decimal, eg: 100 = 10.0
    timestamp: u64,     // Unix time, 1st registered
} // f + 176 bits

//
// Challenge lifecycle
#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    message: felt252,           // message to challenged
    // progress and results
    state: u8,                  // actually a ChallengeState
    round_number: u8,           // current or final
    winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    // a 32-bit timestamp will last 82 more years
    // Sunday, February 7, 2106 6:28:15 AM
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
} // f + f + f + 152 bits

//
// Current challenge from one Duelist to another
#[derive(Model, Copy, Drop, Serde)]
struct Pact {
    #[key]
    pair: u128,     // xor'd duelists
    duel_id: u128,  // current Challenge, or 0x0
} // 128 bits

//
// The move of each player on a Round
#[derive(Copy, Drop, Serde, Introspect)]
struct Move {
    hash: felt252,  // hashed move (salt+move)
    salt: u64,      // the salt
    move: u8,       // the move
    dice1: u8,      // dice roll result (0..99)
    dice2: u8,      // dice roll result (0..99)
    damage: u8,     // amount of health taken
    block: u8,      // amount of damage blocked
    health: u8,     // final health
} // f + 112 bits

//
// Each duel round
#[derive(Model, Copy, Drop, Serde)]
struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round_number: u8,
    state: u8,          // actually a RoundState
    duelist_a: Move,    // duelist_a move
    duelist_b: Move,    // duelist_b move
} // f + f + 224 bits
