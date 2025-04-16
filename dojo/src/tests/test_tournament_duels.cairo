use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
// use dojo::model::{ModelStorageTest};

use pistols::systems::tokens::{
    // tournament_token::{ITournamentTokenProtectedDispatcher, ITournamentTokenProtectedDispatcherTrait},
    // duel_token::{IDuelTokenProtectedDispatcher, IDuelTokenProtectedDispatcherTrait},
    budokan_mock::{PLAYERS},
};
use pistols::models::{
    // challenge::{Challenge, DuelType},
    tournament::{
        // TournamentEntry,
        // Tournament, TournamentType,
        // TournamentRound,
        // TournamentSettings, TournamentSettingsValue,
        // TournamentDuelKeys,
        // ChallengeToTournamentValue, TournamentToChallengeValue,
        // TOURNAMENT_SETTINGS,
    },
};
use pistols::types::{
    // challenge_state::{ChallengeState},
    // timestamp::{TIMESTAMP},
    // constants::{CONST},
};
// use pistols::interfaces::dns::{DnsTrait};
// use pistols::utils::short_string::{ShortStringTrait};
// use pistols::utils::math::{MathTrait};

use pistols::tests::tester::{
    tester,
    tester::{
        // StoreTrait,
        TestSystems, FLAGS,
        // ID, OWNER, OTHER, ZERO,
        // OWNED_BY_OWNER, OWNED_BY_OTHER,
        // ITournamentTokenDispatcherTrait,
    },
};
use pistols::tests::test_tournament::{
    setup, _mint,
    // _protected_duel,
    // SETTINGS_ID,
    ENTRY_ID_1,
    TIMESTAMP_START,
    // TIMESTAMP_END,
};

// use tournaments::components::{
//     models::{
//         game::{TokenMetadata},
//         lifecycle::{Lifecycle},
//     },
//     libs::{
//         lifecycle::{LifecycleTrait},
//     },
// };


//--------------------------------
// Duels
//

#[test]
fn test_duel_draw() {
    let mut sys: TestSystems = setup(3, FLAGS::GAME | FLAGS::DUEL | FLAGS::TOURNAMENT);
    let P1: ContractAddress = PLAYERS::P1().address;
    let P2: ContractAddress = PLAYERS::P2().address;
    let P3: ContractAddress = PLAYERS::P3().address;
    let ID_P1: u128 = PLAYERS::P1().duelist_id;
    let ID_P2: u128 = PLAYERS::P2().duelist_id;
    let ID_P3: u128 = PLAYERS::P3().duelist_id;
    //
    // mint+enlist 1
    tester::impersonate(P1);
    let entry_id_1: u64 = _mint(ref sys, P1);
    tester::execute_enlist_duelist(@sys, P1, entry_id_1, ID_P1);
    //
    // mint+enlist 2
    tester::impersonate(P2);
    let entry_id_2: u64 = _mint(ref sys, P2);
    tester::execute_enlist_duelist(@sys, P2, entry_id_2, ID_P2);
    //
    // mint+enlist 3
    tester::impersonate(P3);
    let entry_id_3: u64 = _mint(ref sys, P3);
    tester::execute_enlist_duelist(@sys, P3, entry_id_3, ID_P3);
    //
    // start tournament
    tester::set_block_timestamp(TIMESTAMP_START);
    let _tournament_id: u64 = tester::execute_start_tournament(@sys, P1, ENTRY_ID_1);
    // join all
    tester::impersonate(P1);
    let _duel_id_1: u128 = tester::execute_join_duel(@sys, P1, entry_id_1);
    tester::impersonate(P2);
    let _duel_id_2: u128 = tester::execute_join_duel(@sys, P2, entry_id_2);
    tester::impersonate(P3);
    let _duel_id_3: u128 = tester::execute_join_duel(@sys, P3, entry_id_3);
}


//--------------------------------
// Tournament Round
//


// TODO: duel > commit / reveal > set result flags > finish > clear flags
// TODO: duel > commit (A/B) > abandon > expire > collect winner
// TODO: duel > commit/reveal (A/B) > abandon > expire > collect winner

// TODO: collect tournament round > all duels completed
// TODO: collect tournament round > missing duels

// TODO: single round tournament > finish tournament after 1st duel > !can_start_round()

// TODO: multi round tournament > [A] vs B + C vs [D] > A vs D
// TODO: multi round tournament > !can_finish() > duel more > finish tournament
// TODO: multi round tournament > single winner > finish tournament

// TODO: multi round tournament > missing wins from 1st round > collect and continue
// TODO: multi round tournament > missing draws from 1st round > cannot collect, cannot continue

