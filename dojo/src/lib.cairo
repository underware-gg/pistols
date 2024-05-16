mod models {
    mod config;
    mod models;
    mod table;
}

mod systems {
    mod admin;
    mod actions;
    mod seeder;
    mod shooter;
    mod utils;
}

mod types {
    mod action;
    mod challenge;
    mod constants;
    mod events;
    mod round;
}

mod interfaces {
    mod ierc20;
}

mod utils {
    mod arrays;
    mod bitwise;
    mod hash;
    mod math;
    mod string;
    mod timestamp;
}

mod tests {
    mod tester;
    mod test_action;
    mod test_admin;
    mod test_challenge;
    mod test_chances;
    mod test_duelist;
    mod test_round1;
    mod test_round2;
    mod test_round3;
    mod test_utils;
    mod test_wager;
}

mod mocks {
    mod lords_mock;
}
