use starknet::{ContractAddress};
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::{
    ModelStorage, ModelValueStorage,
    // Model, ModelPtr,
};

pub use pistols::models::{
    config::{
        CONFIG,
        Config, ConfigTrait, ConfigValue,
        CoinConfig, CoinConfigValue,
        TokenConfig, TokenConfigValue,
    },
    player::{
        Player, PlayerValue,
    },
    pack::{
        Pack, PackValue,
    },
    challenge::{
        Challenge, ChallengeValue,
        ChallengeFameBalance, ChallengeFameBalanceValue,
        Round, RoundValue,
    },
    duelist::{
        Duelist, DuelistValue,
        DuelistChallenge, DuelistChallengeValue,
        Scoreboard, ScoreboardValue,
    },
    pact::{
        Pact, PactValue,
    },
    table::{
        TableConfig, TableConfigValue,
        TableAdmittance, TableAdmittanceValue,
    },
    payment::{
        Payment, PaymentTrait, PaymentValue,
    },
};
pub use pistols::systems::components::{
    token_bound::{
        TokenBoundAddress, TokenBoundAddressValue,
    },
};

#[derive(Copy, Drop)]
pub struct Store {
    world: WorldStorage,
}

#[generate_trait]
impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: WorldStorage) -> Store {
        (Store { world })
    }

    //
    // Getters
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
    fn get_scoreboard(ref self: Store, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (self.world.read_model((table_id, duelist_id),))
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
    fn get_table_admittance(ref self: Store, table_id: felt252) -> TableAdmittance {
        (self.world.read_model(table_id))
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
    fn get_payment(ref self: Store, key: felt252) -> Payment {
        (self.world.read_model(key))
    }

    #[inline(always)]
    fn get_token_bound_address(ref self: Store, recipient: ContractAddress) -> TokenBoundAddress {
        (self.world.read_model(recipient))
    }

    //
    // Setters
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
    fn set_challenge_fame_bill(ref self: Store, model: @ChallengeFameBalance) {
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
    fn set_table_config(ref self: Store, model: @TableConfig) {
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_table_admittance(ref self: Store, model: @TableAdmittance) {
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
    fn set_payment(ref self: Store, model: @Payment) {
        (*model).assert_is_valid();
        self.world.write_model(model);
    }

    #[inline(always)]
    fn set_token_bound_address(ref self: Store, model: @TokenBoundAddress) {
        self.world.write_model(model);
    }
}
