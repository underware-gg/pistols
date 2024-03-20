use debug::PrintTrait;
use traits::{Into, TryInto};
use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::models::models::{init, Duelist, Challenge, Wager, Pact, Round, Shot};
use pistols::models::coins::{Coin, CoinManagerTrait, CoinTrait};
use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
use pistols::types::round::{RoundState, RoundStateTrait};
use pistols::types::action::{Action, ActionTrait, ACTION};
use pistols::types::constants::{constants, chances};
use pistols::utils::math::{MathU8, MathU16};
use pistols::interfaces::ierc20::{IERC20DispatcherTrait};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

#[inline(always)]
fn zero_address() -> ContractAddress {
    (starknet::contract_address_const::<0x0>())
}


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

// player need to allow contract to transfer funds first
// ierc20::approve(contract_address, max(wager.value, wager.fee));
fn deposit_wager_fees(world: IWorldDispatcher, from: ContractAddress, to: ContractAddress, duel_id: u128) {
    let wager: Wager = get!(world, (duel_id), Wager);
    let total: u256 = (wager.value + wager.fee);
    if (total > 0) {
        let coin : Coin = CoinManagerTrait::new(world).get(wager.coin);
        let balance: u256 = coin.ierc20().balance_of(from);
        let allowance: u256 = coin.ierc20().allowance(from, to);
        assert(balance >= total, 'Insufficient balance for Fees');
        assert(allowance >= total, 'Not allowed to transfer Fees');
        coin.ierc20().transfer_from(from, to, total);
    }
}
fn withdraw_wager_fees(world: IWorldDispatcher, to: ContractAddress, duel_id: u128) {
    let wager: Wager = get!(world, (duel_id), Wager);
    let total: u256 = (wager.value + wager.fee);
    if (total > 0) {
        let coin : Coin = CoinManagerTrait::new(world).get(wager.coin);
        let balance: u256 = coin.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, 'Withdraw not available'); // should never happen!
        coin.ierc20().transfer(to, total);
    }
}
fn split_wager_fees(world: IWorldDispatcher, share_1: ContractAddress, share_2: ContractAddress, duel_id: u128) {
    let wager: Wager = get!(world, (duel_id), Wager);
    let total: u256 = (wager.value + wager.fee) * 2;
    if (total > 0) {
        let coin : Coin = CoinManagerTrait::new(world).get(wager.coin);
        let balance: u256 = coin.ierc20().balance_of(starknet::get_contract_address());
        assert(balance >= total, 'Wager not available'); // should never happen!
        if (wager.value > 0) {
            if (share_1 == share_2) {
                // single winner
                coin.ierc20().transfer(share_1, wager.value * 2);
            } else {
                coin.ierc20().transfer(share_1, wager.value);
                coin.ierc20().transfer(share_2, wager.value);
            }
        }
        if (wager.fee > 0) {
            let manager = ConfigManagerTrait::new(world).get();
            if (manager.treasury_address != starknet::get_contract_address()) {
                coin.ierc20().transfer(manager.treasury_address, wager.fee * 2);
            }
        }
    }
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
    let runner_a: bool = action_a.is_runner();
    let runner_b: bool = action_b.is_runner();
    // Seppuku goes only against runners
    if (action_a == Action::Seppuku && !runner_b) {
        return (ACTION::SEPPUKU, ACTION::IDLE, 0, 0);
    } else if (action_b == Action::Seppuku && !runner_a) {
        return (ACTION::IDLE, ACTION::SEPPUKU, 0, 0);
    }
    // Flee/Steal triggers an opposing 10 paces shot
    if (runner_a && !runner_b) {
        return (slot1_a, ACTION::PACES_10, 0, 0);
    } else if (runner_b && !runner_a) {
        return (ACTION::PACES_10, slot1_b, 0, 0);
    }
    // Double Steal decides in a 1 pace face-off
    if (action_a == Action::Steal && action_b == Action::Steal) {
        return (slot1_a, slot1_b, ACTION::PACES_1, ACTION::PACES_1);
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
    let pact_duel_id: u128 = if (state.ongoing()) { challenge.duel_id } else  { 0 };
    set!(world, Pact {
        pair,
        duel_id: pact_duel_id,
    });

    // Start Round
    if (state.canceled()) {
        // transfer wager/fee back to challenger
        withdraw_wager_fees(world, challenge.duelist_a, challenge.duel_id);
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
    } else if (state.finished()) {
        // End Duel!
        let mut duelist_a: Duelist = get!(world, challenge.duelist_a, Duelist);
        let mut duelist_b: Duelist = get!(world, challenge.duelist_b, Duelist);
        
        // update totals, total_duels is updated in update_duelist_honour()
        if (state == ChallengeState::Draw) {
            duelist_a.total_draws += 1;
            duelist_b.total_draws += 1;
        } else if (challenge.winner == 1) {
            duelist_a.total_wins += 1;
            duelist_b.total_losses += 1;
        } else if (challenge.winner == 2) {
            duelist_a.total_losses += 1;
            duelist_b.total_wins += 1;
        } else {
            // should never get here!
        }

        // compute honour from final round
        let final_round: Round = get!(world, (challenge.duel_id, challenge.round_number), Round);
        update_duelist_honour(ref duelist_a, final_round.shot_a.honour);
        update_duelist_honour(ref duelist_b, final_round.shot_b.honour);

        // split wager/fee to winners and benefactors
        if (final_round.shot_a.wager > final_round.shot_b.wager) {
            split_wager_fees(world, challenge.duelist_a, challenge.duelist_a, challenge.duel_id);
        } else if (final_round.shot_a.wager < final_round.shot_b.wager) {
            split_wager_fees(world, challenge.duelist_b, challenge.duelist_b, challenge.duel_id);
        } else {
            split_wager_fees(world, challenge.duelist_a, challenge.duelist_b, challenge.duel_id);
        }
        
        // save Duelists
        set!(world, (duelist_a, duelist_b));
    }
}

// average honour has an extra decimal, eg: 100 = 10.0
fn update_duelist_honour(ref duelist: Duelist, duel_honour: u8) {
    duelist.total_duels += 1;
    duelist.total_honour += duel_honour.into();
    duelist.honour = ((duelist.total_honour * 10) / duelist.total_duels.into()).try_into().unwrap();
}


//------------------------
// Chances
//

fn calc_hit_chances(world: IWorldDispatcher, duelist_address: ContractAddress, action: Action, health: u8) -> u8 {
    let chances: u8 = action.hit_chance();
    let penalty: u8 = calc_hit_penalty(world, health);
    (apply_chance_bonus_penalty(chances, 0, penalty))
}
fn calc_crit_chances(world: IWorldDispatcher, duelist_address: ContractAddress, action: Action, health: u8) -> u8 {
    let chances: u8 = action.crit_chance();
    let bonus: u8 = calc_hit_bonus(world, duelist_address);
    (apply_chance_bonus_penalty(chances, bonus, 0))
}
fn calc_glance_chances(world: IWorldDispatcher, duelist_address: ContractAddress, action: Action, health: u8) -> u8 {
    let chances: u8 = action.glance_chance();
    (chances)
}
fn calc_honour_for_action(world: IWorldDispatcher, duelist_address: ContractAddress, action: Action) -> (u8, u8) {
    let mut duelist: Duelist = get!(world, duelist_address, Duelist);
    let duel_honour: u8 = action.honour();
    update_duelist_honour(ref duelist, duel_honour);
    (duel_honour, duelist.honour)
}

fn calc_hit_bonus(world: IWorldDispatcher, duelist_address: ContractAddress) -> u8 {
    let duelist: Duelist = get!(world, duelist_address, Duelist);
    let bonus: u8 = MathU8::sub(duelist.honour, 90);
    (MathU16::min(bonus.into(), duelist.total_duels).try_into().unwrap())
}
fn calc_hit_penalty(world: IWorldDispatcher, health: u8) -> u8 {
    ((constants::FULL_HEALTH - health) * constants::HIT_PENALTY_PER_DAMAGE)
}
fn apply_chance_bonus_penalty(chance: u8, bonus: u8, penalty: u8) -> u8 {
    let mut result: u8 = MathU8::sub(chance + bonus, penalty);
    (MathU8::clamp(result, chance / 2, 100))
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







//------------------------------------------------------
// Unit tests
//
#[cfg(test)]
mod tests {
    use core::traits::{Into, TryInto};
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use pistols::systems::{utils};
    use pistols::models::models::{init, Round, Shot};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::constants::{constants, chances};
    use pistols::types::action::{ACTION};
    use pistols::utils::math::{MathU8};

    #[test]
    #[available_gas(1_000_000)]
    fn test_pact_pair() {
        let a: ContractAddress = starknet::contract_address_const::<0x269c58e5fa1e7f6fe3756f1de88ecdfab7d03ba67e79ba0365b4ef1e81155be>();
        let b: ContractAddress = starknet::contract_address_const::<0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca>();
        let p_a = utils::make_pact_pair(a, b);
        let p_b = utils::make_pact_pair(b, a);
        assert(p_a == p_b, 'test_pact_pair');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_check_dice_average() {
        // lower limit
        let mut counter: u8 = 0;
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed_1' + n;
            if (utils::check_dice(seed, 'salt_1', 100, 25)) {
                counter += 1;
            }
            n += 1;
        };
        assert(counter > 10 && counter < 40, 'dices_25');
        // higher limit
        let mut counter: u8 = 0;
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed_2' + n;
            if (utils::check_dice(seed, 'salt_2', 100, 75)) {
                counter += 1;
            }
            n += 1;
        };
        assert(counter > 60 && counter < 90, 'dices_75');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_check_dice_edge() {
        let mut n: felt252 = 0;
        loop {
            if (n == 100) { break; }
            let seed: felt252 = 'seed' + n;
            let bottom: bool = utils::check_dice(seed, 'salt', 10, 0);
            assert(bottom == false, 'bottom');
            let upper: bool = utils::check_dice(seed, 'salt', 10, 10);
            assert(upper == true, 'bottom');
            n += 1;
        };
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_validate_packed_actions() {
        assert(utils::validate_packed_actions(1, ACTION::PACES_1.into()) == true, '1_Paces1');
        assert(utils::validate_packed_actions(1, ACTION::PACES_1.into()) == true, '1_Paces1');
        assert(utils::validate_packed_actions(2, ACTION::PACES_10.into()) == false, '2_Paces10');
        assert(utils::validate_packed_actions(2, ACTION::PACES_10.into()) == false, '2_Paces10');
        let action = utils::pack_action_slots(ACTION::FAST_BLADE, ACTION::FAST_BLADE);
        assert(utils::validate_packed_actions(1, action) == false, '1_bladess');
        assert(utils::validate_packed_actions(2, action) == true, '2_blades');
        let action = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::SLOW_BLADE);
        assert(utils::validate_packed_actions(1, action) == false, '1_invalid');
        assert(utils::validate_packed_actions(2, action) == false, '2_invalid');
        let action = utils::pack_action_slots(ACTION::PACES_1, ACTION::PACES_1);
        assert(utils::validate_packed_actions(1, action) == false, '1_dual_paces');
        assert(utils::validate_packed_actions(2, action) == false, '2_dual_paces');
        // inaction is valid on round 2
        assert(utils::validate_packed_actions(1, 0) == false, '1_zero');
        assert(utils::validate_packed_actions(2, 0) == true, '2_zero');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_slot_packing_actions() {
        let packed = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::FAST_BLADE);
        let (slot1, slot2) = utils::unpack_action_slots(packed);
        assert(slot1 == ACTION::SLOW_BLADE, 'slot1');
        assert(slot2 == ACTION::FAST_BLADE, 'slot2');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_slot_packing_round() {
        let mut round = Round {
            duel_id: 1,
            round_number: 1,
            state: 1,
            shot_a: init::Shot(),
            shot_b: init::Shot(),
        };
        // full
        round.shot_a.action = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::BLOCK);
        round.shot_b.action = utils::pack_action_slots(ACTION::FAST_BLADE, ACTION::PACES_1);
        let _packed = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::FAST_BLADE);
        let (slot1_a, slot1_b, slot2_a, slot2_b): (u8, u8, u8, u8) = utils::unpack_round_slots(round);
        assert(slot1_a == ACTION::SLOW_BLADE, 'slot1_a');
        assert(slot1_b == ACTION::FAST_BLADE, 'slot1_b');
        assert(slot2_a == ACTION::BLOCK, 'slot2_a');
        assert(slot2_b == ACTION::PACES_1, 'slot2_b');
        // slot 1 only
        round.shot_a.action = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::IDLE);
        round.shot_b.action = utils::pack_action_slots(ACTION::FAST_BLADE, ACTION::IDLE);
        let _packed = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::FAST_BLADE);
        let (slot1_a, slot1_b, slot2_a, slot2_b): (u8, u8, u8, u8) = utils::unpack_round_slots(round);
        assert(slot1_a == ACTION::SLOW_BLADE, 'slot1_a');
        assert(slot1_b == ACTION::FAST_BLADE, 'slot1_b');
        assert(slot2_a == ACTION::IDLE, 'slot2_a');
        assert(slot2_b == ACTION::IDLE, 'slot2_b');
        // slot 2 only
        round.shot_a.action = utils::pack_action_slots(ACTION::IDLE, ACTION::SLOW_BLADE);
        round.shot_b.action = utils::pack_action_slots(ACTION::IDLE, ACTION::FAST_BLADE);
        let _packed = utils::pack_action_slots(ACTION::SLOW_BLADE, ACTION::FAST_BLADE);
        let (slot1_a, slot1_b, slot2_a, slot2_b): (u8, u8, u8, u8) = utils::unpack_round_slots(round);
        assert(slot1_a == ACTION::SLOW_BLADE, 'slot1_a');
        assert(slot1_b == ACTION::FAST_BLADE, 'slot1_b');
        assert(slot2_a == ACTION::IDLE, 'slot2_a');
        assert(slot2_b == ACTION::IDLE, 'slot2_b');
    }

}
