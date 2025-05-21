// use starknet::{ContractAddress};
use pistols::models::challenge::{Round};
use pistols::types::duel_progress::{DuelProgress};
use pistols::types::cards::deck::{Deck};
use pistols::systems::rng::{RngWrap};

// Exposed to clients
#[starknet::interface]
pub trait IGameLoop<TState> {
    fn execute_game_loop(self: @TState, wrapped: RngWrap, deck: Deck, round: Round) -> (DuelProgress, Round);
}

#[dojo::contract]
pub mod game_loop {
    use pistols::systems::rng::{RngWrap};
    use pistols::models::challenge::{Round};
    use pistols::types::duel_progress::{DuelProgress};
    use pistols::types::cards::deck::{Deck};
    use pistols::libs::game_loop::{GameLoopTrait};

    #[abi(embed_v0)]
    impl GameLoopImpl of super::IGameLoop<ContractState> {
        fn execute_game_loop(self: @ContractState, wrapped: RngWrap, deck: Deck, round: Round) -> (DuelProgress, Round) {
            let mut round: Round = round;
            let progress: DuelProgress = GameLoopTrait::execute(@wrapped, @deck, ref round);
            (progress, round)
        }
    }
}
