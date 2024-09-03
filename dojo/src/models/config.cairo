use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

mod CONFIG {
    const CONFIG_KEY: u8 = 1;
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Config {
    #[key]
    key: u8,
    //------
    treasury_address: ContractAddress,
    is_paused: bool,
}
