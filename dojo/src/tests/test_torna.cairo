// #[cfg(test)]
// mod tests {
//     use core::traits::Into;
//     use array::ArrayTrait;
//     use debug::PrintTrait;
//     use starknet::{ContractAddress};

//     use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

//     use pistols::libs::utils;
//     use pistols::systems::game::{IGameDispatcher, IGameDispatcherTrait};
//     use pistols::models::challenge::{Challenge, ChallengeEntity, Round, RoundEntity, Snapshot};
//     use pistols::models::duelist::{Duelist, Score, ProfilePicType, Archetype};
//     use pistols::models::table::{TableConfig, TableType, TABLES};
//     use pistols::models::structs::{SimulateChances};
//     use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
//     use pistols::types::constants::{CONST, CHANCES, HONOUR};
//     use pistols::tests::tester::{tester, tester::{FLAGS, ZERO, OWNER, OTHER, BUMMER, TREASURY}};
//     use pistols::utils::timestamp::{timestamp};
//     use pistols::tests::test_round1::tests::{_get_game_round_1_dual_crit};


//     // const TABLE_ID: felt252 = tables::BRUSSELS;
//     const TABLE_ID: felt252 = 'IRL_TORNA';

//     const PREMISE_1: felt252 = 'For honour!!!';

//     fn _start_new_challenge(world: IWorldDispatcher, game: IGameDispatcher, owner: ContractAddress, other: ContractAddress, table_id: felt252) -> (ChallengeEntity, u128) {
//         let duel_id: u128 = tester::execute_create_challenge(game, OWNER(), OTHER(), PREMISE_1, table_id, 0, 48);
//         tester::elapse_timestamp(timestamp::from_days(1));
//         tester::execute_reply_challenge(game, OTHER(), duel_id, true);
//         let ch = tester::get_ChallengeEntity(world, duel_id);
//         assert(ch.state == ChallengeState::InProgress, 'challenge.state');
//         assert(ch.round_number == 1, 'challenge.number');
//         (ch, duel_id)
//     }

//     fn _get_chances(snapshot: Snapshot, table_type: TableType) -> (u8, u8, u8, u8) {
//         let crit_bonus_a = utils::calc_crit_bonus(snapshot.score_a, table_type);
//         let crit_bonus_b = utils::calc_crit_bonus(snapshot.score_b, table_type);
//         let hit_bonus_a = utils::calc_hit_bonus(snapshot.score_a, table_type);
//         let hit_bonus_b = utils::calc_hit_bonus(snapshot.score_b, table_type);
//         (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b)
//     }

// }
