#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
    use pistols::systems::admin::{admin, IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::mocks::lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::constants::{constants};
    use pistols::types::action::{Action};
    use pistols::models::models::{
        Duelist, duelist,
        Scoreboard, scoreboard,
        Challenge, challenge,
        Snapshot, snapshot,
        Wager, wager,
        Round, round,
    };
    use pistols::models::config::{
        Config, config,
    };
    use pistols::models::table::{
        TableConfig, table_config,
    };
    use pistols::utils::short_string::{ShortString};

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    fn deploy_system(world: IWorldDispatcher, salt: felt252, class_hash: felt252) -> ContractAddress {
        let contract_address = world.deploy_contract(salt, class_hash.try_into().unwrap(), array![].span());
        (contract_address)
    }

    fn setup_world(initialize: bool, approve: bool) -> (
        IWorldDispatcher,
        IActionsDispatcher,
        IAdminDispatcher,
        ILordsMockDispatcher,
        IERC20Dispatcher,
        ContractAddress,
        ContractAddress,
        ContractAddress,
        ContractAddress,
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
        // accounts
        let owner: ContractAddress = starknet::contract_address_const::<0x111111>();
        let other: ContractAddress = starknet::contract_address_const::<0x222>();
        let bummer: ContractAddress = starknet::contract_address_const::<0x333>();
        let treasury: ContractAddress = starknet::contract_address_const::<0x444>();
        // setup testing
        // testing::set_caller_address(owner);   // not used??
        testing::set_contract_address(owner); // this is the CALLER!!
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);
        // systems
        let world: IWorldDispatcher = spawn_test_world(models);
        let system = IActionsDispatcher{ contract_address: deploy_system(world, 'salt', actions::TEST_CLASS_HASH) };
        let admin = IAdminDispatcher{ contract_address: deploy_system(world, 'admin', admin::TEST_CLASS_HASH) };
        let lords = ILordsMockDispatcher{ contract_address: deploy_system(world, 'lords_mock', lords_mock::TEST_CLASS_HASH) };
        let ierc20 = IERC20Dispatcher{ contract_address:lords.contract_address };
        // initializers
        execute_lords_initializer(lords, owner);
        execute_lords_faucet(lords, owner);
        execute_lords_faucet(lords, other);
        if (initialize) {
            execute_admin_initialize(admin, owner, owner, treasury, lords.contract_address);
        }
        if (approve) {
            execute_lords_approve(lords, owner, system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
            execute_lords_approve(lords, other, system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
            execute_lords_approve(lords, bummer, system.contract_address, 1_000_000 * constants::ETH_TO_WEI);
        }
        (world, system, admin, lords, ierc20, owner, other, bummer, treasury)
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
    fn execute_admin_initialize(system: IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, treasury_address: ContractAddress, lords_address: ContractAddress) {
        testing::set_contract_address(sender);
        system.initialize(owner_address, treasury_address, lords_address);
        _next_block();
    }
    fn execute_admin_set_owner(system: IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress) {
        testing::set_contract_address(sender);
        system.set_owner(owner_address);
        _next_block();
    }
    fn execute_admin_set_treasury(system: IAdminDispatcher, sender: ContractAddress, treasury_address: ContractAddress) {
        testing::set_contract_address(sender);
        system.set_treasury(treasury_address);
        _next_block();
    }
    fn execute_admin_set_paused(system: IAdminDispatcher, sender: ContractAddress, paused: bool) {
        testing::set_contract_address(sender);
        system.set_paused(paused);
        _next_block();
    }
    fn execute_admin_set_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, contract_address: ContractAddress, description: felt252, fee_min: u256, fee_pct: u8, enabled: bool) {
        testing::set_contract_address(sender);
        system.set_table(table_id, contract_address, description, fee_min, fee_pct, enabled);
        _next_block();
    }
    fn execute_admin_enable_table(system: IAdminDispatcher, sender: ContractAddress, table_id: felt252, enabled: bool) {
        testing::set_contract_address(sender);
        system.enable_table(table_id, enabled);
        _next_block();
    }

    // ::ierc20
    fn execute_lords_initializer(system: ILordsMockDispatcher, sender: ContractAddress) {
        testing::set_contract_address(sender);
        system.initializer();
        _next_block();
    }
    fn execute_lords_faucet(system: ILordsMockDispatcher, sender: ContractAddress) {
        testing::set_contract_address(sender);
        system.faucet();
        _next_block();
    }
    fn execute_lords_approve(system: ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u256) {
        testing::set_contract_address(owner);
        system.approve(spender, value);
        _next_block();
    }

    // ::actions
    fn execute_register_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic: u8) {
        testing::set_contract_address(sender);
        system.register_duelist(name, profile_pic);
        _next_block();
    }
    fn execute_create_challenge(system: IActionsDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        message: felt252,
        table_id: felt252,
        wager_value: u256,
        expire_seconds: u64,
    ) -> u128 {
        testing::set_contract_address(sender);
        let duel_id: u128 = system.create_challenge(challenged, message, table_id, wager_value, expire_seconds);
        _next_block();
        (duel_id)
    }
    fn execute_reply_challenge(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        testing::set_contract_address(sender);
        let new_state: ChallengeState = system.reply_challenge(duel_id, accepted);
        _next_block();
        (new_state)
    }
    fn execute_commit_action(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    ) {
        testing::set_contract_address(sender);
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
        testing::set_contract_address(sender);
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
    fn get_Scoreboard(world: IWorldDispatcher, address: ContractAddress, table: felt252) -> Scoreboard {
        (get!(world, (address, table), Scoreboard))
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

    fn assert_balance(ierc20: IERC20Dispatcher, address: ContractAddress, balance_before: u256, subtract: u256, add: u256, prefix: felt252) -> u256 {
        let balance: u256 = ierc20.balance_of(address);
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

    fn assert_winner_balance(ierc20: IERC20Dispatcher,
        winner: u8,
        duelist_a: ContractAddress, duelist_b: ContractAddress,
        balance_a: u256, balance_b: u256,
        fee: u256, wager_value: u256,
        prefix: felt252,
    ) {
        if (winner == 1) {
            assert_balance(ierc20, duelist_a, balance_a, fee, wager_value, ShortString::concat('A_A_', prefix));
            assert_balance(ierc20, duelist_b, balance_b, fee + wager_value, 0, ShortString::concat('A_B_', prefix));
        } else if (winner == 2) {
            assert_balance(ierc20, duelist_a, balance_a, fee + wager_value, 0, ShortString::concat('B_A_', prefix));
            assert_balance(ierc20, duelist_b, balance_b, fee, wager_value, ShortString::concat('B_B_', prefix));
        } else {
            assert_balance(ierc20, duelist_a, balance_a, fee, 0, ShortString::concat('D_A_', prefix));
            assert_balance(ierc20, duelist_b, balance_b, fee, 0, ShortString::concat('D_B_', prefix));
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
    #[available_gas(1_000_000)]
    fn test_utils() {
        assert(true != false, 'utils');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_pedersen_hash() {
        let a: felt252 = 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        let b_a = pedersen(b, a);
        // pedersen hashes are DIFFERENT for (a,b) and (b,a)
        assert(a_b != b_a, 'pedersen');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_pedersen_hash_from_zero() {
        let a: felt252 = 0;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        // pedersen hashes are DIFFERENT if (a == zero)
        assert(a_b != b, 'pedersen');
    }

    #[test]
    #[available_gas(1_000_000)]
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
