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
#[generate_trait]
pub impl PeriodImpl of PeriodTrait {
    #[inline(always)]
    fn has_expired(self: @Period) -> bool {
        (*self.end != 0 && starknet::get_block_timestamp() > *self.end)
    }
}

#[generate_trait]
pub impl TimestampImpl of TimestampTrait {
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
}
