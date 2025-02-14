use starknet::{ContractAddress};
use core::num::traits::Zero;
use dojo::world::{WorldStorage, WorldStorageTrait, IWorldDispatcher};

pub use pistols::systems::{
    admin::{IAdminDispatcher, IAdminDispatcherTrait},
    bank::{IBankDispatcher, IBankDispatcherTrait},
    game::{IGameDispatcher, IGameDispatcherTrait},
    tutorial::{ITutorialDispatcher, ITutorialDispatcherTrait},
    rng::{IRngDispatcher, IRngDispatcherTrait},
    rng_mock::{IRngMockDispatcher, IRngMockDispatcherTrait},
    tokens::{
        duel_token::{IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
        duelist_token::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        pack_token::{IPackTokenDispatcher, IPackTokenDispatcherTrait},
        fame_coin::{IFameCoinDispatcher, IFameCoinDispatcherTrait},
        fools_coin::{IFoolsCoinDispatcher, IFoolsCoinDispatcherTrait},
        lords_mock::{ILordsMockDispatcher, ILordsMockDispatcherTrait},
    }
};
pub use pistols::interfaces::{
    ierc20::{ierc20, Erc20Dispatcher, Erc20DispatcherTrait},
    vrf::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source},
};
pub use pistols::libs::store::{Store, StoreTrait};
pub use pistols::models::config::{CONFIG, Config};
pub use pistols::utils::misc::{ZERO};

pub mod SELECTORS {
    // systems
    pub const ADMIN: felt252 = selector_from_tag!("pistols-admin");
    pub const BANK: felt252 = selector_from_tag!("pistols-bank");
    pub const GAME: felt252 = selector_from_tag!("pistols-game");
    pub const RNG: felt252 = selector_from_tag!("pistols-rng");
    pub const RNG_MOCK: felt252 = selector_from_tag!("pistols-rng_mock");
    // tokens
    pub const DUEL_TOKEN: felt252 = selector_from_tag!("pistols-duel_token");
    pub const DUELIST_TOKEN: felt252 = selector_from_tag!("pistols-duelist_token");
    pub const PACK_TOKEN: felt252 = selector_from_tag!("pistols-pack_token");
    pub const FAME_COIN: felt252 = selector_from_tag!("pistols-fame_coin");
    pub const FOOLS_COIN: felt252 = selector_from_tag!("pistols-fools_coin");
    // mocks
    pub const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
    pub const VR_MOCK: felt252 = selector_from_tag!("pistols-vrf_mock");
    // models
    pub const CONFIG: felt252 = selector_from_tag!("pistols-Config");
    pub const TABLE_CONFIG: felt252 = selector_from_tag!("pistols-TableConfig");
    pub const TOKEN_CONFIG: felt252 = selector_from_tag!("pistols-TokenConfig");
    pub const COIN_CONFIG: felt252 = selector_from_tag!("pistols-CoinConfig");
}

#[generate_trait]
pub impl SystemsImpl of SystemsTrait {
    fn contract_address(self: @WorldStorage, contract_name: @ByteArray) -> ContractAddress {
        // let (contract_address, _) = self.dns(contract_name).unwrap(); // will panic if not found
        match self.dns(contract_name) {
            Option::Some((contract_address, _)) => {
                (contract_address)
            },
            Option::None => {
                (ZERO())
            },
        }
    }

    // Create a Store from a dispatcher
    // https://github.com/dojoengine/dojo/blob/main/crates/dojo/core/src/contract/components/world_provider.cairo
    // https://github.com/dojoengine/dojo/blob/main/crates/dojo/core/src/world/storage.cairo
    #[inline(always)]
    fn storage(dispatcher: IWorldDispatcher, namespace: @ByteArray) -> WorldStorage {
        (WorldStorageTrait::new(dispatcher, namespace))
    }

    //--------------------------
    // system addresses
    //
    #[inline(always)]
    fn admin_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"admin"))
    }
    #[inline(always)]
    fn bank_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"bank"))
    }
    #[inline(always)]
    fn game_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"game"))
    }
    #[inline(always)]
    fn tutorial_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"tutorial"))
    }
    #[inline(always)]
    fn rng_address(self: @WorldStorage) -> ContractAddress {
        let result = self.contract_address(@"rng");
        if (result.is_non_zero()) {result} // deployments always have the rng contract
        else {self.rng_mock_address()}     // but for testing, we can skip it and deploy this
    }
    #[inline(always)]
    fn rng_mock_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"rng_mock"))
    }
    #[inline(always)]
    fn duel_token_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"duel_token"))
    }
    #[inline(always)]
    fn duelist_token_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"duelist_token"))
    }
    #[inline(always)]
    fn pack_token_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"pack_token"))
    }
    #[inline(always)]
    fn fame_coin_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"fame_coin"))
    }
    #[inline(always)]
    fn fools_coin_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"fools_coin"))
    }
    // mocks
    #[inline(always)]
    fn lords_mock_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"lords_mock"))
    }
    #[inline(always)]
    fn vrf_mock_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"vrf_mock"))
    }

    //--------------------------
    // address validators
    //
    #[inline(always)]
    fn is_game_contract(self: @WorldStorage, address: ContractAddress) -> bool {
        (address == self.game_address())
    }
    #[inline(always)]
    fn is_duel_contract(self: @WorldStorage, address: ContractAddress) -> bool {
        (address == self.duel_token_address())
    }
    #[inline(always)]
    fn is_duelist_contract(self: @WorldStorage, address: ContractAddress) -> bool {
        (address == self.duelist_token_address())
    }

    //--------------------------
    // dispatchers
    //
    #[inline(always)]
    fn admin_dispatcher(self: @WorldStorage) -> IAdminDispatcher {
        (IAdminDispatcher{ contract_address: self.admin_address() })
    }
    #[inline(always)]
    fn bank_dispatcher(self: @WorldStorage) -> IBankDispatcher {
        (IBankDispatcher{ contract_address: self.bank_address() })
    }
    #[inline(always)]
    fn game_dispatcher(self: @WorldStorage) -> IGameDispatcher {
        (IGameDispatcher{ contract_address: self.game_address() })
    }
    #[inline(always)]
    fn tutorial_dispatcher(self: @WorldStorage) -> ITutorialDispatcher {
        (ITutorialDispatcher{ contract_address: self.tutorial_address() })
    }
    #[inline(always)]
    fn rng_dispatcher(self: @WorldStorage) -> IRngDispatcher {
        (IRngDispatcher{ contract_address: self.rng_address() })
    }
    #[inline(always)]
    fn rng_mock_dispatcher(self: @WorldStorage) -> IRngMockDispatcher {
        (IRngMockDispatcher{ contract_address: self.rng_mock_address() })
    }
    #[inline(always)]
    fn duel_token_dispatcher(self: @WorldStorage) -> IDuelTokenDispatcher {
        (IDuelTokenDispatcher{ contract_address: self.duel_token_address() })
    }
    #[inline(always)]
    fn duelist_token_dispatcher(self: @WorldStorage) -> IDuelistTokenDispatcher {
        (IDuelistTokenDispatcher{ contract_address: self.duelist_token_address() })
    }   
    #[inline(always)]
    fn pack_token_dispatcher(self: @WorldStorage) -> IPackTokenDispatcher {
        (IPackTokenDispatcher{ contract_address: self.pack_token_address() })
    }
    #[inline(always)]
    fn fame_coin_dispatcher(self: @WorldStorage) -> IFameCoinDispatcher {
        (IFameCoinDispatcher{ contract_address: self.fame_coin_address() })
    }
    #[inline(always)]
    fn fools_coin_dispatcher(self: @WorldStorage) -> IFoolsCoinDispatcher {
        (IFoolsCoinDispatcher{ contract_address: self.fools_coin_address() })
    }
    // need access to store...
    #[inline(always)]
    fn lords_dispatcher(ref self: Store) -> Erc20Dispatcher {
        (Erc20Dispatcher{ contract_address: self.get_config_lords_address() })
        // (ierc20(self.get_config_lords_address()))
    }
    #[inline(always)]
    fn vrf_dispatcher(ref self: Store) -> IVrfProviderDispatcher {
        (IVrfProviderDispatcher{ contract_address: self.get_config_vrf_address() })
    }


    //--------------------------
    // test dispatchers
    // (use only in tests)
    //
    #[inline(always)]
    fn lords_mock_dispatcher(self: @WorldStorage) -> ILordsMockDispatcher {
        (ILordsMockDispatcher{ contract_address: self.lords_mock_address() })
    }
    #[inline(always)]
    fn vrf_mock_dispatcher(self: @WorldStorage) -> IVrfProviderDispatcher {
        (IVrfProviderDispatcher{ contract_address: self.vrf_mock_address() })
    }

}
