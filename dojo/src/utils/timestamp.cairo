//
// Starknet block timestamp is Unix time (seconds)
//

fn days_to_timestamp(days: u64) -> u64 {
    (days * 24 * 60 * 60)
}

fn hours_to_timestamp(hours: u64) -> u64 {
    (hours * 60 * 60)
}

fn minutes_to_timestamp(minutes: u64) -> u64 {
    (minutes * 60)
}

fn date_to_timestamp(days: u64, hours: u64, minutes: u64) -> u64 {
    (days_to_timestamp(days) + hours_to_timestamp(hours) + minutes_to_timestamp(minutes))
}
