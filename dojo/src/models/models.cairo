use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

#[derive(Model, Copy, Drop, Serde)]
struct Duelist {
    #[key]
    address: ContractAddress,
    timestamp: u64,   // Unix time, 1st registered
    name: felt252,
    profile_pic: u8,
    total_duels: u32,
    total_wins: u32,
    total_losses: u32,
    total_draws: u32,
    honor: u8,
}

#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    state: u8,                  // ChallengeState
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    message: felt252,           // message to challenged
    pass_code: felt252,
    // progress and results
    round_number: u8,           // current or final
    winner: ContractAddress,    // if (state == ChallengeState.Resolved)
    // times
    timestamp: u64,             // Unix time, created
    timestamp_expire: u64,      // Unix time, challenge expiration
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
}

#[derive(Model, Copy, Drop, Serde)]
struct Pact {
    #[key]
    pair: u128,     // xor'd duelists
    duel_id: u128,  // current Challenge, or 0x0
}

#[derive(Model, Copy, Drop, Serde)]
struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round_number: u8,
    // duelist_a
    hash_a: u64,    // hashed move (salt+move)
    salt_a: u64,    // the salt
    move_a: u8,     // the move
    health_a: u8,   // final health
    // duelist_b
    hash_b: u64,    // hashed move (salt+move)
    salt_b: u64,    // the salt
    move_b: u8,     // the move
    health_b: u8,   // final health
    // result?
}
