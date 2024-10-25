#[cfg(test)]
mod tester {
    use starknet::{ContractAddress, testing, get_caller_address};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::model::{Model, ModelTest, ModelIndex, ModelEntityTest};
    use dojo::utils::test::{spawn_test_world, deploy_contract};

    pub use pistols::systems::{
        admin::{admin, IAdminDispatcher, IAdminDispatcherTrait},
        game::{game, IGameDispatcher, IGameDispatcherTrait},
        tokens::{
            duel_token::{duel_token, IDuelTokenDispatcher, IDuelTokenDispatcherTrait},
            duelist_token::{duelist_token, IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait},
            lords_mock::{lords_mock, ILordsMockDispatcher, ILordsMockDispatcherTrait},
        },
    };
    use pistols::tests::token::mock_duelist::{duelist_token as mock_duelist, mock_duelist_owners};
    use pistols::types::challenge_state::{ChallengeState};
    use pistols::types::constants::{CONST};
    use pistols::types::premise::{Premise};
    use pistols::utils::arrays::{ArrayUtilsTrait, SpanUtilsTrait};
    use pistols::utils::short_string::{ShortString};
    use pistols::interfaces::systems::{SELECTORS};

    use pistols::models::challenge::{
        Challenge, ChallengeStore, ChallengeEntity, ChallengeEntityStore, DuelistState, DuelistStateTrait,
        Round, RoundStore, RoundEntity, RoundEntityStore,
    };
    use pistols::models::duelist::{
        Duelist, DuelistTrait, DuelistStore, DuelistEntity, DuelistEntityStore,
        Scoreboard, ScoreboardStore, ScoreboardEntity, ScoreboardEntityStore,
        Pact, PactStore, PactEntity, PactEntityStore,
        ProfilePicType,
        Archetype,
    };
    use pistols::models::config::{
        Config, ConfigStore, CONFIG, ConfigEntity, ConfigEntityStore,
        TokenConfig, TokenConfigStore, TokenConfigEntity, TokenConfigEntityStore,
    };
    use pistols::models::table::{
        TableConfig, TableConfigStore, TableConfigEntity, TableConfigEntityStore,
        TableAdmittance, TableAdmittanceStore, TableAdmittanceEntity, TableAdmittanceEntityStore,
    };

    use pistols::systems::rng::{rng};
    use pistols::tests::mock_rng::{
        rng as mock_rng,
        IRngDispatcher,
        IRngDispatcherTrait,
        salt_value,
    };




    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    fn ZERO() -> ContractAddress { starknet::contract_address_const::<0x0>() }
    fn OWNER() -> ContractAddress { starknet::contract_address_const::<0x1>() }
    fn OTHER() -> ContractAddress { starknet::contract_address_const::<0x2>() }
    fn BUMMER() -> ContractAddress { starknet::contract_address_const::<0x3>() }
    fn RECIPIENT() -> ContractAddress { starknet::contract_address_const::<0x4>() }
    fn SPENDER() -> ContractAddress { starknet::contract_address_const::<0x5>() }
    fn TREASURY() -> ContractAddress { starknet::contract_address_const::<0x444>() }
    fn BIG_BOY() -> ContractAddress { starknet::contract_address_const::<0x54f650fb5e1fb61d7b429ae728a365b69e5aff9a559a05de70f606aaea1a243>() }
    fn LITTLE_BOY()  -> ContractAddress { starknet::contract_address_const::<0xffff00000000000ee>() }
    fn LITTLE_GIRL() -> ContractAddress { starknet::contract_address_const::<0xaaaa00000000000bb>() }
    fn FAKE_OWNER_1_1() -> ContractAddress { starknet::contract_address_const::<0x1000000000000000000000000000000001>() }
    fn FAKE_OWNER_1_2() -> ContractAddress { starknet::contract_address_const::<0x1000000000000000000000000000000002>() }
    fn FAKE_OWNER_2_1() -> ContractAddress { starknet::contract_address_const::<0x2000000000000000000000000000000001>() }
    fn FAKE_OWNER_2_2() -> ContractAddress { starknet::contract_address_const::<0x2000000000000000000000000000000002>() }
    // always owned tokens: 0xffff, 0xaaaa
    fn OWNED_BY_LITTLE_BOY()-> ContractAddress { starknet::contract_address_const::<0xffff>() }
    fn OWNED_BY_LITTLE_GIRL() -> ContractAddress { starknet::contract_address_const::<0xaaaa>() }

    fn ID(address: ContractAddress) -> u128 {
        (DuelistTrait::address_as_id(address))
    }

    // set_contract_address : to define the address of the calling contract,
    // set_account_contract_address : to define the address of the account used for the current transaction.
    fn impersonate(address: ContractAddress) {
        testing::set_contract_address(address);
        testing::set_account_contract_address(address);
    }

    #[inline(always)]
    fn _assert_is_alive(state: DuelistState, msg: felt252) {
        assert(state.health > 0, msg);
    }
    #[inline(always)]
    fn _assert_is_dead(state: DuelistState, msg: felt252) {
        assert(state.health == 0, msg);
    }


    //-------------------------------
    // Test world

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    mod FLAGS {
        const GAME: u8       = 0b0000001;
        const ADMIN: u8      = 0b0000010;
        const LORDS: u8      = 0b0000100;
        const DUEL: u8       = 0b0001000;
        const DUELIST: u8    = 0b0010000;
        const APPROVE: u8    = 0b0100000;
        const MOCK_RNG: u8   = 0b1000000;
    }

    #[derive(Copy, Drop)]
    pub struct Systems {
        world: IWorldDispatcher,
        game: IGameDispatcher,
        admin: IAdminDispatcher,
        lords: ILordsMockDispatcher,
        duels: IDuelTokenDispatcher,
        duelists: IDuelistTokenDispatcher,
        rng: IRngDispatcher,
    }

    #[inline(always)]
    fn deploy_system(world: IWorldDispatcher, salt: felt252, class_hash: felt252) -> ContractAddress {
        let contract_address = world.deploy_contract(salt, class_hash.try_into().unwrap());
        (contract_address)
    }

    fn setup_world(flags: u8) -> Systems {
        let mut deploy_game: bool = (flags & FLAGS::GAME) != 0;
        let mut deploy_admin: bool = (flags & FLAGS::ADMIN) != 0;
        let mut deploy_lords: bool = (flags & FLAGS::LORDS) != 0;
        let mut deploy_duel: bool = (flags & FLAGS::DUEL) != 0;
        let mut deploy_duelist: bool = (flags & FLAGS::DUELIST) != 0;
        let mut deploy_mock_rng = (flags & FLAGS::MOCK_RNG) != 0;
        let approve: bool = (flags & FLAGS::APPROVE) != 0;

        deploy_game = deploy_game || approve;
        deploy_admin = deploy_admin || deploy_game;
        deploy_lords = deploy_lords || deploy_game || deploy_duelist;
        deploy_duel = deploy_duel || deploy_game;

        // setup testing
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);

        let mut namespaces: Array<ByteArray> = array!["pistols"];
        let mut models: Array<felt252> = array![];

        models.extend_from_span(get_models_test_class_hashes!(["pistols"]));
        if (deploy_mock_rng) {
            // namespaces.append("mock");
            models.extend_from_span([salt_value::TEST_CLASS_HASH].span());
        }
        if (!deploy_duelist && deploy_game) {
            models.extend_from_span([mock_duelist_owners::TEST_CLASS_HASH].span());
        }

        // deploy world
// '---- spawn_test_world...'.print();
        let world: IWorldDispatcher = spawn_test_world(
            namespaces.span(),
            models.span(),
        );
// '---- spawned...'.print();
        world.grant_owner(dojo::utils::bytearray_hash(@"pistols"), OWNER());
// '---- grated...'.print();

        // deploy systems
        let game = IGameDispatcher{ contract_address:
            if (deploy_game) {
                let address = deploy_system(world, 'salt', game::TEST_CLASS_HASH);
                world.grant_owner(SELECTORS::GAME, OWNER());
                world.grant_writer(selector_from_tag!("pistols-Duelist"), address);
                world.grant_writer(selector_from_tag!("pistols-Scoreboard"), address);
                world.grant_writer(selector_from_tag!("pistols-Challenge"), address);
                world.grant_writer(selector_from_tag!("pistols-Pact"), address);
                world.grant_writer(selector_from_tag!("pistols-Round"), address);
                (address)
            }
            else {ZERO()}
        };
// '---- 1'.print();
        let lords = ILordsMockDispatcher{ contract_address:
            if (deploy_lords) {
                let address = deploy_system(world, 'lords_mock', lords_mock::TEST_CLASS_HASH);
                world.grant_writer(selector_from_tag!("pistols-CoinConfig"), address);
                let call_data: Span<felt252> = array![
                    // game.contract_address.into(), // minter
                    0, // minter
                    10_000_000_000_000_000_000_000, // 10,000 Lords
                ].span();
                world.init_contract(SELECTORS::LORDS_MOCK, call_data);
                (address)
            }
            else {ZERO()}
        };
// '---- 2'.print();
        let duels = IDuelTokenDispatcher{ contract_address:
            if (deploy_duel) {
                let address = deploy_system(world, 'duel_token', duel_token::TEST_CLASS_HASH);
                world.grant_writer(SELECTORS::DUEL_TOKEN, OWNER());
                world.grant_writer(selector_from_tag!("pistols-TokenConfig"), address);
                world.grant_writer(selector_from_tag!("pistols-Payment"), address);
                world.grant_writer(selector_from_tag!("pistols-Challenge"), address);
                world.grant_writer(selector_from_tag!("pistols-Round"), address);
                world.grant_writer(selector_from_tag!("pistols-Pact"), address);
                world.grant_writer(selector_from_tag!("pistols-Scoreboard"), address);
                let call_data: Span<felt252> = array![
                    0, // minter_address
                    0, // renderer_address
                    100_000_000_000_000_000_000, // fee_amount: 100 Lords
                ].span();
                world.init_contract(SELECTORS::DUEL_TOKEN, call_data);
                (address)
            }
            else {ZERO()}
        };
// '---- 3'.print();
        let duelists = IDuelistTokenDispatcher{ contract_address:
            if (deploy_duelist) {
                let address = deploy_system(world, 'duelist_token', duelist_token::TEST_CLASS_HASH);
                world.grant_writer(SELECTORS::DUELIST_TOKEN, OWNER());
                world.grant_writer(selector_from_tag!("pistols-TokenConfig"), address);
                world.grant_writer(selector_from_tag!("pistols-Payment"), address);
                world.grant_writer(selector_from_tag!("pistols-Duelist"), address);
                let call_data: Span<felt252> = array![
                    0, // minter_address
                    0, // renderer_address
                    100_000_000_000_000_000_000, // fee_amount: 100 Lords
                ].span();
                world.init_contract(SELECTORS::DUELIST_TOKEN, call_data);
                (address)
            }
            else if (deploy_game) {
                let address = deploy_system(world, 'duelist_token', mock_duelist::TEST_CLASS_HASH);
                world.grant_writer(selector_from_tag!("pistols-MockDuelistOwners"), address);
                (address)
            }
            else {ZERO()}
        };
// '---- 4'.print();
        let admin = IAdminDispatcher{ contract_address:
            if (deploy_admin) {
                let address = deploy_system(world, 'admin', admin::TEST_CLASS_HASH);
                let call_data: Span<felt252> = array![
                    TREASURY().into(), // treasury
                    lords.contract_address.into(),
                ].span();
                world.grant_owner(SELECTORS::ADMIN, OWNER());
                world.grant_writer(selector_from_tag!("pistols-Config"), address);
                world.grant_writer(selector_from_tag!("pistols-TableConfig"), address);
                world.grant_writer(selector_from_tag!("pistols-TableAdmittance"), address);
                world.init_contract(SELECTORS::ADMIN, call_data);
                (address)
            }
            else {ZERO()}
        };
// '---- 5'.print();
        let rng = IRngDispatcher{ contract_address:
            {
                let class_hash = if (deploy_mock_rng) {mock_rng::TEST_CLASS_HASH} else {rng::TEST_CLASS_HASH};
                let address = deploy_system(world, 'rng', class_hash);
                world.grant_owner(dojo::utils::bytearray_hash(@"pistols"), address);
                // world.grant_owner(dojo::utils::bytearray_hash(@"mock"), address);
                (address)
            }
        };
// '---- 6'.print();

        // initializers
        if (deploy_lords) {
            execute_lords_faucet(@lords, OWNER());
            execute_lords_faucet(@lords, OTHER());
        }
// '---- 7'.print();
        if (approve) {
            execute_lords_approve(@lords, OWNER(), game.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
            execute_lords_approve(@lords, OTHER(), game.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
            execute_lords_approve(@lords, BUMMER(), game.contract_address, 1_000_000 * CONST::ETH_TO_WEI.low);
        }
// '---- 8'.print();

        impersonate(OWNER());

// '---- READY!'.print();
        (Systems { world, game, admin, lords, duels, duelists, rng })
    }

    fn elapse_timestamp(delta: u64) -> (u64, u64) {
        let block_info = starknet::get_block_info().unbox();
        let new_block_number = block_info.block_number + 1;
        let new_block_timestamp = block_info.block_timestamp + delta;
        testing::set_block_number(new_block_number);
        testing::set_block_timestamp(new_block_timestamp);
        (new_block_number, new_block_timestamp)
    }

    #[inline(always)]
    fn get_block_number() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_number)
    }

    #[inline(always)]
    fn get_block_timestamp() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_timestamp)
    }

    #[inline(always)]
    fn _next_block() -> (u64, u64) {
        elapse_timestamp(INITIAL_STEP)
    }

    //
    // execute calls
    //

    // ::admin
    fn execute_admin_grant_admin(system: @IAdminDispatcher, sender: ContractAddress, owner_address: ContractAddress, granted: bool) {
        impersonate(sender);
        (*system).grant_admin(owner_address, granted);
        _next_block();
    }
    fn execute_admin_set_config(system: @IAdminDispatcher, sender: ContractAddress, config: Config) {
        impersonate(sender);
        (*system).set_config(config);
        _next_block();
    }
    fn execute_admin_set_paused(system: @IAdminDispatcher, sender: ContractAddress, paused: bool) {
        impersonate(sender);
        (*system).set_paused(paused);
        _next_block();
    }
    fn execute_admin_set_table(system: @IAdminDispatcher, sender: ContractAddress, table: TableConfig) {
        impersonate(sender);
        (*system).set_table(table);
        _next_block();
    }
    fn execute_admin_set_table_admittance(system: @IAdminDispatcher, sender: ContractAddress, table_admittance: TableAdmittance) {
        impersonate(sender);
        (*system).set_table_admittance(table_admittance);
        _next_block();
    }
    fn execute_admin_open_table(system: @IAdminDispatcher, sender: ContractAddress, table_id: felt252, enabled: bool) {
        impersonate(sender);
        (*system).open_table(table_id, enabled);
        _next_block();
    }

    // ::ierc20
    fn execute_lords_faucet(system: @ILordsMockDispatcher, sender: ContractAddress) {
        impersonate(sender);
        (*system).faucet();
        _next_block();
    }
    fn execute_lords_approve(system: @ILordsMockDispatcher, owner: ContractAddress, spender: ContractAddress, value: u128) {
        impersonate(owner);
        (*system).approve(spender, value.into());
        _next_block();
    }

    // ::duelist
    fn execute_create_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = (*system).create_duelist(sender, name, profile_pic_type, profile_pic_uri);
        _next_block();
        (duelist)
    }
    fn execute_update_duelist(system: @IDuelistTokenDispatcher, sender: ContractAddress, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        (execute_update_duelist_ID(system, sender, ID(sender), name, profile_pic_type, profile_pic_uri))
    }
    fn execute_update_duelist_ID(system: @IDuelistTokenDispatcher, sender: ContractAddress, duelist_id: u128, name: felt252, profile_pic_type: ProfilePicType, profile_pic_uri: felt252) -> Duelist {
        impersonate(sender);
        let duelist: Duelist = (*system).update_duelist(duelist_id, name, profile_pic_type, profile_pic_uri);
        _next_block();
        (duelist)
    }

    // ::duel_token
    fn execute_create_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
    ) -> u128 {
        (execute_create_duel_ID(system, sender, ID(sender), challenged, quote, table_id, expire_hours))
    }
    fn execute_create_duel_ID(system: @IDuelTokenDispatcher, sender: ContractAddress,
        token_id: u128,
        challenged: ContractAddress,
        // premise: Premise,
        quote: felt252,
        table_id: felt252,
        expire_hours: u64,
    ) -> u128 {
        impersonate(sender);
        let duel_id: u128 = (*system).create_duel(token_id, challenged, Premise::Nothing, quote, table_id, expire_hours);
        _next_block();
        (duel_id)
    }
    fn execute_reply_duel(system: @IDuelTokenDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        (execute_reply_duel_ID(system, sender, ID(sender), duel_id, accepted))
    }
    fn execute_reply_duel_ID(system: @IDuelTokenDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        impersonate(sender);
        let new_state: ChallengeState = (*system).reply_duel(token_id, duel_id, accepted);
        _next_block();
        (new_state)
    }

    // ::game
    fn execute_commit_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        hash: u128,
    ) {
        execute_commit_moves_ID(system, sender, ID(sender), duel_id, hash);
    }
    fn execute_commit_moves_ID(system: @IGameDispatcher, sender: ContractAddress,
        token_id: u128,
        duel_id: u128,
        hash: u128,
    ) {
        impersonate(sender);
        (*system).commit_moves(token_id, duel_id, hash);
        _next_block();
    }
    fn execute_reveal_moves(system: @IGameDispatcher, sender: ContractAddress,
        duel_id: u128,
        salt: felt252,
        moves: Span<u8>,
    ) {
        impersonate(sender);
        (*system).reveal_moves(ID(sender), duel_id, salt, moves);
        _next_block();
    }

    //
    // getters
    //

    #[inline(always)]
    fn get_Config(world: IWorldDispatcher) -> Config {
        (ConfigStore::get(world, CONFIG::CONFIG_KEY))
    }
    #[inline(always)]
    fn get_Table(world: IWorldDispatcher, table_id: felt252) -> TableConfig {
        (TableConfigStore::get(world, table_id))
    }
    #[inline(always)]
    fn get_TableAdmittance(world: IWorldDispatcher, table_id: felt252) -> TableAdmittance {
        (TableAdmittanceStore::get(world, table_id))
    }
    #[inline(always)]
    fn get_DuelistEntity(world: IWorldDispatcher, address: ContractAddress) -> DuelistEntity {
        (DuelistEntityStore::get(world, DuelistStore::entity_id_from_keys(ID(address))))
    }
    #[inline(always)]
    fn get_DuelistEntity_id(world: IWorldDispatcher, duelist_id: u128) -> DuelistEntity {
        (DuelistEntityStore::get(world, DuelistStore::entity_id_from_keys(duelist_id)))
    }
    #[inline(always)]
    fn get_Scoreboard(world: IWorldDispatcher, table_id: felt252, address: ContractAddress) -> Scoreboard {
        (ScoreboardStore::get(world, table_id, ID(address)))
    }
    #[inline(always)]
    fn get_Scoreboard_id(world: IWorldDispatcher, table_id: felt252, duelist_id: u128) -> Scoreboard {
        (ScoreboardStore::get(world, table_id, duelist_id))
    }
    #[inline(always)]
    fn get_ChallengeEntity(world: IWorldDispatcher, duel_id: u128) -> ChallengeEntity {
        (ChallengeEntityStore::get(world, ChallengeStore::entity_id_from_keys(duel_id)))
    }
    #[inline(always)]
    fn get_RoundEntity(world: IWorldDispatcher, duel_id: u128) -> RoundEntity {
        (RoundEntityStore::get(world, RoundStore::entity_id_from_keys(duel_id)))
    }
    #[inline(always)]
    fn get_Challenge_Round_Entity(world: IWorldDispatcher, duel_id: u128) -> (ChallengeEntity, RoundEntity) {
        let challenge = get_ChallengeEntity(world, duel_id);
        let round = get_RoundEntity(world, duel_id);
        (challenge, round)
    }

    //
    // setters
    //

    // depends on use dojo::model::{Model};
    fn set_Config(world: IWorldDispatcher, model: Config) {
        model.set_test(world);
    }
    fn set_TableConfig(world: IWorldDispatcher, model: TableConfig) {
        model.set_test(world);
    }
    fn set_Duelist(world: IWorldDispatcher, model: Duelist) {
        model.set_test(world);
    }
    fn set_Scoreboard(world: IWorldDispatcher, model: Scoreboard) {
        model.set_test(world);
    }
    fn set_Challenge(world: IWorldDispatcher, model: Challenge) {
        model.set_test(world);
    }

    //
    // Asserts
    //

    fn assert_balance(lords: ILordsMockDispatcher, address: ContractAddress, balance_before: u128, subtract: u128, add: u128, prefix: felt252) -> u128 {
        let balance: u128 = lords.balance_of(address).low;
        if (subtract > add) {
            assert(balance < balance_before, ShortString::concat(prefix, ' <'));
        } else if (add > subtract) {
            assert(balance > balance_before, ShortString::concat(prefix, ' >'));
        } else {
            assert(balance == balance_before, ShortString::concat(prefix, ' =='));
        }
        assert(balance == balance_before - subtract + add, ShortString::concat(prefix, ' =>'));
        (balance)
    }

    fn assert_winner_balance(lords: ILordsMockDispatcher,
        winner: u8,
        duelist_a: ContractAddress, duelist_b: ContractAddress,
        balance_a: u128, balance_b: u128,
        fee: u128, prize_value: u128,
        prefix: felt252,
    ) {
        if (winner == 1) {
            assert_balance(lords, duelist_a, balance_a, fee, prize_value, ShortString::concat('A_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee + prize_value, 0, ShortString::concat('A_B_', prefix));
        } else if (winner == 2) {
            assert_balance(lords, duelist_a, balance_a, fee + prize_value, 0, ShortString::concat('B_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, prize_value, ShortString::concat('B_B_', prefix));
        } else {
            assert_balance(lords, duelist_a, balance_a, fee, 0, ShortString::concat('D_A_', prefix));
            assert_balance(lords, duelist_b, balance_b, fee, 0, ShortString::concat('D_B_', prefix));
        }
    }


}

#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    #[test]
    fn test_tester() {
        assert(true, 'so very true');
    }
}
