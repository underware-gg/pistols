use starknet::{ContractAddress, ClassHash};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait, Resource};

use pistols::utils::misc::{ZERO};
pub use pistols::systems::{
    admin::{IAdminDispatcher, IAdminDispatcherTrait},
    game::{IGameDispatcher, IGameDispatcherTrait},
    rng::{IRngDispatcher, IRngDispatcherTrait},
    tokens::{
        duel_token::{IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
        duelist_token::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
    }
};

pub mod SELECTORS {
    // systems
    const ADMIN: felt252 = selector_from_tag!("pistols-admin");
    const GAME: felt252 = selector_from_tag!("pistols-game");
    const RNG: felt252 = selector_from_tag!("pistols-rng");
    // tokens
    const DUEL_TOKEN: felt252 = selector_from_tag!("pistols-duel_token");
    const DUELIST_TOKEN: felt252 = selector_from_tag!("pistols-duelist_token");
    const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
    // models
    const CONFIG: felt252 = selector_from_tag!("pistols-Config");
    const TABLE_CONFIG: felt252 = selector_from_tag!("pistols-TableConfig");
    const TABLE_WAGER: felt252 = selector_from_tag!("pistols-TableWager");
    const TOKEN_CONFIG: felt252 = selector_from_tag!("pistols-TokenConfig");
    const COIN_CONFIG: felt252 = selector_from_tag!("pistols-CoinConfig");
}

#[generate_trait]
pub impl WorldSystemsTraitImpl of WorldSystemsTrait {
    fn contract_address(self: @IWorldDispatcher, selector: felt252) -> ContractAddress {
        if let Resource::Contract((_, contract_address)) = (*self).resource(selector) {
            (contract_address)
        } else {
            (ZERO())
        }
    }

    //
    // system addresses
    #[inline(always)]
    fn duel_token_address(self: @IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::DUEL_TOKEN))
    }
    #[inline(always)]
    fn duelist_token_address(self: @IWorldDispatcher) -> ContractAddress {
        (self.contract_address(SELECTORS::DUELIST_TOKEN))
    }

    //
    // dispatchers
    #[inline(always)]
    fn admin_dispatcher(self: @IWorldDispatcher) -> IAdminDispatcher {
        (IAdminDispatcher{ contract_address: self.contract_address(SELECTORS::ADMIN) })
    }
    #[inline(always)]
    fn game_dispatcher(self: @IWorldDispatcher) -> IGameDispatcher {
        (IGameDispatcher{ contract_address: self.contract_address(SELECTORS::GAME) })
    }
    #[inline(always)]
    fn rng_dispatcher(self: @IWorldDispatcher) -> IRngDispatcher {
        (IRngDispatcher{ contract_address: self.contract_address(SELECTORS::RNG) })
    }
    #[inline(always)]
    fn duel_token_dispatcher(self: @IWorldDispatcher) -> IDuelTokenDispatcher {
        (IDuelTokenDispatcher{ contract_address: self.contract_address(SELECTORS::DUEL_TOKEN) })
    }
    #[inline(always)]
    fn duelist_token_dispatcher(self: @IWorldDispatcher) -> IDuelistTokenDispatcher {
        (IDuelistTokenDispatcher{ contract_address: self.contract_address(SELECTORS::DUELIST_TOKEN) })
    }

    //
    // validators
    #[inline(always)]
    fn is_duel_contract(self: @IWorldDispatcher, address: ContractAddress) -> bool {
        (address == self.contract_address(SELECTORS::DUEL_TOKEN))
    }
    #[inline(always)]
    fn is_duelist_contract(self: @IWorldDispatcher, address: ContractAddress) -> bool {
        (address == self.contract_address(SELECTORS::DUELIST_TOKEN))
    }
}
