//------------------------------------------------------
// libs::utils tests
//
#[cfg(test)]
mod tests {
    use starknet::{ContractAddress};

    use pistols::models::duelist::{DuelistStatus, DuelistStatusTrait};
    use pistols::models::pact::{PactTrait};
    use pistols::utils::short_string::{ShortString};

    #[test]
    fn test_pact_pair() {
        let a: ContractAddress = starknet::contract_address_const::<0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec>();
        let b: ContractAddress = starknet::contract_address_const::<0x13d9ee239f33fea4f8785b9e3870ade909e20a9599ae7cd62c1c292b73af1b7>();
        let p_a = PactTrait::make_pair(a, b);
        let p_b = PactTrait::make_pair(b, a);
        assert_eq!(p_a, p_b, "test_pact_pair");
    }

    #[test]
    fn test_update_honour() {
        let mut status: DuelistStatus = Default::default();
        status.total_duels = 1;
        status.update_honour(100);
        assert!(status.is_lord(), "is_lord()");
    }

    #[test]
    fn test_honour_log() {
        let mut status: DuelistStatus = Default::default();
        let mut sum: u8 = 0;
        let mut n: u8 = 1;
        loop {
            if (n > 8) { break; }
            status.total_duels += 1;
            status.update_honour(n);
            sum += n;
            assert_eq!(status.honour, (sum / n), "sum_8__{}", n);
            n += 1;
        };
        assert_eq!(status.honour_log, 0x0807060504030201, "0x0807060504030201");
        // loop status
        loop {
            if (n > 16) { break; }
            status.total_duels += 1;
            status.update_honour(n);
            sum -= n - 8;
            sum += n;
            assert_eq!(status.honour, (sum / 8), "sum_16__{}", n);
            n += 1;
        };
        assert_eq!(status.honour_log, 0x100f0e0d0c0b0a09, "0x100f0e0d0c0b0a09");
        // new loop
        status.total_duels += 1;
        status.update_honour(n);
        assert_eq!(status.honour_log, 0x100f0e0d0c0b0a11, "0x100f0e0d0c0b0a11");
    }

}
