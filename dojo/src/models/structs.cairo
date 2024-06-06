
//---------------------------------------------
// structs used exclusively for read-only calls
// dont need to be models
//

#[derive(Copy, Drop, Serde)]
struct SimulateChances {
    action_honour: i8,
    duelist_honour: u8,
    crit_chances: u8,
    crit_bonus: u8,
    hit_chances: u8,
    hit_bonus: u8,
    lethal_chances: u8,
    lethal_bonus: u8,
}
