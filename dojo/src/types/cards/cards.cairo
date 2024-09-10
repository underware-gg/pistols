
#[derive(Copy, Drop, Serde, Default)]
struct CardPoints {
    name: felt252, // @generateContants_type: shortstring
    self_chances: i8,
    self_damage: i8,
    other_chances: i8,
    other_damage: i8,
    special: felt252, // @generateContants_type: shortstring
}

#[derive(Copy, Drop, Serde, Default)]
struct EnvCardPoints {
    name: felt252, // @generateContants_type: shortstring
    rarity: Rarity,
    chances: i8,
    damage: i8,
    one_shot: bool,
    tactics_multiplier: u8,
}

#[derive(Copy, Drop, Serde, PartialEq)]
enum Rarity {
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
use pistols::models::challenge::{PlayerState};
use pistols::utils::math::{MathU8};

#[generate_trait]
impl CardPointsImpl of CardPointsTrait {
    fn apply(self: CardPoints, ref state_self: PlayerState, ref state_other: PlayerState) {
        state_self.chances.addi(self.self_chances);
        state_self.damage.addi(self.self_damage);
        state_other.chances.addi(self.other_chances);
        state_other.damage.addi(self.other_damage);
    }
}

#[generate_trait]
impl EnvCardPointsImpl of EnvCardPointsTrait {
    fn apply(self: EnvCardPoints, ref state_self: PlayerState, ref state_other: PlayerState) {
        // state_self.chances.addi(self.chances);
        // state_self.damage.addi(self.damage);
        // state_other.chances.addi(self.chances);
        // state_other.damage.addi(self.damage);
    }
}
