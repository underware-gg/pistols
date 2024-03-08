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
        let (world, system, owner, other) = utils::setup_world();
        let (admin) = utils::setup_admin(world);
        let (lords) = utils::setup_lords(world);
        utils::execute_initialize(admin, owner, zero_address(), lords.contract_address);
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
