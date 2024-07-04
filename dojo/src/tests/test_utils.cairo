
//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::libs::utils;
    use pistols::models::challenge::{Round, Shot};
    use pistols::models::duelist::{Duelist, Score, ScoreTrait};
    use pistols::models::init::{init};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::action::{ACTION};

    #[test]
    #[available_gas(1_000_000)]
    fn test_pact_pair() {
        let a: ContractAddress = starknet::contract_address_const::<0x56c155b624fdf6bfc94f7b37cf1dbebb5e186ef2e4ab2762367cd07c8f892a1>();
        let b: ContractAddress = starknet::contract_address_const::<0x6b86e40118f29ebe393a75469b4d926c7a44c2e2681b6d319520b7c1156d114>();
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

    #[test]
    #[available_gas(100_000_000)]
    fn test_update_score_honour() {
        let mut duelist = init::Duelist();
        duelist.address = starknet::contract_address_const::<0x111>();
        duelist.name = 'duelist';
        duelist.score.total_duels = 1;
        utils::update_score_honour(ref duelist.score, 10);
        assert(duelist.score.level_lord == 100, 'honour_100');
        assert(duelist.score.level_villain == 0, 'honour_100_vill');
        assert(duelist.score.level_trickster == 0, 'honour_100_trick');
        assert(duelist.score.is_lord(), 'is_lord()');
        // just checks sync with calc_level_lord
        let value: u8 = utils::calc_level_lord(100);
       assert(duelist.score.level_lord == value, '!= calc');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_average_trickster() {
        assert(utils::_average_trickster(100, 0) == 50, '100, 0');
        assert(utils::_average_trickster(100, 50) == 75, '100, 50');
        assert(utils::_average_trickster(0, 50) == 0, '0, 50');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_apply_chance_bonus_penalty_average_trickster() {
        // fn _apply_chance_bonus_penalty(chance: u8, bonus: u8, penalty: u8) -> u8;
        assert(utils::_apply_chance_bonus_penalty(50, 10, 0) == 60, 'bonus');
        assert(utils::_apply_chance_bonus_penalty(50, 0, 10) == 40, 'penalty');
        assert(utils::_apply_chance_bonus_penalty(50, 20, 10) == 60, '+bonus-penalty');
        assert(utils::_apply_chance_bonus_penalty(50, 10, 20) == 40, '-bonus+penalty');
        // no change
        assert(utils::_apply_chance_bonus_penalty(100, 10, 10) == 100, 'no_change_100');
        assert(utils::_apply_chance_bonus_penalty(50, 10, 10) == 50, 'no_change_50');
        assert(utils::_apply_chance_bonus_penalty(0, 10, 10) == 0, 'no_change_0');
        // clamp up
        assert(utils::_apply_chance_bonus_penalty(90, 20, 0) == 100, 'clamp_up_0');
        assert(utils::_apply_chance_bonus_penalty(100, 10, 0) == 100, 'clamp_up_1');
        assert(utils::_apply_chance_bonus_penalty(100, 20, 10) == 100, 'clamp_up_2');
        assert(utils::_apply_chance_bonus_penalty(50, 100, 0) == 100, 'clamp_up_3');
        assert(utils::_apply_chance_bonus_penalty(50, 100, 10) == 100, 'clamp_up_4');
        // clamp down
        assert(utils::_apply_chance_bonus_penalty(50, 0, 30) == 25, 'clamp_down_1');
        assert(utils::_apply_chance_bonus_penalty(50, 0, 100) == 25, 'clamp_down_2');
        assert(utils::_apply_chance_bonus_penalty(50, 50, 100) == 25, 'clamp_down_3');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_calc_penalty() {
        // fn _calc_penalty(health: u8, penalty_per_damage: u8) -> u8;
        assert(utils::_calc_penalty(3, 10) == 0, 'h_3');
        assert(utils::_calc_penalty(2, 10) == 10, 'h_2');
        assert(utils::_calc_penalty(1, 10) == 20, 'h_3');
        assert(utils::_calc_penalty(0, 10) == 30, 'h_1');
    }

    #[test]
    #[available_gas(100_000_000)]
    fn test_dice_round3() {
        let seed: felt252 = 'shoot_a';
        let salt_a: u64 = 0x136f23ce20ac7ee1;
        let salt_b: u64 = 0xb6800612482e938f;
        let salter = (salt_a ^ salt_b);
        let salter_i = (utils::scramble_salt(salt_a) ^ utils::scramble_salt(salt_b));
        let dice_1 = utils::throw_dice(seed, salter.into(), 100);
        let dice_2 = utils::throw_dice(seed, (salter_i).into(), 100);
        assert(dice_1 != dice_2, 'inverted salt');
    }
}
