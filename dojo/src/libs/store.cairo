use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

pub use pistols::models::{
    challenge::{
        Challenge, ChallengeStore, ChallengeEntity, ChallengeEntityStore,
        Wager, WagerStore, WagerEntity, WagerEntityStore,
        Round, RoundStore, RoundEntity, RoundEntityStore,
    },
    duelist::{
        Duelist, DuelistStore, DuelistEntity, DuelistEntityStore,
        Pact, PactStore, PactEntity, PactEntityStore,
        Scoreboard, ScoreboardStore, ScoreboardEntity, ScoreboardEntityStore,
    },
    table::{
        TableConfig, TableConfigStore, TableConfigEntity, TableConfigEntityStore,
        TableWager, TableWagerStore, TableWagerEntity, TableWagerEntityStore,
        TableAdmittance, TableAdmittanceStore, TableAdmittanceEntity, TableAdmittanceEntityStore,
    },
    config::{
        Config, ConfigStore,
        ConfigEntity, ConfigEntityStore,
        CONFIG,
    },
    coin_config::{
        CoinConfig, CoinConfigStore,
        CoinConfigEntity, CoinConfigEntityStore,
    },
    token_config::{
        TokenConfig, TokenConfigStore,
        TokenConfigEntity, TokenConfigEntityStore,
    },
};

#[derive(Copy, Drop)]
pub struct Store {
    world: IWorldDispatcher,
}

#[generate_trait]
impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: IWorldDispatcher) -> Store {
        (Store { world: world })
    }

    //
    // Getters
    //

    // #[inline(always)]
    // fn get_challenge(self: Store, duel_id: u128) -> Challenge {
    //     // (get!(self.world, duel_id, (Challenge)))
    //     // dojo::model::ModelEntity::<ChallengeEntity>::get(self.world, 1); // OK
    //     // let mut challenge_entity = ChallengeEntityStore::get(self.world, 1); // OK
    //     // challenge_entity.update(self.world); // ERROR
    //     (ChallengeStore::get(self.world, duel_id))
    // }

    #[inline(always)]
    fn get_challenge(self: Store, duel_id: u128) -> Challenge {
        (ChallengeStore::get(self.world, duel_id))
    }
    #[inline(always)]
    fn get_challenge_entity(self: Store, duel_id: u128) -> ChallengeEntity {
        (ChallengeEntityStore::get(self.world,
            ChallengeStore::entity_id_from_keys(duel_id)
        ))
    }

    #[inline(always)]
    fn get_wager_entity(self: Store, duel_id: u128) -> WagerEntity {
        (WagerEntityStore::get(self.world,
            WagerStore::entity_id_from_keys(duel_id)
        ))
    }

    #[inline(always)]
    fn get_round(self: Store, duel_id: u128) -> Round {
        (RoundStore::get(self.world, duel_id))
    }
    #[inline(always)]
    fn get_round_entity(self: Store, duel_id: u128) -> RoundEntity {
        (RoundEntityStore::get(self.world,
            RoundStore::entity_id_from_keys(duel_id)
        ))
    }

    #[inline(always)]
    fn get_duelist(self: Store, duelist_id: u128) -> Duelist {
        (DuelistStore::get(self.world, duelist_id))
    }
    #[inline(always)]
    fn get_duelist_entity(self: Store, duelist_id: u128) -> DuelistEntity {
        (DuelistEntityStore::get(self.world,
            DuelistStore::entity_id_from_keys(duelist_id)
        ))
    }

    #[inline(always)]
    fn get_pact(self: Store, table_id: felt252, pair: u128) -> Pact {
        (PactStore::get(self.world, table_id, pair))
    }

    #[inline(always)]
    fn get_scoreboard(self: Store, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (ScoreboardStore::get(self.world, table_id, duelist_id))
    }
    #[inline(always)]
    fn get_scoreboard_entity(self: Store, table_id: felt252, duelist_id: u128) -> ScoreboardEntity {
        (ScoreboardEntityStore::get(self.world,
            ScoreboardStore::entity_id_from_keys(table_id, duelist_id)
        ))
    }

    #[inline(always)]
    fn get_table_config(self: Store, table_id: felt252) -> TableConfig {
        (TableConfigStore::get(self.world, table_id))
    }
    #[inline(always)]
    fn get_table_config_entity(self: Store, table_id: felt252) -> TableConfigEntity {
        (TableConfigEntityStore::get(self.world,
            TableConfigStore::entity_id_from_keys(table_id)
        ))
    }

    #[inline(always)]
    fn get_table_wager(self: Store, table_id: felt252) -> TableWager {
        (TableWagerStore::get(self.world, table_id))
    }
    #[inline(always)]
    fn get_table_wager_entity(self: Store, table_id: felt252) -> TableWagerEntity {
        (TableWagerEntityStore::get(self.world,
            TableWagerStore::entity_id_from_keys(table_id)
        ))
    }

    #[inline(always)]
    fn get_table_admittance_entity(self: Store, table_id: felt252) -> TableAdmittanceEntity {
        (TableAdmittanceEntityStore::get(self.world,
            TableAdmittanceStore::entity_id_from_keys(table_id)
        ))
    }

    #[inline(always)]
    fn get_coin_config(self: Store, contract_address: ContractAddress) -> CoinConfig {
        (CoinConfigStore::get(self.world, contract_address))
    }
    #[inline(always)]
    fn get_coin_config_entity(self: Store, contract_address: ContractAddress) -> CoinConfigEntity {
        (CoinConfigEntityStore::get(self.world,
            CoinConfigStore::entity_id_from_keys(contract_address)
        ))
    }

    #[inline(always)]
    fn get_token_config(self: Store, contract_address: ContractAddress) -> TokenConfig {
        (TokenConfigStore::get(self.world, contract_address))
    }
    #[inline(always)]
    fn get_token_config_entity(self: Store, contract_address: ContractAddress) -> TokenConfigEntity {
        (TokenConfigEntityStore::get(self.world,
            TokenConfigStore::entity_id_from_keys(contract_address)
        ))
    }

    #[inline(always)]
    fn get_config_entity(self: Store) -> ConfigEntity {
        (ConfigEntityStore::get(self.world,
            ConfigStore::entity_id_from_keys(CONFIG::CONFIG_KEY)
        ))
    }

    //
    // Setters
    //

    #[inline(always)]
    fn set_challenge(self: Store, model: @Challenge) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_round(self: Store, model: @Round) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_round_entity(self: Store, entity: @RoundEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_duelist(self: Store, model: @Duelist) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_duelist_entity(self: Store, entity: @DuelistEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_pact(self: Store, model: @Pact) {
        model.set(self.world);
    }
    #[inline(always)]
    fn delete_pact(self: Store, model: @Pact) {
        model.delete(self.world);
    }

    #[inline(always)]
    fn set_scoreboard(self: Store, model: @Scoreboard) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_table_config(self: Store, model: @TableConfig) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_table_config_entity(self: Store, entity: @TableConfigEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_table_admittance(self: Store, model: @TableAdmittance) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_coin_config(self: Store, model: @CoinConfig) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_coin_config_entity(self: Store, entity: @CoinConfigEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_token_config(self: Store, model: @TokenConfig) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_token_config_entity(self: Store, entity: @TokenConfigEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_config(self: Store, model: @Config) {
        model.set(self.world);
    }
    #[inline(always)]
    fn update_config_entity(self: Store, entity: @ConfigEntity) {
        entity.update(self.world);
    }

}
