#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing, get_caller_address};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{WorldStorage, WorldStorageTrait, IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
    use dojo_cairo_test::{
        spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
        WorldStorageTestTrait,
    };

    pub use pistols::systems::{
        bank::{bank, IBankDispatcher, IBankDispatcherTrait},
        admin::{admin, IAdminDispatcher, IAdminDispatcherTrait},
        game::{game, IGameDispatcher, IGameDispatcherTrait},
        rng::{rng},
        vrf_mock::{vrf_mock},
        tokens::{
            duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
            duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
            fame_coin::{fame_coin, IFameCoinDispatcher, IFameCoinDispatcherTrait},
            lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
        },
        components::{
            token_bound::{m_TokenBoundAddress, TokenBoundAddress, TokenBoundAddressTrait},
        },
    };
    use pistols::models::{
        player::{
            m_Player, Player,
            e_PlayerActivity, PlayerActivity,
        },
        pack::{
            m_Pack, Pack,
        },
        challenge::{
            m_Challenge, Challenge, ChallengeValue,
            m_ChallengeFameBalance, ChallengeFameBalance, ChallengeFameBalanceValue,
            m_Round, Round, RoundValue,
            DuelistState, DuelistStateTrait,
        },
        duelist::{
            m_Duelist, Duelist, DuelistTrait, DuelistValue,
            m_Pact, Pact, PactValue,
            m_Scoreboard, Scoreboard, ScoreboardValue,
            Score, ProfilePicType, Archetype
        },
        payment::{
            m_Payment, Payment,
        },
        config::{
            m_Config, Config, ConfigValue,
            m_TokenConfig, TokenConfig, TokenConfigValue,
            m_CoinConfig, CoinConfig, CoinConfigValue,
            CONFIG,
        },
        table::{
            m_TableConfig, TableConfig, TableConfigValue,
            m_TableAdmittance, TableAdmittance, TableAdmittanceValue,
        },
        table::{TABLES},
    };
    use pistols::tests::token::mock_duelist::{
        duelist_token as mock_duelist,
        m_MockDuelistOwners,
    };
    use pistols::tests::mock_rng::{
        rng as mock_rng,
        IRngDispatcher, IRngDispatcherTrait,
        m_SaltValue,
    };

    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::constants::{CONST};
    use pistols::types::premise::{Premise};
    use pistols::utils::arrays::{ArrayUtilsTrait, SpanUtilsTrait};
    use pistols::utils::short_string::{ShortString};
    use pistols::interfaces::systems::{SystemsTrait, SELECTORS};

    
    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    fn ZERO() -> ContractAddress { starknet::contract_address_const::<0x0>() }
    fn OWNER() -> ContractAddress { starknet::contract_address_const::<0x1>() }
    fn OTHER() -> ContractAddress { starknet::contract_address_const::<0x2>() }
    fn BUMMER() -> ContractAddress { starknet::contract_address_const::<0x3>() }
    fn RECIPIENT() -> ContractAddress { starknet::contract_address_const::<0x4>() }
    fn SPENDER() -> ContractAddress { starknet::contract_address_const::<0x5>() }
    fn TREASURY() -> ContractAddress { starknet::contract_address_const::<0x444>() }
    fn BIG_BOY() -> ContractAddress { starknet::contract_address_const::<0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243>() }
    fn LITTLE_BOY()  -> ContractAddress { starknet::contract_address_const::<0xffff00000000000ee>() }
    fn LITTLE_GIRL() -> ContractAddress { starknet::contract_address_const::<0xaaaa00000000000bb>() }
    fn FAKE_OWNER_1_1() -> ContractAddress { starknet::contract_address_const::<0x1000000000000000000000000000000001>() }
    fn FAKE_OWNER_1_2() -> ContractAddress { starknet::contract_address_const::<0x1000000000000000000000000000000002>() }
    fn FAKE_OWNER_2_1() -> ContractAddress { starknet::contract_address_const::<0x2000000000000000000000000000000001>() }
    fn FAKE_OWNER_2_2() -> ContractAddress { starknet::contract_address_const::<0x2000000000000000000000000000000002>() }
    // always owned tokens: 0xffff, 0xaaaa
    fn OWNED_BY_LITTLE_BOY()-> ContractAddress { starknet::contract_address_const::<0xffff>() }
    fn OWNED_BY_LITTLE_GIRL() -> ContractAddress { starknet::contract_address_const::<0xaaaa>() }

    fn ID(address: ContractAddress) -> u128 {
        (DuelistTrait::address_as_id(address))
    }

    // set_contract_address : to define the address of the calling contract,
    // set_account_contract_address : to define the address of the account used for the current transaction.
    fn impersonate(address: ContractAddress) {
        testing::set_contract_address(address);
        testing::set_account_contract_address(address);
    }

    #[inline(always)]
    fn _assert_is_alive(state: DuelistState, msg: felt252) {
        assert(state.health > 0, msg);
    }
    #[inline(always)]
    fn _assert_is_dead(state: DuelistState, msg: felt252) {
        assert(state.health == 0, msg);
    }


    //-------------------------------
    // Test world

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    mod FLAGS {
        const GAME: u8       = 0b0000001;
        const ADMIN: u8      = 0b0000010;
        const LORDS: u8      = 0b0000100;
        const DUEL: u8       = 0b0001000;
        const DUELIST: u8    = 0b0010000;
        const APPROVE: u8    = 0b0100000;
        const MOCK_RNG: u8   = 0b1000000;
    }

    #[derive(Copy, Drop)]
    pub struct TestSystems {
        world: WorldStorage,
        game: IGameDispatcher,
        admin: IAdminDispatcher,
        lords: ILordsMockDispatcher,
        fame: IFameCoinDispatcher,
        duels: IDuelTokenDispatcher,
        duelists: IDuelistTokenDispatcher,
        rng: IRngDispatcher,
    }

    fn setup_world(flags: u8) -> TestSystems {
        let mut deploy_game: bool = (flags & FLAGS::GAME) != 0;
        let mut deploy_admin: bool = (flags & FLAGS::ADMIN) != 0;
        let mut deploy_lords: bool = (flags & FLAGS::LORDS) != 0;
        let mut deploy_duel: bool = (flags & FLAGS::DUEL) != 0;
        let mut deploy_duelist: bool = (flags & FLAGS::DUELIST) != 0;
        let mut deploy_mock_rng = (flags & FLAGS::MOCK_RNG) != 0;
        let mut approve: bool = (flags & FLAGS::APPROVE) != 0;
        let mut deploy_bank: bool = false;
        let mut deploy_fame: bool = false;

        deploy_game = deploy_game || approve;
        deploy_admin = deploy_admin || deploy_game;
        deploy_lords = deploy_lords || deploy_game || deploy_duelist || approve;
        deploy_duel = deploy_duel || deploy_game;
        deploy_bank = deploy_bank || deploy_lords || deploy_duelist;
        deploy_fame = deploy_fame || deploy_game || deploy_duelist;
        
// '---- 0'.print();
        let mut resources: Array<TestResource> = array![
            // pistols models
            TestResource::Model(m_Player::TEST_CLASS_HASH),
            TestResource::Model(m_Pack::TEST_CLASS_HASH),
            TestResource::Model(m_Challenge::TEST_CLASS_HASH),
            TestResource::Model(m_ChallengeFameBalance::TEST_CLASS_HASH),
            TestResource::Model(m_CoinConfig::TEST_CLASS_HASH),
            TestResource::Model(m_Config::TEST_CLASS_HASH),
            TestResource::Model(m_Duelist::TEST_CLASS_HASH),
            TestResource::Model(m_Pact::TEST_CLASS_HASH),
            TestResource::Model(m_Payment::TEST_CLASS_HASH),
            TestResource::Model(m_Round::TEST_CLASS_HASH),
            TestResource::Model(m_Scoreboard::TEST_CLASS_HASH),
            TestResource::Model(m_TableAdmittance::TEST_CLASS_HASH),
            TestResource::Model(m_TableConfig::TEST_CLASS_HASH),
            TestResource::Model(m_TokenBoundAddress::TEST_CLASS_HASH),
            TestResource::Model(m_TokenConfig::TEST_CLASS_HASH),
            // events
            TestResource::Event(e_PlayerActivity::TEST_CLASS_HASH),
        ];
        if (deploy_mock_rng) {
            resources.append(TestResource::Model(m_SaltValue::TEST_CLASS_HASH));
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
            resources.append(TestResource::Contract(vrf_mock::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"vrf_mock")
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
                        'pistols.underware.gg',
                        0, // minter_address
                        0, // renderer_address
                        0, // fee_amount
                    ].span())
            );
        }

        // '---- 3'.print();
        if (deploy_duelist) {
            resources.append(TestResource::Contract(duelist_token::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duelist_token")
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
                    .with_init_calldata([
                        'pistols.underware.gg',
                        0, // minter_address
                        0, // renderer_address
                        100_000_000_000_000_000_000, // fee_amount: 100 Lords
                    ].span())
            );
        }
        else if (deploy_game) {
            resources.append(TestResource::Contract(mock_duelist::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"duelist_token")
                    .with_writer_of([
                        selector_from_tag!("pistols-MockDuelistOwners"),
                    ].span())
            );
        }

        if (deploy_lords) {
            resources.append(TestResource::Contract(lords_mock::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"lords_mock")
                    .with_writer_of([
                        selector_from_tag!("pistols-CoinConfig"),
                    ].span())
                    .with_init_calldata([
                        // game.contract_address.into(), // minter
                        0, // minter
                        10_000_000_000_000_000_000_000, // faucet_amount: 10,000 Lords
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
                    .with_writer_of([dojo::utils::bytearray_hash(@"pistols")].span())
            );
        }

        if (deploy_mock_rng) {
            resources.append(TestResource::Contract(mock_rng::TEST_CLASS_HASH));
            contract_defs.append(
                ContractDefTrait::new(@"pistols", @"rng")
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

// '---- 1'.print();
        let mut world: WorldStorage = spawn_test_world([namespace_def].span());
// '---- 2'.print();

        world.sync_perms_and_inits(contract_defs.span());
// '---- 3'.print();

        // initializers
// '---- 4'.print();
        if (deploy_admin) {
            world.dispatcher.grant_owner(selector_from_tag!("pistols-admin"), OWNER());
        }
// '---- 5'.print();
        if (deploy_lords) {
            let lords = world.lords_mock_dispatcher();
            execute_lords_faucet(@lords, OWNER());
            execute_lords_faucet(@lords, OTHER());
// '---- 6'.print();
            if (approve) {
                let spender = world.bank_address();
                execute_lords_approve(@lords, OWNER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, OTHER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
                execute_lords_approve(@lords, BUMMER(), spender, 1_000_000 * CONST::ETH_TO_WEI.low);
            }
        }
// '---- 7'.print();

        // setup testing
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);
        impersonate(OWNER());

// '---- READY!'.print();
        (TestSystems {
            world,
            game: world.game_dispatcher(),
            admin: world.admin_dispatcher(),
            lords: world.lords_mock_dispatcher(),
            fame: world.fame_coin_dispatcher(),
            duels: world.duel_token_dispatcher(),
            duelists: world.duelist_token_dispatcher(),
            rng: IRngDispatcher{ contract_address: world.rng_address() },
        })
    }

    fn elapse_timestamp(delta: u64) -> (u64, u64) {
        let block_info = starknet::get_block_info().unbox();
        let new_block_number = block_info.block_number + 1;
        let new_block_timestamp = block_info.block_timestamp + delta;
        testing::set_block_number(new_block_number);
        testing::set_block_timestamp(new_block_timestamp);
        (new_block_number, new_block_timestamp)
    }

    #[inline(always)]
    fn get_block_number() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_number)
    }

    #[inline(always)]
    fn get_block_timestamp() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_timestamp)
    }

    #[inline(always)]
    fn _next_block() -> (u64, u64) {
        elapse_timestamp(INITIAL_STEP)
    }

    //
    // execute calls
    //

    // ::admin
    fn execute_admin_grant_admin(system: @IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, granted: bool) {
        impersonate(sender);
        (*system).grant_admin(owner_address, granted);
        _next_block();
    }
    fn execute_admin_set_treasury(system: @IAdminDispatcher, sender: ContractAddress, new_treasury_address: ContractAddress) {
        impersonate(sender);
        (*system).set_treasury(new_treasury_address);
        _next_block();
    }
    fn execute_admin_set_paused(system: @IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        (*system).set_paused(paused);
        _next_block();
    }
    fn execute_admin_set_table(system: @IAdminDispatcher, sender: ContractAddress, table: TableConfig) {
        impersonate(sender);
        (*system).set_table(table);
        _next_block();
    }
    fn execute_admin_set_table_admittance(system: @IAdminDispatcher, sender: ContractAddress, table_admittance: TableAdmittance) {
        impersonate(sender);
        (*system).set_table_admittance(table_admittance);
        _next_block();
    }
    fn execute_admin_open_table(system: @IAdminDispatcher, sender: ContractAddress, table_id: felt252, enabled: bool) {
        impersonate(sender);
        (*system).open_table(table_id, enabled);
        _next_block();
    }

    // ::ierc20
    fn execute_lords_faucet(system: @ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        (*system).faucet();
        _next_block();
    }
    fn execute_lords_approve(system: @ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u128) {
        impersonate(owner);
        (*system).approve(spender, value.into());
        _next_block();
    }

    // ::duelist
    fn execute_create_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = (*system).create_duelist(sender, name, profile_pic_type, profile_pic_uri);
        _next_block();
        (duelist)
    }
    fn execute_update_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        (execute_update_duelist_ID(system, sender, ID(sender), name, profile_pic_type, profile_pic_uri))
    }
    fn execute_update_duelist_ID(system: @IDuelistTokenDispatcher, sender: ContractAddress, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = (*system).update_duelist(duelist_id, name, profile_pic_type, profile_pic_uri);
        _next_block();
        (duelist)
    }

    // ::duel_token
    fn execute_create_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
    ) -> u128 {
        (execute_create_duel_ID(system, sender, ID(sender), challenged, quote, table_id, expire_hours))
    }
    fn execute_create_duel_ID(system: @IDuelTokenDispatcher, sender: ContractAddress,
        token_id: u128,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*system).create_duel(token_id, challenged, Premise::Nothing, quote, table_id, expire_hours);
        _next_block();
        (duel_id)
    }
    fn execute_reply_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        (execute_reply_duel_ID(system, sender, ID(sender), duel_id, accepted))
    }
    fn execute_reply_duel_ID(system: @IDuelTokenDispatcher, sender: ContractAddress,
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
    fn execute_commit_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        hash: u128,
    ) {
        execute_commit_moves_ID(system, sender, ID(sender), duel_id, hash);
    }
    fn execute_commit_moves_ID(system: @IGameDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        hash: u128,
    ) {
        impersonate(sender);
        (*system).commit_moves(token_id, duel_id, hash);
        _next_block();
    }
    fn execute_reveal_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*system).reveal_moves(ID(sender), duel_id, salt, moves);
        _next_block();
    }

    //
    // getters
    //

    #[inline(always)]
    fn get_Config(world: WorldStorage) -> Config {
        (world.read_model(CONFIG::CONFIG_KEY))
    }
    #[inline(always)]
    fn get_TokenConfig(world: WorldStorage, contract_address: ContractAddress) -> TokenConfig {
        (world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_CoinConfig(world: WorldStorage, contract_address: ContractAddress) -> CoinConfig {
        (world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_Table(world: WorldStorage, table_id: felt252) -> TableConfig {
        (world.read_model(table_id))
    }
    #[inline(always)]
    fn get_TableAdmittance(world: WorldStorage, table_id: felt252) -> TableAdmittance {
        (world.read_model(table_id))
    }
    #[inline(always)]
    fn get_Player(world: WorldStorage, address: ContractAddress) -> Player {
        (world.read_model(address))
    }
    #[inline(always)]
    fn get_DuelistValue(world: WorldStorage, address: ContractAddress) -> DuelistValue {
        (world.read_value(ID(address)))
    }
    #[inline(always)]
    fn get_DuelistValue_id(world: WorldStorage, duelist_id: u128) -> DuelistValue {
        (world.read_value(duelist_id))
    }
    #[inline(always)]
    fn get_Scoreboard(world: WorldStorage, table_id: felt252, address: ContractAddress) -> Scoreboard {
        (world.read_model((table_id, ID(address)),))
    }
    #[inline(always)]
    fn get_Scoreboard_id(world: WorldStorage, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (world.read_model((table_id, duelist_id),))
    }
    #[inline(always)]
    fn get_ChallengeValue(world: WorldStorage, duel_id: u128) -> ChallengeValue {
        (world.read_value(duel_id))
    }
    #[inline(always)]
    fn get_ChallengeFameBalanceValue(world: WorldStorage, duel_id: u128) -> ChallengeFameBalanceValue {
        (world.read_value(duel_id))
    }
    #[inline(always)]
    fn get_RoundValue(world: WorldStorage, duel_id: u128) -> RoundValue {
        (world.read_value(duel_id))
    }
    #[inline(always)]
    fn get_Challenge_Round_Entity(world: WorldStorage, duel_id: u128) -> (ChallengeValue, RoundValue) {
        let challenge = get_ChallengeValue(world, duel_id);
        let round = get_RoundValue(world, duel_id);
        (challenge, round)
    }

    #[inline(always)]
    fn fame_balance_of_token(sys: @TestSystems, duel_id: u128) -> u128 {
        ((*sys.fame).balance_of_token((*sys.duelists).contract_address, duel_id).low)
    }

    //
    // setters
    //

    // depends on use dojo::model::{Model};
    fn set_Config(ref world: WorldStorage, model: Config) {
        world.write_model_test(@model);
    }
    fn set_TableConfig(ref world: WorldStorage, model: TableConfig) {
        world.write_model_test(@model);
    }
    fn set_Duelist(ref world: WorldStorage, model: Duelist) {
        world.write_model_test(@model);
    }
    fn set_Scoreboard(ref world: WorldStorage, model: Scoreboard) {
        world.write_model_test(@model);
    }
    fn set_Challenge(ref world: WorldStorage, model: Challenge) {
        world.write_model_test(@model);
    }
    fn set_Pack(ref world: WorldStorage, model: Pack) {
        world.write_model_test(@model);
    }

    //
    // Asserts
    //

    fn assert_balance_token(sys: @TestSystems, duelist_id: u128, balance_before: u128, subtract: u128, add: u128, prefix: felt252) -> u128 {
        let address: ContractAddress = TokenBoundAddressTrait::address((*sys.duelists).contract_address, duelist_id);
        (assert_balance(
            ILordsMockDispatcher{ contract_address: (*sys.fame).contract_address },
            address, balance_before, subtract, add, prefix,
        ))
    }

    fn assert_balance(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, subtract: u128, add: u128, prefix: felt252) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        if (subtract > add) {
            assert(balance < balance_before, ShortString::concat(prefix, ' <'));
        } else if (add > subtract) {
            assert(balance > balance_before, ShortString::concat(prefix, ' >'));
        } else {
            assert(balance == balance_before, ShortString::concat(prefix, ' =='));
        }
        assert(balance == balance_before - subtract + add, ShortString::concat(prefix, ' =>'));
        (balance)
    }

    fn assert_winner_balance(lords: ILordsMockDispatcher,
        winner: u8,
        duelist_a: ContractAddress, duelist_b: ContractAddress,
        balance_a: u128, balance_b: u128,
        fee: u128, prize_value: u128,
        prefix: felt252,
    ) {
        if (winner == 1) {
            assert_balance(lords, duelist_a, balance_a, fee, prize_value, ShortString::concat('A_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee + prize_value, 0, ShortString::concat('A_B_', prefix));
        } else if (winner == 2) {
            assert_balance(lords, duelist_a, balance_a, fee + prize_value, 0, ShortString::concat('B_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, prize_value, ShortString::concat('B_B_', prefix));
        } else {
            assert_balance(lords, duelist_a, balance_a, fee, 0, ShortString::concat('D_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, 0, ShortString::concat('D_B_', prefix));
        }
    }


}

#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    #[test]
    fn test_tester() {
        assert(true, 'so very true');
    }
}
