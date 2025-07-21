
//--------------------------
// DuelistProfile
//
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum DuelistProfile {
    Undefined,
    Character: CharacterKey,    // Character(id)
    Bot: BotKey,                // Bot(id)
    Genesis: GenesisKey,        // Genesis(id)
    Legends: LegendsKey,        // Legends(id)
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
    GoodPupStarky,          // 64
    ImyaSuspect,            // 65
    TheAlchemist,           // 66
    PonziusPilate,          // 67
    MistressNoodle,         // 68
    MasterOfSecrets,        // 69
}

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum LegendsKey {
    Unknown,
    TGC1,
    // TGC2,
}



//--------------------------
// Collection Descriptors
//
#[derive(Copy, Drop, Serde, Default)]
pub struct CollectionDescriptor {
    pub name: felt252,          // @generateContants:shortstring
    pub folder_name: felt252,   // @generateContants:shortstring
    pub profile_count: u8,      // number of profiles in the collection
    pub is_playable: bool,      // playes can use
    pub duelist_id_base: u128,  // for characters (tutorials) and practice bots
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum DuelistProfile
mod COLLECTIONS {
    use super::{CollectionDescriptor};
    pub const Undefined: CollectionDescriptor = CollectionDescriptor {
        name: 'Undefined',
        folder_name: 'undefined',
        profile_count: 0,
        is_playable: false,
        duelist_id_base: 0,
    };
    pub const Character: CollectionDescriptor = CollectionDescriptor {
        name: 'Tavern Characters',
        folder_name: 'characters',
        profile_count: 4,
        is_playable: false,
        duelist_id_base: 0x100000000,
    };
    pub const Bot: CollectionDescriptor = CollectionDescriptor {
        name: 'Practice bots',
        folder_name: 'bots',
        profile_count: 3,
        is_playable: false,
        duelist_id_base: 0x200000000,
    };
    pub const Genesis: CollectionDescriptor = CollectionDescriptor {
        name: 'Genesis Collection',
        folder_name: 'genesis',
        profile_count: 69,
        is_playable: true,
        duelist_id_base: 0, // playable characters do not convert to duelist_id
    };
    pub const Legends: CollectionDescriptor = CollectionDescriptor {
        name: 'Legends Collection',
        folder_name: 'legends',
        // profile_count: 2,
        profile_count: 1, // disabled TGC2
        is_playable: true,
        duelist_id_base: 0, // playable characters do not convert to duelist_id
    };
}



//--------------------------
// Profile Descriptors
//
#[derive(Copy, Drop, Serde, Default)]
pub struct ProfileDescriptor {
    pub name: felt252, // @generateContants:shortstring
}

// IMPORTANT: names must be in sync with enum CharacterKey
mod CHARACTER_PROFILES {
    use super::{ProfileDescriptor};
    pub const Unknown: ProfileDescriptor = ProfileDescriptor {
        name: 'Unknown',
    };
    pub const Bartender: ProfileDescriptor = ProfileDescriptor {
        name: 'Bartender',
    };
    pub const Drunkard: ProfileDescriptor = ProfileDescriptor {
        name: 'Drunkard',
    };
    pub const Devil: ProfileDescriptor = ProfileDescriptor {
        name: 'Devil',
    };
    pub const Player: ProfileDescriptor = ProfileDescriptor {
        name: 'Stranger',
    };
}

// IMPORTANT: names must be in sync with enum BotKey
mod BOT_PROFILES {
    use super::{ProfileDescriptor};
    pub const Unknown: ProfileDescriptor = ProfileDescriptor {
        name: 'Unknown',
    };
    pub const TinMan: ProfileDescriptor = ProfileDescriptor {
        name: 'Tin Man',
    };
    pub const Scarecrow: ProfileDescriptor = ProfileDescriptor {
        name: 'Scarecrow',
    };
    pub const Leon: ProfileDescriptor = ProfileDescriptor {
        name: 'Leon',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum GenesisKey
mod GENESIS_PROFILES {
    use super::{ProfileDescriptor};
    pub const Unknown: ProfileDescriptor = ProfileDescriptor {
        name: 'Unknown',
    };
    pub const SerWalker: ProfileDescriptor = ProfileDescriptor {  // 1
        name: 'Ser Walker',
    };
    pub const LadyVengeance: ProfileDescriptor = ProfileDescriptor {  // 2
        name: 'Lady Vengeance',
    };
    pub const Duke: ProfileDescriptor = ProfileDescriptor {  // 3
        name: 'Duke',
    };
    pub const Duella: ProfileDescriptor = ProfileDescriptor {  // 4
        name: 'Duella',
    };
    pub const Jameson: ProfileDescriptor = ProfileDescriptor {  // 5
        name: 'Jameson',
    };
    pub const Misty: ProfileDescriptor = ProfileDescriptor {  // 6
        name: 'Misty',
    };
    pub const Karaku: ProfileDescriptor = ProfileDescriptor {  // 7
        name: 'Karaku',
    };
    pub const Kenzu: ProfileDescriptor = ProfileDescriptor {  // 8
        name: 'Kenzu',
    };
    pub const Pilgrim: ProfileDescriptor = ProfileDescriptor {  // 9
        name: 'Pilgrim',
    };
    pub const Jack: ProfileDescriptor = ProfileDescriptor {  // 10
        name: 'Foolish Jack',
    };
    pub const Pops: ProfileDescriptor = ProfileDescriptor {  // 11
        name: 'Pops',
    };
    pub const NynJah: ProfileDescriptor = ProfileDescriptor {  // 12
        name: 'Nyn Jah',
    };
    pub const Thrak: ProfileDescriptor = ProfileDescriptor {  // 13
        name: 'Thrak',
    };
    pub const Bloberto: ProfileDescriptor = ProfileDescriptor {  // 14
        name: 'Bloberto',
    };
    pub const Squiddo: ProfileDescriptor = ProfileDescriptor {  // 15
        name: 'Squiddo',
    };
    pub const SlenderDuck: ProfileDescriptor = ProfileDescriptor {  // 16
        name: 'Slender Duck',
    };
    pub const Breadman: ProfileDescriptor = ProfileDescriptor {  // 17
        name: 'Breadman',
    };
    pub const Groggus: ProfileDescriptor = ProfileDescriptor {  // 18
        name: 'Groggus',
    };
    pub const Pistolopher: ProfileDescriptor = ProfileDescriptor {  // 19
        name: 'Carrot Calc',
    };
    pub const Secreto: ProfileDescriptor = ProfileDescriptor {  // 20
        name: 'Secreto',
    };
    pub const ShadowMare: ProfileDescriptor = ProfileDescriptor {  // 21
        name: 'Shadow Mare',
    };
    pub const Fjolnir: ProfileDescriptor = ProfileDescriptor {  // 22
        name: 'Fjolnir',
    };
    pub const ChimpDylan: ProfileDescriptor = ProfileDescriptor {  // 23
        name: 'Chimp Dylan',
    };
    pub const Hinata: ProfileDescriptor = ProfileDescriptor {  // 24
        name: 'Hinata',
    };
    pub const HelixVex: ProfileDescriptor = ProfileDescriptor {  // 25
        name: 'Helix Vex',
    };
    pub const BuccaneerJames: ProfileDescriptor = ProfileDescriptor {  // 26
        name: 'Buccaneer James',
    };
    pub const TheSensei: ProfileDescriptor = ProfileDescriptor {  // 27
        name: 'The Sensei',
    };
    pub const SenseiTarrence: ProfileDescriptor = ProfileDescriptor {  // 28
        name: 'Sensei Tarrence',
    };
    pub const ThePainter: ProfileDescriptor = ProfileDescriptor {  // 29
        name: 'The Painter',
    };
    pub const Ashe: ProfileDescriptor = ProfileDescriptor {  // 30
        name: 'Ashe',
    };
    pub const SerGogi: ProfileDescriptor = ProfileDescriptor {  // 31
        name: 'Ser Gogi',
    };
    pub const TheSurvivor: ProfileDescriptor = ProfileDescriptor {  // 32
        name: 'The Survivor',
    };
    pub const TheFrenchman: ProfileDescriptor = ProfileDescriptor {  // 33
        name: 'The Frenchman',
    };
    pub const SerFocger: ProfileDescriptor = ProfileDescriptor {  // 34
        name: 'Ser FOCGer',
    };
    pub const SillySosij: ProfileDescriptor = ProfileDescriptor {  // 35
        name: 'Silly Sosij',
    };
    pub const BloodBeard: ProfileDescriptor = ProfileDescriptor {  // 36
        name: 'Blood Beard',
    };
    pub const Fredison: ProfileDescriptor = ProfileDescriptor {  // 37
        name: 'Fredison',
    };
    pub const TheBard: ProfileDescriptor = ProfileDescriptor {  // 38
        name: 'The Bard',
    };
    pub const Ponzimancer: ProfileDescriptor = ProfileDescriptor {  // 39
        name: 'Ponzimancer',
    };
    pub const DealerTani: ProfileDescriptor = ProfileDescriptor {  // 40
        name: 'Dealer Tani',
    };
    pub const SerRichard: ProfileDescriptor = ProfileDescriptor {  // 41
        name: 'Ser Richard',
    };
    pub const Recipromancer: ProfileDescriptor = ProfileDescriptor {  // 42
        name: 'Ser Recipro',
    };
    pub const Mataleone: ProfileDescriptor = ProfileDescriptor {  // 43
        name: 'Ser Mata',
    };
    pub const FortunaRegem: ProfileDescriptor = ProfileDescriptor {  // 44
        name: 'Master of Veils',
    };
    pub const Amaro: ProfileDescriptor = ProfileDescriptor {  // 45
        name: 'Tentaccio',
    };
    pub const Mononoke: ProfileDescriptor = ProfileDescriptor {  // 46
        name: 'The Duchess',
    };
    pub const Parsa: ProfileDescriptor = ProfileDescriptor {  // 47
        name: 'The Barbarian',
    };
    pub const Jubilee: ProfileDescriptor = ProfileDescriptor {  // 48
        name: 'Magus Jubilee',
    };
    pub const LadyOfCrows: ProfileDescriptor = ProfileDescriptor {  // 49
        name: 'Lady of Crows',
    };
    pub const BananaDuke: ProfileDescriptor = ProfileDescriptor {  // 50
        name: 'Banana Duke',
    };
    pub const LordGladstone: ProfileDescriptor = ProfileDescriptor {  // 51
        name: 'Lord Gladstone',
    };
    pub const LadyStrokes: ProfileDescriptor = ProfileDescriptor {  // 52
        name: 'Lady Strokes',
    };
    pub const Bliss: ProfileDescriptor = ProfileDescriptor {  // 53
        name: 'Bliss',
    };
    pub const StormMirror: ProfileDescriptor = ProfileDescriptor {  // 54
        name: 'Javy The Bold',
    };
    pub const Aldreda: ProfileDescriptor = ProfileDescriptor {  // 55
        name: 'Aldreda',
    };
    pub const Petronella: ProfileDescriptor = ProfileDescriptor {  // 56
        name: 'Petronella Gigglefern',
    };
    pub const SeraphinaRose: ProfileDescriptor = ProfileDescriptor {  // 57
        name: 'Seraphina Rose',
    };
    pub const LucienDeSombrel: ProfileDescriptor = ProfileDescriptor {  // 58
        name: 'Lucien De Sombrel',
    };
    pub const FyernVirelock: ProfileDescriptor = ProfileDescriptor {  // 59
        name: 'Fyern Virelock',
    };
    pub const Noir: ProfileDescriptor = ProfileDescriptor {  // 60
        name: 'Noir',
    };
    pub const QueenAce: ProfileDescriptor = ProfileDescriptor {  // 61
        name: 'Queen Ace',
    };
    pub const JoshPeel: ProfileDescriptor = ProfileDescriptor {  // 62
        name: 'Josh Peel',
    };
    pub const IronHandRogan: ProfileDescriptor = ProfileDescriptor {  // 63
        name: 'Iron Hand Rogan',
    };
    pub const GoodPupStarky: ProfileDescriptor = ProfileDescriptor {  // 64
        name: 'Good Pup Starky',
    };
    pub const ImyaSuspect: ProfileDescriptor = ProfileDescriptor {  // 65
        name: 'Imya Suspect',
    };
    pub const TheAlchemist: ProfileDescriptor = ProfileDescriptor {  // 66
        name: 'The Alchemist',
    };
    pub const PonziusPilate: ProfileDescriptor = ProfileDescriptor {  // 67
        name: 'Ponzius Pilate',
    };
    pub const MistressNoodle: ProfileDescriptor = ProfileDescriptor {  // 68
        name: 'Mistress Noodle',
    };
    pub const MasterOfSecrets: ProfileDescriptor = ProfileDescriptor {  // 69
        name: 'Master of Secrets',
    };
}

// to be exported to typescript by generateConstants
// IMPORTANT: names must be in sync with enum GenesisKey
mod LEGENDS_PROFILES {
    use super::{ProfileDescriptor};
    pub const Unknown: ProfileDescriptor = ProfileDescriptor {
        name: 'Unknown',
    };
    pub const TGC1: ProfileDescriptor = ProfileDescriptor { // 1
        name: 'Dread Corsair Rick',
    };
    // pub const TGC2: ProfileDescriptor = ProfileDescriptor { // 1
    //     name: 'King Angre the Crimson',
    // };
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::models::duelist::{Duelist, DuelistTimestamps, Archetype};
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
                duelist_id: duelist_profile.to_duelist_id(),
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
        let collection: CollectionDescriptor = sample.collection();
        let profile_id: u8 = (seed.to_u8_lossy() % collection.profile_count) + 1;
        (match sample {
            DuelistProfile::Undefined =>        DuelistProfile::Undefined,
            DuelistProfile::Character(_) =>     DuelistProfile::Character(profile_id.into()),
            DuelistProfile::Bot(_) =>           DuelistProfile::Bot(profile_id.into()),
            DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(profile_id.into()),
            DuelistProfile::Legends(_) =>       DuelistProfile::Legends(profile_id.into()),
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
                DuelistProfile::Legends(_) =>       DuelistProfile::Legends(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile);
            i += 1;
        };
        (result.span())
    }
    fn _get_all_descriptors_by_type(sample: DuelistProfile) -> Span<ProfileDescriptor> {
        let mut result: Array<ProfileDescriptor> = array![];
        let mut i: u8 = 1;
        loop {
            let profile: DuelistProfile = match sample {
                DuelistProfile::Undefined =>        DuelistProfile::Undefined,
                DuelistProfile::Character(_) =>     DuelistProfile::Character(i.into()),
                DuelistProfile::Bot(_) =>           DuelistProfile::Bot(i.into()),
                DuelistProfile::Genesis(_) =>       DuelistProfile::Genesis(i.into()),
                DuelistProfile::Legends(_) =>       DuelistProfile::Legends(i.into()),
            };
            if (!profile.exists()) {
                break;
            };
            result.append(profile.descriptor());
            i += 1;
        };
        (result.span())
    }
}

#[generate_trait]
pub impl DuelistProfileImpl of DuelistProfileTrait {
    fn collection(self: @DuelistProfile) -> CollectionDescriptor {
        (*self).into()
    }
    fn descriptor(self: @DuelistProfile) -> ProfileDescriptor {
        (match *self {
            DuelistProfile::Undefined =>        CHARACTER_PROFILES::Unknown,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
            DuelistProfile::Legends(key) =>     key.into(),
        })
    }
    fn profile_id(self: @DuelistProfile) -> u8 {
        (match *self {
            DuelistProfile::Undefined =>        0,
            DuelistProfile::Character(key) =>   key.into(),
            DuelistProfile::Bot(key) =>         key.into(),
            DuelistProfile::Genesis(key) =>     key.into(),
            DuelistProfile::Legends(key) =>     key.into(),
        })
    }
    fn exists(self: @DuelistProfile) -> bool {
        (self.profile_id() != 0)
    }
    fn to_duelist_id(self: @DuelistProfile) -> u128 {
        let profile_id: u8 = self.profile_id();
        let collection: CollectionDescriptor = self.collection();
        (if (profile_id.is_non_zero() && collection.duelist_id_base.is_non_zero()) {
            (collection.duelist_id_base | profile_id.into())
        } else {
            (0)
        })
    }
    fn is_playable(self: @DuelistProfile) -> bool {
        let collection: CollectionDescriptor = self.collection();
        (collection.is_playable)
    }
    fn name(self: @DuelistProfile) -> ByteArray {
        let desc: ProfileDescriptor = self.descriptor();
        (desc.name.to_string())
    }
    fn card_name(self: @DuelistProfile) -> ByteArray {
        (match *self {
            DuelistProfile::Undefined =>        "Unknown Card",
            DuelistProfile::Character(_) =>     format!("Character Card: {}", self.name()),
            DuelistProfile::Bot(_) =>           format!("Bot Card: {}", self.name()),
            DuelistProfile::Genesis(_) =>       format!("Genesis Card: {}", self.name()),
            DuelistProfile::Legends(_) =>       format!("Legends Card: {}", self.name()),
        })
    }
    fn get_image_uri(self: @DuelistProfile,
        base_uri: ByteArray,
    ) -> ByteArray {
        let folder_name: ByteArray = self.collection().folder_name.to_string();
        let profile_id: u8 = self.profile_id();
        let number = if (profile_id < 10) {format!("0{}", profile_id)} else {format!("{}", profile_id)};
        (format!("{}/profiles/{}/{}.jpg", base_uri, folder_name, number))
    }
    // archetype for bot_player
    fn get_archetype(self: @DuelistProfile) -> Archetype {
        (match *self {
            DuelistProfile::Bot(key) => {
                (match key {
                    BotKey::Unknown =>      Archetype::Undefined,
                    BotKey::TinMan =>       Archetype::Villainous,
                    BotKey::Scarecrow =>    Archetype::Trickster,
                    BotKey::Leon =>         Archetype::Honourable,
                })
            },
            _ => Archetype::Undefined,
        })
    }
}


//----------------------------------------
// Descriptors
//
impl DuelistProfileIntoCollectionDescriptor of core::traits::Into<DuelistProfile, CollectionDescriptor> {
    fn into(self: DuelistProfile) -> CollectionDescriptor {
        match self {
            DuelistProfile::Undefined =>        COLLECTIONS::Undefined,
            DuelistProfile::Character(_) =>     COLLECTIONS::Character,
            DuelistProfile::Bot(_) =>           COLLECTIONS::Bot,
            DuelistProfile::Genesis(_) =>       COLLECTIONS::Genesis,
            DuelistProfile::Legends(_) =>       COLLECTIONS::Legends,
        }
    }
}
impl CharacterKeyIntoDescriptor of core::traits::Into<CharacterKey, ProfileDescriptor> {
    fn into(self: CharacterKey) -> ProfileDescriptor {
        match self {
            CharacterKey::Unknown =>        CHARACTER_PROFILES::Unknown,
            CharacterKey::Bartender =>      CHARACTER_PROFILES::Bartender,
            CharacterKey::Drunkard =>       CHARACTER_PROFILES::Drunkard,
            CharacterKey::Devil =>          CHARACTER_PROFILES::Devil,
            CharacterKey::Player =>         CHARACTER_PROFILES::Player,
        }
    }
}
impl BotKeyIntoDescriptor of core::traits::Into<BotKey, ProfileDescriptor> {
    fn into(self: BotKey) -> ProfileDescriptor {
        match self {
            BotKey::Unknown =>      BOT_PROFILES::Unknown,
            BotKey::TinMan =>       BOT_PROFILES::TinMan,
            BotKey::Scarecrow =>    BOT_PROFILES::Scarecrow,
            BotKey::Leon =>         BOT_PROFILES::Leon,
        }
    }
}
impl GenesisKeyIntoDescriptor of core::traits::Into<GenesisKey, ProfileDescriptor> {
    fn into(self: GenesisKey) -> ProfileDescriptor {
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
            GenesisKey::GoodPupStarky =>    GENESIS_PROFILES::GoodPupStarky,    // 64
            GenesisKey::ImyaSuspect =>      GENESIS_PROFILES::ImyaSuspect,      // 65
            GenesisKey::TheAlchemist =>     GENESIS_PROFILES::TheAlchemist,     // 66
            GenesisKey::PonziusPilate =>    GENESIS_PROFILES::PonziusPilate,    // 67
            GenesisKey::MistressNoodle =>   GENESIS_PROFILES::MistressNoodle,   // 68
            GenesisKey::MasterOfSecrets =>  GENESIS_PROFILES::MasterOfSecrets,  // 69
        }
    }
}
impl LegendsKeyIntoDescriptor of core::traits::Into<LegendsKey, ProfileDescriptor> {
    fn into(self: LegendsKey) -> ProfileDescriptor {
        match self {
            LegendsKey::Unknown =>          LEGENDS_PROFILES::Unknown,
            LegendsKey::TGC1 =>             LEGENDS_PROFILES::TGC1,             // 1
            // LegendsKey::TGC2 =>             LEGENDS_PROFILES::TGC2,             // 2
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
            GenesisKey::GoodPupStarky =>    64,
            GenesisKey::ImyaSuspect =>      65,
            GenesisKey::TheAlchemist =>     66,
            GenesisKey::PonziusPilate =>    67,
            GenesisKey::MistressNoodle =>   68,
            GenesisKey::MasterOfSecrets =>  69,
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
        else if self == 64  { GenesisKey::GoodPupStarky }
        else if self == 65  { GenesisKey::ImyaSuspect }
        else if self == 66  { GenesisKey::TheAlchemist }
        else if self == 67  { GenesisKey::PonziusPilate }
        else if self == 68  { GenesisKey::MistressNoodle }
        else if self == 69  { GenesisKey::MasterOfSecrets }
        else                { GenesisKey::Unknown }
    }
}
impl LegendsKeyIntoU8 of core::traits::Into<LegendsKey, u8> {
    fn into(self: LegendsKey) -> u8 {
        match self {
            LegendsKey::Unknown =>         0,
            LegendsKey::TGC1 =>            1,
            // LegendsKey::TGC2 =>            2,
        }
    }
}
impl U8IntoLegendsKey of core::traits::Into<u8, LegendsKey> {
    fn into(self: u8) -> LegendsKey {
        if self == 1        { LegendsKey::TGC1 }
        // else if self == 2   { LegendsKey::TGC2 }
        else                { LegendsKey::Unknown }
    }
}




//----------------------------------------
// Duelist id converters (NPCs only)
//
impl CharacterKeyIntoDuelistId of core::traits::Into<CharacterKey, u128> {
    fn into(self: CharacterKey) -> u128 {
        (DuelistProfile::Character(self).to_duelist_id())
    }
}
impl BotKeyIntoDuelistId of core::traits::Into<BotKey, u128> {
    fn into(self: BotKey) -> u128 {
        (DuelistProfile::Bot(self).to_duelist_id())
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
            DuelistProfile::Legends(_) =>       "Legends",
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
            DuelistProfile::Legends(key) =>     { let id: u8 = (*key).into(); format!("Legends::{}({})", self.name(), id) },
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
pub impl LegendsKeyDebug of core::fmt::Debug<LegendsKey> {
    fn fmt(self: @LegendsKey, ref f: core::fmt::Formatter) -> Result<(), core::fmt::Error> {
        let result: ByteArray = DuelistProfile::Legends(*self).name();
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
        GenesisKey, CharacterKey, BotKey, LegendsKey,
        ProfileDescriptor,
        ProfileManagerTrait,
        COLLECTIONS,
    };

    #[test]
    fn test_profile_counts() {
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Undefined);
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(DuelistProfile::Undefined);
        assert_eq!(profiles.len(), 0, "Undefined.profiles");
        assert_eq!(descriptors.len(), 0, "Undefined.descriptors");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Character(0_u8.into()));
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(DuelistProfile::Character(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Character.profile_count.into(), "Character.profiles");
        assert_eq!(descriptors.len(), COLLECTIONS::Character.profile_count.into(), "Character.descriptors");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Bot(0_u8.into()));
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(DuelistProfile::Bot(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.profiles");
        assert_eq!(descriptors.len(), COLLECTIONS::Bot.profile_count.into(), "Bot.descriptors");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Genesis(0_u8.into()));
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(DuelistProfile::Genesis(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.profiles");
        assert_eq!(descriptors.len(), COLLECTIONS::Genesis.profile_count.into(), "Genesis.descriptors");
        let profiles: Span<DuelistProfile> = ProfileManagerTrait::_get_all_profiles_by_type(DuelistProfile::Legends(0_u8.into()));
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(DuelistProfile::Legends(0_u8.into()));
        assert_eq!(profiles.len(), COLLECTIONS::Legends.profile_count.into(), "Legends.profiles");
        assert_eq!(descriptors.len(), COLLECTIONS::Legends.profile_count.into(), "Legends.descriptors");
    }
    
    //
    // test profiles
    //
    fn _test_invalid_profile(profile: DuelistProfile) {
        assert_eq!(profile.exists(), false, "(0) ! exists");
        let desc: ProfileDescriptor = profile.descriptor();
        assert_eq!(desc.name, 'Unknown', "(0) bad name: {}", desc.name);
        assert_eq!(profile.to_duelist_id(), 0, "(0) bad duelist_id");
    }

    #[test]
    fn test_descriptors_character() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Character(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescriptor = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptors.len()) {
            let profile: DuelistProfile = DuelistProfile::Character(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Character(CharacterKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescriptor = *descriptors.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptors_bot() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Bot(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescriptor = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptors.len()) {
            let profile: DuelistProfile = DuelistProfile::Bot(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Bot(BotKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad profile_id", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): profile_id", p, p-1);
            let desc: ProfileDescriptor = *descriptors.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptors_genesis() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Genesis(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescriptor = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptors.len()) {
            let profile: DuelistProfile = DuelistProfile::Genesis(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_eq!(profile.to_duelist_id(), 0, "({}) bad duelist_id", p);
            assert_ne!(profile, DuelistProfile::Genesis(GenesisKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad p", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): p", p, p-1);
            let desc: ProfileDescriptor = *descriptors.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_descriptors_legends() {
        // invalid
        let invalid_profile: DuelistProfile = DuelistProfile::Legends(0_u8.into());
        _test_invalid_profile(invalid_profile);
        // validate profiles
        let descriptors: Span<ProfileDescriptor> = ProfileManagerTrait::_get_all_descriptors_by_type(invalid_profile);
        let mut last_profile_id: u8 = 0;
        let mut last_desc: ProfileDescriptor = Default::default();
        let mut p: u8 = 1;
        while (p.into() <= descriptors.len()) {
            let profile: DuelistProfile = DuelistProfile::Legends(p.into());
            assert!(profile.exists(), "({}) exists", p);
            assert_ne!(profile, DuelistProfile::Legends(LegendsKey::Unknown), "({}) is Unknown", p);
            assert_eq!(p, profile.profile_id(), "({}) bad profile_id", p);
            assert_eq!(p, last_profile_id + 1, "({}) == ({}): profile_id", p, p-1);
            let desc: ProfileDescriptor = *descriptors.at((p-1).into());
            assert_ne!(desc.name, last_desc.name, "({}) == ({}): name {}", p, p-1, desc.name);
            last_profile_id = p;
            last_desc = desc;
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_character() {
        let duelist_id_base: u128 = COLLECTIONS::Character.duelist_id_base;
        assert_gt!(duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Character.profile_count.into()) {
            let key: CharacterKey = p.into();
            let expected_id: u128 = (duelist_id_base | key.into());
            assert_gt!(expected_id, duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Character(key).to_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_bot() {
        let duelist_id_base: u128 = COLLECTIONS::Bot.duelist_id_base;
        assert_gt!(duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Bot.profile_count.into()) {
            let key: BotKey = p.into();
            let expected_id: u128 = (duelist_id_base | key.into());
            assert_gt!(expected_id, duelist_id_base, "({}) low id", p);
            assert_eq!(expected_id, DuelistProfile::Bot(key).to_duelist_id(), "({}) bad type_id", p);
            assert_eq!(expected_id.into(), key, "({}) bad profile", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_genesis() {
        let duelist_id_base: u128 = COLLECTIONS::Genesis.duelist_id_base;
        assert_eq!(duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Genesis.profile_count.into()) {
            let key: GenesisKey = p.into();
            assert_eq!(DuelistProfile::Genesis(key).to_duelist_id(), 0, "({}) bad type_id", p);
            p += 1;
        };
    }

    #[test]
    fn test_profile_duelist_ids_legends() {
        assert_eq!(COLLECTIONS::Legends.duelist_id_base, 0, "bad base id");
        let mut p: u8 = 1;
        while (p <= COLLECTIONS::Legends.profile_count.into()) {
            let key: LegendsKey = p.into();
            assert_eq!(DuelistProfile::Legends(key).to_duelist_id(), 0, "({}) bad type_id", p);
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
