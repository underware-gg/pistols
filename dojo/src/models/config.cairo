use starknet::{ContractAddress};

pub mod CONFIG {
    pub const CONFIG_KEY: u8 = 1;
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Config {
    #[key]
    pub key: u8,
    //------
    pub treasury_address: ContractAddress,
    pub lords_address: ContractAddress,
    pub vrf_address: ContractAddress,
    pub season_table_id: felt252,
    pub is_paused: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    pub token_address: ContractAddress,
    //------
    pub minter_address: ContractAddress,
    pub renderer_address: ContractAddress,
    pub minted_count: u128,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct CoinConfig {
    #[key]
    pub coin_address: ContractAddress,
    //------
    pub minter_address: ContractAddress,
    pub faucet_amount: u128, // zero if faucet is closed
}


//---------------------------
// Traits
//
pub use pistols::interfaces::ierc20::{ierc20, Erc20Dispatcher, Erc20DispatcherTrait};
pub use pistols::interfaces::vrf::{IVrfProviderDispatcher, IVrfProviderDispatcherTrait};
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl ConfigManagerImpl of ConfigManagerTrait {
    fn initialize() -> Config {
        (Config {
            key: CONFIG::CONFIG_KEY,
            treasury_address: ZERO(),
            lords_address: ZERO(),
            vrf_address: ZERO(),
            season_table_id: 0,
            is_paused: false,
        })
    }
}

#[generate_trait]
pub impl ConfigImpl of ConfigTrait {
    fn lords_dispatcher(self: @Config) -> Erc20Dispatcher {
        (ierc20(*self.lords_address))
    }
    fn vrf_dispatcher(self: @Config) -> IVrfProviderDispatcher {
        (IVrfProviderDispatcher{ contract_address: *self.vrf_address })
    }
}
