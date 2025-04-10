use starknet::{ContractAddress};

// based on: tournaments::presets::tournament::{ITournament};
use tournaments::components::models::tournament::{Registration};
// use tournaments::components::models::schedule::{Phase};

#[starknet::interface]
pub trait IBudokanMock<TState> {
    // fn current_phase(self: @TState, tournament_id: u64) -> Phase;
    fn get_registration(self: @TState, game_address: ContractAddress, token_id: u64) -> Registration;
    fn get_tournament_id_for_token_id(self: @TState, game_address: ContractAddress, token_id: u64) -> u64;
    fn tournament_entries(self: @TState, tournament_id: u64) -> u32;

    // mock helpers
    fn set_tournament_id(ref self: TState, tournament_id: u64);
}

#[dojo::contract]
pub mod budokan_mock {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage};

    use tournaments::components::models::tournament::{Registration};
    // use tournaments::components::models::schedule::{Phase};

    use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
    // use pistols::utils::misc::{ZERO};

    pub const TOURNAMENT_ID_1: u64 = 100;
    pub const TOURNAMENT_ID_2: u64 = 200;

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
            let mut world = self.world_default();
            let mocked: MockedValue = world.read_model('tournament_id');
            let tournament_id: u64 = mocked.value.try_into().unwrap();
            (Registration {
                game_address,
                game_token_id: token_id,
                tournament_id: if (tournament_id.is_non_zero()) {tournament_id} else {TOURNAMENT_ID_1},
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

        fn tournament_entries(self: @ContractState, tournament_id: u64) -> u32 {
            if (tournament_id == TOURNAMENT_ID_1) {(5)}
            else if (tournament_id == TOURNAMENT_ID_2) {(2)}
            else {(0)}
        }

        fn set_tournament_id(ref self: ContractState, tournament_id: u64) {
            let mut world = self.world_default();
            world.write_model(
                @MockedValueTrait::new(
                    'tournament_id',
                    tournament_id.into(),
                )
            );
        }
    }

}
