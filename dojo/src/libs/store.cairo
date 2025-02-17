use starknet::{ContractAddress};
use dojo::world::{WorldStorage};
use dojo::model::{Model, ModelStorage, ModelValueStorage};
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
    },
    player::{
        Player, PlayerValue,
        PlayerRequiredAction,
    },
    pack::{
        Pack, PackValue,
    },
    challenge::{
        Challenge, ChallengeValue,
        Round, RoundValue,
    },
    duelist::{
        Duelist, DuelistValue,
        DuelistChallenge, DuelistChallengeValue,
        Scoreboard, ScoreboardValue,
        ScoreboardTable, ScoreboardTableValue,
    },
    pact::{
        Pact, PactValue,
    },
    table::{
        TableConfig, TableConfigValue,
        RulesType,
    },
    season::{
        SeasonConfig, SeasonConfigValue,
    },
};
pub use pistols::systems::components::{
    token_bound::{
        TokenBoundAddress, TokenBoundAddressValue,
    },
};

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
    fn get_player(ref self: Store, address: ContractAddress) -> Player {
        (self.world.read_model(address))
    }
    #[inline(always)]
    fn get_payer_value(ref self: Store, address: ContractAddress) -> PlayerValue {
        (self.world.read_value(address))
    }

    #[inline(always)]
    fn get_pack(ref self: Store, pack_id: u128) -> Pack {
        (self.world.read_model(pack_id))
    }
    #[inline(always)]
    fn get_pack_value(ref self: Store, pack_id: u128) -> PackValue {
        (self.world.read_value(pack_id))
    }

    #[inline(always)]
    fn get_challenge(ref self: Store, duel_id: u128) -> Challenge {
        (self.world.read_model(duel_id))
    }
    #[inline(always)]
    fn get_challenge_value(ref self: Store, duel_id: u128) -> ChallengeValue {
        (self.world.read_value(duel_id))
    }

    #[inline(always)]
    fn get_round(ref self: Store, duel_id: u128) -> Round {
        (self.world.read_model(duel_id))
    }
    #[inline(always)]
    fn get_round_value(ref self: Store, duel_id: u128) -> RoundValue {
        (self.world.read_value(duel_id))
    }

    #[inline(always)]
    fn get_duelist(ref self: Store, duelist_id: u128) -> Duelist {
        (self.world.read_model(duelist_id))
    }
    #[inline(always)]
    fn get_duelist_value(ref self: Store, duelist_id: u128) -> DuelistValue {
        (self.world.read_value(duelist_id))
    }

    #[inline(always)]
    fn get_duelist_challenge(ref self: Store, duelist_id: u128) -> DuelistChallenge {
        (self.world.read_model(duelist_id))
    }
    #[inline(always)]
    fn get_duelist_challenge_value(ref self: Store, duelist_id: u128) -> DuelistChallengeValue {
        (self.world.read_value(duelist_id))
    }

    #[inline(always)]
    fn get_pact(ref self: Store, table_id: felt252, pair: u128) -> Pact {
        (self.world.read_model((table_id, pair),))
    }

    #[inline(always)]
    fn get_scoreboard(ref self: Store, holder: felt252) -> Scoreboard {
        (self.world.read_model(holder))
    }

    #[inline(always)]
    fn get_scoreboard_table(ref self: Store, holder: felt252, table_id: felt252) -> ScoreboardTable {
        (self.world.read_model((holder, table_id),))
    }

    #[inline(always)]
    fn get_table_config(ref self: Store, table_id: felt252) -> TableConfig {
        (self.world.read_model(table_id))
    }
    #[inline(always)]
    fn get_table_config_value(ref self: Store, table_id: felt252) -> TableConfigValue {
        (self.world.read_value(table_id))
    }

    #[inline(always)]
    fn get_season_config(ref self: Store, table_id: felt252) -> SeasonConfig {
        (self.world.read_model(table_id))
    }
    #[inline(always)]
    fn get_season_config_value(ref self: Store, table_id: felt252) -> SeasonConfigValue {
        (self.world.read_value(table_id))
    }
    #[inline(always)]
    fn get_current_season(ref self: Store) -> SeasonConfig {
        (self.world.read_model(self.get_config_season_table_id()))
    }
    #[inline(always)]
    fn get_current_season_value(ref self: Store) -> SeasonConfigValue {
        (self.world.read_value(self.get_config_season_table_id()))
    }

    #[inline(always)]
    fn get_coin_config(ref self: Store, contract_address: ContractAddress) -> CoinConfig {
        (self.world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_coin_config_value(ref self: Store, contract_address: ContractAddress) -> CoinConfigValue {
        (self.world.read_value(contract_address))
    }

    #[inline(always)]
    fn get_token_config(ref self: Store, contract_address: ContractAddress) -> TokenConfig {
        (self.world.read_model(contract_address))
    }
    #[inline(always)]
    fn get_token_config_value(ref self: Store, contract_address: ContractAddress) -> TokenConfigValue {
        (self.world.read_value(contract_address))
    }

    #[inline(always)]
    fn get_config(ref self: Store) -> Config {
        (self.world.read_model(CONFIG::CONFIG_KEY))
    }

    #[inline(always)]
    fn get_pool(ref self: Store, pool_id: PoolType) -> Pool {
        (self.world.read_model(pool_id))
    }

    #[inline(always)]
    fn get_token_bound_address(ref self: Store, recipient: ContractAddress) -> TokenBoundAddress {
        (self.world.read_model(recipient))
    }

    //----------------------------------
    // Model Setters
    //

    #[inline(always)]
    fn set_player(ref self: Store, model: @Player) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_pack(ref self: Store, model: @Pack) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_challenge(ref self: Store, model: @Challenge) {
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
    fn set_duelist_challenge(ref self: Store, model: @DuelistChallenge) {
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
    fn set_scoreboard(ref self: Store, model: @Scoreboard) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_scoreboard_table(ref self: Store, model: @ScoreboardTable) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_table_config(ref self: Store, model: @TableConfig) {
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

    //----------------------------------
    // Single member setters
    // https://book.dojoengine.org/framework/world/api#read_member-and-read_member_of_models
    // https://book.dojoengine.org/framework/world/api#write_member-and-write_member_of_models
    //

    #[inline(always)]
    fn get_config_season_table_id(ref self: Store) -> felt252 {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("season_table_id")))
    }
    #[inline(always)]
    fn get_config_lords_address(ref self: Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("lords_address")))
    }
    #[inline(always)]
    fn get_config_vrf_address(ref self: Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("vrf_address")))
    }
    #[inline(always)]
    fn get_config_treasury_address(ref self: Store) -> ContractAddress {
        (self.world.read_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("treasury_address")))
    }

    #[inline(always)]
    fn get_current_season_rules(ref self: Store) -> RulesType {
        (self.get_table_rules(self.get_config_season_table_id()))
    }
    #[inline(always)]
    fn get_table_rules(ref self: Store, table_id: felt252) -> RulesType {
        (self.world.read_member(Model::<TableConfig>::ptr_from_keys(table_id), selector!("rules")))
    }

    // setters

    #[inline(always)]
    fn set_config_is_paused(ref self: Store, is_paused: bool) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("is_paused"), is_paused);
    }
    #[inline(always)]
    fn set_config_season_table_id(ref self: Store, season_table_id: felt252) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("season_table_id"), season_table_id);
    }
    #[inline(always)]
    fn set_config_treasury_address(ref self: Store, treasury_address: ContractAddress) {
        self.world.write_member(Model::<Config>::ptr_from_keys(CONFIG::CONFIG_KEY), selector!("treasury_address"), treasury_address);
    }

    #[inline(always)]
    fn set_duelist_timestamp_active(ref self: Store, duelist_id: u128) {
        self.world.write_member(Model::<Duelist>::ptr_from_keys(duelist_id), selector!("timestamp_active"), starknet::get_block_timestamp());
    }


    //----------------------------------
    // Emitters
    //

    #[inline(always)]
    fn emit_required_action(ref self: Store, duelist_id: u128, duel_id: u128) {
        self.world.emit_event(@PlayerRequiredAction{
            duelist_id,
            duel_id,
        });
    }
}
