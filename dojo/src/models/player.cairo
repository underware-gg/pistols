use starknet::{ContractAddress};
pub use pistols::types::duelist_profile::{DuelistProfile};


#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub player_address: ContractAddress,   // controller wallet
    //-----------------------
    pub timestamps: PlayerTimestamps,
    // pub referral_code: felt252,
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct PlayerTimestamps {
    pub registered: u64,
    pub claimed_starter_pack: bool,
}


#[derive(Clone, Drop, Serde)]
#[dojo::model]
pub struct PlayerDuelistStack {
    #[key]
    pub player_address: ContractAddress,    // controller wallet
    #[key]
    pub duelist_profile: DuelistProfile,
    //-----------------------
    pub active_duelist_id: u128,            // the active dueling Duelist id
    pub level: u8,                          // current level (stack size)
    pub stacked_ids: Array<u128>,           // stacked Duelist ids
}


//--------------------------
// OFF-CHAIN signed messages
//
// all models need...
// #[key]
// pub identity: ContractAddress,
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerOnline {
    #[key]
    pub identity: ContractAddress,
    //-----------------------
    pub timestamp: u64,     // seconds since epoch
}
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerBookmark {
    #[key]
    pub identity: ContractAddress,
    #[key]
    pub target_address: ContractAddress,    // account or contract address
    #[key]
    pub target_id: u128,                    // (optional) token id
    //-----------------------
    pub enabled: bool,
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::events::{Activity, ActivityTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{ArrayUtilsTrait};

mod PlayerErrors {
    pub const PLAYER_NOT_REGISTERED: felt252    = 'PLAYER: Not registered';
}

#[generate_trait]
pub impl PlayerImpl of PlayerTrait {
    fn check_in(ref store: Store, activity: Activity, player_address: ContractAddress, identifier: felt252) {
        let mut player: Player = store.get_player(player_address);
        if (!player.exists()) {
            assert(activity.can_register_player(), PlayerErrors::PLAYER_NOT_REGISTERED);
            player.timestamps.registered = starknet::get_block_timestamp();
            player.timestamps.claimed_starter_pack = (activity == Activity::PackStarter);
            store.set_player(@player);
        } else if (activity == Activity::PackStarter) {
            player.timestamps.claimed_starter_pack = true;
            store.set_player(@player);
        }
        activity.emit(ref store.world, player_address, identifier);
    }
    #[inline(always)]
    fn exists(self: @Player) -> bool {
        (*self.timestamps.registered != 0)
    }
}

#[generate_trait]
pub impl PlayerDuelistStackImpl of PlayerDuelistStackTrait {
    fn append(ref self: PlayerDuelistStack, duelist_id: u128) {
        self.stacked_ids.append(duelist_id);
        self.level = self.stacked_ids.len().try_into().unwrap();
        if (self.active_duelist_id.is_zero()) {
            self.active_duelist_id = duelist_id;
        }
    }
    fn remove(ref self: PlayerDuelistStack, duelist_id: u128) {
        self.stacked_ids = self.stacked_ids.remove(@duelist_id);
        self.level = self.stacked_ids.len().try_into().unwrap();
        if (self.active_duelist_id == duelist_id) {
            self.active_duelist_id = if (self.level > 0) {*self.stacked_ids[0]} else {0};
        }
    }
}
