#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::libs::utils;
    use pistols::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::challenge::{Challenge, Round, Snapshot};
    use pistols::models::duelist::{Duelist, Score, Archetype};
    use pistols::models::table::{TableConfig, TableType, tables};
    use pistols::models::structs::{SimulateChances};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::constants::{constants, chances, honour};
    use pistols::tests::tester::{tester, tester::{flags, ZERO, OWNER, OTHER, BUMMER, TREASURY}};
    use pistols::utils::timestamp::{timestamp};
    use pistols::tests::test_round1::tests::{_get_actions_round_1_dual_crit};

    

    const MESSAGE_1: felt252 = 'For honour!!!';

    fn _start_new_challenge(world: IWorldDispatcher, system: IActionsDispatcher, owner: ContractAddress, other: ContractAddress, table_id: felt252) -> (Challenge, u128) {
        let expire_seconds: u64 = timestamp::from_days(2);
        let duel_id: u128 = tester::execute_create_challenge(system, OWNER(), OTHER(), MESSAGE_1, table_id, 0, expire_seconds);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(system, OTHER(), duel_id, true);
        let ch = tester::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::InProgress.into(), 'challenge.state');
        assert(ch.round_number == 1, 'challenge.number');
        (ch, duel_id)
    }

    fn _get_chances(snapshot: Snapshot, table_type: TableType) -> (u8, u8, u8, u8) {
        let crit_bonus_a = utils::calc_crit_bonus(snapshot.score_a, table_type);
        let crit_bonus_b = utils::calc_crit_bonus(snapshot.score_b, table_type);
        let hit_bonus_a = utils::calc_hit_bonus(snapshot.score_a, table_type);
        let hit_bonus_b = utils::calc_hit_bonus(snapshot.score_b, table_type);
        (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b)
    }

    #[test]
    fn test_mint_archetype_snapshot_Classic() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::SYSTEM | flags::ADMIN | flags::MINTER | flags::INITIALIZE | 0);
        let duelist1: Duelist = tester::execute_mint_duelist(system, OWNER(), 'AAA', 1, '1', Archetype::Villainous);
        let duelist2: Duelist = tester::execute_mint_duelist(system, OTHER(), 'BBB', 1, '2', Archetype::Honourable);
        assert(duelist1.score.level_villain == honour::MAX, 'level_villain');
        assert(duelist2.score.level_lord == honour::MAX, 'level_lord');
        let (challenge, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), tables::COMMONERS);
        let snapshot = tester::get_Snapshot(world, duel_id);
        assert(snapshot.score_a.level_villain == 0, 'snap.level_villain');
        assert(snapshot.score_b.level_lord == 0, 'snap.level_lord');
        // no bonus
        let table_type: TableType = get!(world, challenge.table_id, TableConfig).table_type;
        let (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b) = _get_chances(snapshot, table_type);
        assert(crit_bonus_a == 0, 'crit_bonus_a');
        assert(crit_bonus_b == 0, 'crit_bonus_a');
        assert(hit_bonus_a == 0, 'crit_bonus_a');
        assert(hit_bonus_b == 0, 'crit_bonus_a');
    }

    #[test]
    fn test_mint_archetype_snapshot_IRL() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::SYSTEM | flags::ADMIN | flags::MINTER | flags::INITIALIZE | 0);
        let duelist1: Duelist = tester::execute_mint_duelist(system, OWNER(), 'AAA', 1, '1', Archetype::Villainous);
        let duelist2: Duelist = tester::execute_mint_duelist(system, OTHER(), 'BBB', 1, '2', Archetype::Honourable);
        assert(duelist1.score.level_villain == honour::MAX, 'level_villain');
        assert(duelist2.score.level_lord == honour::MAX, 'level_lord');
        let (challenge, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), tables::BRUSSELS);
        // check scoreboard
        let snapshot = tester::get_Snapshot(world, duel_id);
        assert(snapshot.score_a.level_villain == honour::MAX, 'snap.level_villain');
        assert(snapshot.score_b.level_lord == honour::MAX, 'snap.level_lord');
        let mut scoreboard_a = tester::get_Scoreboard(world, challenge.table_id, OWNER());
        let mut scoreboard_b = tester::get_Scoreboard(world, challenge.table_id, OTHER());
        assert(scoreboard_a.score.level_villain == honour::MAX, 'scoreboard_a.level_villain');
        assert(scoreboard_b.score.level_lord == honour::MAX, 'scoreboard_b.level_lord');
        // full bonus for both
        let table_type: TableType = get!(world, challenge.table_id, TableConfig).table_type;
        let (crit_bonus_a, crit_bonus_b, hit_bonus_a, hit_bonus_b) = _get_chances(snapshot, table_type);
        assert(crit_bonus_a == 0, 'crit_bonus_a');
        assert(crit_bonus_b == chances::CRIT_BONUS_LORD, 'crit_bonus_a');
        assert(hit_bonus_a == chances::HIT_BONUS_VILLAIN, 'crit_bonus_a');
        assert(hit_bonus_b == 0, 'crit_bonus_a');
        //
        // Simulate!
        let chances_a: SimulateChances = system.simulate_chances(duelist1.duelist_id, challenge.duel_id, challenge.round_number, 1);
        let chances_b: SimulateChances = system.simulate_chances(duelist2.duelist_id, challenge.duel_id, challenge.round_number, 10);
        assert(crit_bonus_a == chances_a.crit_bonus, 'chances_a.crit_bonus');
        assert(crit_bonus_b == chances_b.crit_bonus, 'chances_b.crit_bonus');
        assert(hit_bonus_a == chances_a.hit_bonus, 'chances_a.hit_bonus');
        assert(hit_bonus_b == chances_b.hit_bonus, 'chances_b.hit_bonus');
    }

    #[test]
    fn test_IRL_keep_archetypes() {
        let (world, system, _admin, _lords, _minter) = tester::setup_world(flags::SYSTEM | flags::ADMIN | flags::MINTER | flags::INITIALIZE | 0);
        let duelist1: Duelist = tester::execute_mint_duelist(system, OWNER(), 'AAA', 1, '1', Archetype::Villainous);
        let duelist2: Duelist = tester::execute_mint_duelist(system, OTHER(), 'BBB', 1, '2', Archetype::Honourable);
        assert(duelist1.score.level_villain == honour::MAX, 'duelist1.level_villain');
        assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
        assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
        assert(duelist2.score.level_lord == honour::MAX, 'duelist2.level_lord');
        //
        // duel to the death!
        let (_challenge, duel_id) = _start_new_challenge(world, system, OWNER(), OTHER(), tables::BRUSSELS);
        let (salt_a, salt_b, action_a, action_b, hash_a, hash_b) = _get_actions_round_1_dual_crit(10, 1);
        tester::execute_commit_action(system, OWNER(), duel_id, 1, hash_a);
        tester::execute_commit_action(system, OTHER(), duel_id, 1, hash_b);
        tester::execute_reveal_action(system, OWNER(), duel_id, 1, salt_a, action_a, 0);
        tester::execute_reveal_action(system, OTHER(), duel_id, 1, salt_b, action_b, 0);
        let (challenge, _round) = tester::get_Challenge_Round(world, duel_id);
        assert(challenge.state != ChallengeState::InProgress.into(), 'challenge.state');
        //
        // table scoreboard keeps archetype
        let mut scoreboard_a = tester::get_Scoreboard(world, challenge.table_id, OWNER());
        let mut scoreboard_b = tester::get_Scoreboard(world, challenge.table_id, OTHER());
        assert(scoreboard_a.score.total_duels > 0, 'scoreboard_a.total_duels');
        assert(scoreboard_b.score.total_duels > 0, 'scoreboard_b.total_duels');
        assert(scoreboard_a.score.level_villain == honour::MAX, 'scoreboard_a.level_villain');
        assert(scoreboard_a.score.level_lord == 0, 'scoreboard_a.level_lord');
        assert(scoreboard_b.score.level_villain == 0, 'scoreboard_b.level_villain');
        assert(scoreboard_b.score.level_lord == honour::MAX, 'scoreboard_b.level_lord');
        // main score IS affected
        let duelist1: Duelist = tester::get_Duelist_id(world, duelist1.duelist_id);
        let duelist2: Duelist = tester::get_Duelist_id(world, duelist2.duelist_id);
        assert(duelist1.score.level_villain == 0, 'duelist1.level_villain');
        assert(duelist1.score.level_lord > 0, 'duelist1.level_lord');
        assert(duelist2.score.level_villain > 0, 'duelist2.level_villain');
        assert(duelist2.score.level_lord == 0, 'duelist2.level_lord');
        // assert(duelist1.score.level_villain == honour::MAX, 'duelist1.level_villain');
        // assert(duelist2.score.level_villain == 0, 'duelist2.level_villain');
        // assert(duelist1.score.level_lord == 0, 'duelist1.level_lord');
        // assert(duelist2.score.level_lord == honour::MAX, 'duelist2.level_lord');
    }

}