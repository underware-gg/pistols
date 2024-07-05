#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    use pistols::systems::admin::{admin, IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
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
    };
    use pistols::models::config::{
        Config, config,
    };
    use pistols::models::table::{
        TableConfig, table_config,
    };

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;


    #[inline(always)]
    fn ZERO() -> ContractAddress { starknet::contract_address_const::<0x0>() }
    #[inline(always)]
    fn OWNER() -> ContractAddress { starknet::contract_address_const::<0x111>() }
    #[inline(always)]
    fn OTHER() -> ContractAddress { starknet::contract_address_const::<0x222>() }
    #[inline(always)]
    fn BUMMER() -> ContractAddress { starknet::contract_address_const::<0x333>() }
    #[inline(always)]
    fn TREASURY() -> ContractAddress { starknet::contract_address_const::<0x444>() }
    #[inline(always)]
    fn BIG_BOY() -> ContractAddress { starknet::contract_address_const::<0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243>() }
    #[inline(always)]
    fn LITTLE_BOY() -> ContractAddress { starknet::contract_address_const::<0xffff00000000000ee>() }

    #[inline(always)]
    fn ID(address: ContractAddress) -> u128 {
        let as_felt: felt252 = address.into();
        let as_u256: u256 = as_felt.into();
        (as_u256.low)
        // (DuelistTrait::address_to_id(address))
    }

    fn impersonate(address: ContractAddress) {
        // testing::set_caller_address(address);   // not used??
        testing::set_contract_address(address); // this is the CALLER!!
        // testing::set_account_contract_address(address); // throws 'not writer'
    }

    fn deploy_system(world: IWorldDispatcher, salt: felt252, class_hash: felt252) -> ContractAddress {
        let contract_address = world.deploy_contract(salt, class_hash.try_into().unwrap(), array![].span());
        (contract_address)
    }

    fn setup_world(
        mut deploy_system: bool,
        mut deploy_admin: bool,
        mut deploy_lords: bool,
        initialize: bool,
        approve: bool,
    ) -> (
        IWorldDispatcher,
        IActionsDispatcher,
        IAdminDispatcher,
        ILordsMockDispatcher,
    ) {
        let mut models = array![
            duelist::TEST_CLASS_HASH,
            scoreboard::TEST_CLASS_HASH,
            challenge::TEST_CLASS_HASH,
            snapshot::TEST_CLASS_HASH,
            wager::TEST_CLASS_HASH,
            round::TEST_CLASS_HASH,
            config::TEST_CLASS_HASH,
            table_config::TEST_CLASS_HASH,
        ];

        // setup testing
        impersonate(OWNER()); // this is the CALLER!!
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);

        deploy_system = deploy_system || approve;
        deploy_admin = deploy_admin || initialize;
        deploy_lords = deploy_lords || approve || deploy_system;

        // systems
        let world: IWorldDispatcher = spawn_test_world(models);
        let system = IActionsDispatcher{ contract_address:
            if (deploy_system) {deploy_system(world, 'salt', actions::TEST_CLASS_HASH)}
            else {ZERO()}
        };
        let admin = IAdminDispatcher{ contract_address:
            if (deploy_admin) {deploy_system(world, 'admin', admin::TEST_CLASS_HASH)}
            else {ZERO()}
        };
        let lords = ILordsMockDispatcher{ contract_address:
            if (deploy_lords) {deploy_system(world, 'lords_mock', lords_mock::TEST_CLASS_HASH)}
            else {ZERO()}
        };
        let duelists = ITokenDuelistDispatcher{ contract_address:
            // if (deploy_system) {deploy_system(world, 'duelists', token_duelist::TEST_CLASS_HASH)}
            // else {deploy_system(world, 'mock_erc721', mock_erc721::TEST_CLASS_HASH)}
            deploy_system(world, 'mock_erc721', mock_erc721::TEST_CLASS_HASH)
        };
        // initializers
        if (deploy_lords) {
            execute_lords_initializer(lords, OWNER());
            execute_lords_faucet(lords, OWNER());
            execute_lords_faucet(lords, OTHER());
        }
        if (initialize) {
            execute_admin_initialize(admin, OWNER(), OWNER(), TREASURY(), lords.contract_address, duelists.contract_address);
        }
        if (approve) {
            execute_lords_approve(lords, OWNER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
            execute_lords_approve(lords, OTHER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
            execute_lords_approve(lords, BUMMER(), system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
        }
        (world, system, admin, lords)
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
    fn execute_admin_initialize(system: IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, treasury_address: ContractAddress, lords_address: ContractAddress, duelist_address: ContractAddress) {
        impersonate(sender);
        system.initialize(owner_address, treasury_address, lords_address, duelist_address);
        _next_block();
    }
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
    fn execute_admin_set_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool) {
        impersonate(sender);
        system.set_table(table_id, contract_address, description, fee_min, fee_pct, enabled);
        _next_block();
    }
    fn execute_admin_enable_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, enabled: bool) {
        impersonate(sender);
        system.enable_table(table_id, enabled);
        _next_block();
    }

    // ::ierc20
    fn execute_lords_initializer(system: ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        system.initializer();
        _next_block();
    }
    fn execute_lords_faucet(system: ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        system.faucet();
        _next_block();
    }
    fn execute_lords_approve(system: ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u256) {
        impersonate(owner);
        system.approve(spender, value);
        _next_block();
    }

    // ::actions
    fn execute_register_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: u8, profile_pic_uri: ByteArray) {
        impersonate(sender);
        system.register_duelist(ID(sender), name, profile_pic_type, profile_pic_uri);
        _next_block();
    }
    fn execute_create_challenge(system: IActionsDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u256,
        expire_seconds: u64,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = system.create_challenge(ID(sender), challenged, message, table_id, wager_value, expire_seconds);
        _next_block();
        (duel_id)
    }
    fn execute_reply_challenge(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        impersonate(sender);
        let new_state: ChallengeState = system.reply_challenge(ID(sender), duel_id, accepted);
        _next_block();
        (new_state)
    }
    fn execute_reply_challenge_id(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        token_id: u128,
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
        system.commit_action(duel_id, round_number, hash);
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
        system.reveal_action(duel_id, round_number, salt, slot1, slot2);
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
        (get!(world, address, Duelist))
    }
    #[inline(always)]
    fn get_Scoreboard(world: IWorldDispatcher, table: felt252, address: ContractAddress) -> Scoreboard {
        (get!(world, (table, address), Scoreboard))
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

    fn assert_balance(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u256, subtract: u256, add: u256, prefix: felt252) -> u256 {
        let balance: u256 = lords.balance_of(address);
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
        balance_a: u256, balance_b: u256,
        fee: u256, wager_value: u256,
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
