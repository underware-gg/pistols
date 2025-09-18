#[cfg(test)]
pub mod tester {
    use starknet::{ContractAddress, testing};

    use dojo::world::{WorldStorage, IWorldDispatcherTrait};
    use dojo::model::{ModelStorageTest};
    use dojo_cairo_test::{
        spawn_test_world,
        NamespaceDef, TestResource,
        ContractDefTrait, ContractDef,
        WorldStorageTestTrait,
    };

    pub use pistols::systems::{
        bank::{bank, IBankDispatcher, IBankDispatcherTrait},
        admin::{admin, IAdminDispatcher, IAdminDispatcherTrait},
        game::{game, IGameDispatcher, IGameDispatcherTrait},
        game_loop::{game_loop, IGameLoopDispatcher, IGameLoopDispatcherTrait},
        bot_player::{bot_player, IBotPlayerDispatcher, IBotPlayerDispatcherTrait, IBotPlayerProtectedDispatcher, IBotPlayerProtectedDispatcherTrait},
        matchmaker::{matchmaker, IMatchMakerDispatcher, IMatchMakerDispatcherTrait},
        tutorial::{tutorial, ITutorialDispatcher, ITutorialDispatcherTrait},
        rng::{rng, IRngDispatcher, IRngDispatcherTrait},
        rng_mock::{rng_mock, IRngMockDispatcher, IRngMockDispatcherTrait},
        vrf_mock::{vrf_mock},
        tokens::{
            duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait, IDuelTokenProtectedDispatcher, IDuelTokenProtectedDispatcherTrait},
            duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
            pack_token::{pack_token, IPackTokenDispatcher, IPackTokenDispatcherTrait},
            ring_token::{ring_token, IRingTokenDispatcher, IRingTokenDispatcherTrait},
            // tournament_token::{tournament_token, ITournamentTokenDispatcher, ITournamentTokenDispatcherTrait, ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
            fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
            fools_coin::{fools_coin, IFoolsCoinDispatcher, IFoolsCoinDispatcherTrait},
            lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
            // budokan_mock::{budokan_mock, IBudokanMockDispatcher, IBudokanMockDispatcherTrait},
        },
        components::{
            token_bound::{TokenBoundAddress, TokenBoundAddressTrait},
        },
    };
    pub use pistols::models::{
        player::{Player},
        pack::{Pack, PackType, PackTypeTrait},
        ring::{Ring, RingType, RingTypeTrait, RingBalance},
        challenge::{
            Challenge, ChallengeValue,
            RoundValue,
            DuelistState,
            DuelType, DuelTypeTrait,
        },
        duelist::{
            Duelist, DuelistValue,
            DuelistAssignment,
            DuelistMemorial, DuelistMemorialValue,
            CauseOfDeath,
        },
        match_queue::{MatchPlayer, QueueId, QueueMode},
        pact::{Pact, PactTrait},
        leaderboard::{Leaderboard, LeaderboardTrait, LeaderboardPosition},
        config::{Config, TokenConfig, CoinConfig, CONFIG},
        season::{
            SeasonConfig, SeasonManagerTrait,
            SeasonScoreboard,
        },
        pool::{Pool, PoolType},
        player::{PlayerDuelistStack},
        events::{SocialPlatform, PlayerSetting, PlayerSettingValue},
        // tournament::{TournamentRound},
    };

    // use pistols::tests::mock_account::DualCaseAccountMock;
    use pistols::tests::token::{
        mock_duelist::{duelist_token as mock_duelist},
    };

    pub use pistols::types::{
        premise::{Premise},
        challenge_state::{ChallengeState},
        duelist_profile::{DuelistProfile},
        trophies::{Trophy, TrophyTrait},
        constants::{CONST, FAME},
        rules::{Rules, RulesTrait},
    };
    use pistols::utils::{
        byte_arrays::{BoolToString},
        arrays::{ArrayTestUtilsTrait},
        address::{ContractAddressIntoU256},
        short_string::{ShortString},
        serde::{SerializedAppend},
    };
    pub use pistols::interfaces::dns::{DnsTrait};
    pub use pistols::libs::store::{Store, StoreTrait};

    pub use openzeppelin_token::erc721::{
        // ERC721Component,
        ERC721Component::{Transfer, Approval}
    };

    
    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    pub fn ZERO()      -> ContractAddress { starknet::contract_address_const::<0x0>() }
    pub fn OWNER()     -> ContractAddress { starknet::contract_address_const::<0x1>() } // mock owner of duelists 1-2
    pub fn OWNER2()    -> ContractAddress { starknet::contract_address_const::<0x2>() } // mock owner of duelists 1-2
    pub fn OTHER()     -> ContractAddress { starknet::contract_address_const::<0x3>() } // mock owner of duelists 3-4
    pub fn OTHER2()    -> ContractAddress { starknet::contract_address_const::<0x4>() } // mock owner of duelists 3-4
    pub fn BUMMER()    -> ContractAddress { starknet::contract_address_const::<0x5>() } // mock owner of duelists 5-6
    pub fn BUMMER2()   -> ContractAddress { starknet::contract_address_const::<0x6>() } // mock owner of duelists 5-6
    pub fn RECIPIENT() -> ContractAddress { starknet::contract_address_const::<0x222>() }
    pub fn SPENDER()   -> ContractAddress { starknet::contract_address_const::<0x333>() }
    pub fn TREASURY()  -> ContractAddress { starknet::contract_address_const::<0x444>() }
    pub fn DELEGATEE() -> ContractAddress { starknet::contract_address_const::<0x555>() }
    pub fn STACKER()   -> ContractAddress { starknet::contract_address_const::<0x0101>() } // owns 2 stacked duelists
    pub fn STACKER2()  -> ContractAddress { starknet::contract_address_const::<0x0202>() } // owns 2 stacked duelists
    // low part is owned token, but different address
    pub fn FAKE_OWNER_OF_1() -> ContractAddress { starknet::contract_address_const::<0x1234000000000000000000000000000000001>() }
    pub fn FAKE_OWNER_OF_2() -> ContractAddress { starknet::contract_address_const::<0x2234000000000000000000000000000000002>() }
    // hard-coded owners
    pub fn OWNED_BY_OWNER() -> u128 { 0xeeee }
    pub fn OWNED_BY_OTHER() -> u128 { 0xdddd }

    #[inline(always)]
    pub fn ID(address: ContractAddress) -> u128 {
        let as_u256: u256 = address.into();
        (as_u256.low)
    }

    pub fn MESSAGE() -> ByteArray {("For honour!!!")}

    pub const SEASON_ID_1: u32 = 1;
    pub const SEASON_ID_2: u32 = 2;
    pub const SEASON_ID_3: u32 = 3;
    pub const SEASON_ID_4: u32 = 4;
    pub const SEASON_ID_5: u32 = 5;

    pub const FAUCET_AMOUNT: u128 = 10_000_000_000_000_000_000_000;

    #[inline(always)]
    pub fn WEI(value: u128) -> u128 {
        (value * CONST::ETH_TO_WEI.low)
    }
    #[inline(always)]
    pub fn ETH(value: u128) -> u128 {
        (value / CONST::ETH_TO_WEI.low)
    }

    // set_contract_address : to define the address of the calling contract,
    // set_account_contract_address : to define the address of the account used for the current transaction.
    pub fn impersonate(address: ContractAddress) {
        testing::set_contract_address(address);             // starknet::get_execution_info().contract_address
        testing::set_account_contract_address(address);     // starknet::get_execution_info().tx_info.account_contract_address
    }
    pub fn get_impersonator() -> ContractAddress {
        (starknet::get_execution_info().tx_info.account_contract_address)
    }

    #[inline(always)]
    pub fn _assert_is_alive(state: DuelistState, msg: ByteArray) {
        assert_gt!(state.health, 0, "{}", msg);
    }
    #[inline(always)]
    pub fn _assert_is_dead(state: DuelistState, msg: ByteArray) {
        assert_eq!(state.health, 0, "{}", msg);
    }


    //-------------------------------
    // Test world

    pub const INITIAL_TIMESTAMP: u64 = 0x100000000;
    pub const TIMESTEP: u64 = 0x1;

    pub mod FLAGS {
        pub const GAME: u16       = 0b1;
        pub const ADMIN: u16      = 0b10;
        pub const LORDS: u16      = 0b100;
        pub const DUEL: u16       = 0b1000;
        pub const DUELIST: u16    = 0b10000;
        pub const APPROVE: u16    = 0b100000;
        pub const MOCK_RNG: u16   = 0b1000000;
        pub const TUTORIAL: u16   = 0b10000000;
        pub const FAME: u16       = 0b100000000;
        pub const ACCOUNT: u16    = 0b1000000000;
        pub const TOURNAMENT: u16 = 0b10000000000;
        pub const OWNER: u16      = 0b100000000000;
        pub const RINGS: u16      = 0b1000000000000;
        pub const BOT_PLAYER: u16 = 0b10000000000000;
        pub const MATCHMAKER: u16 = 0b100000000000000;
    }

    #[derive(Copy, Drop)]
    pub struct TestSystems {
        pub world: WorldStorage,
        pub store: Store,
        pub game: IGameDispatcher,
        pub game_loop: IGameLoopDispatcher,
        pub bot_player: IBotPlayerDispatcher,
        pub matchmaker: IMatchMakerDispatcher,
        pub tut: ITutorialDispatcher,
        pub admin: IAdminDispatcher,
        pub bank: IBankDispatcher,
        pub lords: ILordsMockDispatcher,
        pub fame: IFameCoinDispatcher,
        pub fools: IFoolsCoinDispatcher,
        pub duels: IDuelTokenDispatcher,
        pub duelists: IDuelistTokenDispatcher,
        pub pack: IPackTokenDispatcher,
        pub rings: IRingTokenDispatcher,
        // pub tournaments: ITournamentTokenDispatcher,
        pub rng: IRngMockDispatcher,
        // pub budokan: IBudokanMockDispatcher,
        pub account: ContractAddress,
    }

    #[generate_trait]
    pub impl TestSystemsImpl of TestSystemsTrait {
        #[inline(always)]
        fn from_world(world: WorldStorage, mock_account: ContractAddress) -> TestSystems {
            (TestSystems {
                world,
                game: world.game_dispatcher(),
                game_loop: world.game_loop_dispatcher(),
                bot_player: world.bot_player_dispatcher(),
                matchmaker: world.matchmaker_dispatcher(),
                store: StoreTrait::new(world),
                tut: world.tutorial_dispatcher(),
                admin: world.admin_dispatcher(),
                bank: world.bank_dispatcher(),
                lords: world.lords_mock_dispatcher(),
                fame: world.fame_coin_dispatcher(),
                fools: world.fools_coin_dispatcher(),
                duels: world.duel_token_dispatcher(),
                duelists: world.duelist_token_dispatcher(),
                pack: world.pack_token_dispatcher(),
                rings: world.ring_token_dispatcher(),
                // tournaments: world.tournament_token_dispatcher(),
                rng: IRngMockDispatcher{ contract_address: world.rng_address() },
                // budokan: world.budokan_mock_dispatcher(),
                account: mock_account,
            })
        }
    }

    pub fn setup_world(flags: u16) -> TestSystems {
        let mut deploy_game: bool = (flags & FLAGS::GAME) != 0;
        let mut deploy_tutorial: bool = (flags & FLAGS::TUTORIAL) != 0;
        let mut deploy_admin: bool = (flags & FLAGS::ADMIN) != 0;
        let mut deploy_lords: bool = (flags & FLAGS::LORDS) != 0;
        let mut deploy_duel: bool = (flags & FLAGS::DUEL) != 0;
        let mut deploy_duelist: bool = (flags & FLAGS::DUELIST) != 0;
        let mut deploy_rng_mock = (flags & FLAGS::MOCK_RNG) != 0;
        let mut approve: bool = (flags & FLAGS::APPROVE) != 0;
        let mut deploy_fame: bool = (flags & FLAGS::FAME) != 0;
        let mut deploy_account: bool = (flags & FLAGS::ACCOUNT) != 0;
        let mut deploy_tournament: bool = (flags & FLAGS::TOURNAMENT) != 0;
        let mut deploy_owner: bool = (flags & FLAGS::OWNER) != 0;
        let mut deploy_rings: bool = (flags & FLAGS::RINGS) != 0;
        let mut deploy_bot_player: bool = (flags & FLAGS::BOT_PLAYER) != 0;
        let mut deploy_matchmaker: bool = (flags & FLAGS::MATCHMAKER) != 0;
        let mut deploy_game_loop: bool = false;
        let mut deploy_duelist_mock: bool = false;
        let mut deploy_bank: bool = false;
        let mut deploy_pack: bool = false;
        let mut deploy_fools: bool = false;
        let mut deploy_vrf: bool = false;
        
        deploy_game         = deploy_game || approve;
        deploy_duelist      = deploy_duelist || deploy_bot_player;
        deploy_game_loop    = deploy_game_loop || deploy_game || deploy_tutorial;
        deploy_lords        = deploy_lords || deploy_game || deploy_duelist || approve;
        deploy_duel         = deploy_duel || deploy_game || deploy_bot_player || deploy_matchmaker;
        deploy_pack         = deploy_pack || deploy_duelist || deploy_bot_player;
        deploy_fame         = deploy_fame || deploy_game || deploy_duelist;
        deploy_fools        = deploy_fools || deploy_game;
        deploy_rng_mock     = deploy_rng_mock || deploy_tutorial;
        deploy_bank         = deploy_bank || deploy_fame || deploy_lords || deploy_duelist || deploy_matchmaker;
        deploy_vrf          = deploy_vrf || deploy_game || deploy_pack || deploy_tournament || deploy_matchmaker;
        deploy_duelist_mock = !deploy_duelist && (deploy_game || deploy_duel || deploy_tournament);
        deploy_admin        = deploy_admin || deploy_game || deploy_lords || deploy_tournament || deploy_vrf;
        // if duels only, need game address to mint token to...
        deploy_game         = deploy_game || deploy_duel;

        let mut resources: Array<TestResource> = array![
            // pistols models
            TestResource::Model(pistols::models::config::m_Config::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::config::m_TokenConfig::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::config::m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::challenge::m_Challenge::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::challenge::m_ChallengeMessage::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::challenge::m_Round::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::duelist::m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::duelist::m_DuelistAssignment::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::duelist::m_DuelistMemorial::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::leaderboard::m_Leaderboard::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::match_queue::m_MatchQueue::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::match_queue::m_MatchPlayer::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::pack::m_Pack::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::ring::m_Ring::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::ring::m_RingBalance::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::pact::m_Pact::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::pool::m_Pool::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::player::m_Player::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::player::m_PlayerDuelistStack::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::player::m_PlayerTeamFlags::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::player::m_PlayerFlags::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::player::m_PlayerDelegation::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::season::m_SeasonScoreboard::TEST_CLASS_HASH),
            TestResource::Model(pistols::models::season::m_SeasonConfig::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_TournamentPass::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_TournamentSettings::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_Tournament::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_TournamentRound::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_TournamentToChallenge::TEST_CLASS_HASH),
            // TestResource::Model(pistols::models::tournament::m_ChallengeToTournament::TEST_CLASS_HASH),
            TestResource::Model(pistols::systems::components::token_bound::m_TokenBoundAddress::TEST_CLASS_HASH),
            // mocks
            TestResource::Model(pistols::systems::rng_mock::m_MockedValue::TEST_CLASS_HASH),
            TestResource::Model(pistols::tests::token::mock_duelist::m_MockDuelistOwners::TEST_CLASS_HASH),
            // pistols events
            TestResource::Event(pistols::models::events::e_PlayerActivityEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_CallToChallengeEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_ChallengeRewardsEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_LordsReleaseEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_PlayerBookmarkEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_PlayerSocialLinkEvent::TEST_CLASS_HASH),
            TestResource::Event(pistols::models::events::e_PlayerSettingEvent::TEST_CLASS_HASH),
            // cartridge arcade
            TestResource::Event(achievement::events::index::e_TrophyCreation::TEST_CLASS_HASH),
            TestResource::Event(achievement::events::index::e_TrophyProgression::TEST_CLASS_HASH),
            // budokan
            // TestResource::Model(tournaments::components::models::game::m_GameMetadata::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_TokenMetadata::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_GameCounter::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_Score::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_Settings::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_SettingsDetails::TEST_CLASS_HASH),
            // TestResource::Model(tournaments::components::models::game::m_SettingsCounter::TEST_CLASS_HASH),
        ];

        let mut contract_defs: Array<ContractDef> = array![];

        if (deploy_game) {
            resources.append(TestResource::Contract(game::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"game")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }
        if (deploy_game_loop) {
            resources.append(TestResource::Contract(game_loop::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"game_loop")
            );
        }

        if (deploy_bot_player) {
            resources.append(TestResource::Contract(bot_player::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"bot_player")
            );
        }

        if (deploy_vrf) {
            resources.append(TestResource::Contract(vrf_mock::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"vrf_mock")
            );
        }

        if (deploy_tutorial) {
            resources.append(TestResource::Contract(tutorial::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"tutorial")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }

        if (deploy_admin) {
            resources.append(TestResource::Contract(admin::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"admin")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        TREASURY().into(), // treasury_address
                        0, // lords_address
                        0, // vrf_address
                    ].span())
            );
        }

        if (deploy_duel) {
            resources.append(TestResource::Contract(duel_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duel_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'http://localhost:3000',
                        0, // minter_address
                    ].span())
            );
        }

        // println!("---- 3");
        if (deploy_duelist) {
            resources.append(TestResource::Contract(duelist_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duelist_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'http://localhost:3000',
                    ].span())
            );
        }
        else if (deploy_duelist_mock) {
            resources.append(TestResource::Contract(mock_duelist::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duelist_token")
                    .with_writer_of([selector_from_tag!("pistols-MockDuelistOwners")].span())
            );
        }

        if (deploy_pack) {
            resources.append(TestResource::Contract(pack_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"pack_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'http://localhost:3000',
                    ].span()),
            );
        }

        if (deploy_rings) {
            resources.append(TestResource::Contract(ring_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"ring_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'http://localhost:3000',
                    ].span()),
            );
        }

        // if (deploy_tournament) {
        //     resources.append(TestResource::Contract(tournament_token::TEST_CLASS_HASH));
        //     resources.append(TestResource::Contract(budokan_mock::TEST_CLASS_HASH));
        //     contract_defs.append(
        //         ContractDefTrait::new(@"pistols", @"tournament_token")
        //             .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
        //             .with_init_calldata([
        //                 'http://localhost:3000',
        //             ].span()),
        //     );
        //     contract_defs.append(
        //         ContractDefTrait::new(@"pistols", @"budokan_mock")
        //             .with_writer_of([selector_from_tag!("pistols-MockedValue")].span())
        //             .with_init_calldata([].span())
        //     );
        // }

        if (deploy_lords) {
            resources.append(TestResource::Contract(lords_mock::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"lords_mock")
                    .with_writer_of([selector_from_tag!("pistols-CoinConfig")].span())
                    .with_init_calldata([
                        // game.contract_address.into(), // minter
                        0, // minter
                        FAUCET_AMOUNT.into(), // faucet_amount: 10,000 Lords
                    ].span())
            );
        }

        if (deploy_bank) {
            resources.append(TestResource::Contract(bank::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"bank")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }

        if (deploy_fame) {
            resources.append(TestResource::Contract(fame_coin::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"fame_coin")
                    .with_writer_of([selector_from_tag!("pistols-CoinConfig"),selector_from_tag!("pistols-TokenBoundAddress")].span()), // same as config
            );
        }
        if (deploy_fools) {
            resources.append(TestResource::Contract(fools_coin::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"fools_coin")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }

        if (deploy_matchmaker) { // AFTER Fools...
            resources.append(TestResource::Contract(matchmaker::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"matchmaker")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([].span()),
            );
        }

        if (deploy_rng_mock) {
            resources.append(TestResource::Contract(rng_mock::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"rng_mock")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        } else {
            resources.append(TestResource::Contract(rng::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"rng")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }

        let namespace_def = NamespaceDef {
            namespace: "pistols",
            resources: resources.span(),
        };

        // setup block
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);

        let mut world: WorldStorage = spawn_test_world([namespace_def].span());

        world.sync_perms_and_inits(contract_defs.span());

        // build result
        let mock_account: ContractAddress = if (deploy_account) {deploy_mock_account()} else {ZERO()};
        let sys: TestSystems = TestSystemsTrait::from_world(world, mock_account);

        // initializers
        if (deploy_owner) {
            world.dispatcher.grant_owner(dojo::utils::bytearray_hash(@"pistols"), OWNER());
        }
        if (deploy_game) {
            world.dispatcher.grant_owner(selector_from_tag!("pistols-game"), OWNER());
        }
        if (deploy_admin) {
            world.dispatcher.grant_owner(selector_from_tag!("pistols-admin"), OWNER());
        }
        // if (deploy_tournament) {
        //     world.dispatcher.grant_owner(selector_from_tag!("pistols-tournament_token"), OWNER());
        // }
        if (deploy_lords) {
            let lords = world.lords_mock_dispatcher();
            execute_lords_faucet(@lords, OWNER());
            execute_lords_faucet(@lords, OTHER());
            if (approve) {
                let spender = world.bank_address();
                execute_lords_approve(@lords, OWNER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, OTHER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, BUMMER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
            }
        }

        impersonate(OWNER());

// println!("READY!");
        (sys)
    }


    #[inline(always)]
    pub fn get_block_number() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_number)
    }

    #[inline(always)]
    pub fn get_block_timestamp() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_timestamp)
    }

    #[inline(always)]
    pub fn _next_block() -> (u64, u64) {
        (elapse_block_timestamp(TIMESTEP))
    }

    pub fn elapse_block_timestamp(delta: u64) -> (u64, u64) {
        let new_timestamp = starknet::get_block_timestamp() + delta;
        (set_block_timestamp(new_timestamp))
    }

    pub fn set_block_timestamp(new_timestamp: u64) -> (u64, u64) {
        assert_ge!(new_timestamp, starknet::get_block_timestamp(), "set_block_timestamp() <<< Back in time...");
        let new_block_number = get_block_number() + 1;
        testing::set_block_number(new_block_number);
        testing::set_block_timestamp(new_timestamp);
        (new_block_number, new_timestamp)
    }

    // event helpers
    // examples...
    // https://docs.swmansion.com/scarb/corelib/core-starknet-testing-pop_log.html
    // https://github.com/cartridge-gg/arcade/blob/7e3a878192708563082eaf2adfd57f4eec0807fb/packages/achievement/src/tests/test_achievable.cairo#L77-L92
    pub fn pop_log<T, +Drop<T>, +starknet::Event<T>>(address: ContractAddress, event_selector: felt252) -> Option<T> {
        let (mut keys, mut data) = testing::pop_log_raw(address)?;
        let id = keys.pop_front().unwrap(); // Remove the event ID from the keys
        assert_eq!(id, @event_selector, "Wrong event!");
        let ret = starknet::Event::deserialize(ref keys, ref data);
        assert!(data.is_empty(), "Event has extra data (wrong event?)");
        assert!(keys.is_empty(), "Event has extra keys (wrong event?)");
        (ret)
    }
    pub fn assert_no_events_left(address: ContractAddress) {
        assert!(testing::pop_log_raw(address).is_none(), "Events remaining on queue");
    }
    pub fn drop_event(address: ContractAddress) {
        match testing::pop_log_raw(address) {
            core::option::Option::Some(_) => {},
            core::option::Option::None => {},
        };
    }
    pub fn drop_all_events(address: ContractAddress) {
        loop {
            match testing::pop_log_raw(address) {
                core::option::Option::Some(_) => {},
                core::option::Option::None => { break; },
            };
        }
    }
    // ERC-721 events
    pub fn assert_event_transfer(emitter: ContractAddress, from: ContractAddress, to: ContractAddress, token_id: u256) {
        let event = pop_log::<Transfer>(emitter, selector!("Transfer")).unwrap();
        assert_eq!(event.from, from, "Invalid `from`");
        assert_eq!(event.to, to, "Invalid `to`");
        assert_eq!(event.token_id, token_id, "Invalid `token_id`");
    }
    pub fn assert_only_event_transfer(emitter: ContractAddress, from: ContractAddress, to: ContractAddress, token_id: u256) {
        assert_event_transfer(emitter, from, to, token_id);
        assert_no_events_left(emitter);
    }
    pub fn assert_event_approval(emitter: ContractAddress, owner: ContractAddress, spender: ContractAddress, token_id: u256) {
        let event = pop_log::<Approval>(emitter, selector!("Approval")).unwrap();
        assert_eq!(event.owner, owner, "Invalid `owner`");
        assert_eq!(event.approved, spender, "Invalid `spender`");
        assert_eq!(event.token_id, token_id, "Invalid `token_id`");
    }
    pub fn assert_only_event_approval(emitter: ContractAddress, owner: ContractAddress, spender: ContractAddress, token_id: u256) {
        assert_event_approval(emitter, owner, spender, token_id);
        assert_no_events_left(emitter);
    }

    // dojo events, based on:
    // https://github.com/cartridge-gg/arcade/blob/main/packages/achievement/src/tests/test_achievable.cairo#L77
    pub fn drop_dojo_events(sys: @TestSystems) {
        drop_all_events(*sys.world.dispatcher.contract_address);
    }
    pub fn assert_no_dojo_events_left(sys: @TestSystems) {
        assert_no_events_left(*sys.world.dispatcher.contract_address);
    }
    pub fn assert_event_trophy(sys: @TestSystems, trophy: Trophy, address: ContractAddress) {
        let contract_event = testing::pop_log::<dojo::world::world::Event>(*sys.world.dispatcher.contract_address).unwrap();
        match contract_event {
            dojo::world::world::Event::EventEmitted(event) => {
                assert_eq!(event.selector, selector_from_tag!("pistols-TrophyProgression"), "Invalid selector");
                // compare keys
                let mut keys = array![];
                keys.append_serde(trophy.identifier());
                keys.append_serde(address);
                ArrayTestUtilsTrait::assert_span_eq(event.keys, keys.span(), "keys");
            },
            _ => {},
        }
    }
    pub fn assert_event_bookmark(sys: @TestSystems, player_address: ContractAddress, target_address: ContractAddress, target_id: u128, enabled: bool) {
        let contract_event = testing::pop_log::<dojo::world::world::Event>(*sys.world.dispatcher.contract_address).unwrap();
        match contract_event {
            dojo::world::world::Event::EventEmitted(event) => {
                assert_eq!(event.selector, selector_from_tag!("pistols-PlayerBookmarkEvent"), "Invalid selector");
                // compare keys
                let mut keys = array![];
                keys.append_serde(player_address);
                keys.append_serde(target_address);
                keys.append_serde(target_id);
                ArrayTestUtilsTrait::assert_span_eq(event.keys, keys.span(), "keys");
                // compare values
                let mut values = array![];
                values.append_serde(enabled);
                ArrayTestUtilsTrait::assert_span_eq(event.values, values.span(), "values");
            },
            _ => {},
        }
    }
    pub fn assert_event_social_link(sys: @TestSystems, player_address: ContractAddress, social_platform: SocialPlatform, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray) {
        let contract_event = testing::pop_log::<dojo::world::world::Event>(*sys.world.dispatcher.contract_address).unwrap();
        match contract_event {
            dojo::world::world::Event::EventEmitted(event) => {
                assert_eq!(event.selector, selector_from_tag!("pistols-PlayerSocialLinkEvent"), "Invalid selector");
                // compare keys
                let mut keys = array![];
                keys.append_serde(player_address);
                keys.append_serde(social_platform);
                ArrayTestUtilsTrait::assert_span_eq(event.keys, keys.span(), "keys");
                // compare values
                let mut values = array![];
                values.append_serde(user_name);
                values.append_serde(user_id);
                values.append_serde(avatar);
                ArrayTestUtilsTrait::assert_span_eq(event.values, values.span(), "values");
            },
            _ => {},
        }
    }
    pub fn assert_event_player_setting(sys: @TestSystems, player_address: ContractAddress, setting: PlayerSetting, value: PlayerSettingValue) {
        let contract_event = testing::pop_log::<dojo::world::world::Event>(*sys.world.dispatcher.contract_address).unwrap();
        match contract_event {
            dojo::world::world::Event::EventEmitted(event) => {
                assert_eq!(event.selector, selector_from_tag!("pistols-PlayerSettingEvent"), "Invalid selector");
                // compare keys
                let mut keys = array![];
                keys.append_serde(player_address);
                keys.append_serde(setting);
                ArrayTestUtilsTrait::assert_span_eq(event.keys, keys.span(), "keys");
                // compare values
                let mut values = array![];
                values.append_serde(value);
                ArrayTestUtilsTrait::assert_span_eq(event.values, values.span(), "values");
            },
            _ => {},
        }
    }

    //--------------------------
    // helpers
    //
    pub fn make_challenge_ranked(ref sys: TestSystems, duel_id: u128) {
        let mut challenge: Challenge = sys.store.get_challenge(duel_id);
        challenge.duel_type = DuelType::Ranked;
        set_Challenge(ref sys.world, @challenge);
    }

    pub fn starts_with(input: ByteArray, prefix: ByteArray) -> bool {
        (if (input.len() < prefix.len()) {
            (false)
        } else {
            let mut result = true;
            let mut i = 0;
            while (i < prefix.len()) {
                if (input[i] != prefix[i]) {
                    result = false;
                    break;
                }
                i += 1;
            };
            (result)
        })
    }    

    //--------------------------
    // mock account contract
    //
    // use dojo_cairo_test::{deploy_contract};
    const NEW_PUBKEY: felt252 = 0x26da8d11938b76025862be14fdb8b28438827f73e75e86f7bfa38b196951fa7;
    pub fn deploy_mock_account() -> ContractAddress {
        // let key_pair: StarkCurveKeyPair = StarkCurveKeyPairTrait::generate();
        // let public_key: felt252 = key_pair.public_key;
        // (deploy_contract(DualCaseAccountMock::TEST_CLASS_HASH.try_into().unwrap(), [NEW_PUBKEY].span()))
        (ZERO())
    }

    //
    // execute calls
    //

    // ::admin
    pub fn execute_admin_set_paused(system: @IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        (*system).set_paused(paused);
        _next_block();
    }
    pub fn execute_admin_set_treasury(system: @IAdminDispatcher, sender: ContractAddress, new_treasury_address: ContractAddress) {
        impersonate(sender);
        (*system).set_treasury(new_treasury_address);
        _next_block();
    }
    pub fn execute_admin_set_is_team_member(system: @IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, is_team_member: bool, is_admin: bool) {
        impersonate(sender);
        (*system).set_is_team_member(owner_address, is_team_member, is_admin);
        _next_block();
    }
    pub fn execute_admin_set_is_blocked(system: @IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, is_blocked: bool) {
        impersonate(sender);
        (*system).set_is_blocked(owner_address, is_blocked);
        _next_block();
    }
    pub fn execute_admin_disqualify_duelist(system: @IAdminDispatcher, sender: ContractAddress, season_id: u32, duelist_id: u128, block_owner: bool) -> bool {
        impersonate(sender);
        let result: bool = (*system).disqualify_duelist(season_id, duelist_id, block_owner);
        _next_block();
        (result)
    }
    pub fn execute_admin_qualify_duelist(system: @IAdminDispatcher, sender: ContractAddress, season_id: u32, duelist_id: u128) -> u8 {
        impersonate(sender);
        let result: u8 = (*system).qualify_duelist(season_id, duelist_id);
        _next_block();
        (result)
    }

    // ::ierc20
    pub fn execute_lords_faucet(system: @ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        (*system).faucet();
        _next_block();
    }
    pub fn execute_lords_approve(system: @ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u128) {
        impersonate(owner);
        (*system).approve(spender, value.into());
        _next_block();
    }

    // ::pack_token
    pub fn execute_claim_starter_pack(sys: @TestSystems, sender: ContractAddress) -> Span<u128> {
        impersonate(sender);
        let duelist_ids: Span<u128> = (*sys.pack).claim_starter_pack();
        _next_block();
        (duelist_ids)
    }
    pub fn execute_claim_gift(sys: @TestSystems, sender: ContractAddress) -> Span<u128> {
        impersonate(sender);
        let duelist_ids: Span<u128> = (*sys.pack).claim_gift();
        _next_block();
        (duelist_ids)
    }
    pub fn execute_pack_purchase(sys: @TestSystems, sender: ContractAddress, pack_type: PackType) -> u128 {
        impersonate(sender);
        let pack_id: u128 = (*sys.pack).purchase(pack_type);
        _next_block();
        (pack_id)
    }
    pub fn execute_pack_airdrop(sys: @TestSystems, sender: ContractAddress, recipient: ContractAddress, pack_type: PackType, duelist_profile: Option<DuelistProfile>) -> u128 {
        impersonate(sender);
        let pack_id: u128 = (*sys.pack).airdrop(recipient, pack_type, duelist_profile);
        _next_block();
        (pack_id)
    }
    pub fn execute_pack_open(sys: @TestSystems, sender: ContractAddress, pack_id: u128) -> Span<u128> {
        impersonate(sender);
        let duelist_ids: Span<u128> = (*sys.pack).open(pack_id);
        _next_block();
        (duelist_ids)
    }

    // ::duelist_token
    pub fn execute_transfer_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress,
        to: ContractAddress,
        duelist_id: u128,
    ) {
        impersonate(sender);
        (*system).transfer_from(sender, to, duelist_id.into());
        _next_block();
    }

    pub fn activate_duelist(ref sys: TestSystems, duelist_id: u128) {
        let mut duelist: Duelist = sys.store.get_duelist(duelist_id);
        if (duelist.timestamps.active == 0) {
            duelist.timestamps.active = core::cmp::max(get_block_timestamp() - 1, 1);
            set_Duelist(ref sys.world, @duelist);
        }
    }


    // ::duel_token
    pub fn execute_create_duel(sys: @TestSystems, sender: ContractAddress,
        challenged: ContractAddress,
        // premise: Premise,
        message: ByteArray,
        duel_type: DuelType,
        expire_minutes: u64,
        lives_staked: u8,
    ) -> u128 {
        (execute_create_duel_ID(sys, sender, ID(sender), challenged, message, duel_type, expire_minutes, lives_staked))
    }
    pub fn execute_create_duel_ID(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        challenged: ContractAddress,
        // premise: Premise,
        message: ByteArray,
        duel_type: DuelType,
        expire_minutes: u64,
        lives_staked: u8,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*sys.duels).create_duel(duel_type, duelist_id, challenged, lives_staked, expire_minutes, Premise::Nothing, message);
        _next_block();
        (duel_id)
    }
    pub fn execute_reply_duel(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        impersonate(sender);
        let new_state: ChallengeState = (*sys.duels).reply_duel(duel_id, duelist_id, accepted);
        _next_block();
        (new_state)
    }

    // ::matchmaker
    pub fn execute_enlist_ranked_duelist(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        queue_id: QueueId,
    ) -> u128 {
        impersonate(sender);
        let duelist_id: u128 = (*sys.matchmaker).enlist_ranked_duelist(duelist_id, queue_id);
        _next_block();
        (duelist_id)
    }
    pub fn execute_match_make_me(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        queue_id: QueueId,
        queue_mode: QueueMode,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*sys.matchmaker).match_make_me(duelist_id, queue_id, queue_mode);
        _next_block();
        (duel_id)
    }

    // ::ring_token
    pub fn execute_claim_season_ring(sys: @TestSystems, sender: ContractAddress,
        duel_id: u128,
        ring_type: RingType,
    ) -> u128 {
        impersonate(sender);
        let ring_id: u128 = (*sys.rings).claim_season_ring(duel_id, ring_type);
        _next_block();
        (ring_id)
    }
    pub fn execute_airdrop_ring(sys: @TestSystems, sender: ContractAddress,
        recipient: ContractAddress,
        ring_type: RingType,
    ) -> u128 {
        impersonate(sender);
        let ring_id: u128 = (*sys.rings).airdrop_ring(recipient, ring_type);
        _next_block();
        (ring_id)
    }

    // // ::tournament_token
    // pub fn execute_start_tournament(sys: @TestSystems, sender: ContractAddress,
    //     pass_id: u64,
    // ) -> u64 {
    //     impersonate(sender);
    //     let tournament_id: u64 = (*sys.tournaments).start_tournament(pass_id);
    //     _next_block();
    //     (tournament_id)
    // }
    // pub fn execute_enlist_ranked_duelist(sys: @TestSystems, sender: ContractAddress,
    //     pass_id: u64,
    //     duelist_id: u128,
    // ) {
    //     impersonate(sender);
    //     (*sys.tournaments).enlist_ranked_duelist(pass_id, duelist_id);
    //     _next_block();
    // }
    // pub fn execute_join_duel(sys: @TestSystems, sender: ContractAddress,
    //     pass_id: u64,
    // ) -> u128 {
    //     impersonate(sender);
    //     let duel_id: u128 = (*sys.tournaments).join_duel(pass_id);
    //     _next_block();
    //     (duel_id)
    // }
    // pub fn execute_end_round(sys: @TestSystems, sender: ContractAddress,
    //     pass_id: u64,
    // ) -> Option<u8> {
    //     impersonate(sender);
    //     let next_round_option: Option<u8> = (*sys.tournaments).end_round(pass_id);
    //     _next_block();
    //     (next_round_option)
    // }

    // ::game
    pub fn execute_commit_moves(sys: @TestSystems, sender: ContractAddress,
        duel_id: u128,
        hash: u128,
    ) {
        execute_commit_moves_ID(sys, sender, ID(sender), duel_id, hash);
    }
    pub fn execute_commit_moves_ID(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        hash: u128,
    ) {
        impersonate(sender);
        (*sys.game).commit_moves(duelist_id, duel_id, hash);
        _next_block();
    }
    pub fn execute_reveal_moves(sys: @TestSystems, sender: ContractAddress,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        execute_reveal_moves_ID(sys, sender, ID(sender), duel_id, salt, moves);
    }
    pub fn execute_reveal_moves_ID(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*sys.game).reveal_moves(duelist_id, duel_id, salt, moves);
        _next_block();
    }
    pub fn execute_collect_duel(sys: @TestSystems, sender: ContractAddress, duel_id: u128) {
        impersonate(sender);
        (*sys.game).collect_duel(duel_id);
        _next_block();
    }
    pub fn execute_delegate_game_actions(sys: @TestSystems, sender: ContractAddress, delegatee: ContractAddress, enabled: bool) {
        impersonate(sender);
        (*sys.game).delegate_game_actions(delegatee, enabled);
        _next_block();
    }

    // ::tutorial
    pub fn execute_create_tutorial(sys: @TestSystems, sender: ContractAddress,
        tutorial_id: u128,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*sys.tut).create_tutorial(ID(sender), tutorial_id);
        _next_block();
        (duel_id)
    }
    pub fn execute_commit_moves_tutorial(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        hashed: u128,
    ) {
        impersonate(sender);
        (*sys.tut).commit_moves(duelist_id, duel_id, hashed);
        _next_block();
    }
    pub fn execute_reveal_moves_tutorial(sys: @TestSystems, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*sys.tut).reveal_moves(duelist_id, duel_id, salt, moves);
        _next_block();
    }

    // ::bank
    pub fn execute_sponsor_duelists(sys: @TestSystems, sender: ContractAddress,
        amount: u128,
    ) {
        impersonate(sender);
        (*sys.bank).sponsor_duelists(sender, amount);
        _next_block();
    }
    pub fn fund_duelists_pool(sys: @TestSystems, stater_pack_quantity: u8) -> u128 {
        // mint lords
        let sponsor: ContractAddress = starknet::contract_address_const::<0x12178517312>();
        execute_lords_faucet(sys.lords, sponsor);
        // approve lords
        let balance: u256 = (*sys.lords).balance_of(sponsor);
        execute_lords_approve(sys.lords, sponsor, *sys.bank.contract_address, balance.low);
        // fund pool
        let price_per_pack: u128 = PackType::StarterPack.descriptor().price_lords;
        let amount_sponsored: u128 = price_per_pack * stater_pack_quantity.into();
        execute_sponsor_duelists(sys, sponsor, amount_sponsored);
        (amount_sponsored)
    }
    pub fn execute_collect_season(sys: @TestSystems, sender: ContractAddress) -> u32 {
        impersonate(sender);
        let new_season_id: u32 = (*sys.bank).collect_season();
        _next_block();
        (new_season_id)
    }

    //
    // getters
    //

    #[inline(always)]
    pub fn get_Challenge_Round_value(sys: @TestSystems, duel_id: u128) -> (ChallengeValue, RoundValue) {
        let challenge: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let round: RoundValue = (*sys.store).get_round_value(duel_id);
        (challenge, round)
    }

    #[inline(always)]
    pub fn fame_balance_of_token(sys: @TestSystems, duel_id: u128) -> u128 {
        ((*sys.fame).balance_of_token((*sys.duelists).contract_address, duel_id).low)
    }

    //
    // setters
    //

    // depends on use dojo::model::{Model};
    #[inline(always)]
    pub fn set_Config(ref world: WorldStorage, model: @Config) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Duelist(ref world: WorldStorage, model: @Duelist) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_SeasonScoreboard(ref world: WorldStorage, model: @SeasonScoreboard) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_PlayerDuelistStack(ref world: WorldStorage, model: @PlayerDuelistStack) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Challenge(ref world: WorldStorage, model: @Challenge) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Pact(ref world: WorldStorage, model: @Pact) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Pack(ref world: WorldStorage, model: @Pack) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Ring(ref world: WorldStorage, model: @Ring) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_RingBalance(ref world: WorldStorage, model: @RingBalance) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_Pool(ref world: WorldStorage, model: @Pool) {
        world.write_model_test(model);
    }
    #[inline(always)]
    pub fn set_MatchPlayer(ref world: WorldStorage, model: @MatchPlayer) {
        world.write_model_test(model);
    }
    // #[inline(always)]
    // pub fn set_TournamentRound(ref world: WorldStorage, model: @TournamentRound) {
    //     world.write_model_test(model);
    // }

    pub fn set_current_season(ref sys: TestSystems, season_id: u32) {
        let mut config: Config = sys.store.get_config();
        config.current_season_id = season_id;
        set_Config(ref sys.world, @config);
    }

    pub fn make_duelist_inactive(sys: @TestSystems, duelist_id: u128, dripped_fame: u64) {
        let timestamp_active: u64 = (*sys.store).get_duelist_timestamps(duelist_id).active;
        let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP + (FAME::TIMESTAMP_TO_DRIP_ONE_FAME * dripped_fame);
        set_block_timestamp(timestamp_active + elapsed);
    }

    //
    // Protected dispatchers
    //
    pub fn _protected_duels(sys: @TestSystems) -> IDuelTokenProtectedDispatcher {
        (IDuelTokenProtectedDispatcher{contract_address: (*sys.duels).contract_address})
    }
    // pub fn _protected_tournaments(sys: @TestSystems) -> ITournamentTokenProtectedDispatcher {
    //     (ITournamentTokenProtectedDispatcher{contract_address: (*sys.tournaments).contract_address})
    // }

    //
    // Asserts
    //

    pub fn assert_fame_token_balance(sys: @TestSystems, duelist_id: u128, balance_before: u128, subtract: u128, add: u128, prefix: ByteArray) -> u128 {
        let address: ContractAddress = TokenBoundAddressTrait::address((*sys.duelists).contract_address, duelist_id);
        (assert_lords_balance(
            ILordsMockDispatcher{ contract_address: (*sys.fame).contract_address },
            address, balance_before, subtract, add, prefix,
        ))
    }

    pub fn assert_fools_balance(sys: @TestSystems, address: ContractAddress, balance_before: u128, subtract: u128, add: u128, prefix: ByteArray) -> u128 {
        (assert_lords_balance(
            ILordsMockDispatcher{ contract_address: (*sys.fools).contract_address },
            address, balance_before, subtract, add, prefix,
        ))
    }

    pub fn assert_balance(balance: u128, balance_before: u128, subtract: u128, add: u128, prefix: ByteArray) -> u128 {
        if (subtract > add) {
            assert_lt!(balance, balance_before, "{}__lt", prefix);
        } else if (add > subtract) {
            assert_gt!(balance, balance_before, "{}__gt", prefix);
        } else {
            assert_eq!(balance, balance_before, "{}__eq", prefix);
        }
        assert_eq!(balance, balance_before - subtract + add, "{}__sum", prefix);
        (balance)
    }
    pub fn assert_balance_up(balance: u128, balance_before: u128, prefix: ByteArray) -> u128 {
        assert_gt!(balance, balance_before, "{}__up", prefix);
        (balance)
    }
    pub fn assert_balance_down(balance: u128, balance_before: u128, prefix: ByteArray) -> u128 {
        assert_lt!(balance, balance_before, "{}__down", prefix);
        (balance)
    }
    pub fn assert_balance_equal(balance: u128, balance_before: u128, prefix: ByteArray) -> u128 {
        assert_eq!(balance, balance_before, "{}__equal", prefix);
        (balance)
    }

    pub fn assert_lords_balance(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, subtract: u128, add: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        (assert_balance(balance, balance_before, subtract, add, prefix))
    }
    pub fn assert_lords_balance_up(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        (assert_balance_up(balance, balance_before, prefix))
    }
    pub fn assert_lords_balance_down(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        (assert_balance_down(balance, balance_before, prefix))
    }
    pub fn assert_lords_balance_equal(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        (assert_balance_equal(balance, balance_before, prefix))
    }

    pub fn assert_fame_balance_up(fame: IFameCoinDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = fame.balance_of(address).low;
        (assert_balance_up(balance, balance_before, prefix))
    }
    pub fn assert_fame_balance_down(fame: IFameCoinDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = fame.balance_of(address).low;
        (assert_balance_down(balance, balance_before, prefix))
    }
    pub fn assert_fame_balance_equal(fame: IFameCoinDispatcher, address: ContractAddress, balance_before: u128, prefix: ByteArray) -> u128 {
        let balance: u128 = fame.balance_of(address).low;
        (assert_balance_equal(balance, balance_before, prefix))
    }

    // pub fn assert_winner_balance(lords: ILordsMockDispatcher,
    //     winner: u8,
    //     duelist_a: ContractAddress, duelist_b: ContractAddress,
    //     balance_a: u128, balance_b: u128,
    //     fee: u128, prize_value: u128,
    //     prefix: ByteArray,
    // ) {
    //     if (winner == 1) {
    //         assert_lords_balance(lords, duelist_a, balance_a, fee, prize_value, format!("A_A_{}", prefix));
    //         assert_lords_balance(lords, duelist_b, balance_b, fee + prize_value, 0, format!("A_B_{}", prefix));
    //     } else if (winner == 2) {
    //         assert_lords_balance(lords, duelist_a, balance_a, fee + prize_value, 0, format!("B_A_{}", prefix));
    //         assert_lords_balance(lords, duelist_b, balance_b, fee, prize_value, format!("B_B_{}", prefix));
    //     } else {
    //         assert_lords_balance(lords, duelist_a, balance_a, fee, 0, format!("D_A_{}", prefix));
    //         assert_lords_balance(lords, duelist_b, balance_b, fee, 0, format!("D_B_{}", prefix));
    //     }
    // }

    pub fn assert_pact(sys: @TestSystems, duel_id: u128, has_pact: bool, accepted: bool, prefix: ByteArray) -> ChallengeValue {
        (assert_pact_queue(sys, duel_id, has_pact, accepted, QueueId::Undefined, prefix))
    }

    pub fn assert_pact_queue(sys: @TestSystems, duel_id: u128, has_pact: bool, accepted: bool, queue_id: QueueId, prefix: ByteArray) -> ChallengeValue {
        assert_gt!(duel_id, 0, "assert_pact:[{}] duel_id", prefix);
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        assert_eq!((*sys.duels).has_pact(ch.duel_type, ch.address_a, ch.address_b), has_pact, "assert_pact:[{}] has_pact_a_b", prefix);
        assert_eq!((*sys.duels).has_pact(ch.duel_type, ch.address_b, ch.address_a), has_pact, "assert_pact:[{}] has_pact_b_a", prefix);
        let expected_duel_id_a: u128 = if (has_pact) {duel_id} else {0};
        let assignment_a: DuelistAssignment = (*sys.store).get_duelist_assignment(ch.duelist_id_a);
        assert_eq!(assignment_a.duel_id, expected_duel_id_a, "assert_pact:[{}] duelist_challenge_a", prefix);
        assert_eq!(assignment_a.queue_id, queue_id, "assert_pact:[{}] queue_id_a", prefix);
        let expected_duel_id_b: u128 = if (has_pact && accepted) {duel_id} else {0};
        let assignment_b: DuelistAssignment = (*sys.store).get_duelist_assignment(ch.duelist_id_b);
        assert_eq!(assignment_b.duel_id, expected_duel_id_b, "assert_pact:[{}] duelist_challenge_b", prefix);
        assert_eq!(assignment_b.queue_id, queue_id, "assert_pact:[{}] queue_id_b", prefix);
        (ch)
    }

    pub fn clear_pact(ref sys: TestSystems, duel_type: DuelType, address_a: ContractAddress, address_b: ContractAddress) {
        let p1: felt252 = address_a.into();
        let p2: felt252 = address_b.into();
        set_Pact(ref sys.world, @Pact{
            duel_type,
            pair: PactTrait::make_pair(p1.into(), p2.into()),
            duel_id: 0,
            duel_count: 0,
        });
    }

    pub fn print_pools(sys: @TestSystems, season_id: u32, prefix: ByteArray) {
        let mut fame_balance_bank: u128 = (*sys.fame).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
        let pool_claimable: Pool = (*sys.store).get_pool(PoolType::Claimable);
        let pool_purchases: Pool = (*sys.store).get_pool(PoolType::Purchases);
        let pool_peg: Pool = (*sys.store).get_pool(PoolType::FamePeg);
        let pool_season: Pool = (*sys.store).get_pool(PoolType::Season(season_id));
        let pool_flame: Pool = (*sys.store).get_pool(PoolType::Sacrifice);
        println!(">>>>>>>>>>>>>>>>>> {}",  prefix);
        println!("BANK_______________LORDS:{} FAME:{}", ETH(lords_balance_bank), ETH(fame_balance_bank));
        println!("TREASURY___________LORDS:{}", ETH(lords_balance_treasury));
        println!("Pool::Claimable____LORDS:{} FAME:{}", ETH(pool_claimable.balance_lords), ETH(pool_claimable.balance_fame));
        println!("Pool::Purchases____LORDS:{} FAME:{}", ETH(pool_purchases.balance_lords), ETH(pool_purchases.balance_fame));
        println!("Pool::FamePeg______LORDS:{} FAME:{}", ETH(pool_peg.balance_lords), ETH(pool_peg.balance_fame));
        println!("Pool::Season_______LORDS:{} FAME:{}", ETH(pool_season.balance_lords), ETH(pool_season.balance_fame));
        println!("Pool::Sacrifice__LORDS:{} FAME:{}", ETH(pool_flame.balance_lords), ETH(pool_flame.balance_fame));
    }

    //------------------------------------
    // assert results by Rules
    //

    fn _assert_ranked_balances(sys: @TestSystems, ch: ChallengeValue, prefix: ByteArray) {
        assert_ne!(ch.state, ChallengeState::InProgress, "_assert_ranked_balances:[{}] state", prefix);
        assert_ne!(ch.season_id, 0, "_assert_ranked_balances:[{}] season_id", prefix);
        assert_gt!(ch.lives_staked, 0, "_assert_ranked_balances:[{}] lives_staked", prefix); // must have stakes
        let winner_fame: u128 = FAME::MINT_GRANT_AMOUNT.into();
        let loser_fame: u128 = (FAME::MINT_GRANT_AMOUNT - (ch.lives_staked.into() * FAME::ONE_LIFE)).into();
        if (ch.winner == 1) {
            assert_gt!((*sys.fools).balance_of(ch.address_a), 0, "_assert_ranked_balances:[{}] fools A (winner)", prefix);
            assert_eq!((*sys.fools).balance_of(ch.address_b), 0, "_assert_ranked_balances:[{}] fools B (loser)", prefix);
            assert_gt!((*sys.duelists).fame_balance(ch.duelist_id_a), winner_fame, "_assert_ranked_balances:[{}] fame A (winner)", prefix);
            assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_b), loser_fame, "_assert_ranked_balances:[{}] fame B (loser)", prefix);
        } else if (ch.winner == 2) {
            assert_eq!((*sys.fools).balance_of(ch.address_a), 0, "_assert_ranked_balances:[{}] fools A (loser)", prefix);
            assert_gt!((*sys.fools).balance_of(ch.address_b), 0, "_assert_ranked_balances:[{}] fools B (winner)", prefix);
            assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_a), loser_fame, "_assert_ranked_balances:[{}] fame A (loser)", prefix);
            assert_gt!((*sys.duelists).fame_balance(ch.duelist_id_b), winner_fame, "_assert_ranked_balances:[{}] fame B (winner)", prefix);
        } else {
            assert_eq!((*sys.fools).balance_of(ch.address_a), 0, "_assert_ranked_balances:[{}] fools A (draw)", prefix);
            assert_eq!((*sys.fools).balance_of(ch.address_b), 0, "_assert_ranked_balances:[{}] fools B (draw)", prefix);
            assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_a), loser_fame, "_assert_ranked_balances:[{}] fame A (draw)", prefix);
            assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_b), loser_fame, "_assert_ranked_balances:[{}] fame B (draw)", prefix);
        }
    }
    fn _assert_practice_balances(sys: @TestSystems, ch: ChallengeValue, prefix: ByteArray) {
        assert_ne!(ch.state, ChallengeState::InProgress, "_assert_practice_balances:[{}] state", prefix);
        assert_ne!(ch.season_id, 0, "_assert_practice_balances:[{}] season_id", prefix);
        assert_ne!(ch.winner, 0, "_assert_practice_balances:[{}] winner", prefix); // must have a winner to be a valid test
        assert_eq!((*sys.fools).balance_of(ch.address_a), 0, "_assert_practice_balances:[{}] fools A", prefix);
        assert_eq!((*sys.fools).balance_of(ch.address_b), 0, "_assert_practice_balances:[{}] fools B", prefix);
        assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_a), FAME::MINT_GRANT_AMOUNT.into(), "_assert_practice_balances:[{}] fame A (loser)", prefix);
        assert_eq!((*sys.duelists).fame_balance(ch.duelist_id_b), FAME::MINT_GRANT_AMOUNT.into(), "_assert_practice_balances:[{}] fame B (winner)", prefix);
    }
    fn _assert_ranked_scores(sys: @TestSystems, ch: ChallengeValue, prefix: ByteArray) {
        let score_a: SeasonScoreboard = (*sys.store).get_scoreboard(ch.season_id, ch.duelist_id_a.into());
        let score_b: SeasonScoreboard = (*sys.store).get_scoreboard(ch.season_id, ch.duelist_id_b.into());
        assert_gt!(score_a.points, 0, "_assert_ranked_scores:[{}] score_a.points", prefix);
        assert_gt!(score_b.points, 0, "_assert_ranked_scores:[{}] score_b.points", prefix);
    }
    fn _assert_unranked_scores(sys: @TestSystems, ch: ChallengeValue, prefix: ByteArray) {
        let score_a: SeasonScoreboard = (*sys.store).get_scoreboard(ch.season_id, ch.duelist_id_a.into());
        let score_b: SeasonScoreboard = (*sys.store).get_scoreboard(ch.season_id, ch.duelist_id_b.into());
        assert_eq!(score_a.points, 0, "_assert_unranked_scores:[{}] score_a.points", prefix);
        assert_eq!(score_b.points, 0, "_assert_unranked_scores:[{}] score_b.points", prefix);
    }

    pub fn assert_ranked_duel_results(sys: @TestSystems, duel_id: u128, mut prefix: ByteArray) {
        prefix = format!("RANKED/{}", prefix);
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let rules: Rules = ch.duel_type.get_rules(sys.store);
        assert_eq!(rules, Rules::Season, "assert_ranked_duel_results:[{}] Rules::Season", prefix);
        assert_eq!(rules, (*sys.store).get_current_season_rules(), "assert_ranked_duel_results:[{}] get_current_season_rules()", prefix);
        _assert_ranked_balances(sys, ch, prefix.clone());
        _assert_ranked_scores(sys, ch, prefix.clone());
    }
    pub fn assert_unranked_duel_results(sys: @TestSystems, duel_id: u128, mut prefix: ByteArray) {
        prefix = format!("UNRANKED/{}", prefix);
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let rules: Rules = ch.duel_type.get_rules(sys.store);
        assert_eq!(rules, Rules::Unranked, "assert_unranked_duel_results:[{}] unranked rules", prefix);
        _assert_ranked_balances(sys, ch, prefix.clone());
        _assert_unranked_scores(sys, ch, prefix.clone());
    }
    pub fn assert_practice_duel_results(sys: @TestSystems, duel_id: u128, mut prefix: ByteArray) {
        prefix = format!("PRACTICE/{}", prefix);
        let ch: ChallengeValue = (*sys.store).get_challenge_value(duel_id);
        let rules: Rules = ch.duel_type.get_rules(sys.store);
        assert_eq!(rules, Rules::Undefined, "assert_practice_duel_results:[{}] practice rules", prefix);
        _assert_practice_balances(sys, ch, prefix.clone());
        _assert_unranked_scores(sys, ch, prefix.clone());
    }

}
