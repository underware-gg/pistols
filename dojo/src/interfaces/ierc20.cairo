use starknet::ContractAddress;
use token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

//
// https://github.com/dojoengine/origami/blob/e2057806db65709bbd68c1562a83181affaff4f3/token/src/erc20/interface.cairo
//
// trait IERC20<TState> {
//     fn total_supply(self: @TState) -> u256;
//     fn balance_of(self: @TState, account: ContractAddress) -> u256;
//     fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
//     fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
//     fn transfer_from(
//         ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
//     ) -> bool;
//     fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
// }

#[inline(always)]
fn ierc20(contract_address: ContractAddress) -> IERC20Dispatcher {
    (IERC20Dispatcher{contract_address})
}
