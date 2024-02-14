
mod constants {
    // number of rounds per duel (pistols + blades)
    const ROUND_COUNT: u8 = 2;
    
    // max honour of a player
    const FULL_HONOUR: u8 = 100;
    
    // initial health of a player on a duel
    const FULL_HEALTH: u8 = 3;
    // damage taken
    const SINGLE_DAMAGE: u8 = 1;
    const DOUBLE_DAMAGE: u8 = 2;

    // hit chance (percentage) at steps
    const CHANCE_HIT_STEP_1: u8 = 80;
    const CHANCE_HIT_STEP_10: u8 = 20;

    // kill chance (percentage) at steps
    const CHANCE_KILL_STEP_1: u8 = 10;
    const CHANCE_KILL_STEP_10: u8 = 100;
}
