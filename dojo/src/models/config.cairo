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
