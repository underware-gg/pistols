use starknet::{ContractAddress};

// based on: tournaments::presets::tournament::{ITournament};
use tournaments::components::models::tournament::{Registration};
// use tournaments::components::models::schedule::{Phase};

#[starknet::interface]
pub trait IBudokanMock<TState> {
    // fn current_phase(self: @TState, tournament_id: u64) -> Phase;
    fn get_registration(self: @TState, game_address: ContractAddress, token_id: u64) -> Registration;
    fn get_tournament_id_for_token_id(self: @TState, game_address: ContractAddress, token_id: u64) -> u64;

    // mock helpers
    // fn mint_entry(ref self: TState, tournament_id: u64, recipient: ContractAddress) -> u64;
}

#[dojo::contract]
pub mod budokan_mock {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage};

    use tournaments::components::models::tournament::{Registration};
    // use tournaments::components::models::schedule::{Phase};
    // use pistols::utils::misc::{ZERO};

    use pistols::tests::test_tournament::{
        TOURNAMENT_ID_1,
        // SETTINGS_ID,
    };

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl BudokanMockImpl of super::IBudokanMock<ContractState> {

        // fn current_phase(self: @ContractState, tournament_id: u64) -> Phase {
        //     // (Phase::Scheduled)
        //     (Phase::Registration)
        //     // (Phase::Staging)
        //     // (Phase::Live)
        //     // (Phase::Submission)
        //     // (Phase::Finalized)
        // }

        fn get_registration(self: @ContractState,
            game_address: ContractAddress,
            token_id: u64,
        ) -> Registration {
            (Registration {
                game_address: game_address,
                game_token_id: token_id,
                tournament_id: TOURNAMENT_ID_1,
                entry_number: token_id.try_into().unwrap(),
                has_submitted: false,
            })
        }
        fn get_tournament_id_for_token_id(self: @ContractState,
            game_address: ContractAddress,
            token_id: u64,
        ) -> u64 {
            (self.get_registration(game_address, token_id).tournament_id)
        }

    }

}
