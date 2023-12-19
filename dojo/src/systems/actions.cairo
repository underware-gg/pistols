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
    use starknet::{ContractAddress, ClassHash, get_block_timestamp};
    use pistols::models::models::{Duelist, Challenge};
    use pistols::systems::seeder::{make_seed};
    use pistols::systems::utils::{zero_address, duelist_exist};
    use pistols::utils::timestamp::{days_to_timestamp};
    use pistols::types::challenge::{ChallengeState};

    // impl: implement functions specified in trait
    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {
        //
        // Duelists
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

        //
        // Challenge
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
                    state: ChallengeState::Challenged,
                    duelist_a: caller,
                    duelist_b: challenged,
                    timestamp,
                    timestamp_expire,
                    message,
                    pass_code,
                }
            ));

            (duel_id)
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
