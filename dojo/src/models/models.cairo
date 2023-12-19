use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

#[derive(Model, Copy, Drop, Serde)]
struct Duelist {
    #[key]
    address: ContractAddress,
    name: felt252,
}

#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    state: ChallengeState,
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    timestamp: u64,             // Unix time, created
    timestamp_expire: u64,      // Unix time
    message: felt252,           // message to challenged
    pass_code: felt252,
}

#[derive(Model, Copy, Drop, Serde)]
struct Duel {
    #[key]
    duel_id: u128,
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time
    pace: u8,
    winner: ContractAddress,
}
