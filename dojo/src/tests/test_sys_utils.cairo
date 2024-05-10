
//------------------------------------------------------
// systems::utils tests
//
#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{Into, TryInto};
    use starknet::{ContractAddress};

    use pistols::systems::{utils};
    use pistols::models::models::{init, Round, Shot, Duelist};
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
    fn test_update_duelist_honour() {
        let mut duelist = Duelist {
            address: starknet::contract_address_const::<0x111>(),
            name: 'duelist',
            profile_pic: 0,
            total_duels: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            total_honour: 0,
            honour: 0,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 0,
            timestamp: 0,
        };
        utils::update_duelist_honour(ref duelist, 10);
        assert(duelist.level_lord == 100, 'honour_100');
        assert(duelist.level_villain == 0, 'honour_100_vill');
        assert(duelist.level_trickster == 0, 'honour_100_trick');
        // just checks sync with calc_level_lord
        let value: u8 = utils::calc_level_lord(100);
       assert(duelist.level_lord == value, '!= calc');
    }

}
