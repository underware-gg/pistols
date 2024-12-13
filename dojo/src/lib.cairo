mod interfaces {
    mod systems;
    mod ierc20;
    mod ierc721;
}

mod systems {
    mod admin;
    mod bank;
    mod game;
    mod rng;
    #[cfg(feature:'vrf_mock')]
    mod vrf_mock;
    mod tokens {
        mod duel_token;
        mod duelist_token;
        mod fame_coin;
        #[cfg(feature:'lords_mock')]
        mod lords_mock;
    }
    mod components {
        mod coin_component;
        mod token_component;
        mod token_bound;
        mod erc721_hooks;
    }
}

mod libs {
    mod game_loop;
    mod pact;
    mod seeder;
    mod store;
}

mod models {
    mod challenge;
    mod config;
    mod consumable;
    mod duelist;
    mod payment;
    mod player;
    mod table;
}

mod types {
    mod challenge_state;
    mod constants;
    mod duel_progress;
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
    mod test_admin;
    mod test_cards;
    mod test_env_cards;
    mod test_challenge;
    mod test_duel;
    mod test_duelist;
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
