use starknet::{ContractAddress};
use pistols::models::challenge::{Challenge};
use pistols::models::duelist::{Duelist, Archetype};
use pistols::models::structs::{SimulateChances};
use pistols::types::challenge::{ChallengeState};

// define the interface
#[dojo::interface]
trait IActions {
    //
    // Duelists
    fn mint_duelist(
        ref world: IWorldDispatcher,
        name: felt252,
        profile_pic_type: u8,
        profile_pic_uri: felt252,
        initial_archetype: Archetype,
    ) -> Duelist;
    fn update_duelist(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        name: felt252,
        profile_pic_type: u8,
        profile_pic_uri: felt252,
    ) -> Duelist;

    //
    // Challenge
    fn create_challenge(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        challenged_id_or_address: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u256,
        expire_seconds: u64,
    ) -> u128;
    fn reply_challenge(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;

    //
    // Duel
    fn commit_action(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    );
    fn reveal_action(
        ref world: IWorldDispatcher,
        duelist_id: u128,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        action_slot1: u8,
        action_slot2: u8,
    );

    //
    // read-only calls
    fn get_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128;
    fn has_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool;
    fn can_join(world: @IWorldDispatcher, table_id: felt252, duelist_id: u128) -> bool;
    fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u256) -> u256;
    fn simulate_chances(world: @IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> SimulateChances;
    fn get_valid_packed_actions(world: @IWorldDispatcher, round_number: u8) -> Array<u16>;
    fn pack_action_slots(world: @IWorldDispatcher, slot1: u8, slot2: u8) -> u16;
    fn unpack_action_slots(world: @IWorldDispatcher, packed: u16) -> (u8, u8);
}

// private/internal functions
#[dojo::interface]
trait IActionsInternal {
    fn _emitDuelistRegisteredEvent(ref world: IWorldDispatcher, address: ContractAddress, duelist: Duelist, is_new: bool);
    fn _emitNewChallengeEvent(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitChallengeAcceptedEvent(ref world: IWorldDispatcher, challenge: Challenge, accepted: bool);
    fn _emitPostRevealEvents(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitChallengeResolvedEvent(ref world: IWorldDispatcher, challenge: Challenge);
    fn _emitDuelistTurnEvent(ref world: IWorldDispatcher, challenge: Challenge);
}

#[dojo::contract(allow_ref_self)]
mod actions {
    use debug::PrintTrait;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};

    use pistols::systems::minter::{IMinterDispatcher, IMinterDispatcherTrait};
    use pistols::models::challenge::{Challenge, Wager, Round, Shot};
    use pistols::models::duelist::{Duelist, DuelistTrait, Archetype, Score, Pact, DuelistManager, DuelistManagerTrait};
    use pistols::models::structs::{SimulateChances};
    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::table::{TableConfig, TableManager, TableTrait, TableManagerTrait, tables, TableType};
    use pistols::models::init::{init};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::action::{Action, ActionTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::utils::short_string::{ShortStringTrait};
    use pistols::libs::seeder::{make_seed};
    use pistols::libs::shooter::{shooter};
    use pistols::libs::utils;
    use pistols::types::constants::{constants, honour};
    use pistols::types::{events};

    mod Errors {
        const NOT_INITIALIZED: felt252           = 'PISTOLS: Not initialized';
        const INVALID_CHALLENGED: felt252        = 'PISTOLS: Challenged unknown';
        const INVALID_CHALLENGED_NULL: felt252   = 'PISTOLS: Challenged null';
        const INVALID_CHALLENGED_SELF: felt252   = 'PISTOLS: Challenged self';
        const INVALID_REPLY_SELF: felt252        = 'PISTOLS: Reply self';
        const INVALID_EXPIRY: felt252            = 'PISTOLS: Invalid expiry';
        const INVALID_CHALLENGE: felt252         = 'PISTOLS: Invalid challenge';
        const INVALID_DUELIST: felt252           = 'PISTOLS: Invalid duelist';
        const NOT_YOUR_CHALLENGE: felt252        = 'PISTOLS: Not your challenge';
        const NOT_YOUR_DUELIST: felt252          = 'PISTOLS: Not your duelist';
        const CHALLENGER_NOT_ADMITTED: felt252   = 'PISTOLS: Challenger not allowed';
        const CHALLENGED_NOT_ADMITTED: felt252   = 'PISTOLS: Challenged not allowed';
        const CHALLENGE_EXISTS: felt252          = 'PISTOLS: Challenge exists';
        const CHALLENGE_NOT_AWAITING: felt252    = 'PISTOLS: Challenge not Awaiting';
        const CHALLENGE_NOT_IN_PROGRESS: felt252 = 'PISTOLS: Challenge not Progress';
        const TABLE_IS_CLOSED: felt252           = 'PISTOLS: Table is closed';
        const MINIMUM_WAGER_NOT_MET: felt252     = 'PISTOLS: Minimum wager not met';
        const NO_WAGER: felt252                  = 'PISTOLS: No wager on this table';
        const INSUFFICIENT_BALANCE: felt252      = 'PISTOLS: Insufficient balance';
        const NO_ALLOWANCE: felt252              = 'PISTOLS: No transfer allowance';
        const WITHDRAW_NOT_AVAILABLE: felt252    = 'PISTOLS: Withdraw not available';
        const WAGER_NOT_AVAILABLE: felt252       = 'PISTOLS: Wager not available';
        const INVALID_ROUND_NUMBER: felt252      = 'PISTOLS: Invalid round number';
        const ROUND_NOT_IN_COMMIT: felt252       = 'PISTOLS: Round not in commit';
        const ROUND_NOT_IN_REVEAL: felt252       = 'PISTOLS: Round not in reveal';
        const ALREADY_COMMITTED: felt252         = 'PISTOLS: Already committed';
        const ALREADY_REVEALED: felt252          = 'PISTOLS: Already revealed';
        const ACTION_HASH_MISMATCH: felt252      = 'PISTOLS: Action hash mismatch';
    }

    // impl: implement functions specified in trait
    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {

        //------------------------
        // Duelists
        //
        fn mint_duelist(ref world: IWorldDispatcher,
            name: felt252,
            profile_pic_type: u8,
            profile_pic_uri: felt252,
            initial_archetype: Archetype,
        ) -> Duelist {
            // mint if you can
            let caller: ContractAddress = starknet::get_caller_address();
            let config_manager: Config = ConfigManagerTrait::new(world).get();
            let minter_dispatcher = IMinterDispatcher{ contract_address: config_manager.minter_address };
            let token_id: u128 = minter_dispatcher.mint(caller, config_manager.token_duelist_address);

            // // create
            let mut duelist = Duelist {
                duelist_id: token_id,
                timestamp: get_block_timestamp(),
                name: name,
                profile_pic_type: profile_pic_type,
                profile_pic_uri: profile_pic_uri.to_byte_array(),
                score: init::Score(),
            };
            match initial_archetype {
                Archetype::Villainous => { duelist.score.level_villain = honour::LEVEL_MAX; },
                Archetype::Trickster =>  { duelist.score.level_trickster = honour::LEVEL_MAX; },
                Archetype::Honourable => { duelist.score.level_lord = honour::LEVEL_MAX; },
                _ => {},
            };
            // // save
            DuelistManagerTrait::new(world).set(duelist.clone());

            self._emitDuelistRegisteredEvent(caller, duelist.clone(), true);

            (duelist)
        }

        fn update_duelist(ref world: IWorldDispatcher,
            duelist_id: u128,
            name: felt252,
            profile_pic_type: u8,
            profile_pic_uri: felt252,
        ) -> Duelist {
            let caller: ContractAddress = starknet::get_caller_address();
            let duelist_manager: DuelistManager = DuelistManagerTrait::new(world);
            let mut duelist = duelist_manager.get(duelist_id);
            assert(duelist.timestamp != 0, Errors::INVALID_DUELIST);
            assert(duelist_manager.is_owner_of(caller, duelist_id) == true, Errors::NOT_YOUR_DUELIST);

            // update
            duelist.name = name;
            duelist.profile_pic_type = profile_pic_type;
            duelist.profile_pic_uri = profile_pic_uri.to_byte_array();
            // save
            duelist_manager.set(duelist.clone());

            self._emitDuelistRegisteredEvent(caller, duelist.clone(), false);

            (duelist)
        }

        //------------------------
        // NEW Challenge
        //
        fn create_challenge(ref world: IWorldDispatcher,
            duelist_id: u128,
            challenged_id_or_address: ContractAddress,
            message: felt252,
            table_id: felt252,
            wager_value: u256,
            expire_seconds: u64,
        ) -> u128 {
            assert(ConfigManagerTrait::is_initialized(world) == true, Errors::NOT_INITIALIZED);

            // validate challenger
            let duelist_id_a: u128 = duelist_id;
            let address_a: ContractAddress = starknet::get_caller_address();
            let duelist_manager = DuelistManagerTrait::new(world);
            assert(duelist_manager.is_owner_of(address_a, duelist_id_a) == true, Errors::NOT_YOUR_DUELIST);
// address_a.print();
// duelist_id_a.print();
// duelist_manager.owner_of(duelist_id_a).print();

            // validate table
            let table_manager = TableManagerTrait::new(world);
            let table: TableConfig = table_manager.get(table_id);
            assert(table.is_open == true, Errors::TABLE_IS_CLOSED);
            assert(table_manager.can_join(table_id, address_a, duelist_id_a), Errors::CHALLENGER_NOT_ADMITTED);

            // validate challenged
            assert(challenged_id_or_address != utils::ZERO(), Errors::INVALID_CHALLENGED_NULL);
            let duelist_id_b: u128 = DuelistTrait::address_to_id(challenged_id_or_address);
            let address_b: ContractAddress = if (duelist_id_b > 0) {
                // challenging a duelist
                assert(duelist_manager.exists(duelist_id_b) == true, Errors::INVALID_CHALLENGED);
                assert(duelist_id_a != duelist_id_b, Errors::INVALID_CHALLENGED_SELF);
                assert(self.has_pact(table_id, duelist_id_a, duelist_id_b) == false, Errors::CHALLENGE_EXISTS);
                (utils::ZERO())
            } else {
                // challenging a wallet
                assert(challenged_id_or_address != address_a, Errors::INVALID_CHALLENGED_SELF);
                (challenged_id_or_address)
            };
            assert(table_manager.can_join(table_id, address_b, duelist_id_b), Errors::CHALLENGED_NOT_ADMITTED);

            // validate expiry
            assert(expire_seconds == 0 || expire_seconds >= timestamp::from_hours(1), Errors::INVALID_EXPIRY);

            // create duel id
            let duel_id: u128 = make_seed(address_a, world.uuid());

            // calc expiration
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_seconds == 0) { 0 } else { timestamp_start + expire_seconds };

            let challenge = Challenge {
                duel_id,
                table_id,
                message,
                // duelists
                address_a,
                address_b,
                duelist_id_a,
                duelist_id_b,
                // progress
                state: ChallengeState::Awaiting.into(),
                round_number: 0,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };

            // setup wager + fees
            assert(wager_value >= table.wager_min, Errors::MINIMUM_WAGER_NOT_MET);
            let fee: u256 = table.calc_fee(wager_value);
            // calc fee and store
            if (fee > 0 || wager_value > 0) {
                assert(table.contract_address != utils::ZERO(), Errors::NO_WAGER);
                let wager = Wager {
                    duel_id,
                    value: wager_value,
                    fee,
                };
                set!(world, (wager));

                // transfer wager/fee from Challenger to the contract
                utils::deposit_wager_fees(world, challenge, challenge.address_a, starknet::get_contract_address());
            }

            // create challenge
            utils::set_challenge(world, challenge);

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
            let mut challenge: Challenge = get!(world, duel_id, Challenge);
            let state: ChallengeState = challenge.state.try_into().unwrap();
            assert(state.exists(), Errors::INVALID_CHALLENGE);
            assert(state == ChallengeState::Awaiting, Errors::CHALLENGE_NOT_AWAITING);

            let address_b: ContractAddress = starknet::get_caller_address();
            let duelist_id_b: u128 = duelist_id;
            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_end > 0 && timestamp > challenge.timestamp_end) {
                // Expired, close it!
                challenge.state = ChallengeState::Expired.into();
                challenge.timestamp_end = timestamp;
            } else if (challenge.duelist_id_a == duelist_id_b) {
                // same duelist, can only withdraw...
                assert(accepted == false, Errors::INVALID_REPLY_SELF);
                challenge.state = ChallengeState::Withdrawn.into();
                challenge.timestamp_end = timestamp;
            } else {
                // validate duelist ownership
                let duelist_manager = DuelistManagerTrait::new(world);
// address_b.print();
// duelist_id_b.print();
// duelist_manager.owner_of(duelist_id_b).print();
                assert(duelist_manager.is_owner_of(address_b, duelist_id_b) == true, Errors::NOT_YOUR_DUELIST);

                // validate challenged identity
                // either wallet ot duelist was challenged, never both
                if (challenge.duelist_id_b != 0) {
                    // challenged the duelist
                    assert(challenge.duelist_id_b == duelist_id_b, Errors::NOT_YOUR_CHALLENGE);
                    // fill missing wallet
                    challenge.address_b = address_b;
                } else {
                    // challenged the wallet
                    assert(challenge.address_b == address_b, Errors::NOT_YOUR_CHALLENGE);
                    // check if chosed duelist has a pact
                    assert(self.has_pact(challenge.table_id, challenge.duelist_id_a, duelist_id_b) == false, Errors::CHALLENGE_EXISTS);
                    // fil missing duelist
                    challenge.duelist_id_b = duelist_id_b;
                }
                // all good!
                if (accepted) {
                    // Challenged is accepting
                    challenge.state = ChallengeState::InProgress.into();
                    challenge.round_number = 1;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                    // create Duelists snapshots for this Challenge
                    utils::create_challenge_snapshot(world, challenge);
                    // transfer wager/fee from Challenged to the contract
                    utils::deposit_wager_fees(world, challenge, challenge.address_b, starknet::get_contract_address());
                    // events
                    self._emitChallengeAcceptedEvent(challenge, accepted);
                    self._emitDuelistTurnEvent(challenge);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused.into();
                    challenge.timestamp_end = timestamp;
                    // events
                    self._emitChallengeAcceptedEvent(challenge, accepted);
                }
            }

            // update challenge state
            utils::set_challenge(world, challenge);

            (challenge.state.try_into().unwrap())
        }


        //------------------------
        // COMMIT Duel action
        //

        fn commit_action(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            round_number: u8,
            hash: u64,
        ) {
            shooter::commit_action(world, duelist_id, duel_id, round_number, hash);
        }

        fn reveal_action(ref world: IWorldDispatcher,
            duelist_id: u128,
            duel_id: u128,
            round_number: u8,
            salt: u64,
            action_slot1: u8,
            action_slot2: u8,
        ) {
            let challenge: Challenge = shooter::reveal_action(world, duelist_id, duel_id, round_number, salt, utils::pack_action_slots(action_slot1, action_slot2));
            self._emitPostRevealEvents(challenge);
        }



        //------------------------------------
        // read-only calls
        //

        fn get_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> u128 {
            let pair: u128 = utils::make_pact_pair(duelist_id_a, duelist_id_b);
            (get!(world, (table_id, pair), Pact).duel_id)
        }

        fn has_pact(world: @IWorldDispatcher, table_id: felt252, duelist_id_a: u128, duelist_id_b: u128) -> bool {
            utils::WORLD(world);
            (self.get_pact(table_id, duelist_id_a, duelist_id_b) != 0)
        }

        fn can_join(world: @IWorldDispatcher, table_id: felt252, duelist_id: u128) -> bool {
            let table_manager = TableManagerTrait::new(world);
            (table_manager.can_join(table_id, starknet::get_caller_address(), duelist_id))
        }

        fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u256) -> u256 {
            let table_manager = TableManagerTrait::new(world);
            let table: TableConfig = table_manager.get(table_id);
            (table.calc_fee(wager_value))
        }

        fn simulate_chances(world: @IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> SimulateChances {
            let (score_self, score_other): (Score, Score) = utils::call_get_snapshot_scores(world, duelist_address, duel_id);
            let health: u8 = utils::call_get_duelist_health(world, duelist_address, duel_id, round_number);
            let action_self: Action = action.into();
            let action_other: Action = action.into();
            let challenge: Challenge = get!(world, duel_id, Challenge);
            let table_type: TableType = get!(world, challenge.table_id, TableConfig).table_type;
            // honour
            let (action_honour, duelist_honour): (i8, u8) = utils::call_simulate_honour_for_action(world, score_self, action_self);
            // crit
            let crit_chances: u8 = utils::calc_crit_chances(score_self, score_other, action_self, action_other, health, table_type);
            let crit_base_chance: u8 = action_self.crit_chance();
            let crit_bonus: u8 = utils::calc_crit_bonus(score_self, table_type);
            let crit_match_bonus: u8 = utils::calc_crit_match_bonus(score_self, action_self, action_other);
            let crit_trickster_penalty: u8 = utils::calc_crit_trickster_penalty(score_self, score_other);
            // hit
            let hit_chances: u8 = utils::calc_hit_chances(score_self, score_other, action_self, action_other, health, table_type);
            let hit_base_chance: u8 = action_self.hit_chance();
            let hit_bonus: u8 = utils::calc_hit_bonus(score_self, table_type);
            let hit_injury_penalty: u8 = utils::calc_hit_injury_penalty(action_self, health);
            let hit_trickster_penalty: u8 = utils::calc_hit_trickster_penalty(score_self, score_other);
            // lethal
            let lethal_chances: u8 = utils::calc_lethal_chances(score_self, score_other, action_self, action_other, hit_chances);
            let lethal_base_chance: u8 = action_self.lethal_chance();
            let lethal_lord_penalty: u8 = utils::calc_lethal_lord_penalty(score_self, score_other, action_self, action_other);
            (SimulateChances {
                // honour
                action_honour,
                duelist_honour,
                // crit
                crit_chances,
                crit_base_chance,
                crit_bonus,
                crit_match_bonus,
                crit_trickster_penalty,
                // hit
                hit_chances,
                hit_base_chance,
                hit_bonus,
                hit_injury_penalty,
                hit_trickster_penalty,
                // lethal
                lethal_chances,
                lethal_base_chance,
                lethal_lord_penalty,
            })
        }

        fn get_valid_packed_actions(world: @IWorldDispatcher, round_number: u8) -> Array<u16> {
            utils::WORLD(world);
            (utils::get_valid_packed_actions(round_number))
        }
        fn pack_action_slots(world: @IWorldDispatcher, slot1: u8, slot2: u8) -> u16 {
            utils::WORLD(world);
            (utils::pack_action_slots(slot1, slot2))
        }
        fn unpack_action_slots(world: @IWorldDispatcher, packed: u16) -> (u8, u8) {
            utils::WORLD(world);
            (utils::unpack_action_slots(packed))
        }
    }


    //------------------------------------
    // Internal calls
    //

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DuelistRegisteredEvent: events::DuelistRegisteredEvent,
        NewChallengeEvent: events::NewChallengeEvent,
        ChallengeAcceptedEvent: events::ChallengeAcceptedEvent,
        ChallengeResolvedEvent: events::ChallengeResolvedEvent,
        DuelistTurnEvent: events::DuelistTurnEvent,
    }

    // #[abi(embed_v0)] // commented to make this private
    impl ActionsInternalImpl of super::IActionsInternal<ContractState> {
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
            utils::WORLD(world);
            let state: ChallengeState = challenge.state.try_into().unwrap();
            if (state == ChallengeState::InProgress) {
                self._emitDuelistTurnEvent(challenge);
            } else if (state == ChallengeState::Resolved || state == ChallengeState::Draw) {
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
                else { (utils::ZERO()) };
            emit!(world, (Event::ChallengeResolvedEvent(events::ChallengeResolvedEvent {
                duel_id: challenge.duel_id,
                winner_address,
            })));
        }
    }
}
