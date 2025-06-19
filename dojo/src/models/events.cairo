use starknet::{ContractAddress};
use pistols::models::pool::{LordsReleaseBill};
use pistols::types::rules::{RewardValues};

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
    ChallengeCanceled,  // 8
    ChallengeReplied,   // 9
    MovesCommitted,     // 10
    MovesRevealed,      // 11
    PlayerTimedOut,     // 12
    ChallengeResolved,  // 13
    ChallengeDraw,      // 14
    ClaimedGift,        // 15
    ClaimedRing,        // 16
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum ChallengeAction {
    Undefined,  // 0
    Reply,      // 1
    Commit,     // 2
    Reveal,     // 3
    Waiting,    // 4
    Results,    // 5
    Finished,   // 6
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum SocialPlatform {
    Undefined,  // 0
    Discord,    // 1
    Telegram,   // 2
    X,          // 3
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PlayerSetting {
    Undefined,                              // 0
    OptOutNotifications: SocialPlatform,    // 1
}
#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PlayerSettingValue {
    Undefined,      // 0
    Boolean: bool,  // 1
}


//----------------------------------
// ON-CHAIN events (historical)
//
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:true)]
pub struct PlayerActivityEvent {
    #[key]
    pub player_address: ContractAddress,
    //-----------------------
    pub timestamp: u64,         // seconds since epoch
    pub activity: Activity,
    pub identifier: felt252,    // (optional) duel_id, duelist_id, ...
    pub is_public: bool,        // can be displayed in activity log
}
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:true)]
pub struct LordsReleaseEvent {
    #[key]
    pub season_id: u32,
    //-----------------------
    pub bill: LordsReleaseBill,
    pub duel_id: u128,
    pub timestamp: u64,
}



//----------------------------------
// ON-CHAIN events (non-historical)
//
// #[derive(Copy, Drop, Serde)]
// #[dojo::event(historical:false)]
// pub struct CallToActionEvent {
//     //
//     // deprecated for CallToChallengeEvent
//     //
//     #[key]
//     pub player_address: ContractAddress,
//     #[key]
//     pub duelist_id: u128,
//     //-----------------------
//     pub duel_id: u128,
//     pub call_to_action: bool,
//     pub timestamp: u64,
// }
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct CallToChallengeEvent {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub duel_id: u128,
    //-----------------------
    pub action: ChallengeAction,
    pub timestamp: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct PlayerBookmarkEvent {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub target_address: ContractAddress,    // account or contract address
    #[key]
    pub target_id: u128,                    // (optional) token id
    //-----------------------
    pub enabled: bool,
}

#[derive(Clone, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct PlayerSocialLinkEvent {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub social_platform: SocialPlatform,
    //-----------------------
    pub user_name: ByteArray,
    pub user_id: ByteArray,
    pub avatar: ByteArray,
}

#[derive(Clone, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct PlayerSettingEvent {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub setting: PlayerSetting,
    //-----------------------
    pub value: PlayerSettingValue,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical:false)]
pub struct ChallengeRewardsEvent {
    #[key]
    pub duel_id: u128,
    #[key]
    pub duelist_id: u128,
    //-----------------------
    pub rewards: RewardValues,
    // TODO: enable this??
    // pub timestamp: u64,
}


//----------------------------------
// Traits
//
use dojo::world::{WorldStorage};
use dojo::event::EventStorage;

#[generate_trait]
pub impl ActivityImpl of ActivityTrait {
    fn emit(self: @Activity, ref world: WorldStorage, player_address: ContractAddress, identifier: felt252) {
        world.emit_event(@PlayerActivityEvent{
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
            Activity::PackOpened |
            Activity::ClaimedRing => false,
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
