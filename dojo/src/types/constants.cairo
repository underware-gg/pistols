
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

    // Pistols chances (percentage) at X steps
    const PISTOLS_KILL_CHANCE_AT_STEP_1: u8 = 10;
    const PISTOLS_KILL_CHANCE_AT_STEP_10: u8 = 100;
    const PISTOLS_HIT_CHANCE_AT_STEP_1: u8 = 80;
    const PISTOLS_HIT_CHANCE_AT_STEP_10: u8 = 20;

    // Blades chances (percentage)
    const BLADES_KILL_CHANCE: u8 = 15;
    const BLADES_HIT_CHANCE: u8 = 65;

    // Hit penalty per damage taken
    const HIT_PENALTY_PER_DAMAGE: u8 = 10;
}
