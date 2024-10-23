mod interfaces {
    mod systems;
    mod ierc20;
    mod ierc721;
}

mod systems {
    mod admin;
    mod game;
    mod rng;
    mod tokens {
        mod duel_token;
        mod duelist_token;
        #[cfg(feature:'lords_mock')]
        mod lords_mock;
    }
    mod components {
        mod coin_component;
        mod token_component;
        mod erc721_hooks;
    }
}

mod libs {
    mod pact;
    mod seeder;
    mod shooter;
    mod store;
    mod utils;
}

mod models {
    mod challenge;
    mod config;
    mod duelist;
    mod table;
    mod coin_config;
    mod token_config;
}

mod types {
    mod challenge_state;
    mod constants;
    mod duel_progress;
    mod events;
    mod misc;
    mod premise;
    mod round_state;
    mod shuffler;
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
    mod metadata;
    mod misc;
    mod short_string;
    mod timestamp;
    mod openzeppelin {
        mod snip12;
    }
}


#[cfg(test)]
mod tests {
    // pistols
    mod test_admin;
    mod test_cards;
    mod test_env_cards;
    mod test_challenge;
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
    mod utils;
    // tokens
    mod token {
        mod test_duel_token;
        mod test_duelist_token;
        // mocks
        mod mock_duelist;
    }
}
