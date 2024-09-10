
#[derive(Copy, Drop, Serde, Default)]
struct CardPoints {
    name: felt252, // @generateContants_type: shortstring
    self_chances: i8,
    self_damage: i8,
    other_chances: i8,
    other_damage: i8,
    special: felt252, // @generateContants_type: shortstring
}


//--------------------
// traits
//
use pistols::models::challenge::{PlayerState};
use pistols::utils::math::{MathU8};

trait CardPointsTrait {
    fn apply(self: CardPoints, ref state_self: PlayerState, ref state_other: PlayerState);
}

impl CardPointsImpl of CardPointsTrait {
    fn apply(self: CardPoints, ref state_self: PlayerState, ref state_other: PlayerState) {
        state_self.chances.addi(self.self_chances);
        state_self.damage.addi(self.self_damage);
        state_other.chances.addi(self.other_chances);
        state_other.damage.addi(self.other_damage);
    }
}
