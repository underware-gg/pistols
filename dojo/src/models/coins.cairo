use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};
use pistols::utils::math::{MathU256};

mod coins {
    const LORDS: u8 = 1;
    // number of valid coins
    const COUNT: u8 = 1;
}

const ETH_TO_WEI: u256 = 1_000_000_000_000_000_000;

#[derive(Model, Copy, Drop, Serde)]
struct Coin {
    #[key]
    key: u8,
    //------
    contract_address: ContractAddress,
    description: felt252,
    fee_min: u256,
    fee_pct: u8,
    enabled: bool,
}

#[derive(Copy, Drop)]
struct CoinManager {
    world: IWorldDispatcher
}

#[generate_trait]
impl CoinManagerTraitImpl of CoinManagerTrait {
    fn new(world: IWorldDispatcher) -> CoinManager {
        CoinManager { world }
    }
    fn exists(self: CoinManager, coin_key: u8) -> bool {
        (coin_key >= 1 && coin_key <= coins::COUNT)
    }
    fn get(self: CoinManager, coin_key: u8) -> Coin {
        assert(self.exists(coin_key) == true, 'Invalid coin');
        get!(self.world, (coin_key), Coin)
    }
    fn set(self: CoinManager, Coin: Coin) {
        set!(self.world, (Coin));
    }
}

#[generate_trait]
impl CoinTraitImpl of CoinTrait {
    fn ierc20(self: Coin) -> IERC20Dispatcher {
        (ierc20(self.contract_address))
    }
    fn calc_fee(self: Coin, wager_value: u256) -> u256 {
        (MathU256::max(self.fee_min, (wager_value / 100) * self.fee_pct.into()))
    }
    // TODO
    // fn to_wei(self: Coin, value: u256) -> u256 {
    //     // get decimals and multiply
    // }
}
