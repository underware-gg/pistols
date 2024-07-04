use core::option::OptionTrait;
use debug::PrintTrait;
use traits::{Into, TryInto};
use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::systems::actions::actions::{Errors};
use pistols::models::challenge::{Challenge, Snapshot, Wager, Round, Shot};
use pistols::models::duelist::{Duelist, Pact, Scoreboard, Score, ScoreTrait};
use pistols::models::table::{TableConfig, TableTrait, TableManagerTrait};
use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
use pistols::models::init::{init};
use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
use pistols::types::round::{RoundState, RoundStateTrait};
use pistols::types::action::{Action, ActionTrait, ACTION};
use pistols::types::constants::{constants, honour, chances};
use pistols::utils::math::{MathU8, MathU16};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

#[inline(always)]
fn ZERO() -> ContractAddress {
    (starknet::contract_address_const::<0x0>())
}

#[inline(always)]
fn WORLD(_world: IWorldDispatcher) {}

#[inline(always)]
fn CONSUME_BYTE_ARRAY(_value: @ByteArray) {}


//------------------------
// Misc
//

#[inline(always)]
fn duelist_exist(world: IWorldDispatcher, address: ContractAddress) -> bool {
    let duelist: Duelist = get!(world, address, Duelist);
    (duelist.name != 0)
}

#[inline(always)]
fn make_action_hash(salt: u64, packed: u16) -> u64 {
    let hash: u256 = pedersen(salt.into(), packed.into()).into() & constants::HASH_SALT_MASK;
    (hash.try_into().unwrap())
}

#[inline(always)]
fn make_round_salt(round: Round) -> u64 {
    (round.shot_a.salt ^ round.shot_b.salt)
}

#[inline(always)]
fn scramble_salt(salt: u64) -> u64 {
    let hash: u256 = pedersen(salt.into(), (~salt).into()).into() & constants::HASH_SALT_MASK;
    (hash.try_into().unwrap())
}

fn make_pact_pair(duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128 {
    let a: felt252 = duelist_a.into();
    let b: felt252 = duelist_b.into();
    let aa: u256 = a.into();
    let bb: u256 = b.into();
    (aa.low ^ bb.low)
}

fn get_duelist_round_shot(world: IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8) -> Shot {
    let challenge: Challenge = get!(world, (duel_id), Challenge);
    let round: Round = get!(world, (duel_id, round_number), Round);
    if (challenge.duelist_a == duelist_address) {
        (round.shot_a)
    } else if (challenge.duelist_b == duelist_address) {
        (round.shot_b)
    } else {
        (init::Shot())
    }
}
fn get_duelist_health(world: IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8) -> u8 {
    if (round_number == 1) {
        (constants::FULL_HEALTH)
    } else {
        let shot: Shot = get_duelist_round_shot(world, duelist_address, duel_id, round_number);
        (shot.health)
    }
}

fn create_challenge_snapshot(world: IWorldDispatcher, challenge: Challenge) {
    let scoreboard_a: Scoreboard = get!(world, (challenge.duelist_a, challenge.table_id), Scoreboard);
    let scoreboard_b: Scoreboard = get!(world, (challenge.duelist_b, challenge.table_id), Scoreboard);
    let snapshot = Snapshot {
        duel_id: challenge.duel_id,
        score_a: scoreboard_a.score,
        score_b: scoreboard_b.score,
    };
    set!(world, (snapshot));
}

fn get_snapshot_scores(world: IWorldDispatcher, address: ContractAddress, duel_id: u128) -> (Score, Score) {
    let challenge: Challenge = get!(world, duel_id, Challenge);
    let snapshot: Snapshot = get!(world, duel_id, Snapshot);
    if (address == challenge.duelist_a) {
        (snapshot.score_a, snapshot.score_b)
    } else if (address == challenge.duelist_b) {
        (snapshot.score_b, snapshot.score_a)
    } else {
        (init::Score(), init::Score())
    }
}

// player need to allow contract to transfer funds first
// ierc20::approve(contract_address, max(wager.value, wager.fee));
fn deposit_wager_fees(world: IWorldDispatcher, challenge: Challenge, from: ContractAddress, to: ContractAddress) {
    let wager: Wager = get!(world, (challenge.duel_id), Wager);
    let total: u256 = (wager.value + wager.fee);
    if (total > 0) {
        let table : TableConfig = TableManagerTrait::new(world).get(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(from);
        let allowance: u256 = table.ierc20().allowance(from, to);
        assert(balance >= total, Errors::INSUFFICIENT_BALANCE);
        assert(allowance >= total, Errors::NO_ALLOWANCE);
        table.ierc20().transfer_from(from, to, total);
    }
}
fn withdraw_wager_fees(world: IWorldDispatcher, challenge: Challenge, to: ContractAddress) {
    let wager: Wager = get!(world, (challenge.duel_id), Wager);
    let total: u256 = (wager.value + wager.fee);
    if (total > 0) {
        let table : TableConfig = TableManagerTrait::new(world).get(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, Errors::WITHDRAW_NOT_AVAILABLE); // should never happen!
        table.ierc20().transfer(to, total);
    }
}
// spllit wager beteen duelist_a and duelist_b
fn split_wager_fees(world: IWorldDispatcher, challenge: Challenge, duelist_a: ContractAddress, duelist_b: ContractAddress) -> u256 {
    let wager: Wager = get!(world, (challenge.duel_id), Wager);
    let total: u256 = (wager.value + wager.fee) * 2;
    if (total > 0) {
        let table : TableConfig = TableManagerTrait::new(world).get(challenge.table_id);
        let balance: u256 = table.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, Errors::WAGER_NOT_AVAILABLE); // should never happen!
        if (wager.value > 0) {
            if (duelist_a == duelist_b) {
                // single winner
                table.ierc20().transfer(duelist_a, wager.value * 2);
            } else {
                // split wager back to duelists
                table.ierc20().transfer(duelist_a, wager.value);
                table.ierc20().transfer(duelist_b, wager.value);
            }
        }
        if (wager.fee > 0) {
            let manager = ConfigManagerTrait::new(world).get();
            if (manager.treasury_address != starknet::get_contract_address()) {
                table.ierc20().transfer(manager.treasury_address, wager.fee * 2);
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

fn set_challenge(world: IWorldDispatcher, challenge: Challenge) {
    set!(world, (challenge));

    let state: ChallengeState = challenge.state.try_into().unwrap();

    // Set pact between Duelists to avoid duplicated challenges
    let pair: u128 = make_pact_pair(challenge.duelist_a, challenge.duelist_b);
    let pact_duel_id: u128 = if (state.is_ongoing()) { challenge.duel_id } else  { 0 };
    set!(world, Pact {
        pair,
        duel_id: pact_duel_id,
    });

    // Start Round
    if (state.is_canceled()) {
        // transfer wager/fee back to challenger
        withdraw_wager_fees(world, challenge, challenge.duelist_a);
    } else if (state == ChallengeState::InProgress) {
        let mut shot_a = init::Shot();
        let mut shot_b = init::Shot();

        if (challenge.round_number == 1) {
            // Round 1 starts with full health
            shot_a.health = constants::FULL_HEALTH;
            shot_b.health = constants::FULL_HEALTH;
        } else {
            // Round 2+ need to copy previous Round's state
            let prev_round: Round = get!(world, (challenge.duel_id, challenge.round_number - 1), Round);
            shot_a.health = prev_round.shot_a.health;
            shot_b.health = prev_round.shot_b.health;
            shot_a.honour = prev_round.shot_a.honour;
            shot_b.honour = prev_round.shot_b.honour;
        }

        set!(world, (
            Round {
                duel_id: challenge.duel_id,
                round_number: challenge.round_number,
                state: RoundState::Commit.into(),
                shot_a,
                shot_b,
            }
        ));
    } else if (state.is_finished()) {
        // End Duel!
        let mut duelist_a: Duelist = get!(world, challenge.duelist_a, Duelist);
        let mut duelist_b: Duelist = get!(world, challenge.duelist_b, Duelist);
        let mut scoreboard_a: Scoreboard = get!(world, (challenge.duelist_a, challenge.table_id), Scoreboard);
        let mut scoreboard_b: Scoreboard = get!(world, (challenge.duelist_b, challenge.table_id), Scoreboard);
        
        // update totals
        update_score_totals(ref duelist_a.score, ref duelist_b.score, state, challenge.winner);
        update_score_totals(ref scoreboard_a.score, ref scoreboard_b.score, state, challenge.winner);

        // compute honour from final round
        let final_round: Round = get!(world, (challenge.duel_id, challenge.round_number), Round);
        update_score_honour(ref duelist_a.score, final_round.shot_a.honour);
        update_score_honour(ref duelist_b.score, final_round.shot_b.honour);
        update_score_honour(ref scoreboard_a.score, final_round.shot_a.honour);
        update_score_honour(ref scoreboard_b.score, final_round.shot_b.honour);

        // split wager/fee to winners and benefactors
        if (final_round.shot_a.wager > final_round.shot_b.wager) {
            // duelist_a won the Wager
            let wager_value: u256 = split_wager_fees(world, challenge, challenge.duelist_a, challenge.duelist_a);
            scoreboard_a.wager_won += wager_value;
            scoreboard_b.wager_lost += wager_value;
        } else if (final_round.shot_a.wager < final_round.shot_b.wager) {
            // duelist_b won the Wager
            let wager_value: u256 = split_wager_fees(world, challenge, challenge.duelist_b, challenge.duelist_b);
            scoreboard_a.wager_lost += wager_value;
            scoreboard_b.wager_won += wager_value;
        } else {
            // no-one gets the Wager
            split_wager_fees(world, challenge, challenge.duelist_a, challenge.duelist_b);
        }
        
        // save
        set!(world, (duelist_a, duelist_b, scoreboard_a, scoreboard_b));
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
    score.total_honour += duel_honour.into();
    score.honour = ((score.total_honour * 10) / score.total_duels.into()).try_into().unwrap();
    score.level_villain = calc_level_villain(score.honour);
    score.level_lord = calc_level_lord(score.honour);
    score.level_trickster = _average_trickster(calc_level_trickster(score.honour, duel_honour), score.level_trickster);
}

// Villain bonus: the less honour, more bonus
#[inline(always)]
fn calc_level_villain(honour: u8) -> u8 {
    if (honour < honour::TRICKSTER_START) {
        (MathU8::map(honour, honour::VILLAIN_START, honour::TRICKSTER_START-1, honour::LEVEL_MAX, honour::LEVEL_MIN))
    } else { (0) }
}
// Lord bonus: the more honour, more bonus
#[inline(always)]
fn calc_level_lord(honour: u8) -> u8 {
    if (honour >= honour::LORD_START) {
        (MathU8::map(honour, honour::LORD_START, honour::MAX, honour::LEVEL_MIN, honour::LEVEL_MAX))
    } else { (0) }
}
// Trickster bonus: the max of...
// high on opposites, less in the middle (shaped as a \/)
// cap halfway without going to zero (shaped as a /\)
#[inline(always)]
fn calc_level_trickster(honour: u8, duel_honour: u8) -> u8 {
    if (honour >= honour::TRICKSTER_START && honour < honour::LORD_START) {
        // simple \/ shape of LEVEL_MAX/2 at middle range to LEVEL_MAX at extremities
        let level_i: i16 = MathU8::map(duel_honour, honour::VILLAIN_START, honour::MAX, 0, honour::LEVEL_MAX).try_into().unwrap() - (honour::LEVEL_MAX / 2).into();
        let level: u8 = MathU16::abs(level_i).try_into().unwrap() + (honour::LEVEL_MAX / 2);
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
fn calc_crit_chances(attacker: Score, defender: Score, attack: Action, defense: Action, health: u8) -> u8 {
    let crit_chance: u8 = attack.crit_chance();
    if (crit_chance == 0) { (0) }
    else {
        (_apply_chance_bonus_penalty(
            crit_chance,
            calc_crit_bonus(attacker) + calc_crit_match_bonus(attacker, attack, defense),
            0 + calc_crit_trickster_penalty(attacker, defender),
        ))
    }
}
// Hit chances will be applied to Villains only
// Both Hit and Lethal go up/down with same bonus/penalty
fn calc_hit_chances(attacker: Score, defender: Score, attack: Action, defense: Action, health: u8) -> u8 {
    let hit_chance: u8 = attack.hit_chance();
    if (hit_chance == 0) { (0) }
    else {
        (_apply_chance_bonus_penalty(
            hit_chance,
            calc_hit_bonus(attacker),
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
        chances::ALWAYS,    // never go above 100
    ))
}

//
// bonuses
//

fn calc_crit_bonus(attacker: Score) -> u8 {
    if (attacker.is_lord()) {
        (_calc_bonus(chances::CRIT_BONUS_LORD, attacker.level_lord, attacker.total_duels))
    } else if (attacker.is_trickster()) {
        (_calc_bonus(chances::CRIT_BONUS_TRICKSTER, attacker.level_trickster, attacker.total_duels))
    } else {
        (0)
    }
}
fn calc_hit_bonus(attacker: Score) -> u8 {
    if (attacker.is_villain()) {
        (_calc_bonus(chances::HIT_BONUS_VILLAIN, attacker.level_villain, attacker.total_duels))
    } else if (attacker.is_trickster()) {
        (_calc_bonus(chances::HIT_BONUS_TRICKSTER, attacker.level_trickster, attacker.total_duels))
    } else {
        (0)
    }
}
fn _calc_bonus(bonus_max: u8, level: u8, total_duels: u16) -> u8 {
    if (level > 0 && total_duels > 0) {
        (MathU8::max(1, MathU8::map(
            MathU16::min(level.into(), total_duels * 10).try_into().unwrap(),
            0, honour::LEVEL_MAX,
            0, bonus_max)
        ))
    } else {
        (0)
    }
}

fn calc_crit_match_bonus(attacker: Score, attack: Action, defense: Action) -> u8 {
    if (attacker.is_lord()) {
        if (attack.paces_priority(defense) < 0) { (chances::EARLY_LORD_CRIT_BONUS) } else { (0) }
    } else if (attacker.is_villain()) {
        if (attack.paces_priority(defense) > 0) { (chances::LATE_VILLAIN_CRIT_BONUS) } else { (0) }
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
    ((constants::FULL_HEALTH - health) * penalty_per_damage)
}


fn calc_crit_trickster_penalty(attacker: Score, defender: Score) -> u8 {
    (_calc_trickster_penalty(attacker, defender, chances::TRICKSTER_CRIT_PENALTY))
}
fn calc_hit_trickster_penalty(attacker: Score, defender: Score) -> u8 {
    (_calc_trickster_penalty(attacker, defender, chances::TRICKSTER_HIT_PENALTY))
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
        (chances::LORD_LETHAL_PENALTY)
    } else {
        (0)
    }
}


//------------------------
// read calls
//

fn simulate_honour_for_action(world: IWorldDispatcher, duelist_address: ContractAddress, action: Action) -> (i8, u8) {
    let mut duelist: Duelist = get!(world, duelist_address, Duelist);
    let action_honour: i8 = action.honour();
    if (action_honour >= 0) {
        duelist.score.total_duels += 1;
        update_score_honour(ref duelist.score, MathU8::abs(action_honour));
    }
    (action_honour, duelist.score.honour)
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

