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
    // set link
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Discord, "username", "1234567890");
    tester::assert_event_social_link(@sys, OWNER(), SocialPlatform::Discord, "username", "1234567890");
    // unset link
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Discord, "", "");
    tester::assert_event_social_link(@sys, OWNER(), SocialPlatform::Discord, "", "");
    // another one...
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Telegram, "USERNAME", "2222");
    tester::assert_event_social_link(@sys, OTHER(), SocialPlatform::Telegram, "USERNAME", "2222");
}
