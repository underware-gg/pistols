// use core::num::traits::Zero;
// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage, IWorldDispatcherTrait};

use pistols::models::{
    config::{Config},
    pack::{PackType, PackTypeTrait},
    pool::{Pool, PoolTrait, PoolType},
};
use pistols::interfaces::dns::{
    DnsTrait,
    IPackTokenDispatcherTrait,
};
use pistols::libs::store::{Store, StoreTrait};


//--------------------------------
// Admin fix functions
//

#[generate_trait]
pub impl AdminFixImpl of AdminFixTrait {
    fn pause_unpause(ref store: Store, is_paused: bool) {
        let mut config: Config = store.get_config();
        config.is_paused = is_paused;
        store.set_config(@config);
    }

    //--------------------------------
    // 2025-05-21
    //
    // purchases and free duelists sponsored LORDS were initially deposited in the same Purchases pool
    // introducing Claimable pool, we need to move sponsored LORDS to it
    //
    fn fix_claimable_pool(ref store: Store) -> u128 {
        // calculate the amount of existing packs that must stay on the Purchases pool
        // (at this moment, all purchases are of PackType::GenesisDuelists5x)
        let packs_supply: u128 = store.world.pack_token_dispatcher().total_supply().low;
        let price_pack: u128 = PackType::GenesisDuelists5x.descriptor().price_lords;
        let amount_purchases: u128 = (packs_supply * price_pack);
        // check if purchases balance is ok
        let mut pool_purchases: Pool = store.get_pool(PoolType::Purchases);
        assert(pool_purchases.balance_lords >= amount_purchases, 'ADMIN_FIX: Purchases is low!');
        // the remaining LORDS must be moved to the Claimable pool
        let amount_claimable: u128 = (pool_purchases.balance_lords - amount_purchases);
        if (amount_claimable != 0) {
            // transfer LORDS from purchases to claimable pool
            let mut pool_claimable: Pool = store.get_pool(PoolType::Claimable);
            pool_purchases.withdraw_lords(amount_claimable);
            pool_claimable.deposit_lords(amount_claimable);
            store.set_pool(@pool_claimable);
            store.set_pool(@pool_purchases);
        }
        // returns the amount of LORDS moved to the claimable pool
        (amount_claimable)
    }
}
