mod interfaces {
    pub mod dns;
    pub mod ierc20;
    pub mod ierc721;
    pub mod vrf;
}

mod systems {
    pub mod admin;
    pub mod bank;
    pub mod game;
    pub mod rng;
    pub mod rng_mock;
    pub mod tutorial;
    #[cfg(feature:'vrf_mock')]
    pub mod vrf_mock;
    pub mod tokens {
        pub mod pack_token;
        pub mod duelist_token;
        pub mod duel_token;
        pub mod fame_coin;
        pub mod fools_coin;
        #[cfg(feature:'lords_mock')]
        pub mod lords_mock;
    }
    pub mod components {
        pub mod coin_component;
        pub mod token_component;
        pub mod token_bound;
        pub mod erc721_hooks;
    }
}

mod libs {
    pub mod game_loop;
    pub mod seeder;
    pub mod store;
    pub mod tut;
}

mod models {
    pub mod challenge;
    pub mod config;
    pub mod duelist;
    pub mod pack;
    pub mod pact;
    pub mod player;
    pub mod pool;
    pub mod leaderboard;
    pub mod season;
    pub mod table;
}

mod types {
    pub mod boolean;
    pub mod challenge_state;
    pub mod constants;
    pub mod duel_progress;
    pub mod premise;
    pub mod profile_type;
    pub mod round_state;
    pub mod rules;
    pub mod shuffler;
    pub mod typed_data;
    pub mod trophies;
    pub mod cards {
        pub mod cards;
        pub mod deck;
        pub mod hand;
        pub mod paces;
        pub mod tactics;
        pub mod blades;
        pub mod env;
    }
}

mod utils {
    pub mod arrays;
    pub mod byte_arrays;
    pub mod bitwise;
    pub mod encoding;
    pub mod hash;
    pub mod math;
    pub mod metadata;
    pub mod misc;
    pub mod short_string;
    pub mod timestamp;
    pub mod openzeppelin {
        pub mod snip12;
    }
}


#[cfg(test)]
mod tests {
    pub mod test_admin;
    pub mod test_bank;
    pub mod test_cards;
    pub mod test_challenge;
    pub mod test_dns;
    pub mod test_duel;
    pub mod test_env_cards;
    pub mod test_rng;
    pub mod test_season;
    pub mod test_tutorial;
    pub mod test_utils;
    // utils
    pub mod tester;
    pub mod prefabs;
    pub mod utils;
    // mocks
    // pub mod mock_account;
    // tokens
    mod token {
        pub mod test_duel_token;
        pub mod test_duelist_token;
        pub mod test_pack_token;
        pub mod test_fame_coin;
        pub mod test_fools_coin;
        // mocks
        pub mod mock_duelist;
    }
}
