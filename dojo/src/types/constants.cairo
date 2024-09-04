
mod CONST {
    // number of rounds per duel
    const ROUND_COUNT: u8 = 1;
    
    // the hard max duelist id (max supply)
    const MAX_DUELIST_ID: u128 = 0xffff; // 16 bits (65535)
    
    // duelist health & damage
    const FULL_HEALTH: u8 = 3;      // initial health
    const DOUBLE_DAMAGE: u8 = 2;
    const SINGLE_DAMAGE: u8 = 1;

    // initial player chances
    const INITIAL_CHANCE: u8 = 80;
    const INITIAL_DAMAGE: u8 = 3;

    const ETH_TO_WEI: u256 = 1_000_000_000_000_000_000;
}

mod HONOUR {
    // archetype ranges (Honour)
    const VILLAIN_START: u8 = 10;  // min honour
    const TRICKSTER_START: u8 = 35;
    const LORD_START: u8 = 75;
    const HALFWAY: u8 = 50;        // half honour
    const MAX: u8 = 100;           // max honour

    // Bonus values
    const LEVEL_MIN: u8 = 10;
    const LEVEL_MAX: u8 = 100;
}

mod CHANCES {
    const NEVER: u8 = 0;
    const ALWAYS: u8 = 100;
}
