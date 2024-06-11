
//---------------------------------------------
// structs used exclusively for read-only calls
// dont need to be models
//

#[derive(Copy, Drop, Serde)]
struct SimulateChances {
    // honour
    action_honour: i8,
    duelist_honour: u8,
    // crit
    crit_chances: u8,
    crit_base_chance: u8,
    crit_bonus: u8,
    crit_match_bonus: u8,
    crit_trickster_penalty: u8,
    // hit
    hit_chances: u8,
    hit_base_chance: u8,
    hit_bonus: u8,
    hit_injury_penalty: u8,
    hit_trickster_penalty: u8,
    // lethal
    lethal_chances: u8,
    lethal_base_chance: u8,
    lethal_lord_penalty: u8,
}
