// use debug::PrintTrait;
use core::option::OptionTrait;
use zeroable::Zeroable;
use traits::{Into, TryInto};
use starknet::{ContractAddress};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::actions::actions::{Errors};
use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, WagerEntity, Round, RoundEntity, Shot};
use pistols::models::duelist::{Duelist, DuelistTrait, DuelistEntity, Pact, PactEntity, Scoreboard, ScoreboardEntity, Score, ScoreTrait};
use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableType, TableTypeTrait};
use pistols::models::config::{Config, ConfigEntity};
use pistols::models::init::{init};
use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
use pistols::types::round_state::{RoundState, RoundStateTrait};
use pistols::types::cards::hand::{PacesCard, PacesCardTrait};
use pistols::types::constants::{CONST, HONOUR, CHANCES};
use pistols::utils::math::{MathU8, MathU16, MathU64};
use pistols::utils::bitwise::{BitwiseU32, BitwiseU64, BitwiseU128};
use pistols::utils::hash::{hash_values, felt_to_u128};
use pistols::libs::store::{Store, StoreTrait};


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
            result = result | (
                felt_to_u128(hash_values([salt, move].span()))
                & BitwiseU128::shl(BitwiseU32::max().into(), index * 32)
            );
        }
        index += 1;
    };
    (result)
}



//------------------------
// Pact management
//

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
        assert(current_pact == 0, Errors::CHALLENGE_EXISTS);
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


// player need to allow contract to transfer funds first
// ierc20::approve(contract_address, max(wager.value, wager.fee));
fn deposit_wager_fees(store: Store, challenge: Challenge, from: ContractAddress, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(from);
        let allowance: u256 = table.ierc20().allowance(from, to);
        assert(balance >= total, Errors::INSUFFICIENT_BALANCE);
        assert(allowance >= total, Errors::NO_ALLOWANCE);
        table.ierc20().transfer_from(from, to, total);
    }
}
fn withdraw_wager_fees(store: Store, challenge: Challenge, to: ContractAddress) {
    let wager: WagerEntity = store.get_wager_entity(challenge.duel_id);
    let total: u256 = (wager.value + wager.fee).into();
    if (total > 0) {
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, Errors::WITHDRAW_NOT_AVAILABLE); // should never happen!
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
        assert(balance >= total, Errors::WAGER_NOT_AVAILABLE); // should never happen!
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
            shot_a: init::Shot(),
            shot_b: init::Shot(),
        };
        store.set_round(@new_round);
    } else if (challenge.state.is_finished()) {
        // End Duel!
        let mut duelist_a: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_a);
        let mut duelist_b: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_b);
        let mut scoreboard_a: ScoreboardEntity = store.get_scoreboard_entity(challenge.table_id, challenge.duelist_id_a);
        let mut scoreboard_b: ScoreboardEntity = store.get_scoreboard_entity(challenge.table_id, challenge.duelist_id_b);
        
        // update totals
        update_score_totals(ref duelist_a.score, ref duelist_b.score, challenge.state, challenge.winner);
        update_score_totals(ref scoreboard_a.score, ref scoreboard_b.score, challenge.state, challenge.winner);

        // compute honour from final round
        let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
        let round: RoundEntity = store.get_round_entity(challenge.duel_id, challenge.round_number);

        // update honour and levels
        let calc_levels = !table.table_type.maxxed_up_levels();
        update_score_honour(ref duelist_a.score, round.shot_a.state_final.honour, true);
        update_score_honour(ref duelist_b.score, round.shot_b.state_final.honour, true);
        update_score_honour(ref scoreboard_a.score, round.shot_a.state_final.honour, calc_levels);
        update_score_honour(ref scoreboard_b.score, round.shot_b.state_final.honour, calc_levels);

        // split wager/fee to winners and benefactors
        if (round.shot_a.wager > round.shot_b.wager) {
            // duelist_a won the Wager
            let wager_value: u128 = split_wager_fees(store, challenge, challenge.address_a, challenge.address_a);
            scoreboard_a.wager_won += wager_value;
            scoreboard_b.wager_lost += wager_value;
        } else if (round.shot_a.wager < round.shot_b.wager) {
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
        store.set_scoreboard_entity(@scoreboard_a);
        store.set_scoreboard_entity(@scoreboard_b);
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
fn update_score_honour(ref score: Score, duel_honour: u8, calc_levels: bool) {
    let history_pos: usize = ((score.total_duels.into() - 1) % 8) * 8;
    score.honour_history =
        (score.honour_history & ~BitwiseU64::shl(0xff, history_pos)) |
        BitwiseU64::shl(duel_honour.into(), history_pos);
    score.honour = (BitwiseU64::sum_bytes(score.honour_history) / MathU64::min(score.total_duels.into(), 8)).try_into().unwrap();
    if (calc_levels) {
        score.level_villain = calc_level_villain(score.honour);
        score.level_lord = calc_level_lord(score.honour);
        score.level_trickster = _average_trickster(calc_level_trickster(score.honour, duel_honour), score.level_trickster);
    }
}

// Villain bonus: the less honour, more bonus
#[inline(always)]
fn calc_level_villain(honour: u8) -> u8 {
    if (honour < HONOUR::TRICKSTER_START) {
        (MathU8::map(honour, HONOUR::VILLAIN_START, HONOUR::TRICKSTER_START-1, HONOUR::LEVEL_MAX, HONOUR::LEVEL_MIN))
    } else { (0) }
}
// Lord bonus: the more honour, more bonus
#[inline(always)]
fn calc_level_lord(honour: u8) -> u8 {
    if (honour >= HONOUR::LORD_START) {
        (MathU8::map(honour, HONOUR::LORD_START, HONOUR::MAX, HONOUR::LEVEL_MIN, HONOUR::LEVEL_MAX))
    } else { (0) }
}
// Trickster bonus: the max of...
// high on opposites, less in the middle (shaped as a \/)
// cap halfway without going to zero (shaped as a /\)
#[inline(always)]
fn calc_level_trickster(honour: u8, duel_honour: u8) -> u8 {
    if (honour >= HONOUR::TRICKSTER_START && honour < HONOUR::LORD_START) {
        // simple \/ shape of LEVEL_MAX/2 at middle range to LEVEL_MAX at extremities
        let level_i: i16 = MathU8::map(duel_honour, HONOUR::VILLAIN_START, HONOUR::MAX, 0, HONOUR::LEVEL_MAX).try_into().unwrap() - (HONOUR::LEVEL_MAX / 2).into();
        let level: u8 = MathU16::abs(level_i).try_into().unwrap() + (HONOUR::LEVEL_MAX / 2);
        (level)
    } else { (0) }
}
// Always average with the current trickster bonus
// for Tricksters: smooth bonuses
// for (new) Lords and Villains: Do not go straight to zero when a Trickster switch archetype
#[inline(always)]
fn _average_trickster(new_level: u8, current_level: u8) -> u8 {
    if (new_level > 0) {
        ((new_level + current_level) / 2)
    } else { (new_level) }
}

