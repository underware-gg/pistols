use pistols::types::cards::{
    paces::{PacesCard, PacesCardTrait},
    tactics::{TacticsCard, TacticsCardTrait},
    blades::{BladesCard, BladesCardTrait},
    env::{EnvCard, EnvCardTrait},
};

#[derive(Copy, Drop)]
struct PlayerHand {
    card_paces: PacesCard,
    card_dodge: PacesCard,
    card_tactics: TacticsCard,
    card_blades: BladesCard,
}


#[generate_trait]
impl PlayerHandImpl of PlayerHandTrait {
    fn player_full_deck() -> Array<Array<u8>> {
        let paces: Array<u8> = array![
            PacesCard::Paces1.into(),
            PacesCard::Paces2.into(),
            PacesCard::Paces3.into(),
            PacesCard::Paces4.into(),
            PacesCard::Paces5.into(),
            PacesCard::Paces6.into(),
            PacesCard::Paces7.into(),
            PacesCard::Paces8.into(),
            PacesCard::Paces9.into(),
            PacesCard::Paces10.into(),
        ];
        let dodge: Array<u8> = array![
            PacesCard::Paces1.into(),
            PacesCard::Paces2.into(),
            PacesCard::Paces3.into(),
            PacesCard::Paces4.into(),
            PacesCard::Paces5.into(),
            PacesCard::Paces6.into(),
            PacesCard::Paces7.into(),
            PacesCard::Paces8.into(),
            PacesCard::Paces9.into(),
            PacesCard::Paces10.into(),
        ];
        (array![
            paces,
            dodge,
        ])
    }
}