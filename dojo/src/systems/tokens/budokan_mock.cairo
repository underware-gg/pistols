use starknet::{ContractAddress};

    // based on:
// use tournaments::presets::tournament::{ITournament};
use tournaments::components::models::tournament::{Registration};
use tournaments::components::models::schedule::{Phase};

#[starknet::interface]
pub trait IBudokanMock<TState> {
    fn get_registration(
        self: @TState, game_address: ContractAddress, token_id: u64,
    ) -> Registration;
    fn current_phase(self: @TState, tournament_id: u64) -> Phase;
    fn get_tournament_id_for_token_id(
        self: @TState, game_address: ContractAddress, token_id: u64,
    ) -> u64;

    // mock helpers
    fn mint_entry(ref self: TState, tournament_id: u64, recipient: ContractAddress) -> u64;
}

#[dojo::contract]
pub mod budokan_mock {
    // use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    // use dojo::model::{ModelStorage};

    use tournaments::components::models::tournament::{Registration};
    use tournaments::components::models::schedule::{Phase};
    // use pistols::utils::misc::{ZERO};

    #[generate_trait]
    impl WorldDefaultImpl of WorldDefaultTrait {
        #[inline(always)]
        fn world_default(self: @ContractState) -> WorldStorage {
            (self.world(@"pistols"))
        }
    }

    #[abi(embed_v0)]
    impl BudokanMockImpl of super::IBudokanMock<ContractState> {

        fn get_registration(
            self: @ContractState, game_address: ContractAddress, token_id: u64,
        ) -> Registration {
            (Registration {
                game_address: game_address,
                game_token_id: token_id,
                tournament_id: 0,
                entry_number: 0,
                has_submitted: false,
            })
        }
        fn current_phase(self: @ContractState, tournament_id: u64) -> Phase {
            // (Phase::Scheduled)
            (Phase::Registration)
            // (Phase::Staging)
            // (Phase::Live)
            // (Phase::Submission)
            // (Phase::Finalized)
        }
        fn get_tournament_id_for_token_id(
            self: @ContractState, game_address: ContractAddress, token_id: u64,
        ) -> u64 {
            (0)
        }

        fn mint_entry(ref self: ContractState, tournament_id: u64, recipient: ContractAddress) -> u64 {
            (0)
        }
    }

}
