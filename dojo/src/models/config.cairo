use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

mod CONFIG {
    const CONFIG_KEY: u8 = 1;
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Config {
    #[key]
    pub key: u8,
    //------
    pub treasury_address: ContractAddress,
    pub lords_address: ContractAddress,
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
    // use the Payment model for pricing
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
pub use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::utils::misc::{ZERO};

#[generate_trait]
impl ConfigImpl of ConfigTrait {
    fn new() -> Config {
        (Config {
            key: CONFIG::CONFIG_KEY,
            treasury_address: ZERO(),
            lords_address: ZERO(),
            is_paused: false,
        })
    }
    fn lords_dispatcher(self: @Config) -> IERC20Dispatcher {
        (ierc20(*self.lords_address))
    }
}

#[generate_trait]
impl ConfigEntityImpl of ConfigEntityTrait {
    fn lords_dispatcher(self: @ConfigEntity) -> IERC20Dispatcher {
        (ierc20(*self.lords_address))
    }
}
