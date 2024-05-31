#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::models::{Duelist, Challenge, Wager, Round, Chances};
    use pistols::models::table::{TTable, TableTrait, TableManagerTrait, tables};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::constants::{constants};
    use pistols::systems::{utils};
    use pistols::systems::shooter::{shooter};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU16};
    use pistols::tests::tester::{tester};

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = tables::LORDS;
    const WAGER_VALUE: u256 = 100_000_000_000_000_000_000;

    const SEED_A: felt252 = 'shoot_a';
    const SEED_B: felt252 = 'shoot_b';

    const SALT_1_a: u64 = 0xa6f099b756a87e62;
    const SALT_1_b: u64 = 0xf9a978e92309da78;
    
    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress, wager_value: u256) -> (Challenge, Round, u128) {
        tester::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        tester::execute_register_duelist(system, other, OTHER_NAME, 2);
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, owner, other, MESSAGE_1, TABLE_ID, wager_value, expire_seconds);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, other, duel_id, true);
        let ch = tester::get_Challenge(world, duel_id);
        let round: Round = tester::get_Round(world, duel_id, 1);
        assert(ch.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit.into(), 'round.state');
        (ch, round, duel_id)
    }

    fn _get_actions_round_1_resolved() -> (u64, u64, u8, u8, u64, u64) {
        let salt_a: u64 = SALT_1_a + 2;
        let salt_b: u64 = SALT_1_b;
        let action_a: u8 = 10;
        let action_b: u8 = 6;
        (salt_a, salt_b, action_a, action_b, utils::make_action_hash(salt_a, action_a.into()), utils::make_action_hash(salt_b, action_b.into()))
    }

    fn _get_actions_round_1_draw() -> (u64, u64, u8, u8, u64, u64) {
        // let salt_a: u64 = SALT_1_a + 52;
        // let salt_b: u64 = SALT_1_b + 52;
        let salt_a: u64 = 0xf1b59e00;
        let salt_b: u64 = 0xb4fa41cd;
        let action_a: u8 = 10;
        let action_b: u8 = 10;
        (salt_a, salt_b, action_a, action_b, utils::make_action_hash(salt_a, action_a.into()), utils::make_action_hash(salt_b, action_b.into()))
    }


    fn _throw_dice(seed: felt252, salt_a: u64, salt_b: u64, faces: u128) -> u8 {
        let salt: u64 = (salt_a ^ salt_b);
        (utils::throw_dice(seed, salt.into(), faces).try_into().unwrap())
    }

    //-----------------------------------------
    //

//     #[test]
//     #[available_gas(10_000_000_000)]
//     fn match_salt_to_challenge() {
//         let (world, system, _admin, _lords, _ierc20, owner, other, _bummer, _treasury) = tester::setup_world(true, true);
//         let (_challenge, _round, duel_id) = _start_new_challenge(world, system, owner, other, WAGER_VALUE);
//         // let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_resolved();
//         let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_draw();
//         tester::execute_commit_action(system, owner, duel_id, 1, hash_a);
//         tester::execute_commit_action(system, other, duel_id, 1, hash_b);
//         tester::execute_reveal_action(system, owner, duel_id, 1, salt_a, action_a, 0);
//         tester::execute_reveal_action(system, other, duel_id, 1, salt_b, action_b, 0);
//         let (_challenge, round) = tester::get_Challenge_Round(world, duel_id);
// // round.shot_a.health.print();
// // round.shot_b.health.print();
// // challenge.state.print();
// round.shot_a.salt.print();
// round.shot_b.salt.print();
// '---- dices A'.print();
// round.shot_a.dice_crit.print();
// // round.shot_a.dice_hit.print();
// '---- dices B'.print();
// round.shot_b.dice_crit.print();
// // round.shot_b.dice_hit.print();
//         // generate and compare
//         let gen_dice_a: u8 = _throw_dice(SEED_A, salt_a, salt_b, 100);
//         let gen_dice_b: u8 = _throw_dice(SEED_B, salt_a, salt_b, 100);
// '---- generated'.print();
// // round_salt.print();
// gen_dice_a.print();
// gen_dice_b.print();
//         assert(round.shot_a.dice_crit == gen_dice_a, 'gen_dice_a');
//         assert(round.shot_b.dice_crit == gen_dice_b, 'gen_dice_b');
//     }


    const FLAG_DUAL_MISS: u16       = 0b0000000000001;
    const FLAG_DUAL_CRIT: u16       = 0b0000000000100;
    const FLAG_DUAL_HIT: u16        = 0b0000000000010;
    const FLAG_HIT_MISS: u16        = 0b0000000001000;
    const FLAG_MISS_HIT: u16        = 0b0000000010000;
    const FLAG_CRIT_MISS: u16       = 0b0000000100000;
    const FLAG_MISS_CRIT: u16       = 0b0000001000000;
    const FLAG_CRIT_HIT: u16        = 0b0000010000000;
    const FLAG_HIT_CRIT: u16        = 0b0000100000000;
    const FLAG_DUAL_CRIT_R3: u16    = 0b0001000000000;
    const FLAG_ALL: u16             = 0b0001001100111;

    const CRIT_LOW: u8 = 15;
    const CRIT_HIGH: u8 = 30;
    const HIT_LOW: u8 = 60;
    const HIT_HIGH: u8 = 80;
    // const MISS_VALUE: u8 = 100;

    #[derive(Copy, Drop)]
    struct Dices {
        crit: u8,
        hit: u8
    }
    #[derive(Copy, Drop)]
    struct Generated {
        salt_a: u64,
        salt_b: u64,
        r2_a: Dices,
        r2_b: Dices,
        r3_a: Dices,
        r3_b: Dices,
    }

    fn _is_crit(dices: Dices) -> bool {
        (dices.crit < CRIT_LOW)
    }
    fn _is_hit(dices: Dices) -> bool {
        (dices.crit > CRIT_HIGH && dices.hit < HIT_LOW)
    }
    fn _is_miss(dices: Dices) -> bool {
        (dices.crit > CRIT_HIGH && dices.hit > HIT_HIGH)
    }

    fn _gen_dices(seed: felt252, salt_a: u64, salt_b: u64) -> Dices {
        let crit: u8 = _throw_dice(seed, salt_a, salt_b, 100);
        let hit: u8 = _throw_dice(seed * 2, salt_a, salt_b, 100);
        (Dices{ crit, hit })
    }
    fn _generate(salt_seed_a: felt252, salt_seed_b: felt252) -> Generated {
        let hash: u256 = pedersen(salt_seed_a, salt_seed_b).into();
        let salt_a: u64 = (hash.low & 0xffffffffffffffff).try_into().unwrap();
        // let mut salt_b: u64 = (hash.high & 0xffffffffffffffff).try_into().unwrap();
        let salt_b: u64 = SALT_1_b;
        let salt_a_i: u64 = utils::scramble_salt(salt_a);
        let salt_b_i: u64 = utils::scramble_salt(salt_b);
        let r2_a = _gen_dices(SEED_A, salt_a, salt_b);
        let r2_b = _gen_dices(SEED_B, salt_a, salt_b);
        let r3_a = _gen_dices(SEED_A, salt_a_i, salt_b_i);
        let r3_b = _gen_dices(SEED_B, salt_a_i, salt_b_i);
        // round 3
        (Generated{ salt_a, salt_b, r2_a, r2_b, r3_a, r3_b })
    }

    #[cfg(skip)]
    #[test]
    #[available_gas(10_000_000_000)]
    fn generate_salts() {
        let mut salt_seed_a: felt252 = 0x10000001;
        let mut salt_seed_b: felt252 = 0x20000002;
        let mut flags: u16 = FLAG_ALL;
        let mut n: felt252 = 0;
        loop {
            if (flags == 0) {
                '>>> COMPLETE!'.print();
                n.print();
                break;
            }
            if (n == 1000) {
                '!!! NOT COMPLETE!'.print();
                break;
            }
            let gen = _generate(salt_seed_a + n, salt_seed_b + n);
            let mut found: bool = false;
            if ((flags & FLAG_DUAL_MISS) > 0 && _is_miss(gen.r2_a) && _is_miss(gen.r2_b)) {
                flags = flags & ~FLAG_DUAL_MISS;
                found = true;
                '---- DUAL_MISS'.print();
            }
            if ((flags & FLAG_DUAL_HIT) > 0 && _is_hit(gen.r2_a) && _is_hit(gen.r2_b)) {
                flags = flags & ~FLAG_DUAL_HIT;
                found = true;
                '---- DUAL_HIT'.print();
            }
            if ((flags & FLAG_DUAL_CRIT) > 0 && _is_crit(gen.r2_a) && _is_crit(gen.r2_b)) {
                flags = flags & ~FLAG_DUAL_CRIT;
                found = true;
                '---- DUAL_CRIT'.print();
            }
            if ((flags & FLAG_MISS_CRIT) > 0 && _is_miss(gen.r2_a) && _is_crit(gen.r2_b)) {
                flags = flags & ~FLAG_MISS_CRIT;
                found = true;
                '---- MISS_CRIT'.print();
            }
            if ((flags & FLAG_CRIT_MISS) > 0 && _is_crit(gen.r2_a) && _is_miss(gen.r2_b)) {
                flags = flags & ~FLAG_CRIT_MISS;
                found = true;
                '---- CRIT_MISS'.print();
            }
            if ((flags & FLAG_DUAL_CRIT_R3) > 0 && _is_crit(gen.r3_a) && _is_crit(gen.r3_b)) {
                flags = flags & ~FLAG_DUAL_CRIT_R3;
                found = true;
                '---- DUAL_CRIT_R3'.print();
            }
            // if (_is_miss(gen_dice_a) && _is_hit(gen_dice_b)) {
            //     '---- MISS_HIT'.print();
            // }
            // if (_is_hit(gen_dice_a) && _is_miss(gen_dice_b)) {
            //     '---- HIT_MISS'.print();
            // }
            if (found) {
                gen.salt_a.print();
                gen.salt_b.print();
                gen.r2_a.crit.print();
                gen.r2_b.crit.print();
                gen.r2_a.hit.print();
                gen.r2_b.hit.print();
            }
            n += 1;
        }
    }
}
