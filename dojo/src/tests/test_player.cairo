// use starknet::{ContractAddress};
// use dojo::world::{WorldStorage};
use pistols::systems::{
    game::{IGameDispatcherTrait},
};
use pistols::models::{
    events::{
        // PlayerBookmarkEvent,
        // PlayerSocialLinkEvent,
        SocialPlatform,
    },
};

use pistols::tests::tester::{
    tester,
    tester::{
        // StoreTrait,
        TestSystems, FLAGS,
        OWNER, OTHER, BUMMER, TREASURY,
    },
};


#[test]
fn test_emit_player_bookmark() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    tester::drop_all_events(sys.game.contract_address);
    // set bookmark
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_bookmark(BUMMER(), 0, true);
    tester::assert_event_bookmark(@sys, OWNER(), BUMMER(), 0, true);
    // unset bookmark
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_bookmark(BUMMER(), 0, false);
    tester::assert_event_bookmark(@sys, OWNER(), BUMMER(), 0, false);
    // another one...
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_bookmark(TREASURY(), 123, true);
    tester::assert_event_bookmark(@sys, OTHER(), TREASURY(), 123, true);
}

#[test]
fn test_emit_player_social_link() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    tester::drop_all_events(sys.game.contract_address);
    // set link (owner)
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Discord, BUMMER(), "username", "1234567890");
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Discord, "username", "1234567890");
    // unset link (player)
    tester::impersonate(BUMMER());
    tester::drop_dojo_events(@sys);
    sys.game.clear_player_social_link(SocialPlatform::Discord);
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Discord, "", "");
    // set link (admin)
    tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, true);
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Telegram, BUMMER(), "USERNAME", "3333");
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Telegram, "USERNAME", "3333");
}

#[test]
#[should_panic(expected:('PISTOLS: Caller not admin', 'ENTRYPOINT_FAILED'))]
fn test_emit_player_social_link_not_admin() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    tester::drop_all_events(sys.game.contract_address);
    tester::impersonate(OTHER());
    sys.game.emit_player_social_link(SocialPlatform::Discord, OTHER(), "username", "1234567890");
}
