mod models {
    mod config;
    mod models;
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
    mod round;
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
    mod utils;
    mod test_action;
    mod test_round1;
    mod test_round2;
    mod test_round3;
    mod test_duelist;
    mod test_challenge;
}

mod mocks {
    mod lords_mock;
}
