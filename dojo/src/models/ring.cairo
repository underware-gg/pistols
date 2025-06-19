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
#[dojo::model]
pub struct Ring {
    #[key]
    pub ring_id: u128,   // erc721 token_id
    //-----------------------
    pub ring_type: RingType,
    pub claimed_by: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
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
        description: 'Played Season 1 & 2',
        image_url: '/tokens/rings/GoldRing.jpg',
    };
    pub const SilverSignetRing: RingDescriptor = RingDescriptor {
        id: 'SilverSignetRing',
        name: 'Silver Signet Ring',
        description: 'Played Season 2 & 3',
        image_url: '/tokens/rings/SilverRing.jpg',
    };
    pub const LeadSignetRing: RingDescriptor = RingDescriptor {
        id: 'LeadSignetRing',
        name: 'Lead Signet Ring',
        description: 'Played Season 5 to 10',
        image_url: '/tokens/rings/LeadRing.jpg',
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

#[generate_trait]
pub impl RingTypeImpl of RingTypeTrait {
    fn get_season_ring_type(store: @Store, recipient: ContractAddress, duel_id: u128) -> Option<RingType> {
        let challenge: ChallengeValue = store.get_challenge_value(duel_id);
        (if (
            recipient.is_non_zero() &&
            challenge.state.is_concluded() &&
            (challenge.address_a == recipient || challenge.address_b == recipient))
        {
            if (challenge.season_id <= 2) {
                {Option::Some(RingType::GoldSignetRing)}
            }
            else if (challenge.season_id <= 4) {
                {Option::Some(RingType::SilverSignetRing)}
            }
            else if (challenge.season_id <= 10) {
                {Option::Some(RingType::LeadSignetRing)}
            }
            else {
                {Option::None}
            }
        }
        else {
            {Option::None}
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
}



//---------------------------
// Converters
//
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl RingTypeDebug of core::fmt::Debug<RingType> {
    fn fmt(self: @RingType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        f.buffer.append(@(*self).name());
        Result::Ok(())
    }
}
