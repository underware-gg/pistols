use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

//
// Players need to register as a Duelist to play
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

//
// Challenge lifecycle
#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    state: u8,                  // actually a ChallengeState
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

//
// Current challenge from one Duelist to another
#[derive(Model, Copy, Drop, Serde)]
struct Pact {
    #[key]
    pair: u128,     // xor'd duelists
    duel_id: u128,  // current Challenge, or 0x0
}

//
// The move of each player on a Round
#[derive(Copy, Drop, Serde, Introspect)]
struct Move {
    hash: u64,      // hashed move (salt+move)
    salt: u64,      // the salt
    move: u8,       // the move
    damage: u8,     // amount of health taken
    health: u8,     // final health
}

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
}
