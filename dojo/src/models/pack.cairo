use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
pub enum PackType {
    Undefined,      // 0
    Duelists5x,     // 1
}

//------------------------
// Pack (consumable token)
//
// #[derive(Copy, Drop, Serde)] // ByteArray is not copiable!
#[derive(Clone, Drop, Serde)]   // pass to functions using duelist.clone()
#[dojo::model]
pub struct Pack {
    #[key]
    pub pack_id: u128,   // erc721 token_id
    //-----------------------
    pub pack_type: PackType,
    pub seed: felt252,
}


//----------------------------------
// Traits
//
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
