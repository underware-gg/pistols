
mod constants {
    // number of rounds per duel
    const ROUND_COUNT: u8 = 3;
    
    // duelist health & damage
    const FULL_HEALTH: u8 = 3;      // initial health
    const DOUBLE_DAMAGE: u8 = 2;
    const SINGLE_DAMAGE: u8 = 1;

    const HASH_SALT_MASK: u256 = 0xffffffffffffffff; // 64 bits
    // const HASH_SALT_MASK: u256 = 0x1fffffffffffff;   // 53 bits (Number.MAX_SAFE_INTEGER, 9007199254740991)
}

mod honour {
    // archetype ranges (Honour)
    const VILLAIN_START: u8 = 0;   // min honour
    const TRICKSTER_START: u8 = 30;
    const LORD_START: u8 = 80;
    const HALFWAY: u8 = 50;        // half honour
    const MAX: u8 = 100;           // max honour

    // Bonus values
    const LEVEL_MIN: u8 = 10;
    const LEVEL_MAX: u8 = 100;
}

mod chances {
    const NEVER: u8 = 0;
    const ALWAYS: u8 = 100;
    
    // Pistols chances (percentage) at X paces
    const PISTOLS_KILL_AT_STEP_1: u8 = 5;
    const PISTOLS_KILL_AT_STEP_10: u8 = 20;
    const PISTOLS_HIT_AT_STEP_1: u8 = 100;
    const PISTOLS_HIT_AT_STEP_10: u8 = 20;
    const PISTOLS_LETHAL_AT_STEP_1: u8 = 80;    // from PISTOLS_HIT_AT_STEP_1
    const PISTOLS_LETHAL_AT_STEP_10: u8 = 5;    // from PISTOLS_HIT_AT_STEP_10

    // Blades chances (percentage)
    const BLADES_KILL: u8 = 15;
    const BLADES_HIT: u8 = 75;

    // Bonus and penalties
    const CRIT_BONUS_LORD: u8 = 10;
    const CRIT_BONUS_TRICKSTER: u8 = 6;
    const LETHAL_BONUS_VILLAIN: u8 = 20;
    const LETHAL_BONUS_TRICKSTER: u8 = 10;

    // penalties for damage
    const HIT_PENALTY_PER_DAMAGE: u8 = 10;
    const CRIT_PENALTY_PER_DAMAGE: u8 = 5;
}
