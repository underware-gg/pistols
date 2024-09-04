// use debug::PrintTrait;
use core::option::OptionTrait;
use zeroable::Zeroable;
use traits::{Into, TryInto};
use starknet::{ContractAddress};

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::actions::actions::{Errors};
use pistols::models::challenge::{Challenge, ChallengeEntity, Snapshot, SnapshotEntity, Wager, WagerEntity, Round, RoundEntity, Shot};
use pistols::models::duelist::{Duelist, DuelistTrait, DuelistEntity, Pact, PactEntity, Scoreboard, ScoreboardEntity, Score, ScoreTrait};
use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableType, TableTypeTrait};
use pistols::models::config::{Config, ConfigEntity};
use pistols::models::init::{init};
use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
use pistols::types::round::{RoundState, RoundStateTrait};
use pistols::types::action::{Action, ActionTrait, ACTION};
use pistols::types::constants::{CONST, HONOUR, CHANCES};
use pistols::utils::math::{MathU8, MathU16, MathU64};
use pistols::utils::bitwise::{BitwiseU64};
use pistols::libs::store::{Store, StoreTrait};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;


//------------------------
// Misc
//

#[inline(always)]
fn make_action_hash(salt: u64, packed: u16) -> u64 {
    let hash: u256 = pedersen(salt.into(), packed.into()).into() & CONST::HASH_SALT_MASK;
    (hash.try_into().unwrap())
}

#[inline(always)]
fn make_round_salt(round: Round) -> u64 {
    (round.shot_a.salt ^ round.shot_b.salt)
}

#[inline(always)]
fn scramble_salt(salt: u64) -> u64 {
    let hash: u256 = pedersen(salt.into(), (~salt).into()).into() & CONST::HASH_SALT_MASK;
    (hash.try_into().unwrap())
}


//------------------------
// Pact management
//

fn make_pact_pair(duelist_a: u128, duelist_b: u128) -> u128 {
    let a: felt252 = duelist_a.into();
    let b: felt252 = duelist_b.into();
    // ids can be contract addresses or token ids (small integers)
    // hash it with itself to guarantee big unique numbers
    let aa: u256 = pedersen(a, a).into();
    let bb: u256 = pedersen(b, b).into();
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


//------------------------
// Challenge management
//

fn create_challenge_snapshot(store: Store, challenge: Challenge) {
    // copy data from Table scoreboard
    let mut scoreboard_a: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_a);
    let mut scoreboard_b: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_b);
    // check maxxed up tables...
    let table : TableConfigEntity = store.get_table_config_entity(challenge.table_id);
    if (table.table_type.maxxed_up_levels()) {
        // new duelist on this table, copy levels from main scoreboard
        clone_snapshot_duelist_levels(store, challenge.duelist_id_a, ref scoreboard_a);
        clone_snapshot_duelist_levels(store, challenge.duelist_id_b, ref scoreboard_b);
    }
    // create snapshot
    let snapshot = Snapshot {
        duel_id: challenge.duel_id,
        score_a: scoreboard_a.score,
        score_b: scoreboard_b.score,
    };
    store.set_snapshot(@snapshot);
}
fn clone_snapshot_duelist_levels(store: Store, duelist_id: u128, ref scoreboard: Scoreboard) {
    // only new duelist on this table...
    if (scoreboard.score.total_duels == 0) {
        // maxx up main scoreboard levels
        let duelist: DuelistEntity = store.get_duelist_entity(duelist_id);
        scoreboard.score.level_villain = if (duelist.score.is_villain()) {HONOUR::LEVEL_MAX} else {0};
        scoreboard.score.level_trickster = if (duelist.score.is_trickster()) {HONOUR::LEVEL_MAX} else {0};
        scoreboard.score.level_lord = if (duelist.score.is_lord()) {HONOUR::LEVEL_MAX} else {0};
        store.set_scoreboard(@scoreboard);
    }
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
// Action validators
//

// Validate possible actions, exposed to system
fn get_valid_packed_actions(round_number: u8) -> Array<u16> {
    if (round_number == 1) {
        (array![
            (ACTION::PACES_1).into(),
            (ACTION::PACES_2).into(),
            (ACTION::PACES_3).into(),
            (ACTION::PACES_4).into(),
            (ACTION::PACES_5).into(),
            (ACTION::PACES_6).into(),
            (ACTION::PACES_7).into(),
            (ACTION::PACES_8).into(),
            (ACTION::PACES_9).into(),
            (ACTION::PACES_10).into(),
        ])
    } else if (round_number == 2) {
        (array![
            // 2 slots
            pack_action_slots(ACTION::FAST_BLADE, ACTION::FAST_BLADE),
            pack_action_slots(ACTION::FAST_BLADE, ACTION::BLOCK),
            pack_action_slots(ACTION::BLOCK, ACTION::FAST_BLADE),
            pack_action_slots(ACTION::BLOCK, ACTION::BLOCK),
            // slot 1 only
            ACTION::FAST_BLADE.into(), // pack_action_slots(ACTION::FAST_BLADE, ACTION::IDLE),
            ACTION::BLOCK.into(),      // pack_action_slots(ACTION::BLOCK, ACTION::IDLE),
            ACTION::FLEE.into(),       // pack_action_slots(ACTION::FLEE, ACTION::IDLE),
            ACTION::STEAL.into(),      // pack_action_slots(ACTION::STEAL, ACTION::IDLE),
            ACTION::SEPPUKU.into(),    // pack_action_slots(ACTION::SEPPUKU, ACTION::IDLE),
            // slot 2 only
            pack_action_slots(ACTION::IDLE, ACTION::SLOW_BLADE),
            pack_action_slots(ACTION::IDLE, ACTION::FAST_BLADE),
            pack_action_slots(ACTION::IDLE, ACTION::BLOCK),
            // Idle / no action
            0, // pack_action_slots(ACTION::IDLE, ACTION::IDLE),
        ])
    } else {
        (array![])
    }
}
fn validate_packed_actions(round_number: u8, packed: u16) -> bool {
    let valid_actions = get_valid_packed_actions(round_number);
    let mut len: usize = valid_actions.len();
    let mut n: usize = 0;
    loop {
        if (n == len || packed == *valid_actions.at(n)) {
            break;
        }
        n += 1;
    };
    (n < len)
}

// unpack validated actions
// can re-arrange on some matches
fn unpack_round_slots(round: Round) -> (u8, u8, u8, u8) {
    let (slot1_a, slot2_a): (u8, u8) = unpack_action_slots(round.shot_a.action);
    let (slot1_b, slot2_b): (u8, u8) = unpack_action_slots(round.shot_b.action);
    // if slot 1 is empty, promote slot 2
    if (slot1_a == 0 && slot1_b == 0) {
        return (slot2_a, slot2_b, 0, 0);
    }
    let action_a: Action = slot1_a.into();
    let action_b: Action = slot1_b.into();
    // Double Steal decides in a 1 pace face-off
    if (action_a == Action::Steal && action_b == Action::Steal) {
        return (slot1_a, slot1_b, ACTION::PACES_1, ACTION::PACES_1);
    }
    // Runners against blades
    let runner_a: bool = action_a.is_runner();
    let runner_b: bool = action_b.is_runner();
    if (runner_a && !runner_b) {
        return (slot1_a, action_a.runner_against_blades().into(), 0, 0);
    }
    if (runner_b && !runner_a) {
        return (action_b.runner_against_blades().into(), slot1_b, 0, 0);
    }
    (slot1_a, slot1_b, slot2_a, slot2_b)
}

// packers
fn pack_action_slots(slot1: u8, slot2: u8) -> u16 {
    (slot1.into() | (slot2.into() * 0x100))
}
fn unpack_action_slots(packed: u16) -> (u8, u8) {
    let slot1: u8 = (packed & 0xff).try_into().unwrap();
    let slot2: u8 = ((packed & 0xff00) / 0x100).try_into().unwrap();
    (slot1, slot2)
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
        let mut shot_a = init::Shot();
        let mut shot_b = init::Shot();

        if (challenge.round_number == 1) {
            // Round 1 starts with full health
            shot_a.health = CONST::FULL_HEALTH;
            shot_b.health = CONST::FULL_HEALTH;
        } else {
            // Round 2+ need to copy previous Round's state
            let prev_round: RoundEntity = store.get_round_entity(challenge.duel_id, challenge.round_number - 1);
            shot_a.health = prev_round.shot_a.health;
            shot_b.health = prev_round.shot_b.health;
            shot_a.honour = prev_round.shot_a.honour;
            shot_b.honour = prev_round.shot_b.honour;
        }

        let new_round = Round {
            duel_id: challenge.duel_id,
            round_number: challenge.round_number,
            state: RoundState::Commit,
            shot_a,
            shot_b,
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
        let final_round: RoundEntity = store.get_round_entity(challenge.duel_id, challenge.round_number);

        // update honour and levels
        let calc_levels = !table.table_type.maxxed_up_levels();
        update_score_honour(ref duelist_a.score, final_round.shot_a.honour, true);
        update_score_honour(ref duelist_b.score, final_round.shot_b.honour, true);
        update_score_honour(ref scoreboard_a.score, final_round.shot_a.honour, calc_levels);
        update_score_honour(ref scoreboard_b.score, final_round.shot_b.honour, calc_levels);

        // split wager/fee to winners and benefactors
        if (final_round.shot_a.wager > final_round.shot_b.wager) {
            // duelist_a won the Wager
            let wager_value: u128 = split_wager_fees(store, challenge, challenge.address_a, challenge.address_a);
            scoreboard_a.wager_won += wager_value;
            scoreboard_b.wager_lost += wager_value;
        } else if (final_round.shot_a.wager < final_round.shot_b.wager) {
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


//------------------------
// Chances
//

// crit bonus will be applied for Lords only
fn calc_crit_chances(attacker: Score, defender: Score, attack: Action, defense: Action, health: u8, table_type: TableType) -> u8 {
    let crit_chance: u8 = attack.crit_chance();
// calc_crit_bonus(attacker, table_type).print();
    if (crit_chance == 0) { (0) }
    else {
        (_apply_chance_bonus_penalty(
            crit_chance,
            calc_crit_bonus(attacker, table_type) + calc_crit_match_bonus(attacker, attack, defense),
            0 + calc_crit_trickster_penalty(attacker, defender),
        ))
    }
}
// Hit chances will be applied to Villains only
// Both Hit and Lethal go up/down with same bonus/penalty
fn calc_hit_chances(attacker: Score, defender: Score, attack: Action, defense: Action, health: u8, table_type: TableType) -> u8 {
    let hit_chance: u8 = attack.hit_chance();
    if (hit_chance == 0) { (0) }
    else {
        (_apply_chance_bonus_penalty(
            hit_chance,
            calc_hit_bonus(attacker, table_type),
            calc_hit_injury_penalty(attack, health) + calc_hit_trickster_penalty(attacker, defender),
        ))
    }
}
fn calc_lethal_chances(attacker: Score, defender: Score, attack: Action, defense: Action, hit_chances: u8) -> u8 {
    let lethal_chance: u8 = attack.lethal_chance();
    if (lethal_chance == 0) { (0) }
    else {
        // lethal chances are inside hit chances
        // we use the difference to apply hit penalties
        let diff: u8 = (attack.hit_chance() - lethal_chance);
        (_apply_chance_bonus_penalty(
            MathU8::sub(hit_chances, diff),
            0,
            calc_lethal_lord_penalty(attacker, defender, attack, defense),
        ))
    }
}
fn _apply_chance_bonus_penalty(chance: u8, bonus: u8, penalty: u8) -> u8 {
    (MathU8::clamp(
        MathU8::sub(chance + bonus, penalty),
        (chance / 2),       // never go below half chance
        CHANCES::ALWAYS,    // never go above 100
    ))
}

//
// bonuses
//

fn calc_crit_bonus(attacker: Score, table_type: TableType) -> u8 {
    let max_level: u16 = if (table_type.maxxed_up_levels()) {HONOUR::LEVEL_MAX.into()} else {(attacker.total_duels * 10)};
    if (attacker.is_lord()) {
        (_calc_bonus(CHANCES::CRIT_BONUS_LORD, attacker.level_lord, max_level))
    } else if (attacker.is_trickster()) {
        (_calc_bonus(CHANCES::CRIT_BONUS_TRICKSTER, attacker.level_trickster, max_level))
    } else {
        (0)
    }
}
fn calc_hit_bonus(attacker: Score, table_type: TableType) -> u8 {
    let max_level: u16 = if (table_type.maxxed_up_levels()) {HONOUR::LEVEL_MAX.into()} else {(attacker.total_duels * 10)};
    if (attacker.is_villain()) {
        (_calc_bonus(CHANCES::HIT_BONUS_VILLAIN, attacker.level_villain, max_level))
    } else if (attacker.is_trickster()) {
        (_calc_bonus(CHANCES::HIT_BONUS_TRICKSTER, attacker.level_trickster, max_level))
    } else {
        (0)
    }
}
fn _calc_bonus(bonus_max: u8, level: u8, max_level: u16) -> u8 {
    if (level > 0 && max_level > 0) {
        (MathU8::max(1, MathU8::map(
            MathU16::min(level.into(), max_level).try_into().unwrap(),
            0, HONOUR::LEVEL_MAX,
            0, bonus_max)
        ))
    } else {
        (0)
    }
}

fn calc_crit_match_bonus(attacker: Score, attack: Action, defense: Action) -> u8 {
    if (attacker.is_lord()) {
        if (attack.paces_priority(defense) < 0) { (CHANCES::EARLY_LORD_CRIT_BONUS) } else { (0) }
    } else if (attacker.is_villain()) {
        if (attack.paces_priority(defense) > 0) { (CHANCES::LATE_VILLAIN_CRIT_BONUS) } else { (0) }
    } else {
        (0)
    }
}

//
// penalties
//
// #[inline(always)]
// fn calc_crit_penalty(attack: Action, health: u8) -> u8 {
//     (_calc_penalty(health, attack.crit_penalty()))
// }
#[inline(always)]
fn calc_hit_injury_penalty(attack: Action, health: u8) -> u8 {
    (_calc_penalty(health, attack.hit_penalty()))
}
#[inline(always)]
fn _calc_penalty(health: u8, penalty_per_damage: u8) -> u8 {
    ((CONST::FULL_HEALTH - health) * penalty_per_damage)
}


fn calc_crit_trickster_penalty(attacker: Score, defender: Score) -> u8 {
    (_calc_trickster_penalty(attacker, defender, CHANCES::TRICKSTER_CRIT_PENALTY))
}
fn calc_hit_trickster_penalty(attacker: Score, defender: Score) -> u8 {
    (_calc_trickster_penalty(attacker, defender, CHANCES::TRICKSTER_HIT_PENALTY))
}
#[inline(always)]
fn _calc_trickster_penalty(attacker: Score, defender: Score, penalty: u8) -> u8 {
    // tricksters reduce non-trickster chances to hit
    if (defender.is_trickster() && !attacker.is_trickster()) {
        (penalty)
    } else {
        (0)
    }
}

fn calc_lethal_lord_penalty(attacker: Score, defender: Score, attack: Action, defense: Action) -> u8 {
    // lord shooting late have <penalty> chances to get less damage
    if (defender.is_lord() && !attacker.is_lord() && attack.paces_priority(defense) > 0) {
        (CHANCES::LORD_LETHAL_PENALTY)
    } else {
        (0)
    }
}




//------------------------
// Randomizer
//

// throw a dice and return the resulting face
// faces: the number of faces on the dice (ex: 6, or 100%)
// returns a number between 1 and faces
fn throw_dice(seed: felt252, salt: felt252, faces: u128) -> u128 {
    let hash: felt252 = pedersen(salt, seed);
    let double: u256 = hash.into();
    ((double.low % faces) + 1)
}

// throw a dice and return a positive result
// faces: the number of faces on the dice (ex: 6, or 100%)
// limit: how many faces gives a positive result?
// edge case: limit <= 1, always negative
// edge case: limit == faces, always positive
fn check_dice(seed: felt252, salt: felt252, faces: u128, limit: u128) -> bool {
    (throw_dice(seed, salt, faces) <= limit)
}




//------------------------
// read calls
//

fn call_simulate_honour_for_action(store: Store, mut score: Score, action: Action, table_type: TableType) -> (i8, u8) {
    let action_honour: i8 = action.honour();
    if (action_honour >= 0) {
        score.total_duels += 1;
        update_score_honour(ref score, MathU8::abs(action_honour), !table_type.maxxed_up_levels());
    }
    (action_honour, score.honour)
}

fn call_get_duelist_health(store: Store, duelist_id: u128, duel_id: u128, round_number: u8) -> u8 {
    if (round_number == 1) {
        (CONST::FULL_HEALTH)
    } else {
        let shot: Shot = call_get_duelist_round_shot(store, duelist_id, duel_id, round_number);
        (shot.health)
    }
}
fn call_get_duelist_round_shot(store: Store, duelist_id: u128, duel_id: u128, round_number: u8) -> Shot {
    let challenge: ChallengeEntity = store.get_challenge_entity(duel_id);
    let round: RoundEntity = store.get_round_entity(duel_id, round_number);
    if (challenge.duelist_id_a == duelist_id) {
        (round.shot_a)
    } else if (challenge.duelist_id_b == duelist_id) {
        (round.shot_b)
    } else {
        (init::Shot())
    }
}

fn call_get_snapshot_scores(store: Store, duelist_id: u128, duel_id: u128) -> (Score, Score) {
    let challenge: ChallengeEntity = store.get_challenge_entity(duel_id);
    let snapshot: SnapshotEntity = store.get_snapshot_entity(duel_id);
    if (challenge.duelist_id_a == duelist_id) {
        (snapshot.score_a, snapshot.score_b)
    } else if (challenge.duelist_id_b == duelist_id) {
        (snapshot.score_b, snapshot.score_a)
    } else {
        (init::Score(), init::Score())
    }
}

