#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::systems::utils::{zero_address};
    use pistols::models::config::{Config};
    use pistols::models::coins::{Coin, coins, ETH_TO_WEI};
    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::tests::utils::{utils};
    use pistols::utils::string::{String};

    const PLAYER_NAME: felt252 = 'Sensei';
    const OTHER_NAME: felt252 = 'Senpai';
    const BUMMER_NAME: felt252 = 'Bummer';
    const MESSAGE_1: felt252 = 'For honour!!!';
    const WAGER_COIN: u8 = 1;

    fn _assert_balance(ierc20: IERC20Dispatcher, address: ContractAddress, balance_before: u256, subtract: u256, add: u256, prefix: felt252) -> u256 {
        let balance: u256 = ierc20.balance_of(address);
        if (subtract > 0) {
            assert(balance < balance_before, String::concat(prefix, ' <'));
        } else if (add > 0) {
            assert(balance > balance_before, String::concat(prefix, ' >'));
        } else {
            assert(balance == balance_before, String::concat(prefix, ' =='));
        }
        assert(balance == balance_before - subtract + add, String::concat(prefix, ' =>'));
        (balance)
    }

    //
    // Fees balance
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fee_balance_ok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        let S = system.contract_address;
        let A = other;
        let B = owner;
        let balance_system: u256 = ierc20.balance_of(S);
        let balance_a: u256 = ierc20.balance_of(A);
        let balance_b: u256 = ierc20.balance_of(B);
        let duel_id: u128 = utils::execute_create_challenge(system, A, B, MESSAGE_1, WAGER_COIN, 0, 0);
        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
        // check stored wager
        let wager = utils::get_Wager(world, duel_id);
        let coin: Coin = admin.get_coin(WAGER_COIN);
        assert(wager.coin == WAGER_COIN, 'wager.coin');
        assert(wager.value == 0, 'wager.value');
        assert(wager.fee  > 0, 'wager.fee > 0');
        assert(wager.fee == coin.fee_min, 'wager.fee');
        // check balances
        let balance_a: u256 = _assert_balance(ierc20, A, balance_a, wager.fee, 0, 'balance_a');
        let balance_system: u256 = _assert_balance(ierc20, S, balance_system, 0, wager.fee, 'balance_system+a');
        // accept
        utils::execute_reply_challenge(system, B, duel_id, true);
        let balance_b: u256 = _assert_balance(ierc20, B, balance_b, wager.fee, 0, 'balance_b');
        let balance_system: u256 = _assert_balance(ierc20, S, balance_system, 0, wager.fee, 'balance_system+b');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_wager_balance_ok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        let S = system.contract_address;
        let A = other;
        let B = owner;
        let balance_system: u256 = ierc20.balance_of(S);
        let balance_a: u256 = ierc20.balance_of(A);
        let balance_b: u256 = ierc20.balance_of(B);
        let duel_id: u128 = utils::execute_create_challenge(system, A, B, MESSAGE_1, WAGER_COIN, 100, 0);
        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
        // check stored wager
        let wager = utils::get_Wager(world, duel_id);
        let coin: Coin = admin.get_coin(WAGER_COIN);
        assert(wager.coin == WAGER_COIN, 'wager.coin');
        assert(wager.value == 100, 'wager.value');
        assert(wager.fee  > 0, 'wager.fee > 0');
        assert(wager.fee == coin.fee_min, 'wager.fee');
        // check balances
        let balance_a: u256 = _assert_balance(ierc20, A, balance_a, wager.value, 0, 'balance_a');
        let balance_system: u256 = _assert_balance(ierc20, S, balance_system, 0, wager.value, 'balance_system');
        // accept
        utils::execute_reply_challenge(system, B, duel_id, true);
        let balance_b: u256 = _assert_balance(ierc20, B, balance_b, wager.value, 0, 'balance_b');
        let balance_system: u256 = _assert_balance(ierc20, S, balance_system, 0, wager.value, 'balance_system+b');
    }

    //
    // Challenge
    //

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Insufficient balance for Fee','ENTRYPOINT_FAILED'))]
    fn test_fee_funds_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        let duel_id: u128 = utils::execute_create_challenge(system, bummer, other, MESSAGE_1, WAGER_COIN, 0, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Insufficient balance for Wager','ENTRYPOINT_FAILED'))]
    fn test_wager_funds_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        let duel_id: u128 = utils::execute_create_challenge(system, bummer, other, MESSAGE_1, WAGER_COIN, 100, 0);
    }


    //
    // Challenge OK (baseline)
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_fee_funds_ok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        let balance: u256 = ierc20.balance_of(other);
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 0, 0);
        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
    }

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_wager_funds_ok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        let balance: u256 = ierc20.balance_of(other);
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 100, 0);
        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.state == ChallengeState::Awaiting.into(), 'state');
    }

    //
    // Balance NOK
    //

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Insufficient balance for Fee','ENTRYPOINT_FAILED'))]
    fn test_fee_funds_ok_resp_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        // verified by test_fee_funds_ok
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 0, 0);
        // panic here
        utils::execute_reply_challenge(system, bummer, duel_id, true);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Insufficient balance for Wager','ENTRYPOINT_FAILED'))]
    fn test_wager_funds_ok_resp_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        // verified by test_wager_funds_ok
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 100, 0);
        // panic here
        utils::execute_reply_challenge(system, bummer, duel_id, true);
    }

    //
    // Allowance NOK
    //

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not allowed to transfer Fee','ENTRYPOINT_FAILED'))]
    fn test_fee_funds_ok_allowance_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        // verified by test_fee_funds_ok
        // remove allowance
        utils::execute_approve(lords, other, system.contract_address, 0);
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 0, 0);
    }

    #[test]
    #[available_gas(1_000_000_000)]
    #[should_panic(expected:('Not allowed to transfer Wager','ENTRYPOINT_FAILED'))]
    fn test_wager_funds_ok_allowance_nok() {
        let (world, system, admin, lords, ierc20, owner, other, bummer) = utils::setup_world(true);
        utils::execute_register_duelist(system, other, OTHER_NAME, 1);
        utils::execute_register_duelist(system, bummer, BUMMER_NAME, 1);
        // verified by test_fee_funds_ok
        // remove allowance
        utils::execute_approve(lords, other, system.contract_address, 0);
        let duel_id: u128 = utils::execute_create_challenge(system, other, bummer, MESSAGE_1, WAGER_COIN, 100, 0);
    }




    // TODO: calc_fee = Wager.fee

    // TODO: challenger balance (insufficient)
    // TODO: challenged balance (insifficient)
    
    // TODO: contract balance: zero > wager > zero
    // TODO: contract balance: zero > fees > zero

    // TODO: Withdraw: restore Challenger balance
    // TODO: Refuse: restore Challenger balance

}
