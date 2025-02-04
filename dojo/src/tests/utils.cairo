
//
// from Origami:
// https://github.com/dojoengine/origami/blob/main/crates/token/src/tests/utils.cairo
//

use starknet::{ContractAddress, testing};

pub fn impersonate(address: ContractAddress) {
    testing::set_contract_address(address);
    testing::set_account_contract_address(address);
}

/// Pop the earliest unpopped logged event for the contract as the requested type
/// and checks there's no more data left on the event, preventing unaccounted params.
/// Indexed event members are currently not supported, so they are ignored.
pub fn pop_log<T, impl TDrop: Drop<T>, impl TEvent: starknet::Event<T>>(
    address: ContractAddress
) -> Option<T> {
    let (mut keys, mut data) = testing::pop_log_raw(address)?;
    let ret = starknet::Event::deserialize(ref keys, ref data);
    assert(data.is_empty(), 'Event has extra data');
    ret
}

pub fn assert_no_events_left(address: ContractAddress) {
    assert(testing::pop_log_raw(address).is_none(), 'Events remaining on queue');
}

pub fn drop_event(address: ContractAddress) {
    match testing::pop_log_raw(address) {
        core::option::Option::Some(_) => {},
        core::option::Option::None => {},
    };
}

pub fn drop_all_events(address: ContractAddress) {
    loop {
        match testing::pop_log_raw(address) {
            core::option::Option::Some(_) => {},
            core::option::Option::None => { break; },
        };
    }
}
