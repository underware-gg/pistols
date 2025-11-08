// use core::num::traits::Zero;
// use starknet::{ContractAddress};
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

}
