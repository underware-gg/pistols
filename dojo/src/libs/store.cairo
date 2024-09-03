use starknet::{ContractAddress};
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

use pistols::models::{
    challenge::{
        Challenge, ChallengeStore, ChallengeEntity, ChallengeEntityStore,
        Wager, WagerStore, WagerEntity, WagerEntityStore,
        Round, RoundStore, RoundEntity, RoundEntityStore,
        Snapshot, SnapshotStore, SnapshotEntity, SnapshotEntityStore,
    },
    duelist::{
        Duelist, DuelistStore, DuelistEntity, DuelistEntityStore,
        Pact, PactStore, PactEntity, PactEntityStore,
        Scoreboard, ScoreboardStore, ScoreboardEntity, ScoreboardEntityStore,
    },
    token_config::{TokenConfig, TokenConfigStore, TokenConfigEntity, TokenConfigEntityStore},
    table::{
        TableConfig, TableConfigStore, TableConfigEntity, TableConfigEntityStore,
        TableAdmittance, TableAdmittanceStore, TableAdmittanceEntity, TableAdmittanceEntityStore,
    },
    config::{Config, ConfigStore, ConfigEntity, ConfigEntityStore, CONFIG},
};

#[derive(Copy, Drop)]
struct Store {
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
        (ChallengeEntityStore::get(self.world, ChallengeStore::entity_id_from_keys(duel_id)))
    }

    #[inline(always)]
    fn get_wager_entity(self: Store, duel_id: u128) -> WagerEntity {
        (WagerEntityStore::get(self.world, WagerStore::entity_id_from_keys(duel_id)))
    }

    #[inline(always)]
    fn get_round(self: Store, duel_id: u128, round_number: u8) -> Round {
        (RoundStore::get(self.world, duel_id, round_number))
    }

    #[inline(always)]
    fn get_round_entity(self: Store, duel_id: u128, round_number: u8) -> RoundEntity {
        (RoundEntityStore::get(self.world, RoundStore::entity_id_from_keys(duel_id, round_number)))
    }

    #[inline(always)]
    fn get_snapshot_entity(self: Store, duel_id: u128) -> SnapshotEntity {
        (SnapshotEntityStore::get(self.world, SnapshotStore::entity_id_from_keys(duel_id)))
    }

    #[inline(always)]
    fn get_duelist(self: Store, duelist_id: u128) -> Duelist {
        (DuelistStore::get(self.world, duelist_id))
    }

    #[inline(always)]
    fn get_duelist_entity(self: Store, duelist_id: u128) -> DuelistEntity {
        (DuelistEntityStore::get(self.world, DuelistStore::entity_id_from_keys(duelist_id)))
    }

    #[inline(always)]
    fn get_pact_entity(self: Store, table_id: felt252, pair: u128) -> PactEntity {
        (PactEntityStore::get(self.world, PactStore::entity_id_from_keys(table_id, pair)))
    }

    #[inline(always)]
    fn get_scoreboard(self: Store, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (ScoreboardStore::get(self.world, table_id, duelist_id))
    }

    #[inline(always)]
    fn get_scoreboard_entity(self: Store, table_id: felt252, duelist_id: u128) -> ScoreboardEntity {
        (ScoreboardEntityStore::get(self.world, ScoreboardStore::entity_id_from_keys(table_id, duelist_id)))
    }

    #[inline(always)]
    fn get_table_config(self: Store, table_id: felt252) -> TableConfig {
        (TableConfigStore::get(self.world, table_id))
    }

    #[inline(always)]
    fn get_table_config_entity(self: Store, table_id: felt252) -> TableConfigEntity {
        (TableConfigEntityStore::get(self.world, TableConfigStore::entity_id_from_keys(table_id)))
    }

    #[inline(always)]
    fn get_token_admittance_entity(self: Store, table_id: felt252) -> TableAdmittanceEntity {
        (TableAdmittanceEntityStore::get(self.world, TableAdmittanceStore::entity_id_from_keys(table_id)))
    }

    #[inline(always)]
    fn get_token_config_entity(self: Store, token_contract_address: ContractAddress) -> TokenConfigEntity {
        (TokenConfigEntityStore::get(self.world, TokenConfigStore::entity_id_from_keys(token_contract_address)))
    }

    #[inline(always)]
    fn get_config_entity(self: Store) -> ConfigEntity {
        (ConfigEntityStore::get(self.world, ConfigStore::entity_id_from_keys(CONFIG::CONFIG_KEY)))
    }

    //
    // Setters
    //

    #[inline(always)]
    fn set_challenge(self: Store, model: Challenge) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_challenge_entity(self: Store, entity: ChallengeEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_wager_entity(self: Store, entity: WagerEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_round(self: Store, model: Round) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_round_entity(self: Store, entity: RoundEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_snapshot(self: Store, model: Snapshot) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_snapshot_entity(self: Store, entity: SnapshotEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_duelist_entity(self: Store, entity: DuelistEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_pact(self: Store, model: Pact) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_pact_entity(self: Store, entity: PactEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_scoreboard(self: Store, model: Scoreboard) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_scoreboard_entity(self: Store, entity: ScoreboardEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_table_config(self: Store, model: TableConfig) {
        model.set(self.world);
    }

    #[inline(always)]
    fn set_table_config_entity(self: Store, entity: TableConfigEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_table_admittance_entity(self: Store, entity: TableAdmittanceEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_token_config_entity(self: Store, entity: TokenConfigEntity) {
        entity.update(self.world);
    }

    #[inline(always)]
    fn set_config_entity(self: Store, entity: ConfigEntity) {
        entity.update(self.world);
    }

}
