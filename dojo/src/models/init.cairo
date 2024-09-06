
//-------------------------------------
// Model initializers
//
mod init {
    use pistols::models::{challenge, duelist};

    fn Shot() -> challenge::Shot {
        (challenge::Shot {
            hash: 0,
            salt: 0,
            card_1: 0,
            card_2: 0,
            card_3: 0,
            card_4: 0,
            state_start: PlayerState(),
            state_final: PlayerState(),
            wager: 0,
            win: 0,
        })
    }

    fn PlayerState() -> challenge::PlayerState {
        (challenge::PlayerState {
            health: 0,
            damage: 0,
            chances: 0,
            dice_crit: 0,
            honour: 0,
        })
    }

    fn Duelist() -> duelist::Duelist {
        (duelist::Duelist {
            duelist_id: 0,
            //----------------
            name: 0,
            profile_pic_type: duelist::ProfilePicType::Undefined,
            profile_pic_uri: "",
            score: Score(),
            timestamp: 0,
        })
    }

    fn Score() -> duelist::Score {
        (duelist::Score {
            honour: 0,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 0,
            total_duels: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            honour_history: 0,
        })
    }

    fn Scoreboard() -> duelist::Scoreboard {
        (duelist::Scoreboard {
            table_id: 0,
            duelist_id: 0,
            //----------------
            score: Score(),
            wager_won: 0,
            wager_lost: 0,
        })
    }
}
