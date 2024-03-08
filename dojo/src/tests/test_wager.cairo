#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::systems::admin::{IAdminDispatcher, IAdminDispatcherTrait};
    use pistols::models::config::{Config};
    use pistols::models::coins::{Coin, coins, ETH_TO_WEI};
    use pistols::systems::utils::{zero_address};
    use pistols::tests::utils::{utils};

    //
    // Initialize
    //

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_wager_ok() {
        let (world, system, admin, lords, owner, other, bummer) = utils::setup_world(true);
        let coin: Coin = admin.get_coin(coins::LORDS);

        assert(false, 'TODO');


    }


    // TODO: challenger balance (insufficient)
    // TODO: challenged balance (insifficient)
    
    // TODO: contract balance: zero > wager > zero
    // TODO: contract balance: zero > fees > zero

    // TODO: Withdraw: restore Challenger balance
    // TODO: Refuse: restore Challenger balance

}
