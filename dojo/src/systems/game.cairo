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
        round_number: u8,
        hashed: u128,
    );
    fn reveal_moves(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        round_number: u8,
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
        roundNumber: felt252,
        duelistId: felt252,
    ) -> bool;
}

// private/internal functions
#[dojo::interface]
trait IGameInternal {
}

#[dojo::contract]
mod game {
    // use debug::PrintTrait;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};

    use pistols::models::{
        challenge::{Challenge, ChallengeEntity, Wager, Round, Moves},
        duelist::{Duelist, DuelistTrait, Score, Pact},
        table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableAdmittanceEntity, TableAdmittanceEntityTrait, TableType, TABLES},
    };
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::misc::{ZERO, WORLD};
    use pistols::libs::store::{Store, StoreTrait};
    use pistols::libs::shooter::{shooter};
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
        const INVALID_ROUND_NUMBER: felt252      = 'PISTOLS: Invalid round number';
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
            round_number: u8,
            hashed: u128,
        ) {
            let store: Store = StoreTrait::new(world);
            shooter::commit_moves(store, duelist_id, duel_id, round_number, hashed);
        }

        fn reveal_moves(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            round_number: u8,
            salt: felt252,
            moves: Span<u8>,
        ) {
            let store: Store = StoreTrait::new(world);
            let challenge: Challenge = shooter::reveal_moves(store, duelist_id, duel_id, round_number, salt, moves);

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
                let mut round: Round = store.get_round(duel_id, 1);
                (shooter::game_loop(world, table.deck_type, ref round))
            } else {
                {Default::default()}
            }
        }

        fn test_validate_commit_message(world: @IWorldDispatcher,
            account: ContractAddress,
            signature: Array<felt252>,
            duelId: felt252,
            roundNumber: felt252,
            duelistId: felt252,
        ) -> bool {
            WORLD(world);
            let msg = CommitMoveMessage {
                duelId,
                roundNumber,
                duelistId,
            };
            (msg.validate(account, signature))
        }
    }


    //------------------------------------
    // Internal calls
    //
    impl GameInternalImpl of super::IGameInternal<ContractState> {
    }
}
