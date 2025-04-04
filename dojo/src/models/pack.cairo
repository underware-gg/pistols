use starknet::{ContractAddress};

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PackType {
    Unknown,        // 0
    StarterPack,    // 1
    Duelists5x,     // 2
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
}



//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct PackDescription {
    pub id: felt252, // @generateContants:shortstring
    pub name: felt252, // @generateContants:shortstring
    pub image_url_closed: felt252, // @generateContants:shortstring
    pub image_url_open: felt252, // @generateContants:shortstring
    pub can_purchase: bool,
    pub price_lords: u128,
    pub quantity: usize,
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum PackType
mod PACK_TYPES {
    use super::{PackDescription};
    use pistols::types::constants::{CONST};
    pub const Unknown: PackDescription = PackDescription {
        id: 'Unknown',
        name: 'Unknown',
        image_url_closed: '/tokens/Unknown.jpg',
        image_url_open: '/tokens/Unknown.jpg',
        can_purchase: false,
        price_lords: 0,
        quantity: 0,
    };
    pub const StarterPack: PackDescription = PackDescription {
        id: 'StarterPack',
        name: 'Starter Pack',
        image_url_closed: '/tokens/StarterPack.jpg',
        image_url_open: '/tokens/StarterPack.jpg',
        can_purchase: false,
        price_lords: 20 * CONST::ETH_TO_WEI.low,
        quantity: 2,
    };  
    pub const Duelists5x: PackDescription = PackDescription {
        id: 'Duelists5x',
        name: 'Duelists 5-pack',
        image_url_closed: '/tokens/Duelists5x.jpg',
        image_url_open: '/tokens/Duelists5x.jpg',
        can_purchase: true,
        price_lords: 50 * CONST::ETH_TO_WEI.low,
        quantity: 5,
    };
}


//----------------------------------
// Traits
//
use pistols::systems::tokens::pack_token::pack_token::{Errors as PackErrors};
use pistols::interfaces::dns::{
    DnsTrait,
    IDuelistTokenProtectedDispatcherTrait,
};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::libs::store::{Store, StoreTrait};

#[generate_trait]
pub impl PackImpl of PackTrait {
    fn open(ref self: Pack, ref store: Store, recipient: ContractAddress) -> Span<u128> {
        assert(!self.is_open, PackErrors::ALREADY_OPENED);
        let token_ids: Span<u128> = match self.pack_type {
            PackType::Unknown => { [].span() },
            PackType::StarterPack |
            PackType::Duelists5x => {
                (store.world.duelist_token_protected_dispatcher()
                    .mint_duelists(recipient, self.pack_type.description().quantity, self.seed)
                )
            },
        };
        self.is_open = true;
        store.set_pack(@self);
        (token_ids)
    }
}

#[generate_trait]
pub impl PackTypeImpl of PackTypeTrait {
    fn description(self: @PackType) -> PackDescription {
        match self {
            PackType::Unknown       => PACK_TYPES::Unknown,
            PackType::StarterPack   => PACK_TYPES::StarterPack,
            PackType::Duelists5x    => PACK_TYPES::Duelists5x,
        }
    }
    fn identifier(self: @PackType) -> felt252 {
        ((*self).description().id)
    }
    fn name(self: @PackType) -> ByteArray {
        ((*self).description().name.to_string())
    }
    fn image_url(self: @PackType, is_open: bool) -> ByteArray {
        if (is_open) {
            ((*self).description().image_url_open.to_string())
        } else {
            ((*self).description().image_url_closed.to_string())
        }
    }
    fn can_purchase(self: @PackType) -> bool {
        ((*self).description().can_purchase)
    }
    fn mint_fee(self: @PackType) -> u128 {
        ((*self).description().price_lords)
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
