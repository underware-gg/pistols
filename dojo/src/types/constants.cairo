
pub mod CONST {
    // number of rounds per duel
    pub const ROUND_COUNT: u8 = 1;
    
    // the hard max duelist id (max supply)
    pub const MAX_DUELIST_ID: u128 = 0xffffff; // 24 bits (16,777,215)
    
    // duelist health & damage
    pub const FULL_HEALTH: u8 = 3;      // initial health
    pub const DOUBLE_DAMAGE: u8 = 2;
    pub const SINGLE_DAMAGE: u8 = 1;

    // initial player chances
    pub const INITIAL_CHANCE: u8 = 50;
    pub const INITIAL_DAMAGE: u8 = 1;

    pub const ETH_TO_WEI: u256 = 1_000_000_000_000_000_000;
}

pub mod HONOUR {
    // archetype ranges (Honour)
    pub const TRICKSTER_START: u8 = 40;
    pub const LORD_START: u8 = 70;
}

pub mod CHANCES {
    pub const NEVER: u8 = 0;
    pub const ALWAYS: u8 = 100;
}

pub mod RULES {
    pub const UNDERWARE_PERCENT: u8 = 40;
    pub const REALMS_PERCENT: u8 = 10;
    pub const FEES_PERCENT: u8 = 10;
    pub const SEASON_PERCENT: u8 = 40;
}

pub mod FAME {
    use super::CONST;
    use pistols::types::timestamp::{TIMESTAMP};

    // amount of FAME minted to every new Duelist
    pub const MINT_GRANT_AMOUNT: u128 = (3000 * CONST::ETH_TO_WEI.low);
    // amount of FAME lost in a duel
    pub const ONE_LIFE: u128 = (1000 * CONST::ETH_TO_WEI.low);

    // inactivity timestamps in seconds
    pub const MAX_INACTIVE_TIMESTAMP: u64 = TIMESTAMP::FOUR_WEEKS;

    // residual FAME (<1000) that goes to PoolType::Sacrifice
    pub const SACRIFICE_PERCENTAGE: u8 = 60;
}

pub mod METADATA {
    pub fn EXTERNAL_LINK() -> ByteArray {
        ("https://pistols.gg")
    }
    pub fn CONTRACT_IMAGE(base_uri: ByteArray) -> ByteArray {
        format!("{}/pistols/logo.png", base_uri)
    }
    pub fn CONTRACT_BANNER_IMAGE(base_uri: ByteArray) -> ByteArray {
        format!("{}/pistols/splash.jpg", base_uri)
    }
    pub fn CONTRACT_FEATURED_IMAGE(base_uri: ByteArray) -> ByteArray {
        format!("{}/pistols/splash_og.jpg", base_uri)
    }
}
