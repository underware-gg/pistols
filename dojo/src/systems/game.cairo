use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::models::duelist::{Duelist};
use pistols::types::challenge_state::{ChallengeState};
use pistols::types::duel_progress::{DuelProgress};
use pistols::types::premise::{Premise};

// define the interface
#[dojo::interface]
trait IGame {
    //
    // Challenge
    fn create_challenge(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        challenged_id_or_address: ContractAddress,
        premise: Premise,
        quote: felt252,
        table_id: felt252,
        wager_value: u128,
        expire_hours: u64,
    ) -> u128;
    fn reply_challenge(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;

    //
    // Duel
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
    fn get_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128;
    fn has_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool;
    fn can_join(world: @IWorldDispatcher, table_id: felt252, duelist_id: u128) -> bool;
    fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u128) -> u128;
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

    use pistols::interfaces::systems::{
        WorldSystemsTrait,
        IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
    };
    use pistols::models::challenge::{Challenge, ChallengeEntity, Wager, Round, Moves};
    use pistols::models::duelist::{Duelist, DuelistTrait, Score, Pact};
    use pistols::models::table::{TableConfig, TableConfigEntity, TableConfigEntityTrait, TableAdmittanceEntity, TableAdmittanceEntityTrait, TableType, TABLES};
    use pistols::types::premise::{Premise, PremiseTrait};
    use pistols::types::challenge_state::{ChallengeState, ChallengeStateTrait};
    use pistols::types::duel_progress::{DuelProgress};
    use pistols::types::round_state::{RoundState, RoundStateTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::utils::misc::{ZERO, WORLD};
    use pistols::libs::seeder::{make_seed};
    use pistols::libs::shooter::{shooter};
    use pistols::libs::utils;
    use pistols::types::cards::hand::DuelistHandTrait;
    use pistols::types::typed_data::{CommitMoveMessage, CommitMoveMessageTrait};
    use pistols::types::{events};
    use pistols::libs::store::{Store, StoreTrait};

    mod Errors {
        const NOT_INITIALIZED: felt252           = 'PISTOLS: Not initialized';
        const INVALID_CHALLENGED: felt252        = 'PISTOLS: Challenged unknown';
        const INVALID_CHALLENGED_NULL: felt252   = 'PISTOLS: Challenged null';
        const INVALID_CHALLENGED_SELF: felt252   = 'PISTOLS: Challenged self';
        const INVALID_REPLY_SELF: felt252        = 'PISTOLS: Reply self';
        const INVALID_CHALLENGE: felt252         = 'PISTOLS: Invalid challenge';
        const NOT_YOUR_CHALLENGE: felt252        = 'PISTOLS: Not your challenge';
        const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        const CHALLENGER_NOT_ADMITTED: felt252   = 'PISTOLS: Challenger not allowed';
        const CHALLENGED_NOT_ADMITTED: felt252   = 'PISTOLS: Challenged not allowed';
        const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        const CHALLENGE_NOT_AWAITING: felt252    = 'PISTOLS: Challenge not Awaiting';
        const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not Progress';
        const TABLE_IS_CLOSED: felt252           = 'PISTOLS: Table is closed';
        const MINIMUM_WAGER_NOT_MET: felt252     = 'PISTOLS: Minimum wager not met';
        const NO_WAGER: felt252                  = 'PISTOLS: Fee contract not set';
        const WAGER_NOT_ALLOWED: felt252         = 'PISTOLS: Wager not allowed';
        const INSUFFICIENT_BALANCE: felt252      = 'PISTOLS: Insufficient balance';
        const NO_ALLOWANCE: felt252              = 'PISTOLS: No transfer allowance';
        const WITHDRAW_NOT_AVAILABLE: felt252    = 'PISTOLS: Withdraw not available';
        const WAGER_NOT_AVAILABLE: felt252       = 'PISTOLS: Wager not available';
        const INVALID_ROUND_NUMBER: felt252      = 'PISTOLS: Invalid round number';
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
        // NEW Challenge
        //
        fn create_challenge(ref world: IWorldDispatcher,
            duelist_id: u128,
            challenged_id_or_address: ContractAddress,
            premise: Premise,
            quote: felt252,
            table_id: felt252,
            wager_value: u128,
            expire_hours: u64,
        ) -> u128 {
            let store: Store = StoreTrait::new(world);

            // validate challenger
            let duelist_id_a: u128 = duelist_id;
            let address_a: ContractAddress = starknet::get_caller_address();
            let duelist_dispatcher: IDuelistTokenDispatcher = world.duelist_token_dispatcher();
            assert(duelist_dispatcher.is_owner_of(address_a, duelist_id_a) == true, Errors::NOT_YOUR_DUELIST);

            // validate table
            let table: TableConfigEntity = store.get_table_config_entity(table_id);
            assert(table.is_open == true, Errors::TABLE_IS_CLOSED);
            let table_admittance: TableAdmittanceEntity = store.get_table_admittance_entity(table_id);
            assert(table_admittance.can_join(address_a, duelist_id_a), Errors::CHALLENGER_NOT_ADMITTED);

            // create duel id
            let duel_id: u128 = make_seed(address_a, world.uuid());

            // validate challenged
            assert(challenged_id_or_address.is_non_zero(), Errors::INVALID_CHALLENGED_NULL);
            let duelist_id_b: u128 = DuelistTrait::try_address_to_id(challenged_id_or_address);
            let address_b: ContractAddress = if (duelist_id_b > 0) {
                // challenging a duelist...
                assert(duelist_dispatcher.exists(duelist_id_b) == true, Errors::INVALID_CHALLENGED);
                assert(duelist_id_a != duelist_id_b, Errors::INVALID_CHALLENGED_SELF);
                (ZERO())
            } else {
                // challenging a wallet...
                assert(challenged_id_or_address != address_a, Errors::INVALID_CHALLENGED_SELF);
                (challenged_id_or_address)
            };
            assert(table_admittance.can_join(address_b, duelist_id_b), Errors::CHALLENGED_NOT_ADMITTED);

            // calc expiration
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_hours == 0) { 0 } else { timestamp_start + timestamp::from_hours(expire_hours) };

            let challenge = Challenge {
                duel_id,
                table_id,
                premise,
                quote,
                // duelists
                address_a,
                address_b,
                duelist_id_a,
                duelist_id_b,
                // progress
                state: ChallengeState::Awaiting,
                round_number: 0,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };

            // set the pact + assert it does not exist
            utils::set_pact(store, challenge);

            // setup wager + fees
            // assert(wager_value >= table.wager_min, Errors::MINIMUM_WAGER_NOT_MET);
            let fee: u128 = table.calc_fee(wager_value);
            // calc fee and store
            if (fee > 0 || wager_value > 0) {
                assert(table.fee_contract_address.is_non_zero(), Errors::NO_WAGER);
                let wager = Wager {
                    duel_id,
                    value: wager_value,
                    fee,
                };
                set!(world, (wager));

                // transfer wager/fee from Challenger to the contract
                utils::deposit_wager_fees(store, challenge, challenge.address_a, starknet::get_contract_address());
            }
            
            // create challenge
            utils::set_challenge(store, challenge);

            self._emitNewChallengeEvent(challenge);

            (duel_id)
        }

        //------------------------
        // REPLY Challenge
        //
        fn reply_challenge(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            // validate chalenge
            let store: Store = StoreTrait::new(world);
            let mut challenge: Challenge = store.get_challenge(duel_id);
            assert(challenge.state.exists(), Errors::INVALID_CHALLENGE);
            assert(challenge.state == ChallengeState::Awaiting, Errors::CHALLENGE_NOT_AWAITING);

            let address_b: ContractAddress = starknet::get_caller_address();
            let duelist_id_b: u128 = duelist_id;
            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_end > 0 && timestamp > challenge.timestamp_end) {
                // Expired, close it!
                challenge.state = ChallengeState::Expired;
                challenge.timestamp_end = timestamp;
            } else if (challenge.duelist_id_a == duelist_id_b) {
                // same duelist, can only withdraw...
                assert(accepted == false, Errors::INVALID_REPLY_SELF);
                challenge.state = ChallengeState::Withdrawn;
                challenge.timestamp_end = timestamp;
            } else {
                // validate duelist ownership
                let duelist_dispatcher = world.duelist_token_dispatcher();
// address_b.print();
// duelist_id_b.print();
// duelist_dispatcher.owner_of(duelist_id_b).print();
                assert(duelist_dispatcher.is_owner_of(address_b, duelist_id_b) == true, Errors::NOT_YOUR_DUELIST);

                // validate challenged identity
                // either wallet ot duelist was challenged, never both
                if (challenge.duelist_id_b != 0) {
                    // challenged the duelist...
                    // can only be accepted by it
                    assert(challenge.duelist_id_b == duelist_id_b, Errors::NOT_YOUR_CHALLENGE);
                    // fill missing wallet
                    challenge.address_b = address_b;
                } else {
                    // challenged the wallet...
                    // can only be accepted by that wallet
                    assert(challenge.address_b == address_b, Errors::NOT_YOUR_CHALLENGE);
                    // validate chosen duelist
                    assert(challenge.duelist_id_a != duelist_id_b, Errors::INVALID_CHALLENGED_SELF);
                    // remove pact between wallets
                    utils::unset_pact(store, challenge);
                    // fil missing duelist
                    challenge.duelist_id_b = duelist_id_b;
                    // create pact between duelists
                    utils::set_pact(store, challenge);
                }
                // all good!
                if (accepted) {
                    // Challenged is accepting
                    challenge.state = ChallengeState::InProgress;
                    challenge.round_number = 1;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                    // transfer wager/fee from Challenged to the contract
                    utils::deposit_wager_fees(store, challenge, challenge.address_b, starknet::get_contract_address());
                    // events
                    self._emitChallengeAcceptedEvent(challenge, accepted);
                    self._emitDuelistTurnEvent(challenge);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused;
                    challenge.timestamp_end = timestamp;
                    // events
                    self._emitChallengeAcceptedEvent(challenge, accepted);
                }
            }

            // undo pact if duel does not proceed
            if (!challenge.state.is_live()) {
                utils::unset_pact(store, challenge);
            }

            // update challenge state
            utils::set_challenge(store, challenge);

            (challenge.state)
        }


        //------------------------
        // COMMIT Duel action
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

            // undo pact if finished
            if (challenge.state.is_finished()) {
                utils::unset_pact(store, challenge);
            }

            self._emitPostRevealEvents(challenge);
        }



        //------------------------------------
        // view calls
        //

        fn get_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128 {
            let store: Store = StoreTrait::new(world);
            (utils::get_pact(store, table_id, duelist_id_a, duelist_id_b))
        }

        fn has_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool {
            let store: Store = StoreTrait::new(world);
            (utils::get_pact(store, table_id, duelist_id_a, duelist_id_b) != 0)
        }

        fn can_join(world: @IWorldDispatcher, table_id: felt252, duelist_id: u128) -> bool {
            let store: Store = StoreTrait::new(world);
            let table: TableConfigEntity = store.get_table_config_entity(table_id);
            let table_admittance: TableAdmittanceEntity = store.get_table_admittance_entity(table_id);
            (table.is_open && table_admittance.can_join(starknet::get_caller_address(), duelist_id))
        }

        fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u128) -> u128 {
            let store: Store = StoreTrait::new(world);
            let table: TableConfigEntity = store.get_table_config_entity(table_id);
            (table.calc_fee(wager_value))
        }

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
