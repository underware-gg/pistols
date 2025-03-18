
#[derive(Copy, Drop, Serde, Default)]
pub struct CardPoints {
    pub name: felt252, // @generateContants:shortstring
    pub self_chances: i8,
    pub self_damage: i8,
    pub other_chances: i8,
    pub other_damage: i8,
    pub special: felt252, // @generateContants:shortstring
}

#[derive(Copy, Drop, Serde, Default)]
pub struct EnvCardPoints {
    pub name: felt252, // @generateContants:shortstring
    pub rarity: Rarity,
    pub chances: i8,
    pub damage: i8,
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
use pistols::models::challenge::{DuelistState, DuelistStateTrait};
use pistols::types::cards::env::{EnvCard, EnvCardTrait};

#[generate_trait]
pub impl CardPointsImpl of CardPointsTrait {
    fn apply(self: @CardPoints, ref state_a: DuelistState, ref state_b: DuelistState, multiplier: i8, shots_modifier: EnvCard) {
        if (!shots_modifier.is_shots_modifier()) {
            state_a.apply_chances(*self.self_chances * multiplier);
            state_b.apply_chances(*self.other_chances * multiplier);
        }
        state_a.apply_damage(*self.self_damage * multiplier);
        state_b.apply_damage(*self.other_damage * multiplier);
    }
}

#[generate_trait]
pub impl EnvCardPointsImpl of EnvCardPointsTrait {
    fn apply(self: @EnvCardPoints, ref state: DuelistState, multiplier: i8, shots_modifier: EnvCard) {
        if (!shots_modifier.is_shots_modifier()) {
            state.apply_chances(*self.chances * multiplier);
        }
        state.apply_damage(*self.damage * multiplier);
    }
    fn is_special(self: @EnvCardPoints) -> bool {
        (*self.rarity == Rarity::Special)
    }
    fn is_decrease(self: @EnvCardPoints) -> bool {
        (*self.chances < 0 || *self.damage < 0)
    }
}
