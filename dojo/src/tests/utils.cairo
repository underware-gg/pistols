#[cfg(test)]
mod utils {
    use starknet::{ContractAddress, testing};
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    use pistols::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use pistols::types::challenge::{ChallengeState};
    use pistols::types::blades::{Blades};
    use pistols::models::models::{
        Duelist, duelist,
        Challenge, challenge,
        Round, round,
    };

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    const INITIAL_TIMESTAMP: u64 = 0x100000000;
    const INITIAL_STEP: u64 = 0x10;

    fn setup_world() -> (IWorldDispatcher, IActionsDispatcher, ContractAddress, ContractAddress) {
        let mut models = array![duelist::TEST_CLASS_HASH, challenge::TEST_CLASS_HASH, round::TEST_CLASS_HASH];
        let world: IWorldDispatcher = spawn_test_world(models);
        let contract_address = world.deploy_contract('salt', actions::TEST_CLASS_HASH.try_into().unwrap());
        let owner: ContractAddress = starknet::contract_address_const::<0x111111>();
        let other: ContractAddress = starknet::contract_address_const::<0x222>();
        // testing::set_caller_address(owner);   // not used??
        testing::set_contract_address(owner); // this is the CALLER!!
        testing::set_block_number(1);
        testing::set_block_timestamp(INITIAL_TIMESTAMP);
        (world, IActionsDispatcher { contract_address }, owner, other)
    }

    fn _next_block() -> (u64, u64) {
        elapse_timestamp(INITIAL_STEP)
    }

    fn elapse_timestamp(delta: u64) -> (u64, u64) {
        let block_info = starknet::get_block_info().unbox();
        let new_block_number = block_info.block_number + 1;
        let new_block_timestamp = block_info.block_timestamp + delta;
        testing::set_block_number(new_block_number);
        testing::set_block_timestamp(new_block_timestamp);
        (new_block_number, new_block_timestamp)
    }

    fn get_block_number() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_number)
    }

    fn get_block_timestamp() -> u64 {
        let block_info = starknet::get_block_info().unbox();
        (block_info.block_timestamp)
    }

    fn execute_register_duelist(system: IActionsDispatcher, sender: ContractAddress, name: felt252, profile_pic: u8) {
        testing::set_contract_address(sender);
        system.register_duelist(name, profile_pic);
        _next_block();
    }

    fn execute_create_challenge(system: IActionsDispatcher, sender: ContractAddress,
        challenged: ContractAddress,
        message: felt252,
        expire_seconds: u64,
    ) -> u128 {
        testing::set_contract_address(sender);
        let duel_id: u128 = system.create_challenge(challenged, message, expire_seconds);
        _next_block();
        (duel_id)
    }

    fn execute_reply_challenge(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        accepted: bool,
    ) -> ChallengeState {
        testing::set_contract_address(sender);
        let new_state: ChallengeState = system.reply_challenge(duel_id, accepted);
        _next_block();
        (new_state)
    }

    fn execute_commit_action(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        hash: u64,
    ) {
        testing::set_contract_address(sender);
        system.commit_action(duel_id, round_number, hash);
        _next_block();
    }

    fn execute_reveal_action(system: IActionsDispatcher, sender: ContractAddress,
        duel_id: u128,
        round_number: u8,
        salt: u64,
        action: u8,
    ) {
        testing::set_contract_address(sender);
        system.reveal_action(duel_id, round_number, salt, action);
        _next_block();
    }

    //
    // read-only calls
    //

    fn execute_get_pact(system: IActionsDispatcher, a: ContractAddress, b: ContractAddress) -> u128 {
        let result: u128 = system.get_pact(a, b);
        (result)
    }
    fn execute_has_pact(system: IActionsDispatcher, a: ContractAddress, b: ContractAddress) -> bool {
        let result: bool = system.has_pact(a, b);
        (result)
    }
    fn calc_hit_bonus(system: IActionsDispatcher, duelist_address: ContractAddress) -> u8 {
        let result: u8 = system.calc_hit_bonus(duelist_address);
        (result)
    }
    fn calc_hit_penalty(system: IActionsDispatcher, health: u8) -> u8 {
        let result: u8 = system.calc_hit_penalty(health);
        (result)
    }
    fn get_pistols_hit_chance(system: IActionsDispatcher, duelist_address: ContractAddress, health: u8, steps: u8) -> u8 {
        let result: u8 = system.get_pistols_hit_chance(duelist_address, health, steps);
        (result)
    }
    fn get_pistols_kill_chance(system: IActionsDispatcher, duelist_address: ContractAddress, health: u8, steps: u8) -> u8 {
        let result: u8 = system.get_pistols_kill_chance(duelist_address, health, steps);
        (result)
    }
    fn get_blades_hit_chance(system: IActionsDispatcher, duelist_address: ContractAddress, health: u8, blade: Blades) -> u8 {
        let result: u8 = system.get_blades_hit_chance(duelist_address, health, blade);
        (result)
    }
    fn get_blades_kill_chance(system: IActionsDispatcher, duelist_address: ContractAddress, health: u8, blade: Blades) -> u8 {
        let result: u8 = system.get_blades_kill_chance(duelist_address, health, blade);
        (result)
    }

    //
    // getters
    //

    fn get_Duelist(world: IWorldDispatcher, address: ContractAddress) -> Duelist {
        (get!(world, address, Duelist))
    }

    fn get_Challenge(world: IWorldDispatcher, duel_id: u128) -> Challenge {
        (get!(world, duel_id, Challenge))
    }

    fn get_Round(world: IWorldDispatcher, duel_id: u128, round_number: u8) -> Round {
        (get!(world, (duel_id, round_number), Round))
    }

    fn get_Challenge_Round(world: IWorldDispatcher, duel_id: u128) -> (Challenge, Round) {
        let challenge = get!(world, duel_id, Challenge);
        let round = get!(world, (duel_id, challenge.round_number), Round);
        (challenge, round)
    }
}

#[cfg(test)]
mod tests {
    use core::traits::{Into, TryInto};
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/pedersen.cairo
    extern fn pedersen(a: felt252, b: felt252) -> felt252 implicits(Pedersen) nopanic;

    #[test]
    #[available_gas(1_000_000)]
    fn test_utils() {
        assert(true != false, 'utils');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_pedersen_hash() {
        let a: felt252 = 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        let b_a = pedersen(b, a);
        // pedersen hashes are DIFFERENT for (a,b) and (b,a)
        assert(a_b != b_a, 'pedersen');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_pedersen_hash_from_zero() {
        let a: felt252 = 0;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let a_b = pedersen(a, b);
        // pedersen hashes are DIFFERENT if (a == zero)
        assert(a_b != b, 'pedersen');
    }

    #[test]
    #[available_gas(1_000_000)]
    fn test_hor_hash() {
        let a: felt252 = 0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7;
        let b: felt252 = 0x4d07e40e93398ed3c76981e72dd1fd22557a78ce36c0515f679e27f0bb5bc5f;
        let aa: u256 = a.into();
        let bb: u256 = b.into();
        let a_b = aa ^ bb;
        let b_a = bb ^ aa;
        // xor hashes are EQUAL for (a,b) and (b,a)
        assert(a_b == b_a, 'felt_to_u128');
    }
}
