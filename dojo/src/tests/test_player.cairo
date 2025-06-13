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
        PlayerSetting, PlayerSettingValue,
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
    // set bookmark
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    tester::assert_no_dojo_events_left(@sys);
    sys.game.emit_player_bookmark(BUMMER(), 0, true);
    tester::assert_event_bookmark(@sys, OWNER(), BUMMER(), 0, true);
    tester::assert_no_dojo_events_left(@sys);
    // unset bookmark
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_bookmark(BUMMER(), 0, false);
    tester::assert_event_bookmark(@sys, OWNER(), BUMMER(), 0, false);
    tester::assert_no_dojo_events_left(@sys);
    // another one...
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_bookmark(TREASURY(), 123, true);
    tester::assert_event_bookmark(@sys, OTHER(), TREASURY(), 123, true);
    tester::assert_no_dojo_events_left(@sys);
}

#[test]
fn test_emit_player_social_link() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    // set link (owner)
    tester::impersonate(OWNER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Discord, BUMMER(), "username", "1234567890", "_avatar_1");
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Discord, "username", "1234567890", "_avatar_1");
    tester::assert_no_dojo_events_left(@sys);
    // unset link (player)
    tester::impersonate(BUMMER());
    tester::drop_dojo_events(@sys);
    sys.game.clear_player_social_link(SocialPlatform::Discord);
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Discord, "", "", "");
    tester::assert_no_dojo_events_left(@sys);
    // set link (admin)
    tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), true, true);
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_social_link(SocialPlatform::Telegram, BUMMER(), "USERNAME", "3333", "_avatar_2");
    tester::assert_event_social_link(@sys, BUMMER(), SocialPlatform::Telegram, "USERNAME", "3333", "_avatar_2");
    tester::assert_no_dojo_events_left(@sys);
}

#[test]
#[should_panic(expected:('PISTOLS: Caller not admin', 'ENTRYPOINT_FAILED'))]
fn test_emit_player_social_link_not_admin() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    tester::impersonate(OTHER());
    sys.game.emit_player_social_link(SocialPlatform::Discord, OTHER(), "username", "1234567890", "_avatar_3");
}

#[test]
fn test_emit_player_setting() {
    let mut sys: TestSystems = tester::setup_world(FLAGS::GAME);
    tester::drop_all_events(sys.game.contract_address);
    // set generic (no social platform)
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_setting(PlayerSetting::OptOutNotifications(SocialPlatform::Undefined), PlayerSettingValue::Boolean(true));
    tester::assert_event_player_setting(@sys, OTHER(), PlayerSetting::OptOutNotifications(SocialPlatform::Undefined), PlayerSettingValue::Boolean(true));
    tester::assert_no_dojo_events_left(@sys);
    // set specific social platform
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_setting(PlayerSetting::OptOutNotifications(SocialPlatform::Discord), PlayerSettingValue::Boolean(true));
    tester::assert_event_player_setting(@sys, OTHER(), PlayerSetting::OptOutNotifications(SocialPlatform::Discord), PlayerSettingValue::Boolean(true));
    tester::assert_no_dojo_events_left(@sys);
    // set undefined (remove setting)
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_setting(PlayerSetting::OptOutNotifications(SocialPlatform::Discord), PlayerSettingValue::Undefined);
    tester::assert_event_player_setting(@sys, OTHER(), PlayerSetting::OptOutNotifications(SocialPlatform::Discord), PlayerSettingValue::Undefined);
    tester::assert_no_dojo_events_left(@sys);
    // no emit
    tester::impersonate(OTHER());
    tester::drop_dojo_events(@sys);
    sys.game.emit_player_setting(PlayerSetting::Undefined, PlayerSettingValue::Boolean(true));
    tester::assert_no_dojo_events_left(@sys);
}
