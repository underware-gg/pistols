use starknet::{get_block_timestamp};
use pistols::models::models::{Challenge};
use pistols::utils::timestamp::{timestamp};
use pistols::types::challenge::{ChallengeState};


fn solve_random(ref challenge: Challenge) {
    let result = challenge.timestamp_start % 3;
    if (result == 1) {
        challenge.state = ChallengeState::Resolved.into();
        challenge.winner = challenge.duelist_a;
    } else if (result == 2) {
        challenge.state = ChallengeState::Resolved.into();
        challenge.winner = challenge.duelist_b;
    } else {
        challenge.state = ChallengeState::Draw.into();
    }
    challenge.timestamp_end = get_block_timestamp();
}