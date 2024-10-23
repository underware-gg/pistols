// use debug::PrintTrait;
use core::option::OptionTrait;
use zeroable::Zeroable;
use traits::{Into, TryInto};
use starknet::{ContractAddress};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::game::game::{Errors as GameErrors};
use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, WagerEntity, Round, RoundEntity, Moves};
use pistols::models::duelist::{Duelist, DuelistTrait, DuelistEntity, Score, ScoreTrait};
use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableType};
use pistols::models::config::{Config, ConfigEntity};
use pistols::libs::store::{Store, StoreTrait};


//------------------------
// Misc
//

// player need to allow contract to transfer funds first
// ierc20::approve(contract_address, max(wager.value, wager.fee));
fn deposit_wager_fees(store: Store, challenge: Challenge, from: ContractAddress, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(from);
        let allowance: u256 = table.ierc20().allowance(from, to);
        assert(balance >= total, GameErrors::INSUFFICIENT_BALANCE);
        assert(allowance >= total, GameErrors::NO_ALLOWANCE);
        table.ierc20().transfer_from(from, to, total);
    }
}
fn withdraw_wager_fees(store: Store, challenge: Challenge, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, GameErrors::WITHDRAW_NOT_AVAILABLE); // should never happen!
        table.ierc20().transfer(to, total);
    }
}
// spllit wager beteen address_a and address_b
fn split_wager_fees(store: Store, challenge: Challenge, address_a: ContractAddress, address_b: ContractAddress) -> u128 {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into() * 2;
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, GameErrors::WAGER_NOT_AVAILABLE); // should never happen!
        if (wager.value > 0) {
            if (address_a == address_b) {
                // single winner
                table.ierc20().transfer(address_a, wager.value.into() * 2);
            } else {
                // split wager back to addresss
                table.ierc20().transfer(address_a, wager.value.into());
                table.ierc20().transfer(address_b, wager.value.into());
            }
        }
        if (wager.fee > 0) {
            let fees_address: ContractAddress =
                if (table.fee_collector_address.is_non_zero()) {
                    (table.fee_collector_address)
                } else {
                    let config: ConfigEntity = store.get_config_entity();
                    (config.treasury_address)
                };
            if (fees_address.is_non_zero() && fees_address != starknet::get_contract_address()) {
                table.ierc20().transfer(fees_address, wager.fee.into() * 2);
            }
        }
    }
    (wager.value)
}
