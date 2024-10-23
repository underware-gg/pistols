use starknet::{ContractAddress};
use dojo::world::IWorldDispatcher;
use pistols::models::challenge::{Challenge};
use pistols::models::duelist::{Duelist};
use pistols::types::duel_progress::{DuelProgress};

// define the interface
#[dojo::interface]
trait IGame {
    //
    // Game actions
    fn commit_moves(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        hashed: u128,
    );
    fn reveal_moves(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    );

    //
    // view calls
    fn get_player_card_decks(world: @IWorldDispatcher, table_id: felt252) -> Span<Span<u8>>;
    fn get_duel_progress(world: @IWorldDispatcher, duel_id: u128) -> DuelProgress;
    fn test_validate_commit_message(world: @IWorldDispatcher,
        account: ContractAddress,
        signature: Array<felt252>,
        duelId: felt252,
        duelistId: felt252,
    ) -> bool;
}

#[dojo::contract]
mod game {
    // use debug::PrintTrait;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};

    use pistols::models::{
        challenge::{Challenge, ChallengeEntity, Round, RoundTrait, RoundEntity, MovesTrait},
        duelist::{Duelist, DuelistTrait, DuelistEntity, Score, ScoreTrait, Scoreboard, Pact},
        table::{TableConfig, TableConfigEntity, TableConfigEntityTrait},
    };
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress, DuelistDrawnCard};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::types::constants::{CONST};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::misc::{ZERO, WORLD};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::game_loop::{game_loop, make_moves_hash};
    use pistols::libs::pact;
    use pistols::libs::utils;
    use pistols::types::cards::hand::DuelistHandTrait;
    use pistols::types::typed_data::{CommitMoveMessage, CommitMoveMessageTrait};
    use pistols::libs::events::{emitters};

    mod Errors {
        const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not Progress';
        const INSUFFICIENT_BALANCE: felt252      = 'PISTOLS: Insufficient balance';
        const NO_ALLOWANCE: felt252              = 'PISTOLS: No transfer allowance';
        const WITHDRAW_NOT_AVAILABLE: felt252    = 'PISTOLS: Withdraw not available';
        const WAGER_NOT_AVAILABLE: felt252       = 'PISTOLS: Wager not available';
        const NOT_YOUR_CHALLENGE: felt252        = 'PISTOLS: Not your challenge';
        const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        const ROUND_NOT_IN_COMMIT: felt252       = 'PISTOLS: Round not in commit';
        const ROUND_NOT_IN_REVEAL: felt252       = 'PISTOLS: Round not in reveal';
        const ALREADY_COMMITTED: felt252         = 'PISTOLS: Already committed';
        const ALREADY_REVEALED: felt252          = 'PISTOLS: Already revealed';
        const INVALID_SALT: felt252              = 'PISTOLS: Invalid salt';
        const INVALID_MOVES_COUNT: felt252       = 'PISTOLS: Invalid moves count';
        const MOVES_HASH_MISMATCH: felt252       = 'PISTOLS: Moves hash mismatch';
    }

    // impl: implement functions specified in trait
    #[abi(embed_v0)]
    impl ActionsImpl of super::IGame<ContractState> {

        //------------------------
        // Game actions
        //

        fn commit_moves(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            hashed: u128,
        ) {
            let store: Store = StoreTrait::new(world);
            let challenge: Challenge = store.get_challenge(duel_id);

            // Assert correct Challenge
            let duelist_number = self.assert_challenge(challenge, starknet::get_caller_address(), duelist_id, duel_id);

            // Assert correct Round
            let mut round: RoundEntity = store.get_round_entity(duel_id);
            assert(round.state == RoundState::Commit, Errors::ROUND_NOT_IN_COMMIT);

            // Validate action hash

            // Store hash
            if (duelist_number == 1) {
                assert(round.moves_a.hashed == 0, Errors::ALREADY_COMMITTED);
                round.moves_a.hashed = hashed;
            } else if (duelist_number == 2) {
                assert(round.moves_b.hashed == 0, Errors::ALREADY_COMMITTED);
                round.moves_b.hashed = hashed;
            }

            // Finished commit
            if (round.moves_a.hashed != 0 && round.moves_b.hashed != 0) {
                round.state = RoundState::Reveal;
            }

            store.update_round_entity(@round);
        }

        fn reveal_moves(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            salt: felt252,
            moves: Span<u8>,
        ) {
            let store: Store = StoreTrait::new(world);
            let mut challenge: Challenge = store.get_challenge(duel_id);
            
            // Assert correct Challenge
            let duelist_number = self.assert_challenge(challenge, starknet::get_caller_address(), duelist_id, duel_id);

            // Assert correct Round
            let mut round: Round = store.get_round( duel_id);
            assert(round.state == RoundState::Reveal, Errors::ROUND_NOT_IN_REVEAL);

            // Validate salt
            // TODO: verify salt as a signature
            assert(salt != 0, Errors::INVALID_SALT);

            // Validate action hash
            assert(moves.len() >= 2 && moves.len() <= 4, Errors::INVALID_MOVES_COUNT);
            let hashed: u128 = make_moves_hash(salt, moves);

            // since the hash was validated
            // we should not validate the actual moves
            // all we can do is skip if they are invalid

            // Validate moves hash
            if (duelist_number == 1) {
                assert(round.moves_a.card_1 == 0, Errors::ALREADY_REVEALED);
                assert(round.moves_a.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_a.initialize(salt, moves);
            } else if (duelist_number == 2) {
                assert(round.moves_b.card_1 == 0, Errors::ALREADY_REVEALED);
                assert(round.moves_b.hashed == hashed, Errors::MOVES_HASH_MISMATCH);
                round.moves_b.initialize(salt, moves);
            }

            //
            // Incomplete Round, update only
            if (round.moves_a.salt == 0 || round.moves_b.salt == 0) {
                store.set_round(@round);
                return;
            }

            // Execute game loop...
            let table: TableConfigEntity = store.get_table_config_entity(challenge.table_id);
            let progress: DuelProgress = game_loop(store.world, table.deck_type, ref round);
            store.set_round(@round);

            // end challenge
            challenge.winner = progress.winner;
            challenge.state = if (progress.winner == 0) {ChallengeState::Draw} else {ChallengeState::Resolved};
            challenge.timestamp_end = get_block_timestamp();
            self.finish_challenge(store, challenge);

            // undo pact
            pact::unset_pact(store, challenge);

            emitters::emitPostRevealEvents(@world, challenge);
        }



        //------------------------------------
        // view calls
        //

        fn get_player_card_decks(world: @IWorldDispatcher, table_id: felt252) -> Span<Span<u8>> {
            let store: Store = StoreTrait::new(world);
            let table: TableConfigEntity = store.get_table_config_entity(table_id);
            (DuelistHandTrait::get_table_player_decks(table.deck_type))
        }

        fn get_duel_progress(world: @IWorldDispatcher, duel_id: u128) -> DuelProgress {
            let store: Store = StoreTrait::new(world);
            let challenge: Challenge = store.get_challenge(duel_id);
            if (challenge.state.is_finished()) {
                let table: TableConfigEntity = store.get_table_config_entity(challenge.table_id);
                let mut round: Round = store.get_round(duel_id);
                (game_loop(world, table.deck_type, ref round))
            } else {
                {Default::default()}
            }
        }

        fn test_validate_commit_message(world: @IWorldDispatcher,
            account: ContractAddress,
            signature: Array<felt252>,
            duelId: felt252,
            duelistId: felt252,
        ) -> bool {
            WORLD(world);
            let msg = CommitMoveMessage {
                duelId,
                duelistId,
            };
            (msg.validate(account, signature))
        }
    }


    //------------------------------------
    // Internal calls
    //
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_challenge(self: @ContractState, challenge: Challenge, caller: ContractAddress, duelist_id: u128, duel_id: u128) -> u8 {
            // Assert Duelist is in the challenge
            let duelist_number: u8 =
                if (challenge.duelist_id_a == duelist_id) { 1 }
                else if (challenge.duelist_id_b == duelist_id) { 2 }
                else { 0 };
            assert(duelist_number != 0, Errors::NOT_YOUR_DUELIST);

            let duelist_address: ContractAddress =
                if (duelist_number == 1) { challenge.address_a }
                else { challenge.address_b };
            assert(caller == duelist_address, Errors::NOT_YOUR_CHALLENGE);

            // Correct Challenge state
            assert(challenge.state == ChallengeState::InProgress, Errors::CHALLENGE_NOT_IN_PROGRESS);
            
            (duelist_number)
        }

        fn finish_challenge(self: @ContractState, store: Store, challenge: Challenge) {
            store.set_challenge(@challenge);

            // get duelist as Entity, as we know they exist
            let mut duelist_a: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_a);
            let mut duelist_b: DuelistEntity = store.get_duelist_entity(challenge.duelist_id_b);
            // Scoreboards we need the model, since they may not exist yet
            let mut scoreboard_a: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_a);
            let mut scoreboard_b: Scoreboard = store.get_scoreboard(challenge.table_id, challenge.duelist_id_b);
            
            // update totals
            ScoreTrait::update_totals(ref duelist_a.score, ref duelist_b.score, challenge.winner);
            ScoreTrait::update_totals(ref scoreboard_a.score, ref scoreboard_b.score, challenge.winner);

            // compute honour from final round
            let round: RoundEntity = store.get_round_entity(challenge.duel_id);
            duelist_a.score.update_honour(round.state_a.honour);
            duelist_b.score.update_honour(round.state_b.honour);
            scoreboard_a.score.update_honour(round.state_a.honour);
            scoreboard_b.score.update_honour(round.state_b.honour);

            // split wager/fee to winners and benefactors
            if (round.state_a.wager > round.state_b.wager) {
                // duelist_a won the Wager
                let wager_value: u128 = utils::split_wager_fees(store, challenge, challenge.address_a, challenge.address_a);
                scoreboard_a.wager_won += wager_value;
                scoreboard_b.wager_lost += wager_value;
            } else if (round.state_a.wager < round.state_b.wager) {
                // duelist_b won the Wager
                let wager_value: u128 = utils::split_wager_fees(store, challenge, challenge.address_b, challenge.address_b);
                scoreboard_a.wager_lost += wager_value;
                scoreboard_b.wager_won += wager_value;
            } else {
                // no-one gets the Wager
                utils::split_wager_fees(store, challenge, challenge.address_a, challenge.address_b);
            }
            
            // save
            store.update_duelist_entity(@duelist_a);
            store.update_duelist_entity(@duelist_b);
            store.set_scoreboard(@scoreboard_a);
            store.set_scoreboard(@scoreboard_b);
        }
    }
}
