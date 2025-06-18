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
    pub granted_player_address: ContractAddress,
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
use pistols::interfaces::dns::{
    DnsTrait,
    IDuelistTokenProtectedDispatcherTrait,
};
use pistols::models::pool::{PoolType};
use pistols::types::duelist_profile::{DuelistProfile, GenesisKey};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl RingTypeImpl of RingTypeTrait {
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
