mod interfaces {
    mod systems;
    mod ierc20;
    mod ierc721;
}

mod systems {
    mod admin;
    mod actions;
    mod minter;
    mod token_duelist;
    mod rng;
}

mod libs {
    mod seeder;
    mod shooter;
    mod store;
    mod utils;
}

mod models {
    mod challenge;
    mod config;
    mod duelist;
    mod init;
    mod table;
    mod token_config;
}

mod types {
    mod challenge_state;
    mod constants;
    mod duel_progress;
    mod events;
    mod misc;
    mod round_state;
    mod typed_data;
    mod cards {
        mod cards;
        mod hand;
        mod paces;
        mod tactics;
        mod blades;
        mod env;
    }
}

mod utils {
    mod arrays;
    mod byte_arrays;
    mod bitwise;
    mod encoding;
    mod hash;
    mod math;
    mod misc;
    mod short_string;
    mod timestamp;
    mod openzeppelin {
        mod snip12;
    }
}

mod mocks {
    #[cfg(feature:'lords_mock')]
    mod lords_mock;
}

#[cfg(test)]
mod tests {
    // pistols
    mod test_admin;
    mod test_cards;
    mod test_challenge;
    mod test_chances;
    mod test_duel;
    mod test_duelist;
    // mod test_wager;
    // mod test_torna;
    mod test_utils;
    mod test_rng;
    // utils
    mod tester;
    mod prefabs;
    mod mock_rng;
    // tokens
    mod token {
        mod test_token_duelist;
        // mocks
        mod mock_token_duelist;
    }
}
