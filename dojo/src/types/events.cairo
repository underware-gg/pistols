use traits::{Into, TryInto};
use starknet::{ContractAddress};
use pistols::models::duelist::{ProfilePicType};

#[derive(Drop, starknet::Event)]
pub struct DuelistRegisteredEvent {
    address: ContractAddress,
    duelist_id: u128,
    name: felt252,
    profile_pic_type: ProfilePicType,
    profile_pic_uri: ByteArray,
    is_new: bool,
}

#[derive(Drop, starknet::Event)]
pub struct NewChallengeEvent {
    duel_id: u128,
    address_a: ContractAddress,
    address_b: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct ChallengeAcceptedEvent {
    duel_id: u128,
    address_a: ContractAddress,
    address_b: ContractAddress,
    accepted: bool,
}

#[derive(Drop, starknet::Event)]
pub struct ChallengeResolvedEvent {
    duel_id: u128,
    winner_address: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct DuelistTurnEvent {
    duel_id: u128,
    address: ContractAddress,
    round_number: u8,
}

//
// Emitted events are idenfified by the event name selector key
// which can be found like this:
// $ starkli selector NewChallengeEvent
// 0x014a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975
// + REMOVE ZEROS
// 0x14a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975
//
mod EVENT_SELECTOR {
    const DuelistRegisteredEvent: felt252 = 0x148c3db21a55576bc012023dc4d3b5bd570c519de855849eac52b1c5d6c9e85;
    const NewChallengeEvent: felt252 = 0x14a0df74df51e02ef8dedabfd1ea9684ea2087bed6370e881b156d7e2e56975;
    const ChallengeAcceptedEvent: felt252 = 0x31cdbf7ac39747303190a727df1a270ae5e4f05191f6f58e452ce4eb1e98abe;
    const ChallengeResolvedEvent: felt252 = 0x23dfe05a8414fd8464370e120099be69327b2a52ae6655ff23733651e8281b1;
    const DuelistTurnEvent: felt252 = 0x19556e1418f1e7a7e6962eff75d1a46abd50bda431139f855ba85c9119754a4;
}
