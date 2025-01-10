use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Activity {
    Undefined,          // 0
    StartedTutorial,    // 1
    FinishedTutorial,   // 2
    WelcomePack,        // 3
    PurchasedPack,      // 4
    CreatedDuelist,     // 5
    CreatedChallenge,   // 6
    RepliedChallenge,   // 7
    CommittedMoves,     // 8
    RevealedMoves,      // 9
    Online,             // 10
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum TutorialProgress {
    None,               // 0
    FinishedFirst,      // 1
    FinishedSecond,     // 2
    FinishedFirstDuel,  // 3
}

//---------------------
// Player
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Player {
    #[key]
    pub address: ContractAddress,   // controller wallet
    //-----------------------
    pub timestamp_registered: u64,
    pub claimed_welcome_pack: bool,
}


//---------------------
// ON-CHAIN events
//
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:true)]
pub struct PlayerActivity {
    #[key]
    pub address: ContractAddress,
    //-----------------------
    pub timestamp: u64,         // seconds since epoch
    pub activity: Activity,
    pub identifier: felt252,    // (optional) duel_id, duelist_id, ...
    pub is_public: bool,        // should be notified in activity log
}
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct PlayerRequiredAction {
    #[key]
    pub address: ContractAddress,
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
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerTutorialProgress {
    #[key]
    pub identity: ContractAddress,
    //-----------------------
    pub progress: TutorialProgress,
}


//----------------------------------
// Traits
//
use starknet::{get_block_timestamp};
use dojo::world::{WorldStorage};
use dojo::event::EventStorage;
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::types::constants::{CONST};

mod PlayerErrors {
    const PLAYER_NOT_REGISTERED: felt252    = 'PLAYER: Not registered';
}

#[generate_trait]
impl PlayerImpl of PlayerTrait {
    fn check_in(ref store: Store, address: ContractAddress, activity: Activity, identifier: felt252) {
        let mut player: Player = store.get_player(address);
        if (!player.exists()) {
            assert(activity.can_register_player(), PlayerErrors::PLAYER_NOT_REGISTERED);
            player.timestamp_registered = get_block_timestamp();
            player.claimed_welcome_pack = (activity == Activity::WelcomePack);
            store.set_player(@player);
        } else if (activity == Activity::WelcomePack) {
            player.claimed_welcome_pack = true;
            store.set_player(@player);
        }
        activity.emit(ref store.world, address, identifier);
    }
    #[inline(always)]
    fn exists(self: Player) -> bool {
        (self.timestamp_registered != 0)
    }
}


#[generate_trait]
impl ActivityImpl of ActivityTrait {
    fn emit(self: Activity, ref world: WorldStorage, address: ContractAddress, identifier: felt252) {
        world.emit_event(@PlayerActivity{
            address,
            timestamp: get_block_timestamp(),
            activity: self,
            identifier,
            is_public: self.is_public(),
        });
    }
    fn is_public(self: Activity) -> bool {
        match self {
            Activity::StartedTutorial => false,
            _ => true,
        }
    }
    fn can_register_player(self: Activity) -> bool {
        match self {
            // Activity::WelcomePack => true,
            // Activity::StartedTutorial => true,
            // Activity::FinishedTutorial => true,
            // Activity::CreatedDuelist => true,
            // Activity::CreatedChallenge => true,
            // Activity::RepliedChallenge => true,
            // _ => false,
            _ => true,
        }
    }
}
