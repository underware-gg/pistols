use traits::{Into, TryInto};
use starknet::{ContractAddress};

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
    duelist_address: ContractAddress,
    round_number: u8,
}
