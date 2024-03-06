use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

mod constants {
    const PISTOLS_CONFIG_KEY: u8 = 1;
    const DUEL_FEE_MIN: u8 = 0x5;
    const DUEL_FEE_PCT: u8 = 0x10;
}

#[derive(Model, Copy, Drop, Serde)]
struct Config {
    #[key]
    key: u8,
    //------
    initialized: bool,
    lords_address: ContractAddress,
    duel_fee_min: u8,
    duel_fee_pct: u8,
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
        get!(self.world, (constants::PISTOLS_CONFIG_KEY), Config)
    }

    fn set(self: ConfigManager, config: Config) {
        set!(self.world, (config));
    }
}
