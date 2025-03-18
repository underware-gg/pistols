#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};
    use dojo::world::{WorldStorage};
    use dojo_cairo_test::{
        spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
        WorldStorageTestTrait,
    };

    use pistols::interfaces::dns::{DnsTrait};
    use pistols::tests::tester::{
        tester,
        tester::{
            TestSystems, FLAGS,
            rng, IRngDispatcher,
            OWNER, ZERO,
        }
    };

    const INVALID_TABLE: felt252 = 'TheBookIsOnTheTable';
    const CONFIG_HASH: felt252 = selector_from_tag!("pistols-Config");

    fn DUMMY_LORDS() -> ContractAddress { starknet::contract_address_const::<0x131313131313>() }

    //
    // Initialize
    //

    fn setup_alternative_world() -> (WorldStorage, IRngDispatcher) {
        let namespace: ByteArray = "alternative";
        let resources: Span<TestResource> = array![
            TestResource::Contract(rng::TEST_CLASS_HASH)
        ].span();
        let contract_defs: Span<ContractDef> = array![
            ContractDefTrait::new(@namespace, @"rng")
                .with_writer_of([dojo::utils::bytearray_hash(@namespace)].span())
        ].span();

        let namespace_def = NamespaceDef { namespace, resources };
        let mut world: WorldStorage = spawn_test_world([namespace_def].span());
        world.sync_perms_and_inits(contract_defs);
        (world, world.rng_dispatcher())
    }


    #[test]
    fn test_finders() {
        let mut sys: TestSystems = tester::setup_world(0);
        let rng_address: ContractAddress = sys.world.find_contract_address(@"rng");
        let rng_name: ByteArray = sys.world.find_contract_name(sys.rng.contract_address);
        assert_ne!(rng_address, ZERO(), "rng_address_ZERO");
        assert_eq!(rng_address, sys.rng.contract_address, "rng_address");
        assert_eq!(rng_name, "rng", "rng_name");
    }

    #[test]
    fn test_is_world_contract() {
        let mut sys: TestSystems = tester::setup_world(0);
        let (world, rng) = setup_alternative_world();
        // check alternative created
        let rng_address: ContractAddress = world.find_contract_address(@"rng");
        let rng_name: ByteArray = world.find_contract_name(rng.contract_address);
        assert_ne!(rng_address, ZERO(), "rng_address_ZERO");
        assert_eq!(rng_address, rng.contract_address, "rng_address");
        assert_eq!(rng_name, "rng", "rng_name");
        // in pistols world...
        assert!(sys.world.is_world_contract(sys.rng.contract_address), "sys.is_duel_contract(pistols)");
        assert!(!sys.world.is_world_contract(rng.contract_address), "!sys.is_duel_contract(pistols)");
        // in alternative world...
        assert!(world.is_world_contract(rng.contract_address), "sys.is_duel_contract(alternative)");
        assert!(!world.is_world_contract(sys.rng.contract_address), "!sys.is_duel_contract(alternative)");
    }

    #[test]
    fn test_validators() {
        let mut sys: TestSystems = tester::setup_world(0 | FLAGS::DUEL);
        assert!(sys.world.is_duel_contract(sys.duels.contract_address), "is_duel_contract(duels)");
        assert!(!sys.world.is_duel_contract(sys.rng.contract_address), "!is_duel_contract(rng)");
    }

    #[test]
    #[should_panic(expected:('ENTRYPOINT_NOT_FOUND', 'ENTRYPOINT_FAILED'))]
    fn test_validator_outsider_contract() {
        let mut sys: TestSystems = tester::setup_world(0);
        sys.world.is_world_contract(sys.world.dispatcher.contract_address);
    }

    #[test]
    #[should_panic(expected:('CONTRACT_NOT_DEPLOYED', 'ENTRYPOINT_FAILED'))]
    fn test_validator_outsider_random_address() {
        let mut sys: TestSystems = tester::setup_world(0);
        sys.world.is_world_contract(OWNER());
    }

}
