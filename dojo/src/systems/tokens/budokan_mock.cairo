use starknet::{ContractAddress};

// based on: tournaments::presets::tournament::{ITournament};
use tournaments::components::models::tournament::{Registration};
// use tournaments::components::models::schedule::{Phase};

pub mod PLAYERS {
    pub struct TestPlayer {
        pub pass_id: u64,
        pub entry_number: u8,
        pub address: starknet::ContractAddress,
        pub duelist_id: u128,
    }
    #[generate_trait]
    impl TestPlayerImpl of TestPlayerTrait {
        fn new(pass_id: u64, entry_number: u8, address: starknet::ContractAddress, duelist_id: u128) -> TestPlayer {(TestPlayer {
            pass_id,
            entry_number,
            address,
            duelist_id,
        })}
    }
    pub fn PZERO() -> TestPlayer {(TestPlayerTrait::new(0, 0, 0x0.try_into().unwrap(), 0x0))}
    pub fn P1()  -> TestPlayer {(TestPlayerTrait::new(1, 1, 0xa0001.try_into().unwrap(), 0xd0001))}
    pub fn P2()  -> TestPlayer {(TestPlayerTrait::new(2, 2, 0xa0002.try_into().unwrap(), 0xd0002))}
    pub fn P3()  -> TestPlayer {(TestPlayerTrait::new(3, 3, 0xa0003.try_into().unwrap(), 0xd0003))}
    pub fn P4()  -> TestPlayer {(TestPlayerTrait::new(4, 6, 0xa0004.try_into().unwrap(), 0xd0004))}
    pub fn P5()  -> TestPlayer {(TestPlayerTrait::new(5, 4, 0xa0005.try_into().unwrap(), 0xd0005))}
    pub fn P6()  -> TestPlayer {(TestPlayerTrait::new(6, 5, 0xa0006.try_into().unwrap(), 0xd0006))}
    pub fn P7()  -> TestPlayer {(TestPlayerTrait::new(7, 7, 0xa0007.try_into().unwrap(), 0xd0007))}
    pub fn P8()  -> TestPlayer {(TestPlayerTrait::new(8, 8, 0xa0008.try_into().unwrap(), 0xd0008))}
    pub fn P9()  -> TestPlayer {(TestPlayerTrait::new(9, 9, 0xa0009.try_into().unwrap(), 0xd0009))}
    pub fn P10() -> TestPlayer {(TestPlayerTrait::new(10, 10, 0xa000a.try_into().unwrap(), 0xd000a))}
    pub fn P11() -> TestPlayer {(TestPlayerTrait::new(11, 11, 0xa000b.try_into().unwrap(), 0xd000b))}
    pub fn P12() -> TestPlayer {(TestPlayerTrait::new(12, 12, 0xa000c.try_into().unwrap(), 0xd000c))}
    pub fn P13() -> TestPlayer {(TestPlayerTrait::new(13, 13, 0xa000d.try_into().unwrap(), 0xd000d))}
    pub fn P14() -> TestPlayer {(TestPlayerTrait::new(14, 14, 0xa000e.try_into().unwrap(), 0xd000e))}
    pub fn P15() -> TestPlayer {(TestPlayerTrait::new(15, 15, 0xa000f.try_into().unwrap(), 0xd000f))}
    pub fn P16() -> TestPlayer {(TestPlayerTrait::new(16, 16, 0xa0010.try_into().unwrap(), 0xd0010))}
    pub fn P17() -> TestPlayer {(TestPlayerTrait::new(17, 17, 0xa0011.try_into().unwrap(), 0xd0011))}
    pub fn P18() -> TestPlayer {(TestPlayerTrait::new(18, 18, 0xa0012.try_into().unwrap(), 0xd0012))}
    pub fn P19() -> TestPlayer {(TestPlayerTrait::new(19, 19, 0xa0013.try_into().unwrap(), 0xd0013))}
    pub fn P20() -> TestPlayer {(TestPlayerTrait::new(20, 20, 0xa0014.try_into().unwrap(), 0xd0014))}
    pub fn P21() -> TestPlayer {(TestPlayerTrait::new(21, 21, 0xa0015.try_into().unwrap(), 0xd0015))}
    pub fn P22() -> TestPlayer {(TestPlayerTrait::new(22, 22, 0xa0016.try_into().unwrap(), 0xd0016))}
    pub fn P23() -> TestPlayer {(TestPlayerTrait::new(23, 23, 0xa0017.try_into().unwrap(), 0xd0017))}
    pub fn P24() -> TestPlayer {(TestPlayerTrait::new(24, 24, 0xa0018.try_into().unwrap(), 0xd0018))}
    pub fn P25() -> TestPlayer {(TestPlayerTrait::new(25, 25, 0xa0019.try_into().unwrap(), 0xd0019))}
    pub fn P26() -> TestPlayer {(TestPlayerTrait::new(26, 26, 0xa001a.try_into().unwrap(), 0xd001a))}
    pub fn P27() -> TestPlayer {(TestPlayerTrait::new(27, 27, 0xa001b.try_into().unwrap(), 0xd001b))}
    pub fn P28() -> TestPlayer {(TestPlayerTrait::new(28, 28, 0xa001c.try_into().unwrap(), 0xd001c))}
    pub fn P29() -> TestPlayer {(TestPlayerTrait::new(29, 29, 0xa001d.try_into().unwrap(), 0xd001d))}
    pub fn P30() -> TestPlayer {(TestPlayerTrait::new(30, 30, 0xa001e.try_into().unwrap(), 0xd001e))}
    pub fn P31() -> TestPlayer {(TestPlayerTrait::new(31, 31, 0xa001f.try_into().unwrap(), 0xd001f))}
    pub fn P32() -> TestPlayer {(TestPlayerTrait::new(32, 32, 0xa0020.try_into().unwrap(), 0xd0020))}
    pub fn from_duelist_id(duelist_id: u128) -> TestPlayer {
        if (duelist_id == P1().duelist_id) {(P1())}
        else if (duelist_id == P2().duelist_id) {(P2())}
        else if (duelist_id == P3().duelist_id) {(P3())}
        else if (duelist_id == P4().duelist_id) {(P4())}
        else if (duelist_id == P5().duelist_id) {(P5())}
        else if (duelist_id == P6().duelist_id) {(P6())}
        else if (duelist_id == P7().duelist_id) {(P7())}
        else if (duelist_id == P8().duelist_id) {(P8())}
        else if (duelist_id == P9().duelist_id) {(P9())}
        else if (duelist_id == P10().duelist_id) {(P10())}
        else if (duelist_id == P11().duelist_id) {(P11())}
        else if (duelist_id == P12().duelist_id) {(P12())}
        else if (duelist_id == P13().duelist_id) {(P13())}
        else if (duelist_id == P14().duelist_id) {(P14())}
        else if (duelist_id == P15().duelist_id) {(P15())}
        else if (duelist_id == P16().duelist_id) {(P16())}
        else if (duelist_id == P17().duelist_id) {(P17())}
        else if (duelist_id == P18().duelist_id) {(P18())}
        else if (duelist_id == P19().duelist_id) {(P19())}
        else if (duelist_id == P20().duelist_id) {(P20())}
        else if (duelist_id == P21().duelist_id) {(P21())}
        else if (duelist_id == P22().duelist_id) {(P22())}
        else if (duelist_id == P23().duelist_id) {(P23())}
        else if (duelist_id == P24().duelist_id) {(P24())}
        else if (duelist_id == P25().duelist_id) {(P25())}
        else if (duelist_id == P26().duelist_id) {(P26())}
        else if (duelist_id == P27().duelist_id) {(P27())}
        else if (duelist_id == P28().duelist_id) {(P28())}
        else if (duelist_id == P29().duelist_id) {(P29())}
        else if (duelist_id == P30().duelist_id) {(P30())}
        else if (duelist_id == P31().duelist_id) {(P31())}
        else if (duelist_id == P32().duelist_id) {(P32())}
        else {(PZERO())}
    }
    pub fn from_pass_id(pass_id: u64) -> TestPlayer {
        if (pass_id == P1().pass_id) {(P1())}
        else if (pass_id == P2().pass_id) {(P2())}
        else if (pass_id == P3().pass_id) {(P3())}
        else if (pass_id == P4().pass_id) {(P4())}
        else if (pass_id == P5().pass_id) {(P5())}
        else if (pass_id == P6().pass_id) {(P6())}
        else if (pass_id == P7().pass_id) {(P7())}
        else if (pass_id == P8().pass_id) {(P8())}
        else if (pass_id == P9().pass_id) {(P9())}
        else if (pass_id == P10().pass_id) {(P10())}
        else if (pass_id == P11().pass_id) {(P11())}
        else if (pass_id == P12().pass_id) {(P12())}
        else if (pass_id == P13().pass_id) {(P13())}
        else if (pass_id == P14().pass_id) {(P14())}
        else if (pass_id == P15().pass_id) {(P15())}
        else if (pass_id == P16().pass_id) {(P16())}
        else if (pass_id == P17().pass_id) {(P17())}
        else if (pass_id == P18().pass_id) {(P18())}
        else if (pass_id == P19().pass_id) {(P19())}
        else if (pass_id == P20().pass_id) {(P20())}
        else if (pass_id == P21().pass_id) {(P21())}
        else if (pass_id == P22().pass_id) {(P22())}
        else if (pass_id == P23().pass_id) {(P23())}
        else if (pass_id == P24().pass_id) {(P24())}
        else if (pass_id == P25().pass_id) {(P25())}
        else if (pass_id == P26().pass_id) {(P26())}
        else if (pass_id == P27().pass_id) {(P27())}
        else if (pass_id == P28().pass_id) {(P28())}
        else if (pass_id == P29().pass_id) {(P29())}
        else if (pass_id == P30().pass_id) {(P30())}
        else if (pass_id == P31().pass_id) {(P31())}
        else if (pass_id == P32().pass_id) {(P32())}
        else {(PZERO())}
    }
}


#[starknet::interface]
pub trait IBudokanMock<TState> {
    // fn current_phase(self: @TState, tournament_id: u64) -> Phase;
    fn get_registration(self: @TState, game_address: ContractAddress, token_id: u64) -> Registration;
    fn get_tournament_id_for_token_id(self: @TState, game_address: ContractAddress, token_id: u64) -> u64;
    fn tournament_entries(self: @TState, tournament_id: u64) -> u32;

    // mock helpers
    fn set_tournament_id(ref self: TState, tournament_id: u64);
    fn set_settings_id(ref self: TState, settings_id: u32);
    fn get_tournament_id(self: @TState) -> u64;
    fn get_settings_id(self: @TState) -> u32;
}

#[dojo::contract]
pub mod budokan_mock {
    use core::num::traits::Zero;
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo::model::{ModelStorage};

    use tournaments::components::models::tournament::{Registration};
    // use tournaments::components::models::schedule::{Phase};

    use super::{PLAYERS};
    use pistols::models::tournament::{
        TournamentType, TournamentTypeTrait,
    };
    use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
    // use pistols::utils::address::{ZERO};

    pub const TOURNAMENT_OF_1: u64 = 1001;   // 1 entry
    pub const TOURNAMENT_OF_2: u64 = 1002;   // 2 entries
    pub const TOURNAMENT_OF_3: u64 = 1003;   // 3 entries
    // pub const TOURNAMENT_OF_4: u64 = 1004;   // 4 entries
    pub const TOURNAMENT_OF_5: u64 = 1005;   // 5 entries
    pub const TOURNAMENT_OF_6: u64 = 1006;   // 6 entries
    // pub const TOURNAMENT_OF_7: u64 = 1007;   // 7 entries

    fn dojo_init(ref self: ContractState) {
        self.set_tournament_id(TOURNAMENT_OF_2);
        self.set_settings_id(TournamentType::LastManStanding.rules().settings_id);
    }

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
            // let mut world = self.world_default();
            // stored tournament
            let mut tournament_id: u64 = self.get_tournament_id();
            // entry number
            let entry_number: u32 = PLAYERS::from_pass_id(token_id).entry_number.into();
// println!("___get_registration({}): t[{}], e[{}]", token_id, tournament_id, entry_number);
            (Registration {
                game_address,
                game_token_id: token_id,
                tournament_id,
                entry_number: if (entry_number.is_non_zero()) {entry_number} else {token_id.try_into().unwrap()},
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
            ((tournament_id % 1000).try_into().unwrap())
        }

        //-----------------------------------
        // Mock Helpers
        //

        fn set_tournament_id(ref self: ContractState, tournament_id: u64) {
            let mut world = self.world_default();
            world.write_model(
                @MockedValueTrait::new(
                    'tournament_id',
                    tournament_id.into(),
                )
            );
        }
        fn set_settings_id(ref self: ContractState, settings_id: u32) {
            let mut world = self.world_default();
            world.write_model(
                @MockedValueTrait::new(
                    'settings_id',
                    settings_id.into(),
                )
            );
        }

        fn get_tournament_id(self: @ContractState) -> u64 {
            let mut world = self.world_default();
            // tournament (stored or default)
            let mocked: MockedValue = world.read_model('tournament_id');
            (mocked.value.try_into().unwrap())
        }
        fn get_settings_id(self: @ContractState) -> u32 {
            let mut world = self.world_default();
            // tournament (stored or default)
            let mocked: MockedValue = world.read_model('settings_id');
            (mocked.value.try_into().unwrap())
        }
    }

}
