use starknet::{ContractAddress};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum RingType {
    Unknown,            // 0
    GoldSignetRing,     // 1
    SilverSignetRing,   // 2
    LeadSignetRing,     // 3
}

//------------------------
// Signet Ring tokens
//
#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct Ring {
    #[key]
    pub ring_id: u128,   // erc721 token_id
    //-----------------------
    pub ring_type: RingType,
    pub claimed_by: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[derive(DojoLegacyStore)]
#[dojo::model]
pub struct RingBalance {
    #[key]
    pub player_address: ContractAddress,
    #[key]
    pub ring_type: RingType,
    //-----------------------
    pub claimed: bool,
    pub balance: u128,
}



//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct RingDescriptor {
    pub id: felt252, // @generateContants:shortstring
    pub name: felt252, // @generateContants:shortstring
    pub description: felt252, // @generateContants:shortstring
    pub image_url: felt252, // @generateContants:shortstring
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum RingType
mod RING_TYPES {
    use super::{RingDescriptor};
    pub const Unknown: RingDescriptor = RingDescriptor {
        id: 'Unknown',
        name: 'Unknown',
        description: 'Unknown',
        image_url: '/tokens/Unknown.jpg',
    };
    pub const GoldSignetRing: RingDescriptor = RingDescriptor {
        id: 'GoldSignetRing',
        name: 'Gold Signet Ring',
        description: 'Played Season 1',
        image_url: '/tokens/rings/GoldRing.png',
    };
    pub const SilverSignetRing: RingDescriptor = RingDescriptor {
        id: 'SilverSignetRing',
        name: 'Silver Signet Ring',
        description: 'Played Season 2 to 4',
        image_url: '/tokens/rings/SilverRing.png',
    };
    pub const LeadSignetRing: RingDescriptor = RingDescriptor {
        id: 'LeadSignetRing',
        name: 'Lead Signet Ring',
        description: 'Played Season 5 to 9',
        image_url: '/tokens/rings/LeadRing.png',
    };
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::challenge::{ChallengeValue};
use pistols::types::challenge_state::{ChallengeStateTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::math::{MathU128};

#[generate_trait]
pub impl RingTypeImpl of RingTypeTrait {
    fn get_season_ring_type(store: @Store, recipient: ContractAddress, duel_id: u128) -> Option<RingType> {
        let challenge: ChallengeValue = store.get_challenge_value(duel_id);
        (if (
            recipient.is_non_zero() &&
            challenge.state.is_concluded() &&
            challenge.season_id.is_non_zero() &&
            (challenge.address_a == recipient || challenge.address_b == recipient))
        {
            if (challenge.season_id == 1) {
                (Option::Some(RingType::GoldSignetRing))
            }
            else if (challenge.season_id <= 4) {
                (Option::Some(RingType::SilverSignetRing))
            }
            else if (challenge.season_id <= 9) {
                (Option::Some(RingType::LeadSignetRing))
            }
            else {
                (Option::None)
            }
        }
        else {
            (Option::None)
        })
    }
    //
    // Ring data
    fn descriptor(self: @RingType) -> RingDescriptor {
        match self {
            RingType::Unknown           => RING_TYPES::Unknown,
            RingType::GoldSignetRing    => RING_TYPES::GoldSignetRing,
            RingType::SilverSignetRing  => RING_TYPES::SilverSignetRing,
            RingType::LeadSignetRing    => RING_TYPES::LeadSignetRing,
        }
    }
    #[inline(always)]
    fn identifier(self: @RingType) -> felt252 {
        ((*self).descriptor().id)
    }
    #[inline(always)]
    fn name(self: @RingType) -> ByteArray {
        ((*self).descriptor().name.to_string())
    }
    #[inline(always)]
    fn description(self: @RingType) -> ByteArray {
        ((*self).descriptor().description.to_string())
    }
    fn image_url(self: @RingType) -> ByteArray {
        ((*self).descriptor().image_url.to_string())
    }
    // higher weight, higher value/importance
    fn weight(self: @RingType) -> u8 {
        match self {
            RingType::Unknown           => 0,
            RingType::LeadSignetRing    => 1,
            RingType::SilverSignetRing  => 2,
            RingType::GoldSignetRing    => 3,
        }
    }
    fn get_player_highest_ring(store: @Store, player_address: ContractAddress) -> RingType {
        (
            if (store.get_player_has_signet_ring(player_address, RingType::GoldSignetRing)) {RingType::GoldSignetRing}
            else if (store.get_player_has_signet_ring(player_address, RingType::SilverSignetRing)) {RingType::SilverSignetRing}
            else if (store.get_player_has_signet_ring(player_address, RingType::LeadSignetRing)) {RingType::LeadSignetRing}
            else {RingType::Unknown}
        )
    }
    //
    // Ring bonus
    fn apply_ring_bonus(self: @RingType, ref fools_gained: u128) {
        if (fools_gained.is_non_zero()) {
            let ring_bonus: u8 = (match self {
                RingType::GoldSignetRing => {40},
                RingType::SilverSignetRing => {20},
                RingType::LeadSignetRing => {10},
                RingType::Unknown => {0},
            });
            if (ring_bonus.is_non_zero()) {
                fools_gained += MathU128::percentage(fools_gained, ring_bonus);
            }
        }
    }
}



//---------------------------
// Converters
//
pub impl RingTypeDebug of core::fmt::Debug<RingType> {
    fn fmt(self: @RingType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        f.buffer.append(@(*self).name());
        Result::Ok(())
    }
}
pub impl RingTypeDisplay of core::fmt::Display<RingType> {
    fn fmt(self: @RingType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        f.buffer.append(@(*self).name());
        Result::Ok(())
    }
}

impl RingTypePartialOrd of PartialOrd<RingType> {
    fn le(lhs: RingType, rhs: RingType) -> bool {
        (!Self::gt(lhs, rhs))
    }
    fn ge(lhs: RingType, rhs: RingType) -> bool {
        (Self::gt(lhs, rhs) || lhs == rhs)
    }
    fn lt(lhs: RingType, rhs: RingType) -> bool {
        (!Self::gt(lhs, rhs) && lhs != rhs)
    }
    fn gt(lhs: RingType, rhs: RingType) -> bool {
        let l: u8 = lhs.weight();
        let r: u8 = rhs.weight();
        (l > r)
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{RingType};

    #[test]
    fn test_ring_type_partial_ord() {
        // gt >
        assert!(RingType::GoldSignetRing > RingType::SilverSignetRing, "bad ring gt");
        assert!(RingType::GoldSignetRing > RingType::LeadSignetRing, "bad ring gt");
        assert!(RingType::GoldSignetRing > RingType::Unknown, "bad ring gt");
        assert!(RingType::SilverSignetRing > RingType::LeadSignetRing, "bad ring gt");
        assert!(RingType::SilverSignetRing > RingType::Unknown, "bad ring gt");
        assert!(RingType::LeadSignetRing > RingType::Unknown, "bad ring gt");
        // lt <
        assert!(RingType::Unknown < RingType::LeadSignetRing, "bad ring lt");
        assert!(RingType::Unknown < RingType::SilverSignetRing, "bad ring lt");
        assert!(RingType::Unknown < RingType::GoldSignetRing, "bad ring lt");
        assert!(RingType::LeadSignetRing < RingType::SilverSignetRing, "bad ring lt");
        assert!(RingType::LeadSignetRing < RingType::GoldSignetRing, "bad ring lt");
        assert!(RingType::SilverSignetRing < RingType::GoldSignetRing, "bad ring lt");
    }
}
