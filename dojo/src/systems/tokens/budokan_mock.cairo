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
    use pistols::tests::tester::tester::{PLAYER_1, PLAYER_2};
    // use pistols::utils::misc::{ZERO};

    pub const TOURNAMENT_ID_1: u64 = 100;
    pub const TOURNAMENT_ID_2: u64 = 200;
    pub const TOURNAMENT_ID_3: u64 = 300;
    pub const TOURNAMENT_ID_4: u64 = 400;
    pub const TOURNAMENT_ID_5: u64 = 500;
    pub const TOURNAMENT_ID_6: u64 = 600;
    pub const TOURNAMENT_ID_7: u64 = 700;

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
            // tournament (stored or default)
            let mocked: MockedValue = world.read_model('tournament_id');
            let mut tournament_id: u64 = mocked.value.try_into().unwrap();
            if (tournament_id.is_zero()) {
                tournament_id = TOURNAMENT_ID_2;
            }
            // entry number
            let entry_number: u32 =
                if (token_id.into() == PLAYER_1().duelist_id) {
                    (PLAYER_1().entry_number.into())
                } else if (token_id.into() == PLAYER_2().duelist_id) {
                    (PLAYER_2().entry_number.into())
                } else {
                    (token_id.try_into().unwrap())
                };
// println!("___get_registration({}): t[{}], e[{}]", token_id, tournament_id, entry_number);
            (Registration {
                game_address,
                game_token_id: token_id,
                tournament_id,
                entry_number,
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
            ((tournament_id / 100).try_into().unwrap())
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
