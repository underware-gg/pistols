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
}

mod libs {
    mod seeder;
    mod shooter;
    mod utils;
}

mod models {
    mod challenge;
    mod config;
    mod duelist;
    mod init;
    mod structs;
    mod table;
    mod token_config;
}

mod types {
    mod action;
    mod challenge;
    mod constants;
    mod events;
    mod round;
}

mod utils {
    mod arrays;
    mod byte_arrays;
    mod bitwise;
    mod encoding;
    mod hash;
    mod math;
    mod short_string;
    mod timestamp;
}

mod mocks {
    #[cfg(feature:'lords_mock')]
    mod lords_mock;
}

#[cfg(test)]
mod tests {
    // pistols
    mod test_action;
    mod test_admin;
    mod test_challenge;
    mod test_chances;
    mod test_duelist;
    mod test_round1;
    mod test_round2;
    mod test_round3;
    mod test_wager;
    mod test_torna;
    mod test_utils;
    // utils
    mod tester;
    mod salt_generator;
    // mocks
    mod mock_erc721;
    // tokens
    mod token {
        mod test_token_duelist;
        mod constants;
        mod utils;
    }
}
