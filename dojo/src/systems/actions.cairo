use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// define the interface
#[starknet::interface]
trait IActions<TContractState> {
    fn register_duelist(self: @TContractState,
        name: felt252,
    );
    // read-only calls
    // fn can_play_level(self: @TContractState,
    //     location_id: u128,
    // ) -> bool;
}

#[dojo::contract]
mod actions {
    use super::IActions;
    use traits::{Into, TryInto};
    use core::option::OptionTrait;
    use starknet::{ContractAddress, ClassHash};

    use pistols::models::models::{Duelist, Duel};

    // impl: implement functions specified in trait
    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {
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
