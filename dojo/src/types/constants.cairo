
mod CONST {
    // duelist pack amounts
    const DUELIST_PACK_AMOUNT_REGISTER: u32 = 5;
    const DUELIST_PACK_AMOUNT: u32 = 5;
    
    // number of rounds per duel
    const ROUND_COUNT: u8 = 1;
    
    // the hard max duelist id (max supply)
    const MAX_DUELIST_ID: u128 = 0xffff; // 16 bits (65535)
    
    // duelist health & damage
    const FULL_HEALTH: u8 = 3;      // initial health
    const DOUBLE_DAMAGE: u8 = 2;
    const SINGLE_DAMAGE: u8 = 1;

    // initial player chances
    const INITIAL_CHANCE: u8 = 50;
    const INITIAL_DAMAGE: u8 = 1;

    const ETH_TO_WEI: u256 = 1_000_000_000_000_000_000;
}

mod HONOUR {
    // archetype ranges (Honour)
    const TRICKSTER_START: u8 = 40;
    const LORD_START: u8 = 70;
}

mod CHANCES {
    const NEVER: u8 = 0;
    const ALWAYS: u8 = 100;
}

mod FAME {
    const FAME_PER_LORDS: u256 = 10;
    const MIN_MINT_GRANT_AMOUNT: u256 = 1_000 * super::CONST::ETH_TO_WEI;
    const MIN_REWARD_AMOUNT: u256 = 100 * super::CONST::ETH_TO_WEI;
}
