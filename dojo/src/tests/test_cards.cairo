#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::rng::{Dice, DiceTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, RoundEntity, Shot, ShotTrait, PlayerState};
    use pistols::models::duelist::{Duelist, DuelistEntity, DuelistEntityStore, ProfilePicType, Archetype};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::models::init::{init};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelPace};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::types::cards::hand::{
        PlayerHand, PlayerHandTrait,
        PacesCard, PacesCardTrait,
        EnvCard, EnvCardTrait,
        TacticsCard, TacticsCardTrait,
    };
    use pistols::libs::shooter::{shooter};
    use pistols::libs::utils::{make_moves_hash};

    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::tester::{tester,
        tester::{
            Systems,
            FLAGS, ID, ZERO,
            OWNER, OTHER, BUMMER, TREASURY,
            BIG_BOY, LITTLE_BOY, LITTLE_GIRL,
            OWNED_BY_LITTLE_BOY, OWNED_BY_LITTLE_GIRL,
            FAKE_OWNER_1_1, FAKE_OWNER_2_2,
        }
    };
    use pistols::tests::prefabs::{prefabs,
        prefabs::{
            SALT_A, SALT_B, TABLE_ID, MESSAGE, WAGER_VALUE,
            SaltsValues, SaltsValuesTrait,
            Moves, MovesTrait,
        },
    };



    // simple test to make sure main game_loop() works
    #[test]
    fn test_game_loop() {
        let sys = tester::setup_world(FLAGS::ACTIONS | FLAGS::LORDS | FLAGS::APPROVE | FLAGS::MOCK_RNG);

        // let (salts, moves_a, moves_b) = prefabs::get_moves_dual_miss();
        let salts = SaltsValuesTrait::empty();
        let moves_a: Moves = MovesTrait::new(SALT_A, [1, 1, TacticsCard::Vengeful.into()].span());
        let moves_b: Moves = MovesTrait::new(SALT_B, [1, 1, TacticsCard::Vengeful.into()].span());

        let duel_id = prefabs::start_new_challenge(sys, OWNER(), OTHER(), WAGER_VALUE);
        let (_challenge, round) = prefabs::commit_reveal_get(sys, duel_id, OWNER(), OTHER(), salts, moves_a, moves_b);

        assert(round.shot_a.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_a');
        assert(round.shot_b.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_b');
        assert(round.shot_a.state_start.damage < round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage < round.shot_b.state_final.damage, 'final_damage_b');
    }

    //-----------------------------------------
    // game_loop_internal
    //

    fn execute_game_loop_internal(sys: Systems, moves_a: Span<u8>, moves_b: Span<u8>) -> (Round, DuelProgress) {
        let mut dice: Dice = DiceTrait::new(@sys.world, 0x1212121212);
        let mut round = Round {
            duel_id: 0x1234,
            round_number: 1,
            state: RoundState::Reveal,
            shot_a: init::Shot(),
            shot_b: init::Shot(),
        };
        round.shot_a.initialize(SALT_A, moves_a);
        round.shot_b.initialize(SALT_B, moves_b);
        let progress: DuelProgress = shooter::game_loop_internal(ref dice, ref round);
        (round, progress)
    }


    #[test]
    fn test_vengeful_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, TacticsCard::Vengeful.into()].span(),
            [1, 1, 0].span(),
        );
        assert(round.shot_a.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_a');
        assert(round.shot_b.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_b');
        assert(round.shot_a.state_start.damage < round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage == round.shot_b.state_final.damage, 'final_damage_b');
    }

    #[test]
    fn test_vengeful_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, 0].span(),
            [1, 1, TacticsCard::Vengeful.into()].span(),
        );
        assert(round.shot_a.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_a');
        assert(round.shot_b.state_start.damage == CONST::INITIAL_DAMAGE, 'START_DAMAGE_b');
        assert(round.shot_a.state_start.damage == round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage < round.shot_b.state_final.damage, 'final_damage_b');
    }

    #[test]
    fn test_thick_coat_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, TacticsCard::ThickCoat.into()].span(),
            [1, 1, 0].span(),
        );
        assert(round.shot_a.state_start.damage == round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage > round.shot_b.state_final.damage, 'final_damage_b');
    }

    #[test]
    fn test_thick_coat_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, 0].span(),
            [1, 1, TacticsCard::ThickCoat.into()].span(),
        );
        assert(round.shot_a.state_start.damage > round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage == round.shot_b.state_final.damage, 'final_damage_b');
    }

    #[test]
    fn test_vengeful_thick_a() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, TacticsCard::Vengeful.into()].span(),
            [1, 1, TacticsCard::ThickCoat.into()].span(),
        );
        // cancels each other
        assert(round.shot_a.state_start.damage == round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage == round.shot_b.state_final.damage, 'final_damage_b');
    }

    #[test]
    fn test_vengeful_thick_b() {
        let sys = tester::setup_world(FLAGS::MOCK_RNG);
        let (round, _progress) = execute_game_loop_internal(sys,
            [1, 1, TacticsCard::ThickCoat.into()].span(),
            [1, 1, TacticsCard::Vengeful.into()].span(),
        );
        // cancels each other
        assert(round.shot_a.state_start.damage == round.shot_a.state_final.damage, 'final_damage_a');
        assert(round.shot_b.state_start.damage == round.shot_b.state_final.damage, 'final_damage_b');
    }



}
