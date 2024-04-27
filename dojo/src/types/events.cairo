use traits::{Into, TryInto};
use starknet::{ContractAddress};

#[derive(Drop, starknet::Event)]
struct DuelistRegistered {
    address: ContractAddress,
    name: felt252,
    profile_pic: u8,
    is_new: bool,
}

#[derive(Drop, starknet::Event)]
struct NewChallengeEvent {
    duel_id: u128,
    duelist_a: ContractAddress,
    duelist_b: ContractAddress,
}

#[derive(Drop, starknet::Event)]
struct ChallengeAcceptedEvent {
    duel_id: u128,
    duelist_a: ContractAddress,
    duelist_b: ContractAddress,
    accepted: bool,
}

#[derive(Drop, starknet::Event)]
struct DuelistTurnEvent {
    duel_id: u128,
    address: ContractAddress,
    round_number: u8,
}

//
// Emitted events are idenfified by the event name selector key
// which can be found like this:
// $ starkli selector NewChallengeEvent
// 0x014a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975
//
mod selector {
    const DuelistRegistered: felt252 = 0x1afe932323a4032d23a471be00bb333912509b20609983ac2159aa2394f9e5f;
    const NewChallengeEvent: felt252 = 0x14a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975;
    const ChallengeAcceptedEvent: felt252 = 0x31cdbf7ac39747303190a727df1a270ae5e4f05191f6f58e452ce4eb1e98abe;
    const DuelistTurnEvent: felt252 = 0x19556e1418f1e7a7e6962eff75d1a46abd50bda431139f855ba85c9119754a4;
}
