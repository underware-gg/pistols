
mod CONST {
    // number of rounds per duel
    const ROUND_COUNT: u8 = 3;
    
    // the hard max duelist id (max supply)
    const MAX_DUELIST_ID: u128 = 0xffff; // 16 bits (65535)
    
    // duelist health & damage
    const FULL_HEALTH: u8 = 3;      // initial health
    const DOUBLE_DAMAGE: u8 = 2;
    const SINGLE_DAMAGE: u8 = 1;

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
    
    // Pistols chances (percentage) at X paces
    const PISTOLS_KILL_AT_STEP_1: u8 = 5;
    const PISTOLS_KILL_AT_STEP_10: u8 = 20;
    const PISTOLS_HIT_AT_STEP_1: u8 = 100;
    const PISTOLS_HIT_AT_STEP_10: u8 = 20;
    const PISTOLS_LETHAL_AT_STEP_1: u8 = 80;    // inside PISTOLS_HIT_AT_STEP_1
    const PISTOLS_LETHAL_AT_STEP_10: u8 = 5;    // inside PISTOLS_HIT_AT_STEP_10

    // Blades chances (percentage)
    const BLADES_CRIT: u8 = 20;
    const BLADES_HIT: u8 = 75;

    // archetype bonus
    const CRIT_BONUS_LORD: u8 = 12;
    const CRIT_BONUS_TRICKSTER: u8 = 6;
    const HIT_BONUS_VILLAIN: u8 = 20;
    const HIT_BONUS_TRICKSTER: u8 = 10;

    // match bonuse
    const EARLY_LORD_CRIT_BONUS: u8 = 10;
    const LATE_VILLAIN_CRIT_BONUS: u8 = 10;

    // penalties for damage
    const CRIT_PENALTY_PER_DAMAGE: u8 = 0;
    const HIT_PENALTY_PER_DAMAGE: u8 = 10;

    // Lords advantage when shooting equal or late
    const LORD_LETHAL_PENALTY: u8 = 10;

    // trickster advantage as opponent penalty
    const TRICKSTER_CRIT_PENALTY: u8 = 2;
    const TRICKSTER_HIT_PENALTY: u8 = 10;
}
