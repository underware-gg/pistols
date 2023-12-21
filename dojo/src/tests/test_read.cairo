#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use core::traits::Into;
    use starknet::{ContractAddress};

    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    use pistols::utils::timestamp::{timestamp};
    use pistols::tests::utils::{utils};

    const PLAYER_NAME: felt252 = 'Sensei';
    const MESSAGE_1: felt252 = 'Challenge yaa for a duuel!!';

    #[test]
    #[available_gas(1_000_000_000)]
    fn test_get_timestamp() {
        let (world, system, owner, other) = utils::setup_world();
        // timestamp = INITIAL_TIMESTAMP
        let timestamp1: u64 = utils::execute_get_timestamp(system);
        assert(timestamp1> 0, 'timestamp1 >');
        assert(timestamp1 == utils::INITIAL_TIMESTAMP, 'timestamp1 =');

        utils::execute_register_duelist(system, owner, PLAYER_NAME, 1);
        // timestamp +1
        let timestamp2: u64 = utils::execute_get_timestamp(system);
        assert(timestamp2 > timestamp1, 'timestamp2 >');
        assert(timestamp2 == timestamp1 + utils::INITIAL_STEP, 'timestamp2 =');

        let duel_id: u128 = utils::execute_create_challenge(system, owner, other, 0, MESSAGE_1, 0);
        // timestamp +2
        let ch = utils::get_Challenge(world, duel_id);
        assert(ch.timestamp == timestamp2, 'timestamp');

        let timestamp3: u64 = utils::execute_get_timestamp(system);
        assert(timestamp3 > timestamp2, 'timestamp3 >');
        assert(timestamp3 == timestamp2 + utils::INITIAL_STEP, 'timestamp3 =');


    }

}
