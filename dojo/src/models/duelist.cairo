use starknet::ContractAddress;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::models::config::{ConfigManager, ConfigManagerTrait};
use pistols::interfaces::ierc721::{ierc721, IERC721Dispatcher, IERC721DispatcherTrait};
use pistols::libs::utils::{ZERO};

//---------------------
// Duelist
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Duelist {
    #[key]
    duelist_id: u128,
    //-----------------------
    name: felt252,
    profile_pic: u8,
    score: Score,
    timestamp: u64, // when registered
}

// Current challenge between two Duelists
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Pact {
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
        if (as_u256.high == 0) {(as_u256.low)} else {(0)}
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
        let token_dispatcher = ierc721(ConfigManagerTrait::new(world).get().duelists_address);
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
    fn exists(self: DuelistManager, duelist_id: u128) -> bool {
        (self.token_dispatcher.owner_of(duelist_id.into()) != ZERO())
    }
    fn is_owner_of(self: DuelistManager, address: ContractAddress, duelist_id: u128) -> bool {
        if (self.token_dispatcher.owner_of(duelist_id.into()) == address) {(true)}
        else {(DuelistTrait::address_to_id(address) == duelist_id)} // works only for testing
    }
}
