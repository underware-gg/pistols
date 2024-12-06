use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum Activity {
    Undefined,        // 0
    CreatedDuelist,   // 1
    CreatedChallenge, // 2
    RepliedChallenge, // 3
    CommittedMoves,   // 4
    RevealedMoves,    // 5
    Online,           // 6
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
}


//---------------------
// OFF-CHAIN events
//

//
// on-chain activity
#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerActivity {
    #[key]
    pub address: ContractAddress,
    //-----------------------
    pub timestamp: u64,
    pub activity: Activity,
    pub identifier: felt252,
}

//
// off-chain activity
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerOnline {
    #[key]
    pub address: ContractAddress,
    //-----------------------
    pub timestamp: u64,
}
// #[derive(Copy, Drop, Serde)]
// #[dojo::model]
// pub struct PlayerTutorialProgress {
//     #[key]
//     pub address: ContractAddress,
//     //-----------------------
//     pub progress: TutorialProgress,
// }
// #[derive(Copy, Drop, Serde)]
// #[dojo::model]
// pub struct PlayerFollows {
//     #[key]
//     pub player_a: ContractAddress,
//     #[key]
//     pub player_b: ContractAddress,
//     //-----------------------
//     pub follows: bool,
// }


//----------------------------------
// Traits
//
use starknet::{get_block_timestamp};
use dojo::world::{WorldStorage};
use dojo::event::EventStorage;
use pistols::libs::store::{Store, StoreTrait};
use pistols::models::consumable::{ConsumableType, ConsumableTypeTrait};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::types::constants::{CONST};

mod Errors {
    const PLAYER_NOT_REGISTERED: felt252    = 'PLAYER: Not registered';
    const INSUFFICIENT_CONSUMABLES: felt252 = 'PLAYER: Insufficient consumable';
}

#[generate_trait]
impl PlayerImpl of PlayerTrait {
    fn check_in(ref store: Store, address: ContractAddress, activity: Activity, identifier: felt252) {
        let mut player: Player = store.get_player(address);
        if (!player.exists()) {
            assert(activity.can_register_player(), Errors::PLAYER_NOT_REGISTERED);
            player.timestamp_registered = get_block_timestamp();
            store.set_player(@player);
            // grant duelists
            ConsumableType::DuelistToken.grant(ref store, address, CONST::DUELIST_PACK_AMOUNT_REGISTER);
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
        });
    }
    fn can_register_player(self: Activity) -> bool {
        // match self {
        //     Activity::CreatedDuelist |
        //     Activity::CreatedChallenge |
        //     Activity::RepliedChallenge => true,
        //     _ => false,
        // }
        // TODO: remove this when we do a fresh deployment
        (true)
    }
}
