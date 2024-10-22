// use debug::PrintTrait;
use core::option::OptionTrait;
use zeroable::Zeroable;
use traits::{Into, TryInto};
use starknet::{ContractAddress};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::game::game::{Errors as ActionErrors};
use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, WagerEntity, Round, RoundEntity, Moves};
use pistols::models::duelist::{Duelist, DuelistTrait, DuelistEntity, Pact, PactEntity, Scoreboard, ScoreboardEntity, Score, ScoreTrait};
use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableType};
use pistols::models::config::{Config, ConfigEntity};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState, RoundStateTrait};
use pistols::types::cards::hand::{PacesCard, PacesCardTrait};
use pistols::types::constants::{CONST, HONOUR, CHANCES};
use pistols::utils::math::{MathU8, MathU16, MathU64};
use pistols::utils::bitwise::{BitwiseU32, BitwiseU64, BitwiseU128};
use pistols::utils::hash::{hash_values, felt_to_u128};
use pistols::libs::store::{Store, StoreTrait};
use pistols::libs::pact;


//------------------------
// Misc
//

// a moves hash is composed of a hash of each move
// * salt is hashed with each move
// * only a 32-bit part of each has is used
// move 1: 0x00000000000000000000000011111111
// move 2: 0x00000000000000002222222200000000
// move 3: 0x00000000333333330000000000000000
// move 4: 0x44444444000000000000000000000000
// * finally composed into a single u128
// hash  : 0x44444444333333332222222211111111
fn make_moves_hash(salt: felt252, moves: Span<u8>) -> u128 {
    let mut result: u128 = 0;
    let mut index: usize = 0;
    while (index < moves.len()) {
        let move: felt252 = (*moves.at(index)).into();
        if (move != 0) {
            let mask: u128 = BitwiseU128::shl(BitwiseU32::max().into(), index * 32);
            let hash: u128 = felt_to_u128(hash_values([salt, move].span()));
            result = result | (hash & mask);
        }
        index += 1;
    };
    (result)
}


// player need to allow contract to transfer funds first
// ierc20::approve(contract_address, max(wager.value, wager.fee));
fn deposit_wager_fees(store: Store, challenge: Challenge, from: ContractAddress, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(from);
        let allowance: u256 = table.ierc20().allowance(from, to);
        assert(balance >= total, ActionErrors::INSUFFICIENT_BALANCE);
        assert(allowance >= total, ActionErrors::NO_ALLOWANCE);
        table.ierc20().transfer_from(from, to, total);
    }
}
fn withdraw_wager_fees(store: Store, challenge: Challenge, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, ActionErrors::WITHDRAW_NOT_AVAILABLE); // should never happen!
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
        assert(balance >= total, ActionErrors::WAGER_NOT_AVAILABLE); // should never happen!
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


//------------------------
// Challenge setter
//

fn set_challenge(store: Store, challenge: Challenge) {
    store.set_challenge(@challenge);

    // Start Round
    if (challenge.state.is_canceled()) {
        // transfer wager/fee back to challenger
        withdraw_wager_fees(store, challenge, challenge.address_a);
    } else if (challenge.state == ChallengeState::InProgress) {
        let new_round = Round {
            duel_id: challenge.duel_id,
            round_number: challenge.round_number,
            state: RoundState::Commit,
            moves_a: Default::default(),
            moves_b: Default::default(),
            state_a: Default::default(),
            state_b: Default::default(),
            final_step: 0,
        };
        store.set_round(@new_round);
    } else if (challenge.state.is_finished()) {
        // get duelist as Entity, as we know they exist
        let mut duelist_a: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_a);
        let mut duelist_b: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_b);
        // Scoreboards we need the model, since they may not exist yet
        let mut scoreboard_a: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_a);
        let mut scoreboard_b: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_b);
        
        // update totals
        update_score_totals(ref duelist_a.score, ref duelist_b.score, challenge.state, challenge.winner);
        update_score_totals(ref scoreboard_a.score, ref scoreboard_b.score, challenge.state, challenge.winner);

        // compute honour from final round
        let round: RoundEntity = store.get_round_entity(challenge.duel_id, challenge.round_number);

        // update honour and levels
        update_score_honour(ref duelist_a.score, round.state_a.honour);
        update_score_honour(ref duelist_b.score, round.state_b.honour);
        update_score_honour(ref scoreboard_a.score, round.state_a.honour);
        update_score_honour(ref scoreboard_b.score, round.state_b.honour);

        // split wager/fee to winners and benefactors
        if (round.state_a.wager > round.state_b.wager) {
            // duelist_a won the Wager
            let wager_value: u128 = split_wager_fees(store, challenge, challenge.address_a, challenge.address_a);
            scoreboard_a.wager_won += wager_value;
            scoreboard_b.wager_lost += wager_value;
        } else if (round.state_a.wager < round.state_b.wager) {
            // duelist_b won the Wager
            let wager_value: u128 = split_wager_fees(store, challenge, challenge.address_b, challenge.address_b);
            scoreboard_a.wager_lost += wager_value;
            scoreboard_b.wager_won += wager_value;
        } else {
            // no-one gets the Wager
            split_wager_fees(store, challenge, challenge.address_a, challenge.address_b);
        }
        
        // save
        store.set_duelist_entity(@duelist_a);
        store.set_duelist_entity(@duelist_b);
        store.set_scoreboard(@scoreboard_a);
        store.set_scoreboard(@scoreboard_b);

        // undo pact
        pact::unset_pact(store, challenge);
    }
}

// update duel totals only
fn update_score_totals(ref score_a: Score, ref score_b: Score, state: ChallengeState, winner: u8) {
    score_a.total_duels += 1;
    score_b.total_duels += 1;
    if (state == ChallengeState::Draw) {
        score_a.total_draws += 1;
        score_b.total_draws += 1;
    } else if (winner == 1) {
        score_a.total_wins += 1;
        score_b.total_losses += 1;
    } else if (winner == 2) {
        score_a.total_losses += 1;
        score_b.total_wins += 1;
    } else {
        // should never get here!
    }
}
// average honour has an extra decimal, eg: 100 = 10.0
fn update_score_honour(ref score: Score, duel_honour: u8) {
    let history_pos: usize = ((score.total_duels.into() - 1) % 8) * 8;
    score.honour_history =
        (score.honour_history & ~BitwiseU64::shl(0xff, history_pos)) |
        BitwiseU64::shl(duel_honour.into(), history_pos);
    score.honour = (BitwiseU64::sum_bytes(score.honour_history) / MathU64::min(score.total_duels.into(), 8)).try_into().unwrap();
}
