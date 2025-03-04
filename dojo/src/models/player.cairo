use starknet::{ContractAddress};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Activity {
    Undefined,          // 0
    TutorialFinished,   // 1
    PackStarter,        // 2
    PackPurchased,      // 3
    PackOpened,         // 4
    DuelistSpawned,     // 5
    DuelistDied,        // 6
    ChallengeCreated,   // 7
    ChallengeExpired,   // 8
    ChallengeReplied,   // 9
    MovesCommitted,     // 10
    MovesRevealed,      // 11
    ChallengeResolved,  // 12
    ChallengeDraw,      // 13
}

//---------------------
// Player
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub player_address: ContractAddress,   // controller wallet
    //-----------------------
    pub timestamps: PlayerTimestamps,
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct PlayerTimestamps {
    pub registered: u64,
    pub claimed_starter_pack: bool,
}


//---------------------
// ON-CHAIN events
//
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:true)]
pub struct PlayerActivity {
    #[key]
    pub player_address: ContractAddress,
    //-----------------------
    pub timestamp: u64,         // seconds since epoch
    pub activity: Activity,
    pub identifier: felt252,    // (optional) duel_id, duelist_id, ...
    pub is_public: bool,        // can be displayed in activity log
}
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct PlayerRequiredAction {
    #[key]
    pub duelist_id: u128,
    //-----------------------
    pub duel_id: u128,
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
use dojo::world::{WorldStorage};
use dojo::event::EventStorage;
use pistols::libs::store::{Store, StoreTrait};

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
pub impl ActivityImpl of ActivityTrait {
    fn emit(self: @Activity, ref world: WorldStorage, player_address: ContractAddress, identifier: felt252) {
        world.emit_event(@PlayerActivity{
            player_address,
            timestamp: starknet::get_block_timestamp(),
            activity: *self,
            identifier,
            is_public: self.is_public(),
        });
    }
    fn is_public(self: @Activity) -> bool {
        match self {
            Activity::PackPurchased |
            Activity::PackOpened => false,
            _ => true,
        }
    }
    fn can_register_player(self: @Activity) -> bool {
        match self {
            // Activity::PackStarter => true,
            // Activity::TutorialFinished => true,
            // Activity::DuelistSpawned => true,
            // Activity::ChallengeCreated => true,
            // Activity::ChallengeReplied => true,
            // _ => false,
            _ => true,
        }
    }
}
