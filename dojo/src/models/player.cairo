use starknet::{ContractAddress};
use pistols::models::duelist::{Totals};
use pistols::models::ring::{RingType};
pub use pistols::types::duelist_profile::{DuelistProfile};


#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Player {
    #[key]
    pub player_address: ContractAddress,   // controller wallet
    //-----------------------
    pub timestamps: PlayerTimestamps,
    pub totals: Totals,
    pub alive_duelist_count: u16,
    pub active_signet_ring: RingType,
    pub referrer_address: ContractAddress,
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct PlayerTimestamps {
    pub registered: u64,
    pub claimed_gift: u64,
    // generic flags
    pub claimed_starter_pack: bool,
}

#[derive(Clone, Drop, Serde)]
#[derive(DojoLegacyStore)]
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

#[derive(Clone, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct PlayerDelegation {
    #[key]
    pub player_address: ContractAddress,    // controller wallet
    #[key]
    pub delegatee_address: ContractAddress,
    //-----------------------
    pub can_play_game: bool,
}


//--------------------------
// Player tags
//
#[derive(Clone, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct PlayerTeamFlags {
    #[key]
    pub player_address: ContractAddress,   // controller wallet
    //-----------------------
    pub is_team_member: bool,
    pub is_admin: bool,
}
#[derive(Clone, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct PlayerFlags {
    #[key]
    pub player_address: ContractAddress,   // controller wallet
    //-----------------------
    pub is_blocked: bool,
}


//--------------------------
// OFF-CHAIN signed messages
//
// all models need...
// #[key]
// pub identity: ContractAddress,
//
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct PlayerOnline {
    #[key]
    pub identity: ContractAddress,          // controller wallet
    //-----------------------
    pub timestamp: u64,                     // seconds since epoch
    pub available: bool,                    // available for matchmaking
}
// #[derive(Copy, Drop, Serde)]
// #[dojo::model]
// pub struct PlayerBookmark {
//     //
//     // deprecated for PlayerBookmarkEvent
//     //
//     #[key]
//     pub identity: ContractAddress,          // controller wallet
//     #[key]
//     pub target_address: ContractAddress,    // account or contract address
//     #[key]
//     pub target_id: u128,                    // (optional) token id
//     //-----------------------
//     pub enabled: bool,
// }


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::match_queue::{QueueId};
use pistols::models::duelist::{DuelistAssignmentTrait};
use pistols::models::events::{Activity, ActivityTrait};
use pistols::interfaces::dns::{DnsTrait, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::arrays::{ArrayUtilsTrait};
use pistols::utils::address::{ZERO};
use pistols::utils::math::{MathU16};

mod PlayerErrors {
    pub const PLAYER_NOT_REGISTERED: felt252    = 'PLAYER: Not registered';
}

#[generate_trait]
pub impl PlayerImpl of PlayerTrait {
    fn check_in(ref store: Store, activity: Activity, player_address: ContractAddress, identifier: felt252, referrer_address: ContractAddress) {
        let mut player: Player = store.get_player(player_address);
        let mut save_player: bool = (
            // create player if does not exist and this event can register a player
            if (!player.exists()) {
                assert(activity.can_register_player(), PlayerErrors::PLAYER_NOT_REGISTERED);
                player.timestamps.registered = starknet::get_block_timestamp();
                (true)
            } else {
                (false)
            }
        );
        save_player = (
            if (activity == Activity::PackStarter) {
                player.timestamps.claimed_starter_pack = true;
                player.referrer_address =
                    if (referrer_address.is_non_zero() && referrer_address != player_address) {referrer_address}
                    else {ZERO()};
                (true)
            } else if (activity == Activity::ClaimedGift) {
                player.timestamps.claimed_gift = starknet::get_block_timestamp();
                (true)
            } else {
                (false)
            }
        ) || save_player;
        if (save_player) {
            store.set_player(@player);
        }
        activity.emit(ref store.world, player_address, identifier);
    }
    fn append_alive_duelist(ref store: Store, player_address: ContractAddress, quantity: u16) {
        let mut alive_duelist_count: u16 = store.get_player_alive_duelist_count(player_address);
        alive_duelist_count += quantity;
        store.set_player_alive_duelist_count(player_address, alive_duelist_count);
    }
    fn remove_alive_duelist(ref store: Store, player_address: ContractAddress, quantity: u16) {
        let mut alive_duelist_count: u16 = store.get_player_alive_duelist_count(player_address);
        alive_duelist_count = MathU16::sub(alive_duelist_count, quantity);
        store.set_player_alive_duelist_count(player_address, alive_duelist_count);
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
    fn remove(ref self: PlayerDuelistStack, duelist_id: u128) -> bool {
        let current_level: u8 = self.level;
        self.stacked_ids = self.stacked_ids.remove(@duelist_id);
        self.level = self.stacked_ids.len().try_into().unwrap();
        if (self.level < current_level) {
            if (self.active_duelist_id == duelist_id) {
                self.active_duelist_id = if (self.level > 0) {*self.stacked_ids[0]} else {0};
            }
            (true)
        } else {
            // no changes
            (false)
        }
    }
    // for bots only (no active duelist)
    fn get_first_available_bot_duelist_id(self: @PlayerDuelistStack, store: @Store, lives_staked: u8, queue_id: Option<QueueId>) -> Option<u128> {
        let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
        for i in 0..self.stacked_ids.len() {
            let duelist_id: u128 = *self.stacked_ids[i];
            if (
                DuelistAssignmentTrait::is_bot_duelist_available_for_challenge(store, duelist_id, queue_id) &&
                duelist_dispatcher.life_count(duelist_id) >= lives_staked
            ) {
                return Option::Some(duelist_id);
            }
        };
        (Option::None)
    }
}

#[generate_trait]
pub impl PlayerDelegationImpl of PlayerDelegationTrait {
    fn can_play_game(store: @Store, player_address: ContractAddress, caller_address: ContractAddress) -> bool {
        if (player_address == caller_address) {
            (true)
        } else {
            (store.get_player_delegation_can_play_game(player_address, caller_address))
        }
    }
}


//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod unit {
    use super::{PlayerDuelistStack, PlayerDuelistStackTrait};
    use pistols::types::duelist_profile::{DuelistProfile, GenesisKey};
    use pistols::utils::arrays::{ArrayTestUtilsTrait};

    fn _test_stack(ref stack: PlayerDuelistStack, expected: Span<u128>) {
        ArrayTestUtilsTrait::assert_span_eq(stack.stacked_ids.span(), expected, format!("stacked_ids[{}]", expected.len()));
        assert_eq!(stack.level.into(), expected.len(), "level");
        if (expected.len() > 0) {
            assert_eq!(stack.active_duelist_id, *expected[0], "active_duelist_id");
        } else {
            assert_eq!(stack.active_duelist_id, 0, "active_ZERO");
        }
    }

    #[test]
    fn test_stack_append_remove() {
        let profile = DuelistProfile::Genesis(GenesisKey::Duke);
        let mut stack = PlayerDuelistStack {
            player_address: 0x1.try_into().unwrap(),
            duelist_profile: profile,
            active_duelist_id: 0,
            level: 0,
            stacked_ids: array![],
        };
        stack.append(1);
        stack.append(2);
        stack.append(3);
        stack.append(5);
        stack.append(4);
        _test_stack(ref stack, [1, 2, 3, 5, 4].span());
        // remove one by one...
        stack.remove(1);
        _test_stack(ref stack, [2, 3, 5, 4].span());
        stack.remove(5);
        _test_stack(ref stack, [2, 3, 4].span());
        stack.remove(999); // no changes
        _test_stack(ref stack, [2, 3, 4].span());
        stack.remove(3);
        _test_stack(ref stack, [2, 4].span());
        stack.remove(4);
        _test_stack(ref stack, [2].span());
        stack.remove(2);
        _test_stack(ref stack, [].span());
    }
}
