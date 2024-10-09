use starknet::{ContractAddress, ClassHash};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait, Resource};

use pistols::systems::{
    admin::{IAdminDispatcher, IAdminDispatcherTrait},
    game::{IGameDispatcher, IGameDispatcherTrait},
    rng::{IRngDispatcher, IRngDispatcherTrait},
    minter::{IMinterDispatcher, IMinterDispatcherTrait},
    duelist_token::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
};
use pistols::utils::misc::{ZERO};

mod SELECTORS {
    // system selectors
    const ADMIN: felt252 = selector_from_tag!("pistols-admin");
    const GAME: felt252 = selector_from_tag!("pistols-game");
    const RNG: felt252 = selector_from_tag!("pistols-rng");
    const MINTER: felt252 = selector_from_tag!("pistols-minter");
    const DUELIST_TOKEN: felt252 = selector_from_tag!("pistols-duelist_token");
    const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
    // model selectors
    const CONFIG: felt252 = selector_from_tag!("pistols-Config");
    const TABLE_CONFIG: felt252 = selector_from_tag!("pistols-TableConfig");
    const TABLE_WAGER: felt252 = selector_from_tag!("pistols-TableWager");
    const TOKEN_CONFIG: felt252 = selector_from_tag!("pistols-TokenConfig");
}

#[generate_trait]
impl WorldSystemsTraitImpl of WorldSystemsTrait {
    fn contract_address(self: @IWorldDispatcher, selector: felt252) -> ContractAddress {
        if let Resource::Contract((_, contract_address)) = (*self).resource(selector) {
            (contract_address)
        } else {
            (ZERO())
        }
    }

    //
    // system addresses
    fn duelist_token_address(self: @IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::DUELIST_TOKEN))
    }

    //
    // dispatchers
    fn admin_dispatcher(self: @IWorldDispatcher) -> IAdminDispatcher {
        (IAdminDispatcher{ contract_address: self.contract_address(SELECTORS::ADMIN) })
    }
    fn game_dispatcher(self: @IWorldDispatcher) -> IGameDispatcher {
        (IGameDispatcher{ contract_address: self.contract_address(SELECTORS::GAME) })
    }
    fn rng_dispatcher(self: @IWorldDispatcher) -> IRngDispatcher {
        (IRngDispatcher{ contract_address: self.contract_address(SELECTORS::RNG) })
    }
    fn minter_dispatcher(self: @IWorldDispatcher) -> IMinterDispatcher {
        (IMinterDispatcher{ contract_address: self.contract_address(SELECTORS::MINTER) })
    }
    fn duelist_token_dispatcher(self: @IWorldDispatcher) -> IDuelistTokenDispatcher {
        (IDuelistTokenDispatcher{ contract_address: self.contract_address(SELECTORS::DUELIST_TOKEN) })
    }

    //
    // validators
    fn is_minter_contract(self: @IWorldDispatcher, address: ContractAddress) -> bool {
        (address == self.contract_address(SELECTORS::MINTER))
    }
}
