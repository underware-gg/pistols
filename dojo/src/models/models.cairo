use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

#[derive(Model, Copy, Drop, Serde)]
struct Duelist {
    #[key]
    address: ContractAddress,
    name: felt252,
    profile_pic: u8,
}

#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    state: ChallengeState,
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    message: felt252,           // message to challenged
    pass_code: felt252,
    // progress and results
    round: u8,
    winner: ContractAddress,
    // times
    timestamp: u64,             // Unix time, created
    timestamp_expire: u64,      // Unix time, challenge expiration
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
}

#[derive(Model, Copy, Drop, Serde)]
struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round: u8,
    move_a: u8,     // Challenger move
    move_b: u8,     // Challenged move
    health_a: u8,   // Challenger final health
    health_b: u8,   // Challenged final health
}
