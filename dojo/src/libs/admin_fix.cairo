// use core::num::traits::Zero;
// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage, IWorldDispatcherTrait};

use crate::models::pool::PoolTrait;
use core::num::traits::Zero;
use dojo::model::{
    Model,
    ModelPtr,
    ModelStorage,
    // ModelValueStorage,
};
use pistols::models::{
    config::{Config},
    challenge::{Challenge},
    duelist::{DuelistAssignment, CauseOfDeath},
    pack::{Pack},
    pool::{Pool, PoolType},
};
use pistols::types::{
    constants::{RULES},
};
use pistols::interfaces::dns::{
    DnsTrait,
    IFameCoinDispatcherTrait,
    IBankProtectedDispatcher, IBankProtectedDispatcherTrait,
    IDuelistTokenProtectedDispatcherTrait,
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
    fn velords_migrate_pools(ref store: Store) {
        let config: Config = store.get_config();
        //
        // 1. Pools distribution
        Self::_velords_distribute_revenue(ref store, @config);
        Self::_velords_reorg_pools(ref store, @config);
    }

    fn _velords_distribute_revenue(ref store: Store, config: @Config) {
        //
        // Peg Pool distribution
        let mut purchases_pool: Pool = store.get_pool(PoolType::Purchases);
        let purchases_lords: u128 = purchases_pool.balance_lords;
        assert(purchases_lords.is_non_zero(), 'ADMIN: Invalid pegged lords');
        let lords_underware: u128 = MathTrait::percentage(purchases_lords, RULES::UNDERWARE_PERCENT);
        let lords_realms: u128 = MathTrait::percentage(purchases_lords, RULES::REALMS_PERCENT + RULES::FEES_PERCENT);
        let lords_distributed: u128 = (lords_underware + lords_realms);
        // transfer
        assert(config.treasury_address.is_non_zero(), 'ADMIN: Invalid treasury');
        assert(config.realms_address.is_non_zero(), 'ADMIN: Invalid realms');
        let bank_dispatcher: IBankProtectedDispatcher = store.world.bank_protected_dispatcher();
        bank_dispatcher.transfer_lords(*config.treasury_address, lords_underware);
        bank_dispatcher.transfer_lords(*config.realms_address, lords_realms);
        // emit event
        let past_season_id: u32 = *config.current_season_id - 1;
        store.emit_purchase_distribution(
            past_season_id,
            store.world.bank_address(),
            ZERO(), // purchase token_address
            array![], // token_ids
            lords_distributed,
            lords_underware,
            lords_realms,
            0, // lords_fees
            0, // lords_season
        );
        // update pool
        purchases_pool.withdraw_lords(lords_distributed);
        store.set_pool(@purchases_pool);
    }

    fn _velords_reorg_pools(ref store: Store, config: @Config) {
        // let lords_balance: u128 = store.lords_dispatcher().balance_of(store.world.bank_address()).low;
        let fame_supply: u128 = store.world.fame_coin_dispatcher().total_supply().low;
        //
        // PoolType::Purchases was distributed, left only unopened packs share
        //
        // PoolType::Claimable is just a deposit of LORDS, no changes made
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

    //
    // set pending challenges season_id to past season (will expire)
    // 
    // SELECT duel_id, duel_type, state, season_id
    // FROM "pistols-Challenge"
    // where duel_type="Ranked"
    // and season_id=0
    // --and state="InProgress"
    //
    fn velords_migrate_ranked_challenges(ref store: Store, duel_ids: Span<u128>) {
        let past_season_id: u32 = store.get_current_season_id() - 1;
        let ptrs: Span<ModelPtr<Challenge>> = Model::<Challenge>::ptrs_from_keys(duel_ids);
        let mut season_ids: Array<u32> = array![];
        for _ in 0..duel_ids.len() {
            season_ids.append(past_season_id);
        }
        store.world.write_member_of_models_legacy(ptrs, selector!("season_id"), season_ids.span());
    }

    //
    // set duelists assignments to past season
    // 
    // SELECT duelist_id, queue_id
    // FROM "pistols-DuelistAssignment"
    // where queue_id="Ranked"
    //
    fn velords_migrate_ranked_duelists(ref store: Store, duelist_ids: Span<u128>) {
        let past_season_id: u32 = store.get_current_season_id() - 1;
        let ptrs: Span<ModelPtr<DuelistAssignment>> = Model::<DuelistAssignment>::ptrs_from_keys(duelist_ids);
        let mut season_ids: Array<u32> = array![];
        for _ in 0..duelist_ids.len() {
            season_ids.append(past_season_id);
        }
        store.world.write_member_of_models_legacy(ptrs, selector!("season_id"), season_ids.span());
    }
    fn velords_migrate_memorialize_duelists(ref store: Store, duelist_ids: Array<u128>) {
        store.world.duelist_token_protected_dispatcher().memorialize_duelists(duelist_ids, CauseOfDeath::Ranked);
    }

    //
    // adds pegged_lords_amount to unopened packs
    //
    // SELECT pack_id, lords_amount
    // FROM "pistols-Pack"
    // where is_open=0
    //
    fn velords_migrate_packs(ref store: Store, pack_ids: Span<u128>) {
        let ptrs: Span<ModelPtr<Pack>> = Model::<Pack>::ptrs_from_keys(pack_ids);
        let lords_amounts: Array<u128> = store.world.read_member_of_models_legacy(ptrs, selector!("lords_amount"));
        let mut pegged_lords_amounts: Array<u128> = array![];
        for i in 0..lords_amounts.len() {
            pegged_lords_amounts.append(MathTrait::percentage(*lords_amounts[i], RULES::SEASON_PERCENT));
        }
        store.world.write_member_of_models_legacy(ptrs, selector!("pegged_lords_amount"), pegged_lords_amounts.span());
    }

}
