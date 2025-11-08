#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};

    use pistols::models::{
        // pool::{Pool, PoolTrait, PoolType},
    };
    use pistols::types::{
    };

    use pistols::tests::tester::{tester,
        tester::{
            TestSystems, FLAGS,
            IAdminDispatcherTrait,
            OTHER,
        }
    };
    // use pistols::libs::admin_fix::{AdminFixTrait};

    //-----------------------------------------
    // ADMIN FIX
    //

    #[test]
    #[should_panic(expected: ('ADMIN: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_urgent_update_caller() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::OWNER);
        tester::impersonate(OTHER());
        sys.admin.urgent_update();
    }


    //-----------------------------------------
    // veLords migration
    //

}
