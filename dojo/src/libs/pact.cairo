// use debug::PrintTrait;
use core::option::OptionTrait;

use pistols::systems::tokens::duel_token::duel_token::{Errors as DuelErrors};
use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, WagerEntity, Round, RoundEntity, Moves};
use pistols::models::duelist::{Duelist, DuelistTrait, Pact, PactEntity};
use pistols::utils::hash::{hash_values};
use pistols::libs::store::{Store, StoreTrait};


fn make_pact_pair(duelist_a: u128, duelist_b: u128) -> u128 {
    let a: felt252 = duelist_a.into();
    let b: felt252 = duelist_b.into();
    // ids can be contract addresses or token ids (small integers)
    // hash it with itself to guarantee big unique numbers
    let aa: u256 = hash_values([a].span()).into();
    let bb: u256 = hash_values([b].span()).into();
    (aa.low ^ bb.low)
}

fn get_pact(store: Store, table_id: felt252, duelist_a: u128, duelist_b: u128) -> u128 {
    let pair: u128 = make_pact_pair(duelist_a, duelist_b);
    (store.get_pact_entity(table_id, pair).duel_id)
}

fn set_pact(store: Store, challenge: Challenge) {
    let pair: u128 = if (challenge.duelist_id_b > 0) {
        make_pact_pair(challenge.duelist_id_a, challenge.duelist_id_b)
    } else {
        make_pact_pair(DuelistTrait::address_as_id(challenge.address_a), DuelistTrait::address_as_id(challenge.address_b))
    };
    if (challenge.duel_id > 0) {
        // new pact: must not exist!
        let current_pact: u128 = store.get_pact_entity(challenge.table_id, pair).duel_id;
        assert(current_pact == 0, DuelErrors::PACT_EXISTS);
    }
    let pact: Pact = Pact {
        table_id: challenge.table_id,
        pair,
        duel_id: challenge.duel_id,
    };
    store.set_pact(@pact);
}

fn unset_pact(store: Store, mut challenge: Challenge) {
    challenge.duel_id = 0;
    set_pact(store, challenge);
}
