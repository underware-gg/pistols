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
    pub is_paused: bool,
}


//---------------------------
// Traits
//
use pistols::utils::misc::{ZERO};

#[generate_trait]
impl ConfigImpl of ConfigTrait {
    fn new() -> Config {
        (Config {
            key: CONFIG::CONFIG_KEY,
            treasury_address: ZERO(),
            is_paused: false,
        })
    }
}
