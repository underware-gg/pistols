use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::models::config::{ConfigManager, ConfigManagerTrait};
use pistols::interfaces::ierc721::{ierc721, IERC721Dispatcher, IERC721DispatcherTrait};
use pistols::types::constants::{constants};


#[derive(Serde, Copy, Drop, PartialEq, Introspect)]
enum Archetype {
    Undefined,  // 0
    Villainous, // 1
    Trickster,  // 2
    Honourable, // 3
}

mod profile_pic_type {
    const DUELIST: u8 = 1;      // profile_pic_uri = number
    const EXTERNAL: u8 = 2;     // image URL
    // const STARK_ID: u8 = 3;     // stark.id (ipfs?)
    // const ERC721: u8 = 4;       // Owned erc-721 (hard to validate and keep up to date)
    // const DISCORD: u8 = 5;      // Linked account (had to be cloned, or just copy the url)
}


//---------------------
// Duelist
//
// #[derive(Copy, Drop, Serde)] // ByteArray is not copiable!
#[derive(Clone, Drop, Serde)]   // pass to functions using duelist.clone()
#[dojo::model]
struct Duelist {
    #[key]
    duelist_id: u128,   // erc721 token_id
    //-----------------------
    name: felt252,
    profile_pic_uri: ByteArray,     // can be anything
    profile_pic_type: u8,
    timestamp: u64,                 // date registered
    score: Score,
}

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Pact {
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
struct Scoreboard {
    #[key]
    table_id: felt252,
    #[key]
    duelist_id: u128,
    //------------
    score: Score,
    wager_won: u256,
    wager_lost: u256,
} // [32, 128] [128] [128] [128, 96]

#[derive(Copy, Drop, Serde, Introspect)]
struct Score {
    honour: u8,             // 0..100
    level_villain: u8,      // 0..100
    level_trickster: u8,    // 0..100
    level_lord: u8,         // 0..100
    total_duels: u16,
    total_wins: u16,
    total_losses: u16,
    total_draws: u16,
    total_honour: u32,      // sum of al duels Honour
} // [128]



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
    // convert a challenged account address to duelist id
    // retuns 0 if the address is not an id
    fn address_to_id(address: ContractAddress) -> u128 {
        let as_felt: felt252 = address.into();
        let as_u256: u256 = as_felt.into();
        if (as_u256 <= constants::MAX_DUELIST_ID.into()) {(as_u256.low)} else {(0)}
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
    #[inline(always)]
    fn format_total_honour(value: u32) -> ByteArray { (format!("{}.{}", value/10, value%10)) }
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
        let contract_address: ContractAddress = ConfigManagerTrait::new(world).get().token_duelist_address;
        assert(contract_address.is_non_zero(), 'DuelistManager: null token addr');
        let token_dispatcher = ierc721(contract_address);
        (DuelistManager { world, token_dispatcher })
    }
    fn get(self: DuelistManager, duelist_id: u128) -> Duelist {
        get!(self.world, (duelist_id), Duelist)
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
