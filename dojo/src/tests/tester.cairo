#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing, get_caller_address};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::utils::test::{spawn_test_world, deploy_contract};

    use pistols::systems::admin::{admin, IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::systems::minter::{minter, IMinterDispatcher, IMinterDispatcherTrait};
    use pistols::systems::token_duelist::{token_duelist, ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait};
    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::tests::mock_erc721::{mock_erc721, IMockERC721Dispatcher, IMockERC721DispatcherTrait};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::constants::{constants};
    use pistols::types::action::{Action};
    use pistols::utils::short_string::{ShortString};

    use pistols::models::challenge::{
        Challenge, challenge,
        Snapshot, snapshot,
        Wager, wager,
        Round, round,
    };
    use pistols::models::duelist::{
        Duelist, duelist, DuelistTrait,
        Scoreboard, scoreboard,
        Archetype,
    };
    use pistols::models::config::{
        Config, config,
    };
    use pistols::models::table::{
        TableConfig, table_config,
    };
    use pistols::models::token_config::{
        TokenConfig, token_config,
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
        // testing::set_caller_address(address);   // not used??
        testing::set_contract_address(address); // this is the CALLER!!
        testing::set_account_contract_address(address);
    }


    //-------------------------------
    // Test world

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    mod flags {
        const SYSTEM: u8     = 0b000001;
        const ADMIN: u8      = 0b000010;
        const LORDS: u8      = 0b000100;
        const MINTER: u8     = 0b001000;
        const APPROVE: u8    = 0b010000;
    }

    fn deploy_system(world: IWorldDispatcher, salt: felt252, class_hash: felt252, call_data: Span<felt252>) -> ContractAddress {
        let contract_address = world.deploy_contract(salt, class_hash.try_into().unwrap(), call_data);
        (contract_address)
    }

    fn setup_world(flags: u8) -> (
        IWorldDispatcher,
        IActionsDispatcher,
        IAdminDispatcher,
        ILordsMockDispatcher,
        IMinterDispatcher,
    ) {
        let mut deploy_system: bool = (flags & flags::SYSTEM) != 0;
        let mut deploy_admin: bool = (flags & flags::ADMIN) != 0;
        let mut deploy_lords: bool = (flags & flags::LORDS) != 0;
        let mut deploy_minter: bool = (flags & flags::MINTER) != 0;
        let approve: bool = (flags & flags::APPROVE) != 0;

        deploy_system = deploy_system || approve;
        deploy_lords = deploy_lords || approve || deploy_system;

        let mut models = array![
            duelist::TEST_CLASS_HASH,
            scoreboard::TEST_CLASS_HASH,
            challenge::TEST_CLASS_HASH,
            snapshot::TEST_CLASS_HASH,
            wager::TEST_CLASS_HASH,
            round::TEST_CLASS_HASH,
            config::TEST_CLASS_HASH,
            table_config::TEST_CLASS_HASH,
            token_config::TEST_CLASS_HASH,
        ];

        // setup testing
        impersonate(OWNER()); // this is the CALLER!!
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);

        // systems
        let world: IWorldDispatcher = spawn_test_world("pistols",  models);
        let system = IActionsDispatcher{ contract_address:
            if (deploy_system) {deploy_system(world, 'salt', actions::TEST_CLASS_HASH, array![].span())}
            else {ZERO()}
        };
        let lords = ILordsMockDispatcher{ contract_address:
            if (deploy_lords) {deploy_system(world, 'lords_mock', lords_mock::TEST_CLASS_HASH, array![].span())}
            else {ZERO()}
        };
        let duelists = ITokenDuelistDispatcher{ contract_address:
            if (deploy_minter) {deploy_system(world, 'duelists', token_duelist::TEST_CLASS_HASH, array![].span())}
            else {deploy_system(world, 'mock_erc721', mock_erc721::TEST_CLASS_HASH, array![].span())}
            
        };
        let minter_call_data: Array<felt252> = array![
            duelists.contract_address.into(),
            100, // max_supply
            3, // wallet_max
            1, // is_open
        ];
        let minter = IMinterDispatcher{ contract_address:
            if (deploy_minter) {deploy_system(world, 'minter', minter::TEST_CLASS_HASH, minter_call_data.span())}
            else {ZERO()}  
        };
        let admin_call_data: Array<felt252> = array![
            0, // owner
            0, // treasury
            lords.contract_address.into(),
        ];
        let admin = IAdminDispatcher{ contract_address:
            if (deploy_admin) {deploy_system(world, 'admin', admin::TEST_CLASS_HASH, admin_call_data.span())}
            else {ZERO()}
        };

        // set origami ownership
        world.grant_owner(starknet::get_contract_address(), dojo::utils::bytearray_hash(@"origami_token"));
        world.grant_owner(OWNER(), dojo::utils::bytearray_hash(@"origami_token"));

        // auths
        // world.grant_writer(selector!("TokenConfig"), duelists.contract_address);
        // initializers
        if (deploy_lords) {
            execute_lords_faucet(lords, OWNER());
            execute_lords_faucet(lords, OTHER());
        }
        if (approve) {
            execute_lords_approve(lords, OWNER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI.low);
            execute_lords_approve(lords, OTHER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI.low);
            execute_lords_approve(lords, BUMMER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI.low);
        }
        (world, system, admin, lords, minter)
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
    fn execute_admin_set_owner(system: IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress) {
        impersonate(sender);
        system.set_owner(owner_address);
        _next_block();
    }
    fn execute_admin_set_treasury(system: IAdminDispatcher, sender: ContractAddress, treasury_address: ContractAddress) {
        impersonate(sender);
        system.set_treasury(treasury_address);
        _next_block();
    }
    fn execute_admin_set_paused(system: IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        system.set_paused(paused);
        _next_block();
    }
    fn execute_admin_set_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u128, fee_pct: u8, enabled: bool) {
        impersonate(sender);
        system.set_table(table_id, contract_address, description, fee_min, fee_pct, enabled);
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
    fn execute_mint_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: u8, profile_pic_uri: felt252, archetype: Archetype) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = system.mint_duelist(name, profile_pic_type, profile_pic_uri, archetype);
        _next_block();
        (duelist)
    }
    fn execute_update_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: u8, profile_pic_uri: felt252) -> Duelist {
        (execute_update_duelist_ID(system, sender, ID(sender), name, profile_pic_type, profile_pic_uri))
    }
    fn execute_update_duelist_ID(system: IActionsDispatcher, sender: ContractAddress, duelist_id: u128, name: felt252, profile_pic_type: u8, profile_pic_uri: felt252) -> Duelist {
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
    fn execute_commit_action(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    ) {
        impersonate(sender);
        system.commit_action(ID(sender), duel_id, round_number, hash);
        _next_block();
    }
    fn execute_reveal_action(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        slot1: u8,
        slot2: u8,
    ) {
        impersonate(sender);
        system.reveal_action(ID(sender), duel_id, round_number, salt, slot1, slot2);
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
        (get!(world, 1, Config))
    }
    #[inline(always)]
    fn get_Table(world: IWorldDispatcher, table_id: felt252) -> TableConfig {
        (get!(world, table_id, TableConfig))
    }
    #[inline(always)]
    fn get_Duelist(world: IWorldDispatcher, address: ContractAddress) -> Duelist {
        (get!(world, ID(address), Duelist))
    }
    #[inline(always)]
    fn get_Duelist_id(world: IWorldDispatcher, duelist_id: u128) -> Duelist {
        (get!(world, duelist_id, Duelist))
    }
    #[inline(always)]
    fn get_Scoreboard(world: IWorldDispatcher, table_id: felt252, address: ContractAddress) -> Scoreboard {
        (get!(world, (table_id, ID(address)), Scoreboard))
    }
    #[inline(always)]
    fn get_Scoreboard_id(world: IWorldDispatcher, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (get!(world, (table_id, duelist_id), Scoreboard))
    }
    #[inline(always)]
    fn get_Challenge(world: IWorldDispatcher, duel_id: u128) -> Challenge {
        (get!(world, duel_id, Challenge))
    }
    #[inline(always)]
    fn get_Snapshot(world: IWorldDispatcher, duel_id: u128) -> Snapshot {
        (get!(world, duel_id, Snapshot))
    }
    #[inline(always)]
    fn get_Wager(world: IWorldDispatcher, duel_id: u128) -> Wager {
        (get!(world, duel_id, Wager))
    }
    #[inline(always)]
    fn get_Round(world: IWorldDispatcher, duel_id: u128, round_number: u8) -> Round {
        (get!(world, (duel_id, round_number), Round))
    }
    #[inline(always)]
    fn get_Challenge_Round(world: IWorldDispatcher, duel_id: u128) -> (Challenge, Round) {
        let challenge = get!(world, duel_id, Challenge);
        let round = get!(world, (duel_id, challenge.round_number), Round);
        (challenge, round)
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
