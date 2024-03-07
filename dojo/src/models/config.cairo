use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

const CONFIG_KEY: u8 = 1;

#[derive(Model, Copy, Drop, Serde)]
struct Config {
    #[key]
    key: u8,
    //------
    initialized: bool,
    paused: bool,
    treasury_address: ContractAddress,
}

#[derive(Copy, Drop)]
struct ConfigManager {
    world: IWorldDispatcher
}

#[generate_trait]
impl ConfigImpl of ConfigManagerTrait {
    fn new(world: IWorldDispatcher) -> ConfigManager {
        ConfigManager { world }
    }

    fn get(self: ConfigManager) -> Config {
        get!(self.world, (CONFIG_KEY), Config)
    }

    fn set(self: ConfigManager, config: Config) {
        set!(self.world, (config));
    }
}
