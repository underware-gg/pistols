use starknet::ContractAddress;

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
pub use pistols::interfaces::ierc20::{ierc20, ERC20ABIDispatcher, ERC20ABIDispatcherTrait};
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
    fn lords_dispatcher(self: @Config) -> ERC20ABIDispatcher {
        (ierc20(*self.lords_address))
    }
}
