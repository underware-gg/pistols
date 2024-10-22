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
    fn _emitDuelistRegisteredEvent(ref world: IWorldDispatcher, address: ContractAddress, duelist: Duelist, is_new: bool);
    fn _emitNewChallengeEvent(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitChallengeAcceptedEvent(ref world: IWorldDispatcher, challenge: Challenge, accepted: bool);
    fn _emitPostRevealEvents(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitChallengeResolvedEvent(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitDuelistTurnEvent(ref world: IWorldDispatcher, challenge: Challenge);
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
    use pistols::types::{events};

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

            self._emitPostRevealEvents(challenge);
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

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        DuelistRegisteredEvent: events::DuelistRegisteredEvent,
        NewChallengeEvent: events::NewChallengeEvent,
        ChallengeAcceptedEvent: events::ChallengeAcceptedEvent,
        ChallengeResolvedEvent: events::ChallengeResolvedEvent,
        DuelistTurnEvent: events::DuelistTurnEvent,
    }

    // #[abi(embed_v0)] // commented to make this private
    impl ActionsInternalImpl of super::IGameInternal<ContractState> {
        // TODO: move to IDuelistToken
        fn _emitDuelistRegisteredEvent(ref world: IWorldDispatcher, address: ContractAddress, duelist: Duelist, is_new: bool) {
            emit!(world, (Event::DuelistRegisteredEvent(events::DuelistRegisteredEvent {
                address,
                duelist_id: duelist.duelist_id,
                name: duelist.name,
                profile_pic_type: duelist.profile_pic_type,
                profile_pic_uri: duelist.profile_pic_uri,
                is_new,
            })));
        }
        fn _emitNewChallengeEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            emit!(world, (Event::NewChallengeEvent (events::NewChallengeEvent {
                duel_id: challenge.duel_id,
                address_a: challenge.address_a,
                address_b: challenge.address_b,
            })));
        }
        fn _emitChallengeAcceptedEvent(ref world: IWorldDispatcher, challenge: Challenge, accepted: bool) {
            emit!(world, (Event::ChallengeAcceptedEvent (events::ChallengeAcceptedEvent {
                duel_id: challenge.duel_id,
                address_a: challenge.address_a,
                address_b: challenge.address_b,
                accepted,
            })));
        }
        fn _emitPostRevealEvents(ref world: IWorldDispatcher, challenge: Challenge) {
            WORLD(world);
            if (challenge.state == ChallengeState::InProgress) {
                self._emitDuelistTurnEvent(challenge);
            } else if (challenge.state == ChallengeState::Resolved || challenge.state == ChallengeState::Draw) {
                self._emitChallengeResolvedEvent(challenge);
            }
        }
        fn _emitDuelistTurnEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            let address: ContractAddress =
                if (challenge.address_a == starknet::get_caller_address()) { (challenge.address_b) }
                else { (challenge.address_a) };
            emit!(world, (Event::DuelistTurnEvent(events::DuelistTurnEvent {
                duel_id: challenge.duel_id,
                round_number: challenge.round_number,
                address,
            })));
        }
        fn _emitChallengeResolvedEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            let winner_address: ContractAddress = 
                if (challenge.winner == 1) { (challenge.address_a) }
                else if (challenge.winner == 2) { (challenge.address_b) }
                else { (ZERO()) };
            emit!(world, (Event::ChallengeResolvedEvent(events::ChallengeResolvedEvent {
                duel_id: challenge.duel_id,
                winner_address,
            })));
        }
    }
}
