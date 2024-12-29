use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PackType {
    Undefined,      // 0
    Duelists5x,     // 1
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


//----------------------------------
// Traits
//
use pistols::systems::tokens::pack_token::pack_token::{Errors as PackErrors};
use pistols::interfaces::systems::{
    SystemsTrait,
    IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
};
use pistols::models::duelist::{ProfileType};
use pistols::libs::store::{Store, StoreTrait};
use pistols::types::constants::{CONST};

#[generate_trait]
impl PackTypeImpl of PackTypeTrait {
    fn id(self: PackType) -> felt252 {
        match self {
            PackType::Duelists5x => 'Duelists5x',
            _ => '',
        }
    }
    fn name(self: PackType) -> ByteArray {
        match self {
            PackType::Duelists5x => "Duelists 5-pack",
            _ => "Unknown",
        }
    }
    fn image_url(self: PackType) -> ByteArray {
        match self {
            PackType::Duelists5x => "/tokens/duelists_5x.png",
            _ => "/tokens/unknown.jpg",
        }
    }
    fn mint_fee(self: PackType) -> u256 {
        match self {
            PackType::Duelists5x => (100 * CONST::ETH_TO_WEI),
            _ => 0,
        }
    }
}

#[generate_trait]
impl PackImpl of PackTrait {
    fn open(ref self: Pack, ref store: Store, recipient: ContractAddress) -> Span<u128> {
        assert(!self.is_open, PackErrors::ALREADY_OPENED);
        let token_ids: Span<u128> = match self.pack_type {
            PackType::Duelists5x => {
                let duelist_dispatcher: IDuelistTokenDispatcher = store.world.duelist_token_dispatcher();
                (duelist_dispatcher.mint_duelists(recipient, 5, self.seed, ProfileType::Duelist(0)))
            },
            _ => { [].span() },
        };
        self.is_open = true;
        store.set_pack(@self);
        (token_ids)
    }
}
