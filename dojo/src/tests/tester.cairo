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
        tutorial::{tutorial, ITutorialDispatcher, ITutorialDispatcherTrait},
        rng::{rng, IRngDispatcher, IRngDispatcherTrait},
        rng_mock::{rng_mock, m_MockedValue, IRngMockDispatcher, IRngMockDispatcherTrait},
        vrf_mock::{vrf_mock},
        tokens::{
            duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
            duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
            pack_token::{pack_token, IPackTokenDispatcher, IPackTokenDispatcherTrait},
            fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
            fools_coin::{fools_coin, IFoolsCoinDispatcher, IFoolsCoinDispatcherTrait},
            lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
        },
        components::{
            token_bound::{m_TokenBoundAddress, TokenBoundAddress, TokenBoundAddressTrait},
        },
    };
    pub use pistols::models::{
        player::{
            m_Player, Player,
            e_PlayerActivity,
            e_PlayerRequiredAction,
        },
        pack::{
            m_Pack, Pack, PackType, PackTypeTrait,
        },
        challenge::{
            m_Challenge, Challenge, ChallengeValue,
            m_Round, RoundValue,
            DuelistState,
            e_ChallengeRewards,
        },
        duelist::{
            m_Duelist, Duelist, DuelistValue,
            m_DuelistChallenge, DuelistChallenge,
            m_Scoreboard, Scoreboard,
            m_DuelistMemorial, DuelistMemorial, DuelistMemorialValue, CauseOfDeath,
        },
        leaderboard::{
            m_Leaderboard, Leaderboard, LeaderboardTrait, LeaderboardPosition
        },
        pact::{
            m_Pact,
        },
        config::{
            m_Config, Config,
            m_TokenConfig, TokenConfig,
            m_CoinConfig, CoinConfig,
            CONFIG,
        },
        season::{
            m_SeasonConfig, SeasonConfig, SeasonManagerTrait,
        },
        table::{
            m_TableConfig, TableConfig,
        },
        pool::{
            m_Pool, Pool, PoolType,
        },
    };

    // use pistols::tests::mock_account::DualCaseAccountMock;
    use pistols::tests::token::mock_duelist::{
        duelist_token as mock_duelist,
        m_MockDuelistOwners,
    };

    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::constants::{CONST, FAME};
    use pistols::types::premise::{Premise};
    use pistols::utils::byte_arrays::{BoolToString};
    use pistols::utils::misc::{ContractAddressIntoU256};
    use pistols::utils::short_string::{ShortString};
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
    pub fn OWNER()     -> ContractAddress { starknet::contract_address_const::<0x1>() } // duelists 1-2
    pub fn OWNER2()    -> ContractAddress { starknet::contract_address_const::<0x2>() } // duelists 1-2
    pub fn OTHER()     -> ContractAddress { starknet::contract_address_const::<0x3>() } // duelists 3-4
    pub fn OTHER2()    -> ContractAddress { starknet::contract_address_const::<0x4>() } // duelists 3-4
    pub fn BUMMER()    -> ContractAddress { starknet::contract_address_const::<0x5>() } // duelists 5-6
    pub fn RECIPIENT() -> ContractAddress { starknet::contract_address_const::<0x222>() }
    pub fn SPENDER()   -> ContractAddress { starknet::contract_address_const::<0x333>() }
    pub fn TREASURY()  -> ContractAddress { starknet::contract_address_const::<0x444>() }
    // low part is owned token, but different address
    pub fn FAKE_OWNER_OF_1() -> ContractAddress { starknet::contract_address_const::<0x1234000000000000000000000000000000001>() }
    pub fn FAKE_OWNER_OF_2() -> ContractAddress { starknet::contract_address_const::<0x2234000000000000000000000000000000002>() }
    // hard-coded owners
    pub fn OWNED_BY_OWNER() -> u128 { 0xeeee }
    pub fn OWNED_BY_OTHER() -> u128 { 0xdddd }

    pub const FAUCET_AMOUNT: u128 = 10_000_000_000_000_000_000_000;

    #[inline(always)]
    pub fn WEI(value: u128) -> u128 {
        (value * CONST::ETH_TO_WEI.low)
    }
    #[inline(always)]
    pub fn ETH(value: u128) -> u128 {
        (value / CONST::ETH_TO_WEI.low)
    }

    #[inline(always)]
    pub fn ID(address: ContractAddress) -> u128 {
        let as_u256: u256 = address.into();
        (as_u256.low)
    }

    #[inline(always)]
    pub fn SEASON_TABLE(season_id: u16) -> felt252 {
        (SeasonManagerTrait::make_table_id(season_id))
    }
    #[inline(always)]
    pub fn SEASON_1_TABLE() -> felt252 {
        (SEASON_TABLE(1))
    }

    // set_contract_address : to define the address of the calling contract,
    // set_account_contract_address : to define the address of the account used for the current transaction.
    pub fn impersonate(address: ContractAddress) {
        testing::set_contract_address(address);
        testing::set_account_contract_address(address);
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

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const TIMESTEP: u64 = 0x1;

    pub mod FLAGS {
        pub const GAME: u16     = 0b1;
        pub const ADMIN: u16    = 0b10;
        pub const LORDS: u16    = 0b100;
        pub const DUEL: u16     = 0b1000;
        pub const DUELIST: u16  = 0b10000;
        pub const APPROVE: u16  = 0b100000;
        pub const MOCK_RNG: u16 = 0b1000000;
        pub const TUTORIAL: u16 = 0b10000000;
        pub const FAME: u16     = 0b100000000;
        pub const ACCOUNT: u16  = 0b1000000000;
    }

    #[derive(Copy, Drop)]
    pub struct TestSystems {
        pub world: WorldStorage,
        pub store: Store,
        pub game: IGameDispatcher,
        pub tut: ITutorialDispatcher,
        pub admin: IAdminDispatcher,
        pub bank: IBankDispatcher,
        pub lords: ILordsMockDispatcher,
        pub fame: IFameCoinDispatcher,
        pub fools: IFoolsCoinDispatcher,
        pub duels: IDuelTokenDispatcher,
        pub duelists: IDuelistTokenDispatcher,
        pub pack: IPackTokenDispatcher,
        pub rng: IRngMockDispatcher,
        pub account: ContractAddress,
    }

    #[generate_trait]
    pub impl TestSystemsImpl of TestSystemsTrait {
        #[inline(always)]
        fn from_world(world: WorldStorage, mock_account: ContractAddress) -> TestSystems {
            (TestSystems {
                world,
                game: world.game_dispatcher(),
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
                rng: IRngMockDispatcher{ contract_address: world.rng_address() },
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
        let mut deploy_bank: bool = false;
        let mut deploy_pack: bool = false;
        let mut deploy_fools: bool = false;
        let mut deploy_vrf: bool = false;
        
        deploy_game     = deploy_game || approve;
        deploy_lords    = deploy_lords || deploy_game || deploy_duelist || approve;
        deploy_admin    = deploy_admin || deploy_game || deploy_lords;
        deploy_duel     = deploy_duel || deploy_game;
        deploy_pack     = deploy_pack || deploy_duelist;
        deploy_fame     = deploy_fame || deploy_game || deploy_duelist;
        deploy_fools    = deploy_fools || deploy_game;
        deploy_rng_mock = deploy_rng_mock || deploy_tutorial;
        deploy_bank     = deploy_bank || deploy_fame || deploy_lords || deploy_duelist;
        deploy_vrf      = deploy_vrf || deploy_game || deploy_pack;
        
// println!("---- 0");
        let mut resources: Array<TestResource> = array![
            // pistols models
            TestResource::Model(m_Player::TEST_CLASS_HASH),
            TestResource::Model(m_Pack::TEST_CLASS_HASH),
            TestResource::Model(m_Challenge::TEST_CLASS_HASH),
            TestResource::Model(m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(m_Config::TEST_CLASS_HASH),
            TestResource::Model(m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(m_DuelistChallenge::TEST_CLASS_HASH),
            TestResource::Model(m_DuelistMemorial::TEST_CLASS_HASH),
            TestResource::Model(m_Pact::TEST_CLASS_HASH),
            TestResource::Model(m_Round::TEST_CLASS_HASH),
            TestResource::Model(m_Scoreboard::TEST_CLASS_HASH),
            TestResource::Model(m_Leaderboard::TEST_CLASS_HASH),
            TestResource::Model(m_SeasonConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TableConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenBoundAddress::TEST_CLASS_HASH),
            TestResource::Model(m_Pool::TEST_CLASS_HASH),
            // events
            TestResource::Event(achievement::events::index::e_TrophyCreation::TEST_CLASS_HASH),
            TestResource::Event(achievement::events::index::e_TrophyProgression::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
            TestResource::Event(e_PlayerRequiredAction::TEST_CLASS_HASH),
            TestResource::Event(e_ChallengeRewards::TEST_CLASS_HASH),
        ];
        if (deploy_rng_mock) {
            resources.append(TestResource::Model(m_MockedValue::TEST_CLASS_HASH));
        }
        if (!deploy_duelist && deploy_game) {
            resources.append(TestResource::Model(m_MockDuelistOwners::TEST_CLASS_HASH));
        }

        let mut contract_defs: Array<ContractDef> = array![];

        if (deploy_game) {
            resources.append(TestResource::Contract(game::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"game")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
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
                        0, // fee_amount
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
        else if (deploy_game) {
            resources.append(TestResource::Contract(mock_duelist::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duelist_token")
                    .with_writer_of([selector_from_tag!("pistols-MockDuelistOwners")].span())
            );
        }

        if (deploy_duelist) {
            resources.append(TestResource::Contract(pack_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"pack_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'http://localhost:3000',
                    ].span()),
            );
        }

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
                    .with_writer_of([selector_from_tag!("pistols-Pool")].span())
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

// println!("---- 1");
        let mut world: WorldStorage = spawn_test_world([namespace_def].span());
// println!("---- 2");

        world.sync_perms_and_inits(contract_defs.span());
// println!("---- 3");

        // initializers
// println!("---- 4");
        if (deploy_admin) {
            world.dispatcher.grant_owner(selector_from_tag!("pistols-admin"), OWNER());
        }
// println!("---- 5");
        if (deploy_lords) {
            let lords = world.lords_mock_dispatcher();
            execute_lords_faucet(@lords, OWNER());
            execute_lords_faucet(@lords, OTHER());
// println!("---- 6");
            if (approve) {
                let spender = world.bank_address();
                execute_lords_approve(@lords, OWNER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, OTHER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, BUMMER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
            }
        }
// println!("---- 7");

        let mock_account: ContractAddress = if (deploy_account) {
            (deploy_mock_account())
        } else {
            ZERO()
        };


        impersonate(OWNER());

// println!("READY!");
        (TestSystemsTrait::from_world(world, mock_account))
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
        assert_ge!(new_timestamp, starknet::get_block_timestamp(), "<<< Back in time...");
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
    pub fn execute_admin_grant_admin(system: @IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, granted: bool) {
        impersonate(sender);
        (*system).grant_admin(owner_address, granted);
        _next_block();
    }
    pub fn execute_admin_set_treasury(system: @IAdminDispatcher, sender: ContractAddress, new_treasury_address: ContractAddress) {
        impersonate(sender);
        (*system).set_treasury(new_treasury_address);
        _next_block();
    }
    pub fn execute_admin_set_paused(system: @IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        (*system).set_paused(paused);
        _next_block();
    }
    pub fn execute_admin_set_table(system: @IAdminDispatcher, sender: ContractAddress, table: TableConfig) {
        impersonate(sender);
        (*system).set_table(table);
        _next_block();
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
    pub fn execute_claim_starter_pack(system: @IPackTokenDispatcher, sender: ContractAddress) -> Span<u128> {
        impersonate(sender);
        let token_ids: Span<u128> = (*system).claim_starter_pack();
        _next_block();
        (token_ids)
    }

    // ::duelist_token
    pub fn execute_transfer_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress,
        to: ContractAddress,
        token_id: u128,
    ) {
        impersonate(sender);
        (*system).transfer_from(sender, to, token_id.into());
        _next_block();
    }

    // ::duel_token
    pub fn execute_create_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
        lives_staked: u8,
    ) -> u128 {
        (execute_create_duel_ID(system, sender, ID(sender), challenged, quote, table_id, expire_hours, lives_staked))
    }
    pub fn execute_create_duel_ID(system: @IDuelTokenDispatcher, sender: ContractAddress,
        token_id: u128,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
        lives_staked: u8,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*system).create_duel(token_id, challenged, Premise::Nothing, quote, table_id, expire_hours, lives_staked);
        _next_block();
        (duel_id)
    }
    pub fn execute_reply_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        impersonate(sender);
        let new_state: ChallengeState = (*system).reply_duel(token_id, duel_id, accepted);
        _next_block();
        (new_state)
    }

    // ::game
    pub fn execute_commit_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        hash: u128,
    ) {
        execute_commit_moves_ID(system, sender, ID(sender), duel_id, hash);
    }
    pub fn execute_commit_moves_ID(system: @IGameDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        hash: u128,
    ) {
        impersonate(sender);
        (*system).commit_moves(token_id, duel_id, hash);
        _next_block();
    }
    pub fn execute_reveal_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        execute_reveal_moves_ID(system, sender, ID(sender), duel_id, salt, moves);
    }
    pub fn execute_reveal_moves_ID(system: @IGameDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*system).reveal_moves(token_id, duel_id, salt, moves);
        _next_block();
    }
    pub fn execute_collect_duel(system: @IGameDispatcher, sender: ContractAddress, duel_id: u128) {
        impersonate(sender);
        (*system).collect_duel(duel_id);
        _next_block();
    }
    pub fn execute_collect_season(system: @IGameDispatcher, sender: ContractAddress) -> felt252 {
        impersonate(sender);
        let new_table_id: felt252 = (*system).collect_season();
        _next_block();
        (new_table_id)
    }

    // ::tutorial
    pub fn execute_create_tutorial(system: @ITutorialDispatcher, sender: ContractAddress,
        tutorial_id: u128,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*system).create_tutorial(ID(sender), tutorial_id);
        _next_block();
        (duel_id)
    }
    pub fn execute_commit_moves_tutorial(system: @ITutorialDispatcher, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        hashed: u128,
    ) {
        impersonate(sender);
        (*system).commit_moves(duelist_id, duel_id, hashed);
        _next_block();
    }
    pub fn execute_reveal_moves_tutorial(system: @ITutorialDispatcher, sender: ContractAddress,
        duelist_id: u128,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*system).reveal_moves(duelist_id, duel_id, salt, moves);
        _next_block();
    }

    // ::bank
    pub fn execute_sponsor_duelists(system: @IBankDispatcher, sender: ContractAddress,
        amount: u128,
    ) {
        impersonate(sender);
        (*system).sponsor_duelists(sender, amount);
        _next_block();
    }
    pub fn fund_duelists_pool(sys: @TestSystems, quantity: u8) {
        // mint lords
        let sponsor: ContractAddress = starknet::contract_address_const::<0x12178517312>();
        execute_lords_faucet(sys.lords, sponsor);
        // approve lords
        let balance: u256 = (*sys.lords).balance_of(sponsor);
        execute_lords_approve(sys.lords, sponsor, *sys.bank.contract_address, balance.low);
        // fund pool
        let price: u128 = PackType::StarterPack.description().price_lords;
        execute_sponsor_duelists(sys.bank, sponsor, price * quantity.into());
    }

    //
    // getters
    //

    #[inline(always)]
    pub fn get_Challenge_Round(sys: @TestSystems, duel_id: u128) -> (ChallengeValue, RoundValue) {
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
    pub fn set_Config(ref world: WorldStorage, model: @Config) {
        world.write_model_test(model);
    }
    pub fn set_TableConfig(ref world: WorldStorage, model: @TableConfig) {
        world.write_model_test(model);
    }
    pub fn set_Duelist(ref world: WorldStorage, model: @Duelist) {
        world.write_model_test(model);
    }
    pub fn set_Scoreboard(ref world: WorldStorage, model: @Scoreboard) {
        world.write_model_test(model);
    }
    pub fn set_Challenge(ref world: WorldStorage, model: @Challenge) {
        world.write_model_test(model);
    }
    pub fn set_Pack(ref world: WorldStorage, model: @Pack) {
        world.write_model_test(model);
    }

    pub fn set_current_season(ref sys: TestSystems, table_id: felt252) {
        let mut config: Config = sys.store.get_config();
        config.season_table_id = table_id;
        set_Config(ref sys.world, @config);
    }

    pub fn make_duelist_inactive(sys: @TestSystems, token_id: u128, dripped_fame: u64) {
        let timestamp_active: u64 = (*sys.store).get_duelist_value(token_id).timestamps.active;
        let elapsed: u64 = FAME::MAX_INACTIVE_TIMESTAMP + (FAME::TIMESTAMP_TO_DRIP_ONE_FAME * dripped_fame);
        set_block_timestamp(timestamp_active + elapsed);
    }

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

    pub fn assert_pact(sys: @TestSystems, duel_id: u128, ch: ChallengeValue, has_pact: bool, accepted: bool, prefix: ByteArray) {
        assert!((*sys.duels).has_pact(ch.table_id, ch.address_a, ch.address_b) == has_pact,
            "[{}] _assert_pact() not [{}]", prefix, has_pact.to_string()
        );
        assert!((*sys.duels).has_pact(ch.table_id, ch.address_b, ch.address_a) == has_pact,
            "[{}] __assert_pact() not [{}]", prefix, has_pact.to_string()
        );
        let expected_duel_id: u128 = if (has_pact) {duel_id} else {0};
        let duelist_duel_id: u128 = (*sys.store).get_duelist_challenge(ch.duelist_id_a).duel_id;
        assert!(duelist_duel_id == expected_duel_id,
            "[{}] duelist_challenge_a: [{}] not [{}]", prefix, duelist_duel_id, expected_duel_id
        );
        let expected_duel_id: u128 = if (has_pact && accepted) {duel_id} else {0};
        let duelist_duel_id: u128 = (*sys.store).get_duelist_challenge(ch.duelist_id_b).duel_id;
        assert!(duelist_duel_id == expected_duel_id,
            "[{}] duelist_challenge_b: [{}] not [{}]", prefix, duelist_duel_id, expected_duel_id
        );
    }

    pub fn print_pools(sys: @TestSystems, season_id: u16, prefix: ByteArray) {
        let mut fame_balance_bank: u128 = (*sys.fame).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_bank: u128 = (*sys.lords).balance_of(*sys.bank.contract_address).low;
        let mut lords_balance_treasury: u128 = (*sys.lords).balance_of(TREASURY()).low;
        let pool_purchases: Pool = (*sys.store).get_pool(PoolType::Purchases);
        let pool_peg: Pool = (*sys.store).get_pool(PoolType::FamePeg);
        let pool_season: Pool = (*sys.store).get_pool(PoolType::Season(SEASON_TABLE(season_id)));
        let pool_flame: Pool = (*sys.store).get_pool(PoolType::SacredFlame);
        println!(">>>>>>>>>>>>>>>>>> {}",  prefix);
        println!("BANK_______________LORDS:{} FAME:{}", ETH(lords_balance_bank), ETH(fame_balance_bank));
        println!("TREASURY___________LORDS:{}", ETH(lords_balance_treasury));
        println!("Pool::Purchases____LORDS:{} FAME:{}", ETH(pool_purchases.balance_lords), ETH(pool_purchases.balance_fame));
        println!("Pool::FamePeg______LORDS:{} FAME:{}", ETH(pool_peg.balance_lords), ETH(pool_peg.balance_fame));
        println!("Pool::Season_______LORDS:{} FAME:{}", ETH(pool_season.balance_lords), ETH(pool_season.balance_fame));
        println!("Pool::SacredFlame__LORDS:{} FAME:{}", ETH(pool_flame.balance_lords), ETH(pool_flame.balance_fame));
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
}
