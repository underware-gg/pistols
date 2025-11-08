// use core::num::traits::Zero;
use starknet::{ContractAddress};
// use dojo::world::{WorldStorage, IWorldDispatcherTrait};

use dojo::model::{
    // Model,
    // ModelPtr,
    // ModelStorage,
    // ModelValueStorage,
};
use pistols::models::{
    config::{Config},
};
use pistols::interfaces::dns::{
    // DnsTrait,
    // IFameCoinDispatcherTrait,
    // IBankProtectedDispatcher, IBankProtectedDispatcherTrait,
    // IDuelistTokenProtectedDispatcherTrait,
};
use pistols::utils::{
    // address::{ZERO},
    // math::{MathTrait},
};
use pistols::models::events::{
    SeasonLeaderboardPosition,
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
    // maintenance updates
    //
    fn urgent_update(ref store: Store) {
    }

    fn emit_past_season_leaderboard_event(ref store: Store,
        season_id: u32,
        duelist_ids: Array<u128>,
        points: Array<u16>,
        player_addresses: Array<ContractAddress>,
        lords_amount: Array<u128>,
    ) {
        let mut positions: Array<SeasonLeaderboardPosition> = array![];
        for i in 0..duelist_ids.len() {
            positions.append(SeasonLeaderboardPosition {
                duelist_id: *duelist_ids[i],
                points: *points[i],
                player_address: *player_addresses[i],
                lords_amount: *lords_amount[i],
            });
        };
        // emit season leaderboard event
        store.emit_season_leaderboard(season_id, positions);
    }
}
