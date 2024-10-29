use starknet::{ContractAddress, ClassHash};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait, Resource};

pub use pistols::systems::{
    admin::{IAdminDispatcher, IAdminDispatcherTrait},
    bank::{IBankDispatcher, IBankDispatcherTrait},
    game::{IGameDispatcher, IGameDispatcherTrait},
    rng::{IRngDispatcher, IRngDispatcherTrait},
    tokens::{
        duel_token::{IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
        duelist_token::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        fame_coin::{IFameCoinDispatcher, IFameCoinDispatcherTrait},
    }
};
pub use pistols::interfaces::ierc20::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
pub use pistols::models::config::{ConfigEntity, ConfigEntityTrait};
pub use pistols::libs::store::{Store, StoreTrait};
pub use pistols::utils::misc::{ZERO};

pub mod SELECTORS {
    // systems
    const ADMIN: felt252 = selector_from_tag!("pistols-admin");
    const BANK: felt252 = selector_from_tag!("pistols-bank");
    const GAME: felt252 = selector_from_tag!("pistols-game");
    const RNG: felt252 = selector_from_tag!("pistols-rng");
    // tokens
    const DUEL_TOKEN: felt252 = selector_from_tag!("pistols-duel_token");
    const DUELIST_TOKEN: felt252 = selector_from_tag!("pistols-duelist_token");
    const FAME_COIN: felt252 = selector_from_tag!("pistols-fame_coin");
    const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
    // models
    const CONFIG: felt252 = selector_from_tag!("pistols-Config");
    const TABLE_CONFIG: felt252 = selector_from_tag!("pistols-TableConfig");
    const TOKEN_CONFIG: felt252 = selector_from_tag!("pistols-TokenConfig");
    const COIN_CONFIG: felt252 = selector_from_tag!("pistols-CoinConfig");
    const PAYMENT: felt252 = selector_from_tag!("pistols-Payment");
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
    fn bank_dispatcher(self: @IWorldDispatcher) -> IBankDispatcher {
        (IBankDispatcher{ contract_address: self.contract_address(SELECTORS::BANK) })
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
    #[inline(always)]
    fn fame_coin_dispatcher(self: @IWorldDispatcher) -> IFameCoinDispatcher {
        (IFameCoinDispatcher{ contract_address: self.contract_address(SELECTORS::FAME_COIN) })
    }
    #[inline(always)]
    fn lords_dispatcher(self: @IWorldDispatcher) -> ERC20ABIDispatcher {
        (StoreTrait::new(*self).get_config_entity().lords_dispatcher())
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
