use starknet::{ContractAddress};
use pistols::utils::misc::{FeltToLossy};
use pistols::utils::hash::{hash_values};

#[generate_trait]
impl TutImpl of TutTrait {
    #[inline(always)]
    fn player_duelist_id() -> u128 {
        ('player'.to_u128_lossy())
    }
    #[inline(always)]
    fn opponent_duelist_id() -> u128 {
        ('opponent'.to_u128_lossy())
    }
    #[inline(always)]
    fn make_duel_id(player_address: ContractAddress, tutorial_id: u128) -> u128 {
        (hash_values([
            player_address.into(),
            tutorial_id.into(),
        ].span()).to_u32_lossy().into())
    }
}
