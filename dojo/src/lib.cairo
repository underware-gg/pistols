mod interfaces {
    mod systems;
    mod ierc20;
    mod ierc721;
    mod vrf;
}

mod systems {
    mod admin;
    mod bank;
    mod game;
    mod rng;
    mod tutorial;
    #[cfg(feature:'vrf_mock')]
    mod vrf_mock;
    mod tokens {
        mod pack_token;
        mod duelist_token;
        mod duel_token;
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
    mod seeder;
    mod store;
    mod tut;
}

mod models {
    mod challenge;
    mod config;
    mod duelist;
    mod pack;
    mod pact;
    mod payment;
    mod player;
    mod season;
    mod table;
}

mod types {
    mod boolean;
    mod challenge_state;
    mod constants;
    mod duel_progress;
    mod premise;
    mod profile_type;
    mod round_state;
    mod shuffler;
    mod typed_data;
    mod trophies;
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
    mod test_challenge;
    mod test_duel;
    mod test_env_cards;
    mod test_rng;
    mod test_season;
    mod test_tutorial;
    mod test_utils;
    // utils
    mod tester;
    mod prefabs;
    mod mock_rng;
    mod utils;
    // tokens
    mod token {
        mod test_duel_token;
        mod test_duelist_token;
        mod test_pack_token;
        // mocks
        mod mock_duelist;
    }
}
