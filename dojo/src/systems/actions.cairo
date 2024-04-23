use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::types::challenge::{ChallengeState};

// define the interface
#[starknet::interface]
trait IActions<TContractState> {
    //
    // Duelists
    fn register_duelist(self: @TContractState,
        name: felt252,
        profile_pic: u8,
    );

    //
    // Challenge
    fn create_challenge(self: @TContractState,
        challenged: ContractAddress,
        message: felt252,
        wager_coin: u8,
        wager_value: u256,
        expire_seconds: u64,
    ) -> u128;
    fn reply_challenge(self: @TContractState,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState;

    //
    // Duel
    fn commit_action(self: @TContractState,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    );
    fn reveal_action(self: @TContractState,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        action_slot1: u8,
        action_slot2: u8,
    );

    //
    // read-only calls
    fn get_pact(self: @TContractState, duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128;
    fn has_pact(self: @TContractState, duelist_a: ContractAddress, duelist_b: ContractAddress) -> bool;

    fn calc_fee(self: @TContractState, wager_coin: u8, wager_value: u256) -> u256;

    fn calc_hit_bonus(self: @TContractState, duelist_address: ContractAddress) -> u8;
    fn calc_hit_penalty(self: @TContractState, health: u8) -> u8;

    fn calc_hit_chances(self: @TContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8;
    fn calc_crit_chances(self: @TContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8;
    fn calc_glance_chances(self: @TContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8;
    fn calc_honour_for_action(self: @TContractState, duelist_address: ContractAddress, action: u8) -> (u8, u8);

    fn get_valid_packed_actions(self: @TContractState, round_number: u8) -> Array<u16>;
    fn pack_action_slots(self: @TContractState, slot1: u8, slot2: u8) -> u16;
    fn unpack_action_slots(self: @TContractState, packed: u16) -> (u8, u8);
}

#[dojo::contract]
mod actions {
    use debug::PrintTrait;
    use super::IActions;
    use traits::{Into, TryInto};
    use starknet::{ContractAddress, get_block_timestamp, get_block_info};

    use pistols::models::models::{Duelist, Challenge, Wager, Pact, Round, Shot};
    use pistols::models::config::{Config, ConfigManager, ConfigManagerTrait};
    use pistols::models::coins::{Coin, CoinManager, CoinManagerTrait, CoinTrait, coins, ETH_TO_WEI};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::types::round::{RoundState, RoundStateTrait};
    use pistols::utils::timestamp::{timestamp};
    use pistols::systems::seeder::{make_seed};
    use pistols::systems::shooter::{shooter};
    use pistols::systems::{utils};
    use pistols::types::constants::{constants};
    use pistols::types::{events};

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        NewChallengeEvent: events::NewChallengeEvent,
        ChallengeAcceptedEvent: events::ChallengeAcceptedEvent,
        DuelistTurnEvent: events::DuelistTurnEvent,
    }

    // impl: implement functions specified in trait
    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {

        //------------------------
        // Duelists
        //
        fn register_duelist(self: @ContractState,
            name: felt252,
            profile_pic: u8,
        ) {
            let caller: ContractAddress = starknet::get_caller_address();

            let mut duelist: Duelist = get!(self.world(), caller, Duelist);
            // 1st time setup
            if (duelist.timestamp == 0) {
                duelist.timestamp = get_block_timestamp();
            }
            // update
            duelist.name = name;
            duelist.profile_pic = profile_pic;

            set!(self.world(), (duelist));
            return ();
        }

        //------------------------
        // NEW Challenge
        //
        fn create_challenge(self: @ContractState,
            challenged: ContractAddress,
            message: felt252,
            wager_coin: u8,
            wager_value: u256,
            expire_seconds: u64,
        ) -> u128 {
            assert(ConfigManagerTrait::is_initialized(self.world()) == true, 'Not initialized');

            assert(challenged != utils::zero_address(), 'Missing challenged address');
            assert(expire_seconds == 0 || expire_seconds >= timestamp::from_hours(1), 'Invalid expire_seconds');

            let caller: ContractAddress = starknet::get_caller_address();
            assert(utils::duelist_exist(self.world(), caller), 'Challenger not registered');
            assert(caller != challenged, 'Challenging thyself, you fool!');
            assert(self.has_pact(caller, challenged) == false, 'Duplicated challenge');
            // if (challenged != utils::zero_address()) {
            //     assert(utils::duelist_exist(self.world(), caller), 'Challenged is not registered');
            // }

            // create duel id
            // let duel_id: u32 = self.world().uuid();
            let duel_id: u128 = make_seed(caller);

            // setup wager + fees
            let coin_manager = CoinManagerTrait::new(self.world());
            let coin: Coin = coin_manager.get(wager_coin);
            assert(coin.enabled == true, 'Coin disabled');
            let fee: u256 = coin.calc_fee(wager_value);
            // calc fee and store
            let wager = Wager {
                duel_id,
                coin: wager_coin,
                value: wager_value,
                fee,
            };
            set!(self.world(), (wager));

            // calc expiration
            let timestamp_start: u64 = get_block_timestamp();
            let timestamp_end: u64 = if (expire_seconds == 0) { 0 } else { timestamp_start + expire_seconds };

            let challenge = Challenge {
                duel_id,
                duelist_a: caller,
                duelist_b: challenged,
                message,
                // progress
                state: ChallengeState::Awaiting.into(),
                round_number: 0,
                winner: 0,
                // times
                timestamp_start,   // chalenge issued
                timestamp_end,     // expire
            };

            // transfer wager/fee from Challenger to the contract
            utils::deposit_wager_fees(self.world(), challenge.duelist_a, starknet::get_contract_address(), duel_id);

            utils::set_challenge(self.world(), challenge);

            emit!(self.world(), events::NewChallengeEvent {
                duel_id,
                duelist_a: challenge.duelist_a,
                duelist_b: challenge.duelist_b,
            });

            (duel_id)
        }

        //------------------------
        // REPLY Challenge
        //
        fn reply_challenge(self: @ContractState,
            duel_id: u128,
            accepted: bool,
        ) -> ChallengeState {
            let mut challenge: Challenge = get!(self.world(), duel_id, Challenge);
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
                assert(utils::duelist_exist(self.world(), caller), 'Challenged not registered');
                if (accepted) {
                    // Challenged is accepting
                    challenge.state = ChallengeState::InProgress.into();
                    challenge.round_number = 1;
                    challenge.timestamp_start = timestamp;
                    challenge.timestamp_end = 0;
                    // transfer wager/fee from Challenged to the contract
                    utils::deposit_wager_fees(self.world(), challenge.duelist_b, contract, duel_id);
                } else {
                    // Challenged is Refusing
                    challenge.state = ChallengeState::Refused.into();
                    challenge.timestamp_end = timestamp;
                }

                emit!(self.world(), events::ChallengeAcceptedEvent {
                    duel_id,
                    duelist_a: challenge.duelist_a,
                    duelist_b: challenge.duelist_b,
                    accepted,
                });
            }

            // update challenge state
            utils::set_challenge(self.world(), challenge);

            (challenge.state.try_into().unwrap())
        }


        //------------------------
        // COMMIT Duel action
        //

        fn commit_action(self: @ContractState,
            duel_id: u128,
            round_number: u8,
            hash: u64,
        ) {
            shooter::commit_action(self.world(), duel_id, round_number, hash);
        }

        fn reveal_action(self: @ContractState,
            duel_id: u128,
            round_number: u8,
            salt: u64,
            action_slot1: u8,
            action_slot2: u8,
        ) {
            let challenge: Challenge = shooter::reveal_action(self.world(), duel_id, round_number, salt, utils::pack_action_slots(action_slot1, action_slot2));

            let state: ChallengeState = challenge.state.try_into().unwrap();
            if (challenge.round_number > round_number && state == ChallengeState::InProgress) {
                let duelist_address: ContractAddress = if (starknet::get_caller_address() == challenge.duelist_a) {
                    (challenge.duelist_b)
                } else {
                    (challenge.duelist_a)
                };
                emit!(self.world(), events::DuelistTurnEvent {
                    duel_id: challenge.duel_id,
                    duelist_address,
                    round_number: challenge.round_number,
                });
            }
        }



        //------------------------------------
        // read-only calls
        //

        fn get_pact(self: @ContractState, duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128 {
            let pair: u128 = utils::make_pact_pair(duelist_a, duelist_b);
            (get!(self.world(), pair, Pact).duel_id)
        }

        fn has_pact(self: @ContractState, duelist_a: ContractAddress, duelist_b: ContractAddress) -> bool {
            (self.get_pact(duelist_a, duelist_b) != 0)
        }

        fn calc_fee(self: @ContractState, wager_coin: u8, wager_value: u256) -> u256 {
            let coin_manager = CoinManagerTrait::new(self.world());
            let coin: Coin = coin_manager.get(wager_coin);
            (coin.calc_fee(wager_value))
        }

        fn calc_hit_bonus(self: @ContractState, duelist_address: ContractAddress) -> u8 {
            (utils::calc_hit_bonus(self.world(), duelist_address))
        }
        fn calc_hit_penalty(self: @ContractState, health: u8) -> u8 {
            (utils::calc_hit_penalty(self.world(), health))
        }

        fn calc_hit_chances(self: @ContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8 {
            let health: u8 = utils::get_duelist_health(self.world(), duelist_address, duel_id, round_number);
            (utils::calc_hit_chances(self.world(), duelist_address, action.into(), health))
        }
        fn calc_crit_chances(self: @ContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8 {
            let health: u8 = utils::get_duelist_health(self.world(), duelist_address, duel_id, round_number);
            (utils::calc_crit_chances(self.world(), duelist_address, action.into(), health))
        }
        fn calc_glance_chances(self: @ContractState, duelist_address: ContractAddress, duel_id: u128, round_number: u8, action: u8) -> u8 {
            let health: u8 = utils::get_duelist_health(self.world(), duelist_address, duel_id, round_number);
            (utils::calc_glance_chances(self.world(), duelist_address, action.into(), health))
        }
        fn calc_honour_for_action(self: @ContractState, duelist_address: ContractAddress, action: u8) -> (u8, u8) {
            (utils::calc_honour_for_action(self.world(), duelist_address, action.into()))
        }

        fn get_valid_packed_actions(self: @ContractState, round_number: u8) -> Array<u16> {
            (utils::get_valid_packed_actions(round_number))
        }
        fn pack_action_slots(self: @ContractState, slot1: u8, slot2: u8) -> u16 {
            (utils::pack_action_slots(slot1, slot2))
        }
        fn unpack_action_slots(self: @ContractState, packed: u16) -> (u8, u8) {
            (utils::unpack_action_slots(packed))
        }
    }
}
