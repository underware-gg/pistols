
pub mod CONST {
    // packs
    pub const WELCOME_PACK_DUELIST_COUNT: usize = 5;
    
    // number of rounds per duel
    pub const ROUND_COUNT: u8 = 1;
    
    // the hard max duelist id (max supply)
    pub const MAX_DUELIST_ID: u128 = 0xffff; // 16 bits (65535)
    
    // duelist health & damage
    pub const FULL_HEALTH: u8 = 3;      // initial health
    pub const DOUBLE_DAMAGE: u8 = 2;
    pub const SINGLE_DAMAGE: u8 = 1;

    // initial player chances
    pub const INITIAL_CHANCE: u8 = 50;
    pub const INITIAL_DAMAGE: u8 = 1;

    pub const ETH_TO_WEI: u256 = 1_000_000_000_000_000_000;
}

pub mod HONOUR {
    // archetype ranges (Honour)
    pub const TRICKSTER_START: u8 = 40;
    pub const LORD_START: u8 = 70;
}

pub mod CHANCES {
    pub const NEVER: u8 = 0;
    pub const ALWAYS: u8 = 100;
}

pub mod FAME {
    use super::{CONST};
    pub const FAME_PER_LORDS: u256 = 10;
    pub const MIN_MINT_GRANT_AMOUNT: u256 = 1000 * CONST::ETH_TO_WEI;
    pub const MIN_REWARD_AMOUNT: u256 = 100 * CONST::ETH_TO_WEI;
}