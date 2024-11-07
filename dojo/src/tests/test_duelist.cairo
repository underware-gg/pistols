#[cfg(test)]
mod tests {
    use core::traits::Into;
    use array::ArrayTrait;
    use debug::PrintTrait;
    use starknet::{ContractAddress};

    use dojo::world::{WorldStorage};

    use pistols::systems::game::{IGameDispatcherTrait};
    use pistols::models::duelist::{Duelist, ProfilePicType, Archetype};
    use pistols::types::constants::{CONST, HONOUR};
    use pistols::tests::tester::{
        tester,
        tester::{
            TestSystems,
            IDuelistTokenDispatcher, IDuelistTokenDispatcherTrait,
            IFameCoinDispatcher, IFameCoinDispatcherTrait,
            FLAGS, ZERO, OWNER, OTHER, BUMMER, TREASURY, ID,
        },
    };


    #[test]
    fn test_create_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::ADMIN | FLAGS::DUELIST);
        let duelist1_name: felt252 = 'Player_ONE';
        let duelist2_name: felt252 = 'Player_TWO';
        let duelist1: Duelist = tester::execute_create_duelist(@sys.duelists, OWNER(), duelist1_name, ProfilePicType::Duelist, '1');
        let duelist2: Duelist = tester::execute_create_duelist(@sys.duelists, OTHER(), duelist2_name, ProfilePicType::External, 'https://wtf.com/wtf.gif');
        assert(duelist1.name == duelist1_name, 'duelist1_name');
        assert(duelist2.name == duelist2_name, 'duelist2_name');
        assert(duelist1.profile_pic_type == ProfilePicType::Duelist, 'duelist1_pic_type');
        assert(duelist2.profile_pic_type == ProfilePicType::External, 'duelist2_pic_type');
        assert(duelist1.profile_pic_uri == "1", 'duelist1_pic_uri_1');
        assert(duelist2.profile_pic_uri == "https://wtf.com/wtf.gif", 'duelist2_pic_uri');
        assert(duelist1.timestamp > 0, 'duelist timestamp_1');
        assert(duelist2.timestamp > 0, 'duelist timestamp_2');
        assert(duelist1.score.total_duels == 0, 'duelist total_duels');
        assert(duelist1.score.honour == 0, 'duelist honour');
        // has fame balance
        assert(tester::fame_balance_of_token(@sys, duelist1.duelist_id) > 0, 'fame_balance_of_token(1)');
        assert(tester::fame_balance_of_token(@sys, duelist2.duelist_id) > 0, 'fame_balance_of_token(2)');
        assert(sys.duelists.calc_fame_reward(duelist1.duelist_id) > 0, 'calc_fame_reward(1)');
        assert(sys.duelists.calc_fame_reward(duelist2.duelist_id) > 0, 'calc_fame_reward(2)');
        // test get
        let duelist1 = tester::get_DuelistValue_id(sys.world, duelist1.duelist_id);
        assert(duelist1.name == duelist1_name, 'duelist1_name');
    }

    #[test]
    fn test_update_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::ADMIN | FLAGS::DUELIST);
        let duelist1_name: felt252 = 'Player_ONE';
        let duelist2_name: felt252 = 'Player_TWO';
        let duelist1: Duelist = tester::execute_create_duelist(@sys.duelists, OWNER(), duelist1_name, ProfilePicType::Duelist, '1');
        let duelist2: Duelist = tester::execute_create_duelist(@sys.duelists, OTHER(), duelist2_name, ProfilePicType::External, '2');
        assert(duelist1.name == duelist1_name, 'duelist1_name');
        assert(duelist2.name == duelist2_name, 'duelist2_name');
        assert(duelist1.profile_pic_uri == "1", 'duelist1_pic_uri');
        assert(duelist2.profile_pic_uri == "2", 'duelist2_pic_uri');
        let duelist1: Duelist = tester::execute_update_duelist_ID(@sys.duelists, OWNER(), duelist1.duelist_id, 'P1', ProfilePicType::Duelist, '11');
        let duelist2: Duelist = tester::execute_update_duelist_ID(@sys.duelists, OTHER(), duelist2.duelist_id, 'P2', ProfilePicType::External, '22');
        assert(duelist1.name != duelist1_name, 'P1');
        assert(duelist2.name != duelist2_name, 'P2');
        assert(duelist1.profile_pic_uri == "11", 'duelist1_pic_uri_AFTER');
        assert(duelist2.profile_pic_uri == "22", 'duelist2_pic_uri_AFTER');
    }

    #[test]
    #[should_panic(expected:('TOKEN: caller is not owner', 'ENTRYPOINT_FAILED'))]
    fn test_update_invalid_duelist() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::ADMIN | FLAGS::DUELIST);
        tester::execute_update_duelist(@sys.duelists, OTHER(), 'P1', ProfilePicType::Duelist, '11');
    }

    #[test]
    #[should_panic(expected:('TOKEN: caller is not owner', 'ENTRYPOINT_FAILED'))]
    fn test_update_duelist_not_owner() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::GAME | FLAGS::ADMIN | FLAGS::DUELIST);
        let duelist: Duelist = tester::execute_create_duelist(@sys.duelists, OWNER(), 'AAA', ProfilePicType::Duelist, '1');
        tester::execute_update_duelist_ID(@sys.duelists, OTHER(), duelist.duelist_id,'P1', ProfilePicType::Duelist, '11');
    }

}
