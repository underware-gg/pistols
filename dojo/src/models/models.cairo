use starknet::ContractAddress;
use pistols::types::challenge::{ChallengeState};

//---------------------
// Duelist
//
#[derive(Model, Copy, Drop, Serde)]
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
#[derive(Model, Copy, Drop, Serde)]
struct Pact {
    #[key]
    pair: u128,     // xor'd duelists as u256(address).low
    //------------
    duel_id: u128,  // current Challenge, or 0x0
}

//
// Duelist scores and wager balance per Table
#[derive(Model, Copy, Drop, Serde)]
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

#[generate_trait]
impl ScoreTraitImpl of ScoreTrait {
    #[inline(always)]
    fn is_villain(self: Score) -> bool { (self.level_villain > 0) }
    #[inline(always)]
    fn is_trickster(self: Score) -> bool { (self.level_trickster > 0) }
    #[inline(always)]
    fn is_lord(self: Score) -> bool { (self.level_lord > 0) }
}


//-------------------------
// Challenge lifecycle
//
#[derive(Model, Copy, Drop, Serde)]
struct Challenge {
    #[key]
    duel_id: u128,
    //-------------------------
    duelist_a: ContractAddress, // Challenger
    duelist_b: ContractAddress, // Challenged
    message: felt252,           // message to challenged
    // progress and results
    state: u8,                  // actually a ChallengeState
    round_number: u8,           // current or final
    winner: u8,                 // 0:draw, 1:duelist_a, 2:duelist_b
    // timestamps in unix epoch
    timestamp_start: u64,       // Unix time, started
    timestamp_end: u64,         // Unix time, ended
} // [f] [f] [f] [152]

#[derive(Model, Copy, Drop, Serde)]
struct Snapshot {
    #[key]
    duel_id: u128,
    //-------------------------
    score_a: Score,
    score_b: Score,
}

//
// Challenge wager (optional)
#[derive(Model, Copy, Drop, Serde)]
struct Wager {
    #[key]
    duel_id: u128,
    //------------
    table_id: felt252,
    value: u256,
    fee: u256,
}

//
// The shot of each player on a Round
#[derive(Copy, Drop, Serde, Introspect)]
struct Shot {
    // player input
    hash: u64,          // hashed action (salt + action)
    salt: u64,          // the player's secret salt
    action: u16,        // the player's chosen action(s) (paces, weapon, ...)
    // shot results
    chance_crit: u8,    // computed chances (1..100) - kill / double damage
    chance_hit: u8,     // computed chances (1..100) - hit / normal damage
    dice_crit: u8,      // dice roll result (1..100) - kill / double damage
    dice_hit: u8,       // dice roll result (1..100) - hit / normal damage
    damage: u8,         // amount of health taken
    block: u8,          // amount of damage blocked
    win: u8,            // wins the round
    wager: u8,          // wins the wager
    // player state
    health: u8,         // final health
    honour: u8,         // honour granted
} // 224 bits

//
// Each duel round
#[derive(Model, Copy, Drop, Serde)]
struct Round {
    #[key]
    duel_id: u128,
    #[key]
    round_number: u8,
    //---------------
    state: u8,      // actually a RoundState
    shot_a: Shot,   // duelist_a shot
    shot_b: Shot,   // duelist_b shot
} // (8 + 224 + 224) = 456 bits ~ 2 felts (max 504)


//--------------------------------------------
// Models used exclusively for read-only calls
//
#[derive(Model, Copy, Drop, Serde)]
struct Chances {
    #[key]
    key: felt252,
    crit_chances: u8,
    crit_bonus: u8,
    hit_chances: u8,
    hit_bonus: u8,
    lethal_chances: u8,
    lethal_bonus: u8,
}



//-------------------------------------
// Model initializers
//
mod init {
    use pistols::models::{models};

    fn Shot() -> models::Shot {
        (models::Shot {
            hash: 0,
            salt: 0,
            action: 0,
            chance_crit: 0,
            chance_hit: 0,
            dice_crit: 0,
            dice_hit: 0,
            damage: 0,
            block: 0,
            win: 0,
            wager: 0,
            health: 0,
            honour: 0,
        })
    }

    fn Duelist() -> models::Duelist {
        (models::Duelist {
            address: starknet::contract_address_const::<0x0>(),
            name: 0,
            profile_pic: 0,
            score: Score(),
            timestamp: 0,
        })
    }

    fn Score() -> models::Score {
        (models::Score {
            total_duels: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            total_honour: 0,
            honour: 0,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 0,
        })
    }

    fn Scoreboard() -> models::Scoreboard {
        (models::Scoreboard {
            address: starknet::contract_address_const::<0x0>(),
            table_id: 0,
            score: Score(),
            wager_won: 0,
            wager_lost: 0,
        })
    }
}