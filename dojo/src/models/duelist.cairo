use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::interfaces::systems::{WorldSystemsTrait};
use pistols::interfaces::ierc721::{ierc721, IERC721Dispatcher, IERC721DispatcherTrait};
use pistols::types::constants::{CONST};


#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
enum Archetype {
    Undefined,  // 0
    Villainous, // 1
    Trickster,  // 2
    Honourable, // 3
}

#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
enum ProfilePicType {
    Undefined,  // 0
    Duelist,    // 1
    External,   // 2
    // StarkId,    // stark.id (ipfs?)
    // ERC721,     // Owned erc-721 (hard to validate and keep up to date)
    // Discord,    // Linked account (had to be cloned, or just copy the url)
}



//---------------------
// Duelist
//
// #[derive(Copy, Drop, Serde)] // ByteArray is not copiable!
#[derive(Clone, Drop, Serde)]   // pass to functions using duelist.clone()
#[dojo::model]
pub struct Duelist {
    #[key]
    duelist_id: u128,   // erc721 token_id
    //-----------------------
    name: felt252,
    profile_pic_uri: ByteArray,     // can be anything
    profile_pic_type: ProfilePicType,
    timestamp: u64,                 // date registered
    score: Score,
}

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Pact {
    #[key]
    table_id: felt252,
    #[key]
    pair: u128,     // xor'd duelists as u256(address).low
    //------------
    duel_id: u128,  // current Challenge, or 0x0
}

//
// Duelist scores and wager balance per Table
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Scoreboard {
    #[key]
    table_id: felt252,
    #[key]
    duelist_id: u128,
    //------------
    score: Score,
    wager_won: u128,
    wager_lost: u128,
} // [160] [128] [128]

#[derive(Copy, Drop, Serde, IntrospectPacked)]
struct Score {
    honour: u8,             // 0..100
    level_villain: u8,      // 0..100
    level_trickster: u8,    // 0..100
    level_lord: u8,         // 0..100
    total_duels: u16,
    total_wins: u16,
    total_losses: u16,
    total_draws: u16,
    honour_history: u64,    // past 8 duels, each byte holds one duel honour
} // [160]



//----------------------------------
// Traits
//

#[generate_trait]
impl DuelistTraitImpl of DuelistTrait {
    fn is_owner(self: Duelist, address: ContractAddress) -> bool {
        // for testing
        let address_felt: felt252 = address.into();
        if (address_felt == self.duelist_id.into()) { return (true); }
        (false)
    }
    // try to convert a challenged account address to duelist id
    // retuns 0 if the address is not an id
    fn try_address_to_id(address: ContractAddress) -> u128 {
        let as_felt: felt252 = address.into();
        let as_u256: u256 = as_felt.into();
        if (as_u256 <= CONST::MAX_DUELIST_ID.into()) {(as_u256.low)} else {(0)}
    }
    // "cast" an address to an id for pacts
    // the low part is good enough
    fn address_as_id(address: ContractAddress) -> u128 {
        let as_felt: felt252 = address.into();
        let as_u256: u256 = as_felt.into();
        (as_u256.low)
    }
}

#[generate_trait]
impl ScoreTraitImpl of ScoreTrait {
    #[inline(always)]
    fn is_villain(self: Score) -> bool { (self.level_villain > 0) }
    #[inline(always)]
    fn is_trickster(self: Score) -> bool { (self.level_trickster > 0) }
    #[inline(always)]
    fn is_lord(self: Score) -> bool { (self.level_lord > 0) }
    #[inline(always)]
    fn format_honour(value: u8) -> ByteArray { (format!("{}.{}", value/10, value%10)) }
}

impl ArchetypeIntoFelt252 of Into<Archetype, felt252> {
    fn into(self: Archetype) -> felt252 {
        match self {
            Archetype::Undefined => 0,
            Archetype::Villainous => 1,
            Archetype::Trickster => 2,
            Archetype::Honourable => 3,
        }
    }
}
impl ArchetypeIntoByteArray of Into<Archetype, ByteArray> {
    fn into(self: Archetype) -> ByteArray {
        match self {
            Archetype::Undefined => "Undefined",
            Archetype::Villainous => "Villainous",
            Archetype::Trickster => "Trickster",
            Archetype::Honourable => "Honourable",
        }
    }
}



//----------------------------------
// Manager
//

#[derive(Copy, Drop)]
struct DuelistManager {
    world: IWorldDispatcher,
    token_dispatcher: IERC721Dispatcher,
}

#[generate_trait]
impl DuelistManagerTraitImpl of DuelistManagerTrait {
    fn new(world: IWorldDispatcher) -> DuelistManager {
        let contract_address: ContractAddress = world.token_duelist_address();
        assert(contract_address.is_non_zero(), 'DuelistManager: null token addr');
        let token_dispatcher = ierc721(contract_address);
        (DuelistManager { world, token_dispatcher })
    }
    fn get(self: DuelistManager, duelist_id: u128) -> Duelist {
        DuelistStore::get(self.world, duelist_id)
    }
    fn set(self: DuelistManager, duelist: Duelist) {
        set!(self.world, (duelist));
    }
    fn get_token_dispatcher(self: DuelistManager) -> IERC721Dispatcher {
        (self.token_dispatcher)
    }
    fn owner_of(self: DuelistManager, duelist_id: u128) -> ContractAddress {
        (self.token_dispatcher.owner_of(duelist_id.into()))
    }
    fn exists(self: DuelistManager, duelist_id: u128) -> bool {
        (self.owner_of(duelist_id).is_non_zero())
    }
    fn is_owner_of(self: DuelistManager, address: ContractAddress, duelist_id: u128) -> bool {
        (self.owner_of(duelist_id)  == address)
    }
}
