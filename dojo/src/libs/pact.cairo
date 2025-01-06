// use debug::PrintTrait;
use core::option::OptionTrait;
use starknet::{ContractAddress};

use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::{
    challenge::{Challenge},
    duelist::{Pact},
};
use pistols::utils::misc::{ContractAddressIntoU256};
use pistols::libs::store::{Store, StoreTrait};

fn make_pact_pair(address_a: ContractAddress, address_b: ContractAddress) -> u128 {
    let aa: u256 = address_a.into();
    let bb: u256 = address_b.into();
    (aa.low ^ bb.low)
}

fn get_pact(ref store: Store, table_id: felt252, address_a: ContractAddress, address_b: ContractAddress) -> u128 {
    let pair: u128 = make_pact_pair(address_a, address_b);
    (store.get_pact(table_id, pair).duel_id)
}

fn set_pact(ref store: Store, challenge: Challenge) {
    let pair: u128 = make_pact_pair(challenge.address_a, challenge.address_b);
    let mut current_pact: Pact = store.get_pact(challenge.table_id, pair);
    // new pact: must not exist!
    assert(current_pact.duel_id == 0, DuelErrors::PACT_EXISTS);
    current_pact.duel_id = challenge.duel_id;
    store.set_pact(@current_pact);
}

fn unset_pact(ref store: Store, mut challenge: Challenge) {
    let pair: u128 = make_pact_pair(challenge.address_a, challenge.address_b);
    let current_pact: Pact = store.get_pact(challenge.table_id, pair);
    store.delete_pact(@current_pact);
}
