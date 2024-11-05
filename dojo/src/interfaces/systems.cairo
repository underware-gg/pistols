use starknet::{ContractAddress, ClassHash};
use dojo::world::{WorldStorage, WorldStorageTrait, IWorldDispatcher, IWorldDispatcherTrait, Resource};

pub use pistols::systems::{
    admin::{IAdminDispatcher, IAdminDispatcherTrait},
    bank::{IBankDispatcher, IBankDispatcherTrait},
    game::{IGameDispatcher, IGameDispatcherTrait},
    rng::{IRngDispatcher, IRngDispatcherTrait},
    vrf_mock::{IVRFMockDispatcher, IVRFMockDispatcherTrait},
    tokens::{
        duel_token::{IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
        duelist_token::{IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
        fame_coin::{IFameCoinDispatcher, IFameCoinDispatcherTrait},
        lords_mock::{ILordsMockDispatcher, ILordsMockDispatcherTrait},
    }
};
pub use pistols::interfaces::ierc20::{ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
pub use pistols::libs::store::{Store, StoreTrait};
pub use pistols::models::config::{CONFIG, Config, ConfigTrait};
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
    // mocks
    const LORDS_MOCK: felt252 = selector_from_tag!("pistols-lords_mock");
    const VR_MOCK: felt252 = selector_from_tag!("pistols-vrf_mock");
    // models
    const CONFIG: felt252 = selector_from_tag!("pistols-Config");
    const TABLE_CONFIG: felt252 = selector_from_tag!("pistols-TableConfig");
    const TOKEN_CONFIG: felt252 = selector_from_tag!("pistols-TokenConfig");
    const COIN_CONFIG: felt252 = selector_from_tag!("pistols-CoinConfig");
    const PAYMENT: felt252 = selector_from_tag!("pistols-Payment");
}

#[generate_trait]
pub impl SystemsImpl of SystemsTrait {
    fn contract_address(self: @WorldStorage, contract_name: @ByteArray) -> ContractAddress {
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

    //
    // system addresses
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
    fn rng_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"rng"))
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
    fn fame_coin_address(self: @WorldStorage) -> ContractAddress {
        (self.contract_address(@"fame_coin"))
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

    //
    // dispatchers
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
    fn rng_dispatcher(self: @WorldStorage) -> IRngDispatcher {
        (IRngDispatcher{ contract_address: self.rng_address() })
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
    fn fame_coin_dispatcher(self: @WorldStorage) -> IFameCoinDispatcher {
        (IFameCoinDispatcher{ contract_address: self.fame_coin_address() })
    }
    #[inline(always)]
    fn lords_dispatcher(self: @WorldStorage) -> ERC20ABIDispatcher {
        let mut store: Store = StoreTrait::new(*self);
        (store.get_config().lords_dispatcher())
    }
    #[inline(always)]
    fn vrf_dispatcher(self: @WorldStorage) -> IVRFMockDispatcher {
        let mut store: Store = StoreTrait::new(*self);
        (store.get_config().vrf_dispatcher())
    }

    //
    // test dispatchers
    #[inline(always)]
    fn lords_mock_dispatcher(self: @WorldStorage) -> ILordsMockDispatcher {
        (ILordsMockDispatcher{ contract_address: self.lords_mock_address() })
    }
    #[inline(always)]
    fn vrf_mock_dispatcher(self: @WorldStorage) -> IVRFMockDispatcher {
        (IVRFMockDispatcher{ contract_address: self.vrf_mock_address() })
    }

    //
    // validators
    #[inline(always)]
    fn is_duel_contract(self: @WorldStorage, address: ContractAddress) -> bool {
        (address == self.duel_token_address())
    }
    #[inline(always)]
    fn is_duelist_contract(self: @WorldStorage, address: ContractAddress) -> bool {
        (address == self.duelist_token_address())
    }
}
