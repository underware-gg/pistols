use starknet::ContractAddress;

mod PLAYER_ACTIVITY {
    const MINT_DUELIST: felt252 = 'Created duelist';
    const MINT_DUEL: felt252 = 'Created challenge';
    const COMMIT: felt252 = 'Commited moves';
    const REVEAL: felt252 = 'Revealed moves';
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
// OFF-CHAIN messages
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerActive {
    #[key]
    pub address: ContractAddress,
    //-----------------------
    pub activity: felt252,
    pub timestamp: u64,
}
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerTutorialProgress {
    #[key]
    pub address: ContractAddress,
    //-----------------------
    pub progress: TutorialProgress,
}
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerFollows {
    #[key]
    pub player_a: ContractAddress,
    #[key]
    pub player_b: ContractAddress,
    //-----------------------
    pub follows: bool,
}


//----------------------------------
// Traits
//
use starknet::{get_block_timestamp};
use pistols::libs::store::{Store, StoreTrait};
use pistols::models::consumable::{ConsumableType, ConsumableTypeTrait};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::types::constants::{CONST};

mod Errors {
    const PLAYER_NOT_REGISTERED: felt252    = 'PLAYER: Not registered';
    const INSUFFICIENT_CONSUMABLES: felt252 = 'PLAYER: Insufficient consumable';
}

#[generate_trait]
impl PlayerTraitImpl of PlayerTrait {
    fn check_in(ref store: Store, address: ContractAddress, activity: felt252) {
        let mut player: Player = store.get_player(address);
        if (!player.exists()) {
            let can_register: bool = (
                activity == PLAYER_ACTIVITY::MINT_DUELIST
            );
            assert(can_register, Errors::PLAYER_NOT_REGISTERED);
            player.timestamp_registered = get_block_timestamp();
            store.set_player(@player);
            // grant duelists
            ConsumableType::DuelistToken.grant(ref store, address, CONST::DUELIST_PACK_AMOUNT_REGISTER);
        }
        store.set_player_active(@PlayerActive{
            address,
            activity,
            timestamp: get_block_timestamp(),
        });
    }
    #[inline(always)]
    fn exists(self: Player) -> bool {
        (self.timestamp_registered != 0)
    }
}
