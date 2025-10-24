// use core::num::traits::Zero;
// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage, IWorldDispatcherTrait};

use core::num::traits::Zero;
use crate::interfaces::dns::IBankDispatcher;
use pistols::models::{
    config::{Config},
    pack::{Pack, PackType, PackTypeTrait},
    pool::{Pool, PoolTrait, PoolType},
};
use pistols::types::{
    constants::{RULES},
};
use pistols::interfaces::dns::{
    DnsTrait,
    IFameCoinDispatcherTrait,
    IBankProtectedDispatcher, IBankProtectedDispatcherTrait,
    Erc20DispatcherTrait,
};
use pistols::utils::{
    address::{ZERO},
    math::{MathTrait},
};
use pistols::libs::{
    store::{Store, StoreTrait},
};


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
    // 2025-10-27
    //
    // veLords pools migration
    // execute after collect_season(12)
    //
    fn velords_migration(ref store: Store) {
        let config: Config = store.get_config();
        let past_season_id: u32 = config.current_season_id - 1;
        //
        // 1. Pools distribution
        Self::_velords_distribute_revenue(ref store, @config);
        Self::_velords_reorg_pools(ref store, @config);

        //
        // X. Clear matchmaking queues
        // X. Memorize enlisted Duelists, not playable anymore
    }

    fn _velords_distribute_revenue(ref store: Store, config: @Config) {
        //
        // Peg Pool distribution
        let purchases_pool: Pool = store.get_pool(PoolType::Purchases);
        let lords_pegged: u128 = purchases_pool.balance_lords;
        assert(lords_pegged.is_non_zero(), 'ADMIN: Invalid pegged lords');
        let lords_underware: u128 = MathTrait::percentage(lords_pegged, RULES::UNDERWARE_PERCENT);
        let lords_realms: u128 = MathTrait::percentage(lords_pegged, RULES::REALMS_PERCENT + RULES::FEES_PERCENT);
        let lords_amount: u128 = (lords_underware + lords_realms);
        // transfer
        assert(config.treasury_address.is_non_zero(), 'ADMIN: Invalid treasury');
        assert(config.realms_address.is_non_zero(), 'ADMIN: Invalid realms');
        let bank_dispatcher: IBankProtectedDispatcher = store.world.bank_protected_dispatcher();
        bank_dispatcher.transfer_lords(*config.treasury_address, lords_underware);
        bank_dispatcher.transfer_lords(*config.realms_address, lords_realms);
        // emit event
        store.emit_purchase_distribution(
            *config.current_season_id - 1,
            store.world.bank_address(),
            ZERO(), // purchase token_address
            array![], // token_ids
            lords_amount,
            lords_underware,
            lords_realms,
            0, // lords_fees
            0, // lords_season
        );
    }

    fn _velords_reorg_pools(ref store: Store, config: @Config) {
        // let lords_balance: u128 = store.lords_dispatcher().balance_of(store.world.bank_address()).low;
        let fame_supply: u128 = store.world.fame_coin_dispatcher().total_supply().low;
        //
        // PoolType::Purchases was distributed, left only unopened packs share
        //
        // PoolType::Claimable is just a deposit of LORDS
        //
        // PoolType::FamePeg.balance_lords has all opened Duelists LORDS
        // PoolType::FamePeg.balance_fame must be the full FAME supply
        let mut fame_peg_pool: Pool = store.get_pool(PoolType::FamePeg);
        fame_peg_pool.balance_fame = fame_supply;
        store.set_pool(@fame_peg_pool);
        //
        // PoolType::Sacrifice is empty
        store.set_pool(@Pool {
            pool_id: PoolType::Sacrifice,
            balance_lords: 0,
            balance_fame: 0,
        });
    }

    fn velords_migrate_ranked_challenges(ref store: Store, duel_ids: Array<u128>) {
        for duel_id in duel_ids {
        }
    }

    fn velords_migrate_ranked_duelists(ref store: Store, duelist_ids: Array<u128>) {
        for duelist_id in duelist_ids {
        }
    }

    fn velords_migrate_packs(ref store: Store, pack_ids: Array<u128>) {
        for pack_id in pack_ids {
            let mut pack: Pack = store.get_pack(pack_id);
            pack.pegged_lords_amount = MathTrait::percentage(pack.lords_amount, RULES::SEASON_PERCENT);
            store.set_pack(@pack);
        }
    }

}
