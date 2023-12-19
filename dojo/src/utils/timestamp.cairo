//
// Starknet block timestamp is Unix time (seconds)
//

mod timestamp {
    fn from_days(days: u64) -> u64 {
        (days * 24 * 60 * 60)
    }

    fn from_hours(hours: u64) -> u64 {
        (hours * 60 * 60)
    }

    fn from_minutes(minutes: u64) -> u64 {
        (minutes * 60)
    }

    fn from_date(days: u64, hours: u64, minutes: u64) -> u64 {
        (from_days(days) + from_hours(hours) + from_minutes(minutes))
    }
}
