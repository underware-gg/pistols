use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

const CONFIG_KEY: u8 = 1;

#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Config {
    #[key]
    key: u8,
    //------
    treasury_address: ContractAddress,
    paused: bool,
}

#[derive(Copy, Drop)]
struct ConfigManager {
    world: IWorldDispatcher
}

#[generate_trait]
impl ConfigManagerTraitImpl of ConfigManagerTrait {
    fn new(world: IWorldDispatcher) -> ConfigManager {
        (ConfigManager { world })
    }
    fn get(self: ConfigManager) -> Config {
        get!(self.world, (CONFIG_KEY), Config)
    }
    fn set(self: ConfigManager, config: Config) {
        set!(self.world, (config));
    }
}
