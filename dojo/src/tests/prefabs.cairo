#[cfg(test)]
mod prefabs {
    use debug::PrintTrait;
    use core::traits::{TryInto, Into};
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, RoundEntity};
    use pistols::models::table::{TableConfig, TABLES};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelPace};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::libs::utils::{make_moves_hash};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::math::{MathU8};
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
    use pistols::tests::mock_rng::{IRngDispatcher, IRngDispatcherTrait};

    const NAME_A: felt252 = 'Sensei';
    const NAME_B: felt252 = 'Senpai';
    const MESSAGE: felt252 = 'For honour!!!';
    const TABLE_ID: felt252 = TABLES::LORDS;
    const WAGER_VALUE: u128 = 0;
    // const WAGER_VALUE: u128 = 100_000_000_000_000_000_000;

    const SALT_A: felt252 = 0xa6f099b756a87e62;
    const SALT_B: felt252 = 0xf9a978e92309da78;



    #[derive(Copy, Drop)]
    struct SaltsValues {
        salts: Span<felt252>,
        values: Span<felt252>,
    }

    #[derive(Copy, Drop)]
    struct Moves {
        salt: felt252,
        moves: Span<u8>,
        hash: u128,
    }

    #[generate_trait]
    impl SaltsValuesImpl of SaltsValuesTrait {
        fn new(salts: Span<felt252>, values: Span<felt252>) -> SaltsValues {
            (SaltsValues{salts, values})
        }
        fn empty() -> SaltsValues {
            (SaltsValues{salts: [].span(), values: [].span()})
        }
    }

    #[generate_trait]
    impl MovesImpl of MovesTrait {
        fn new(salt: felt252, moves: Span<u8>) -> Moves {
            (Moves{salt, moves, hash: make_moves_hash(salt, moves)})
        }
    }


    fn start_new_challenge(sys: Systems, duelist_a: ContractAddress, duelist_b: ContractAddress, wager_value: u128) -> u128 {
        // tester::execute_update_duelist(actions, duelist_a, NAME_A, ProfilePicType::Duelist, "1");
        // tester::execute_update_duelist(actions, duelist_b, NAME_B, ProfilePicType::Duelist, "2");
        let duel_id: u128 = tester::execute_create_challenge(@sys.actions, duelist_a, duelist_b, MESSAGE, TABLE_ID, wager_value, 48);
        tester::elapse_timestamp(timestamp::from_days(1));
        tester::execute_reply_challenge(@sys.actions, duelist_b, duel_id, true);
        (duel_id)
    }

    fn start_get_new_challenge(sys: Systems, duelist_a: ContractAddress, duelist_b: ContractAddress, wager_value: u128) -> (ChallengeEntity, RoundEntity, u128) {
        let duel_id: u128 = start_new_challenge(sys, duelist_a, duelist_b, wager_value);
        let challenge: ChallengeEntity = tester::get_ChallengeEntity(sys.world, duel_id);
        let round: RoundEntity = tester::get_RoundEntity(sys.world, duel_id, 1);
        assert(challenge.state == ChallengeState::InProgress, 'challenge.state');
        assert(challenge.round_number == 1, 'challenge.number');
        assert(round.state == RoundState::Commit, 'round.state');
        (challenge, round, duel_id)
    }

    fn commit_reveal_get(sys: Systems, duel_id: u128, duelist_a: ContractAddress, duelist_b: ContractAddress, salts: SaltsValues, moves_a: Moves, moves_b: Moves) -> (ChallengeEntity, RoundEntity) {
        @sys.rng.set_salts(salts.salts, salts.values);
        tester::execute_commit_moves(@sys.actions, duelist_a, duel_id, 1, moves_a.hash);
        tester::execute_commit_moves(@sys.actions, duelist_b, duel_id, 1, moves_b.hash);
        tester::execute_reveal_moves(@sys.actions, duelist_a, duel_id, 1, moves_a.salt, moves_a.moves);
        tester::execute_reveal_moves(@sys.actions, duelist_b, duel_id, 1, moves_b.salt, moves_b.moves);
        let (challenge, round) = tester::get_Challenge_Round_Entity(sys.world, duel_id);
        (challenge, round)
    }


    fn get_moves_custom(moves_a: Span<u8>, moves_b: Span<u8>) -> (SaltsValues, Moves, Moves) {
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b'].span(),
                values: [1, 1].span(),
            },
            MovesTrait::new(SALT_A, moves_a),
            MovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_dual_miss() -> (SaltsValues, Moves, Moves) {
        let moves_a: Span<u8> = [1, 1].span();
        let moves_b: Span<u8> = [1, 1].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b'].span(),
                values: [1, 1].span(),
            },
            MovesTrait::new(SALT_A, moves_a),
            MovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_dual_crit() -> (SaltsValues, Moves, Moves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b'].span(),
                values: [1, 1].span(),
            },
            MovesTrait::new(SALT_A, moves_a),
            MovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_crit_a() -> (SaltsValues, Moves, Moves) {
        let moves_a: Span<u8> = [1, 2].span();
        let moves_b: Span<u8> = [2, 3].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b'].span(),
                values: [1, 1].span(),
            },
            MovesTrait::new(SALT_A, moves_a),
            MovesTrait::new(SALT_B, moves_b),
        )
    }

    fn get_moves_crit_b() -> (SaltsValues, Moves, Moves) {
        let moves_a: Span<u8> = [2, 3].span();
        let moves_b: Span<u8> = [1, 2].span();
        (
            SaltsValues{
                salts: ['shoot_a', 'shoot_b'].span(),
                values: [1, 1].span(),
            },
            MovesTrait::new(SALT_A, moves_a),
            MovesTrait::new(SALT_B, moves_b),
        )
    }

}