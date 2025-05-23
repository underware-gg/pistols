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
    pub current_season_id: u32,
    pub is_paused: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct TokenConfig {
    #[key]
    pub token_address: ContractAddress,
    //------
    pub minter_address: ContractAddress,
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
use pistols::utils::misc::{ZERO};

#[generate_trait]
pub impl ConfigManagerImpl of ConfigManagerTrait {
    fn initialize() -> Config {
        (Config {
            key: CONFIG::CONFIG_KEY,
            treasury_address: ZERO(),
            lords_address: ZERO(),
            vrf_address: ZERO(),
            current_season_id: 0,
            is_paused: false,
        })
    }
}
