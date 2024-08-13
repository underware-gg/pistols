use starknet::{ContractAddress, ClassHash};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait, Resource};

use pistols::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
use pistols::systems::minter::{IMinterDispatcher, IMinterDispatcherTrait};
use pistols::systems::token_duelist::{ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait};
use pistols::libs::utils::{ZERO};

mod SELECTORS {
    const ADMIN: felt252 = selector_from_tag!("pistols-admin");
    const ACTIONS: felt252 = selector_from_tag!("pistols-actions");
    const MINTER: felt252 = selector_from_tag!("pistols-minter");
    const TOKEN_DUELIST: felt252 = selector_from_tag!("pistols-token_duelist");
    const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
}

#[generate_trait]
impl WorldSystemsTraitImpl of WorldSystemsTrait {
    fn contract_address(self: IWorldDispatcher, selector: felt252) -> ContractAddress {
        if let Resource::Contract((_, contract_address)) = self.resource(selector) {
            (contract_address)
        } else {
            (ZERO())
        }
    }
    //
    // system addresses
    fn actions_address(self: IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::ACTIONS))
    }
    fn minter_address(self: IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::MINTER))
    }
    fn token_duelist_address(self: IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::TOKEN_DUELIST))
    }

    //
    // dispatchers
    fn actions_dispatcher(self: IWorldDispatcher) -> IActionsDispatcher {
        (IActionsDispatcher{ contract_address: self.actions_address() })
    }
    fn minter_dispatcher(self: IWorldDispatcher) -> IMinterDispatcher {
        (IMinterDispatcher{ contract_address: self.minter_address() })
    }
    fn token_duelist_dispatcher(self: IWorldDispatcher) -> ITokenDuelistDispatcher {
        (ITokenDuelistDispatcher{ contract_address: self.token_duelist_address() })
    }

    //
    // validators
    fn is_minter_contract(self: IWorldDispatcher, address: ContractAddress) -> bool {
        (address == self.minter_address())
    }
}
