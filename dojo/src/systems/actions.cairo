use starknet::{ContractAddress};
use pistols::models::models::{Duelist, Challenge};
use pistols::models::structs::{SimulateChances};
use pistols::types::challenge::{ChallengeState};

// define the interface
#[dojo::interface]
trait IActions {
    //
    // Duelists
    fn register_duelist(
        ref world: IWorldDispatcher,
        name: felt252,
        profile_pic: u8,
    ) -> Duelist;

    //
    // Challenge
    fn create_challenge(
        ref world: IWorldDispatcher,
        challenged: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u256,
        expire_seconds: u64,
    ) -> u128;
    fn reply_challenge(
        ref world: IWorldDispatcher,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;

    //
    // Duel
    fn commit_action(
        ref world: IWorldDispatcher,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    );
    fn reveal_action(
        ref world: IWorldDispatcher,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        action_slot1: u8,
        action_slot2: u8,
    );

    //
    // read-only calls
    fn get_pact(world: @IWorldDispatcher, duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128;
    fn has_pact(duelist_a: ContractAddress, duelist_b: ContractAddress) -> bool;

    fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u256) -> u256;
    
    fn simulate_chances(world: @IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> SimulateChances;

    fn get_valid_packed_actions(round_number: u8) -> Array<u16>;
    fn pack_action_slots(slot1: u8, slot2: u8) -> u16;
    fn unpack_action_slots(packed: u16) -> (u8, u8);
}

// private/internal functions
#[dojo::interface]
trait IActionsInternal {
    fn _emitDuelistRegisteredEvent(ref world: IWorldDispatcher, duelist: Duelist, is_new: bool);
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

    use pistols::models::models::{Duelist, Score, Challenge, Wager, Pact, Round, Shot};
    use pistols::models::structs::{SimulateChances};
    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::table::{TTable, TableManager, TableTrait, TableManagerTrait, tables};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::types::action::{Action, ActionTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::systems::seeder::{make_seed};
    use pistols::systems::shooter::{shooter};
    use pistols::systems::{utils};
    use pistols::types::constants::{constants};
    use pistols::types::{events};

    // impl: implement functions specified in trait
    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {

        //------------------------
        // Duelists
        //
        fn register_duelist(ref world: IWorldDispatcher,
            name: felt252,
            profile_pic: u8,
        ) -> Duelist {
            let caller: ContractAddress = starknet::get_caller_address();

            let mut duelist: Duelist = get!(world, caller, Duelist);

            // 1st time setup
            let is_new: bool = (duelist.timestamp == 0);
            if (is_new) {
                duelist.timestamp = get_block_timestamp();
            }

            // update
            duelist.name = name;
            duelist.profile_pic = profile_pic;

            set!(world, (duelist));

            self._emitDuelistRegisteredEvent(duelist, is_new);

            (duelist)
        }

        //------------------------
        // NEW Challenge
        //
        fn create_challenge(ref world: IWorldDispatcher,
            challenged: ContractAddress,
            message: felt252,
            table_id: felt252,
            wager_value: u256,
            expire_seconds: u64,
        ) -> u128 {
            assert(ConfigManagerTrait::is_initialized(world) == true, 'Not initialized');

            assert(challenged != utils::zero_address(), 'Missing challenged address');
            assert(expire_seconds == 0 || expire_seconds >= timestamp::from_hours(1), 'Invalid expire_seconds');

            let caller: ContractAddress = starknet::get_caller_address();
            let table_manager = TableManagerTrait::new(world);

            assert(table_manager.can_join(table_id, caller, caller), 'Challenger not admitted');
            assert(table_manager.can_join(table_id, challenged, challenged), 'Challenged not admitted');

            assert(utils::duelist_exist(world, caller), 'Challenger not registered');
            assert(caller != challenged, 'Challenging thyself, you fool!');
            assert(self.has_pact(caller, challenged) == false, 'Duplicated challenge');
            // if (challenged != utils::zero_address()) {
            //     assert(utils::duelist_exist(world, caller), 'Challenged is not registered');
            // }

            // create duel id
            // let duel_id: u32 = world.uuid();
            let duel_id: u128 = make_seed(caller);

            // calc expiration
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_seconds == 0) { 0 } else { timestamp_start + expire_seconds };

            let challenge = Challenge {
                duel_id,
                duelist_a: caller,
                duelist_b: challenged,
                message,
                table_id,
                // progress
                state: ChallengeState::Awaiting.into(),
                round_number: 0,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };

            // setup wager + fees
            let table: TTable = table_manager.get(table_id);
            assert(table.is_open == true, 'Table is closed');
            assert(wager_value >= table.wager_min, 'Minimum wager not met');
            let fee: u256 = table.calc_fee(wager_value);
            // calc fee and store
            if (fee > 0 || wager_value > 0) {
                assert(table.contract_address != utils::zero_address(), 'No wager on this table');
                let wager = Wager {
                    duel_id,
                    value: wager_value,
                    fee,
                };
                set!(world, (wager));

                // transfer wager/fee from Challenger to the contract
                utils::deposit_wager_fees(world, challenge, challenge.duelist_a, starknet::get_contract_address());
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
            duel_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            let mut challenge: Challenge = get!(world, duel_id, Challenge);
            let state: ChallengeState = challenge.state.try_into().unwrap();
            assert(state.exists(), 'Challenge do not exist');
            assert(state == ChallengeState::Awaiting, 'Challenge is not Awaiting');

            let caller: ContractAddress = starknet::get_caller_address();
            let contract: ContractAddress = starknet::get_contract_address();
            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_end > 0 && timestamp > challenge.timestamp_end) {
                challenge.state = ChallengeState::Expired.into();
                challenge.timestamp_end = timestamp;
            } else if (caller == challenge.duelist_a) {
                // Challenger is Withdrawing
                assert(accepted == false, 'Cannot accept own challenge');
                challenge.state = ChallengeState::Withdrawn.into();
                challenge.timestamp_end = timestamp;
            } else {
                assert(caller == challenge.duelist_b, 'Not the Challenged');
                assert(utils::duelist_exist(world, caller), 'Challenged not registered');
                if (accepted) {
                    // Challenged is accepting
                    challenge.state = ChallengeState::InProgress.into();
                    challenge.round_number = 1;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                    // create Duelists snapshots for this Challenge
                    utils::create_challenge_snapshot(world, challenge);
                    // transfer wager/fee from Challenged to the contract
                    utils::deposit_wager_fees(world, challenge, challenge.duelist_b, contract);
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
            duel_id: u128,
            round_number: u8,
            hash: u64,
        ) {
            shooter::commit_action(world, duel_id, round_number, hash);
        }

        fn reveal_action(ref world: IWorldDispatcher,
            duel_id: u128,
            round_number: u8,
            salt: u64,
            action_slot1: u8,
            action_slot2: u8,
        ) {
            let challenge: Challenge = shooter::reveal_action(world, duel_id, round_number, salt, utils::pack_action_slots(action_slot1, action_slot2));

            self._emitPostRevealEvents(challenge);
        }



        //------------------------------------
        // read-only calls
        //

        fn get_pact(world: @IWorldDispatcher, duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128 {
            let pair: u128 = utils::make_pact_pair(duelist_a, duelist_b);
            (get!(world, pair, Pact).duel_id)
        }

        fn has_pact(duelist_a: ContractAddress, duelist_b: ContractAddress) -> bool {
            (self.get_pact(duelist_a, duelist_b) != 0)
        }

        fn calc_fee(world: @IWorldDispatcher, table_id: felt252, wager_value: u256) -> u256 {
            let table_manager = TableManagerTrait::new(world);
            let table: TTable = table_manager.get(table_id);
            (table.calc_fee(wager_value))
        }

        fn simulate_chances(world: @IWorldDispatcher, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> SimulateChances {
            let (score_self, score_other): (Score, Score) = utils::get_snapshot_scores(world, duelist_address, duel_id);
            let health: u8 = utils::get_duelist_health(world, duelist_address, duel_id, round_number);
            let action_self: Action = action.into();
            let action_other: Action = action.into();
            // honour
            let (action_honour, duelist_honour): (i8, u8) = utils::simulate_honour_for_action(world, duelist_address, action_self);
            // crit
            let crit_chances: u8 = utils::calc_crit_chances(score_self, score_other, action_self, action_other, health);
            let crit_base_chance: u8 = action_self.crit_chance();
            let crit_bonus: u8 = utils::calc_crit_bonus(score_self);
            let crit_match_bonus: u8 = utils::calc_crit_match_bonus(score_self, action_self, action_other);
            let crit_trickster_penalty: u8 = utils::calc_crit_trickster_penalty(score_self, score_other);
            // hit
            let hit_chances: u8 = utils::calc_hit_chances(score_self, score_other, action_self, action_other, health);
            let hit_base_chance: u8 = action_self.hit_chance();
            let hit_bonus: u8 = utils::calc_hit_bonus(score_self);
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

        fn get_valid_packed_actions(round_number: u8) -> Array<u16> {
            (utils::get_valid_packed_actions(round_number))
        }
        fn pack_action_slots(slot1: u8, slot2: u8) -> u16 {
            (utils::pack_action_slots(slot1, slot2))
        }
        fn unpack_action_slots(packed: u16) -> (u8, u8) {
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
        fn _emitDuelistRegisteredEvent(ref world: IWorldDispatcher, duelist: Duelist, is_new: bool) {
            emit!(world, (Event::DuelistRegisteredEvent(events::DuelistRegisteredEvent {
                address: duelist.address,
                name: duelist.name,
                profile_pic: duelist.profile_pic,
                is_new,
            })));
        }
        fn _emitNewChallengeEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            emit!(world, (Event::NewChallengeEvent (events::NewChallengeEvent {
                duel_id: challenge.duel_id,
                duelist_a: challenge.duelist_a,
                duelist_b: challenge.duelist_b,
            })));
        }
        fn _emitChallengeAcceptedEvent(ref world: IWorldDispatcher, challenge: Challenge, accepted: bool) {
            emit!(world, (Event::ChallengeAcceptedEvent (events::ChallengeAcceptedEvent {
                duel_id: challenge.duel_id,
                duelist_a: challenge.duelist_a,
                duelist_b: challenge.duelist_b,
                accepted,
            })));
        }
        fn _emitPostRevealEvents(ref world: IWorldDispatcher, challenge: Challenge) {
            let state: ChallengeState = challenge.state.try_into().unwrap();
            if (state == ChallengeState::InProgress) {
                self._emitDuelistTurnEvent(challenge);
            } else if (state == ChallengeState::Resolved || state == ChallengeState::Draw) {
                self._emitChallengeResolvedEvent(challenge);
            }
        }
        fn _emitDuelistTurnEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            let address: ContractAddress = if (starknet::get_caller_address() == challenge.duelist_a)
                { (challenge.duelist_b) } else { (challenge.duelist_a) };
            emit!(world, (Event::DuelistTurnEvent(events::DuelistTurnEvent {
                duel_id: challenge.duel_id,
                round_number: challenge.round_number,
                address,
            })));
        }
        fn _emitChallengeResolvedEvent(ref world: IWorldDispatcher, challenge: Challenge) {
            let winner_address: ContractAddress = 
                if (challenge.winner == 1) { (challenge.duelist_a) }
                else if (challenge.winner == 2) { (challenge.duelist_b) }
                else { (utils::zero_address()) };
            emit!(world, (Event::ChallengeResolvedEvent(events::ChallengeResolvedEvent {
                duel_id: challenge.duel_id,
                winner_address,
            })));
        }
    }
}
