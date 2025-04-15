use starknet::{ContractAddress};

// based on: tournaments::presets::tournament::{ITournament};
use tournaments::components::models::tournament::{Registration};
// use tournaments::components::models::schedule::{Phase};

pub mod PLAYERS {
    pub struct TestPlayer {
        pub entry_id: u64,
        pub entry_number: u8,
        pub address: starknet::ContractAddress,
        pub duelist_id: u128,
    }
    #[generate_trait]
    impl TestPlayerImpl of TestPlayerTrait {
        fn new(entry_id: u64, entry_number: u8, address: starknet::ContractAddress, duelist_id: u128) -> TestPlayer {(TestPlayer {
            entry_id,
            entry_number,
            address,
            duelist_id,
        })}
    }
    pub fn PZERO() -> TestPlayer {(TestPlayerTrait::new(0, 0, starknet::contract_address_const::<0x0>(), 0x0))}
    pub fn P1()  -> TestPlayer {(TestPlayerTrait::new(1, 1, starknet::contract_address_const::<0xa0001>(), 0xd0001))}
    pub fn P2()  -> TestPlayer {(TestPlayerTrait::new(2, 2, starknet::contract_address_const::<0xa0002>(), 0xd0002))}
    pub fn P3()  -> TestPlayer {(TestPlayerTrait::new(3, 3, starknet::contract_address_const::<0xa0003>(), 0xd0003))}
    pub fn P4()  -> TestPlayer {(TestPlayerTrait::new(4, 4, starknet::contract_address_const::<0xa0004>(), 0xd0004))}
    pub fn P5()  -> TestPlayer {(TestPlayerTrait::new(5, 5, starknet::contract_address_const::<0xa0005>(), 0xd0005))}
    pub fn P6()  -> TestPlayer {(TestPlayerTrait::new(6, 6, starknet::contract_address_const::<0xa0006>(), 0xd0006))}
    pub fn P7()  -> TestPlayer {(TestPlayerTrait::new(7, 7, starknet::contract_address_const::<0xa0007>(), 0xd0007))}
    pub fn P8()  -> TestPlayer {(TestPlayerTrait::new(8, 8, starknet::contract_address_const::<0xa0008>(), 0xd0008))}
    pub fn P9()  -> TestPlayer {(TestPlayerTrait::new(9, 9, starknet::contract_address_const::<0xa0009>(), 0xd0009))}
    pub fn P10() -> TestPlayer {(TestPlayerTrait::new(10, 10, starknet::contract_address_const::<0xa000a>(), 0xd000a))}
    pub fn P11() -> TestPlayer {(TestPlayerTrait::new(11, 11, starknet::contract_address_const::<0xa000b>(), 0xd000b))}
    pub fn P12() -> TestPlayer {(TestPlayerTrait::new(12, 12, starknet::contract_address_const::<0xa000c>(), 0xd000c))}
    pub fn P13() -> TestPlayer {(TestPlayerTrait::new(13, 13, starknet::contract_address_const::<0xa000d>(), 0xd000d))}
    pub fn P14() -> TestPlayer {(TestPlayerTrait::new(14, 14, starknet::contract_address_const::<0xa000e>(), 0xd000e))}
    pub fn P15() -> TestPlayer {(TestPlayerTrait::new(15, 15, starknet::contract_address_const::<0xa000f>(), 0xd000f))}
    pub fn P16() -> TestPlayer {(TestPlayerTrait::new(16, 16, starknet::contract_address_const::<0xa0010>(), 0xd0010))}
    pub fn P17() -> TestPlayer {(TestPlayerTrait::new(17, 17, starknet::contract_address_const::<0xa0011>(), 0xd0011))}
    pub fn P18() -> TestPlayer {(TestPlayerTrait::new(18, 18, starknet::contract_address_const::<0xa0012>(), 0xd0012))}
    pub fn P19() -> TestPlayer {(TestPlayerTrait::new(19, 19, starknet::contract_address_const::<0xa0013>(), 0xd0013))}
    pub fn P20() -> TestPlayer {(TestPlayerTrait::new(20, 20, starknet::contract_address_const::<0xa0014>(), 0xd0014))}
    pub fn P21() -> TestPlayer {(TestPlayerTrait::new(21, 21, starknet::contract_address_const::<0xa0015>(), 0xd0015))}
    pub fn P22() -> TestPlayer {(TestPlayerTrait::new(22, 22, starknet::contract_address_const::<0xa0016>(), 0xd0016))}
    pub fn P23() -> TestPlayer {(TestPlayerTrait::new(23, 23, starknet::contract_address_const::<0xa0017>(), 0xd0017))}
    pub fn P24() -> TestPlayer {(TestPlayerTrait::new(24, 24, starknet::contract_address_const::<0xa0018>(), 0xd0018))}
    pub fn P25() -> TestPlayer {(TestPlayerTrait::new(25, 25, starknet::contract_address_const::<0xa0019>(), 0xd0019))}
    pub fn P26() -> TestPlayer {(TestPlayerTrait::new(26, 26, starknet::contract_address_const::<0xa001a>(), 0xd001a))}
    pub fn P27() -> TestPlayer {(TestPlayerTrait::new(27, 27, starknet::contract_address_const::<0xa001b>(), 0xd001b))}
    pub fn P28() -> TestPlayer {(TestPlayerTrait::new(28, 28, starknet::contract_address_const::<0xa001c>(), 0xd001c))}
    pub fn P29() -> TestPlayer {(TestPlayerTrait::new(29, 29, starknet::contract_address_const::<0xa001d>(), 0xd001d))}
    pub fn P30() -> TestPlayer {(TestPlayerTrait::new(30, 30, starknet::contract_address_const::<0xa001e>(), 0xd001e))}
    pub fn P31() -> TestPlayer {(TestPlayerTrait::new(31, 31, starknet::contract_address_const::<0xa001f>(), 0xd001f))}
    pub fn P32() -> TestPlayer {(TestPlayerTrait::new(32, 32, starknet::contract_address_const::<0xa0020>(), 0xd0020))}
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
    pub fn from_entry_id(entry_id: u64) -> TestPlayer {
        if (entry_id == P1().entry_id) {(P1())}
        else if (entry_id == P2().entry_id) {(P2())}
        else if (entry_id == P3().entry_id) {(P3())}
        else if (entry_id == P4().entry_id) {(P4())}
        else if (entry_id == P5().entry_id) {(P5())}
        else if (entry_id == P6().entry_id) {(P6())}
        else if (entry_id == P7().entry_id) {(P7())}
        else if (entry_id == P8().entry_id) {(P8())}
        else if (entry_id == P9().entry_id) {(P9())}
        else if (entry_id == P10().entry_id) {(P10())}
        else if (entry_id == P11().entry_id) {(P11())}
        else if (entry_id == P12().entry_id) {(P12())}
        else if (entry_id == P13().entry_id) {(P13())}
        else if (entry_id == P14().entry_id) {(P14())}
        else if (entry_id == P15().entry_id) {(P15())}
        else if (entry_id == P16().entry_id) {(P16())}
        else if (entry_id == P17().entry_id) {(P17())}
        else if (entry_id == P18().entry_id) {(P18())}
        else if (entry_id == P19().entry_id) {(P19())}
        else if (entry_id == P20().entry_id) {(P20())}
        else if (entry_id == P21().entry_id) {(P21())}
        else if (entry_id == P22().entry_id) {(P22())}
        else if (entry_id == P23().entry_id) {(P23())}
        else if (entry_id == P24().entry_id) {(P24())}
        else if (entry_id == P25().entry_id) {(P25())}
        else if (entry_id == P26().entry_id) {(P26())}
        else if (entry_id == P27().entry_id) {(P27())}
        else if (entry_id == P28().entry_id) {(P28())}
        else if (entry_id == P29().entry_id) {(P29())}
        else if (entry_id == P30().entry_id) {(P30())}
        else if (entry_id == P31().entry_id) {(P31())}
        else if (entry_id == P32().entry_id) {(P32())}
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
    use pistols::systems::rng_mock::{MockedValue, MockedValueTrait};
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
            let entry_number: u32 = PLAYERS::from_entry_id(token_id).entry_number.into();
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
