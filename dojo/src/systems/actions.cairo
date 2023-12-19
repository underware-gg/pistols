use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// define the interface
#[starknet::interface]
trait IActions<TContractState> {
    //
    // Duelists
    fn register_duelist(self: @TContractState,
        name: felt252,
    );

    //
    // Challenge
    fn create_challenge(self: @TContractState,
        challenged: ContractAddress,
        pass_code: felt252,
        message: felt252,
        expire_seconds: u64,
    ) -> u128;
    fn reply_challenge(self: @TContractState,
        duel_id: u128,
        accepted: bool,
    );

    // read-only calls
    // fn can_play_level(self: @TContractState,
    //     location_id: u128,
    // ) -> bool;
}

#[dojo::contract]
mod actions {
    use debug::PrintTrait;
    use super::IActions;
    use traits::{Into, TryInto};
    use core::option::OptionTrait;
    use starknet::{ContractAddress, ClassHash, get_block_timestamp, get_block_info};
    use pistols::models::models::{Duelist, Challenge, Round};
    use pistols::systems::seeder::{make_seed};
    use pistols::systems::utils::{zero_address, duelist_exist};
    use pistols::utils::timestamp::{days_to_timestamp};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};

    // impl: implement functions specified in trait
    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {
        //------------------------
        // Duelists
        //
        fn register_duelist(self: @ContractState,
            name: felt252,
        ) {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();
            set!(world, (
                Duelist {
                    address: caller,
                    name,
                }
            ));
            return ();
        }

        //------------------------
        // Challenge
        //
        fn create_challenge(self: @ContractState,
            challenged: ContractAddress,
            pass_code: felt252,
            message: felt252,
            expire_seconds: u64,
        ) -> u128 {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();

            // assert(challenged != zero_address() || pass_code != 0, 'Challenge a player or pass_code');
            assert(challenged != zero_address() || pass_code != 0, 'Missing challenged address');
            assert(expire_seconds == 0 || expire_seconds > days_to_timestamp(1), 'Invalid expire_seconds');

            assert(duelist_exist(world, caller), 'Challenger is not registered');
            // if (challenged != zero_address()) {
            //     assert(duelist_exist(world, caller), 'Challenged is not registered');
            // }

            // let duel_id: u32 = world.uuid();
            let duel_id: u128 = make_seed(caller);
            let timestamp: u64 = get_block_timestamp();
            let timestamp_expire: u64 = if (expire_seconds == 0) { 0 } else { timestamp + expire_seconds };

            set!(world, (
                Challenge {
                    duel_id,
                    state: ChallengeState::Awaiting,
                    duelist_a: caller,
                    duelist_b: challenged,
                    message,
                    pass_code,
                    // progress
                    round: 0,
                    winner: zero_address(),
                    // times
                    timestamp,
                    timestamp_expire,
                    timestamp_start: 0,
                    timestamp_end: 0,
                }
            ));

            (duel_id)
        }

        //------------------------
        //
        fn reply_challenge(self: @ContractState,
            duel_id: u128,
            accepted: bool,
        ) {
            let world: IWorldDispatcher = self.world_dispatcher.read();
            let caller: ContractAddress = starknet::get_caller_address();

            let mut challenge: Challenge = get!(world, duel_id, Challenge);
            assert(challenge.state.exists(), 'Challenge do not exist');
            assert(challenge.state == ChallengeState::Awaiting, 'Challenge is not Awaiting');

            let timestamp: u64 = get_block_timestamp();

            if (challenge.timestamp_expire > 0 && timestamp > challenge.timestamp_expire) {
                challenge.state = ChallengeState::Expired;
            } else if (caller == challenge.duelist_a) {
                assert(accepted == false, 'Cannot accept own challenge');
                challenge.state = ChallengeState::Canceled;
                challenge.timestamp_end = timestamp;
            } else {
                assert(caller == challenge.duelist_b, 'Not the Challenged');
                if (!accepted) {
                    challenge.state = ChallengeState::Refused;
                    challenge.timestamp_end = timestamp;
                } else {
                    challenge.state = ChallengeState::InProgress;
                    challenge.round = 1;
                    challenge.timestamp_start = timestamp;
                }
            }

            // update challenge state
            set!(world, (challenge));

            // Create 1st round
            if (accepted) {
                set!(world, (
                    Round {
                        duel_id,
                        round: 1,
                        move_a: 0,
                        move_b: 0,
                        health_a: 100,
                        health_b: 100,
                    }
                ));
            }

            ()
        }

        //
        // read-only calls
        //

        // fn can_play_level(self: @ContractState,
        //     location_id: u128,
        // ) -> bool {
        //     let world: IWorldDispatcher = self.world_dispatcher.read();
        //     (can_generate_chamber(world, caller, location_id))
        // }

    }
}
