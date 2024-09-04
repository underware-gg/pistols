#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing, get_caller_address};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{Model, ModelTest, ModelIndex, ModelEntityTest};
    use dojo::utils::test::{spawn_test_world, deploy_contract};

    use pistols::systems::admin::{admin, IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::systems::minter::{minter, IMinterDispatcher, IMinterDispatcherTrait};
    use pistols::systems::token_duelist::{token_duelist, ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait};
    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::token::mock_token_duelist::{
        token_duelist as mock_token_duelist,
        // ITokenDuelistDispatcher,
        // ITokenDuelistDispatcherTrait,
    };
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::constants::{CONST};
    use pistols::types::action::{Action};
    use pistols::utils::short_string::{ShortString};
    use pistols::interfaces::systems::{SELECTORS};

    use pistols::models::challenge::{
        Challenge, ChallengeStore, ChallengeEntity, ChallengeEntityStore,
        Snapshot, SnapshotStore, SnapshotEntity, SnapshotEntityStore,
        Wager, WagerStore, WagerEntity, WagerEntityStore,
        Round, RoundStore, RoundEntity, RoundEntityStore,
    };
    use pistols::models::duelist::{
        Duelist, DuelistTrait, DuelistStore, DuelistEntity, DuelistEntityStore,
        Scoreboard, ScoreboardStore, ScoreboardEntity, ScoreboardEntityStore,
        Pact, PactStore, PactEntity, PactEntityStore,
        ProfilePicType,
        Archetype,
    };
    use pistols::models::config::{
        Config, ConfigStore, CONFIG, ConfigEntity, ConfigEntityStore,
    };
    use pistols::models::table::{
        TableConfig, TableConfigStore, TableConfigEntity, TableConfigEntityStore,
        TableAdmittance, TableAdmittanceStore, TableAdmittanceEntity, TableAdmittanceEntityStore,
    };
    use pistols::models::token_config::{
        TokenConfig, TokenConfigStore, TokenConfigEntity, TokenConfigEntityStore,
    };

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    fn ZERO() -> ContractAddress { starknet::contract_address_const::<0x0>() }
    fn OWNER() -> ContractAddress { starknet::contract_address_const::<0x1>() }
    fn OTHER() -> ContractAddress { starknet::contract_address_const::<0x2>() }
    fn BUMMER() -> ContractAddress { starknet::contract_address_const::<0x3>() }
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


    //-------------------------------
    // Test world

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    mod flags {
        const ACTIONS: u8    = 0b000001;
        const ADMIN: u8      = 0b000010;
        const LORDS: u8      = 0b000100;
        const MINTER: u8     = 0b001000;
        const APPROVE: u8    = 0b010000;
    }

    #[inline(always)]
    fn deploy_system(world: IWorldDispatcher, salt: felt252, class_hash: felt252) -> ContractAddress {
        let contract_address = world.deploy_contract(salt, class_hash.try_into().unwrap());
        (contract_address)
    }

    fn setup_world(flags: u8) -> (
        IWorldDispatcher,
        IActionsDispatcher,
        IAdminDispatcher,
        ILordsMockDispatcher,
        IMinterDispatcher,
    ) {
        let mut deploy_actions: bool = (flags & flags::ACTIONS) != 0;
        let mut deploy_admin: bool = (flags & flags::ADMIN) != 0;
        let mut deploy_lords: bool = (flags & flags::LORDS) != 0;
        let mut deploy_minter: bool = (flags & flags::MINTER) != 0;
        let approve: bool = (flags & flags::APPROVE) != 0;

        deploy_actions = deploy_actions || approve;
        deploy_lords = deploy_lords || deploy_actions || approve;
        deploy_admin = deploy_admin || deploy_actions || deploy_actions;
        // deploy_minter = deploy_minter || deploy_actions;

        // setup testing
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);

        // deploy world
// '---- spawn_test_world...'.print();
        // let world = spawn_test_world!();
        // let world = spawn_test_world!(["origami_token", "pistols"]);
        let world: IWorldDispatcher = spawn_test_world(
            ["origami_token", "pistols"].span(),
            get_models_test_class_hashes!(),
        );
// '---- spawned...'.print();
        world.grant_owner(dojo::utils::bytearray_hash(@"pistols"), OWNER());

        // deploy systems
        let actions = IActionsDispatcher{ contract_address:
            if (deploy_actions) {
                let address = deploy_system(world, 'salt', actions::TEST_CLASS_HASH);
                world.grant_owner(SELECTORS::ACTIONS, OWNER());
                world.grant_writer(selector_from_tag!("pistols-Duelist"), address);
                world.grant_writer(selector_from_tag!("pistols-Scoreboard"), address);
                world.grant_writer(selector_from_tag!("pistols-Challenge"), address);
                world.grant_writer(selector_from_tag!("pistols-Snapshot"), address);
                world.grant_writer(selector_from_tag!("pistols-Wager"), address);
                world.grant_writer(selector_from_tag!("pistols-Pact"), address);
                world.grant_writer(selector_from_tag!("pistols-Round"), address);
                (address)
            }
            else {ZERO()}
        };
        let lords = ILordsMockDispatcher{ contract_address:
            if (deploy_lords) {
                let address = deploy_system(world, 'lords_mock', lords_mock::TEST_CLASS_HASH);
                // world.grant_owner(dojo::utils::bytearray_hash(@"origami_token"), OWNER());
                world.grant_owner(dojo::utils::bytearray_hash(@"origami_token"), address);
                // world.grant_owner(SELECTORS::LORDS_MOCK, OWNER());
                (address)
            }
            else {ZERO()}
        };
        let duelists = ITokenDuelistDispatcher{ contract_address:
            if (deploy_minter) {
                let address = deploy_system(world, 'token_duelist', token_duelist::TEST_CLASS_HASH);
                world.grant_owner(dojo::utils::bytearray_hash(@"origami_token"), address);
                // world.grant_owner(dojo::utils::bytearray_hash(@"origami_token"), OWNER());
                world.grant_writer(SELECTORS::TOKEN_DUELIST, OWNER());
                world.init_contract(SELECTORS::TOKEN_DUELIST, [].span());
                (address)
            }
            else {
                (deploy_system(world, 'token_duelist', mock_token_duelist::TEST_CLASS_HASH))
            }
        };
        let minter = IMinterDispatcher{ contract_address:
            if (deploy_minter) {
                let address = deploy_system(world, 'minter', minter::TEST_CLASS_HASH);
                let minter_call_data: Array<felt252> = array![
                    duelists.contract_address.into(),
                    100, // max_supply
                    3, // wallet_max
                    1, // is_open
                ];
                world.grant_owner(SELECTORS::MINTER, OWNER());
                world.grant_writer(selector_from_tag!("pistols-TokenConfig"), address);
                world.init_contract(SELECTORS::MINTER, minter_call_data.span());
                (address)
            }
            else {ZERO()}
        };
        let admin = IAdminDispatcher{ contract_address:
            if (deploy_admin) {
                let address = deploy_system(world, 'admin', admin::TEST_CLASS_HASH);
                let admin_call_data: Array<felt252> = array![
                    TREASURY().into(), // treasury
                    lords.contract_address.into(),
                ];
                world.grant_owner(SELECTORS::ADMIN, OWNER());
                world.grant_writer(selector_from_tag!("pistols-Config"), address);
                world.grant_writer(selector_from_tag!("pistols-TableConfig"), address);
                world.grant_writer(selector_from_tag!("pistols-TableAdmittance"), address);
                world.init_contract(SELECTORS::ADMIN, admin_call_data.span());
                (address)
            }
            else {ZERO()}
        };

        // initializers
        if (deploy_lords) {
            execute_lords_faucet(lords, OWNER());
            execute_lords_faucet(lords, OTHER());
        }
        if (approve) {
            execute_lords_approve(lords, OWNER(), actions.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
            execute_lords_approve(lords, OTHER(), actions.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
            execute_lords_approve(lords, BUMMER(), actions.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
        }

        impersonate(OWNER());

// '---- READY!'.print();
        (world, actions, admin, lords, minter)
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
    fn execute_admin_grant_admin(system: IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, granted: bool) {
        impersonate(sender);
        system.grant_admin(owner_address, granted);
        _next_block();
    }
    fn execute_admin_set_config(system: IAdminDispatcher, sender: ContractAddress, config: Config) {
        impersonate(sender);
        system.set_config(config);
        _next_block();
    }
    fn execute_admin_set_paused(system: IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        system.set_paused(paused);
        _next_block();
    }
    fn execute_admin_set_table(system: IAdminDispatcher, sender: ContractAddress, table: TableConfig) {
        impersonate(sender);
        system.set_table(table);
        _next_block();
    }
    fn execute_admin_set_table_admittance(system: IAdminDispatcher, sender: ContractAddress, table_admittance: TableAdmittance) {
        impersonate(sender);
        system.set_table_admittance(table_admittance);
        _next_block();
    }
    fn execute_admin_open_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, enabled: bool) {
        impersonate(sender);
        system.open_table(table_id, enabled);
        _next_block();
    }

    // ::ierc20
    fn execute_lords_faucet(system: ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        system.faucet();
        _next_block();
    }
    fn execute_lords_approve(system: ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u128) {
        impersonate(owner);
        system.approve(spender, value.into());
        _next_block();
    }

    // ::actions
    fn execute_mint_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252, archetype: Archetype) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = system.mint_duelist(name, profile_pic_type, profile_pic_uri, archetype);
        _next_block();
        (duelist)
    }
    fn execute_update_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        (execute_update_duelist_ID(system, sender, ID(sender), name, profile_pic_type, profile_pic_uri))
    }
    fn execute_update_duelist_ID(system: IActionsDispatcher, sender: ContractAddress, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = system.update_duelist(duelist_id, name, profile_pic_type, profile_pic_uri);
        _next_block();
        (duelist)
    }
    fn execute_create_challenge(system: IActionsDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u128,
        expire_hours: u64,
    ) -> u128 {
        (execute_create_challenge_ID(system, sender, ID(sender), challenged, message, table_id, wager_value, expire_hours))
    }
    fn execute_create_challenge_ID(system: IActionsDispatcher, sender: ContractAddress,
        token_id: u128,
        challenged: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u128,
        expire_hours: u64,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = system.create_challenge(token_id, challenged, message, table_id, wager_value, expire_hours);
        _next_block();
        (duel_id)
    }
    fn execute_reply_challenge(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        (execute_reply_challenge_ID(system, sender, ID(sender), duel_id, accepted))
    }
    fn execute_reply_challenge_ID(system: IActionsDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        impersonate(sender);
        let new_state: ChallengeState = system.reply_challenge(token_id, duel_id, accepted);
        _next_block();
        (new_state)
    }
    fn execute_commit_moves(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    ) {
        impersonate(sender);
        system.commit_moves(ID(sender), duel_id, round_number, hash);
        _next_block();
    }
    fn execute_reveal_moves(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        slot1: u8,
        slot2: u8,
    ) {
        impersonate(sender);
        system.reveal_moves(ID(sender), duel_id, round_number, salt, slot1, slot2);
        _next_block();
    }

    //
    // read-only calls
    //

    // fn execute_get_pact(system: IActionsDispatcher, a: ContractAddress, b: ContractAddress) -> u128 {
    //     let result: u128 = system.get_pact(a, b);
    //     (result)
    // }

    //
    // getters
    //

    #[inline(always)]
    fn get_Config(world: IWorldDispatcher) -> Config {
        (ConfigStore::get(world, CONFIG::CONFIG_KEY))
    }
    #[inline(always)]
    fn get_Table(world: IWorldDispatcher, table_id: felt252) -> TableConfig {
        (TableConfigStore::get(world, table_id))
    }
    #[inline(always)]
    fn get_TableAdmittance(world: IWorldDispatcher, table_id: felt252) -> TableAdmittance {
        (TableAdmittanceStore::get(world, table_id))
    }
    #[inline(always)]
    fn get_DuelistEntity(world: IWorldDispatcher, address: ContractAddress) -> DuelistEntity {
        (DuelistEntityStore::get(world, DuelistStore::entity_id_from_keys(ID(address))))
    }
    #[inline(always)]
    fn get_DuelistEntity_id(world: IWorldDispatcher, duelist_id: u128) -> DuelistEntity {
        (DuelistEntityStore::get(world, DuelistStore::entity_id_from_keys(duelist_id)))
    }
    #[inline(always)]
    fn get_Scoreboard(world: IWorldDispatcher, table_id: felt252, address: ContractAddress) -> Scoreboard {
        (ScoreboardStore::get(world, table_id, ID(address)))
    }
    #[inline(always)]
    fn get_Scoreboard_id(world: IWorldDispatcher, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (ScoreboardStore::get(world, table_id, duelist_id))
    }
    #[inline(always)]
    fn get_ChallengeEntity(world: IWorldDispatcher, duel_id: u128) -> ChallengeEntity {
        (ChallengeEntityStore::get(world, ChallengeStore::entity_id_from_keys(duel_id)))
    }
    #[inline(always)]
    fn get_Snapshot(world: IWorldDispatcher, duel_id: u128) -> Snapshot {
        (SnapshotStore::get(world, duel_id))
    }
    #[inline(always)]
    fn get_Wager(world: IWorldDispatcher, duel_id: u128) -> Wager {
        (WagerStore::get(world, duel_id))
    }
    #[inline(always)]
    fn get_RoundEntity(world: IWorldDispatcher, duel_id: u128, round_number: u8) -> RoundEntity {
        (RoundEntityStore::get(world, RoundStore::entity_id_from_keys(duel_id, round_number)))
    }
    #[inline(always)]
    fn get_Challenge_Round_Entity(world: IWorldDispatcher, duel_id: u128) -> (ChallengeEntity, RoundEntity) {
        let challenge = get_ChallengeEntity(world, duel_id);
        let round = get_RoundEntity(world, duel_id, challenge.round_number);
        (challenge, round)
    }

    //
    // setters
    //

    // depends on use dojo::model::{Model};
    fn set_TableConfig(world: IWorldDispatcher, table: TableConfig) {
        table.set_test(world);
    }
    // fn set_Round(world: IWorldDispatcher, round: Round) {
    //     round.set_test(world);
    // }
    fn set_Duelist(world: IWorldDispatcher, duelist: Duelist) {
        duelist.set_test(world);
    }
    fn set_Scoreboard(world: IWorldDispatcher, scoreboard: Scoreboard) {
        scoreboard.set_test(world);
    }

    //
    // Asserts
    //

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
        fee: u128, wager_value: u128,
        prefix: felt252,
    ) {
        if (winner == 1) {
            assert_balance(lords, duelist_a, balance_a, fee, wager_value, ShortString::concat('A_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee + wager_value, 0, ShortString::concat('A_B_', prefix));
        } else if (winner == 2) {
            assert_balance(lords, duelist_a, balance_a, fee + wager_value, 0, ShortString::concat('B_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, wager_value, ShortString::concat('B_B_', prefix));
        } else {
            assert_balance(lords, duelist_a, balance_a, fee, 0, ShortString::concat('D_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, 0, ShortString::concat('D_B_', prefix));
        }
    }


}

#[cfg(test)]
mod tests {
    use core::traits::{Into, TryInto};
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    #[test]
    fn test_utils() {
        assert(true != false, 'utils');
    }

    #[test]
    fn test_pedersen_hash() {
        let a: felt252 = 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        let b_a = pedersen(b, a);
        // pedersen hashes are DIFFERENT for (a,b) and (b,a)
        assert(a_b != b_a, 'pedersen');
    }

    #[test]
    fn test_pedersen_hash_from_zero() {
        let a: felt252 = 0;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        // pedersen hashes are DIFFERENT if (a == zero)
        assert(a_b != b, 'pedersen');
    }

    #[test]
    fn test_xor_hash() {
        let a: felt252 = 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let aa: u256 = a.into();
        let bb: u256 = b.into();
        let a_b = aa ^ bb;
        let b_a = bb ^ aa;
        // xor hashes are EQUAL for (a,b) and (b,a)
        assert(a_b == b_a, 'felt_to_u128');
    }
}
