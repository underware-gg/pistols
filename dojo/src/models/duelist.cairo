use starknet::ContractAddress;

//---------------------
// Duelist
//
#[derive(Copy, Drop, Serde)]
#[dojo::model]
struct Duelist {
    #[key]
    address: ContractAddress,
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
    address: ContractAddress,
    #[key]
    table_id: felt252,
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
