
#[derive(Copy, Drop, Serde, Default)]
pub struct CardPoints {
    name: felt252, // @generateContants_type: shortstring
    self_chances: i8,
    self_damage: i8,
    other_chances: i8,
    other_damage: i8,
    special: felt252, // @generateContants_type: shortstring
}

#[derive(Copy, Drop, Serde, Default)]
pub struct EnvCardPoints {
    name: felt252, // @generateContants_type: shortstring
    rarity: Rarity,
    chances: i8,
    damage: i8,
    one_step: bool,
    tactics_multiplier: u8,
}

#[derive(Copy, Drop, Serde, PartialEq)]
pub enum Rarity {
    None,
    // Common
    Common,
    Uncommon,
    Special,
}

impl RarityDefault of Default<Rarity> {
    fn default() -> Rarity {(Rarity::None)}
}


//--------------------
// traits
//
use pistols::models::challenge::{DuelistState};
use pistols::utils::math::{MathU8};

#[generate_trait]
impl CardPointsImpl of CardPointsTrait {
    fn apply(self: CardPoints, ref state_a: DuelistState, ref state_b: DuelistState) {
        state_a.chances.addi(self.self_chances);
        state_a.damage.addi(self.self_damage);
        state_b.chances.addi(self.other_chances);
        state_b.damage.addi(self.other_damage);
    }
}

#[generate_trait]
impl EnvCardPointsImpl of EnvCardPointsTrait {
    fn apply(self: EnvCardPoints, ref state_a: DuelistState, ref state_b: DuelistState, global_state: bool) {
        if (
            (global_state && !self.one_step) ||
            (!global_state && self.one_step)
        ) {
            state_a.chances.addi(self.chances);
            state_b.chances.addi(self.chances);
            state_a.damage.addi(self.damage);
            state_b.damage.addi(self.damage);
        }
    }
}
