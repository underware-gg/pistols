pub use pistols::types::duelist_profile::{DuelistProfile};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PackType {
    Unknown,            // 0
    StarterPack,        // 1
    GenesisDuelists5x,  // 2
    FreeDuelist,        // 3
    SingleDuelist,      // 4
    BotDuelist,         // 5
}

//------------------------
// Pack (consumable token)
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pack {
    #[key]
    pub pack_id: u128,   // erc721 token_id
    //-----------------------
    pub pack_type: PackType,
    pub seed: felt252,
    pub lords_amount: u128,
    pub is_open: bool,
    pub duelist_profile: Option<DuelistProfile>,
}



//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct PackDescriptor {
    pub id: felt252, // @generateContants:shortstring
    pub name: felt252, // @generateContants:shortstring
    pub image_file_closed: felt252, // @generateContants:shortstring
    pub image_file_open: felt252, // @generateContants:shortstring
    pub can_purchase: bool,
    pub price_lords: u128,
    pub quantity: usize,
    pub contents: felt252, // @generateContants:shortstring
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum PackType
mod PACK_TYPES {
    use super::{PackDescriptor};
    use pistols::types::constants::{CONST};
    pub const Unknown: PackDescriptor = PackDescriptor {
        id: 'Unknown',
        name: 'Unknown',
        image_file_closed: 'Unknown.jpg',
        image_file_open: 'Unknown.jpg',
        can_purchase: false,
        price_lords: 0,
        quantity: 0,
        contents: 'Void',
    };
    pub const StarterPack: PackDescriptor = PackDescriptor {
        id: 'StarterPack',
        name: 'Starter Pack',
        image_file_closed: 'StarterPack.jpg',
        image_file_open: 'StarterPack.jpg',
        can_purchase: false,
        price_lords: (20 * CONST::ETH_TO_WEI.low),
        quantity: 2,
        contents: 'Ser Walker & Lady Vengeance',
    };
    pub const GenesisDuelists5x: PackDescriptor = PackDescriptor {
        id: 'GenesisDuelists5x',
        name: 'Genesis Duelists 5-pack',
        image_file_closed: 'GenesisDuelists5x.png',
        image_file_open: 'GenesisDuelists5x.png',
        can_purchase: true,
        price_lords: (50 * CONST::ETH_TO_WEI.low),
        quantity: 5,
        contents: 'Five Random Genesis Duelists',
    };
    pub const FreeDuelist: PackDescriptor = PackDescriptor {
        id: 'FreeDuelist',
        name: 'Free Genesis Duelist',
        image_file_closed: 'FreeDuelist.png',
        image_file_open: 'FreeDuelist.png',
        can_purchase: false,
        price_lords: (10 * CONST::ETH_TO_WEI.low),
        quantity: 1,
        contents: 'One Random Genesis Duelist',
    };
    pub const SingleDuelist: PackDescriptor = PackDescriptor {
        id: 'SingleDuelist',
        name: 'Single Duelist',
        image_file_closed: 'SingleDuelist.png',
        image_file_open: 'SingleDuelist.png',
        can_purchase: false,
        price_lords: (10 * CONST::ETH_TO_WEI.low),
        quantity: 1,
        contents: 'One Special Duelist',
    };
    pub const BotDuelist: PackDescriptor = PackDescriptor {
        id: 'BotDuelist',
        name: 'Bot Duelist',
        image_file_closed: 'Unknown.jpg',
        image_file_open: 'Unknown.jpg',
        can_purchase: false,
        price_lords: (10 * CONST::ETH_TO_WEI.low),
        quantity: 1,
        contents: 'One Bot Duelist',
    };
}


//----------------------------------
// Traits
//
use pistols::models::pool::{PoolType};
use pistols::types::duelist_profile::{DuelistProfileTrait};
use pistols::utils::short_string::{ShortStringTrait};

#[generate_trait]
pub impl PackImpl of PackTrait {
    fn contents(self: @Pack) -> ByteArray {
        (match self.duelist_profile {
            Option::Some(profile) => {
                ((*profile).card_name())
            },
            Option::None => {
                ((*self.pack_type).descriptor().contents.to_string())
            },
        })
    }
}

#[generate_trait]
pub impl PackTypeImpl of PackTypeTrait {
    fn descriptor(self: @PackType) -> PackDescriptor {
        match self {
            PackType::Unknown               => PACK_TYPES::Unknown,
            PackType::StarterPack           => PACK_TYPES::StarterPack,
            PackType::GenesisDuelists5x     => PACK_TYPES::GenesisDuelists5x,
            PackType::FreeDuelist           => PACK_TYPES::FreeDuelist,
            PackType::SingleDuelist         => PACK_TYPES::SingleDuelist,
            PackType::BotDuelist             => PACK_TYPES::BotDuelist,
        }
    }
    #[inline(always)]
    fn identifier(self: @PackType) -> felt252 {
        ((*self).descriptor().id)
    }
    #[inline(always)]
    fn name(self: @PackType) -> ByteArray {
        ((*self).descriptor().name.to_string())
    }
    fn image_url(self: @PackType, base_uri: ByteArray, is_open: bool) -> ByteArray {
        (format!("{}/pistols/tokens/packs/{}", base_uri,
            if (is_open) {self.descriptor().image_file_open.to_string()}
            else {self.descriptor().image_file_closed.to_string()})
        )
    }
    #[inline(always)]
    fn can_purchase(self: @PackType) -> bool {
        ((*self).descriptor().can_purchase)
    }
    #[inline(always)]
    fn deposited_pool_type(self: @PackType) -> PoolType {
        if (self.can_purchase()) {
            (PoolType::Purchases)
        } else {
            (PoolType::Claimable)
        }
    }
    #[inline(always)]
    fn mint_fee(self: @PackType) -> u128 {
        ((*self).descriptor().price_lords)
    }
}



//---------------------------
// Converters
//
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl PackTypeDebug of core::fmt::Debug<PackType> {
    fn fmt(self: @PackType, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        f.buffer.append(@(*self).name());
        Result::Ok(())
    }
}
