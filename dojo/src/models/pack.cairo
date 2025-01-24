use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PackType {
    Unknown,        // 0
    WelcomePack,    // 1
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
    pub is_open: bool,
}



//--------------------
// constants
//

#[derive(Copy, Drop, Serde, Default)]
pub struct PackDescription {
    id: felt252, // @generateContants:shortstring
    name: felt252, // @generateContants:shortstring
    image_url_closed: felt252, // @generateContants:shortstring
    image_url_open: felt252, // @generateContants:shortstring
    can_purchase: bool,
    price: u256,
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum PackType
mod PACK_TYPES {
    use super::{PackDescription};
    use pistols::types::constants::{CONST};
    const Unknown: PackDescription = PackDescription {
        id: 'Unknown',
        name: 'Unknown',
        image_url_closed: '/tokens/Unknown.jpg',
        image_url_open: '/tokens/Unknown.jpg',
        can_purchase: false,
        price: 0,
    };
    const WelcomePack: PackDescription = PackDescription {
        id: 'WelcomePack',
        name: 'Welcome Pack',
        image_url_closed: '/tokens/WelcomePack.jpg',
        image_url_open: '/tokens/WelcomePack.jpg',
        can_purchase: false,
        price: 0,
    };  
    const Duelists5x: PackDescription = PackDescription {
        id: 'Duelists5x',
        name: 'Duelists 5-pack',
        image_url_closed: '/tokens/Duelists5x.jpg',
        image_url_open: '/tokens/Duelists5x.jpg',
        can_purchase: true,
        price: 100 * CONST::ETH_TO_WEI,
    };
}


//----------------------------------
// Traits
//
use pistols::systems::tokens::pack_token::pack_token::{Errors as PackErrors};
use pistols::interfaces::systems::{
    SystemsTrait,
    IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
};
use pistols::models::duelist::{ProfileType};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::libs::store::{Store, StoreTrait};
use pistols::types::constants::{CONST};

#[generate_trait]
impl PackImpl of PackTrait {
    fn open(ref self: Pack, ref store: Store, recipient: ContractAddress) -> Span<u128> {
        assert(!self.is_open, PackErrors::ALREADY_OPENED);
        let token_ids: Span<u128> = match self.pack_type {
            PackType::Unknown => { [].span() },
            PackType::WelcomePack => {
                let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
                (duelist_dispatcher.mint_duelists(recipient, CONST::WELCOME_PACK_DUELIST_COUNT, self.seed))
            },
            PackType::Duelists5x => {
                let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
                (duelist_dispatcher.mint_duelists(recipient, 5, self.seed))
            },
        };
        self.is_open = true;
        store.set_pack(@self);
        (token_ids)
    }
}

#[generate_trait]
impl PackTypeImpl of PackTypeTrait {
    fn description(self: PackType) -> PackDescription {
        match self {
            PackType::Unknown       => PACK_TYPES::Unknown,
            PackType::WelcomePack   => PACK_TYPES::WelcomePack,
            PackType::Duelists5x    => PACK_TYPES::Duelists5x,
        }
    }
    fn identifier(self: PackType) -> felt252 {
        (self.description().id)
    }
    fn name(self: PackType) -> ByteArray {
        (self.description().name.to_string())
    }
    fn image_url(self: PackType, is_open: bool) -> ByteArray {
        if (is_open) {
            (self.description().image_url_open.to_string())
        } else {
            (self.description().image_url_closed.to_string())
        }
    }
    fn can_purchase(self: PackType) -> bool {
        (self.description().can_purchase)
    }
    fn mint_fee(self: PackType) -> u256 {
        (self.description().price)
    }
}
