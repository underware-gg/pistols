use core::num::traits::Zero;
use starknet::{ContractAddress};
use dojo::world::{WorldStorage};
use dojo::model::{Model, ModelPtr, ModelStorage, ModelValueStorage};
use dojo::event::{EventStorage};

pub use pistols::models::{
    config::{
        CONFIG,
        Config, ConfigValue,
        CoinConfig, CoinConfigValue,
        TokenConfig, TokenConfigValue,
    },
    pool::{
        Pool, PoolType,
        LordsReleaseBill,
    },
    player::{
        Player, PlayerValue,
        PlayerTeamFlags,
        PlayerFlags,
        PlayerDuelistStack, PlayerDuelistStackValue,
    },
    pack::{
        Pack, PackValue,
    },
    challenge::{
        Challenge, ChallengeValue,
        ChallengeMessage, ChallengeMessageValue,
        Round, RoundValue,
        DuelType,
    },
    duelist::{
        Duelist, DuelistValue, DuelistTimestamps,
        DuelistAssignment, DuelistAssignmentValue,
        DuelistMemorial, DuelistMemorialValue,
        Totals,
    },
    leaderboard::{
        Leaderboard, LeaderboardValue,
    },
    pact::{
        Pact, PactValue, PactTrait,
    },
    season::{
        SeasonConfig, SeasonConfigValue,
        SeasonScoreboard, SeasonScoreboardValue,
        Rules,
    },
    // tournament::{
    //     TournamentPass, TournamentPassValue,
    //     TournamentSettings, TournamentSettingsValue,
    //     TournamentType, TournamentTypeTrait, TournamentRules,
    //     Tournament, TournamentValue,
    //     TournamentRound, TournamentRoundValue,
    //     TournamentToChallenge, TournamentToChallengeValue,
    //     ChallengeToTournament, ChallengeToTournamentValue,
    //     TournamentDuelKeys,
    // },
    events::{
        CallToChallengeEvent, ChallengeAction,
        ChallengeRewardsEvent,
        LordsReleaseEvent,
        PlayerBookmarkEvent,
        PlayerSocialLinkEvent, SocialPlatform,
        PlayerSettingEvent, PlayerSetting, PlayerSettingValue,
    },
};
pub use pistols::systems::components::{
    token_bound::{
        TokenBoundAddress, TokenBoundAddressValue,
    },
};
use pistols::types::{
    rules::{RewardValues},
    duelist_profile::{DuelistProfile},
};
// use tournaments::components::models::game::{TokenMetadata, TokenMetadataValue};


#[derive(Copy, Drop)]
pub struct Store {
    pub world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: WorldStorage) -> Store {
        (Store { world })
    }

    //----------------------------------
    // Model Getters
    //

    #[inline(always)]
    fn get_player(self: @Store, address: ContractAddress) -> Player {
        (self.world.read_model(address))
    }
    #[inline(always)]
    fn get_player_team_flags(self: @Store, address: ContractAddress) -> PlayerTeamFlags {
        (self.world.read_model(address))
    }
    #[inline(always)]
    fn get_player_flags(self: @Store, address: ContractAddress) -> PlayerFlags {
        (self.world.read_model(address))
    }

    #[inline(always)]
    fn get_player_duelist_stack(self: @Store, address: ContractAddress, profile: DuelistProfile) -> PlayerDuelistStack {
        (self.world.read_model((address, profile),))
    }
    #[inline(always)]
    fn get_player_duelist_stack_from_id(self: @Store, address: ContractAddress, duelist_id: u128) -> PlayerDuelistStack {
        (self.get_player_duelist_stack(address, self.get_duelist_profile(duelist_id)))
    }

    #[inline(always)]
    fn get_pack(self: @Store, pack_id: u128) -> Pack {
        (self.world.read_model(pack_id))
    }
    #[inline(always)]
    fn get_pack_value(self: @Store, pack_id: u128) -> PackValue {
        (self.world.read_value(pack_id))
    }

    #[inline(always)]
    fn get_challenge(self: @Store, duel_id: u128) -> Challenge {
        (self.world.read_model(duel_id))
    }
    #[inline(always)]
    fn get_challenge_value(self: @Store, duel_id: u128) -> ChallengeValue {
        (self.world.read_value(duel_id))
    }

    #[inline(always)]
    fn get_challenge_message_value(self: @Store, duel_id: u128) -> ChallengeMessageValue {
        (self.world.read_value(duel_id))
    }


    #[inline(always)]
    fn get_round(self: @Store, duel_id: u128) -> Round {
        (self.world.read_model(duel_id))
    }
    #[inline(always)]
    fn get_round_value(self: @Store, duel_id: u128) -> RoundValue {
        (self.world.read_value(duel_id))
    }

    #[inline(always)]
    fn get_duelist(self: @Store, duelist_id: u128) -> Duelist {
        (self.world.read_model(duelist_id))
    }
    #[inline(always)]
    fn get_duelist_value(self: @Store, duelist_id: u128) -> DuelistValue {
        (self.world.read_value(duelist_id))
    }

    #[inline(always)]
    fn get_duelist_challenge(self: @Store, duelist_id: u128) -> DuelistAssignment {
        (self.world.read_model(duelist_id))
    }
    #[inline(always)]
    fn get_duelist_challenge_value(self: @Store, duelist_id: u128) -> DuelistAssignmentValue {
        (self.world.read_value(duelist_id))
    }
    #[inline(always)]
    fn get_duelist_memorial_value(self: @Store, duelist_id: u128) -> DuelistMemorialValue {
        (self.world.read_value(duelist_id))
    }

    #[inline(always)]
    fn get_pact(self: @Store, duel_type: DuelType, a: u256, b: u256) -> Pact {
        let pair: u128 = PactTrait::make_pair(a, b);
        (self.world.read_model((duel_type, pair),))
    }

    #[inline(always)]
    fn get_scoreboard(self: @Store, season_id: u32, holder: felt252) -> SeasonScoreboard {
        (self.world.read_model((season_id, holder),))
    }

    #[inline(always)]
    fn get_leaderboard(self: @Store, season_id: u32) -> Leaderboard {
        (self.world.read_model(season_id))
    }

    #[inline(always)]
    fn get_season_config(self: @Store, season_id: u32) -> SeasonConfig {
        (self.world.read_model(season_id))
    }
    #[inline(always)]
    fn get_current_season(self: @Store) -> SeasonConfig {
        (self.world.read_model(self.get_current_season_id()))
    }

    #[inline(always)]
    fn get_coin_config(self: @Store, contract_address: ContractAddress) -> CoinConfig {
        (self.world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_coin_config_value(self: @Store, contract_address: ContractAddress) -> CoinConfigValue {
        (self.world.read_value(contract_address))
    }

    #[inline(always)]
    fn get_token_config(self: @Store, contract_address: ContractAddress) -> TokenConfig {
        (self.world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_token_config_value(self: @Store, contract_address: ContractAddress) -> TokenConfigValue {
        (self.world.read_value(contract_address))
    }

    #[inline(always)]
    fn get_config(self: @Store) -> Config {
        (self.world.read_model(CONFIG::CONFIG_KEY))
    }

    #[inline(always)]
    fn get_pool(self: @Store, pool_id: PoolType) -> Pool {
        (self.world.read_model(pool_id))
    }

    #[inline(always)]
    fn get_token_bound_address(self: @Store, recipient: ContractAddress) -> TokenBoundAddress {
        (self.world.read_model(recipient))
    }
    #[inline(always)]
    fn get_token_bound_address_value(self: @Store, recipient: ContractAddress) -> TokenBoundAddressValue {
        (self.world.read_value(recipient))
    }

    // #[inline(always)]
    // fn get_tournament_pass(self: @Store, pass_id: u64) -> TournamentPass {
    //     (self.world.read_model(pass_id))
    // }
    // #[inline(always)]
    // fn get_tournament_pass_value(self: @Store, pass_id: u64) -> TournamentPassValue {
    //     (self.world.read_value(pass_id))
    // }

    // // #[inline(always)]
    // // fn get_tournament_settings(self: @Store, settings_id: u32) -> TournamentSettings {
    // //     (self.world.read_model(settings_id))
    // // }
    // #[inline(always)]
    // fn get_tournament_settings_value(self: @Store, settings_id: u32) -> TournamentSettingsValue {
    //     (self.world.read_value(settings_id))
    // }

    // #[inline(always)]
    // fn get_tournament(self: @Store, tournament_id: u64) -> Tournament {
    //     (self.world.read_model(tournament_id))
    // }
    // #[inline(always)]
    // fn get_tournament_value(self: @Store, tournament_id: u64) -> TournamentValue {
    //     (self.world.read_value(tournament_id))
    // }

    // #[inline(always)]
    // fn get_tournament_round(self: @Store, tournament_id: u64, round_number: u8) -> TournamentRound {
    //     (self.world.read_model((tournament_id, round_number),))
    // }
    // #[inline(always)]
    // fn get_tournament_round_value(self: @Store, tournament_id: u64, round_number: u8) -> TournamentRoundValue {
    //     (self.world.read_value((tournament_id, round_number),))
    // }

    // // #[inline(always)]
    // // fn get_tournament_to_challenge_value(self: @Store, keys: @TournamentDuelKeys) -> TournamentToChallengeValue {
    // //     (self.world.read_value(*keys))
    // // }
    // #[inline(always)]
    // fn get_challenge_to_tournament_value(self: @Store, duel_id: u128) -> ChallengeToTournamentValue {
    //     (self.world.read_value(duel_id))
    // }
    

    // // #[inline(always)]
    // // fn get_budokan_token_metadata(self: @Store, pass_id: u64) -> TokenMetadata {
    // //     (self.world.read_model(pass_id))
    // // }
    // #[inline(always)]
    // fn get_budokan_token_metadata_value(self: @Store, pass_id: u64) -> TokenMetadataValue {
    //     (self.world.read_value(pass_id))
    // }

    //----------------------------------
    // Model Setters
    //

    #[inline(always)]
    fn set_player(ref self: Store, model: @Player) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_player_team_flags(ref self: Store, model: @PlayerTeamFlags) {
        self.world.write_model(model);
    }
    #[inline(always)]
    fn delete_player_team_flags(ref self: Store, model: @PlayerTeamFlags) {
        self.world.erase_model(model);
    }

    #[inline(always)]
    fn set_player_flags(ref self: Store, model: @PlayerFlags) {
        self.world.write_model(model);
    }
    #[inline(always)]
    fn delete_player_flags(ref self: Store, model: @PlayerFlags) {
        self.world.erase_model(model);
    }

    #[inline(always)]
    fn set_player_duelist_stack(ref self: Store, model: @PlayerDuelistStack) {
        self.world.write_model(model);
    }

    fn set_pack(ref self: Store, model: @Pack) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_challenge(ref self: Store, model: @Challenge) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_challenge_message(ref self: Store, model: @ChallengeMessage) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_round(ref self: Store, model: @Round) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_duelist(ref self: Store, model: @Duelist) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_duelist_challenge(ref self: Store, model: @DuelistAssignment) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_duelist_memorial(ref self: Store, model: @DuelistMemorial) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_pact(ref self: Store, model: @Pact) {
        self.world.write_model(model);
    }
    #[inline(always)]
    fn delete_pact(ref self: Store, model: @Pact) {
        self.world.erase_model(model);
    }

    #[inline(always)]
    fn set_scoreboard(ref self: Store, model: @SeasonScoreboard) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_leaderboard(ref self: Store, model: @Leaderboard) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_season_config(ref self: Store, model: @SeasonConfig) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_coin_config(ref self: Store, model: @CoinConfig) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_token_config(ref self: Store, model: @TokenConfig) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_config(ref self: Store, model: @Config) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_pool(ref self: Store, model: @Pool) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_token_bound_address(ref self: Store, model: @TokenBoundAddress) {
        self.world.write_model(model);
    }

    // #[inline(always)]
    // fn set_tournament_pass(ref self: Store, model: @TournamentPass) {
    //     self.world.write_model(model);
    // }
    
    // #[inline(always)]
    // fn set_tournament_settings(ref self: Store, model: @TournamentSettings) {
    //     self.world.write_model(model);
    // }

    // #[inline(always)]
    // fn set_tournament(ref self: Store, model: @Tournament) {
    //     self.world.write_model(model);
    // }

    // #[inline(always)]
    // fn set_tournament_round(ref self: Store, model: @TournamentRound) {
    //     self.world.write_model(model);
    // }

    // #[inline(always)]
    // fn set_challenge_to_tournament(ref self: Store, model: @ChallengeToTournament) {
    //     self.world.write_model(model);
    // }
    // #[inline(always)]
    // fn set_tournament_to_challenge(ref self: Store, model: @TournamentToChallenge) {
    //     self.world.write_model(model);
    // }

    //----------------------------------
    // Single member getters
    // https://book.dojoengine.org/framework/world/api#read_member-and-read_member_of_models
    //

    #[inline(always)]
    fn get_current_season_id(self: @Store) -> u32 {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("current_season_id")))
    }
    #[inline(always)]
    fn get_config_lords_address(self: @Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("lords_address")))
    }
    #[inline(always)]
    fn get_config_vrf_address(self: @Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("vrf_address")))
    }
    #[inline(always)]
    fn get_config_treasury_address(self: @Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("treasury_address")))
    }
    #[inline(always)]
    fn get_config_is_paused(self: @Store) -> bool {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("is_paused")))
    }

    #[inline(always)]
    fn get_current_season_rules(self: @Store) -> Rules {
        (self.get_season_rules(self.get_current_season_id()))
    }
    #[inline(always)]
    fn get_season_rules(self: @Store, season_id: u32) -> Rules {
        (self.world.read_member(Model::<SeasonConfig>::ptr_from_keys(season_id), selector!("rules")))
    }

    // #[inline(always)]
    // fn get_tournament_settings_rules(self: @Store, settings_id: u32) -> TournamentRules {
    //     let tournament_type: TournamentType = self.world.read_member(Model::<TournamentSettings>::ptr_from_keys(settings_id), selector!("tournament_type"));
    //     (tournament_type.rules())
    // }
    // #[inline(always)]
    // fn get_tournament_pass_minter_address(self: @Store, pass_id: u64) -> ContractAddress {
    //     (self.world.read_member(Model::<TokenMetadata>::ptr_from_keys(pass_id), selector!("minted_by")))
    // }
    // #[inline(always)]
    // fn get_tournament_duel_id(self: @Store, keys: @TournamentDuelKeys) -> u128 {
    //     (self.world.read_member(Model::<TournamentToChallenge>::ptr_from_keys(*keys), selector!("duel_id")))
    // }
    // #[inline(always)]
    // fn get_duel_tournament_keys(self: @Store, duel_id: u128) -> TournamentDuelKeys {
    //     (self.world.read_member(Model::<ChallengeToTournament>::ptr_from_keys(duel_id), selector!("keys")))
    // }

    #[inline(always)]
    fn get_duelist_timestamps(self: @Store, duelist_id: u128) -> DuelistTimestamps {
        (self.world.read_member(Model::<Duelist>::ptr_from_keys(duelist_id), selector!("timestamps")))
    }
    #[inline(always)]
    fn get_duelist_profile(self: @Store, duelist_id: u128) -> DuelistProfile {
        (self.world.read_member(Model::<Duelist>::ptr_from_keys(duelist_id), selector!("duelist_profile")))
    }
    #[inline(always)]
    fn get_duelist_totals(self: @Store, duelist_id: u128) -> Totals {
        (self.world.read_member(Model::<Duelist>::ptr_from_keys(duelist_id), selector!("totals")))
    }

    #[inline(always)]
    fn get_player_is_admin(self: @Store, address: ContractAddress) -> bool {
        (self.world.read_member(Model::<PlayerTeamFlags>::ptr_from_keys(address), selector!("is_admin")))
    }
    #[inline(always)]
    fn get_player_is_team_member(self: @Store, address: ContractAddress) -> bool {
        (self.world.read_member(Model::<PlayerTeamFlags>::ptr_from_keys(address), selector!("is_team_member")))
    }
    #[inline(always)]
    fn get_player_is_blocked(self: @Store, address: ContractAddress) -> bool {
        (self.world.read_member(Model::<PlayerFlags>::ptr_from_keys(address), selector!("is_blocked")))
    }
    #[inline(always)]
    fn get_player_totals(self: @Store, address: ContractAddress) -> Totals {
        (self.world.read_member(Model::<Player>::ptr_from_keys(address), selector!("totals")))
    }
    #[inline(always)]
    fn get_player_alive_duelist_count(self: @Store, address: ContractAddress) -> u16 {
        (self.world.read_member(Model::<Player>::ptr_from_keys(address), selector!("alive_duelist_count")))
    }
    #[inline(always)]
    fn get_active_duelist_id(self: @Store, address: ContractAddress, duelist_id: u128) -> u128 {
        (self.world.read_member(Model::<PlayerDuelistStack>::ptr_from_keys((
            address,
            self.get_duelist_profile(duelist_id)
        ),), selector!("active_duelist_id")))
    }

    //----------------------------------
    // Single member setters
    // https://book.dojoengine.org/framework/world/api#write_member-and-write_member_of_models
    //

    #[inline(always)]
    fn set_config_is_paused(ref self: Store, is_paused: bool) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("is_paused"), is_paused);
    }
    #[inline(always)]
    fn set_config_season_id(ref self: Store, season_id: u32) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("current_season_id"), season_id);
    }
    #[inline(always)]
    fn set_config_treasury_address(ref self: Store, treasury_address: ContractAddress) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("treasury_address"), treasury_address);
    }

    #[inline(always)]
    fn set_duelist_timestamp_active(ref self: Store, duelist_id: u128, current_timestamp: u64) {
        let model_ptr: ModelPtr<Duelist> = Model::<Duelist>::ptr_from_keys(duelist_id);
        let mut timestamps: DuelistTimestamps = self.world.read_member(model_ptr, selector!("timestamps"));
        timestamps.active = current_timestamp;
        self.world.write_member(model_ptr, selector!("timestamps"), timestamps);
    }
    #[inline(always)]
    fn set_duelist_totals(ref self: Store, duelist_id: u128, totals: Totals) {
        self.world.write_member(Model::<Duelist>::ptr_from_keys(duelist_id), selector!("totals"), totals);
    }

    #[inline(always)]
    fn set_player_totals(ref self: Store, address: ContractAddress, totals: Totals) {
        self.world.write_member(Model::<Player>::ptr_from_keys(address), selector!("totals"), totals);
    }
    #[inline(always)]
    fn set_player_alive_duelist_count(ref self: Store, address: ContractAddress, alive_duelist_count: u16) {
        self.world.write_member(Model::<Player>::ptr_from_keys(address), selector!("alive_duelist_count"), alive_duelist_count);
    }


    //----------------------------------
    // Emitters
    //

    fn emit_challenge_action(ref self: Store, challenge: @Challenge, duelist_number: u8, action: ChallengeAction) {
        if (duelist_number == 1) {
            self.emit_call_to_challenge(*challenge.address_a, *challenge.duel_id, action);
        } else if (duelist_number == 2) {
            self.emit_call_to_challenge(*challenge.address_b, *challenge.duel_id, action);
        }
    }
    #[inline(always)]
    fn emit_call_to_challenge(ref self: Store, player_address: ContractAddress, duel_id: u128, action: ChallengeAction) {
        self.world.emit_event(@CallToChallengeEvent{
            player_address,
            duel_id,
            action,
            timestamp: starknet::get_block_timestamp(),
        });
    }

    #[inline(always)]
    fn emit_challenge_rewards(ref self: Store, duel_id: u128, duelist_id: u128, rewards: RewardValues) {
        if (duelist_id.is_non_zero()) {
            self.world.emit_event(@ChallengeRewardsEvent{
                duel_id,
                duelist_id,
                rewards,
            });
        }
    }

    #[inline(always)]
    fn emit_lords_release(ref self: Store, season_id: u32, duel_id: u128, bill: @LordsReleaseBill) {
        self.world.emit_event(@LordsReleaseEvent {
            season_id,
            duel_id,
            bill: *bill,
            timestamp: starknet::get_block_timestamp(),
        });
    }

    #[inline(always)]
    fn emit_player_bookmark(ref self: Store, player_address: ContractAddress, target_address: ContractAddress, target_id: u128, enabled: bool) {
        self.world.emit_event(@PlayerBookmarkEvent {
            player_address,
            target_address,
            target_id,
            enabled,
        });
    }
    #[inline(always)]
    fn emit_player_social_link(ref self: Store, player_address: ContractAddress, social_platform: SocialPlatform, user_name: ByteArray, user_id: ByteArray, avatar: ByteArray) {
        self.world.emit_event(@PlayerSocialLinkEvent {
            player_address,
            social_platform,
            user_name,
            user_id,
            avatar,
        });
    }
    #[inline(always)]
    fn emit_player_setting(ref self: Store, player_address: ContractAddress, setting: PlayerSetting, value: PlayerSettingValue) {
        if (setting != PlayerSetting::Undefined) {
            self.world.emit_event(@PlayerSettingEvent {
                player_address,
                setting,
                value,
            });
        }
    }
}
