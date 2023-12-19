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
    use pistols::models::models::{
        Duelist, duelist,
        Challenge, challenge,
        Round, round,
    };

    //
    // starknet testing cheats
    // https://github.com/starkware-libs/cairo/blob/main/corelib/src/starknet/testing.cairo
    //

    fn setup_world() -> (IWorldDispatcher, IActionsDispatcher, ContractAddress, ContractAddress) {
        let mut models = array![duelist::TEST_CLASS_HASH, challenge::TEST_CLASS_HASH, round::TEST_CLASS_HASH];
        let world: IWorldDispatcher = spawn_test_world(models);
        let contract_address = world.deploy_contract('salt', actions::TEST_CLASS_HASH.try_into().unwrap());
        let owner: ContractAddress = starknet::contract_address_const::<0x111111>();
        let other: ContractAddress = starknet::contract_address_const::<0x222>();
        // testing::set_caller_address(owner);   // not used??
        testing::set_contract_address(owner); // this is the CALLER!!
        testing::set_block_number(1);
        testing::set_block_timestamp(0x100000000);
        (world, IActionsDispatcher { contract_address }, owner, other)
    }

    fn _next_block() -> (u64, u64) {
        elapse_timestamp(0x10)
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
        pass_code: felt252,
        message: felt252,
        expire_seconds: u64,
    ) -> u128 {
        testing::set_contract_address(sender);
        let duel_id: u128 = system.create_challenge(challenged, pass_code, message, expire_seconds);
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

    fn get_Duelist(world: IWorldDispatcher, address: ContractAddress) -> Duelist {
        let result: Duelist = get!(world, address, Duelist);
        (result)
    }

    fn get_Challenge(world: IWorldDispatcher, duel_id: u128) -> Challenge {
        let result: Challenge = get!(world, duel_id, Challenge);
        (result)
    }

    #[test]
    #[available_gas(10_000)]
    fn test_utils() {
        assert(true != false, 'utils');
    }
}