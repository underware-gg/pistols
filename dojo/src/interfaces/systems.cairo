use starknet::{ContractAddress, ClassHash};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait};
use pistols::systems::minter::{IMinterDispatcher, IMinterDispatcherTrait};
use pistols::systems::token_duelist::{ITokenDuelistDispatcher, ITokenDuelistDispatcherTrait};

#[generate_trait]
impl WorldSystemsTraitImpl of WorldSystemsTrait {
    //
    // system addresses
    fn actions_address(self: IWorldDispatcher) -> ContractAddress {
        let (_class_hash, address) = self.contract(selector_from_tag!("pistols-actions"));
        (address)
    }
    fn minter_address(self: IWorldDispatcher) -> ContractAddress {
        let (_class_hash, address) = self.contract(selector_from_tag!("pistols-minter"));
        (address)
    }
    fn token_duelist_address(self: IWorldDispatcher) -> ContractAddress {
        let (_class_hash, address) = self.contract(selector_from_tag!("pistols-token_duelist"));
        (address)
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
