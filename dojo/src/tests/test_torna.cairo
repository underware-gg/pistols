// #[cfg(test)]
// mod tests {
//     use core::traits::Into;
//     use array::ArrayTrait;
//     use debug::PrintTrait;
//     use starknet::{ContractAddress};

//     use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

//     use pistols::libs::utils;
//     use pistols::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
//     use pistols::models::challenge::{Challenge, ChallengeEntity, Round, RoundEntity, Snapshot};
//     use pistols::models::duelist::{Duelist, Score, ProfilePicType, Archetype};
//     use pistols::models::table::{TableConfig, TableType, TABLES};
//     use pistols::models::structs::{SimulateChances};
//     use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
//     use pistols::types::constants::{CONST, CHANCES, HONOUR};
//     use pistols::tests::tester::{tester, tester::{flags, ZERO, OWNER, OTHER, BUMMER, TREASURY}};
//     use pistols::utils::timestamp::{timestamp};
//     use pistols::tests::test_round1::tests::{_get_actions_round_1_dual_crit};


//     // const TABLE_ID: felt252 = tables::BRUSSELS;
//     const TABLE_ID: felt252 = 'IRL_TORNA';

//     const MESSAGE_1: felt252 = 'For honour!!!';

//     fn _start_new_challenge(world: IWorldDispatcher, actions: IActionsDispatcher, owner: ContractAddress, other: ContractAddress, table_id: felt252) -> (ChallengeEntity, u128) {
//         let duel_id: u128 = tester::execute_create_challenge(actions, OWNER(), OTHER(), MESSAGE_1, table_id, 0, 48);
//         tester::elapse_timestamp(timestamp::from_days(1));
//         tester::execute_reply_challenge(actions, OTHER(), duel_id, true);
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

//     #[test]
//     #[ignore]
//     fn test_mint_archetype_snapshot_Classic() {
//         let (world, actions, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::ADMIN | flags::MINTER);
//         let duelist1: Duelist = tester::execute_mint_duelist(actions, OWNER(), 'AAA', ProfilePicType::Duelist, '1', Archetype::Villainous);
//         let duelist2: Duelist = tester::execute_mint_duelist(actions, OTHER(), 'BBB', ProfilePicType::Duelist, '2', Archetype::Honourable);
//         assert(duelist1.score.level_villain == HONOUR::MAX, 'level_villain');
//         assert(duelist2.score.level_lord == HONOUR::MAX, 'level_lord');
//         let (challenge, duel_id) = _start_new_challenge(world, actions, OWNER(), OTHER(), TABLES::COMMONERS);
//         let snapshot = tester::get_Snapshot(world, duel_id);
//         assert(snapshot.score_a.level_villain == 0, 'snap.level_villain');
//         assert(snapshot.score_b.level_lord == 0, 'snap.level_lord');
//         // no bonus
//         let table_type: TableType = tester::get_Table(world, challenge.table_id).table_type;
//         let (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b) = _get_chances(snapshot, table_type);
//         assert(crit_bonus_a == 0, 'crit_bonus_a');
//         assert(crit_bonus_b == 0, 'crit_bonus_a');
//         assert(hit_bonus_a == 0, 'crit_bonus_a');
//         assert(hit_bonus_b == 0, 'crit_bonus_a');
//     }

//     #[test]
//     #[ignore]
//     fn test_mint_archetype_snapshot_IRL() {
//         let (world, actions, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::ADMIN | flags::MINTER);
//         let duelist1: Duelist = tester::execute_mint_duelist(actions, OWNER(), 'AAA', ProfilePicType::Duelist, '1', Archetype::Villainous);
//         let duelist2: Duelist = tester::execute_mint_duelist(actions, OTHER(), 'BBB', ProfilePicType::Duelist, '2', Archetype::Honourable);
//         assert(duelist1.score.level_villain == HONOUR::MAX, 'level_villain');
//         assert(duelist2.score.level_lord == HONOUR::MAX, 'level_lord');
//         let (challenge, duel_id) = _start_new_challenge(world, actions, OWNER(), OTHER(), TABLE_ID);
//         // check scoreboard
//         let snapshot = tester::get_Snapshot(world, duel_id);
//         assert(snapshot.score_a.level_villain == HONOUR::MAX, 'snap.level_villain');
//         assert(snapshot.score_b.level_lord == HONOUR::MAX, 'snap.level_lord');
//         let mut scoreboard_a = tester::get_Scoreboard(world, challenge.table_id, OWNER());
//         let mut scoreboard_b = tester::get_Scoreboard(world, challenge.table_id, OTHER());
//         assert(scoreboard_a.score.level_villain == HONOUR::MAX, 'scoreboard_a.level_villain');
//         assert(scoreboard_b.score.level_lord == HONOUR::MAX, 'scoreboard_b.level_lord');
//         // full bonus for both
//         let table_type: TableType = tester::get_Table(world, challenge.table_id).table_type;
//         let (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b) = _get_chances(snapshot, table_type);
//         assert(crit_bonus_a == 0, 'crit_bonus_a');
//         assert(crit_bonus_b == CHANCES::CRIT_BONUS_LORD, 'crit_bonus_a');
//         assert(hit_bonus_a == CHANCES::HIT_BONUS_VILLAIN, 'crit_bonus_a');
//         assert(hit_bonus_b == 0, 'crit_bonus_a');
//         //
//         // Simulate!
//         let chances_a: SimulateChances = actions.simulate_chances(duelist1.duelist_id, duel_id, challenge.round_number, 1);
//         let chances_b: SimulateChances = actions.simulate_chances(duelist2.duelist_id, duel_id, challenge.round_number, 10);
//         assert(crit_bonus_a == chances_a.crit_bonus, 'chances_a.crit_bonus');
//         assert(crit_bonus_b == chances_b.crit_bonus, 'chances_b.crit_bonus');
//         assert(hit_bonus_a == chances_a.hit_bonus, 'chances_a.hit_bonus');
//         assert(hit_bonus_b == chances_b.hit_bonus, 'chances_b.hit_bonus');
//     }

//     #[test]
//     #[ignore]
//     fn test_IRL_keep_archetypes() {
//         let (world, actions, _admin, _lords, _minter) = tester::setup_world(flags::ACTIONS | flags::ADMIN | flags::MINTER);
//         let duelist1: Duelist = tester::execute_mint_duelist(actions, OWNER(), 'AAA', ProfilePicType::Duelist, '1', Archetype::Villainous);
//         let duelist2: Duelist = tester::execute_mint_duelist(actions, OTHER(), 'BBB', ProfilePicType::Duelist, '2', Archetype::Honourable);
//         assert(duelist1.score.level_villain == HONOUR::MAX, 'duelist1.level_villain');
//         assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
//         assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
//         assert(duelist2.score.level_lord == HONOUR::MAX, 'duelist2.level_lord');
//         //
//         // duel to the death!
//         let (_challenge, duel_id) = _start_new_challenge(world, actions, OWNER(), OTHER(), TABLE_ID);
//         let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 1);
//         tester::execute_commit_action(actions, OWNER(), duel_id, 1, hash_a);
//         tester::execute_commit_action(actions, OTHER(), duel_id, 1, hash_b);
//         tester::execute_reveal_action(actions, OWNER(), duel_id, 1, salt_a, action_a, 0);
//         tester::execute_reveal_action(actions, OTHER(), duel_id, 1, salt_b, action_b, 0);
//         let (challenge, _round) = tester::get_Challenge_Round_Entity(world, duel_id);
//         assert(challenge.state != ChallengeState::InProgress, 'challenge.state');
//         //
//         // table scoreboard keeps archetype
//         let mut scoreboard_a = tester::get_Scoreboard(world, challenge.table_id, OWNER());
//         let mut scoreboard_b = tester::get_Scoreboard(world, challenge.table_id, OTHER());
//         assert(scoreboard_a.score.total_duels > 0, 'scoreboard_a.total_duels');
//         assert(scoreboard_b.score.total_duels > 0, 'scoreboard_b.total_duels');
//         assert(scoreboard_a.score.level_villain == HONOUR::MAX, 'scoreboard_a.level_villain');
//         assert(scoreboard_a.score.level_lord == 0, 'scoreboard_a.level_lord');
//         assert(scoreboard_b.score.level_villain == 0, 'scoreboard_b.level_villain');
//         assert(scoreboard_b.score.level_lord == HONOUR::MAX, 'scoreboard_b.level_lord');
//         // main score IS affected
//         let duelist1 = tester::get_DuelistEntity_id(world, duelist1.duelist_id);
//         let duelist2 = tester::get_DuelistEntity_id(world, duelist2.duelist_id);
//         assert(duelist1.score.level_villain == 0, 'duelist1.level_villain');
//         assert(duelist1.score.level_lord > 0, 'duelist1.level_lord');
//         assert(duelist2.score.level_villain > 0, 'duelist2.level_villain');
//         assert(duelist2.score.level_lord == 0, 'duelist2.level_lord');
//         // assert(duelist1.score.level_villain == HONOUR::MAX, 'duelist1.level_villain');
//         // assert(duelist2.score.level_villain == 0, 'duelist2.level_villain');
//         // assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
//         // assert(duelist2.score.level_lord == HONOUR::MAX, 'duelist2.level_lord');
//     }

// }
