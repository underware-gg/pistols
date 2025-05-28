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
    pub mod game_loop;
    pub mod rng;
    pub mod rng_mock;
    pub mod tutorial;
    pub mod vrf_mock;
    pub mod tokens {
        // erc721
        pub mod pack_token;
        pub mod duelist_token;
        pub mod duel_token;
        // pub mod tournament_token;
        // erc20
        pub mod fame_coin;
        pub mod fools_coin;
        // mocks
        // #[cfg(feature:'lords_mock')]
        pub mod lords_mock;
        // pub mod budokan_mock;
    }
    pub mod components {
        pub mod coin_component;
        pub mod token_component;
        pub mod token_bound;
    }
}

mod libs {
    pub mod admin_fix;
    pub mod game_loop;
    pub mod seeder;
    pub mod store;
    pub mod tut;
}

mod models {
    pub mod challenge;
    pub mod config;
    pub mod duelist;
    pub mod events;
    pub mod pack;
    pub mod pact;
    pub mod player;
    pub mod pool;
    pub mod leaderboard;
    pub mod season;
    // pub mod tournament;
}

mod types {
    pub mod boolean;
    pub mod challenge_state;
    pub mod constants;
    pub mod duel_progress;
    pub mod duelist_profile;
    pub mod premise;
    pub mod round_state;
    pub mod rules;
    pub mod shuffler;
    pub mod timestamp;
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
    pub mod bytemap;
    pub mod nibblemap;
    pub mod hash;
    pub mod math;
    pub mod misc;
    pub mod short_string;
}


#[cfg(test)]
mod tests {
    pub mod test_admin;
    pub mod test_admin_fix;
    pub mod test_bank;
    pub mod test_cards;
    pub mod test_challenge;
    pub mod test_dns;
    pub mod test_duel;
    pub mod test_env_cards;
    pub mod test_rng;
    pub mod test_season;
    pub mod test_player;
    // pub mod test_tournament;
    // pub mod test_tournament_duels;
    // pub mod test_tournament_round;
    pub mod test_tutorial;
    // utils
    pub mod tester;
    pub mod prefabs;
    // mocks
    // pub mod mock_account;
    // tokens
    mod token {
        pub mod test_duel_token;
        pub mod test_duelist_token;
        pub mod test_pack_token;
        // pub mod test_tournament_token;
        pub mod test_fame_coin;
        pub mod test_fools_coin;
        // mocks
        pub mod mock_duelist;
    }
}
