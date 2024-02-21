
mod constants {
    // number of rounds per duel
    const ROUND_COUNT: u8 = 2;
    
    // max honour of a player
    const FULL_HONOUR: u8 = 100;
    
    // initial health of a player on a duel
    const FULL_HEALTH: u8 = 3;
    // damage taken
    const DOUBLE_DAMAGE: u8 = 2;
    const SINGLE_DAMAGE: u8 = 1;

    // Hit penalty per damage taken
    const HIT_PENALTY_PER_DAMAGE: u8 = 10;

    // const HASH_SALT_MASK: u256 = 0xffffffffffffffff; // 64 bits
    const HASH_SALT_MASK: u256 = 0x1fffffffffffff;   // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
}

mod chances {
    // Pistols chances (percentage) at X steps
    const PISTOLS_KILL_AT_STEP_1: u8 = 5;
    const PISTOLS_KILL_AT_STEP_10: u8 = 20;
    const PISTOLS_HIT_AT_STEP_1: u8 = 100;
    const PISTOLS_HIT_AT_STEP_10: u8 = 20;
    const PISTOLS_FULL_AT_STEP_1: u8 = 80;
    const PISTOLS_FULL_AT_STEP_10: u8 = 5;

    // Blades chances (percentage)
    const BLADES_KILL: u8 = 15;
    const BLADES_HIT: u8 = 65;
    const BLADES_FULL: u8 = 100;
}
