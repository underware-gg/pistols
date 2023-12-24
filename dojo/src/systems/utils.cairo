use core::option::OptionTrait;
use traits::{Into, TryInto};
use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use pistols::models::models::{Duelist, Challenge, Pact, Round, Move};
use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
use pistols::types::round::{RoundState, RoundStateTrait};
use pistols::types::constants::{constants};

// https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

#[inline(always)]
fn zero_address() -> ContractAddress {
    (starknet::contract_address_const::<0x0>())
}

#[inline(always)]
fn duelist_exist(world: IWorldDispatcher, address: ContractAddress) -> bool {
    let duelist: Duelist = get!(world, address, Duelist);
    (duelist.name != 0)
}

fn make_pact_pair(duelist_a: ContractAddress, duelist_b: ContractAddress) -> u128 {
    let a: felt252 = duelist_a.into();
    let b: felt252 = duelist_b.into();
    let aa: u256 = a.into();
    let bb: u256 = b.into();
    (aa.low ^ bb.low)
}

fn set_challenge(world: IWorldDispatcher, challenge: Challenge) {
    set!(world, (challenge));

    // Set pact between Duelists to avoid duplicated challenges
    let pair: u128 = make_pact_pair(challenge.duelist_a, challenge.duelist_b);
    let state: ChallengeState = challenge.state.try_into().unwrap();
    let duel_id: u128 = if (state.finished()) { 0 } else { challenge.duel_id };

    set!(world, Pact {
        pair,
        duel_id,
    });

    // Start Round
    if (state == ChallengeState::InProgress) {
        set!(world, (
            Round {
                duel_id,
                round_number: challenge.round_number,
                state: RoundState::Commit.into(),
                duelist_a: Move {
                    hash: 0,
                    salt: 0,
                    move: 0,
                    hit: 0,
                    health: constants::MAX_HEALTH,
                },
                duelist_b: Move {
                    hash: 0,
                    salt: 0,
                    move: 0,
                    hit: 0,
                    health: constants::MAX_HEALTH,
                },
            }
        ));
    }

    // Update totals
    if (state == ChallengeState::Draw || state == ChallengeState::Resolved) {
        let mut duelist_a: Duelist = get!(world, challenge.duelist_a, Duelist);
        let mut duelist_b: Duelist = get!(world, challenge.duelist_b, Duelist);
        duelist_a.total_duels += 1;
        duelist_b.total_duels += 1;
        if (state == ChallengeState::Draw) {
            duelist_a.total_draws += 1;
            duelist_b.total_draws += 1;
        } else if (challenge.duelist_a == challenge.winner) {
            duelist_a.total_wins += 1;
            duelist_b.total_losses += 1;
        } else if (challenge.duelist_b == challenge.winner) {
            duelist_a.total_losses += 1;
            duelist_b.total_wins += 1;
        } else {
            // should never get here!
        }
        set!(world, (duelist_a, duelist_b));
    }
}




#[cfg(test)]
mod tests {
    use core::traits::{Into, TryInto};
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use pistols::types::challenge::{ChallengeState, ChallengeStateTrait};
    use pistols::systems::{utils};

    #[test]
    #[available_gas(1_000_000)]
    fn test_pact_pair() {
        let a: ContractAddress = starknet::contract_address_const::<0x269c58e5fa1e7f6fe3756f1de88ecdfab7d03ba67e79ba0365b4ef1e81155be>();
        let b: ContractAddress = starknet::contract_address_const::<0x517ececd29116499f4a1b64b094da79ba08dfd54a3edaa316134c41f8160973>();
        let p_a = utils::make_pact_pair(a, b);
        let p_b = utils::make_pact_pair(b, a);
        assert(p_a == p_b, 'test_pact_pair');
    }

}
