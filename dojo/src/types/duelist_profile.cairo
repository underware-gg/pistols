
//--------------------------
// DuelistProfile
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistProfile {
    Undefined,
    Character: CharacterKey,    // Character(id)
    Bot: BotKey,                // Bot(id)
    Genesis: GenesisKey,        // Genesis(id)
    // Eternum: u16,   // Eternum(realm id)
}

//--------------------------
// Profiles
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum CharacterKey {
    Unknown,
    Bartender,
    Drunkard,
    Devil,
    Player,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum BotKey {
    Unknown,
    TinMan,
    Scarecrow,
    Leon,
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum GenesisKey {
    Unknown,                // 0
    SerWalker,              // 1
    LadyVengeance,          // 2
    Duke,                   // 3
    Duella,                 // 4
    Jameson,                // 5
    Misty,                  // 6
    Karaku,                 // 7
    Kenzu,                  // 8
    Pilgrim,                // 9
    Jack,                   // 10
    Pops,                   // 11
    NynJah,                 // 12
    Thrak,                  // 13
    Bloberto,               // 14
    Squiddo,                // 15
    SlenderDuck,            // 16
    Breadman,               // 17
    Groggus,                // 18
    Pistolopher,            // 19
    Secreto,                // 20
    ShadowMare,             // 21
    Fjolnir,                // 22
    ChimpDylan,             // 23
    Hinata,                 // 24
    HelixVex,               // 25
    BuccaneerJames,         // 26
    TheSensei,              // 27
    SenseiTarrence,         // 28
    ThePainter,             // 29
    Ashe,                   // 30
    SerGogi,                // 31
    TheSurvivor,            // 32
    TheFrenchman,           // 33
    SerFocger,              // 34
    SillySosij,             // 35
    BloodBeard,             // 36
    Fredison,               // 37
    TheBard,                // 38
    Ponzimancer,            // 39
    DealerTani,             // 40
    SerRichard,             // 41
    Recipromancer,          // 42
    Mataleone,              // 43
    FortunaRegem,           // 44
    Amaro,                  // 45
    Mononoke,               // 46
    Parsa,                  // 47
    Jubilee,                // 48
    LadyOfCrows,            // 49
    BananaDuke,             // 50
    LordGladstone,          // 51
    LadyStrokes,            // 52
    Bliss,                  // 53
    StormMirror,            // 54
    Aldreda,                // 55
    Petronella,             // 56
    SeraphinaRose,          // 57
    LucienDeSombrel,        // 58
    FyernVirelock,          // 59
    Noir,                   // 60
    QueenAce,               // 61
    JoshPeel,               // 62
    IronHandRogan,          // 63
}



//--------------------------
// Collection Descriptions
//
#[derive(Copy, Drop, Serde, Default)]
pub struct CollectionDescription {
    pub name: felt252,          // @generateContants:shortstring
    pub folder_name: felt252,   // @generateContants:shortstring
    pub profile_count: u8,      // number of profiles in the collection
    pub is_playable: bool,      // playes can use
    pub duelist_id_base: u128,  // for characters (tutorials) and practice bots
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum DuelistProfile
mod COLLECTIONS {
    use super::{CollectionDescription};
    pub const Undefined: CollectionDescription = CollectionDescription {
        name: 'Undefined',
        folder_name: 'undefined',
        profile_count: 0,
        is_playable: false,
        duelist_id_base: 0,
    };
    pub const Character: CollectionDescription = CollectionDescription {
        name: 'Tavern Characters',
        folder_name: 'characters',
        profile_count: 4,
        is_playable: false,
        duelist_id_base: 0x100000000,
    };
    pub const Bot: CollectionDescription = CollectionDescription {
        name: 'Practice bots',
        folder_name: 'bots',
        profile_count: 3,
        is_playable: false,
        duelist_id_base: 0x200000000,
    };
    pub const Genesis: CollectionDescription = CollectionDescription {
        name: 'Genesis Collection',
        folder_name: 'genesis',
        profile_count: 63,
        is_playable: true,
        duelist_id_base: 0,
    };
}



//--------------------------
// Profile Descriptions
//
#[derive(Copy, Drop, Serde, Default)]
pub struct ProfileDescription {
    pub name: felt252, // @generateContants:shortstring
}

// IMPORTANT: names must be in sync with enum CharacterKey
mod CHARACTER_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const Bartender: ProfileDescription = ProfileDescription {
        name: 'Bartender',
    };
    pub const Drunkard: ProfileDescription = ProfileDescription {
        name: 'Drunkard',
    };
    pub const Devil: ProfileDescription = ProfileDescription {
        name: 'Devil',
    };
    pub const Player: ProfileDescription = ProfileDescription {
        name: 'Stranger',
    };
}

// IMPORTANT: names must be in sync with enum BotKey
mod BOT_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const TinMan: ProfileDescription = ProfileDescription {
        name: 'Tin Man',
    };
    pub const Scarecrow: ProfileDescription = ProfileDescription {
        name: 'Scarecrow',
    };
    pub const Leon: ProfileDescription = ProfileDescription {
        name: 'Leon',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum GenesisKey
mod GENESIS_PROFILES {
    use super::{ProfileDescription};
    pub const Unknown: ProfileDescription = ProfileDescription {
        name: 'Unknown',
    };
    pub const SerWalker: ProfileDescription = ProfileDescription {  // 1
        name: 'Ser Walker',
    };
    pub const LadyVengeance: ProfileDescription = ProfileDescription {  // 2
        name: 'Lady Vengeance',
    };
    pub const Duke: ProfileDescription = ProfileDescription {  // 3
        name: 'Duke',
    };
    pub const Duella: ProfileDescription = ProfileDescription {  // 4
        name: 'Duella',
    };
    pub const Jameson: ProfileDescription = ProfileDescription {  // 5
        name: 'Jameson',
    };
    pub const Misty: ProfileDescription = ProfileDescription {  // 6
        name: 'Misty',
    };
    pub const Karaku: ProfileDescription = ProfileDescription {  // 7
        name: 'Karaku',
    };
    pub const Kenzu: ProfileDescription = ProfileDescription {  // 8
        name: 'Kenzu',
    };
    pub const Pilgrim: ProfileDescription = ProfileDescription {  // 9
        name: 'Pilgrim',
    };
    pub const Jack: ProfileDescription = ProfileDescription {  // 10
        name: 'Foolish Jack',
    };
    pub const Pops: ProfileDescription = ProfileDescription {  // 11
        name: 'Pops',
    };
    pub const NynJah: ProfileDescription = ProfileDescription {  // 12
        name: 'Nyn Jah',
    };
    pub const Thrak: ProfileDescription = ProfileDescription {  // 13
        name: 'Thrak',
    };
    pub const Bloberto: ProfileDescription = ProfileDescription {  // 14
        name: 'Bloberto',
    };
    pub const Squiddo: ProfileDescription = ProfileDescription {  // 15
        name: 'Squiddo',
    };
    pub const SlenderDuck: ProfileDescription = ProfileDescription {  // 16
        name: 'Slender Duck',
    };
    pub const Breadman: ProfileDescription = ProfileDescription {  // 17
        name: 'Breadman',
    };
    pub const Groggus: ProfileDescription = ProfileDescription {  // 18
        name: 'Groggus',
    };
    pub const Pistolopher: ProfileDescription = ProfileDescription {  // 19
        name: 'Pistolopher',
    };
    pub const Secreto: ProfileDescription = ProfileDescription {  // 20
        name: 'Secreto',
    };
    pub const ShadowMare: ProfileDescription = ProfileDescription {  // 21
        name: 'Shadow Mare',
    };
    pub const Fjolnir: ProfileDescription = ProfileDescription {  // 22
        name: 'Fjolnir',
    };
    pub const ChimpDylan: ProfileDescription = ProfileDescription {  // 23
        name: 'Chimp Dylan',
    };
    pub const Hinata: ProfileDescription = ProfileDescription {  // 24
        name: 'Hinata',
    };
    pub const HelixVex: ProfileDescription = ProfileDescription {  // 25
        name: 'Helix Vex',
    };
    pub const BuccaneerJames: ProfileDescription = ProfileDescription {  // 26
        name: 'Buccaneer James',
    };
    pub const TheSensei: ProfileDescription = ProfileDescription {  // 27
        name: 'The Sensei',
    };
    pub const SenseiTarrence: ProfileDescription = ProfileDescription {  // 28
        name: 'Sensei Tarrence',
    };
    pub const ThePainter: ProfileDescription = ProfileDescription {  // 29
        name: 'The Painter',
    };
    pub const Ashe: ProfileDescription = ProfileDescription {  // 30
        name: 'Ashe',
    };
    pub const SerGogi: ProfileDescription = ProfileDescription {  // 31
        name: 'Ser Gogi',
    };
    pub const TheSurvivor: ProfileDescription = ProfileDescription {  // 32
        name: 'The Survivor',
    };
    pub const TheFrenchman: ProfileDescription = ProfileDescription {  // 33
        name: 'The Frenchman',
    };
    pub const SerFocger: ProfileDescription = ProfileDescription {  // 34
        name: 'Ser FOCGer',
    };
    pub const SillySosij: ProfileDescription = ProfileDescription {  // 35
        name: 'Silly Sosij',
    };
    pub const BloodBeard: ProfileDescription = ProfileDescription {  // 36
        name: 'Blood Beard',
    };
    pub const Fredison: ProfileDescription = ProfileDescription {  // 37
        name: 'Fredison',
    };
    pub const TheBard: ProfileDescription = ProfileDescription {  // 38
        name: 'The Bard',
    };
    pub const Ponzimancer: ProfileDescription = ProfileDescription {  // 39
        name: 'Ponzimancer',
    };
    pub const DealerTani: ProfileDescription = ProfileDescription {  // 40
        name: 'Dealer Tani',
    };
    pub const SerRichard: ProfileDescription = ProfileDescription {  // 41
        name: 'Ser Richard',
    };
    pub const Recipromancer: ProfileDescription = ProfileDescription {  // 42
        name: 'Ser Recipro',
    };
    pub const Mataleone: ProfileDescription = ProfileDescription {  // 43
        name: 'Ser Mata',
    };
    pub const FortunaRegem: ProfileDescription = ProfileDescription {  // 44
        name: 'Master of Veils',
    };
    pub const Amaro: ProfileDescription = ProfileDescription {  // 45
        name: 'Monsieur Bongo',
    };
    pub const Mononoke: ProfileDescription = ProfileDescription {  // 46
        name: 'The Sorceress',
    };
    pub const Parsa: ProfileDescription = ProfileDescription {  // 47
        name: 'The Barbarian',
    };
    pub const Jubilee: ProfileDescription = ProfileDescription {  // 48
        name: 'Magus Jubilee',
    };
    pub const LadyOfCrows: ProfileDescription = ProfileDescription {  // 49
        name: 'Lady of Crows',
    };
    pub const BananaDuke: ProfileDescription = ProfileDescription {  // 50
        name: 'Banana Duke',
    };
    pub const LordGladstone: ProfileDescription = ProfileDescription {  // 51
        name: 'Lord Gladstone',
    };
    pub const LadyStrokes: ProfileDescription = ProfileDescription {  // 52
        name: 'Lady Strokes',
    };
    pub const Bliss: ProfileDescription = ProfileDescription {  // 53
        name: 'Bliss',
    };
    pub const StormMirror: ProfileDescription = ProfileDescription {  // 54
        name: 'Storm Mirror',
    };
    pub const Aldreda: ProfileDescription = ProfileDescription {  // 55
        name: 'Aldreda',
    };
    pub const Petronella: ProfileDescription = ProfileDescription {  // 56
        name: 'Petronella Gigglefern',
    };
    pub const SeraphinaRose: ProfileDescription = ProfileDescription {  // 57
        name: 'Seraphina Rose',
    };
    pub const LucienDeSombrel: ProfileDescription = ProfileDescription {  // 58
        name: 'Lucien De Sombrel',
    };
    pub const FyernVirelock: ProfileDescription = ProfileDescription {  // 59
        name: 'Fyern Virelock',
    };
    pub const Noir: ProfileDescription = ProfileDescription {  // 60
        name: 'Noir',
    };
    pub const QueenAce: ProfileDescription = ProfileDescription {  // 61
        name: 'Queen Ace',
    };
    pub const JoshPeel: ProfileDescription = ProfileDescription {  // 62
        name: 'Josh Peel',
    };
    pub const IronHandRogan: ProfileDescription = ProfileDescription {  // 63
        name: 'Iron Hand Rogan',
    };
}



//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::duelist::{Duelist, DuelistTimestamps};
use pistols::libs::store::{Store, StoreTrait};
use pistols::utils::short_string::{ShortStringTrait};
use pistols::utils::misc::{FeltToLossy};

#[generate_trait]
pub impl ProfileManagerImpl of ProfileManagerTrait {
    fn initialize(ref store: Store, sample: DuelistProfile) {
        let profiles: Span<DuelistProfile> = Self::_get_all_profiles_by_type(sample);
        let mut i: u8 = 0;
        while (i.into() < profiles.len()) {
            let duelist_profile: DuelistProfile = *profiles.at((i).into());
            let timestamp: u64 = starknet::get_block_timestamp();
            store.set_duelist(@Duelist {
                duelist_id: duelist_profile.make_duelist_id(),
                duelist_profile,
                timestamps: DuelistTimestamps {
                    registered: timestamp,
                    active: 0,
                },
                totals: Default::default(),
            });
            i += 1;
        };
    }
    fn randomize_profile(sample: DuelistProfile, seed: felt252) -> DuelistProfile {
        let collection: CollectionDescription = sample.collection();
        let profile_id: u8 = (seed.to_u8_lossy() % collection.profile_count) + 1;
        (match sample {
            DuelistProfile::Undefined =>        DuelistProfile::Undefined,
            DuelistProfile::Character(_) =>     DuelistProfile::Character(profile_id.into()),
            DuelistProfile::Bot(_) =>           DuelistProfile::Bot(profile_id.into()),
            DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(profile_id.into()),
        })
    }

    //----------------------------------
    // Internal / testing
    //
    fn _get_all_profiles_by_type(sample: DuelistProfile) -> Span<DuelistProfile> {
        let mut result: Array<DuelistProfile> = array![];
        let mut i: u8 =     1;
        loop {
            let profile: DuelistProfile = match sample {
                DuelistProfile::Undefined =>        DuelistProfile::Undefined,
                DuelistProfile::Character(_) =>     DuelistProfile::Character(i.into()),
                DuelistProfile::Bot(_) =>           DuelistProfile::Bot(i.into()),
                DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile);
            i += 1;
        };
        (result.span())
    }
    fn _get_all_descriptions_by_type(sample: DuelistProfile) -> Span<ProfileDescription> {
        let mut result: Array<ProfileDescription> = array![];
        let mut i: u8 = 1;
        loop {
            let profile: DuelistProfile = match sample {
                DuelistProfile::Undefined =>        DuelistProfile::Undefined,
                DuelistProfile::Character(_) =>     DuelistProfile::Character(i.into()),
                DuelistProfile::Bot(_) =>           DuelistProfile::Bot(i.into()),
                DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile.description());
            i += 1;
        };
        (result.span())
    }
}

#[generate_trait]
pub impl DuelistProfileImpl of DuelistProfileTrait {
    fn collection(self: @DuelistProfile) -> CollectionDescription {
        (*self).into()
    }
    fn description(self: @DuelistProfile) -> ProfileDescription {
        (match *self {
            DuelistProfile::Undefined =>        CHARACTER_PROFILES::Unknown,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
        })
    }
    fn profile_id(self: @DuelistProfile) -> u8 {
        (match *self {
            DuelistProfile::Undefined =>        0,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
        })
    }
    fn exists(self: @DuelistProfile) -> bool {
        (self.profile_id() != 0)
    }
    fn make_duelist_id(self: @DuelistProfile) -> u128 {
        (match *self {
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            _ => 0,
        })
    }
    fn name(self: @DuelistProfile) -> ByteArray {
        let desc: ProfileDescription = self.description();
        (desc.name.to_string())
    }
    fn get_uri(self: @DuelistProfile,
        base_uri: ByteArray,
    ) -> ByteArray {
        let folder_name: ByteArray = self.collection().folder_name.to_string();
        let profile_id: u8 = self.profile_id();
        let number = if (profile_id < 10) {format!("0{}", profile_id)} else {format!("{}", profile_id)};
        (format!("{}/profiles/{}/{}.jpg", base_uri, folder_name, number))
    }
}


//----------------------------------------
// Descriptions
//
impl DuelistProfileIntoCollectionDescription of core::traits::Into<DuelistProfile, CollectionDescription> {
    fn into(self: DuelistProfile) -> CollectionDescription {
        match self {
            DuelistProfile::Undefined =>        COLLECTIONS::Undefined,
            DuelistProfile::Character(_) =>     COLLECTIONS::Character,
            DuelistProfile::Bot(_) =>           COLLECTIONS::Bot,
            DuelistProfile::Genesis(_) =>       COLLECTIONS::Genesis,
        }
    }
}
impl CharacterKeyIntoDescription of core::traits::Into<CharacterKey, ProfileDescription> {
    fn into(self: CharacterKey) -> ProfileDescription {
        match self {
            CharacterKey::Unknown =>        CHARACTER_PROFILES::Unknown,
            CharacterKey::Bartender =>      CHARACTER_PROFILES::Bartender,
            CharacterKey::Drunkard =>       CHARACTER_PROFILES::Drunkard,
            CharacterKey::Devil =>          CHARACTER_PROFILES::Devil,
            CharacterKey::Player =>         CHARACTER_PROFILES::Player,
        }
    }
}
impl BotKeyIntoDescription of core::traits::Into<BotKey, ProfileDescription> {
    fn into(self: BotKey) -> ProfileDescription {
        match self {
            BotKey::Unknown =>      BOT_PROFILES::Unknown,
            BotKey::TinMan =>       BOT_PROFILES::TinMan,
            BotKey::Scarecrow =>    BOT_PROFILES::Scarecrow,
            BotKey::Leon =>         BOT_PROFILES::Leon,
        }
    }
}
impl GenesisKeyIntoDescription of core::traits::Into<GenesisKey, ProfileDescription> {
    fn into(self: GenesisKey) -> ProfileDescription {
        match self {
            GenesisKey::Unknown =>          GENESIS_PROFILES::Unknown,          // 0
            GenesisKey::SerWalker =>        GENESIS_PROFILES::SerWalker,        // 1
            GenesisKey::LadyVengeance =>    GENESIS_PROFILES::LadyVengeance,    // 2
            GenesisKey::Duke =>             GENESIS_PROFILES::Duke,             // 3
            GenesisKey::Duella =>           GENESIS_PROFILES::Duella,           // 4
            GenesisKey::Jameson =>          GENESIS_PROFILES::Jameson,          // 5
            GenesisKey::Misty =>            GENESIS_PROFILES::Misty,            // 6
            GenesisKey::Karaku =>           GENESIS_PROFILES::Karaku,           // 7
            GenesisKey::Kenzu =>            GENESIS_PROFILES::Kenzu,            // 8
            GenesisKey::Pilgrim =>          GENESIS_PROFILES::Pilgrim,          // 9
            GenesisKey::Jack =>             GENESIS_PROFILES::Jack,             // 10
            GenesisKey::Pops =>             GENESIS_PROFILES::Pops,             // 11
            GenesisKey::NynJah =>           GENESIS_PROFILES::NynJah,           // 12
            GenesisKey::Thrak =>            GENESIS_PROFILES::Thrak,            // 13
            GenesisKey::Bloberto =>         GENESIS_PROFILES::Bloberto,         // 14
            GenesisKey::Squiddo =>          GENESIS_PROFILES::Squiddo,          // 15
            GenesisKey::SlenderDuck =>      GENESIS_PROFILES::SlenderDuck,      // 16
            GenesisKey::Breadman =>         GENESIS_PROFILES::Breadman,         // 17
            GenesisKey::Groggus =>          GENESIS_PROFILES::Groggus,          // 18
            GenesisKey::Pistolopher =>      GENESIS_PROFILES::Pistolopher,      // 19
            GenesisKey::Secreto =>          GENESIS_PROFILES::Secreto,          // 20
            GenesisKey::ShadowMare =>       GENESIS_PROFILES::ShadowMare,       // 21
            GenesisKey::Fjolnir =>          GENESIS_PROFILES::Fjolnir,          // 22
            GenesisKey::ChimpDylan =>       GENESIS_PROFILES::ChimpDylan,       // 23
            GenesisKey::Hinata =>           GENESIS_PROFILES::Hinata,           // 24
            GenesisKey::HelixVex =>         GENESIS_PROFILES::HelixVex,         // 25
            GenesisKey::BuccaneerJames =>   GENESIS_PROFILES::BuccaneerJames,   // 26
            GenesisKey::TheSensei =>        GENESIS_PROFILES::TheSensei,        // 27
            GenesisKey::SenseiTarrence =>   GENESIS_PROFILES::SenseiTarrence,   // 28
            GenesisKey::ThePainter =>       GENESIS_PROFILES::ThePainter,       // 29
            GenesisKey::Ashe =>             GENESIS_PROFILES::Ashe,             // 30
            GenesisKey::SerGogi =>          GENESIS_PROFILES::SerGogi,          // 31
            GenesisKey::TheSurvivor =>      GENESIS_PROFILES::TheSurvivor,      // 32
            GenesisKey::TheFrenchman =>     GENESIS_PROFILES::TheFrenchman,     // 33
            GenesisKey::SerFocger =>        GENESIS_PROFILES::SerFocger,        // 34
            GenesisKey::SillySosij =>       GENESIS_PROFILES::SillySosij,       // 35
            GenesisKey::BloodBeard =>       GENESIS_PROFILES::BloodBeard,       // 36
            GenesisKey::Fredison =>         GENESIS_PROFILES::Fredison,         // 37
            GenesisKey::TheBard =>          GENESIS_PROFILES::TheBard,          // 38
            GenesisKey::Ponzimancer =>      GENESIS_PROFILES::Ponzimancer,      // 39
            GenesisKey::DealerTani =>       GENESIS_PROFILES::DealerTani,       // 40
            GenesisKey::SerRichard =>       GENESIS_PROFILES::SerRichard,       // 41
            GenesisKey::Recipromancer =>    GENESIS_PROFILES::Recipromancer,    // 42
            GenesisKey::Mataleone =>        GENESIS_PROFILES::Mataleone,        // 43
            GenesisKey::FortunaRegem =>     GENESIS_PROFILES::FortunaRegem,     // 44
            GenesisKey::Amaro =>            GENESIS_PROFILES::Amaro,            // 45
            GenesisKey::Mononoke =>         GENESIS_PROFILES::Mononoke,         // 46
            GenesisKey::Parsa =>            GENESIS_PROFILES::Parsa,            // 47
            GenesisKey::Jubilee =>          GENESIS_PROFILES::Jubilee,          // 48
            GenesisKey::LadyOfCrows =>      GENESIS_PROFILES::LadyOfCrows,      // 49
            GenesisKey::BananaDuke =>       GENESIS_PROFILES::BananaDuke,       // 50
            GenesisKey::LordGladstone =>    GENESIS_PROFILES::LordGladstone,    // 51
            GenesisKey::LadyStrokes =>      GENESIS_PROFILES::LadyStrokes,      // 52
            GenesisKey::Bliss =>            GENESIS_PROFILES::Bliss,            // 53
            GenesisKey::StormMirror =>      GENESIS_PROFILES::StormMirror,      // 54
            GenesisKey::Aldreda =>          GENESIS_PROFILES::Aldreda,          // 55
            GenesisKey::Petronella =>       GENESIS_PROFILES::Petronella,       // 56
            GenesisKey::SeraphinaRose =>    GENESIS_PROFILES::SeraphinaRose,    // 57
            GenesisKey::LucienDeSombrel =>  GENESIS_PROFILES::LucienDeSombrel,  // 58
            GenesisKey::FyernVirelock =>    GENESIS_PROFILES::FyernVirelock,    // 59
            GenesisKey::Noir =>             GENESIS_PROFILES::Noir,             // 60
            GenesisKey::QueenAce =>         GENESIS_PROFILES::QueenAce,         // 61
            GenesisKey::JoshPeel =>         GENESIS_PROFILES::JoshPeel,         // 62
            GenesisKey::IronHandRogan =>    GENESIS_PROFILES::IronHandRogan,    // 63
        }
    }
}



//----------------------------------------
// profile_id converters
//
impl CharacterKeyIntoU8 of core::traits::Into<CharacterKey, u8> {
    fn into(self: CharacterKey) -> u8 {
        match self {
            CharacterKey::Unknown =>    0,
            CharacterKey::Bartender =>  1,
            CharacterKey::Drunkard =>   2,
            CharacterKey::Devil =>      3,
            CharacterKey::Player =>     4,
        }
    }
}
impl U8IntoCharacterKey of core::traits::Into<u8, CharacterKey> {
    fn into(self: u8) -> CharacterKey {
        if self == 1        { CharacterKey::Bartender }
        else if self == 2   { CharacterKey::Drunkard }
        else if self == 3   { CharacterKey::Devil }
        else if self == 4   { CharacterKey::Player }
        else                { CharacterKey::Unknown }
    }
}

impl BotKeyIntoU8 of core::traits::Into<BotKey, u8> {
    fn into(self: BotKey) -> u8 {
        match self {
            BotKey::Unknown =>      0,
            BotKey::TinMan =>       1,
            BotKey::Scarecrow =>    2,
            BotKey::Leon =>         3,
        }
    }
}
impl U8IntoBotKey of core::traits::Into<u8, BotKey> {
    fn into(self: u8) -> BotKey {
        if self == 1        { BotKey::TinMan }
        else if self == 2   { BotKey::Scarecrow }
        else if self == 3   { BotKey::Leon }
        else                { BotKey::Unknown }
    }
}

impl GenesisKeyIntoU8 of core::traits::Into<GenesisKey, u8> {
    fn into(self: GenesisKey) -> u8 {
        match self {
            GenesisKey::Unknown =>          0,
            GenesisKey::SerWalker =>        1,
            GenesisKey::LadyVengeance =>    2,
            GenesisKey::Duke =>             3,
            GenesisKey::Duella =>           4,
            GenesisKey::Jameson =>          5,
            GenesisKey::Misty =>            6,
            GenesisKey::Karaku =>           7,
            GenesisKey::Kenzu =>            8,
            GenesisKey::Pilgrim =>          9,
            GenesisKey::Jack =>             10,
            GenesisKey::Pops =>             11,
            GenesisKey::NynJah =>           12,
            GenesisKey::Thrak =>            13,
            GenesisKey::Bloberto =>         14,
            GenesisKey::Squiddo =>          15,
            GenesisKey::SlenderDuck =>      16,
            GenesisKey::Breadman =>         17,
            GenesisKey::Groggus =>          18,
            GenesisKey::Pistolopher =>      19,
            GenesisKey::Secreto =>          20,
            GenesisKey::ShadowMare =>       21,
            GenesisKey::Fjolnir =>          22,
            GenesisKey::ChimpDylan =>       23,
            GenesisKey::Hinata =>           24,
            GenesisKey::HelixVex =>         25,
            GenesisKey::BuccaneerJames =>   26,
            GenesisKey::TheSensei =>        27,
            GenesisKey::SenseiTarrence =>   28,
            GenesisKey::ThePainter =>       29,
            GenesisKey::Ashe =>             30,
            GenesisKey::SerGogi =>          31,
            GenesisKey::TheSurvivor =>      32,
            GenesisKey::TheFrenchman =>     33,
            GenesisKey::SerFocger =>        34,
            GenesisKey::SillySosij =>       35,
            GenesisKey::BloodBeard =>       36,
            GenesisKey::Fredison =>         37,
            GenesisKey::TheBard =>          38,
            GenesisKey::Ponzimancer =>      39,
            GenesisKey::DealerTani =>       40,
            GenesisKey::SerRichard =>       41,
            GenesisKey::Recipromancer =>    42,
            GenesisKey::Mataleone =>        43,
            GenesisKey::FortunaRegem =>     44,
            GenesisKey::Amaro =>            45,
            GenesisKey::Mononoke =>         46,
            GenesisKey::Parsa =>            47,
            GenesisKey::Jubilee =>          48,
            GenesisKey::LadyOfCrows =>      49,
            GenesisKey::BananaDuke =>       50,
            GenesisKey::LordGladstone =>    51,
            GenesisKey::LadyStrokes =>      52,
            GenesisKey::Bliss =>            53,
            GenesisKey::StormMirror =>      54,
            GenesisKey::Aldreda =>          55,
            GenesisKey::Petronella =>       56,
            GenesisKey::SeraphinaRose =>    57,
            GenesisKey::LucienDeSombrel =>  58,
            GenesisKey::FyernVirelock =>    59,
            GenesisKey::Noir =>             60,
            GenesisKey::QueenAce =>         61,
            GenesisKey::JoshPeel =>         62,
            GenesisKey::IronHandRogan =>    63,
        }
    }
}
impl U8IntoGenesisKey of core::traits::Into<u8, GenesisKey> {
    fn into(self: u8) -> GenesisKey {
        if self == 1        { GenesisKey::SerWalker }
        else if self == 2   { GenesisKey::LadyVengeance }
        else if self == 3   { GenesisKey::Duke }
        else if self == 4   { GenesisKey::Duella }
        else if self == 5   { GenesisKey::Jameson }
        else if self == 6   { GenesisKey::Misty }
        else if self == 7   { GenesisKey::Karaku }
        else if self == 8   { GenesisKey::Kenzu }
        else if self == 9   { GenesisKey::Pilgrim }
        else if self == 10  { GenesisKey::Jack }
        else if self == 11  { GenesisKey::Pops }
        else if self == 12  { GenesisKey::NynJah }
        else if self == 13  { GenesisKey::Thrak }
        else if self == 14  { GenesisKey::Bloberto }
        else if self == 15  { GenesisKey::Squiddo }
        else if self == 16  { GenesisKey::SlenderDuck }
        else if self == 17  { GenesisKey::Breadman }
        else if self == 18  { GenesisKey::Groggus }
        else if self == 19  { GenesisKey::Pistolopher }
        else if self == 20  { GenesisKey::Secreto }
        else if self == 21  { GenesisKey::ShadowMare }
        else if self == 22  { GenesisKey::Fjolnir }
        else if self == 23  { GenesisKey::ChimpDylan }
        else if self == 24  { GenesisKey::Hinata }
        else if self == 25  { GenesisKey::HelixVex }
        else if self == 26  { GenesisKey::BuccaneerJames }
        else if self == 27  { GenesisKey::TheSensei }
        else if self == 28  { GenesisKey::SenseiTarrence }
        else if self == 29  { GenesisKey::ThePainter }
        else if self == 30  { GenesisKey::Ashe }
        else if self == 31  { GenesisKey::SerGogi }
        else if self == 32  { GenesisKey::TheSurvivor }
        else if self == 33  { GenesisKey::TheFrenchman }
        else if self == 34  { GenesisKey::SerFocger }
        else if self == 35  { GenesisKey::SillySosij }
        else if self == 36  { GenesisKey::BloodBeard }
        else if self == 37  { GenesisKey::Fredison }
        else if self == 38  { GenesisKey::TheBard }
        else if self == 39  { GenesisKey::Ponzimancer }
        else if self == 40  { GenesisKey::DealerTani }
        else if self == 41  { GenesisKey::SerRichard }
        else if self == 42  { GenesisKey::Recipromancer }
        else if self == 43  { GenesisKey::Mataleone }
        else if self == 44  { GenesisKey::FortunaRegem }
        else if self == 45  { GenesisKey::Amaro }
        else if self == 46  { GenesisKey::Mononoke }
        else if self == 47  { GenesisKey::Parsa }
        else if self == 48  { GenesisKey::Jubilee }
        else if self == 49  { GenesisKey::LadyOfCrows }
        else if self == 50  { GenesisKey::BananaDuke }
        else if self == 51  { GenesisKey::LordGladstone }
        else if self == 52  { GenesisKey::LadyStrokes }
        else if self == 53  { GenesisKey::Bliss }
        else if self == 54  { GenesisKey::StormMirror }
        else if self == 55  { GenesisKey::Aldreda }
        else if self == 56  { GenesisKey::Petronella }
        else if self == 57  { GenesisKey::SeraphinaRose }
        else if self == 58  { GenesisKey::LucienDeSombrel }
        else if self == 59  { GenesisKey::FyernVirelock }
        else if self == 60  { GenesisKey::Noir }
        else if self == 61  { GenesisKey::QueenAce }
        else if self == 62  { GenesisKey::JoshPeel }
        else if self == 63  { GenesisKey::IronHandRogan }
        else                { GenesisKey::Unknown }
    }
}




//----------------------------------------
// Duelist id converters
//
impl CharacterKeyIntoDuelistId of core::traits::Into<CharacterKey, u128> {
    fn into(self: CharacterKey) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Character.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}
impl BotKeyIntoDuelistId of core::traits::Into<BotKey, u128> {
    fn into(self: BotKey) -> u128 {
        let profile_id: u8 = self.into();
        (if (profile_id.is_non_zero())
            {COLLECTIONS::Bot.duelist_id_base + profile_id.into()}
            else {0}
        )
    }
}

impl DuelistIdIntoCharacterKey of core::traits::Into<u128, CharacterKey> {
    fn into(self: u128) -> CharacterKey {
        let id: u128 = self ^ COLLECTIONS::Character.duelist_id_base;
        let id: u8 = if (id < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}
impl DuelistIdIntoBotKey of core::traits::Into<u128, BotKey> {
    fn into(self: u128) -> BotKey {
        let zero: u128 = self ^ COLLECTIONS::Bot.duelist_id_base;
        let id: u8 = if (zero < 0xff) { (self & 0xff).try_into().unwrap() } else { 0 };
        (id.into())
    }
}





//---------------------------
// String converters
//
impl DuelistProfileIntoByteArray of core::traits::Into<DuelistProfile, ByteArray> {
    fn into(self: DuelistProfile) -> ByteArray {
        match self {
            DuelistProfile::Undefined =>        "Undefined",
            DuelistProfile::Character(_) =>     "Character",
            DuelistProfile::Bot(_) =>           "Bot",
            DuelistProfile::Genesis(_) =>       "Genesis",
        }
    }
}
// for println! format! (core::fmt::Display<>) assert! (core::fmt::Debug<>)
pub impl DuelistProfileDisplay of core::fmt::Display<DuelistProfile> {
    fn fmt(self: @DuelistProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result = match self {
            DuelistProfile::Undefined =>        format!("Undefined"),
            DuelistProfile::Character(key) =>   { let id: u8 = (*key).into(); format!("Character::{}({})", self.name(), id) },
            DuelistProfile::Bot(key) =>         { let id: u8 = (*key).into(); format!("Bot::{}({})", self.name(), id) },
            DuelistProfile::Genesis(key) =>     { let id: u8 = (*key).into(); format!("Genesis::{}({})", self.name(), id) },
        };
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl DuelistProfileDebug of core::fmt::Debug<DuelistProfile> {
    fn fmt(self: @DuelistProfile, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result = format!("{}", self);
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl CharacterKeyDebug of core::fmt::Debug<CharacterKey> {
    fn fmt(self: @CharacterKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Character(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl BotKeyDebug of core::fmt::Debug<BotKey> {
    fn fmt(self: @BotKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Bot(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}
pub impl GenesisKeyDebug of core::fmt::Debug<GenesisKey> {
    fn fmt(self: @GenesisKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Genesis(*self).name();
        f.buffer.append(@result);
        Result::Ok(())
    }
}




//----------------------------------------
// Unit  tests
//
#[cfg(test)]
mod unit {

    use super::{
        DuelistProfile, DuelistProfileTrait,
        GenesisKey, CharacterKey, BotKey,
        ProfileDescription,
        ProfileManagerTrait,
        COLLECTIONS,
    };

    #[test]
    fn test_get_all_profiles_by_type() {
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Undefined);
        assert_eq!(profiles.len(), 0, "0");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Character(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Character.profile_count.into(), "racter.profile_");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Bot(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.profile_count");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Genesis(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.profile_count");
    }

    #[test]
    fn test_get_all_descriptions_by_type() {
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Undefined);
        assert_eq!(descriptions.len(), 0, "0");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Character(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Character.profile_count.into(), "Character.profile_count");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Bot(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.profile_count");
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(DuelistProfile::Genesis(0_u8.into()));
        assert_eq!(descriptions.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.profile_count");
    }

    //
    // test profiles
    //
    fn _test_invalid_profile(profile: DuelistProfile) {
        assert_eq!(profile.exists(), false, "(0) ! exists");
        let desc: ProfileDescription = profile.description();
        assert_eq!(desc.name, 'Unknown', "(0) bad name: {}", desc.name);
        assert_eq!(profile.make_duelist_id(), 0, "(0) bad duelist_id");
    }

    #[test]
    fn test_descriptions_genesis() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Genesis(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Genesis(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_eq!(profile.make_duelist_id(), 0, "({}) bad duelist_id", p);
            assert_ne!(profile, DuelistProfile::Genesis(GenesisKey::Unknown), "Duelist({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptions_character() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Character(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Character(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Character(CharacterKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptions_bot() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Bot(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptions: Span<ProfileDescription> = ProfileManagerTrait::_get_all_descriptions_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescription = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptions.len()) {
            let profile: DuelistProfile = DuelistProfile::Bot(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Bot(BotKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad profile_id", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): profile_id", p, p-1);
            let desc: ProfileDescription = *descriptions.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_genesis() {
        assert_eq!(COLLECTIONS::Genesis.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Genesis.profile_count.into()) {
            let key: GenesisKey = p.into();
            assert_eq!(DuelistProfile::Genesis(key).make_duelist_id(), 0, "({}) bad type_id", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_character() {
        assert_gt!(COLLECTIONS::Character.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Character.profile_count.into()) {
            let key: CharacterKey = p.into();
            let expected_id: u128 = (COLLECTIONS::Character.duelist_id_base | key.into());
            assert_gt!(expected_id, COLLECTIONS::Character.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Character(key).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_bot() {
        assert_gt!(COLLECTIONS::Bot.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Bot.profile_count.into()) {
            let key: BotKey = p.into();
            let expected_id: u128 = (COLLECTIONS::Bot.duelist_id_base | key.into());
            assert_gt!(expected_id, COLLECTIONS::Bot.duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Bot(key).make_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_misc() {
        // duelist
        assert_eq!(0_u128.into(), CharacterKey::Unknown, "Character 0");
        assert_eq!(1_u128.into(), CharacterKey::Unknown, "Character 1");
        assert_eq!(1000_u128.into(), CharacterKey::Unknown, "Character 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), CharacterKey::Unknown, "Character 1000");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), CharacterKey::Unknown, "Character CHAR_ID");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), CharacterKey::Unknown, "Character BOT_ID");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + 1).into(), CharacterKey::Unknown, "Character BOT_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + 1).into(), CharacterKey::Unknown, "Character CHAR_ID+1");
        assert_ne!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into()).into(), CharacterKey::Unknown, "Character CHAR_ID+COUNT");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + COLLECTIONS::Character.profile_count.into() + 1).into(), CharacterKey::Unknown, "Character CHAR_ID+COUNT+1");
        // bot
        assert_eq!(0_u128.into(), BotKey::Unknown, "Bot 0");
        assert_eq!(1_u128.into(), BotKey::Unknown, "Bot 1");
        assert_eq!(1000_u128.into(), BotKey::Unknown, "Bot 1000");
        assert_eq!(0x121212121231231231241212_u128.into(), BotKey::Unknown, "Bot 1000");
        assert_eq!(COLLECTIONS::Bot.duelist_id_base.into(), BotKey::Unknown, "Bot BOT_ID");
        assert_eq!(COLLECTIONS::Character.duelist_id_base.into(), BotKey::Unknown, "Bot CHAR_ID");
        assert_eq!((COLLECTIONS::Character.duelist_id_base + 1).into(), BotKey::Unknown, "Bot CHAR_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + 1).into(), BotKey::Unknown, "Bot BOT_ID+1");
        assert_ne!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into()).into(), BotKey::Unknown, "Bot BOT_ID+COUNT");
        assert_eq!((COLLECTIONS::Bot.duelist_id_base + COLLECTIONS::Bot.profile_count.into() + 1).into(), BotKey::Unknown, "Bot BOT_ID+COUNT+1");
    }
}
