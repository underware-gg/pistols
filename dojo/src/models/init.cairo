
//-------------------------------------
// Model initializers
//
mod init {
    use pistols::models::{challenge, duelist};

    fn Shot() -> challenge::Shot {
        (challenge::Shot {
            hash: 0,
            salt: 0,
            action: 0,
            chance_crit: 0,
            chance_hit: 0,
            chance_lethal: 0,
            dice_crit: 0,
            dice_hit: 0,
            damage: 0,
            block: 0,
            win: 0,
            wager: 0,
            health: 0,
            honour: 0,
        })
    }

    fn Duelist() -> duelist::Duelist {
        (duelist::Duelist {
            duelist_id: 0,
            //----------------
            name: 0,
            profile_pic_type: 0,
            profile_pic_uri: "",
            score: Score(),
            timestamp: 0,
        })
    }

    fn Score() -> duelist::Score {
        (duelist::Score {
            total_duels: 0,
            total_wins: 0,
            total_losses: 0,
            total_draws: 0,
            total_honour: 0,
            honour: 0,
            level_villain: 0,
            level_trickster: 0,
            level_lord: 0,
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
