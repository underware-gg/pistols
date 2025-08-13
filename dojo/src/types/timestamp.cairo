//
// Starknet block timestamp is Unix time (seconds)
//

pub mod TIMESTAMP {
    pub const ONE_MINUTE: u64   = 60;
    pub const ONE_HOUR: u64     = 60 * 60;
    pub const ONE_DAY: u64      = 60 * 60 * 24;
    pub const ONE_WEEK: u64     = 60 * 60 * 24 * 7;
    pub const TWO_WEEKS: u64    = 60 * 60 * 24 * 14;
    pub const THREE_WEEKS: u64  = 60 * 60 * 24 * 21;
    pub const FOUR_WEEKS: u64   = 60 * 60 * 24 * 28;
}

#[derive(Copy, Drop, Serde, PartialEq, IntrospectPacked)]
pub struct Period {
    pub start: u64,     // seconds since epoch, started
    pub end: u64,       // seconds since epoch, ended
}



//----------------------------------------
// Traits
//
use pistols::models::challenge::{Challenge, DuelType};

#[generate_trait]
pub impl PeriodImpl of PeriodTrait {
    #[inline(always)]
    fn new_from_now(expire_timestamp: u64) -> Period {
        let start: u64 = starknet::get_block_timestamp();
        (Period {
            start,
            end: start + expire_timestamp,
        })
    }
    #[inline(always)]
    fn has_expired(self: @Period) -> bool {
        (*self.end != 0 && starknet::get_block_timestamp() > *self.end)
    }
}

#[generate_trait]
pub impl TimestampImpl of TimestampTrait {
    #[inline(always)]
    fn has_timed_out(self: u64, challenge: @Challenge) -> bool {
        if (self == 0) {
            (false)
        } else {
            let timestamp: u64 = starknet::get_block_timestamp();
            (
                timestamp > self ||
                // tournament lifecycle cannot be extended
                (*challenge.duel_type == DuelType::Tournament && timestamp > *challenge.timestamps.end)
            )
        }
    }
    #[inline(always)]
    fn has_elapsed(self: u64, timestamp_to_elapse: u64) -> bool {
        (starknet::get_block_timestamp() > (self + timestamp_to_elapse))
    }
    #[inline(always)]
    fn from_minutes(minutes: u64) -> u64 {
        (minutes * TIMESTAMP::ONE_MINUTE)
    }
    #[inline(always)]
    fn from_hours(hours: u64) -> u64 {
        (hours * TIMESTAMP::ONE_HOUR)
    }
    #[inline(always)]
    fn from_days(days: u64) -> u64 {
        (days * TIMESTAMP::ONE_DAY)
    }
    #[inline(always)]
    fn from_datetime(days: u64, hours: u64, minutes: u64) -> u64 {
        (Self::from_days(days) + Self::from_hours(hours) + Self::from_minutes(minutes))
    }
}


//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {
    use super::{TimestampTrait, TIMESTAMP};
    use pistols::tests::tester::{tester};

    #[test]
    fn test_timestamp() {
        assert_eq!(TimestampTrait::from_minutes(1), TIMESTAMP::ONE_MINUTE, "ONE_MINUTE");
        assert_eq!(TimestampTrait::from_hours(1), TIMESTAMP::ONE_HOUR, "ONE_HOUR");
        assert_eq!(TimestampTrait::from_days(1), TIMESTAMP::ONE_DAY, "ONE_DAY");
        assert_eq!(TimestampTrait::from_days(7), TIMESTAMP::ONE_WEEK, "ONE_WEEK");
        assert_eq!(TimestampTrait::from_days(14), TIMESTAMP::TWO_WEEKS, "TWO_WEEKS");
        assert_eq!(TimestampTrait::from_days(21), TIMESTAMP::THREE_WEEKS, "THREE_WEEKS");
        assert_eq!(TimestampTrait::from_days(28), TIMESTAMP::FOUR_WEEKS, "FOUR_WEEKS");
        assert_eq!(TimestampTrait::from_datetime(1, 1, 1), TIMESTAMP::ONE_DAY + TIMESTAMP::ONE_HOUR + TIMESTAMP::ONE_MINUTE, "from_datetime");
    }

    #[test]
    fn test_timestamp_has_elapsed() {
        let mut timestamp: u64 = 0;
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[0] ONE_MINUTE");
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[0] ONE_HOUR");
        tester::set_block_timestamp(TIMESTAMP::ONE_MINUTE);
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[1] ONE_MINUTE");
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[1] ONE_HOUR");
        tester::elapse_block_timestamp(1);
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[2] ONE_MINUTE");
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[2] ONE_HOUR");
        tester::elapse_block_timestamp(TIMESTAMP::ONE_HOUR - TIMESTAMP::ONE_MINUTE);
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[3] ONE_MINUTE");
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[3] ONE_HOUR");
        timestamp = tester::get_block_timestamp();
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[4] ONE_MINUTE");
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[4] ONE_HOUR");
        tester::elapse_block_timestamp(TIMESTAMP::ONE_MINUTE + 1);
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[5] ONE_MINUTE");
        assert!(!timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[5] ONE_HOUR");
        tester::elapse_block_timestamp(TIMESTAMP::ONE_HOUR - TIMESTAMP::ONE_MINUTE);
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_MINUTE), "[6] ONE_MINUTE");
        assert!(timestamp.has_elapsed(TIMESTAMP::ONE_HOUR), "[6] ONE_HOUR");
    }

    // // test if "free" starknet::get_block_timestamp() is really free...
    // // spoiler.. it is not!
    // #[test]
    // fn test_timestamp_once() { // 12,200
    //     // let timestamp: u64 = starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    // }
    // #[test]
    // fn test_timestamp_twice() { // 24,000
    //     // let timestamp: u64 = starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    // }
    // #[test]
    // fn test_timestamp_multi() { // 118,400
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    //     starknet::get_block_timestamp();
    // }
    // #[test]
    // fn test_timestamp_call_pass() { // 13,280
    //     let timestamp: u64 = starknet::get_block_timestamp();
    //     _call_pass(timestamp);
    // }
    // fn _call_pass(timestamp: u64) -> bool {
    //     (timestamp > 0)
    // }
    // #[test]
    // fn test_timestamp_call_no_pass() { // 25,080
    //     let _timestamp: u64 = starknet::get_block_timestamp();
    //     _call_no_pass();
    // }
    // fn _call_no_pass() -> bool {
    //     (starknet::get_block_timestamp() > 0)
    // }

    struct ts {
        t1: u64,
        t2: u64,
    }
    #[test]
    fn test_timestamp_struct_twice() {
        // expensive!
        let value = ts {
            t1: starknet::get_block_timestamp(),
            t2: starknet::get_block_timestamp(),
        };
        assert_eq!(value.t1, value.t2);
    }
    #[test]
    fn test_timestamp_struct_once() {
        // cheaper!
        let t1: u64 = starknet::get_block_timestamp();
        let value = ts {
            t1,
            t2: t1,
        };
        assert_eq!(value.t1, value.t2);
    }
    #[test]
    fn test_timestamp_struct_once_let() {
        // cheapest!
        let t: u64 = starknet::get_block_timestamp();
        let value = ts {
            t1: t,
            t2: t,
        };
        assert_eq!(value.t1, value.t2);
    }
}
